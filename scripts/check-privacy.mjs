import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}).split('\0').filter(Boolean);
const allowedRoot = new Set([
  '.gitignore', '.gitattributes', 'LICENSE', 'README.md', 'CONTRIBUTING.md',
  'SECURITY.md', 'PRIVACY.md', 'THIRD_PARTY.md', 'package.json', 'package-lock.json',
  'index.html', '使用说明.txt', 'THREE-LICENSE.txt', 'CUBEJS-LICENSE.txt',
]);
const allowedDirectories = /^(?:src|scripts|test|vendor|\.github)\//;
const secretRules = [
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/g],
  ['API secret', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ['credential URL', /https?:\/\/[^\s/"']+:[^\s/"']+@/g],
  ['personal filesystem path', /(?:[A-Za-z]:[\\/](?:Users|C-LEARNING)[\\/]|\/(?:Users|home)\/[A-Za-z0-9._-]+[\\/])/g],
  ['assigned credential', /\b(?:api[_-]?key|secret|password|access[_-]?token)\b\s*[:=]\s*["'][A-Za-z0-9_+\/-]{12,}["']/gi],
];
const findings = [];
const safeEmail = email => email.endsWith('@users.noreply.github.com') || email === 'noreply@github.com';
function scanContent(path, content, thirdPartyNoticeAllowed = false) {
  for (const [description, pattern] of secretRules) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) findings.push(`${path}: ${description}`);
  }
  for (const match of content.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) {
    const email = match[0];
    if (!(thirdPartyNoticeAllowed && email === 'petri@digip.org') && !safeEmail(email)) {
      findings.push(`${path}: unapproved email address`);
    }
  }
}
for (const path of files) {
  if (!allowedRoot.has(path) && !allowedDirectories.test(path)) findings.push(`${path}: unexpected publication file`);
  if (/(?:^|\/)(?:\.env(?:\.|$)|\.npmrc$|id_rsa$|id_ed25519$)|\.(?:pem|key|p12|pfx|log|zip|tgz)$/i.test(path)) {
    findings.push(`${path}: private file type`);
  }
  const content = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  scanContent(path, content, ['CUBEJS-LICENSE.txt', 'index.html', 'scripts/check-privacy.mjs'].includes(path));
}
const history = execFileSync('git', ['log', '--all', '--format=%an%x00%ae%x00%cn%x00%ce'], {
  cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}).trim();
if (history) {
  for (const line of history.split('\n')) {
    const [, authorEmail, , committerEmail] = line.split('\0');
    if (!safeEmail(authorEmail) || !safeEmail(committerEmail)) {
      findings.push('Git history: unexpected author or committer identity');
    }
  }
}
const gitText = args => execFileSync('git', args, {
  cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
});
scanContent('Staged content', gitText(['diff', '--cached', '--no-ext-diff']), true);
scanContent('Git history content', gitText(['log', '--all', '-p', '--no-ext-diff', '--format=%B']), true);
for (const path of gitText(['-c', 'core.quotePath=false', 'log', '--all', '--format=', '--name-only']).split('\n').filter(Boolean)) {
  if (!allowedRoot.has(path) && !allowedDirectories.test(path)) findings.push('Git history: unexpected publication file');
}
if (findings.length) {
  console.error(findings.join('\n')); // Values are deliberately never printed.
  process.exitCode = 1;
} else {
  console.log(`Privacy check passed for ${files.length} publication files and Git commit identities.`);
  console.log('This pattern scan does not replace a manual review of personal details.');
}
