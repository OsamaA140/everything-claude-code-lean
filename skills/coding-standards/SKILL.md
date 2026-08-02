---
name: coding-standards
description: Universal coding standards, best practices, and patterns for TypeScript, JavaScript, React, and Node.js development.
---

# Coding Standards & Best Practices

## Principles
Readability first (clear names, self-documenting over commented). KISS (simplest solution that works). DRY (extract shared logic — but don't abstract prematurely). YAGNI (build for today's requirement, not speculative future ones).

## TypeScript/JavaScript
- **Naming**: descriptive `camelCase` variables/functions, `PascalCase` types/components, verbs for functions (`getUser`, not `user`).
- **Immutability (critical)**: never mutate — return new objects/arrays (`{...obj, field}`, `[...arr, item]`), not in-place mutation.
- **Errors**: `try/catch` around fallible operations, throw/log with actionable context, never swallow silently.
- **Async**: always `await` or explicitly handle the promise; avoid mixing `.then()` with `async/await` in the same function.
- **Types**: avoid `any`; prefer `unknown` + narrowing, or precise union/generic types.

## React
- Function components with typed props; one component's concerns per file.
- Custom hooks for reusable stateful logic; hooks always at top level (never conditional).
- Co-locate state as close to where it's used as possible; lift only when actually shared.
- Prefer early-return over deeply nested conditional rendering.

## API Design
REST conventions (resource URLs, correct verbs, query params for filter/sort/paginate). Consistent response envelope: `{ success, data?, error? }`. Validate all input at the boundary (Zod/similar) before it reaches business logic.

## File Organization
Many small, focused files (200-400 lines typical, ~800 max) over few large ones; organize by feature/domain, not by file type. Name files after their default export.

## Comments & Docs
Comment *why*, not *what* (code should already say what). JSDoc on public/exported APIs (params, return, throws).

## Performance
Memoize only where profiling shows a cost. Lazy-load routes/heavy components. Avoid N+1 queries; batch/eager-load related data.

## Testing (AAA pattern)
Arrange → Act → Assert. Name tests as behavior descriptions ("returns 400 when email is missing"), not implementation details.

## Code Smells to Flag
Functions >50 lines, nesting >4 levels deep, magic numbers without a named constant, duplicated logic across files, God objects/functions doing too much.
