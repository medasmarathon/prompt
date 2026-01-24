---
name: code-reasoning
description: Comprehensive reasoning framework for analyzing and implementing any coding task. This skill MUST be used for EVERY coding-related user request. It provides a structured 7-step workflow using subagents to ensure thorough analysis, research, planning, implementation, and validation.
user-invocable: true
allowed-tools: Read, Write, Glob, WebSearch, Task, AskUserQuestion
---

# Code Reasoning Skill

## CRITICAL: Universal Trigger Rule

**This skill MUST be activated for EVERY coding-related user request.** This includes but is not limited to:
- Bug fixes
- Feature requests
- Code refactoring
- Architecture changes
- New file/component creation
- Code reviews
- Performance optimization
- Security improvements
- Test creation
- Documentation updates
- Any question about existing code

**NO EXCEPTIONS.** If the user asks anything related to code, this skill is the default reasoning framework.

---

## Core Workflow Overview

This skill implements a **7-step sequential subagent workflow**. Each step spawns a dedicated subagent that:
1. Performs specific analysis/work
2. Writes findings to a designated file in `.opencode/reasoning/`
3. Uses `AskUserQuestion` to report progress
4. Hands off context to the next step

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Codebase Context Analysis                          │
│  Prompt: prompts/01-codebase-context.md                     │
│  Output: .opencode/reasoning/01-codebase-context.md         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Scope Definition                                   │
│  Prompt: prompts/02-scope-definition.md                     │
│  Output: .opencode/reasoning/02-scope-definition.md         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Research Requirements                              │
│  Prompt: prompts/03-research-requirements.md                │
│  Output: .opencode/reasoning/03-research-requirements.md    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Solution Architecture                              │
│  Prompt: prompts/04-solution-architecture.md                │
│  Output: .opencode/reasoning/04-solution-architecture.md    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Implementation Plan                                │
│  Prompt: prompts/05-implementation-plan.md                  │
│  Output: .opencode/reasoning/05-implementation-plan.md      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Implementation Execution                           │
│  Prompt: prompts/06-implementation-execution.md             │
│  Output: (writes actual code to project files)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 7: Validation                                         │
│  Prompt: prompts/07-validation.md                           │
│  Output: .opencode/reasoning/07-validation.md               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  COMPLETION LOOP: Ask user if satisfied                     │
│  If NOT satisfied → Restart from Step 1                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Prompt Files

Each step has a dedicated prompt file in the `prompts/` directory:

| Step | Prompt File | Purpose |
|------|-------------|---------|
| 1 | `prompts/01-codebase-context.md` | Analyze existing codebase |
| 2 | `prompts/02-scope-definition.md` | Define scope and acceptance criteria |
| 3 | `prompts/03-research-requirements.md` | Research documentation and best practices |
| 4 | `prompts/04-solution-architecture.md` | Design the solution architecture |
| 5 | `prompts/05-implementation-plan.md` | Create atomic implementation tasks |
| 6 | `prompts/06-implementation-execution.md` | Execute the implementation |
| 7 | `prompts/07-validation.md` | Validate against acceptance criteria |

### Using Prompt Files

When spawning a subagent with `Task` tool:
1. Read the corresponding prompt file using `Read` tool
2. Replace `{{USER_REQUEST}}` placeholder with the actual user request
3. Pass the complete prompt to the subagent

---

## CRITICAL RULES

### Rule 1: Question Tool Usage (MANDATORY)
- **EVERY subagent MUST use `AskUserQuestion`** to report progress before completing
- **Main agent MUST use `AskUserQuestion`** to ask for user requests
- **NEVER return control to user without using `AskUserQuestion`**
- **Always keep the conversation going via questions**

### Rule 2: Completion Loop (MANDATORY)
After all 7 steps complete:
1. Use `AskUserQuestion` to ask: "All steps complete. Are you satisfied with the result? (Reply 'good', 'ok', 'done', or 'yes' to confirm, or describe what needs to change)"
2. If user responds with **"good"**, **"ok"**, **"done"**, or **"yes"** → Task is complete
3. If user responds with **ANYTHING ELSE** → Treat as NEW task input and restart from Step 1
4. This loop continues **indefinitely** until user explicitly confirms satisfaction

