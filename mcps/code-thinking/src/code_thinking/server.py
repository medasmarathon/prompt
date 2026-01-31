"""Main FastMCP server for code-thinking."""

from mcp.server.fastmcp import FastMCP

from code_thinking.session import SessionManager, SessionStatus
from code_thinking.workflows import WorkflowType, WorkflowManager, WORKFLOW_STEPS

# Initialize FastMCP server
mcp = FastMCP("code-thinking")

# Global managers (in-memory storage)
session_manager = SessionManager()
workflow_manager = WorkflowManager()


@mcp.tool()
def detect_workflow(user_request: str) -> dict:
    """Analyze a user request to determine the appropriate workflow type.
    
    Use this tool to analyze the user's request and determine whether it requires
    a read-only (analysis) or read-write (implementation) workflow.
    
    Args:
        user_request: The user's request or task description
        
    Returns:
        A dictionary containing:
        - recommended_workflow: The recommended workflow type
        - reasoning: Explanation of why this workflow was chosen
        - workflow_steps: List of steps in the recommended workflow
    """
    # Keywords that suggest read-write workflow
    read_write_keywords = [
        "implement", "create", "build", "fix", "refactor", "modify", 
        "change", "update", "add", "remove", "delete", "write",
        "develop", "code", "make", "edit", "patch", "resolve"
    ]
    
    # Keywords that suggest read-only workflow
    read_only_keywords = [
        "analyze", "review", "understand", "explain", "investigate",
        "explore", "document", "describe", "find", "search", "check",
        "audit", "assess", "evaluate", "examine", "study", "research"
    ]
    
    request_lower = user_request.lower()
    
    # Count keyword matches
    rw_count = sum(1 for kw in read_write_keywords if kw in request_lower)
    ro_count = sum(1 for kw in read_only_keywords if kw in request_lower)
    
    # Determine workflow type
    if rw_count > ro_count:
        workflow_type = WorkflowType.READ_WRITE
        reasoning = f"The request contains implementation-related keywords ({rw_count} matches), suggesting code changes are needed."
    elif ro_count > rw_count:
        workflow_type = WorkflowType.READ_ONLY
        reasoning = f"The request contains analysis-related keywords ({ro_count} matches), suggesting an analysis task."
    else:
        # Default to read-write if unclear (safer to plan for changes)
        workflow_type = WorkflowType.READ_WRITE
        reasoning = "Unable to clearly determine intent. Defaulting to read-write workflow to be thorough."
    
    # Get steps for the workflow
    steps = workflow_manager.get_steps_for_workflow(workflow_type)
    
    return {
        "recommended_workflow": workflow_type.value,
        "reasoning": reasoning,
        "workflow_steps": [
            {
                "step": s.number,
                "name": s.name,
                "optional": s.is_optional
            }
            for s in steps
        ]
    }


@mcp.tool()
def start_workflow(workflow_type: str, user_request: str) -> dict:
    """Start a new workflow session.
    
    Use this tool to begin a thinking workflow for a user's request.
    This creates a session and returns the first step's prompt.
    
    Args:
        workflow_type: Either "read-only" or "read-write"
        user_request: The user's original request or task description
        
    Returns:
        A dictionary containing:
        - session_id: Unique identifier for this session
        - workflow_type: The workflow type being used
        - current_step: Current step number
        - step_name: Name of the current step
        - prompt: The prompt content for the first step
        - is_optional: Whether the current step is optional
    """
    # Validate workflow type
    try:
        wf_type = WorkflowType(workflow_type)
    except ValueError:
        return {
            "error": f"Invalid workflow type: {workflow_type}. Use 'read-only' or 'read-write'."
        }
    
    # Create session
    session = session_manager.create_session(wf_type, user_request)
    
    # Load first prompt
    prompt = workflow_manager.load_prompt(session.current_step, user_request)
    step_info = WORKFLOW_STEPS[session.current_step]
    
    return {
        "session_id": session.session_id,
        "workflow_type": wf_type.value,
        "current_step": session.current_step,
        "step_name": step_info.name,
        "prompt": prompt,
        "is_optional": step_info.is_optional,
        "total_steps": len(workflow_manager.get_steps_for_workflow(wf_type))
    }


