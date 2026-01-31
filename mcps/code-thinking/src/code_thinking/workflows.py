"""Workflow loading and step management for code-thinking MCP server."""

from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional


class WorkflowType(str, Enum):
    """Types of workflows available."""
    READ_ONLY = "read-only"
    READ_WRITE = "read-write"


@dataclass
class StepInfo:
    """Information about a workflow step."""
    number: int
    name: str
    prompt_file: str
    is_optional: bool = False
    
    @property
    def display_name(self) -> str:
        return f"Step {self.number}: {self.name}"


# Define steps with their properties
WORKFLOW_STEPS = {
    1: StepInfo(1, "Codebase Context", "01-codebase-context.md"),
    2: StepInfo(2, "Scope Definition", "02-scope-definition.md"),
    3: StepInfo(3, "Technical Clarification", "03-technical-clarification.md", is_optional=True),
    4: StepInfo(4, "Research Requirements", "04-research-requirements.md"),
    5: StepInfo(5, "Project Conventions", "05-project-conventions.md"),
    6: StepInfo(6, "Solution Architecture", "06-solution-architecture.md"),
    7: StepInfo(7, "Implementation Plan", "07-implementation-plan.md"),
    8: StepInfo(8, "Implementation Execution", "08-implementation-execution.md"),
    9: StepInfo(9, "Validation", "09-validation.md"),
    10: StepInfo(10, "Regression Patching", "10-regression-patching.md", is_optional=True),
}

# Define which steps belong to which workflow
WORKFLOW_DEFINITIONS = {
    WorkflowType.READ_ONLY: [1, 2, 3, 4, 5, 6],
    WorkflowType.READ_WRITE: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
}


class WorkflowManager:
    """Manages workflow definitions and prompt loading."""
    
    def __init__(self):
        # Use local prompts and workflows folders within the package
        self._base_path = Path(__file__).parent.parent.parent
        self._prompts_path = self._base_path / "prompts"
        self._workflows_path = self._base_path / "workflows"
    
    def get_steps_for_workflow(self, workflow_type: WorkflowType) -> list[StepInfo]:
        """Get the list of steps for a workflow type."""
        step_numbers = WORKFLOW_DEFINITIONS[workflow_type]
        return [WORKFLOW_STEPS[n] for n in step_numbers]
    
    def get_step_info(self, step_number: int) -> Optional[StepInfo]:
        """Get information about a specific step."""
        return WORKFLOW_STEPS.get(step_number)
    
    def load_prompt(self, step_number: int, user_request: str) -> str:
        """Load a prompt file and substitute placeholders."""
        step_info = self.get_step_info(step_number)
        if not step_info:
            raise ValueError(f"Unknown step number: {step_number}")
        
        prompt_file = self._prompts_path / step_info.prompt_file
        if not prompt_file.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_file}")
        
        content = prompt_file.read_text(encoding="utf-8")
        # Substitute the user request placeholder
        content = content.replace("{{USER_REQUEST}}", user_request)
        return content
    
    def load_workflow_description(self, workflow_type: WorkflowType) -> str:
        """Load the workflow description file."""
        workflow_file = self._workflows_path / f"{workflow_type.value}.md"
        if not workflow_file.exists():
            raise FileNotFoundError(f"Workflow file not found: {workflow_file}")
        return workflow_file.read_text(encoding="utf-8")
    
    def is_step_in_workflow(self, step_number: int, workflow_type: WorkflowType) -> bool:
        """Check if a step is part of a workflow."""
        return step_number in WORKFLOW_DEFINITIONS[workflow_type]
    
    def get_next_step(
        self, 
        current_step: int, 
        workflow_type: WorkflowType,
        skip_optional: bool = False
    ) -> Optional[int]:
        """Get the next step number in the workflow.
        
        Args:
            current_step: Current step number
            workflow_type: Type of workflow
            skip_optional: If True, skip optional steps
            
        Returns:
            Next step number, or None if workflow is complete
        """
        steps = WORKFLOW_DEFINITIONS[workflow_type]
        try:
            current_index = steps.index(current_step)
        except ValueError:
            return None
        
        # Find the next step
        for i in range(current_index + 1, len(steps)):
            next_step = steps[i]
            step_info = WORKFLOW_STEPS[next_step]
            if skip_optional and step_info.is_optional:
                continue
            return next_step
        
        return None  # Workflow complete
    
    def get_previous_step(
        self,
        current_step: int,
        workflow_type: WorkflowType
    ) -> Optional[int]:
        """Get the previous step number in the workflow."""
        steps = WORKFLOW_DEFINITIONS[workflow_type]
        try:
            current_index = steps.index(current_step)
        except ValueError:
            return None
        
        if current_index == 0:
            return None
        return steps[current_index - 1]
