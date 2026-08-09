# Hire Your Own Agents — Employee Templates

An agent is one markdown file = one employee. Fill the blanks, place the file, and it starts working. Descriptions cost ~50 always-on tokens, so a whole staff costs less than a paragraph of context.

> **Before anything else, read [LIMITATIONS.md](LIMITATIONS.md)** — what these employees fundamentally cannot do and how to work around it. Five minutes there prevents most disappointments.

## How to hire (6 steps)

1. **Pick an archetype** below and copy it.
2. **Fill every `[FILL: …]` blank.** Delete the guidance text as you go.
3. **Set the salary** (`model:` field) — see the pay scale below.
4. **Create the employee's knowledge folder** in your project (e.g. `company/`) and put their working data there: contracts, sales exports, expense sheets, a `how-we-work.md`. Agents never get data "uploaded" — they read files you point them at. **Then read the confidentiality section below before putting anything sensitive in it.**
5. **Validate the file** — catches every silent failure mode (leftover blanks, a description Claude will never delegate to, bad tools/model, oversized body):
   ```bash
   node scripts/validate-agent.js path/to/your-agent.md
   ```
6. **Place the finished file** in your project's `.claude/agents/` (this project only) or `~/.claude/agents/` (all projects). Restart the session. Done — Claude now delegates matching work to them automatically.

## Confidentiality — read before filling the knowledge folder

Your `company/` folder will contain contracts, financials, and customer data. Three rules:

1. **Gitignore it immediately.** If your project uses git, add `company/` to `.gitignore` *before* putting files in. GitHub's push protection catches API keys — it does **not** catch a client contract or a salary sheet. Once pushed, consider it public.
2. **Reading = sending.** When an agent reads a file, its contents go to the Claude API (Anthropic's standard data handling applies — commercial API data isn't used for training, but know that it leaves your machine). Don't put anything in the folder you wouldn't process through a cloud service.
3. **Redact what the job doesn't need.** The ops manager needs contract amounts and dates, not passport scans. Feed each employee the minimum their duty requires — same as a real hire.

## The archetypes

| Template | Job family | Tools (pre-set — don't change casually) | Can it modify things? |
|---|---|---|---|
| [reviewer.md](reviewer.md) | QA, auditor, compliance checker | Read, Grep, Glob | No — eyes only |
| [planner.md](planner.md) | Organizer, prioritizer, strategist | Read, Grep, Glob | No — produces plans |
| [maker.md](maker.md) | Producer: writes docs, code, reports | Read, Grep, Glob, Write, Edit | Yes — creates/edits files |
| [researcher.md](researcher.md) | Gathers + synthesizes information | Read, Grep, Glob, WebSearch, WebFetch | No — produces findings |

**Worked example:** [operations-manager.md](operations-manager.md) — a fully filled planner-archetype employee that reads a company's contracts/sales/expenses and restructures the work. Read it once before filling your first blank template.

## Pay scale (`model:` field)

| Salary | Model | Hire for |
|---|---|---|
| Junior | `haiku` | High-volume simple tasks: triage, formatting, lookups |
| Mid-level | `sonnet` | Most real work — the default. All our execution agents run on this |
| Senior | `opus` | Judgment-heavy roles only: architecture, big restructures, security |

## Rules that make employees good

- **The `description` is the hiring trigger.** Claude reads it to decide when to delegate. Always include concrete "Use PROACTIVELY when…" situations — a vague description means an employee that's never given work.
- **Ground every claim in a file.** The templates all include "cite the source file; never invent numbers; flag missing data instead of guessing." Keep those lines — they're what separates an employee from a guesser.
- **Least privilege.** A reviewer with Write access is a liability, not a convenience. The tool presets encode this; change them only when the job genuinely requires it.
- **Keep the body under ~80 lines.** It loads on every invocation. Point to files in the knowledge folder for details instead of pasting them in.
