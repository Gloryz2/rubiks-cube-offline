import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test('privacy scan rejects a synthetic token and private email without printing either value', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const probe = new URL('../src/.privacy-scan-probe.txt', import.meta.url);
  const token = 'ghp_' + 'a'.repeat(36);
  const email = ['private-contact', 'example.invalid'].join('@');
  writeFileSync(probe, token + '\n' + email, { flag: 'wx' });
  try {
    assert.throws(() => execFileSync(process.execPath, ['scripts/check-privacy.mjs'], {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }), error => {
      const output = String(error.stdout) + String(error.stderr);
      assert.equal(error.status, 1);
      assert.ok(output.includes('GitHub token'));
      assert.ok(output.includes('unapproved email address'));
      assert.ok(!output.includes(token));
      assert.ok(!output.includes(email));
      return true;
    });
  } finally {
    unlinkSync(probe);
  }
});
