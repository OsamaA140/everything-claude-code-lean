# Changelog

## 2.7.0 — 2026-08-13

The three archetype trials now run at **k=8** rather than k=3 — the level the reliability literature treats as meaningful. 18 runs.

### Measured at k=8
| Archetype | pass^k | Flaky |
|---|---|---|
| reviewer (`contract-checker-review`) | **12/12** | 0 |
| maker (`proposal-writer-draft`) | **11/11** | 0 |
| researcher (`supplier-researcher-brief`) | **10/10** | 0 |

The reviewer's earlier three runs were **discarded rather than reused**: `contract-checker.md` gained the anti-circumvention rule after them, and averaging two template versions into one pass^k figure measures nothing. All eight of its runs are fresh against the current template. The maker and researcher templates were unchanged since their first three runs, so those combine cleanly.

### Fixed — a third polarity-blind assertion
Raising k did what it is for: `motion-price-not-invented` failed in **run 4 of 8**, invisible at k=3. The employee was right and the assertion was wrong — it fired on *"The total of $33,500 does not include the animated logo sting"*, a report behaving correctly.

This is the third false positive of the same shape (earlier ones matched reports *quoting* a rule and *negating* a claim). The pattern now vetoes on any exclusion cue in the window, verified against five genuine-invention controls that must fire and four correct-behaviour controls that must stay quiet. The eight runs were re-graded unchanged.

**Every failure this harness has produced at k>3 has been a grader defect, not an employee defect.** That is a warning about `MUST_NOT` regex over prose, not reassurance about the employees.

## 2.6.0 — 2026-08-12

All four archetypes now carry behavioural evidence.

### Added
- **`trials/contract-checker-review/`** (reviewer) — an MSA with six defects against standards, past issues and the accepted quote, plus two compliant clauses and one the standards do not cover. **12/12 pass^k.** All runs caught the $1,500 fee discrepancy (requires cross-checking the quote, not just reading the contract), left the compliant clauses alone, said "no standard on this" rather than improvising, and wrote nothing to disk.
- **`trials/proposal-writer-draft/`** (maker) — an enquiry with one item that has no published rate. **11/11 pass^k.** All runs priced the listed work identically ($33,500 including the rush surcharge) and none invented a figure for the unpriceable item.
- **`trials/supplier-researcher-brief/`** (researcher) — a question already answered three months earlier. **10/10 pass^k.** All runs found the prior research, dated it, kept FACT separate from INFERENCE, and declined to decide.
- Filled example employees: `contract-checker.md`, `proposal-writer.md`, `supplier-researcher.md`.

### Fixed — circumvention
An agent blocked from writing `.md` **read the hook's source and saved `.markdown` to tunnel past it**. Honestly disclosed, but a bypass, and no template forbade it — an earlier run facing the same block had refused, so the outcome was left to chance.

All eight templates now state: *if a hook, permission, or tool refuses a write, do not change the extension, rename the path, switch tools, or edit the rule — stop and report what blocked you.* Measured across the runs that followed: **1 of 1 bypassed before the rule, 0 of 6 after it.**

### Fixed — harness
- `writes_outside_scope` detected only **new** files, so an agent editing a source file in place passed cleanly. The baseline now stores content hashes.
- Reply-only agents (no Write tool) could not be graded at all. Added `replyFile`, excluded from the write diff so "wrote nothing" remains a real assertion.
- New `forbidden_files` check plus a `no-guard-evasion` assertion, so extension-tunnelling fails by name instead of surfacing as a missing artifact.
- The stray-doc guard blocked employees from writing to their own output folders. The allowlist now covers agent output directories and is extendable via `CLAUDE_DOC_ALLOWED_DIRS`.

141 tests.

## 2.5.1 — 2026-08-12

**Corrects a wrong result published in 2.5.0.**

### Retracted
- 2.5.0 reported the held-out catering fixture at **14/15 pass^k with a flaky Owner Brief**. That was a harness bug, not employee behaviour: grading ran while an agent was **still writing its report**, measuring a half-finished 352-word draft instead of the 277-word final. Re-grading the identical workspaces after all agents finished gives **15/15, zero flaky**. The employee never failed that assertion.

