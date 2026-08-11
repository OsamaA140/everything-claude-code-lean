# Hire Your Own Agents — Employee Templates

An agent is one markdown file = one employee. Fill the blanks, place the file, and it starts working. Descriptions cost ~50 always-on tokens, so a whole staff costs less than a paragraph of context.

> **Before anything else, read [LIMITATIONS.md](LIMITATIONS.md)** — what these employees fundamentally cannot do and how to work around it. Five minutes there prevents most disappointments.

## How to hire (7 steps)

1. **Pick an archetype** below and copy it.
2. **Fill every `[FILL: …]` blank.** Delete the guidance text as you go.
3. **Set the salary** (`model:` field) — see the pay scale below.
4. **Create the employee's knowledge folder** in your project (e.g. `company/`) and put their working data there: contracts, sales exports, expense sheets, a `how-we-work.md`. Agents never get data "uploaded" — they read files you point them at. **Then read the confidentiality section below before putting anything sensitive in it.**
5. **Validate the file** — catches every silent failure mode (leftover blanks, a description Claude will never delegate to, bad tools/model, oversized body):
   ```bash
   node scripts/validate-agent.js path/to/your-agent.md
   ```
6. **Trial it before you trust it.** Validation proves the file is well-formed; a trial proves it does the job. Run the shipped one to see what a trial looks like, then write one for your own employee — a fake version of your business with mistakes planted in it, and deterministic checks for whether they were caught:
   ```bash
   node scripts/trial.js prepare trials/ops-manager-smb --workspace /tmp/t1
   ```
   Full guide in [../TRIALS.md](../TRIALS.md). Worth the hour before an employee touches real books.
7. **Place the finished file** in your project's `.claude/agents/` (this project only) or `~/.claude/agents/` (all projects). Restart the session. Done — Claude now delegates matching work to them automatically.

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

## How to write rules for an employee (learned the hard way)

These come from an actual trial where the employee performed well *and* broke two of its own rules. Rules are not free — each one costs tokens on every invocation and can silently contradict another.

1. **Never give two rules that can't both be obeyed.** Our first ops-manager was told "keep reports under one page" *and* to produce seven sections with citations. Impossible, so it quietly dropped the length rule. When rules conflict, the model picks one and you never find out which. Fix the spec, don't add a third rule telling it to obey the first two.
2. **A rule fires or it doesn't — make it checkable.** "Be concise" is a wish. "Part 1 must fit one screen, ~250 words" is a rule. If you can't tell from the output whether it was followed, it wasn't a rule.
3. **Bound every permission you grant.** Giving `Write` without saying *where* means the agent writes wherever it seems helpful. In our trial it created a `.gitignore` it was only asked to *report* — right call, wrong authority. Every template with write access now names one folder and says "being right about a fix does not authorize you to make it."
4. **Don't flag everything, or the flags stop working.** We required `(calc — verify)` on computed numbers; the agent tagged fifteen of them, including trivia, so the one number that mattered got the same warning as the rest. Caps ("at most three, listed in the brief") beat blanket rules.
5. **A rule that fires on work you know is correct is too broad.** While building the validator, the write-scope check flagged our own code agents, where editing files *is* the job. That's a warning, not an error, now. If a new rule condemns something you'd happily ship, narrow it before you keep it.
6. **Asking is not enforcing.** "Ask why it wasn't done" repeated monthly is nagging, not management. Give a ladder with an end: ask, then escalate with a forced choice, then drop it and record that.

## Rules that make employees good

- **The `description` is the hiring trigger.** Claude reads it to decide when to delegate. Always include concrete "Use PROACTIVELY when…" situations — a vague description means an employee that's never given work.
- **Ground every claim in a file.** The templates all include "cite the source file; never invent numbers; flag missing data instead of guessing." Keep those lines — they're what separates an employee from a guesser.
- **Least privilege.** A reviewer with Write access is a liability, not a convenience. The tool presets encode this; change them only when the job genuinely requires it.
- **Keep the body under ~80 lines.** It loads on every invocation. Point to files in the knowledge folder for details instead of pasting them in.
