# Security Guidelines

## Before Any Commit
- [ ] No hardcoded secrets · [ ] Inputs validated · [ ] Parameterized queries only
- [ ] Output sanitized (XSS) · [ ] CSRF protection on state changes · [ ] Auth+authz verified
- [ ] Rate limiting on endpoints · [ ] Errors don't leak internals

```typescript
const apiKey = process.env.OPENAI_API_KEY   // never a literal
if (!apiKey) throw new Error('OPENAI_API_KEY not configured')
```

## If an Issue Is Found
Stop immediately → run `security-reviewer` → fix CRITICAL issues first → rotate any exposed secret → check the rest of the codebase for the same pattern.
