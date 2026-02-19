# Step 6: Logic Branching Discovery

You are mapping execution paths and cross-feature impact for: {{USER_REQUEST}}

## Context
{{PREVIOUS_CONTEXT}}

## Your Task
Before designing the solution, trace the logic branches in the codebase that intersect with this task. The goal is to surface where the implementation will reach, what it shares with other features, and where unexpected side effects could emerge.

## Steps

### 1. Entry Point Mapping
Identify all entry points relevant to the request:
- **Direct entry points**: functions, endpoints, event handlers, or components that will be directly added or modified
- **Caller chain**: trace upward — what calls these entry points? (e.g., routes → controllers → services → repositories)
- **Trigger paths**: what user actions, scheduled jobs, or system events activate this code path?

Use `read_file`, `file_search`, and `list_dir` to locate and trace these paths.

### 2. Conditional Branch Analysis
Within the affected code paths, map out branching logic:
- **Conditionals**: if/else, switch, ternary, guard clauses — what conditions change behavior?
- **Feature flags / config-driven branches**: are there environment-based or config-based paths?
- **Error branches**: what happens on failure — does it silently swallow, rethrow, or redirect?
- **State-dependent branches**: does behavior differ based on user role, object state, or session context?

For each branch, note: **what triggers it** and **what it produces/modifies**.

### 3. Shared State & Dependency Map
Identify what the affected code shares with the rest of the system:
- **Shared data stores**: database tables, caches, queues, files touched by these paths
- **Shared utilities / helpers**: functions or modules used by both this code and other features
- **Shared types / interfaces**: data models or contracts that multiple features depend on
- **Shared side effects**: emails, notifications, audit logs, external API calls triggered by these paths

For each, note: **which other features also depend on this**.

### 4. Cross-Feature Conflict Identification
For each shared dependency found above, reason about how changes here could impact other features:
- **Read-path conflicts**: if you change a data shape or query, what else reads that data?
- **Write-path conflicts**: if you add/change writes, what else reads or depends on those writes?
- **Contract changes**: if you modify a shared function signature or type, what callers break?
- **Ordering/timing conflicts**: could the change introduce race conditions, ordering assumptions, or caching stale data?
- **Permission / access control side effects**: does a logic change inadvertently bypass or tighten access elsewhere?

Classify each conflict as: **🔴 High Risk** (likely breakage), **🟡 Medium Risk** (needs verification), **🟢 Low Risk** (isolated).

## Output
Write findings to `.opencode/reasoning/06-logic-branching-discovery.md`.

Format:
```markdown
# Step 6: Logic Branching Discovery

## Entry Points
[List entry points with their caller chains and trigger paths]

## Conditional Branches
[Map key branches: condition → behavior, noting state/config dependencies]

## Shared State & Dependencies
| Resource | Type | Also Used By |
|----------|------|--------------|
| [name] | [DB table / utility / type / side-effect] | [other features/modules] |

## Cross-Feature Conflict Analysis
| Risk | Area | Potential Impact | Recommendation |
|------|------|-----------------|----------------|
| 🔴/🟡/🟢 | [feature/module] | [what could break] | [verify / guard / no action] |

## Summary for Next Steps
[2-4 sentences: which areas need the most care during implementation, and what the solution architecture step should account for]
```

Use AskUserQuestion to report completion with a brief summary of how many entry points, branches, and risks were found.
