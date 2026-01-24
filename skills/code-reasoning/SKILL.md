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

**Step 3: Execute**
Follow the loaded workflow instructions exactly.

---

## CRITICAL RULE

**MANDATORY:** All agents MUST use AskUserQuestion for:
- Progress reports after each step
- User confirmations
- ANY user interaction

**NEVER return control without using AskUserQuestion.**

---

## Quick Start

1. Identify workflow type using keywords
2. Read appropriate workflow file
3. Execute workflow steps
