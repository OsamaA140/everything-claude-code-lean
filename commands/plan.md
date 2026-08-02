---
description: Restate requirements, assess risks, and create step-by-step implementation plan. WAIT for user CONFIRM before touching any code.
---

# /plan

Invokes the **planner** agent to produce an implementation plan before any code is written.

1. Restate requirements in clear terms.
2. Break into phases with specific, actionable steps and file paths.
3. Identify dependencies and risks (rate High/Med/Low), estimate complexity.
4. Present the plan and **wait for explicit confirmation** ("yes"/"proceed") before writing code.

To adjust: reply `modify: <changes>`, `different approach: <alt>`, or reorder phases directly.

Use for: new features, architectural changes, complex refactors, or unclear/ambiguous requirements.
Next: `/tdd` to implement → `/build-fix` if needed → `/code-review`.
