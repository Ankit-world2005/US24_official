// Check an imported US24 site: every page renders, has one H1, no broken images or internal 404 links,
// no PHP/JS errors, and every block is valid in the block editor.
//
//   node verify.mjs <site url> <us24-site/content/pages.json> <screenshot dir> [chrome path]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const [SITE, PKG, SHOTS, CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'] = process.argv.slice(2);
const base = SITE.replace(/\/$/, '');
const pkg = JSON.parse(fs.readFileSync(PKG, 'utf8'));
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
let logs = [];
page.on('console', m => { if (m.type() === 'error') logs.push('console: ' + m.text()); });
page.on('pageerror', e => logs.push('pageerror: ' + e.message));
page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) logs.push(`http ${r.status()}: ${r.url()}`); });

const results = [];
const internal = new Set();
const ONLY = process.env.ONLY || '';
for (const item of pkg.items) {
  if (item.status !== 'publish' || ONLY === 'editor') continue;
  const url = `${base}/${item.slug === 'home' ? '' : item.slug + '/'}`;
  logs = [];
  const res = await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
  const info = await page.evaluate(() => {
    const imgs = [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src);
    const links = [...document.querySelectorAll('a[href]')].map(a => a.href);
    const body = document.body.innerText;
    return {
      h1: document.querySelectorAll('h1').length,
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content || '',
      broken: imgs,
      links,
      php: /(Fatal error|Warning:|Notice:|Deprecated:)\s/.test(body) ? body.match(/(Fatal error|Warning|Notice|Deprecated):[^\n]{0,200}/)[0] : '',
      placeholders: /\{\{(home|media|block)/.test(document.documentElement.innerHTML),
      width: document.documentElement.scrollWidth,
    };
  });
  for (const l of info.links) if (l.startsWith(base) && !/wp-admin|wp-login|#|\?|\.(png|jpe?g|svg|webp)$/.test(l)) internal.add(l.replace(/#.*$/, ''));
  const problems = [];
  if (res.status() !== 200) problems.push('status ' + res.status());
  if (info.h1 !== 1) problems.push(`${info.h1} h1`);
  if (info.broken.length) problems.push('broken images: ' + info.broken.join(' '));
  if (info.php) problems.push('php: ' + info.php);
  if (info.placeholders) problems.push('unresolved placeholders');
  if (info.width > 1440) problems.push('horizontal overflow ' + info.width);
  problems.push(...logs.filter(l => !/favicon/.test(l)));
  results.push({ slug: item.slug, problems });
  await page.screenshot({ path: path.join(SHOTS, `${item.slug}.png`), fullPage: true });
  process.stdout.write(problems.length ? `✗ ${item.slug}: ${problems.join(' | ')}\n` : `✓ ${item.slug}\n`);
}

// Internal links that 404.
const dead = [];
for (const l of ONLY === 'editor' ? [] : internal) {
  const r = await fetch(l, { redirect: 'manual' }).catch(() => null);
  if (!r || r.status >= 400) dead.push(`${r ? r.status : 'ERR'} ${l}`);
}
console.log(`\ninternal links checked: ${internal.size}, dead: ${dead.length}${dead.length ? '\n  ' + dead.join('\n  ') : ''}`);

// Block validity in the editor (needs a logged-in session; Playground's --login provides one).
const ids = await (await fetch(`${base}/wp-json/wp/v2/pages?per_page=100&status=publish&_fields=id,slug`)).json().catch(() => []);
const invalid = [];
// A fresh tab: the first one can detach after the long front-end pass.
const page2 = await browser.newPage();
await page2.setViewport({ width: 1440, height: 900 });
await page2.goto(`${base}/wp-login.php`, { waitUntil: 'networkidle0' });
if (await page2.$('#user_login') && process.env.WP_USER) { await page2.type('#user_login', process.env.WP_USER); await page2.type('#user_pass', process.env.WP_PASS || ''); await Promise.all([page2.waitForNavigation({ waitUntil: 'networkidle0' }), page2.click('#wp-submit')]); }
await page2.goto(`${base}/wp-admin/`, { waitUntil: 'networkidle0' });
const loggedIn = await page2.evaluate(() => !!document.querySelector('#wpadminbar'));
if (!loggedIn) console.log('editor check skipped: not logged in');
else {
  const only = (process.env.SLUGS || '').split(',').filter(Boolean);
  const targets = ids.filter(p => !only.length || only.includes(p.slug));
  for (const { id, slug } of targets) {
    await page2.goto(`${base}/wp-admin/post.php?post=${id}&action=edit`, { waitUntil: 'networkidle0', timeout: 120000 });
    await page2.waitForFunction(() => window.wp?.data?.select('core/block-editor')?.getBlocks?.().length > 0, { timeout: 60000 }).catch(() => {});
    const bad = await page2.evaluate(() => {
      const out = [];
      const walk = bs => bs.forEach(b => {
        if (!b.isValid || b.name === 'core/missing') out.push(b.name + (b.validationIssues?.length ? ': ' + JSON.stringify(b.validationIssues.map(v => v.args?.slice?.(0, 3))).slice(0, 400) : ''));
        walk(b.innerBlocks || []);
      });
      walk(wp.data.select('core/block-editor').getBlocks());
      return out;
    });
    if (bad.length) invalid.push(`${slug}: ${bad.slice(0, 4).join(' || ')}`);
    process.stdout.write(bad.length ? `✗ editor ${slug}: ${bad.length} invalid\n` : '.');
  }
  console.log(`\neditor: ${targets.length} pages checked, ${invalid.length} with invalid blocks${invalid.length ? '\n  ' + invalid.join('\n  ') : ''}`);
}

const failed = results.filter(r => r.problems.length);
console.log(`\nfront end: ${results.length} pages, ${failed.length} with problems`);
await browser.close();
process.exit(failed.length || dead.length || invalid.length ? 1 : 0);
