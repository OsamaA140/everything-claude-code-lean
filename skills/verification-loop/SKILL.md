# Verification Loop Skill

Comprehensive verification for Claude Code sessions — use after a feature/refactor, before a PR, or whenever you want a quality gate.

## Phases
1. **Build** — `npm run build`; stop and fix if it fails.
2. **Types** — `npx tsc --noEmit` (or `pyright .`); fix critical errors.
3. **Lint** — `npm run lint` / `ruff check .`.
4. **Tests** — run with coverage; report pass/fail counts and % (target 80%+).
5. **Security scan** — grep for secrets/`console.log` in changed files.
6. **Diff review** — `git diff --stat`; check changed files for unintended edits, missing error handling, edge cases.

## Report
```
VERIFICATION: PASS/FAIL
Build: OK/FAIL  Types: OK/X  Lint: OK/X  Tests: X/Y (Z% cov)  Security: OK/X  Diff: N files
Ready for PR: YES/NO
```

For long sessions, treat this as a periodic checkpoint (after each function/component, or every ~15 min) rather than only at the very end — hooks catch issues immediately, this skill catches what they miss.
