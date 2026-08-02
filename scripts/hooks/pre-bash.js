#!/usr/bin/env node
/**
 * PreToolUse:Bash — safety guard + workflow nudges.
 *
 * Exit 2 blocks the tool call (stderr is fed back to Claude);
 * exit 0 with stderr is a non-blocking note.
 */

const { readStdinJson, log } = require('../lib/utils');
const { checkBashCommand } = require('../lib/guards');

const DEV_SERVER_RE = /(npm run dev|pnpm( run)? dev|yarn dev|bun run dev)(\s|$)/;

async function main() {
  const input = await readStdinJson();
  const cmd = (input.tool_input && input.tool_input.command) || '';
  if (!cmd) process.exit(0);

  // Hard safety guard: destructive / irreversible commands
  const guard = checkBashCommand(cmd);
  if (guard.verdict === 'block') {
    log('[Hook] BLOCKED: ' + guard.messages.join('; '));
    process.exit(2);
  }
  if (guard.verdict === 'warn') {
    guard.messages.forEach(m => log('[Hook] Caution: ' + m));
  }

  // Non-blocking: dev servers run forever — suggest backgrounding so logs stay reachable
  if (DEV_SERVER_RE.test(cmd)) {
    log('[Hook] Note: dev servers block the terminal — prefer running them in the background so logs stay accessible.');
  }

  if (/\bgit\s+push\b/.test(cmd)) {
    log('[Hook] Reminder: review the diff before pushing');
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
