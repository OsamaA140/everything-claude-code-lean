#!/usr/bin/env node
/**
 * Stop — after each response, warn if git-modified JS/TS files contain console.log.
 */

const fs = require('fs');
const { getGitModifiedFiles, log } = require('../lib/utils');

async function main() {
  const files = getGitModifiedFiles(['\\.(ts|tsx|js|jsx)$']).filter(
    f => !/\.(test|spec)\./.test(f) && fs.existsSync(f)
  );

  let found = false;
  for (const f of files) {
    if (fs.readFileSync(f, 'utf8').includes('console.log')) {
      log('[Hook] console.log found in ' + f);
      found = true;
    }
  }
  if (found) log('[Hook] Remove console.log statements before committing');

  process.exit(0);
}

main().catch(() => process.exit(0));
