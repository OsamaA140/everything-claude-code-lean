---
name: frontend-patterns
description: Frontend development patterns for React, Next.js, state management, performance optimization, and UI best practices.
---

# Frontend Development Patterns

## Component Patterns
- **Composition over inheritance**: build UI from small components (`Card`, `CardHeader`, `CardBody`) rather than prop-heavy variants of one giant component.
- **Compound components**: parent manages shared state via context, children consume it (`<Tabs><Tab/><Tab/></Tabs>`) for flexible, readable APIs.
- **Render props**: pass a function-as-child when the parent needs to control *what* renders but a hook can't cleanly share the *behavior* (rare now that hooks cover most cases — prefer hooks first).

## Custom Hooks
- Extract stateful logic (`useToggle`, `useLocalState`) out of components for reuse and isolated testing.
- **Async data hook**: return `{ data, loading, error, refetch }`; cancel/ignore stale requests on unmount or param change.
- **Debounce hook**: delay updating a value until input pauses — use for search-as-you-type, not for the input's own display value.

## State Management
- **Context + reducer**: for state shared across a subtree with non-trivial transitions; avoid for high-frequency updates (causes broad re-renders) — use a dedicated store (Zustand/Redux) instead.
- Keep state as local as possible; lift only when siblings actually need it.

## Performance
- **Memoization** (`useMemo`/`useCallback`/`React.memo`): only where profiling shows a real re-render cost — reaching for it by default adds complexity without benefit.
- **Code splitting**: `React.lazy` + `Suspense` for routes/heavy components not needed on first paint.
- **Virtualization**: render only visible rows for long lists (react-window/virtua) — avoid mounting thousands of DOM nodes.

## Forms
Controlled inputs with a validation schema (Zod/Yup) validated on submit (and optionally on blur); surface field-level errors next to the field, not just a generic banner.

## Error Boundaries
Wrap route/section-level components in an error boundary with a fallback UI — one bad component shouldn't blank the whole page.

## Animation
Prefer CSS transitions for simple cases; use Framer Motion (or similar) for orchestrated/gesture-driven animation — respect `prefers-reduced-motion`.

## Accessibility
Full keyboard navigation (`Tab`/`Enter`/`Esc`/arrow keys) on custom interactive components; manage focus explicitly on route change, modal open/close, and after async updates so screen-reader users aren't stranded.
