# Hooks System

- **PreToolUse** — before a tool runs (validate/modify params, block risky actions).
- **PostToolUse** — after a tool runs (auto-format, checks).
- **Stop** — session end (final verification).

Configured in `~/.claude/settings.json`. This plugin's defaults: destructive-command and secret-leak blocking, git-push review nudge, blocks stray `.md`/`.txt` file creation, Prettier + `tsc` + console.log checks after edits, PR-URL logging, console.log audit on session end.

## Auto-Accept Permissions
Enable only for trusted, well-scoped plans; disable for exploratory work. Configure `allowedTools` in `~/.claude.json` rather than skip-permissions flags.

## TodoWrite
Use it to track multi-step work and surface out-of-order/missing/misinterpreted steps in real time — the todo list is a steering tool, not just a log.
