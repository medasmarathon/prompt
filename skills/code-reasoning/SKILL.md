---
name: code-reasoning
description: MANDATORY framework for ALL coding-related questions. LLMs MUST use this skill for any code analysis, implementation, debugging, refactoring, or review. Provides intelligent workflow routing (READ-ONLY for analysis/review, READ-WRITE for implementation/fixes) with 10-step structured reasoning.
user-invocable: true
allowed-tools: Read, Write, Glob, WebSearch, Task, AskUserQuestion
---

# Code Reasoning Skill

## Workflow Routing

This skill routes coding requests to the appropriate workflow:
- **READ-ONLY**: Analysis, explanation, review (steps 1-4 only)
- **READ-WRITE**: Implementation, fixes, refactoring (full steps 1-7)

---

## Detection Keywords

### READ-ONLY Triggers
"analyze", "explain", "review", "describe", "show", "what is", "how does", "architecture of", "understand", "examine", "inspect", "document"

Examples: "Analyze the authentication flow", "Explain how the payment system works"

### READ-WRITE Triggers
"fix", "implement", "add", "create", "refactor", "optimize", "update", "change", "modify", "remove", "delete", "build"

Examples: "Fix the login bug", "Implement JWT authentication", "Add error handling"

---

## Routing Logic

**Step 1: Detect Workflow Type**
Scan user request for trigger keywords. If both types detected, prioritize READ-WRITE.

**Step 2: Load Workflow File**
- READ-ONLY → Read skills/code-reasoning/workflows/read-only.md
- READ-WRITE → Read skills/code-reasoning/workflows/read-write.md

**Step 2.5: User YOLO style confirmation**
Use AskUserQuestion to ask if they want to give their own feedback on ambiguities in workflow routing or steps. 
- If yes, allow them to provide input before proceeding. 
- Else every step will be executed as per workflow instructions without any user feedback until the end of the workflow. If a step needs user input, it will skip and decide the best option on its own. Only at the end of the workflow, it will ask for user feedback on the final output using AskUserQuestion.

**Step 3: Execute**
Follow the loaded workflow instructions exactly.

---

## CRITICAL RULE

**MANDATORY:** All agents (subagents) MUST use AskUserQuestion (or similar tool for interactive feedback) for:
- Progress reports after each step
- ANY user interaction (clarifications, additional info, etc.)

**NEVER return control without using AskUserQuestion.**
**ALWAYS** start subagents for each step in workflow to maintain context clarity. I will be very strict about this. Do not execute steps yourself. Always spawn an executor agent for each step.

---

## Quick Start

1. Identify workflow type using keywords
2. Read appropriate workflow file
3. Execute workflow steps WITH subagents for each step. MUST follow instructions in workflow file exactly.
