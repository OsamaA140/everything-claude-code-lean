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
pass^k (every run):     14/15
pass@k (at least once): 15/15
flaky (inconsistent):    1  -> owner-brief-fits-one-screen
```

**All thirteen judgement assertions held 3/3** on a business it had never seen: the closed notice window (a date nobody could recall — 2026-08-14, from a 45-day term), the 55-day receivable correctly *not* escalated as 60+, the +63.3% insurance spike, the profit-versus-cash distinction, the still-open FreshLine gate, the owner's equipment-purchase law, and the write-scope boundary. That is generalisation, not recall.

**The single failure is the one soft rule in the template.** The Owner Brief word budget held in runs 1 and 3 (232 and 255 words) and broke in run 2 (352 words, against a stated ~250 and a graded cap of 300). The pattern is worth naming: *checkable facts generalised perfectly; a stylistic budget did not.* Models comply with structural constraints ("at most three bullets") far more reliably than with numeric prose budgets.

**This is precisely the failure a single run would have hidden.** pass@k reads 15/15 — flawless. pass^k reads 14/15 — the truth. The original manual trial was k=1 and would have reported the flawless number. That is the ~25-point pass@k↔pass^k gap from the literature, reproduced at small scale in this repo.

**The fix is deliberately deferred.** Revising the template in response to this fixture would convert the held-out set into another memorisation test. A third fixture is required to validate any change to the length rule.

**Two caveats remain on both results.** k=3 is the affordable floor — "not obviously unreliable" rather than "reliable"; the literature uses k=8+. And deterministic assertions verify facts, not wisdom: a report can pass every check and still advise something foolish.

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
