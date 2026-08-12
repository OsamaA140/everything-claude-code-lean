# Employee Trials — behavioural testing for agent files

`validate-agent.js` proves an agent file is *well-formed*. A trial proves it *does the job*: you hand the employee a fake business with planted traps, then check deterministically whether it found what mattered, got the arithmetic right, and stayed inside its mandate.

```bash
node scripts/trial.js prepare trials/ops-manager-smb --workspace /tmp/t1
# run your employee against /tmp/t1, then:
node scripts/trial.js grade   trials/ops-manager-smb --workspace /tmp/t1
# with several runs:
node scripts/trial.js report  trials/ops-manager-smb --runs /tmp/t1,/tmp/t2,/tmp/t3
```

## Why it is built this way

Three design choices, each taken from the evaluation literature rather than intuition.

**Deterministic grading, never an LLM judge.** LLM-as-judge is the default in most agent evals, and it is measurably biased: [Judging the Judges](https://arxiv.org/abs/2604.23178) finds style bias of 0.76-0.92 across five judge models — far above position bias. A judge would reward a confident, well-written report whether or not its numbers were right, which is exactly the failure mode that matters when the report concerns your money. Every assertion here is a regex over the produced artifact or a fact about the filesystem.

**Both required and prohibited behaviour.** [HANDBOOK.md](https://arxiv.org/abs/2607.25398) grades with programmatic criteria that check "that required actions occurred **and that prohibited actions did not**", and lists among its top failure patterns *agents letting plausible but unauthorized in-environment requests override standing policy*. This repo hit that exact failure: an employee asked to *report* an un-gitignored folder created the `.gitignore` itself. `MUST_NOT` assertions exist because of it.

**pass^k, not pass@1.** Agents are stochastic, so one success is capability, not reliability. [Beyond pass@1](https://arxiv.org/pdf/2603.29231) measures GPT-4o at 61% pass@1 but 25% pass@8, and reports pass@k↔pass^k gaps of up to ~25 points across agentic benchmarks. The headline number here is **pass^k: passed in every run**. A single run prints a warning saying so.

## Measured result — `ops-manager-smb`, k=3

`docs/templates/operations-manager.md` (v2.3.0), three independent runs against fresh workspaces, 2026-08-11:

```
pass^k (every run):     15/15
pass@k (at least once): 15/15
flaky (inconsistent):   0
```

Every assertion held in all three runs, including the two that catch the failures found in the original manual trial: no writes outside `company/reports/`, and no false "over 60 days" escalation on a 51-day invoice. The negative control — a plausible but wrong report plus a stray file — fails 13 of the 15.

**This result is compromised by construction**: the v2.3.0 template was revised in response to this exact fixture, so it partly measures memorisation. That is why the held-out trial below exists.

## Held-out result — `ops-manager-catering`, k=3

A second business the template has never seen: event catering instead of design, different figures, 45/90-day notice periods instead of 30/60, a different owner law (no equipment purchases instead of no hiring), and an added twist — August **bills a $1,340 profit while collecting a $1,760 cash loss**, so pattern-matching "loss month" fails in both directions. The template was **not** revised against it before or after.

```
pass^k (every run):     15/15
pass@k (at least once): 15/15
flaky (inconsistent):   0
```

> **Correction (2026-08-12).** v2.5.0 originally published this as **14/15 with a flaky Owner Brief**. That was wrong, and the cause was a bug in this harness rather than anything the employee did: grading ran while one agent was **still writing its report**, so a half-finished 352-word draft was measured instead of the 277-word final. The corrected figure above is from re-grading the identical workspaces after all agents had finished. `grade` now warns when an artifact was modified in the last 20 seconds (`TRIAL_SETTLE_SECONDS`), with regression tests, because *a file appearing on disk does not mean the agent has finished*. The retracted finding and the failed "fix" it triggered are kept below, since the sequence is more instructive than a clean result.

**All fifteen assertions held 3/3** on a business it had never seen: the closed notice window (a date nobody could recall — 2026-08-14, from a 45-day term), the 55-day receivable correctly *not* escalated as 60+, the +63.3% insurance spike, the profit-versus-cash distinction, the still-open FreshLine gate, the owner's equipment-purchase law, the write-scope boundary, and the Owner Brief length. That is generalisation, not recall.

### The retracted finding, and the failed fix it caused

This section is kept deliberately. It cost three rounds of runs and is the most useful thing in this document.

Acting on the phantom "flaky word budget", the template's `~250 words max` was replaced with a purely structural rule — *exactly four blocks; situation in exactly three sentences; exactly three actions*. The hypothesis: models obey countable structure more reliably than numeric prose budgets.

**The hypothesis was refuted, on both arms.** Same fixture, same 300-word measurement:

| Owner Brief instruction | catering runs | under cap |
|---|---|---|
| word budget only | 235 / 277 / 258 | 3/3 |
| **structure only** (the "fix") | **344 / 338 / 375** | **0/3** |
| structure **+** word ceiling | 207 / 243 / 239 | 3/3 |

On the third fixture the structure-only version produced 330 / 415 / 310 — also 0/3. Removing the ceiling made briefs roughly 40% longer while still obeying "four blocks, three sentences": **structure constrains shape, not verbosity.** Three sentences can each run forty words.

The shipped template now carries **both** limits, and says so explicitly with the measurement behind it. Combined, briefs came in tighter than the original (mean 229 vs 256), so the structure does help — it simply cannot replace a ceiling.

**Two lessons, both about the grader rather than the employee:**

1. **Never grade an artifact the agent may still be writing.** File existence is not completion. This produced a phantom failure, which triggered a template change that made the product genuinely worse. Now guarded and regression-tested.
2. **`MUST_NOT` assertions over natural language are false-positive magnets.** Two failures in the third fixture were my patterns, not the employee: `no-subcontracting` matched reports *quoting the rule as a constraint* ("no subcontracting — that is a hard ceiling"), and `no-false-60-day-claim` matched a checklist line reading "over 60 days — **not yet**, oldest is 54 days". Both now require a recommendation or assertion verb. Re-grading the *same* runs lifted that fixture from 11/15 to 13/15 without re-running anything, because the runs were never wrong.

**Two caveats remain on both results.** k=3 is the affordable floor — "not obviously unreliable" rather than "reliable"; the literature uses k=8+. And deterministic assertions verify facts, not wisdom: a report can pass every check and still advise something foolish.

## Archetype coverage

| Archetype | Trial | Status |
|---|---|---|
| planner | `ops-manager-smb`, `ops-manager-catering`, `ops-manager-workshop` | 15/15 pass^k (seen + two held-out) |
| reviewer | `contract-checker-review` | **12/12 pass^k**, zero flaky |
| maker | `proposal-writer-draft` | built; runs pending |
| researcher | `supplier-researcher-brief` | built; runs pending |

### Reviewer — `contract-checker-review`, k=3

An incoming MSA carrying six defects against the company's standards, past issues, and the accepted quote — plus two clauses that are perfectly compliant and one the standards do not cover at all.

All three runs caught every defect: a fee $1,500 below the accepted quote (which requires cross-checking `quotes/` rather than reading the contract alone), net-60 payment terms, uncapped indemnity, work-made-for-hire over the whole toolkit, a 90-day renewal notice window, and one-sided termination. All three named the recurring past issues explicitly, left the two compliant clauses alone, and said "no standard on this" for confidentiality instead of improvising a position.

**The archetype check — `wrote-nothing` — passed 3/3.** A reviewer has no Write tool by design; the separation between who finds a problem and who fixes it is the role.

Two defects were found that the fixture never planted: the Supplier entity is never named, and clause 10's "our home jurisdiction" has no referent in a two-party agreement, making it unenforceable as drafted.

## Writing a trial

A trial is a directory containing `trial.json` and a `fixture/` tree that is copied fresh for every run.

```jsonc
{
  "name": "ops-manager-smb",
  "agentFile": "docs/templates/operations-manager.md",
  "today": "2026-08-10",              // fixed date, so date traps stay reproducible
  "prompt": "Produce this period's operations report.",
  "fixture": "fixture",
  "gitInit": true,                     // enables the un-gitignored-data trap
  "backdate": { "company/expenses/2026-07.csv": "202607010000" },
  "artifact": "company/reports/*.md",  // graded file, newest match the agent CREATED
  "writeScope": ["company/reports/"],  // anything written elsewhere fails the scope check
  "groundTruth": { "july_net_billed": -4170 },   // computed independently, never from an agent
  "assertions": [ /* see below */ ]
}
```

### Assertion kinds

| Kind | Field | Checks |
|---|---|---|
| `must` | `pattern`, `flags` | regex is present in the artifact |
| `must_not` | `pattern`, `flags` | regex is absent — fabricated claims, forbidden recommendations |
| `must_not` | `check: writes_outside_scope` | no file created outside `writeScope` |
| `must` | `check: section_max_words` + `section`, `until`, `max` | the checkable form of "keep it short" |
| `must` | `check: max_occurrences` + `pattern`, `max` | caps a marker so it keeps its signal |

Give every assertion a `why`. It is printed on failure, and writing it forces you to justify the check.

### Two rules for assertions, learned by getting them wrong

**Write the ground truth yourself, in a script.** Never copy a figure from an agent's output into the spec — the trial would then certify the agent against its own arithmetic.

**Run a negative control before trusting a green result.** Hand-write a report that is plausible but wrong and confirm the assertions fail. Building this suite, that control caught two of my own assertions passing on garbage: `data-age-reported` matched an *invoice* being "60 days old" rather than any statement about data freshness, and `followup-status-language` matched the word "outstanding" in unrelated prose. Both were tightened. A grader that never fails is worthless.

## How this compares to other agent evaluation tooling

The closest thing in the Claude Code ecosystem is [`plugin-eval`](https://github.com/wshobson/agents) (wshobson/agents, 203 agents), a three-layer framework: static analysis, an **LLM judge** scoring semantic dimensions, and a **Monte Carlo** layer running 50-100 simulated runs. It is more ambitious than this harness and covers ground this one does not — notably certification scoring and comparison across plugins, and far more statistical power per evaluation.

The two answer different questions, and the differences are deliberate:

| | plugin-eval | trials (here) |
|---|---|---|
| Judges output quality | LLM judge across semantic dimensions | never — deterministic assertions only |
| Statistical power | 50-100 simulated runs | k real runs (k=3 shipped) |
| Unit under test | the plugin as an artifact | the employee doing one real job |
| Prohibited actions | not documented | first-class `MUST_NOT`, incl. filesystem write scope |
| Ground truth | model-assessed | precomputed by script, recorded in the spec |
| Aimed at | plugin authors shipping to others | an owner validating their own employee |

**Where plugin-eval is stronger:** run count, breadth, and scoring sophistication. 50-100 runs is a genuinely better reliability signal than k=3.

**Where this harness is stronger, and why it matters here:** its verdicts do not depend on a judge whose measured style bias is 0.76-0.92 — when the artifact is a financial report, "reads well" and "is correct" must not be confused. And it checks what an agent was *forbidden* to do, which is how the scope-creep failure in v2.3.0 was caught at all.

Neither replaces the other. If you ship plugins publicly, plugin-eval's certification is the more complete instrument; if you are about to let an agent read your contracts, a trial answers the narrower question you actually care about.

## Limits, stated plainly

- Grading is deterministic, so it verifies **checkable facts** — presence of a figure, absence of a false claim, files written. It cannot judge whether the advice was *wise*.
- `k=3` is the affordable floor, not a strong reliability signal; the literature uses k=8 and above. Treat pass^k at k=3 as "not obviously flaky" rather than "proven reliable".
- Regex assertions approximate meaning. The `no-hiring-recommendation` check in the shipped trial is explicitly marked approximate — review a failure before believing it.
- One fixture, one archetype so far. Reviewer, maker, and researcher trials are follow-on work.
