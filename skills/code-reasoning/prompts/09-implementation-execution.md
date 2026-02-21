# Step 9: Implementation Execution

You are implementing: {{USER_REQUEST}}

## Implementation Plan
{{IMPLEMENTATION_PLAN}}

## Other Context
{{PREVIOUS_CONTEXT}}

## Your Task
Execute each task in the implementation plan, one at a time.

## Pattern: ONE Task at a Time

For EACH task in the plan, follow these 3 steps:

### 1. Read Current State
If modifying existing file:
- Read the file with Read tool
- Understand current code

If creating new file:
- Verify parent directory exists

### 2. Make the Change
- Write the new/modified code
- Use Write tool to save complete file
- Follow the architecture from Step 7
- Match existing code style

### 3. Verify and Continue
- Re-read file to confirm change saved
- Check for syntax errors
- Move to next task in plan

**IMPORTANT:** Complete one task fully (steps 1-3) before starting next task.

## After All Tasks Complete
- Use AskUserQuestion to report completion
- List all files created/modified
- Confirm all tasks from plan are done

## Output
Write to `.opencode/reasoning/09-implementation-execution.md` using Write tool.