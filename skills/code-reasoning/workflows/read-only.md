# Read-Only Workflow: Analysis Tasks

This workflow is for **analysis-only tasks** where no code changes are needed.
Use this when the user asks to analyze, understand, review, or research code.

## When to Use This Workflow
- Code analysis and understanding
- Architecture review
- Bug investigation (without fixing)
- Documentation review
- Codebase exploration

---

## Workflow Steps

### Step 1: Codebase Context
**Objective:** Establish foundational understanding of the codebase.

Load and follow: prompts/01-codebase-context.md

**User Request:** {{USER_REQUEST}}

---

### Step 2: Scope Definition
**Objective:** Define the boundaries and focus areas of your analysis.

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

**Note:** If research requires specialized work (e.g., API documentation review, security analysis), spawn a sub-agent using the Task tool with a focused objective.

---

### Step 5: Project Conventions
**Objective:** Understand project-specific patterns, conventions, and best practices.

Load and follow: prompts/05-project-conventions.md

**User Request:** {{USER_REQUEST}}

---

### Step 6: Logic Branching Discovery
**Objective:** Trace execution paths, conditional branches, and cross-feature dependencies to surface potential conflicts and unexpected behaviors relevant to the task.

Load and follow: prompts/06-logic-branching-discovery.md

**User Request:** {{USER_REQUEST}}

---

### Step 7: Solution Architecture
**Objective:** Design the conceptual solution or provide architectural insights.

Load and follow: prompts/07-solution-architecture.md

**User Request:** {{USER_REQUEST}}

---

## Completion

After completing Step 7, use **AskUserQuestion** (or similar tool to interact with user, if none such, use command line to ask, NEVER end your turn) to present your analysis:

**Summary includes:**
- Key findings from codebase analysis
- Identified patterns and architectural insights
- Logic branches and cross-feature risks discovered
- Recommendations or observations
