---
name: backend-patterns
description: Backend architecture patterns, API design, database optimization, and server-side best practices for Node.js, Express, and Next.js API routes.
---

# Backend Development Patterns

## API Design
- **REST**: resource-based URLs (`GET /orders`, `GET /orders/:id`, `POST /orders`, `PATCH /orders/:id`); filter/sort/paginate via query params (`?status=active&sort=created&limit=20&offset=0`).
- **Repository pattern**: interface `{ findAll, findById, create, update, delete }` implemented per data source — isolates business logic from the DB client so it's swappable/testable.
- **Service layer**: routes call services, services call repositories — keeps controllers thin and logic unit-testable without HTTP mocking.
- **Middleware**: compose small single-purpose functions (`auth`, `validate`, `rateLimit`) in the request pipeline rather than inlining checks per route.

## Database
- **Query optimization**: select only needed columns, index columns used in `WHERE`/`ORDER BY`/joins, prefer set-based queries over per-row loops.
- **N+1 prevention**: batch/eager-load related rows (`WHERE id IN (...)`) instead of querying per item in a loop.
- **Transactions**: wrap multi-step writes in a DB transaction; use row locks (`FOR UPDATE`) for read-modify-write on shared state (balances, counters).

## Caching
- **Cache-aside**: read → check cache → on miss, read DB → write cache with TTL → return. Invalidate/update cache on writes to the same key.
- Use Redis (or similar) for hot reads; always have a fallback path if the cache is unavailable — never let cache failure break the request.

## Error Handling
- Centralize error handling in one middleware/handler that maps error types → HTTP status + safe user-facing message (never leak stack traces/internals to clients).
- **Retry with backoff** for transient failures (network, rate limits): exponential delay, capped attempts, only for idempotent operations.

## Auth & Authorization
- Validate JWTs on every protected route (signature, expiry, issuer); attach decoded user to the request context.
- **RBAC**: check role/permission in middleware or a decorator, not scattered inline `if` checks — one place to audit access rules.

## Rate Limiting
Apply per-user/IP limits on sensitive or expensive endpoints (auth, search, writes); return `429` with a `Retry-After` header. In-memory limiters are fine for single-instance; use Redis-backed limiting across multiple instances.

## Background Jobs
Queue long-running/non-critical work (emails, notifications, exports) instead of blocking the request; use a durable queue (BullMQ/SQS/etc.) with retry + dead-letter handling.

## Logging
Use structured (JSON) logs with request IDs for correlation; log at service boundaries (in/out), never log secrets, tokens, or full PII.
