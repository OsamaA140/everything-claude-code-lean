# /orchestrate — Sequential Agent Workflows

`/orchestrate <workflow-type> <task-description>`

| Type | Chain |
|---|---|
| feature | planner → tdd-guide → code-reviewer → security-reviewer |
| bugfix | Explore agent → tdd-guide → code-reviewer |
| refactor | architect → code-reviewer → tdd-guide |
| security | security-reviewer → code-reviewer → architect |
| custom `<agents>` | your own comma-separated agent list |

Between agents, pass a short handoff: context summary, findings, files touched, open questions, recommendation for the next agent — keep it tight, only what the next agent needs.

Independent checks (e.g. code-reviewer + security-reviewer + architect) can run in parallel; merge their outputs into one final report with an overall SHIP / NEEDS WORK / BLOCKED recommendation.

Tips: start complex features with `planner`; always run `code-reviewer` before merge; add `security-reviewer` for anything touching auth/payments/PII.
