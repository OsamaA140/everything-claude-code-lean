---
name: strategic-compact
description: Suggests manual context compaction at logical intervals to preserve context through task phases rather than arbitrary auto-compaction.
---

# Strategic Compact Skill

Suggests manual `/compact` at logical boundaries (after exploration/before execution, after a milestone, before a context shift) instead of relying on arbitrary auto-compaction that can cut mid-task.

`suggest-compact.sh` runs on PreToolUse (Edit/Write), counts tool calls, and suggests compacting past a threshold (default 50 calls, then every 25).

## Hook Setup
```json
{"hooks":{"PreToolUse":[{"matcher":"tool == \"Edit\" || tool == \"Write\"",
  "hooks":[{"type":"command","command":"~/.claude/skills/strategic-compact/suggest-compact.sh"}]}]}}
```
Config: `COMPACT_THRESHOLD` env var (default 50).

## Best Practices
Compact after planning is finalized, or after debugging is resolved. Don't compact mid-implementation of related changes. The hook tells you *when*; you decide *if*.
