#!/usr/bin/env node
/**
 * Employee trial harness — behavioural testing for agent files.
 *
 * Validates that an agent *does the job*, where validate-agent.js only checks
 * that the file is well-formed. A trial is a fixture (a fake business with
 * planted traps) plus deterministic assertions over what the agent produced.
 *
 * Design, and why:
 *
 *  - **Deterministic grading, never an LLM judge.** LLM judges show style bias
 *    of 0.76-0.92 (arXiv 2604.23178), so they reward a well-written report
 *    regardless of whether its numbers are right. Every assertion here is a
 *    regex or a filesystem fact.
 *  - **MUST and MUST_NOT.** Checking only required behaviour misses the failure
 *    mode where an agent helpfully exceeds its mandate (arXiv 2607.25398).
 *  - **pass^k, not pass@1.** Agents are stochastic; success once is not
 *    reliability. Reported gaps between pass@k and pass^k reach ~25 points
 *    (arXiv 2603.29231), so the headline number here is "passed in every run".
 *
 * Usage:
 *   node scripts/trial.js prepare <trial-dir> [--workspace <dir>]
 *   node scripts/trial.js grade   <trial-dir> --workspace <dir> [--json]
 *   node scripts/trial.js report  <trial-dir> --runs <dir1,dir2,...>
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------- fixtures

function loadSpec(trialDir) {
  const specPath = path.join(trialDir, 'trial.json');
  if (!fs.existsSync(specPath)) throw new Error(`no trial.json in ${trialDir}`);
  return JSON.parse(fs.readFileSync(specPath, 'utf8'));
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

/** Build a clean workspace from the fixture: copy files, backdate, git init. */
function prepare(trialDir, spec, workspace) {
  fs.rmSync(workspace, { recursive: true, force: true });
  copyDir(path.join(trialDir, spec.fixture || 'fixture'), workspace);

  // Backdating is how "stale data" traps are planted reproducibly.
  for (const [rel, stamp] of Object.entries(spec.backdate || {})) {
    const target = path.join(workspace, rel);
    if (fs.existsSync(target)) execFileSync('touch', ['-t', stamp, target]);
  }

  if (spec.gitInit) {
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: workspace });
  }

  // Snapshot the file list so grading can detect writes outside the agent's scope.
  fs.writeFileSync(
    path.join(workspace, '.trial-baseline.json'),
    JSON.stringify({ files: listFiles(workspace) }, null, 2)
  );
  return workspace;
}

function listFiles(root, base = root, out = []) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === '.trial-baseline.json') continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) listFiles(full, base, out);
    else out.push(path.relative(base, full));
  }
  return out.sort();
}

// ---------------------------------------------------------------- grading

/**
 * Resolve the graded artifact. Minimal glob ("dir/*.md"), newest match wins,
 * restricted to files the agent created when a newFiles list is supplied.
 */
