# agent-trials

[![tests](https://github.com/OsamaA140/agent-trials/actions/workflows/tests.yml/badge.svg)](https://github.com/OsamaA140/agent-trials/actions/workflows/tests.yml)

**Prove an agent does its job before you trust it.** Hire-ready employee templates, a deterministic trial harness that grades agents against fixtures with planted mistakes, zero-token safety hooks, and a token-lean agent/skill set for Claude Code.

## Trials: behavioural testing for agents

Everyone ships agents. Nobody proves they work. A **trial** hands an employee a fake business with mistakes planted in it and checks deterministically whether it caught them, stayed inside its write scope, and got the arithmetic right.

```bash
node scripts/trial.js prepare trials/ops-manager-smb --workspace /tmp/t1
node scripts/trial.js report  trials/ops-manager-smb --runs /tmp/t1,/tmp/t2,/tmp/t3
```

The headline metric is **pass^k** — passed in *every* run, not merely once — because one success is capability, not reliability. No LLM judge is involved: [judge style bias runs 0.76-0.92](https://arxiv.org/abs/2604.23178), which grades prose instead of correctness. Three fixtures ship, including two held-out businesses used to separate judgement from memorisation. Methodology, measured results, and a retracted finding in [docs/TRIALS.md](docs/TRIALS.md).

## Token cost: measured, not claimed

Most stacks quietly tax every session and every invocation. Full methodology and reproduction steps in [docs/BENCHMARK.md](docs/BENCHMARK.md):

| | agent-trials | A full-size stack (measured) |
|---|---|---|
| Always-on context cost | **~1,260 tokens** for all 26 skills + 9 agents | ~93,000 tokens for a full checkout |
| Avg agent invocation | **623 tokens** | 1,605 tokens (**61% less**) |
| Avg skill invocation | **455 tokens** | 2,203 tokens (**79% less**) |
| Avg command invocation | **189 tokens** | 970 tokens (**81% less**) |
| Hooks (secret blocking, command guard, formatting) | **0 tokens** — they run in the harness, not the model | 0 (same mechanism) |
| Verification | 134 unit tests, CI on Node 20/22, guards live-fired in real sessions | — |

(Fair-comparison note: the comparison stack is a marketplace meant to be partially enabled and covers far more ground, so the per-invocation averages are the like-for-like numbers. Details and caveats in the benchmark doc.)

How: agents/skills state *when and why*, not re-teach *how* (Claude already knows the syntax); commands are thin pointers to agents instead of duplicating them; execution agents run on Sonnet with Opus reserved for architecture, planning, and security; and all enforcement lives in zero-token hooks. Full change log in `OPTIMIZATION.md` and `CHANGELOG.md`.

### The secret-leak hook in action

![The pre-write hook denying a Write that contains an Anthropic API key, before it reaches disk](docs/demo-secret-block.svg)

*Rendered from a real session exchange — same text the hook produces live.*

## What's Inside

```
agents/      9 specialized subagents (planner, architect, tdd-guide, code-reviewer,
             security-reviewer, build-error-resolver, e2e-runner, refactor-cleaner, doc-updater)
skills/      Workflow/domain knowledge (coding-standards, backend/frontend-patterns,
             clickhouse-io, tdd-workflow, security-review, eval-harness, verification-loop,
             continuous-learning, strategic-compact, project-guidelines-example)
commands/    Slash commands (/plan /tdd /e2e /code-review /build-fix /refactor-clean
             /verify /checkpoint /eval /learn /orchestrate /setup-pm /test-coverage
             /update-codemaps /update-docs)
rules/       Always-follow guidelines — copy to ~/.claude/rules/
hooks/       hooks.json + memory-persistence and strategic-compact scripts
scripts/     Cross-platform Node.js hook implementations + package-manager detection
contexts/    Dynamic mode prompts (dev / research / review)
examples/    Example CLAUDE.md configs
mcp-configs/ Example MCP server configs (replace YOUR_*_HERE placeholders)
```

## Install

**As a plugin (recommended):**
```bash
/plugin marketplace add OsamaA140/agent-trials
/plugin install agent-trials@agent-trials
```

**Manual:**
```bash
cp agents/*.md ~/.claude/agents/
cp rules/*.md ~/.claude/rules/
cp commands/*.md ~/.claude/commands/
cp -r skills/* ~/.claude/skills/
# merge hooks/hooks.json into ~/.claude/settings.json
# copy desired entries from mcp-configs/mcp-servers.json into ~/.claude.json (fill in API keys)
```

**Requirements:** hooks and tests need **Node.js** on PATH. Every hook command is guarded with `command -v node || exit 0`, so on machines without Node the hooks silently no-op instead of erroring on every tool call (guard is POSIX shell — Windows users should strip the prefix or install Node). Agents, skills, commands, and rules work regardless.

## Hook Safety Engine

All hooks are harness-side (zero model-context cost) and live in `scripts/hooks/`, with shared rules in `scripts/lib/guards.js`:

- **pre-bash** — blocks destructive commands (`rm -rf /`, `curl | sh`, force-push to main, raw disk writes, fork bombs); warns on risky ones (`git reset --hard`, `git clean -f`, `--no-verify`); notes that dev servers are best run in the background.
- **pre-write** — blocks Writes/Edits that would introduce API keys, tokens, or private-key material (AWS, GitHub, Anthropic, OpenAI, Stripe, Slack, Google); placeholder- and template-aware. Also blocks stray `.md`/`.txt` creation outside sanctioned locations.
- **post-edit** — one process for Prettier, scoped `tsc`, and `console.log` warnings. Opt out per-check: `CLAUDE_HOOKS_DISABLE=tsc,prettier,consolelog`.
- **session-start / session-end** — cross-session memory: session end captures a git snapshot (branch, changed files, recent commits); session start injects previous-session notes and learned skills into model context via `additionalContext`.

Guard rules are unit-tested: `node tests/lib/guards.test.js` (26 cases).

## Key Concepts

**Agents** — subagents with scoped tools/model, invoked by name or proactively per their `description`. **Skills** — reference/workflow docs loaded on demand (progressive disclosure — cheap until triggered). **Commands** — slash-command entry points, usually thin wrappers that invoke an agent. **Rules** — always-on guidelines, kept modular and short since they load every session. **Hooks** — fire on tool lifecycle events (PreToolUse/PostToolUse/Stop/etc.), configured in `settings.json`.

## Hire Your Own Agents (Employee Templates)

Agents are cheap enough (~50 always-on tokens each) to treat like employees: pick an archetype, fill the blanks, point it at a knowledge folder with your data, and it starts working. Four guided templates (reviewer, planner, maker, researcher) plus a fully worked **operations-manager** example — reads your contracts/sales/expenses, restructures the work, sets priorities — in [docs/templates/](docs/templates/), with a hiring guide covering salary tiers (model choice) and tool permissions per job family.

**And you can prove one works before trusting it.** [Employee trials](docs/TRIALS.md) hand an agent a fake business with planted mistakes and check deterministically whether it caught them, stayed inside its write scope, and got the arithmetic right — reported as **pass^k** (passed in *every* run), because a single success is capability, not reliability. The shipped `operations-manager` scores 15/15 at k=3; a deliberately bad report fails 13 of 15. No LLM judge is involved: [judge style bias runs 0.76-0.92](https://arxiv.org/abs/2604.23178), which would grade prose instead of correctness.

## Customize
Put your own stack, conventions, and "never touch this" list in your project's `CLAUDE.md` and `skills/<your-project>/SKILL.md` (see `project-guidelines-example`). Everything here is generic on purpose — that's what keeps it cheap to run across any project.

## Context Window Hygiene
Don't enable every MCP at once — budget ~20-30 configured, <10 enabled per project, <80 active tools, or your effective context shrinks fast. Use `disabledMcpServers` to turn off what you're not using.

## Tests
```bash
node tests/run-all.js
```

## License & Notice

MIT — see [LICENSE](LICENSE). Use freely, modify as needed.

The trial harness, guards library, agent validator, benchmark, employee templates, fixtures, and test suite are original to this project. Some agent, skill, command, and rule definitions, and parts of the cross-platform hook scripts, derive from [everything-claude-code](https://github.com/affaan-m/ECC) by Affaan Mustafa, used under the MIT License.
