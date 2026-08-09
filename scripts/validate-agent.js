#!/usr/bin/env node
/**
 * Validate a filled agent/employee file before hiring it.
 *
 * Catches the silent failure modes: leftover [FILL:] markers, a description
 * Claude will never delegate to, missing/invalid frontmatter, oversized
 * bodies, and tool lists that don't exist.
 *
 * Usage:
 *   node scripts/validate-agent.js path/to/agent.md [more.md ...]
 *
 * Exit 0 = all files pass (warnings allowed), 1 = at least one error.
 */

const fs = require('fs');

const KNOWN_TOOLS = new Set([
  'Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob',
  'WebSearch', 'WebFetch', 'Task', 'NotebookEdit'
]);
const KNOWN_MODELS = new Set(['haiku', 'sonnet', 'opus', 'inherit']);
const BODY_WARN_LINES = 80;
const BODY_MAX_LINES = 150;

function validate(file) {
  const errors = [];
  const warns = [];

  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    return { file, errors: ['cannot read file'], warns };
  }

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) {
    return { file, errors: ['missing frontmatter block (--- ... ---) at the top'], warns };
  }
  const [, fmRaw, body] = fmMatch;
  const fm = {};
  for (const line of fmRaw.split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }

  // Leftover template blanks anywhere = not finished being filled
  const fills = content.match(/\[FILL:[^\]]*\]/g) || [];
  if (fills.length) {
    errors.push(`${fills.length} unfilled [FILL: ...] blank(s) remain — first: ${fills[0].slice(0, 60)}`);
  }
  if (/\[OWNER: confirm\]/.test(fmRaw)) {
    errors.push('[OWNER: confirm] marker in frontmatter');
  }

  // name
  if (!fm.name) errors.push('frontmatter: missing "name"');
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.name)) {
    errors.push(`frontmatter: name "${fm.name}" must be kebab-case (e.g. operations-manager)`);
  }

  // description — the hiring trigger
  if (!fm.description) {
    errors.push('frontmatter: missing "description" — Claude will never delegate to this agent');
  } else {
    if (fm.description.length < 40) {
      warns.push('description under 40 chars — likely too vague for reliable delegation');
    }
    if (!/use proactively/i.test(fm.description)) {
      warns.push('description has no "Use PROACTIVELY when ..." — agent will only run when named explicitly');
    }
  }

  // tools
  if (fm.tools) {
    const tools = fm.tools.split(',').map(t => t.trim()).filter(Boolean);
    const unknown = tools.filter(t => !KNOWN_TOOLS.has(t));
    if (unknown.length) errors.push(`frontmatter: unknown tool(s): ${unknown.join(', ')}`);
    if (tools.includes('Bash') && /review|check|audit/i.test(fm.name || '')) {
      warns.push('a reviewer-type agent with Bash access — confirm it really needs to execute commands');
    }
  } else {
    warns.push('no "tools" line — agent inherits ALL tools; set an explicit least-privilege list');
  }

  // model
  if (fm.model && !KNOWN_MODELS.has(fm.model)) {
    errors.push(`frontmatter: model "${fm.model}" — use haiku, sonnet, or opus`);
  }

  // body size (loads on every invocation)
  const bodyLines = body.split('\n').length;
  if (bodyLines > BODY_MAX_LINES) {
    errors.push(`body is ${bodyLines} lines (max ${BODY_MAX_LINES}) — move detail into the knowledge folder`);
  } else if (bodyLines > BODY_WARN_LINES) {
    warns.push(`body is ${bodyLines} lines (recommended <= ${BODY_WARN_LINES}) — every line loads on each invocation`);
  }
  if (body.trim().length < 100) {
    errors.push('body is nearly empty — the agent has no instructions to work from');
  }

  return { file, errors, warns };
}

function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('usage: node scripts/validate-agent.js <agent.md> [...]');
    process.exit(1);
  }

  let failed = false;
  for (const f of files) {
    const { errors, warns } = validate(f);
    const status = errors.length ? 'FAIL' : warns.length ? 'PASS (with warnings)' : 'PASS';
    console.log(`${errors.length ? '✗' : '✓'} ${f}: ${status}`);
    errors.forEach(e => console.log(`    ERROR: ${e}`));
    warns.forEach(w => console.log(`    warn:  ${w}`));
    if (errors.length) failed = true;
  }
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();
module.exports = { validate };
