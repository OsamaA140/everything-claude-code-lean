---
name: eval-harness
description: Formal evaluation framework for Claude Code sessions, implementing eval-driven development (EDD) — evals as the unit tests of AI-assisted development.
---

# Eval Harness Skill

Eval-Driven Development: define expected behavior before implementation, run evals continuously, track regressions, measure reliability with pass@k.

## Eval Types
- **Capability** — can Claude now do X? List concrete success criteria + expected output.
- **Regression** — does existing behavior still work? Compare against a baseline/checkpoint.

## Graders
- **Code-based** (preferred — deterministic): `grep`/test-runner exit codes, build success.
- **Model-based**: ask Claude to score an open-ended output 1-5 against stated criteria, with reasoning.
- **Human**: flag for manual review when risk is too high to automate (security, irreversible actions).

## Metrics
`pass@k` = at least one success in k attempts (reliability floor, e.g. pass@3 > 90%). `pass^k` = all k trials succeed (use for critical/regression paths, target 100%).

## Workflow
1. **Define** (before coding): capability + regression evals with concrete success criteria → `.claude/evals/<feature>.md`.
2. **Implement.**
3. **Evaluate**: run each eval, record PASS/FAIL.
4. **Report**: pass@k/pass^k, notes, SHIP / NEEDS WORK / BLOCKED recommendation.

Store evals with the code (`.claude/evals/<feature>.md` + `.log` + `baseline.json`) so they version alongside what they test.

## Best Practices
Define evals before writing code. Prefer code graders over model graders where possible. Always human-review security-sensitive changes. Keep evals fast enough that they actually get run.
