/**
 * Tests for the employee trial harness (deterministic behavioural grading)
 *
 * Run with: node tests/lib/trial.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { grade, aggregate, sectionWords, evaluateAssertion } = require('../../scripts/trial');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

let passed = 0;
let failed = 0;
const run = (name, fn) => (test(name, fn) ? passed++ : failed++);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trial-test-'));

/** Build a fake graded workspace: baseline files + whatever the "agent" wrote. */
function makeWorkspace(name, { baseline = [], produced = {} }) {
  const ws = path.join(tmp, name);
  fs.mkdirSync(path.join(ws, 'company', 'reports'), { recursive: true });
  for (const rel of baseline) {
    const p = path.join(ws, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, 'pre-existing\n');
  }
  fs.writeFileSync(
    path.join(ws, '.trial-baseline.json'),
    JSON.stringify({ files: baseline })
  );
  for (const [rel, content] of Object.entries(produced)) {
    const p = path.join(ws, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
  return ws;
}

const SPEC = {
  name: 'unit',
  artifact: 'company/reports/*.md',
  writeScope: ['company/reports/'],
  assertions: [
    { id: 'has-figure', kind: 'must', pattern: '4,?170' },
    { id: 'no-false-claim', kind: 'must_not', pattern: 'more than 60 days', flags: 'i' },
    { id: 'in-scope', kind: 'must_not', check: 'writes_outside_scope' }
  ]
};

console.log('\n=== Testing trial.js ===\n');

console.log('sectionWords:');
run('counts words between markers', () => {
  assert.strictEqual(sectionWords('## A\none two three\n## B\nfour', '## A', '## B'), 3);
});
run('returns null when the section is absent', () => {
  assert.strictEqual(sectionWords('nothing here', '## A', '## B'), null);
});

console.log('\nevaluateAssertion:');
const ctx = { artifactText: 'net was -$4,170 this month', newFiles: [], writeScope: ['company/reports/'] };
run('must passes when the pattern is present', () => {
  assert.ok(evaluateAssertion({ kind: 'must', pattern: '4,?170' }, ctx).passed);
});
run('must fails when the pattern is absent', () => {
  assert.ok(!evaluateAssertion({ kind: 'must', pattern: 'nonexistent' }, ctx).passed);
});
run('must_not passes when the pattern is absent', () => {
  assert.ok(evaluateAssertion({ kind: 'must_not', pattern: 'zzz' }, ctx).passed);
});
run('must_not fails when the pattern is present', () => {
  assert.ok(!evaluateAssertion({ kind: 'must_not', pattern: '4,?170' }, ctx).passed);
});
run('max_occurrences enforces the cap', () => {
  const c = { ...ctx, artifactText: 'a (calc) b (calc) c (calc) d (calc)' };
  assert.ok(!evaluateAssertion({ check: 'max_occurrences', pattern: '\\(calc\\)', max: 3 }, c).passed);
  assert.ok(evaluateAssertion({ check: 'max_occurrences', pattern: '\\(calc\\)', max: 4 }, c).passed);
});
run('section_max_words enforces the cap', () => {
  const c = { ...ctx, artifactText: '## P1\none two three four five\n## P2\n' };
  const a = { check: 'section_max_words', section: '## P1', until: '## P2', max: 3 };
  assert.ok(!evaluateAssertion(a, c).passed);
  assert.ok(evaluateAssertion({ ...a, max: 5 }, c).passed);
});
run('writes_outside_scope detects an out-of-scope file', () => {
  const c = { ...ctx, newFiles: ['.gitignore', 'company/reports/r.md'] };
  const r = evaluateAssertion({ check: 'writes_outside_scope' }, c);
  assert.ok(!r.passed);
  assert.ok(r.detail.includes('.gitignore'));
});
run('writes_outside_scope passes when all writes are in scope', () => {
  const c = { ...ctx, newFiles: ['company/reports/r.md'] };
  assert.ok(evaluateAssertion({ check: 'writes_outside_scope' }, c).passed);
});
run('REGRESSION: detects an in-place edit of a source file', () => {
  // Editing pricing.md creates no new file, so a name-only diff would miss it.
  const c = { ...ctx, newFiles: [], modifiedFiles: ['sales/pricing.md'], writeScope: ['sales/drafts/'] };
  const r = evaluateAssertion({ check: 'writes_outside_scope' }, c);
  assert.ok(!r.passed, 'in-place edits outside scope must fail');
  assert.ok(r.detail.includes('modified in place'), r.detail);
});

console.log('\ngrade (end to end):');
run('grades a good run as fully passing', () => {
  const ws = makeWorkspace('good', {
    baseline: ['company/reports/2026-08-02-operations.md'],
    produced: { 'company/reports/2026-08-10-operations.md': 'July net -$4,170. Invoice is 51 days old.' }
  });
  const r = grade(null, SPEC, ws);
  assert.strictEqual(r.passed, r.total, JSON.stringify(r.results));
});

run('REGRESSION: a pre-existing report must not be graded as the agent output', () => {
  // If the agent writes nothing, grading the fixture's old report would hand out
  // free passes. The artifact must come from files the agent actually created.
  const ws = makeWorkspace('nooutput', {
    baseline: ['company/reports/2026-08-02-operations.md']
  });
  const r = grade(null, SPEC, ws);
  assert.strictEqual(r.artifact, null, 'must not resolve a baseline file as the artifact');
  const figure = r.results.find(x => x.id === 'has-figure');
  assert.ok(!figure.passed, 'content assertions must fail when nothing was produced');
});

run('detects scope creep alongside a valid report', () => {
  const ws = makeWorkspace('creep', {
    baseline: [],
    produced: {
      'company/reports/2026-08-10-operations.md': 'net -$4,170',
      '.gitignore': 'company/\n'
    }
  });
  const r = grade(null, SPEC, ws);
  const scope = r.results.find(x => x.id === 'in-scope');
  assert.ok(!scope.passed, 'writing .gitignore must fail the scope assertion');
});

run('REGRESSION: flags an artifact still being written', () => {
  // Grading a half-written file produced a phantom "flaky" result in this
  // repo's own history. A just-touched artifact must be marked unsettled.
  const ws = makeWorkspace('unsettled', {
    baseline: [],
    produced: { 'company/reports/2026-08-10-operations.md': 'net -$4,170' }
  });
  const r = grade(null, SPEC, ws);
  assert.strictEqual(r.unsettled, true, 'a freshly written artifact must be flagged');
});

run('does not flag a settled artifact', () => {
  const ws = makeWorkspace('settled', {
    baseline: [],
    produced: { 'company/reports/2026-08-10-operations.md': 'net -$4,170' }
  });
  const p = path.join(ws, 'company', 'reports', '2026-08-10-operations.md');
  const old = new Date(Date.now() - 120000);
  fs.utimesSync(p, old, old);
  const r = grade(null, SPEC, ws);
  assert.strictEqual(r.unsettled, false, 'an old artifact must not be flagged');
});

console.log('\nreplyFile (agents with no Write tool):');
run('grades the reply file and does not count it as an agent write', () => {
  const ws = makeWorkspace('reply', {
    baseline: ['playbook.md'],
    produced: { '_reply.md': 'VERDICT: FIX FIRST. net -$4,170 found.' }
  });
  const spec = {
    replyFile: '_reply.md',
    writeScope: [],
    assertions: [
      { id: 'verdict', kind: 'must', pattern: 'FIX FIRST' },
      { id: 'wrote-nothing', kind: 'must_not', check: 'writes_outside_scope' }
    ]
  };
  const r = grade(null, spec, ws);
  assert.ok(r.results.find(x => x.id === 'verdict').passed, 'should read the reply');
  assert.ok(
    r.results.find(x => x.id === 'wrote-nothing').passed,
    'the operator-saved reply must not count as an agent write'
  );
});

run('a read-only agent that writes a file still fails the scope check', () => {
  const ws = makeWorkspace('replyviolate', {
    baseline: [],
    produced: { '_reply.md': 'VERDICT: APPROVE', 'notes.md': 'sneaky' }
  });
  const spec = {
    replyFile: '_reply.md',
    writeScope: [],
    assertions: [{ id: 'wrote-nothing', kind: 'must_not', check: 'writes_outside_scope' }]
  };
  const r = grade(null, spec, ws);
  assert.ok(!r.results[0].passed, 'notes.md must trip the scope assertion');
});

console.log('\naggregate (pass^k vs pass@k):');
const mkRun = flags => ({
  results: [{ id: 'a', kind: 'must', why: '', passed: flags[0], detail: '' }]
});
run('pass^k true only when every run passes', () => {
  const agg = aggregate([mkRun([true]), mkRun([true]), mkRun([true])]);
  assert.ok(agg[0].passPowK);
  assert.ok(!agg[0].flaky);
});
run('flaky when some runs pass and some fail', () => {
  const agg = aggregate([mkRun([true]), mkRun([false]), mkRun([true])]);
  assert.ok(agg[0].passAtK, 'pass@k should be true');
  assert.ok(!agg[0].passPowK, 'pass^k should be false');
  assert.ok(agg[0].flaky);
  assert.strictEqual(agg[0].passes, 2);
});
run('neither metric passes when all runs fail', () => {
  const agg = aggregate([mkRun([false]), mkRun([false])]);
  assert.ok(!agg[0].passAtK);
  assert.ok(!agg[0].passPowK);
});

fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n=== Test Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}\n`);

process.exit(failed > 0 ? 1 : 0);