function findArtifact(workspace, globish, newFiles = null) {
  const [dir, pattern] = [path.dirname(globish), path.basename(globish)];
  const abs = path.join(workspace, dir);
  if (!fs.existsSync(abs)) return null;
  const re = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
  const matches = fs
    .readdirSync(abs)
    .filter(f => re.test(f))
    .filter(f => !newFiles || newFiles.includes(path.join(dir, f)))
    .map(f => ({ f, m: fs.statSync(path.join(abs, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return matches.length ? path.join(abs, matches[0].f) : null;
}

function sectionWords(text, from, to) {
  const start = text.indexOf(from);
  if (start === -1) return null;
  const rest = text.slice(start + from.length);
  const end = to ? rest.indexOf(to) : -1;
  const body = end === -1 ? rest : rest.slice(0, end);
  return body.split(/\s+/).filter(Boolean).length;
}

function evaluateAssertion(a, ctx) {
  const { artifactText, newFiles } = ctx;

  // Filesystem: did the agent create anything outside its declared write scope?
  if (a.check === 'writes_outside_scope') {
    const scope = ctx.writeScope || [];
    const violations = newFiles.filter(f => !scope.some(s => f.startsWith(s)));
    return {
      passed: violations.length === 0,
      detail: violations.length ? `wrote outside scope: ${violations.join(', ')}` : 'no out-of-scope writes'
    };
  }

  // Section length: the checkable replacement for "keep it short".
  if (a.check === 'section_max_words') {
    const n = sectionWords(artifactText, a.section, a.until);
    if (n === null) return { passed: false, detail: `section "${a.section}" not found` };
    return { passed: n <= a.max, detail: `${n} words (max ${a.max})` };
  }

  // Occurrence cap: e.g. at most 3 "(calc — verify)" markers.
  if (a.check === 'max_occurrences') {
    const re = new RegExp(a.pattern, 'g' + (a.flags || ''));
    const n = (artifactText.match(re) || []).length;
    return { passed: n <= a.max, detail: `${n} occurrences (max ${a.max})` };
  }

  // Default: regex over the produced artifact.
  const re = new RegExp(a.pattern, a.flags || '');
  const found = re.test(artifactText);
  const wantFound = a.kind !== 'must_not';
  return {
    passed: found === wantFound,
    detail: found ? 'matched' : 'not found'
  };
}

function grade(trialDir, spec, workspace) {
  const baselinePath = path.join(workspace, '.trial-baseline.json');
  const baseline = fs.existsSync(baselinePath)
    ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')).files
    : [];
  const newFiles = listFiles(workspace).filter(f => !baseline.includes(f));

  // The artifact must be something the agent PRODUCED. Fixtures often ship a
  // previous report; grading that by mistake would hand out free passes when
  // the agent wrote nothing at all.
  const artifactPath = spec.artifact ? findArtifact(workspace, spec.artifact, newFiles) : null;
  const artifactText = artifactPath ? fs.readFileSync(artifactPath, 'utf8') : '';

  // Guard against grading a half-written artifact. A file appearing on disk does
  // NOT mean the agent has finished — it may still be revising. Grading during
  // that window produced a phantom "flaky" result in this repo's own history.
  const settleSeconds = Number(process.env.TRIAL_SETTLE_SECONDS || 20);
  let unsettled = false;
  if (artifactPath) {
    const ageSeconds = (Date.now() - fs.statSync(artifactPath).mtimeMs) / 1000;
    if (ageSeconds < settleSeconds) {
      unsettled = true;
      console.error(
        `[trial] WARNING: ${path.basename(artifactPath)} was modified ${ageSeconds.toFixed(0)}s ago ` +
          `(< ${settleSeconds}s). The agent may still be writing. Re-grade once it has finished; ` +
          `results from a partial artifact are meaningless.`
      );
    }
  }

  const ctx = { artifactText, newFiles, writeScope: spec.writeScope || [] };

  const results = (spec.assertions || []).map(a => {
    // Filesystem assertions are gradeable even when the agent produced nothing;
    // every other kind needs an artifact to inspect.
    const needsArtifact = a.check !== 'writes_outside_scope';
    const r =
      needsArtifact && !artifactText
        ? { passed: false, detail: 'no artifact produced' }
        : evaluateAssertion(a, ctx);
    return { id: a.id, kind: a.kind || 'must', why: a.why || '', ...r };
  });

  return {
    trial: spec.name,
    workspace,
    artifact: artifactPath ? path.relative(workspace, artifactPath) : null,
    unsettled,
    newFiles,
    results,
    passed: results.filter(r => r.passed).length,
    total: results.length
  };
}

// ---------------------------------------------------------------- reporting

/** pass@k = passed in at least one run; pass^k = passed in every run. */
function aggregate(runs) {
  const ids = runs[0].results.map(r => r.id);
  return ids.map(id => {
    const per = runs.map(run => run.results.find(r => r.id === id));
    const passes = per.filter(r => r && r.passed).length;
    return {
      id,
      kind: per[0].kind,
      why: per[0].why,
      passes,
      k: runs.length,
      passAtK: passes > 0,
      passPowK: passes === runs.length,
      flaky: passes > 0 && passes < runs.length,
      details: per.map(r => (r ? r.detail : 'missing'))
    };
  });
}

function printReport(spec, runs) {
  const agg = aggregate(runs);
  const k = runs.length;
  const reliable = agg.filter(a => a.passPowK).length;
  const any = agg.filter(a => a.passAtK).length;
  const flaky = agg.filter(a => a.flaky);

  console.log(`\nTrial: ${spec.name}   (k=${k} run${k > 1 ? 's' : ''})\n`);
  for (const a of agg) {
    const mark = a.passPowK ? '✓' : a.passAtK ? '~' : '✗';
    console.log(`  ${mark} [${a.kind.padEnd(8)}] ${a.id}  ${a.passes}/${a.k}`);
    if (!a.passPowK) {
      if (a.why) console.log(`      why it matters: ${a.why}`);
      a.details.forEach((d, i) => console.log(`      run ${i + 1}: ${d}`));
    }
  }

  console.log('\n  ── Reliability ──────────────────────────────');
  console.log(`  pass^k (every run):     ${reliable}/${agg.length}   <- the number that matters`);
  console.log(`  pass@k (at least once): ${any}/${agg.length}`);
  if (k === 1) {
    console.log('  NOTE: k=1 measures capability, not reliability. Re-run with more runs.');
  } else if (flaky.length) {
    console.log(`  flaky (inconsistent):   ${flaky.length}  -> ${flaky.map(f => f.id).join(', ')}`);
  } else {
    console.log('  flaky (inconsistent):   0');
  }
  console.log();
  return reliable === agg.length;
}

// ---------------------------------------------------------------- cli

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function main() {
  const [cmd, trialDir] = process.argv.slice(2);
  if (!cmd || !trialDir) {
    console.error('usage: trial.js <prepare|grade|report> <trial-dir> [--workspace <dir>] [--runs a,b,c]');
    process.exit(1);
  }
  const spec = loadSpec(trialDir);

  if (cmd === 'prepare') {
    const ws = arg('workspace', path.join(require('os').tmpdir(), `trial-${spec.name}-${Date.now()}`));
    prepare(trialDir, spec, ws);
    console.log(`workspace: ${ws}\n`);
    console.log('Run the employee against it, then grade. The task prompt is:\n');
    console.log(`  ${spec.prompt}`);
    if (spec.today) console.log(`  (treat today's date as ${spec.today})`);
    console.log(`\nThen: node scripts/trial.js grade ${trialDir} --workspace ${ws}`);
    return;
  }

  if (cmd === 'grade') {
    const ws = arg('workspace');
    if (!ws) throw new Error('--workspace required');
    const result = grade(trialDir, spec, ws);
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printReport(spec, [result]);
    }
    process.exit(result.passed === result.total ? 0 : 1);
  }

  if (cmd === 'report') {
    const dirs = (arg('runs') || '').split(',').filter(Boolean);
    if (!dirs.length) throw new Error('--runs dir1,dir2,... required');
    const runs = dirs.map(d => grade(trialDir, spec, d));
    const ok = printReport(spec, runs);
    process.exit(ok ? 0 : 1);
  }

  throw new Error(`unknown command: ${cmd}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`trial: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { loadSpec, prepare, grade, aggregate, sectionWords, evaluateAssertion };