@mcp.tool()
def complete_step(
    session_id: str, 
    output: str,
    skip_next_if_optional: bool = False
) -> dict:
    """Complete the current step and get the next step's prompt.
    
    Use this tool after completing the current step to record your output
    and advance to the next step in the workflow.
    
    Args:
        session_id: The session ID from start_workflow
        output: Summary or output from completing the current step
        skip_next_if_optional: If True and the next step is optional, skip it
        
    Returns:
        A dictionary containing:
        - next_step: Next step number (null if workflow complete)
        - step_name: Name of the next step
        - prompt: The prompt content for the next step
        - is_optional: Whether the next step is optional
        - workflow_complete: True if the workflow is finished
    """
    try:
        next_step, prompt = session_manager.complete_step(
            session_id, 
            output,
            skip_next_optional=skip_next_if_optional
        )
    except ValueError as e:
        return {"error": str(e)}
    
    if next_step is None:
        return {
            "next_step": None,
            "step_name": None,
            "prompt": None,
            "is_optional": False,
            "workflow_complete": True,
            "message": "Workflow completed successfully! Review the session history for a summary."
        }
    
    step_info = WORKFLOW_STEPS[next_step]
    return {
        "next_step": next_step,
        "step_name": step_info.name,
        "prompt": prompt,
        "is_optional": step_info.is_optional,
        "workflow_complete": False
    }


@mcp.tool()
def skip_optional_step(session_id: str) -> dict:
    """Skip the current step if it is optional.
    
    Use this tool to skip optional steps (Step 3: Technical Clarification
    or Step 10: Regression Patching) when they are not needed.
    
    Args:
        session_id: The session ID
        
    Returns:
        A dictionary containing the next step information or an error
    """
    try:
        next_step, prompt = session_manager.skip_current_step(session_id)
    except ValueError as e:
        return {"error": str(e)}
    
    if next_step is None:
        return {
            "next_step": None,
            "step_name": None,
            "prompt": None,
            "workflow_complete": True,
            "message": "Workflow completed after skipping optional step."
        }
    
    step_info = WORKFLOW_STEPS[next_step]
    return {
        "next_step": next_step,
        "step_name": step_info.name,
        "prompt": prompt,
        "is_optional": step_info.is_optional,
        "workflow_complete": False,
        "message": "Optional step skipped."
    }


@mcp.tool()
def get_current_step(session_id: str) -> dict:
    """Get the current step's prompt for a session.
    
    Use this tool to retrieve the prompt for the current step,
    useful if you need to re-read the instructions.
    
    Args:
        session_id: The session ID
        
    Returns:
        A dictionary containing the current step information and prompt
    """
    session = session_manager.get_session(session_id)
    if not session:
        return {"error": f"Session not found: {session_id}"}
    
    try:
        prompt = session_manager.get_current_prompt(session_id)
    except (ValueError, FileNotFoundError) as e:
        return {"error": str(e)}
    
    step_info = WORKFLOW_STEPS.get(session.current_step)
    
    return {
        "session_id": session_id,
        "current_step": session.current_step,
        "step_name": step_info.name if step_info else "Unknown",
        "prompt": prompt,
        "is_optional": step_info.is_optional if step_info else False,
        "status": session.status.value
    }


@mcp.tool()
def get_session_status(session_id: str) -> dict:
    """Get the full status of a workflow session.
    
    Use this tool to get detailed information about a session,
    including its history of completed steps.
    
    Args:
        session_id: The session ID
        
    Returns:
        A dictionary containing full session details and history
    """
    session = session_manager.get_session(session_id)
    if not session:
        return {"error": f"Session not found: {session_id}"}
    
    return session.to_dict()


@mcp.tool()
def restart_workflow(session_id: str, from_step: int) -> dict:
    """Restart a workflow from a specific step.
    
    Use this tool when you need to iterate on the workflow,
    such as restarting from Step 2 after user feedback.
    
    Args:
        session_id: The session ID
        from_step: The step number to restart from
        
    Returns:
        A dictionary containing the restart step information and prompt
    """
    try:
        prompt = session_manager.restart_from_step(session_id, from_step)
    except ValueError as e:
        return {"error": str(e)}
    
    step_info = WORKFLOW_STEPS.get(from_step)
    
    return {
        "session_id": session_id,
        "restarted_from": from_step,
        "step_name": step_info.name if step_info else "Unknown",
        "prompt": prompt,
        "is_optional": step_info.is_optional if step_info else False,
        "message": f"Workflow restarted from Step {from_step}"
    }


@mcp.tool()
def list_all_sessions() -> dict:
    """List all workflow sessions.
    
    Use this tool to see all active and completed sessions.
    
    Returns:
        A dictionary containing a list of all sessions
    """
    sessions = session_manager.list_sessions()
    return {
        "total_sessions": len(sessions),
        "sessions": sessions
    }
