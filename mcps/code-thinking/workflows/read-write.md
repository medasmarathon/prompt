# Read-Write Workflow: Implementation Tasks

This workflow is for **full implementation tasks** requiring code changes.
Use this when the user asks to implement, fix, refactor, or modify code.

## When to Use This Workflow
- Feature implementation
- Bug fixes with code changes
- Refactoring
- Performance optimization
- Test implementation

---

## Workflow Steps

### Step 1: Codebase Context
**Objective:** Establish foundational understanding of the codebase.

Load and follow: prompts/01-codebase-context.md

**User Request:** {{USER_REQUEST}}

---

### Step 2: Scope Definition
**Objective:** Define the boundaries and focus areas of your implementation.

Load and follow: prompts/02-scope-definition.md

**User Request:** {{USER_REQUEST}}

---

### Step 3: Technical Clarification (OPTIONAL)
**Objective:** Resolve ambiguities or unclear aspects of the scope before proceeding.

Load and follow: prompts/03-technical-clarification.md

**User Request:** {{USER_REQUEST}}

**Trigger:** Only execute this step if Step 2 reveals ambiguities, unclear requirements, or aspects needing clarification. Skip if scope is clear.

---

### Step 4: Research Requirements
**Objective:** Gather all necessary information through targeted investigation.

Load and follow: prompts/04-research-requirements.md

**User Request:** {{USER_REQUEST}}

**Note:** For complex research (e.g., external API documentation, framework best practices), spawn a sub-agent using the Task tool with a specific research objective.

---

### Step 5: Project Conventions
**Objective:** Understand project-specific patterns, conventions, and best practices.

Load and follow: prompts/05-project-conventions.md

**User Request:** {{USER_REQUEST}}

---

### Step 6: Solution Architecture
**Objective:** Design the technical solution architecture.

Load and follow: prompts/06-solution-architecture.md

**User Request:** {{USER_REQUEST}}

---

### Step 7: Implementation Plan
**Objective:** Create a detailed, step-by-step implementation plan.

Load and follow: prompts/07-implementation-plan.md

**User Request:** {{USER_REQUEST}}

**Note:** For large implementations, consider spawning sub-agents for independent modules using the Task tool.

---

### Step 8: Implementation Execution
**Objective:** Execute the implementation plan and write code.

Load and follow: prompts/08-implementation-execution.md

**User Request:** {{USER_REQUEST}}

---

### Step 9: Validation
**Objective:** Verify the implementation meets requirements and quality standards.

Load and follow: prompts/09-validation.md

**User Request:** {{USER_REQUEST}}

---

### Step 10: Regression Patching (OPTIONAL)
**Objective:** Address any validation failures or regressions discovered in Step 9.

Load and follow: prompts/10-regression-patching.md

**User Request:** {{USER_REQUEST}}

**Trigger:** Only execute this step if Step 9 validation reveals failures, errors, or regressions that need fixing. Skip if all validations passed.

---

## Completion Loop

After completing Step 9 (or Step 10 if executed), use **AskUserQuestion** to check user satisfaction:

**Summary includes:**
- Changes implemented
- Files modified
- Tests passed
- Any remaining concerns or recommendations

**Question:** "Implementation complete. Are you satisfied with the result, or would you like me to make adjustments?"

### If User is NOT Satisfied:
- Capture their feedback
- Restart from Step 2 (Scope Definition) with the new requirements
- Iterate through all steps again

### If User is Satisfied:
