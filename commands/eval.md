# /eval — Eval-Driven Development

`/eval [define|check|report|list] <feature-name>`

- **define** — create `.claude/evals/<name>.md`: list capability evals (new behavior) and regression evals (nothing breaks), plus success criteria (e.g. pass@3 > 90%, pass^3 = 100% for regressions).
- **check** — run each eval, record PASS/FAIL to `.claude/evals/<name>.log`, print a short status (capability X/Y, regression X/Y).
- **report** — generate a full report: per-eval results, pass@k / pass^k metrics, notes, and a SHIP / NEEDS WORK / BLOCKED recommendation.
- **list** — show all eval definitions with current pass ratio and status.
- **clean** — remove old logs, keep last 10 runs.
