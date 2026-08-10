/**
 * Tests for the agent/employee file validator
 *
 * Run with: node tests/lib/validate-agent.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validate } = require('../../scripts/validate-agent');

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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-agent-'));
const write = (name, content) => {
  const p = path.join(tmp, name);
  fs.writeFileSync(p, content);
  return p;
};

const GOOD_BODY = Array(20)
  .fill('You follow the process and cite sources for every claim you make.')
  .join('\n');

console.log('\n=== Testing validate-agent.js ===\n');

run('real shipped agent passes', () => {
  const r = validate(path.join(__dirname, '..', '..', 'agents', 'architect.md'));
  assert.strictEqual(r.errors.length, 0, r.errors.join('; '));
});

run('unfilled template fails on [FILL:] markers', () => {
  const r = validate(path.join(__dirname, '..', '..', 'docs', 'templates', 'planner.md'));
  assert.ok(r.errors.some(e => e.includes('[FILL')), 'should flag FILL markers');
});

run('filled ops-manager example passes', () => {
  const r = validate(path.join(__dirname, '..', '..', 'docs', 'templates', 'operations-manager.md'));
  assert.strictEqual(r.errors.length, 0, r.errors.join('; '));
});

run('missing frontmatter fails', () => {
  const r = validate(write('nofm.md', 'just a body\n' + GOOD_BODY));
  assert.ok(r.errors.some(e => e.includes('frontmatter')));
});

run('missing description fails', () => {
  const r = validate(write('nodesc.md', `---\nname: foo-bar\ntools: Read\nmodel: sonnet\n---\n${GOOD_BODY}`));
  assert.ok(r.errors.some(e => e.includes('description')));
});

run('non-kebab name fails', () => {
  const r = validate(
    write('badname.md', `---\nname: Operations Manager\ndescription: Ops specialist. Use PROACTIVELY when priorities are unclear.\ntools: Read\nmodel: sonnet\n---\n${GOOD_BODY}`)
  );
  assert.ok(r.errors.some(e => e.includes('kebab-case')));
});

run('unknown tool fails', () => {
  const r = validate(
    write('badtool.md', `---\nname: foo-bar\ndescription: Ops specialist. Use PROACTIVELY when priorities are unclear.\ntools: Read, Excel\nmodel: sonnet\n---\n${GOOD_BODY}`)
  );
  assert.ok(r.errors.some(e => e.includes('unknown tool')));
});

run('bad model fails', () => {
  const r = validate(
    write('badmodel.md', `---\nname: foo-bar\ndescription: Ops specialist. Use PROACTIVELY when priorities are unclear.\ntools: Read\nmodel: gpt-4\n---\n${GOOD_BODY}`)
  );
  assert.ok(r.errors.some(e => e.includes('model')));
});

run('near-empty body fails', () => {
  const r = validate(
    write('empty.md', `---\nname: foo-bar\ndescription: Ops specialist. Use PROACTIVELY when priorities are unclear.\ntools: Read\nmodel: sonnet\n---\nhi`)
  );
  assert.ok(r.errors.some(e => e.includes('empty')));
});

run('Write without a declared write scope warns (not fatal — code agents edit by design)', () => {
  const r = validate(
    write('noscope.md', `---\nname: foo-bar\ndescription: Ops specialist. Use PROACTIVELY when priorities are unclear.\ntools: Read, Write\nmodel: sonnet\n---\n${GOOD_BODY}`)
  );
  assert.strictEqual(r.errors.length, 0);
  assert.ok(r.warns.some(w => w.includes('Write scope')), 'should warn about unbounded write');
});

run('Write with a declared write scope passes', () => {
  const r = validate(
    write('scoped.md', `---\nname: foo-bar\ndescription: Ops specialist. Use PROACTIVELY when priorities are unclear.\ntools: Read, Write\nmodel: sonnet\n---\n## Write scope\nOnly inside company/reports/.\n${GOOD_BODY}`)
  );
  assert.strictEqual(r.errors.length, 0, r.errors.join('; '));
});

run('told to save but has no Write tool fails', () => {
  const r = validate(
    write('cantsave.md', `---\nname: foo-bar\ndescription: Research specialist. Use PROACTIVELY when facts are needed.\ntools: Read, Grep\nmodel: sonnet\n---\nSave the result to company/past-research/ when done.\n${GOOD_BODY}`)
  );
  assert.ok(r.errors.some(e => e.includes('no Write')), 'should catch save-without-Write contradiction');
});

run('all shipped templates pass their own rules', () => {
  const dir = path.join(__dirname, '..', '..', 'docs', 'templates');
  for (const f of ['operations-manager.md']) {
    const r = validate(path.join(dir, f));
    assert.strictEqual(r.errors.length, 0, `${f}: ${r.errors.join('; ')}`);
  }
});

run('missing PROACTIVELY only warns, does not fail', () => {
  const r = validate(
    write('noproactive.md', `---\nname: foo-bar\ndescription: A specialist for organizing operations work and setting priorities.\ntools: Read\nmodel: sonnet\n---\n${GOOD_BODY}`)
  );
  assert.strictEqual(r.errors.length, 0);
  assert.ok(r.warns.some(w => w.includes('PROACTIVELY')));
});

fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n=== Test Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}\n`);

process.exit(failed > 0 ? 1 : 0);
