# Project Guidelines Skill (Template)

Copy this into your own project as `skills/<your-project>/SKILL.md` and fill in the specifics — it's what turns generic agents/commands into project-aware ones.

## What to Fill In

**Architecture** — stack (frontend/backend/DB/infra), deployment targets, service diagram.

**File structure** — top-level layout so agents know where things live without exploring first.

**Code patterns** — your actual API response shape, error format, auth pattern, any house conventions that differ from the generic defaults in `coding-standards`.

**Testing** — your test commands, frameworks, and coverage requirements per layer (unit/integration/E2E).

**Deployment** — pre-deploy checklist and the actual deploy commands for this project.

**Critical rules** — the non-negotiables specific to this codebase (e.g., "never touch the payments module without a second reviewer", "no direct DB access from the client").

## Why This Matters
Generic skills (`coding-standards`, `backend-patterns`, etc.) cover universal practice. This file is where you encode what's true only *here* — so agents stop re-discovering your stack from scratch every session and stop over-fitting on someone else's example project.

## Related Skills
`coding-standards` · `backend-patterns` · `frontend-patterns` · `tdd-workflow`
