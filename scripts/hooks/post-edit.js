#!/usr/bin/env node
/**
 * PostToolUse:Edit|Write — one process for all post-edit checks:
 *   1. Prettier format (JS/TS family; only if prettier is already installed)
 *   2. TypeScript check scoped to the edited file's nearest tsconfig
 *   3. console.log warning (skips test files)
 *
 * Disable individual checks via CLAUDE_HOOKS_DISABLE, e.g.
 *   CLAUDE_HOOKS_DISABLE=tsc,prettier
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readStdinJson, log } = require('../lib/utils');

const disabled = new Set(
  (process.env.CLAUDE_HOOKS_DISABLE || '').split(',').map(s => s.trim()).filter(Boolean)
);

function findUp(startDir, fileName) {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, fileName))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

async function main() {
  const input = await readStdinJson();
  const p = (input.tool_input && input.tool_input.file_path) || '';
  if (!/\.(ts|tsx|js|jsx)$/.test(p) || !fs.existsSync(p)) process.exit(0);

  if (!disabled.has('prettier')) {
    spawnSync('npx', ['--no-install', 'prettier', '--write', p], { stdio: 'ignore' });
  }

  if (!disabled.has('tsc') && /\.(ts|tsx)$/.test(p)) {
    const projectDir = findUp(path.dirname(p), 'tsconfig.json');
    if (projectDir) {
      const r = spawnSync('npx', ['--no-install', 'tsc', '--noEmit', '--pretty', 'false'], {
        cwd: projectDir,
        encoding: 'utf8'
      });
      const outText = (r.stdout || '') + (r.stderr || '');
      const lines = outText
        .split('\n')
        .filter(l => l.includes(path.basename(p)))
        .slice(0, 10);
      if (lines.length) log('[Hook] tsc: ' + lines.join('\n'));
    }
  }

  if (!disabled.has('consolelog') && !/\.(test|spec)\./.test(p)) {
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    const hits = [];
    lines.forEach((l, idx) => {
      if (/console\.log/.test(l)) hits.push(`${idx + 1}: ${l.trim()}`);
    });
    if (hits.length) {
      log('[Hook] console.log found in ' + p);
      hits.slice(0, 5).forEach(m => log(m));
      log('[Hook] Remove console.log before committing');
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
