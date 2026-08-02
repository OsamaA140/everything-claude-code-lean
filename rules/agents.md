# Agent Orchestration

| Agent | Use When |
|---|---|
| planner | Complex features, refactoring |
| architect | Architectural decisions |
| tdd-guide | New features, bug fixes |
| code-reviewer | After writing code |
| security-reviewer | Before commits touching auth/data/payments |
| build-error-resolver | Build/type errors |
| e2e-runner | Critical user flows |
| refactor-cleaner | Dead code cleanup |
| doc-updater | Docs/codemaps out of date |

## Use Without Being Asked
Complex feature request → **planner**. Code just written → **code-reviewer**. Bug fix/new feature → **tdd-guide**. Architectural fork in the road → **architect**.

## Parallelize Independent Work
Launch independent checks (e.g. security review + performance review + type check) as parallel Task calls rather than sequentially — only chain agents when one genuinely needs another's output.

## Multi-Perspective Analysis
For high-stakes decisions, split into role-based sub-agents (factual reviewer, senior engineer, security expert, consistency checker) rather than one pass trying to cover everything.
