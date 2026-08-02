---
name: tdd-workflow
description: Use this skill when writing new features, fixing bugs, or refactoring code. Enforces test-driven development with 80%+ coverage including unit, integration, and E2E tests.
---

# Test-Driven Development Workflow

## When to Activate
New features/endpoints/components, bug fixes, refactors.

## Core Principles
Tests before code, always. Minimum 80% coverage (unit + integration + E2E combined); all edge/error cases included, not just the happy path.

## Cycle
1. Write the test(s) first — they must fail (RED), and fail for the *right* reason.
2. Implement the minimal code to pass (GREEN).
3. Refactor for clarity/dedup while keeping tests green.
4. Verify coverage ≥ 80%.

## Test Types
- **Unit** (Jest/Vitest): isolated functions/components, mock all external calls.
- **Integration**: API endpoints and DB operations against a real or in-memory test DB.
- **E2E** (Playwright): critical multi-step user journeys only — expensive, so use sparingly and keep them stable (see `e2e-runner` agent).

## Mocking
Mock external services (DB client, cache, third-party APIs) at the module boundary so unit/integration tests are deterministic and fast.

## Anti-Patterns
- Testing internal state/implementation instead of observable behavior.
- Brittle selectors/assertions tied to structure rather than semantics.
- Tests that depend on execution order or shared mutable fixtures — each test sets up its own data.

## Coverage
```bash
npm run test -- --coverage
```
Thresholds: branches/functions/lines/statements ≥ 80% (100% for security-critical or financial logic).

## Continuous Testing
Watch mode while developing; run full suite + lint as a pre-commit hook; run with coverage in CI.
