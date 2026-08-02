#!/usr/bin/env node
/**
 * PostToolUse:Bash — surface the PR URL after `gh pr create`.
 */

const { readStdinJson, log } = require('../lib/utils');

async function main() {
  const input = await readStdinJson();
  const cmd = (input.tool_input && input.tool_input.command) || '';
  if (!/gh pr create/.test(cmd)) process.exit(0);

  const out = JSON.stringify(input.tool_response || '');
  const m = out.match(/https:\/\/github\.com\/[^/"\\]+\/[^/"\\]+\/pull\/\d+/);
  if (m) {
    log('[Hook] PR created: ' + m[0]);
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
