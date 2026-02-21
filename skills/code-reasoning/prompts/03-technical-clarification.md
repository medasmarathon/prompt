# Step 3: Technical Clarification (Optional)

**TRIGGER:** Run this step ONLY if Step 2 found ambiguities about WHERE or HOW MUCH to change.

You are clarifying technical scope for: {{USER_REQUEST}}

## Scope Analysis
{{SCOPE_ANALYSIS}}

## Your Task
Ask user to clarify ambiguous locations and scope breadth ONLY. Do NOT ask about implementation approach or decisions.

## Steps

### 1. Identify Ambiguities
Review scope analysis for TWO types:

**Type A: Location (WHERE)** - Multiple files/components could work
Examples: "Auth in `auth.ts` OR `user.ts`?" / "New file OR existing?"

**Type B: Scope/Breadth (HOW MUCH)** - Unclear which areas or depth
Examples:
- "Optimize performance" → Frontend? Backend? Database? All?
- "Add tests" → Unit? Integration? E2E? All?
- "Refactor code" → One module? Feature? Codebase?
- "Improve errors" → API? UI? Database? All?

DO NOT ask: Implementation approach or technical patterns (that's architecture)

### 2. Formulate Questions
For each ambiguity:
- Type A: "Which file for X: A or B?"
- Type B: "Which areas: Frontend, Backend, Database, or All?"

Keep factual and specific.

### 3. Document Clarifications
Use AskUserQuestion to ask all questions. Record answers for next steps.

**Fallback:** If AskUserQuestion tool unavailable, create summary file with questions. User will fill in responses for later steps.

## Output
Write to .opencode/reasoning/03-technical-clarification.md using Write tool.
