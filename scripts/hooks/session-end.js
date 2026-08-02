#!/usr/bin/env node
/**
 * SessionEnd Hook - Persist session state when the session ends
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Creates/updates today's session log and captures a real git snapshot
 * (branch, changed files, recent commits) so the next session's
 * SessionStart hook has something concrete to load.
 */

const path = require('path');
const fs = require('fs');
const {
  getSessionsDir,
  getDateString,
  getTimeString,
  ensureDir,
  readFile,
  writeFile,
  replaceInFile,
  isGitRepo,
  runCommand,
  log
} = require('../lib/utils');

function buildGitSnapshot() {
  if (!isGitRepo()) return null;

  const branch = runCommand('git rev-parse --abbrev-ref HEAD');
  const status = runCommand('git status --porcelain');
  const commits = runCommand('git log --oneline -3');

  const changed = status.success
    ? status.output.split('\n').filter(Boolean).slice(0, 10)
    : [];

  const lines = [`Branch: ${branch.success ? branch.output : 'unknown'}`];
  if (changed.length) {
    lines.push(`Uncommitted changes (${changed.length} shown):`);
    changed.forEach(c => lines.push(`  ${c}`));
  } else {
    lines.push('Working tree clean.');
  }
  if (commits.success && commits.output) {
    lines.push('Recent commits:');
    commits.output.split('\n').forEach(c => lines.push(`  ${c}`));
  }
  return lines.join('\n');
}

async function main() {
  const sessionsDir = getSessionsDir();
  const today = getDateString();
  const sessionFile = path.join(sessionsDir, `${today}-session.tmp`);

  ensureDir(sessionsDir);

  const currentTime = getTimeString();
  const snapshot = buildGitSnapshot();
  const snapshotBlock = snapshot
    ? `\n### Snapshot (auto, ${currentTime})\n\`\`\`\n${snapshot}\n\`\`\`\n`
    : '';

  if (fs.existsSync(sessionFile)) {
    replaceInFile(sessionFile, /\*\*Last Updated:\*\*.*/, `**Last Updated:** ${currentTime}`);
    // Replace previous auto-snapshot rather than stacking them
    const content = readFile(sessionFile) || '';
    const cleaned = content.replace(/\n### Snapshot \(auto[\s\S]*?```\n/g, '');
    writeFile(sessionFile, cleaned + snapshotBlock);
    log(`[SessionEnd] Updated session file: ${sessionFile}`);
  } else {
    const template = `# Session: ${today}
**Date:** ${today}
**Started:** ${currentTime}
**Last Updated:** ${currentTime}

---

## Current State

### Completed
- [ ]

### In Progress
- [ ]

### Notes for Next Session
-
${snapshotBlock}`;

    writeFile(sessionFile, template);
    log(`[SessionEnd] Created session file: ${sessionFile}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[SessionEnd] Error:', err.message);
  process.exit(0);
});
