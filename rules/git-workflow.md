# Git Workflow

## Commits
`<type>: <description>` — types: feat, fix, refactor, docs, test, chore, perf, ci.

## Pull Requests
Diff against the full base branch (`git diff base...HEAD`), not just the latest commit. Write a full summary + test plan. Push new branches with `-u`.

## Feature Flow
1. **Plan** — `planner` agent: dependencies, risks, phases.
2. **TDD** — `tdd-guide`: RED → GREEN → REFACTOR, verify 80%+ coverage.
3. **Review** — `code-reviewer` immediately after writing code; fix CRITICAL/HIGH before continuing.
4. **Commit** — clear, conventional-commit messages.
