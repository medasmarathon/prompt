---
name: multi-agent-workflow
description: Shared orchestration rules for discovery, planning, critique, implementation, and user handoff
compatibility: opencode
metadata:
  artifact_root: opencode/context
  scope: multi-agent-coding
---

## What This Skill Does

Use this skill when a request needs the full orchestration pipeline:

1. Orchestrator routes the request.
2. Planner synthesizes a high-level plan.
3. Discovery subagents collect code, architecture, and setup context in parallel.
4. Critique evaluates the plan for quality and risk.
5. Orchestrator optionally breaks work into atomic implementation tasks.
6. Implementers execute one task each.
7. Orchestrator asks the user for feedback.

## Shared Artifact Contract

- Discovery notes:
  - `opencode/context/discovery/codebase.md`
  - `opencode/context/discovery/architecture.md`
  - `opencode/context/discovery/setup.md`
- Planner output:
  - `opencode/context/plan.md`
- Critique output:
  - `opencode/context/critique.md`
- Low-level design:
  - `opencode/context/low-level-design.md`
- Implementation task notes:
  - `opencode/context/implementation/<task-name>.md`

Keep each artifact short, evidence-based, and easy to scan.

## Discovery Rules

- Prefer parallel discovery when the request is ambiguous or touches multiple
  parts of the codebase.
- Discovery subagents should stay read-only unless setup inspection requires
  shell access.
- Findings should include file paths, patterns, conventions, and anything that
  could cause a clash with existing behavior.

## Planner Rules

- Read all discovery artifacts before drafting a plan.
- Produce a high-level plan only.
- Record assumptions, open questions, and the smallest reasonable next step.
- Do not assign implementation slices unless the request is ready for build work.

## Critique Rules

Review the plan and discovery findings for:

- Efficiency and performance
- SOLID, KISS, YAGNI, and DRY alignment
- Current project practices and conventions
- Potential clashes with existing features
- Test coverage, prioritizing end-to-end and then integration
- Security concerns

Flag concrete risks, not vague preferences.

## Implementation Rules

- Each implementer should receive one atomic task.
- Tasks should be small enough to complete independently.
- Implementers should report the files changed, tests run, and any remaining
  follow-up work.

## User Feedback

The orchestrator should always close the loop by asking the user whether the
plan or implementation should be adjusted before considering the task done.

