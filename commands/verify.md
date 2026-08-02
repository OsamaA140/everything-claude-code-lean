# /verify — Comprehensive Verification

Run in order; stop and report if build fails:

1. **Build** — run the project build command.
2. **Types** — run the type checker, report errors with file:line.
3. **Lint** — run the linter, report warnings/errors.
4. **Tests** — run full suite, report pass/fail + coverage %.
5. **Secrets/console.log audit** — grep source for hardcoded secrets and `console.log`.
6. **Git status** — uncommitted/modified files since last commit.

```
VERIFICATION: [PASS/FAIL]
Build: OK/FAIL   Types: OK/X errors   Lint: OK/X issues
Tests: X/Y passed, Z% coverage        Secrets: OK/X found   Logs: OK/X
Ready for PR: YES/NO
```

`$ARGUMENTS`: `quick` (build+types only) · `full` (default, all checks) · `pre-commit` · `pre-pr` (adds security scan).
