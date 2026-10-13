import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8').then(text => text.replace(/\r\n/g, '\n'));
const cube = await read('vendor/cube.js');
const cubeLicense = await read('CUBEJS-LICENSE.txt');
const projectLicense = await read('LICENSE');
const threeLicense = await read('THREE-LICENSE.txt');
const workerSource = cube + '\n' + await read('vendor/solve.js') + '\n' + await read('src/solver-worker.js');
const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/app.js'],
  bundle: true,
  write: false,
  format: 'iife',
  target: 'es2022',
  minify: true,
  charset: 'utf8',
  legalComments: 'inline',
  plugins: [{
    name: 'inline-solver',
    setup(bundler) {
      bundler.onLoad({ filter: /[\\/]src[\\/]solver-worker\.js$/ }, () => ({ contents: workerSource, loader: 'text' }));
    },
  }],
});
const licenseBanner = `/*\nProject license:\n${projectLicense.trim()}\n\nThird-party: cube.js\n${cubeLicense.trim()}\n\nThird-party: Three.js\n${threeLicense.trim()}\n*/\n`;
const script = '\n' + licenseBanner + cube + '\n' + result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const hash = createHash('sha256').update(script).digest('base64');
const policy = `default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; img-src data: blob:; worker-src blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
const html = (await read('src/index.html'))
  .replace('{{CSP}}', `<meta http-equiv="Content-Security-Policy" content="${policy}">`)
  .replace('{{STYLE}}', `<style>\n${await read('src/styles.css')}</style>`)
  .replace('{{SCRIPT}}', `<script>${script}</script>`);
const destination = new URL('../index.html', import.meta.url);
if (process.argv.includes('--check')) {
  if (await read('index.html') !== html) throw new Error('index.html differs from source; run npm run build.');
  console.log('index.html matches a reproducible build.');
} else {
  await writeFile(destination, html, 'utf8');
  console.log('Built offline index.html with an inline script hash and blocked network connections.');
}
