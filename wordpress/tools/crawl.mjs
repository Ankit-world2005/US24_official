// Crawl us24solutions.com: every page via REST (content + meta) and its rendered HTML.
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = process.argv[2];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36';
const get = async (url, asJson) => {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return asJson ? r.json() : r.text();
    } catch (e) { if (i === 2) throw e; await new Promise(s => setTimeout(s, 1500)); }
  }
};

const base = 'https://us24solutions.com/wp-json/wp/v2/';
const pages = await get(base + 'pages?per_page=100&context=view', true);
const posts = await get(base + 'posts?per_page=100&context=view', true);
const media = await get(base + 'media?per_page=100&_fields=id,source_url,alt_text,media_details.width,media_details.height,mime_type', true).catch(() => []);
await fs.writeFile(path.join(OUT, 'rest', 'pages.json'), JSON.stringify(pages, null, 1));
await fs.writeFile(path.join(OUT, 'rest', 'posts.json'), JSON.stringify(posts, null, 1));
await fs.writeFile(path.join(OUT, 'rest', 'media.json'), JSON.stringify(media, null, 1));

const all = [...pages.map(p => ({ ...p, kind: 'page' })), ...posts.map(p => ({ ...p, kind: 'post' }))];
let n = 0;
const queue = [...all];
async function worker() {
  while (queue.length) {
    const p = queue.shift();
    try {
      const html = await get(p.link);
      await fs.writeFile(path.join(OUT, 'html', p.slug + '.html'), html);
      n++;
    } catch (e) { console.error('FAIL', p.link, e.message); }
  }
}
await Promise.all([1, 2, 3, 4].map(worker));
// sitemap + robots for completeness
for (const [f, u] of [['robots.txt', 'https://us24solutions.com/robots.txt'], ['sitemap_index.xml', 'https://us24solutions.com/sitemap_index.xml']]) {
  try { await fs.writeFile(path.join(OUT, f), await get(u)); } catch (e) { console.error('FAIL', u, e.message); }
}
console.log('pages', pages.length, 'posts', posts.length, 'media', media.length, 'html saved', n);
