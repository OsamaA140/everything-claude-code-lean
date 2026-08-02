#!/usr/bin/env node
/**
 * Context-cost benchmark for Claude Code config repos.
 *
 * Measures two things per repo, with identical methodology:
 *   1. always-on tokens  — metadata injected into every session:
 *      agent descriptions, skill/command names + descriptions, and the full
 *      text of rules/ (rules are loaded verbatim each session when installed).
 *   2. on-invoke tokens  — the full file body loaded when a component is used.
 *
 * Token estimate: ceil(chars / 4) — the common BPE average for English +
 * markdown. The absolute numbers are estimates; the *ratio* between repos is
 * robust because the same estimator runs on both sides.
 *
 * Usage:
 *   node scripts/benchmark.js                     # this repo only
 *   node scripts/benchmark.js /path/to/other-repo # side-by-side comparison
 *   node scripts/benchmark.js --markdown          # emit a markdown report
 */

const fs = require('fs');
const path = require('path');

const tokens = text => Math.ceil((text || '').length / 4);

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

function listFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isFile() && p.endsWith(ext)) out.push(p);
    else if (entry.isDirectory()) out.push(...listFiles(p, ext));
  }
  return out;
}

function measureRepo(root) {
  const read = p => fs.readFileSync(p, 'utf8');
  const result = {
    root,
    name: path.basename(root),
    agents: { count: 0, alwaysOn: 0, onInvoke: 0 },
    skills: { count: 0, alwaysOn: 0, onInvoke: 0 },
    commands: { count: 0, alwaysOn: 0, onInvoke: 0 },
    rules: { count: 0, alwaysOn: 0, onInvoke: 0 }
  };

  for (const f of listFiles(path.join(root, 'agents'), '.md')) {
    const c = read(f);
    const fm = parseFrontmatter(c);
    result.agents.count++;
    // name + description are injected into every session's agent list
    result.agents.alwaysOn += tokens(`${fm.name || ''}: ${fm.description || ''}`);
    result.agents.onInvoke += tokens(c);
  }

  for (const f of listFiles(path.join(root, 'skills'), '.md')) {
    if (path.basename(f) !== 'SKILL.md') continue;
    const c = read(f);
    const fm = parseFrontmatter(c);
    result.skills.count++;
    result.skills.alwaysOn += tokens(`${fm.name || ''}: ${fm.description || ''}`);
    result.skills.onInvoke += tokens(c);
  }

  for (const f of listFiles(path.join(root, 'commands'), '.md')) {
    const c = read(f);
    const fm = parseFrontmatter(c);
    result.commands.count++;
    result.commands.alwaysOn += tokens(
      `${path.basename(f, '.md')}: ${fm.description || ''}`
    );
    result.commands.onInvoke += tokens(c);
  }

  for (const f of listFiles(path.join(root, 'rules'), '.md')) {
    const c = read(f);
    result.rules.count++;
    // rules load verbatim every session when installed to ~/.claude/rules
    result.rules.alwaysOn += tokens(c);
    result.rules.onInvoke += tokens(c);
  }

  result.totalAlwaysOn = ['agents', 'skills', 'commands', 'rules'].reduce(
    (s, k) => s + result[k].alwaysOn,
    0
  );
  result.totalOnInvoke = ['agents', 'skills', 'commands', 'rules'].reduce(
    (s, k) => s + result[k].onInvoke,
    0
  );
  return result;
}

function fmt(n) {
  return n.toLocaleString('en-US');
}

function report(results, markdown) {
  const lines = [];
  const kinds = ['agents', 'skills', 'commands', 'rules'];

  if (markdown) {
    lines.push('| repo | component | count | always-on tok | on-invoke tok (all) | avg on-invoke |');
    lines.push('|---|---|---:|---:|---:|---:|');
    for (const r of results) {
      for (const k of kinds) {
        if (!r[k].count) continue;
        lines.push(
          `| ${r.name} | ${k} | ${r[k].count} | ${fmt(r[k].alwaysOn)} | ${fmt(r[k].onInvoke)} | ${fmt(Math.round(r[k].onInvoke / r[k].count))} |`
        );
      }
      lines.push(`| **${r.name}** | **total** | | **${fmt(r.totalAlwaysOn)}** | **${fmt(r.totalOnInvoke)}** | |`);
    }
  } else {
    for (const r of results) {
      lines.push(`\n=== ${r.name} (${r.root}) ===`);
      for (const k of kinds) {
        if (!r[k].count) continue;
        lines.push(
          `  ${k.padEnd(9)} ${String(r[k].count).padStart(4)}  always-on ${fmt(r[k].alwaysOn).padStart(9)}  on-invoke ${fmt(r[k].onInvoke).padStart(10)}  avg ${fmt(Math.round(r[k].onInvoke / r[k].count)).padStart(7)}`
        );
      }
      lines.push(`  TOTAL always-on: ${fmt(r.totalAlwaysOn)} tok   on-invoke (sum of all bodies): ${fmt(r.totalOnInvoke)} tok`);
    }
  }

  if (results.length === 2) {
    const [a, b] = results;
    const ratio = x => (x === 0 ? 'n/a' : Math.round((1 - a.totalAlwaysOn / x) * 100));
    lines.push('');
    lines.push(
      `${a.name} vs ${b.name}: always-on ${fmt(a.totalAlwaysOn)} vs ${fmt(b.totalAlwaysOn)} tok ` +
        `(${ratio(b.totalAlwaysOn)}% less), ` +
        `on-invoke total ${fmt(a.totalOnInvoke)} vs ${fmt(b.totalOnInvoke)} tok ` +
        `(${Math.round((1 - a.totalOnInvoke / b.totalOnInvoke) * 100)}% less)`
    );
  }
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const markdown = args.includes('--markdown');
  const others = args.filter(a => a !== '--markdown');

  const selfRoot = path.resolve(__dirname, '..');
  const results = [measureRepo(selfRoot), ...others.map(p => measureRepo(path.resolve(p)))];

  console.log(report(results, markdown));
}

main();
