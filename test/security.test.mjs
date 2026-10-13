import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('CSP permits only the exact built script and blocks external connections', () => {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  const hash = createHash('sha256').update(scripts[0][1]).digest('base64');
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.ok(policy.includes(`script-src 'sha256-${hash}'`));
  assert.ok(policy.includes("connect-src 'none'"));
  assert.ok(policy.includes("worker-src blob:"));
  assert.ok(policy.includes("base-uri 'none'"));
  assert.ok(policy.includes("form-action 'none'"));
  assert.ok(!policy.includes('unsafe-eval'));
  assert.ok(!policy.includes('https:'));
  assert.ok(html.includes('name="referrer" content="no-referrer"'));
});

test('the offline artifact contains no remote assets, source maps or executable markup handlers', () => {
  assert.doesNotMatch(html, /<(?:script|link|img|iframe)\b[^>]*(?:src|href)=["']https?:\/\//i);
  assert.doesNotMatch(html, /sourceMappingURL|sourceURL/);
  const markup = html.replace(/<script>[\s\S]*?<\/script>/g, '');
  assert.doesNotMatch(markup, /\son\w+\s*=/i);
});

test('standalone distribution preserves all three licenses and the vendored code fingerprints', () => {
  for (const name of ['LICENSE', 'THREE-LICENSE.txt', 'CUBEJS-LICENSE.txt']) {
    const license = readFileSync(new URL(`../${name}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n').trim();
    assert.ok(html.includes(license), name);
  }
  for (const [name, expected] of [
    ['cube.js', '450a53a9acf5033fde7ca23be8fd08ac37d30f04c58aac63f053a1c05a7f5802'],
    ['solve.js', 'faa0ccffca78f80a5fe7a197a9676af02d79d8ddece9cf3506154fea616fc445'],
  ]) {
    const bytes = readFileSync(new URL(`../vendor/${name}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, name);
  }
});
