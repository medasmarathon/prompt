# Step 3.5: Project Conventions Analysis

You are analyzing project conventions for: {{USER_REQUEST}}

## Context
{{PREVIOUS_CONTEXT}}

## Your Task
Identify project conventions to follow in implementation and offload architectural decisions.

## Steps

### 1. Code & File Structure Analysis
Analyze how the project organizes and names files:
- **File naming**: kebab-case, camelCase, PascalCase, snake_case patterns
- **File structure**: feature-based, layer-based, domain-driven, monorepo, colocation
- **Index files**: barrel exports, re-export patterns
- **Formatting configs**: .prettierrc, .editorconfig, pyproject.toml, etc.
- **Linting configs**: .eslintrc*, .pylintrc, 
uff.toml, etc.

Use `list_dir` to analyze existing file patterns. Use `find_file` to locate config files.

### 2. Environment & Tooling Discovery
Identify ALL project tooling (examples include but not limited to):
- **Package managers**: npm, yarn, pnpm, pip, poetry, pipenv, maven, gradle, cargo, etc.
- **Build tools**: webpack, vite, rollup, esbuild, parcel, tsc, etc.
- **Test frameworks**: jest, vitest, pytest, mocha, etc.
- **Formatters**: prettier, black, gofmt, rustfmt, etc.
- **Linters**: eslint, pylint, flake8, ruff, clippy, etc.

Check `package.json`, `pyproject.toml`, `Makefile`, etc. for scripts and dependencies.

### 3. CI/CD & Deployment Patterns (if relevant)
If user request affects deployment, testing, or workflows:
- **CI/CD files**: .github/workflows/, .gitlab-ci.yml, etc.
- **Pre-commit hooks**: .husky/, .pre-commit-config.yaml
- **Deployment targets**: Vercel, Netlify, AWS, Docker, etc.
- **Test requirements**: Coverage thresholds, required checks

Only investigate if changes impact these areas.

## Output
Write findings to `.opencode/reasoning/05-project-conventions.md`.

Format:
```markdown
# Step 3.5: Project Conventions

## File Structure & Naming
[Patterns: naming convention, organization logic, index usage]

## Tooling Stack
[List: package manager, build tool, test framework, linters, formatters with versions]

## CI/CD & Deployment
[Relevant workflows, deployment targets, or "N/A"]
```
