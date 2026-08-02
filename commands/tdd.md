---
description: Enforce test-driven development workflow. Scaffold interfaces, generate tests FIRST, then implement minimal code to pass. Ensure 80%+ coverage.
---

# /tdd

Invokes the **tdd-guide** agent. RED → GREEN → REFACTOR, never skip RED.

1. Scaffold interfaces/types for the feature.
2. Write failing tests first; run and confirm they fail for the right reason.
3. Implement the minimal code to pass; run and confirm green.
4. Refactor while keeping tests green; verify 80%+ coverage.

Use for: new features, new functions/components, bug fixes (write a reproducing test first), refactors, critical business logic.

Workflow position: `/plan` → **/tdd** → `/build-fix` (if needed) → `/code-review` → `/test-coverage`.
