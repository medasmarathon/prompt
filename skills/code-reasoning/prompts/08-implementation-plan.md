# Step 8: Implementation Plan

You are planning implementation for: {{USER_REQUEST}}

## Context
{{PREVIOUS_CONTEXT}}

## Your Task
Break work into simple, ordered tasks.

## Steps

### 1. Order the Work
What must be done first?
- Create new files before modifying existing ones
- Create types/interfaces before functions that use them
- Create utilities before components that import them
- Build foundation → core logic → integration → tests

### 2. Break Into Atomic Tasks
**Rule:** One task = One file change

**Good tasks:**
- Create `types/user.ts` with User interface
- Add login() function to `services/auth.ts`
- Update `components/Login.tsx` to use auth.login()

**Bad tasks:**
- Implement authentication (too broad)
- Fix all the bugs (not specific)
- Refactor everything (unclear scope)

### 3. Write the Plan
List tasks in order with these details:
- Task number
- What to do
- Which file
- Why (dependency reason)

**Format:**
```
1. Create `types/auth.ts` - Define User interface (foundation)
2. Create `services/auth.ts` - Add login() skeleton (needs User type)
3. Implement login() in `services/auth.ts` - Add API call logic
4. Update `components/Login.tsx` - Connect to auth service
5. Create `tests/auth.test.ts` - Verify login works
```

Write to `.opencode/reasoning/08-implementation-plan.md`.

Use AskUserQuestion to report completion with task count.

## Output
Write to `.opencode/reasoning/08-implementation-plan.md` using Write tool.