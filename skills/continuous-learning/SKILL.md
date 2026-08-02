---
name: continuous-learning
description: Automatically extract reusable patterns from Claude Code sessions and save them as learned skills for future use.
---

# Continuous Learning Skill

Runs as a **Stop hook**: evaluates the session (if it has enough messages — default 10+) and extracts reusable patterns (error resolutions, user corrections, workarounds, debugging techniques, project conventions) into `~/.claude/skills/learned/`.

Configure detection/ignore patterns and thresholds in `config.json`.

## Hook Setup
```json
{"hooks":{"Stop":[{"matcher":"*",
  "hooks":[{"type":"command","command":"~/.claude/skills/continuous-learning/evaluate-session.sh"}]}]}}
```

Runs once at session end (lightweight, non-blocking, has the full transcript) rather than per-message. For manual extraction mid-session, use `/learn` instead.
