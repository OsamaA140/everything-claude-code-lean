# Context-Cost Benchmark

Measured with [`scripts/benchmark.js`](../scripts/benchmark.js) — a dependency-free script that runs the **identical methodology on both repos**, so the ratios are robust even though absolute token counts are estimates (`ceil(chars / 4)`, the common BPE average for English/markdown).

**What is measured:**

- **always-on** — metadata injected into every session: agent/skill/command names + descriptions, plus the full text of `rules/` (rules load verbatim each session when installed).
- **on-invoke** — the full file body loaded when a component is actually used.

## Results

Measured 2026-08-02. This repo v2.0.1 vs upstream [affaan-m/ECC](https://github.com/affaan-m/ECC) @ `e4e4163` (2026-07-29), full checkout.

| repo | component | count | always-on tok | on-invoke tok (all) | avg on-invoke |
|---|---|---:|---:|---:|---:|
| **this fork** | agents | 9 | 510 | 5,611 | **623** |
| | skills | 11 | 367 | 5,009 | **455** |
| | commands | 15 | 164 | 2,830 | **189** |
| | rules | 8 | 1,404 | 1,404 | 176 |
| | **total** | | **2,445** | **14,854** | |
| **upstream ECC** | agents | 67 | 3,784 | 107,534 | 1,605 |
| | skills | 281 | 15,432 | 619,149 | 2,203 |
| | commands | 94 | 2,838 | 91,193 | 970 |
| | rules | 122 | 71,071 | 71,071 | 583 |
| | **total** | | **93,125** | **888,947** | |

**Per-invocation, like for like:**

| component | this fork avg | upstream avg | reduction |
|---|---:|---:|---:|
| agent | 623 tok | 1,605 tok | **61% less** |
| skill | 455 tok | 2,203 tok | **79% less** |
| command | 189 tok | 970 tok | **81% less** |

## Honest caveats

1. **Upstream is not meant to be fully installed.** ECC ships as a marketplace of plugins; a typical user enables a subset. The total-row comparison is "everything vs everything" as checked out — the *per-component averages* are the fairer number, and they still show 61-81% reduction.
2. **Feature scope differs.** Upstream (67 agents, 281 skills) covers far more ground than this fork (9 agents, 26 skills/commands). This fork's bet is that a small, dense core covers daily development work; upstream's bet is breadth. Both are valid — this benchmark quantifies the cost side of that trade only.
3. **Token counts are estimates.** `chars/4` under- or over-counts specific files, but both repos are measured identically, so the ratios hold. Claude Code's own `plugin details` reports ~1,261 always-on tokens for this plugin — consistent with the 1,041 metadata estimate here (rules excluded, since the plugin doesn't auto-install rules).
4. **Hooks cost 0 in both repos** — they run in the harness, not the model, and are excluded from all numbers above.

## Reproduce it yourself

```bash
git clone https://github.com/OsamaA140/everything-claude-code-lean && cd everything-claude-code-lean
git clone --depth 1 https://github.com/affaan-m/ECC /tmp/upstream-ecc
node scripts/benchmark.js /tmp/upstream-ecc
```
