#!/usr/bin/env node
/**
 * PreToolUse:Write|Edit — block secret leaks and stray doc files.
 *
 * - Scans the content being written (Write.content / Edit.new_string) for
 *   credentials; blocks high-confidence hits, warns on likely ones.
 * - Blocks creation of stray .md/.txt files outside sanctioned names/dirs
 *   (Write only — editing an existing doc is fine).
 */

const { readStdinJson, log } = require('../lib/utils');
const { scanForSecrets, isStrayDocFile } = require('../lib/guards');

async function main() {
  const input = await readStdinJson();
  const toolName = input.tool_name || '';
  const ti = input.tool_input || {};
  const filePath = ti.file_path || '';

  const payload = toolName === 'Write' ? ti.content : ti.new_string;
  if (payload) {
    const scan = scanForSecrets(payload, filePath);
    if (scan.blocks.length) {
      const what = scan.blocks.map(b => `${b.name} (line ${b.line})`).join(', ');
      log(`[Hook] BLOCKED: possible secret in ${filePath || 'content'}: ${what}`);
      log('[Hook] Use environment variables instead (e.g. process.env.MY_KEY); never commit literals.');
      process.exit(2);
    }
    if (scan.warns.length) {
      const what = scan.warns.map(w => `${w.name} (line ${w.line})`).join(', ');
      log(`[Hook] Caution: ${what} in ${filePath || 'content'} — confirm this is not a real credential`);
    }
  }

  if (toolName === 'Write' && isStrayDocFile(filePath)) {
    log(`[Hook] BLOCKED: stray doc file ${filePath} — consolidate into README.md or docs/`);
    process.exit(2);
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
