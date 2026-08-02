---
description: Configure your preferred package manager (npm/pnpm/yarn/bun)
disable-model-invocation: true
---

# /setup-pm — Package Manager Configuration

```bash
node scripts/setup-package-manager.js --detect          # show current detection
node scripts/setup-package-manager.js --global pnpm      # set global default
node scripts/setup-package-manager.js --project bun      # set project default
node scripts/setup-package-manager.js --list             # list available PMs
```

Detection priority: `CLAUDE_PACKAGE_MANAGER` env var → `.claude/package-manager.json` (project) → `package.json` `packageManager` field → lock file present → `~/.claude/package-manager.json` (global) → first available (pnpm > bun > yarn > npm).

Override anytime with `export CLAUDE_PACKAGE_MANAGER=pnpm`.