### Fixed
- `grade` now warns when the artifact was modified within the last 20 seconds (`TRIAL_SETTLE_SECONDS`) and exposes `unsettled` on the result. Two regression tests. **A file appearing on disk does not mean the agent has finished.**
- Four `must_not` assertions across all three trials required only a keyword, so they fired on reports *quoting a rule as a constraint* ("no subcontracting — that is a hard ceiling") or *correctly negating a claim* ("over 60 days — not yet, oldest is 54 days"). They now require a recommendation or assertion verb. Re-grading unchanged runs lifted the workshop fixture from 11/15 to 13/15.

### Changed
- **Owner Brief now carries both a structural rule and a word ceiling.** Acting on the phantom flake, 2.5.0's successor replaced `~250 words max` with structure alone; measured on two fixtures that made briefs ~40% longer (344/338/375 and 330/415/310, 0/3 under cap both times). Structure constrains shape, not verbosity. With both limits: 207/243/239 — tighter than the original 256 mean. The template now states this with the measurement.
- `trials/ops-manager-workshop/` added as a third fixture (mobile bike repair, 21/120-day notice periods, a renewal window closed only 4 days prior).

134 tests.

## 2.5.0 — 2026-08-11

### Added
- **`trials/ops-manager-catering/`** — a held-out fixture. Same trap *types* as `ops-manager-smb`, but a different industry, figures, notice periods (45/90-day vs 30/60), a different owner law, and a twist where August bills a profit while collecting a cash loss. The template was never revised against it, so it measures generalisation rather than memorisation.

### Measured
`operations-manager` v2.3.0 on the held-out fixture, k=3: **14/15 pass^k, 1 flaky**.

All thirteen judgement assertions held 3/3 on a business the template had never seen — including a notice window that closed on a date derived from a 45-day term, a 55-day receivable correctly not escalated as 60+, a +63.3% cost spike, and the profit-vs-cash distinction. The first result was generalisation, not recall.

The single flaky assertion is the Owner Brief word budget (232 / 352 / 255 words against a 300 cap). The pattern: **checkable facts generalised perfectly; a stylistic budget did not.** pass@k reads 15/15 and pass^k reads 14/15 — the gap the harness was built to expose, and exactly what the original k=1 trial would have missed.

The fix is **deliberately deferred**: revising the template against a held-out fixture would destroy its value. A third fixture is needed to validate any change to the length rule.

## 2.4.0 — 2026-08-11

Behavioural testing for agent files. `validate-agent.js` proves a file is well-formed; a **trial** proves it does the job.

### Added
- **`scripts/trial.js`** — deterministic trial harness. `prepare` builds a clean workspace from a versioned fixture (copy, backdate files, `git init`, snapshot baseline), `grade` evaluates one run, `report --runs a,b,c` aggregates to **pass^k**. Assertion kinds: `must`/`must_not` regex, `writes_outside_scope` (filesystem diff — the scope-creep check), `section_max_words`, `max_occurrences`.
- **`trials/ops-manager-smb/`** — the eight-trap design studio from the v2.3.0 manual trial, now versioned and reproducible, with ground truth computed independently and recorded in the spec.
- **`docs/TRIALS.md`** — methodology, spec reference, and measured results.
- 16 engine unit tests (132 total).

