# OpenCode Workflow Bundle

This folder contains a portable agent and skill bundle for an OpenCode-style
multi-agent workflow.

OpenCode's auto-discovery paths are `.opencode/agents/` and `.opencode/skills/`,
so this `opencode/` folder is intentionally kept as a readable, repo-local
bundle that mirrors the same structure and naming conventions.

## Workflow

1. `orchestrator` receives the user request.
2. `planner` turns the request into a high-level plan and coordinates discovery.
3. Discovery subagents gather code, architecture, and setup context in parallel.
4. `critique` reviews the plan against efficiency, conventions, tests, and risk.
5. `orchestrator` aggregates the plan into low-level tasks if implementation is
   needed.
6. `implementer` executes small, isolated tasks in parallel.
7. `orchestrator` asks the user for feedback before closing the loop.

## Shared Artifact Convention

Discovery and synthesis notes should be written under `opencode/context/` so the
planner, critique, and orchestrator can all read the same findings.

