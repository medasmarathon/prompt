# Step 1: Codebase Context Analysis

You are analyzing codebase context for: {{USER_REQUEST}}

## Your Task
Find and document relevant code without reading entire files.

## Steps

### 1. Find Relevant Files
Use targeted search to locate files (limit to 10 most relevant). This is an example of how to search for files related to a specific topic or component. Use the best tool available to you for searching files based on their names or content or semantic structure. Focus on finding files that are most likely to contain relevant information for the user's request.:

**By filename:**
- Windows: `Get-ChildItem -Recurse -Filter "*name*" | Select-Object -First 10`
- Linux/Mac: `find . -name "*name*" -type f | head -10`

**By content (class/function names only):**
- Windows: `Select-String -Pattern "^(export |class |function |const )" **/*.ts | Select-Object -First 10`
- Linux/Mac: `grep -rn "^\(export\|class\|function\|const\)" --include="*.ts" | head -10`

### 2. Read Key Definitions Only
For each file, extract ONLY signatures (not bodies):

**Extract definitions:**
- Windows: `Select-String -Path "file.ts" -Pattern "^export|^class|^function|^const.*="`
- Linux/Mac: `grep "^export\|^class\|^function\|^const.*=" file.ts`

Read function signatures, class names, exports - NOT implementation details.

### 3. Document Findings
Write to `.opencode/reasoning/01-codebase-context.md`:
- List of relevant files found (max 10)
- Key functions/classes found (names and signatures only)
- Component purpose ONLY if explicitly clear from naming/comments - do NOT infer or assume

Use AskUserQuestion to report completion with key findings.
