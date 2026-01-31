# Code Thinking MCP Server

An MCP (Model Context Protocol) server that provides thinking frameworks and workflows for LLM code reasoning tasks.

## Overview

This server helps LLMs follow structured thinking workflows when working on code-related tasks. It provides two workflow types:

- **Read-Only Workflow**: For analysis tasks (6 steps)
- **Read-Write Workflow**: For implementation tasks (10 steps)

## Project Structure

```
mcps/code-thinking/
├── prompts/                    # Step prompt files
│   ├── 01-codebase-context.md
│   ├── 02-scope-definition.md
│   ├── 03-technical-clarification.md
│   ├── 04-research-requirements.md
│   ├── 05-project-conventions.md
│   ├── 06-solution-architecture.md
│   ├── 07-implementation-plan.md
│   ├── 08-implementation-execution.md
│   ├── 09-validation.md
│   └── 10-regression-patching.md
├── workflows/                  # Workflow definitions
│   ├── read-only.md
│   └── read-write.md
├── src/code_thinking/         # Python package
│   ├── __init__.py
│   ├── __main__.py
│   ├── server.py
│   ├── session.py
│   └── workflows.py
├── pyproject.toml
└── README.md
```

## Installation

```bash
cd mcps/code-thinking
pip install -e .
```

Or with uv:

```bash
cd mcps/code-thinking
uv pip install -e .
```

## Usage

### Running the Server

```bash
# Using Python module
python -m code_thinking

# Or using the installed command
code-thinking
```

### MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "code-thinking": {
      "command": "python",
      "args": ["-m", "code_thinking"],
      "cwd": "path/to/mcps/code-thinking"
    }
  }
}
```

Or with uv:

```json
{
  "mcpServers": {
    "code-thinking": {
      "command": "uv",
      "args": ["run", "--directory", "path/to/mcps/code-thinking", "code-thinking"]
    }
  }
}
```

## Available Tools

### 1. detect_workflow
Analyzes a user request to determine the appropriate workflow type (read-only or read-write).

**Parameters:**
- user_request: The user request or task description

### 2. start_workflow
Starts a new workflow session and returns the first step prompt.

**Parameters:**
- workflow_type: Either "read-only" or "read-write"
- user_request: The user original request

### 3. complete_step
Completes the current step with output and advances to the next step.

**Parameters:**
- session_id: The session ID
- output: Summary or output from completing the current step
- skip_next_if_optional: If True, skip the next step if it is optional

### 4. skip_optional_step
Skips the current step if it is optional (Step 3 or Step 10).

**Parameters:**
- session_id: The session ID

### 5. get_current_step
Retrieves the prompt for the current step.

**Parameters:**
- session_id: The session ID

### 6. get_session_status
Gets the full status of a session including history.

**Parameters:**
- session_id: The session ID

### 7. restart_workflow
Restarts the workflow from a specific step (for iteration loops).

**Parameters:**
- session_id: The session ID
- from_step: The step number to restart from

### 8. list_all_sessions
Lists all workflow sessions (active and completed).

## Workflow Steps

### Read-Only Workflow (6 steps)
1. Codebase Context
2. Scope Definition
3. Technical Clarification *(optional)*
4. Research Requirements
5. Project Conventions
6. Solution Architecture

### Read-Write Workflow (10 steps)
1. Codebase Context
2. Scope Definition
3. Technical Clarification *(optional)*
4. Research Requirements
5. Project Conventions
6. Solution Architecture
7. Implementation Plan
8. Implementation Execution
9. Validation
10. Regression Patching *(optional)*

## Customizing Prompts

You can customize the prompts by editing the files in the `prompts/` folder. Each prompt file supports the `{{USER_REQUEST}}` placeholder which will be replaced with the actual user request when the prompt is loaded.

## Architecture

- **server.py**: Main FastMCP server with all tool definitions
- **session.py**: Session management with in-memory storage
- **workflows.py**: Workflow definitions and prompt loading

## License

MIT
