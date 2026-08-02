---
description: Generate and run end-to-end tests with Playwright. Creates test journeys, runs tests, captures screenshots/videos/traces, and uploads artifacts.
---

# /e2e

Invokes the **e2e-runner** agent.

1. Identify the user-flow to test; generate a Playwright test using the Page Object Model.
2. Run across browsers; capture screenshot/video/trace on failure only.
3. Report pass/fail/flaky counts and link artifacts (HTML report, traces).
4. Flag any test failing intermittently for quarantine (`test.fixme`) rather than deleting it.

Use for: critical journeys (auth, checkout/trading, multi-step flows) — not for exhaustive edge cases, which belong in unit tests via `/tdd`.

**Never run financial/destructive flows against production** — gate with `test.skip(process.env.NODE_ENV === 'production')` and use test accounts only.

```bash
npx playwright test              # run all
npx playwright test --headed --debug
npx playwright show-report
```
