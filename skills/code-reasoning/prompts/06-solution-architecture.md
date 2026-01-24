# Step 4: Solution Architecture

You are designing architecture for: {{USER_REQUEST}}

## Context
{{PREVIOUS_CONTEXT}}

## Your Task
Design the solution's structure based on the context above.

## Steps

### 1. Component Structure
For each new/modified file, define:
- **What it exports** (functions, classes, types)
- **What it imports** (dependencies)
- **Single responsibility** (one clear purpose)

Example:
- `auth.service.ts` exports: `login()`, `logout()`
- Imports: `api.client`, `user.types`
- Responsibility: Handle authentication

### 2. Interface Contracts
For key functions/methods, define:
- **Function name**
- **Parameters** (name and type)
- **Return type**
- **Purpose** (one sentence)

Example:
- `login(email: string, password: string): Promise<User>`
- Purpose: Authenticate user and return user object

### 3. Error Handling
Define how errors will be handled:
- **Where errors occur** (API calls, validation, file operations, etc.)
- **How to handle** (try/catch, error boundaries, validation checks, etc.)
- **What to return** (error objects, throw exceptions, default values, etc.)

Example:
- API calls: wrap in try/catch, return error object
- Validation: check inputs, throw descriptive error
- File operations: handle ENOENT, return null

## Output
Write your architecture to `.opencode/reasoning/04-solution-architecture.md`.

Use this format:
```markdown
# Step 4: Solution Architecture

## Component Structure
[List each component with exports, imports, responsibility]

## Interface Contracts
[List key functions with signatures and purpose]

## Error Handling
[Describe error handling approach]
```

Use AskUserQuestion to report completion.
