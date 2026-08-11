# Optimization Notes (historical)

How the agent, skill, command, and rule set in this project was compressed to its current size. These notes are kept as a record of technique — what was cut and why — and are useful if you are shrinking a configuration of your own.

The starting point was [everything-claude-code](https://github.com/affaan-m/ECC) (MIT); the goal was the same coverage and behaviour at the minimum tokens loaded per invocation. Everything built since — the trial harness, guards, validator, benchmark, and employee templates — is original to this project and covered in `CHANGELOG.md`.

## What Changed

**Cut project-specific worked examples.** The upstream repo was battle-tested on the author's own apps (a Solana prediction-market platform and an AI customer-discovery tool). Agents/skills carried full Solana/Privy/Supabase/FastAPI example sections that only made sense for those two codebases. Removed and replaced with one-line pointers to define your own specifics in `CLAUDE.md` / `skills/<project>/SKILL.md`.

**Cut duplicate worked examples between commands and agents.** Most `/command` files re-explained the whole workflow *and* repeated a full code example the corresponding agent file already had. Commands now just state what they do and which agent they invoke; the detailed how-to lives in one place (the agent).

**Compressed "bad vs. good" pattern libraries.** Files like `security-reviewer` and `build-error-resolver` had 10 near-duplicate full code blocks per concept. Kept the 3-5 highest-value patterns as tight snippets or a table; dropped exhaustive repetition (Claude already knows the general syntax — the point of the doc is *when/why*, not re-teaching *how*).

**Removed flowery boilerplate.** Every file's closing "**Remember**: ..." paragraph and repeated "Best Practices" lists that just restated the file's own content were cut.

**Removed `WORLDFLOWAI.md`.** It was the original author's personal setup notes for two of their own private repos (`synapse`, `arbiter`) — zero relevance to any other project, pure dead weight.

**Trimmed `README.md`.** Kept install steps, directory map, and key concepts; cut marketing/narrative sections that don't affect how the plugin runs.

**Left untouched:** `hooks/hooks.json`, `scripts/*.js` (already-minified executable code, not prose), `tests/*`, `mcp-configs/*`, `.claude-plugin/*` manifests, `examples/*`.

## Result

| | Agents | Commands | Skills | Rules |
|---|---|---|---|---|
| Original | 84.5 KB | 38.6 KB | 96.0 KB | 9.3 KB |
| Optimized | ~22.6 KB | ~11.4 KB | ~15 KB | ~4 KB |
| Reduction | ~73% | ~70% | ~84% | ~55% |

Roughly **70-80% fewer tokens** loaded per agent/command/skill invocation, same functional coverage. If a section feels too terse for your taste, the upstream repo (linked above) has the fuller, example-heavy version to restore from.

## Second Pass (2026-08-02): hooks/scripts/manifest fixes

The first pass left `hooks/hooks.json` and `scripts/` untouched; this pass fixed them.

**Hooks actually fire now.** Matchers used a pseudo-expression syntax (`tool == "Bash" && tool_input.command matches ...`) that Claude Code treats as a tool-name regex — it never matched anything, so the conditional hooks were silently dead. Rewritten to real tool-name matchers (`Bash`, `Write`, `Edit|Write`) with the conditions moved into the scripts, which read the hook's stdin JSON.

**Blocking works.** "BLOCK" hooks exited with code 1 (non-blocking in Claude Code); now exit 2, which actually denies the tool call. The dev-server block also now respects an existing tmux session, and the stray-`.md` block allowlists legit doc dirs (`docs/`, `agents/`, `commands/`, `skills/`, `rules/`, `.claude/`, …) so it doesn't fight normal workflows.

**Graceful degradation without Node.** Every hook command is prefixed with `command -v node >/dev/null 2>&1 || exit 0;` so machines without Node.js no-op instead of spamming errors on every tool call.

**Correct hook I/O contract.** `evaluate-session.js` and `suggest-compact.js` read `transcript_path` / `session_id` from stdin JSON (the documented contract) instead of env vars Claude Code never sets; env fallbacks kept for tests. `readStdinJson` got a 3s timeout so manual runs can't hang. Hooks no longer echo their full stdin JSON back to stdout (token waste), and the Prettier hook uses `spawnSync` with an args array instead of shell string interpolation (no injection via file paths). `npx` calls use `--no-install` so hooks never trigger surprise package downloads.

**Cheaper agents.** Execution-focused agents (code-reviewer, tdd-guide, build-error-resolver, e2e-runner, refactor-cleaner, doc-updater) moved `opus` → `sonnet` per the model-selection rule; `opus` retained where deep reasoning pays (architect, planner, security-reviewer).

**Manifest + configs.** `plugin.json`: added `version`, explicit `agents` and `hooks` paths. `mcp-configs`: GitHub MCP moved to the official hosted server (npm package deprecated), context7 package name corrected to `@upstash/context7-mcp`. Local machine state (`.claude/settings.local.json`, `.claude/package-manager.json`) gitignored. Model names in examples de-versioned (aliases only — future-proof).
