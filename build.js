/* build.js — produce a minified, production-ready copy of the static site in dist/.
   Run with:  node build.js   (or  npm run build )
   Your editable source files (script.js, styles.css, …) are never modified. */
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const JS = ['script.js', 'world.js', 'artwork.js', 'updates.js', 'ubhi-sync.js', 'editmode.js', 'embellish.js'];
const CSS = ['styles.css', 'world.css', 'artwork.css', 'embellish.css'];
const COPY_FILES = ['robots.txt', 'sitemap.xml'];
const COPY_DIRS = ['assets'];

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const pct = (b, a) => (b ? Math.round((1 - a / b) * 100) : 0);

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  let beforeJS = 0, afterJS = 0, beforeCSS = 0, afterCSS = 0;
  const map = {};

  for (const f of JS) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const res = await minify(src, { ecma: 2020, compress: true, mangle: true, format: { comments: false } });
    if (res.error) throw new Error(f + ': ' + res.error);
    const outName = f.replace(/\.js$/, '.min.js');
    fs.writeFileSync(path.join(OUT, outName), res.code);
    beforeJS += Buffer.byteLength(src); afterJS += Buffer.byteLength(res.code);
    map[f] = outName;
  }

  for (const f of CSS) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const out = new CleanCSS({ level: 1 }).minify(src);
    if (out.errors && out.errors.length) throw new Error(f + ': ' + out.errors.join(', '));
    const outName = f.replace(/\.css$/, '.min.css');
    fs.writeFileSync(path.join(OUT, outName), out.styles);
    beforeCSS += Buffer.byteLength(src); afterCSS += Buffer.byteLength(out.styles);
    map[f] = outName;
  }

  // Point the HTML's asset references at the minified files (keeps the ?v= cache-buster).
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const f of [...JS, ...CSS]) html = html.split(f + '?v=').join(map[f] + '?v=');
  fs.writeFileSync(path.join(OUT, 'index.html'), html);

  for (const f of COPY_FILES) if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
  for (const d of COPY_DIRS) if (fs.existsSync(path.join(ROOT, d))) fs.cpSync(path.join(ROOT, d), path.join(OUT, d), { recursive: true });

  console.log('Build complete -> dist/');
  console.log('  JS  : ' + kb(beforeJS) + ' -> ' + kb(afterJS) + '  (-' + pct(beforeJS, afterJS) + '%)');
  console.log('  CSS : ' + kb(beforeCSS) + ' -> ' + kb(afterCSS) + '  (-' + pct(beforeCSS, afterCSS) + '%)');
  console.log('  Code total: ' + kb(beforeJS + beforeCSS) + ' -> ' + kb(afterJS + afterCSS) + '  (-' + pct(beforeJS + beforeCSS, afterJS + afterCSS) + '%)');
})().catch((e) => { console.error('Build failed:', e.message); process.exit(1); });