### Rule 3: File Output Format
Every reasoning file MUST include:
```markdown
# [Step Name]

**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**User Request:** [Original request being addressed]

## Summary
[2-3 sentence summary of findings]

## Detailed Analysis
[Comprehensive analysis content]

## Key Findings
- [Finding 1]
- [Finding 2]
- [...]

## Next Steps
[What the next subagent should focus on based on these findings]
```

---

## Main Agent Instructions

When a user makes ANY coding-related request, you MUST:

1. **Acknowledge the request** and explain you will use the code-reasoning workflow
2. **Create the reasoning directory** if it doesn't exist: `.opencode/reasoning/`
3. **Execute Steps 1-7 sequentially** by:
   - Reading the prompt file for each step
   - Replacing `{{USER_REQUEST}}` with the actual request
   - Spawning subagent using `Task` tool with the prepared prompt
4. **Wait for each subagent to complete** before spawning the next
5. **Read each output file** to pass context to the next subagent
6. **Enter the completion loop** after Step 7
7. **NEVER end without using `AskUserQuestion`**

### Starting the Workflow

```
Use AskUserQuestion to confirm: "I'll analyze your request using the code-reasoning framework. This involves 7 steps: context analysis, scope definition, research, architecture design, planning, implementation, and validation. Starting Step 1 now..."
```

### Spawning a Subagent

For each step:
```
1. Read prompt: Read("skills/code-reasoning/prompts/0X-step-name.md")
2. Prepare prompt: Replace {{USER_REQUEST}} with actual request
3. Spawn subagent: Task(prepared_prompt)
4. Wait for completion
5. Read output: Read(".opencode/reasoning/0X-step-name.md")
6. Proceed to next step
```

---

## Completion Loop Handler

After Step 7 completes, the MAIN AGENT must:

### If Validation Found Issues
1. Ask user: "Validation found issues. Would you like me to fix them?"
2. If yes: Restart from Step 6 with the fixes
3. If no: Ask what they'd like to do

### If Validation Passed
Use `AskUserQuestion`:
```
"All 7 steps complete! Implementation summary:
- Context analyzed: [key findings]
- Scope defined: [X] files affected
- Research completed: [key findings]
- Architecture designed: [approach]
- Plan created: [X] tasks
- Implementation done: [files created/modified]
- Validation passed: [X]/[X] criteria met

Are you satisfied with the result?
- Reply 'good', 'ok', 'done', or 'yes' to complete
- Or describe what needs to change to continue"
```

### Loop Logic
```
LOOP:
  response = AskUserQuestion(completion message)
  
  IF response IN ['good', 'ok', 'done', 'yes', 'looks good', 'perfect', 'great']:
    EXIT LOOP - Task complete
  ELSE:
    # User provided feedback - treat as new/modified request
    new_request = original_request + " Additional requirements: " + response
    RESTART from Step 1 with new_request
```

**This loop continues INDEFINITELY until user explicitly confirms satisfaction.**

---

## Directory Setup

Before starting Step 1, ensure the reasoning directory exists:

```
# Create reasoning directory if it doesn't exist
Use Write tool to create .opencode/reasoning/.gitkeep with empty content
```

This ensures all subagents can write their output files.

---

## Error Handling

### If a Subagent Fails
1. Document the failure
2. Use `AskUserQuestion` to inform user
3. Ask if they want to retry or skip
4. Do NOT proceed blindly

### If File Write Fails
1. Retry once
2. If still fails, use `AskUserQuestion` for help
3. Never assume it worked without verification

### If Research Finds Nothing
1. Document that no relevant information was found
2. Proceed with best effort based on existing knowledge
3. Flag this as a risk in architecture step

---

## Summary

This skill ensures EVERY coding request receives:
1. **Thorough analysis** before any code is written
2. **Research-backed decisions** using external documentation
3. **Thoughtful architecture** considering edge cases
4. **Clear planning** with atomic, testable tasks
5. **Careful implementation** following the plan
6. **Rigorous validation** against acceptance criteria
7. **User satisfaction loop** ensuring the result meets needs

**NEVER skip steps. ALWAYS use AskUserQuestion. ALWAYS loop until user confirms satisfaction.**