### Methodology, and why it differs from the norm
- **No LLM-as-judge.** Judge style bias is measured at 0.76-0.92 ([arXiv 2604.23178](https://arxiv.org/abs/2604.23178)); a judge would reward a well-written report regardless of whether its numbers were right. All grading is regex or filesystem fact.
- **MUST and MUST_NOT.** Required-only grading misses agents exceeding their mandate — the exact v2.3.0 failure ([arXiv 2607.25398](https://arxiv.org/abs/2607.25398)).
- **pass^k over pass@1.** One success is capability, not reliability; reported gaps reach ~25 points ([arXiv 2603.29231](https://arxiv.org/pdf/2603.29231)).

### Measured
`operations-manager` v2.3.0 at k=3: **15/15 pass^k, 0 flaky**. Negative control (plausible but wrong report + stray file): fails 13/15. Caveats stated in `docs/TRIALS.md` — chiefly that the template was revised after seeing these traps, so a held-out fixture is needed to separate judgement from memorisation.

### Fixed (found while building)
- Grader would have resolved a fixture's **pre-existing** report as the agent's output, handing out free passes when an agent wrote nothing. Artifact selection is now restricted to files the agent created; regression-tested.
- Two assertions passed on garbage in the negative control — `data-age-reported` matched an *invoice* being "60 days old", `followup-status-language` matched "outstanding" in unrelated prose. Both tightened, plus a new `references-prior-report` check.

## 2.3.0 — 2026-08-10

Fixes from a live employment trial: a fixture business with eight planted traps was handed to the `operations-manager`. It caught all eight with fully correct arithmetic — and broke two of its own rules doing it. Those breakages are what this release fixes.

### Fixed
- **Write scope is now a hard boundary.** In the trial the employee created a `.gitignore` it had only been asked to *report*. Every write-capable template now names exactly one folder it may write to and states that "being right about a fix does not authorize you to make it"; anything else goes under **Owner actions** as content for the owner to apply.
- **The impossible length rule is gone.** Templates demanded seven cited sections *and* "under one page", so the model silently dropped the length rule (the trial report ran ~1,180 words). Replaced with a two-part deliverable: a one-screen **Owner Brief** (~250 words, capped and checkable) with unlimited detail below the fold.
- **`(calc — verify)` is capped at three per report**, listed in the brief. The trial produced fifteen markers, which made the one number that gated a money decision indistinguishable from trivia.
- **Ignored priorities now escalate instead of repeating.** Ask once, then force a choice (do it / delegate it / kill it), then drop it and record that.
- **`researcher.md` contradiction fixed** — it was instructed to save findings while its `tools` line granted no `Write`, so saving would have silently failed.

### Added
- **Bash for money-handling employees.** The trial's arithmetic was flawless because the agent computed with a script; the template had denied that tool. Planner-type templates now grant `Bash` and require "compute with a script, never by eye". Trade-off documented in `LIMITATIONS.md`.
- **Standing deadlines table**, keyed to notice dates rather than end dates, regenerated in every report — the trial's hardest trap was a cancellation window that had closed unnoticed.
- **"How to write rules for an employee"** in the hiring guide: six rules derived from this trial, including "never give two rules that can't both be obeyed" and "a rule that fires on work you know is correct is too broad".
- Validator checks: warns when `Write`/`Edit` is granted without a declared write scope, errors when an agent is told to save files but has no `Write` tool. Four new tests (116 total).
- `LIMITATIONS.md` limit 4 rewritten ("nothing fires on its own — the employee has no alarm clock") and limit 3 updated with the Bash evidence.

## 2.2.0 — 2026-08-09

### Added
- **`scripts/validate-agent.js`** — lints a filled agent/employee file for every silent failure mode: leftover `[FILL:]` blanks, missing/vague description (the delegation trigger), non-kebab names, unknown tools, invalid model, oversized or empty body. Wired into the hiring guide as step 5 and covered by 10 new unit tests.
- **`docs/templates/LIMITATIONS.md`** — honest manual of the four structural limits (stale manual data, session amnesia, unreliable arithmetic, probabilistic delegation) with working arrangements for each.
- Templates hardened: ops-manager/planner now follow up on their own previous reports (reports-folder-as-memory), report data age at the top of every deliverable, and mark self-computed figures `(calc — verify)`.
- Confidentiality section in the hiring guide: gitignore `company/` before filling it, reading=sending to the API, feed each employee only what the duty requires. The ops-manager also warns if its knowledge folder is in git unignored.

## 2.1.0 — 2026-08-09

### Added
- **Employee templates** (`docs/templates/`): hire-ready agent archetypes with guided `[FILL: …]` blanks — reviewer, planner, maker, researcher — plus a fully worked `operations-manager` example that reads a company's contracts/sales/expenses from a knowledge folder, restructures the work, and sets priorities. Hiring guide covers the description-as-hiring-trigger rule, salary tiers (model choice), and least-privilege tool presets per job family.
- Stray-doc guard now allowlists `templates/` and `company/` directories (agent knowledge folders).

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
