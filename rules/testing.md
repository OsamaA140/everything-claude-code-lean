# Testing Requirements

Minimum 80% coverage across unit + integration + E2E (Playwright for critical flows).

## TDD (mandatory)
RED (failing test) → GREEN (minimal implementation) → REFACTOR → verify coverage.

## Troubleshooting Failures
Use `tdd-guide`; check test isolation and mocks first; fix the implementation, not the test — unless the test itself is wrong.
