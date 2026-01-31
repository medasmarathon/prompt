"""Session management for code-thinking MCP server."""

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional

from code_thinking.workflows import WorkflowType, WorkflowManager, WORKFLOW_STEPS


class SessionStatus(str, Enum):
    """Status of a workflow session."""
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"


@dataclass
class StepRecord:
    """Record of a completed step."""
    step_number: int
    step_name: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    output: Optional[str] = None
    skipped: bool = False


@dataclass
class Session:
    """A workflow session."""
    session_id: str
    workflow_type: WorkflowType
    user_request: str
    current_step: int
    status: SessionStatus
    created_at: datetime
    history: list[StepRecord] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert session to dictionary."""
        return {
            "session_id": self.session_id,
            "workflow_type": self.workflow_type.value,
            "user_request": self.user_request,
            "current_step": self.current_step,
            "current_step_name": WORKFLOW_STEPS[self.current_step].name if self.current_step in WORKFLOW_STEPS else None,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "history": [
                {
                    "step_number": h.step_number,
                    "step_name": h.step_name,
                    "started_at": h.started_at.isoformat(),
                    "completed_at": h.completed_at.isoformat() if h.completed_at else None,
                    "output_preview": h.output[:200] + "..." if h.output and len(h.output) > 200 else h.output,
                    "skipped": h.skipped,
                }
                for h in self.history
            ],
        }


class SessionManager:
    """Manages workflow sessions in memory."""
    
    def __init__(self):
        self._sessions: dict[str, Session] = {}
        self._workflow_manager = WorkflowManager()
    
    def create_session(
        self, 
        workflow_type: WorkflowType, 
        user_request: str
    ) -> Session:
        """Create a new workflow session."""
        session_id = str(uuid.uuid4())[:8]  # Short ID for convenience
        
        # Get the first step for this workflow
        steps = self._workflow_manager.get_steps_for_workflow(workflow_type)
        first_step = steps[0].number
        
        session = Session(
            session_id=session_id,
            workflow_type=workflow_type,
            user_request=user_request,
            current_step=first_step,
            status=SessionStatus.ACTIVE,
            created_at=datetime.now(),
        )
        
        # Record the first step as started
        step_info = WORKFLOW_STEPS[first_step]
        session.history.append(StepRecord(
            step_number=first_step,
            step_name=step_info.name,
            started_at=datetime.now(),
        ))
        
        self._sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID."""
        return self._sessions.get(session_id)
    
    def complete_step(
        self, 
        session_id: str, 
        output: str,
        skip_next_optional: bool = False
    ) -> tuple[Optional[int], Optional[str]]:
        """Complete the current step and advance to the next.
        
        Args:
            session_id: The session ID
            output: Output from completing the current step
            skip_next_optional: If True and next step is optional, skip it
            
        Returns:
            Tuple of (next_step_number, next_step_prompt) or (None, None) if complete
        """
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        if session.status != SessionStatus.ACTIVE:
            raise ValueError(f"Session is not active: {session.status}")
        
        # Complete the current step record
        if session.history:
            current_record = session.history[-1]
            current_record.completed_at = datetime.now()
            current_record.output = output
        
        # Get the next step
        next_step = self._workflow_manager.get_next_step(
            session.current_step,
            session.workflow_type,
            skip_optional=skip_next_optional
        )
        
        if next_step is None:
            # Workflow complete
            session.status = SessionStatus.COMPLETED
            return None, None
        
        # Advance to next step
        session.current_step = next_step
        step_info = WORKFLOW_STEPS[next_step]
        
        # Record the new step as started
        session.history.append(StepRecord(
            step_number=next_step,
            step_name=step_info.name,
            started_at=datetime.now(),
        ))
        
        # Load and return the prompt
        prompt = self._workflow_manager.load_prompt(next_step, session.user_request)
        return next_step, prompt
    
    def skip_current_step(self, session_id: str) -> tuple[Optional[int], Optional[str]]:
        """Skip the current step (if optional) and advance to the next.
        
        Returns:
            Tuple of (next_step_number, next_step_prompt) or (None, None) if complete
        """
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        step_info = WORKFLOW_STEPS.get(session.current_step)
        if not step_info or not step_info.is_optional:
            raise ValueError(f"Current step {session.current_step} is not optional and cannot be skipped")
        
        # Mark as skipped
        if session.history:
            current_record = session.history[-1]
            current_record.completed_at = datetime.now()
            current_record.skipped = True
        
        # Get next step (not skipping optional)
        next_step = self._workflow_manager.get_next_step(
            session.current_step,
            session.workflow_type,
            skip_optional=False
        )
        
        if next_step is None:
            session.status = SessionStatus.COMPLETED
            return None, None
        
        # Advance
        session.current_step = next_step
        new_step_info = WORKFLOW_STEPS[next_step]
        
        session.history.append(StepRecord(
            step_number=next_step,
            step_name=new_step_info.name,
            started_at=datetime.now(),
        ))
        
        prompt = self._workflow_manager.load_prompt(next_step, session.user_request)
        return next_step, prompt
    
    def restart_from_step(
        self, 
        session_id: str, 
        step_number: int
    ) -> str:
        """Restart a session from a specific step.
        
        Returns:
            The prompt for the restart step
        """
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        if not self._workflow_manager.is_step_in_workflow(step_number, session.workflow_type):
            raise ValueError(
                f"Step {step_number} is not part of workflow {session.workflow_type.value}"
            )
        
        # Update session
        session.current_step = step_number
        session.status = SessionStatus.ACTIVE
        
        # Add restart record
        step_info = WORKFLOW_STEPS[step_number]
        session.history.append(StepRecord(
            step_number=step_number,
            step_name=f"{step_info.name} (restart)",
            started_at=datetime.now(),
        ))
        
        return self._workflow_manager.load_prompt(step_number, session.user_request)
    
    def get_current_prompt(self, session_id: str) -> str:
        """Get the prompt for the current step."""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        return self._workflow_manager.load_prompt(
            session.current_step, 
            session.user_request
        )
    
    def list_sessions(self) -> list[dict]:
        """List all sessions."""
        return [s.to_dict() for s in self._sessions.values()]
