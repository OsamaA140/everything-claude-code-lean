---
name: security-review
description: Use this skill when adding authentication, handling user input, working with secrets, creating API endpoints, or implementing payment/sensitive features. Provides comprehensive security checklist and patterns.
---

# Security Review Skill

## When to Activate
Auth/authz work, user input or file uploads, new API endpoints, secrets/credentials, payments, sensitive data storage/transmission, third-party API integration.

## Checklist
1. **Secrets** — env vars only, never literals; fail fast if a required secret is missing at startup.
2. **Input validation** — validate/sanitize every external input (body, query, headers, files) with a schema (Zod/similar) before use.
3. **SQL injection** — parameterized queries / ORM methods only, never string-concatenated SQL.
4. **Auth/authz** — verify identity (authentication) *and* permission for the specific resource (authorization) on every protected route; hash passwords (bcrypt/argon2), validate JWT signature+expiry.
5. **XSS** — escape/sanitize output; rely on framework auto-escaping, sanitize any raw HTML insertion (DOMPurify).
6. **CSRF** — use anti-CSRF tokens or `SameSite` cookies for state-changing requests.
7. **Rate limiting** — per-user/IP limits on auth, search, and write-heavy endpoints.
8. **Sensitive data** — HTTPS enforced, encryption at rest for PII, logs scrubbed of secrets/PII.
9. **Domain-specific** (e.g., payments, blockchain, health data) — add the extra invariants that matter for your domain (atomic balance updates, signature verification, HIPAA/PII handling) to your project's `CLAUDE.md`.
10. **Dependencies** — `npm audit`, keep lockfiles committed, update on CVE alerts.

## Testing
Include security-relevant tests: rejected invalid input, auth-required routes reject anonymous/unauthorized requests, rate limits trigger correctly.

## Pre-Deployment Checklist
- [ ] No secrets in code/history · [ ] All inputs validated · [ ] Auth+authz verified on every route
- [ ] Rate limiting live · [ ] Dependencies audited clean · [ ] Logs scrubbed · [ ] HTTPS enforced

## False Positives
`.env.example` placeholders, clearly-marked test fixtures, and intentionally-public keys aren't findings — check context before flagging.
