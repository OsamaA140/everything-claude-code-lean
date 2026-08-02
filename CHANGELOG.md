# Changelog

## 2.0.1 — 2026-08-02

### Removed
- **tmux enforcement dropped from `pre-bash.js`.** The hard block on dev servers outside tmux and the "consider tmux" nudges assumed the upstream author's tmux workflow; on machines without tmux it blocked a normal `npm run dev` with no way to comply. Dev servers now get a non-blocking note suggesting background execution (Claude Code handles backgrounded commands natively). All destructive-command and secret guards unchanged.

## 2.0.0 — 2026-08-02

Hook layer rebuilt from inline one-liners into a real, tested safety engine.

### Added
- **Dangerous-command guard** (`scripts/lib/guards.js` + `pre-bash.js`): blocks `rm -rf /`~/`$HOME`, `curl|sh` pipes, force-push to main/master, raw disk writes (`dd of=/dev/…`, `mkfs`), fork bombs, `chmod 777 /`. Warns on `git reset --hard`, `git clean -f`, project-level `rm -rf`, `--no-verify`, bare force-push.
- **Secret-leak blocker** (`pre-write.js`): scans every Write/Edit payload for AWS/GitHub/Anthropic/OpenAI/Stripe/Slack/Google credentials and private-key blocks — denies the write before the secret lands on disk. Placeholder-aware (`YOUR_…`, `<…>`, `.env.example` exempt); warns on JWTs and generic hardcoded `password/token = "…"`.
- **Real memory injection** (`session-start.js`): previous-session notes, learned skills, and package manager now reach the model via `additionalContext` (previously stderr-only, i.e. invisible to Claude).
- **Git snapshot on session end** (`session-end.js`): branch, uncommitted files, and recent commits are captured automatically instead of an empty template.
- **Unit tests for all guard rules** (`tests/lib/guards.test.js`, 26 cases) wired into `tests/run-all.js`.
- `CLAUDE_HOOKS_DISABLE` env var (e.g. `tsc,prettier,consolelog`) to opt out of individual post-edit checks.
- Stale tool-counter cleanup in temp dir on session start.

### Changed
- All inline `node -e` hook payloads extracted into `scripts/hooks/*.js` modules (`pre-bash`, `pre-write`, `post-bash`, `post-edit`, `stop-check`) — testable, readable, and PostToolUse now spawns **one** node process per edit instead of three.
- Stray-doc-file rule moved into `guards.js` with `CHANGELOG`/`LICENSE`/`SECURITY` added to the allowlist.

## 1.1.0 — 2026-08-02

- Fixed hook matchers (pseudo-expression syntax → real tool-name matchers); hooks actually fire now.
- Blocking hooks exit 2 (deny) instead of 1 (ignored).
- Hook scripts read stdin JSON (`transcript_path`, `session_id`) per the documented contract.
- Graceful no-op on machines without Node.js.
- Prettier hook: `spawnSync` arg array (no shell interpolation), `npx --no-install`.
- Execution agents moved Opus → Sonnet (architect/planner/security-reviewer stay Opus).
- Manifest: `version` added; MCP configs modernized (hosted GitHub server, `@upstash/context7-mcp`).

## 1.0.0

Token-optimized fork of [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) — see `OPTIMIZATION.md`.
