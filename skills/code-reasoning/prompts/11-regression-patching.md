# Step 11: Regression Patching Scope Analysis (Optional)

**TRIGGER:** Runs ONLY if Step 10 (Validation) found FAILED criteria or test failures.

You are analyzing regression scope for: {{USER_REQUEST}}

## Validation Results
{{VALIDATION_RESULTS}}

## Your Task
Determine if issues are minor patches or major regression requiring workflow restart.

## Steps

### 1. Categorize Issues
For each failed criterion/test, classify as:
- **Minor:** Simple bug, typo, edge case, isolated logic error, single-function fix
- **Major:** Wrong approach, architectural flaw, broken core functionality, widespread failures

Document: Minor [count], Major [count]

### 2. Decision

**MINOR Path (≤2 major issues, no design flaws):**
- List specific fixes with file paths
- Apply targeted patches immediately
- Return to Step 10 after fixes

**MAJOR Path (>2 major OR architectural flaw):**
- Current approach fundamentally flawed
- Proceed to Step 3 for restart preparation

### 3. Prepare Restart (MAJOR only)

Write `.opencode/reasoning/11-regression-patching.md`:

```markdown
# Regression Analysis - Restart Required

## Original Request
{{USER_REQUEST}}

## Implementation Summary
- Approach: [what was built]
- Files: [list modified files]
- Core design: [key decision made]

## What Failed
- Criteria: [failed items]
- Tests: [key failures]
- Root cause: [design flaw]

## Next Iteration Requirements
- Avoid: [what didn't work]
- Try: [alternative approach]
- Prioritize: [key considerations]
```

**AskUserQuestion:** "MAJOR regression found. Analysis saved. Return to Step 1 with combined context? (YES=restart / NO=attempt patches)"

---

**Output:** Decision (PATCH or RESTART) + context file if MAJOR
