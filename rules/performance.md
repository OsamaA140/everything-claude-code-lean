# Performance Optimization

## Model Selection
- **Haiku** — high-frequency, lightweight agents/pair-programming (cheapest).
- **Sonnet** — main development work, multi-agent orchestration.
- **Opus** — architectural decisions, deep research, maximum-reasoning tasks.

## Context Window
Avoid starting large refactors or multi-file features in the last ~20% of context — start a fresh session/compact first. Low-context-sensitivity tasks (single-file edits, docs, simple fixes) are fine anywhere.

## Deep Reasoning
For hard problems: enable extended thinking, use Plan Mode, and consider multiple critique passes or split-role sub-agents before committing to an approach.

## Build Issues
Hand off to `build-error-resolver`; fix incrementally and re-verify after each change.
