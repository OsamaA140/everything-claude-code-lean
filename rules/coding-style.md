# Coding Style

## Immutability (critical)
Always return new objects/arrays; never mutate in place (`return {...user, name}`, not `user.name = name`).

## File Organization
Many small files > few large ones — 200-400 lines typical, 800 max. High cohesion/low coupling. Organize by feature/domain, not by file type.

## Error Handling
Always wrap fallible operations; log with context, throw a user-actionable message (not the raw internal error).

## Input Validation
Validate all external input with a schema (Zod or similar) before it reaches business logic.

## Checklist
- [ ] Readable, well-named · [ ] Functions <50 lines, files <800 · [ ] Nesting ≤4 levels
- [ ] Errors handled · [ ] No console.log · [ ] No hardcoded values · [ ] Immutable patterns used
