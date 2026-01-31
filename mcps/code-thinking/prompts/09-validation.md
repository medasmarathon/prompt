# Step 7: Validation

You are validating: {{USER_REQUEST}}

## Acceptance Criteria
{{ACCEPTANCE_CRITERIA}}

## Modified Files
{{MODIFIED_FILES}}

## Your Task
Verify the implementation meets acceptance criteria AND doesn't break existing functionality.

## Steps

### 1. Check Acceptance Criteria
For each criterion:
- [ ] [Criterion text]
- **Status:** PASS or FAIL
- **Notes:** If FAIL, explain what's missing

### 2. Run Full Test Suite
Execute existing tests to ensure nothing broke:
- Identify test command (e.g., 
pm test, pytest, dotnet test)
- Run the full test suite
- Document results: X/Y tests passed
- If failures: Document which tests failed and why

### 3. Verify Existing Functionality
Check that unrelated features still work:
- Review imports in modified files
- Check that unchanged functions/classes still work
- Verify no regressions in related features
- Spot check 2-3 critical files for integration issues

### 4. Report Results
Write to .opencode/reasoning/07-validation.md:

markdown
# Step 7: Validation

**User Request:** {{USER_REQUEST}}

## Summary
[Overall result: ALL PASS or ISSUES FOUND]

## Acceptance Criteria Results
| Criterion | Status | Notes |
|-----------|--------|-------|
| [text] | ✅ PASS / ❌ FAIL | [notes if fail] |

## Test Suite Results
**Command:** [test command used]
**Result:** X/Y tests passed
**Failures:** [list failed tests if any]

## Existing Functionality Check
- ✅/❌ No broken imports
- ✅/❌ Related features still work
- ✅/❌ No regressions detected

## Overall Result
**Status:** ✅ APPROVED / ❌ NEEDS FIXES
**Ready:** Yes/No


Use AskUserQuestion: "Step 7 COMPLETE. Criteria: [X/Y passed]. Tests: [X/Y passed]. Regressions: [None/Found]. Ready? [Yes/No]"
