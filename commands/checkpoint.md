# /checkpoint — Save & Compare Workflow State

`/checkpoint [create|verify|list|clear] <name>`

- **create** — run `/verify quick`, then git stash/commit as `<name>`, log `date | name | SHA` to `.claude/checkpoints.log`.
- **verify** — diff current state vs. the named checkpoint: files changed, test pass-rate delta, coverage delta, build status.
- **list** — show all checkpoints (name, timestamp, SHA, status).
- **clear** — drop old checkpoints, keep the last 5.

Typical flow: create "feature-start" → implement → create "core-done" → test → verify "core-done" → refactor → create "refactor-done" → verify "feature-start" before PR.
