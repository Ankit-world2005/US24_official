// Turn each crawled page into an ordered list of content items grouped by Elementor top-level section.
import fs from 'node:fs';
import * as cheerio from 'cheerio';

const dir = process.argv[2];
const pages = JSON.parse(fs.readFileSync(dir + '/rest/pages.json', 'utf8'));
const posts = JSON.parse(fs.readFileSync(dir + '/rest/posts.json', 'utf8'));
const clean = s => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

function cleanHtml($, el) {
  const $el = $(el).clone();
  $el.find('script,style,noscript,svg,i.fa,i[class*=icon],.elementor-screen-only').remove();
  // keep only simple tags
  const keep = new Set(['p', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'a', 'br', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'td', 'th']);
  $el.find('*').each((_, n) => {
    const tag = n.tagName.toLowerCase();
    if (!keep.has(tag)) { $(n).replaceWith($(n).contents()); return; }
    const href = tag === 'a' ? $(n).attr('href') : null;
    for (const a of Object.keys(n.attribs || {})) $(n).removeAttr(a);
    if (href) $(n).attr('href', href);
  });
  let html = $el.html() || '';
  html = html.replace(/ |&nbsp;/g, ' ').replace(/\s+/g, ' ').replace(/<p>\s*<\/p>/g, '').trim();
  return html;
}

function imgOf($, el) {
  const im = $(el).find('img').first();
  if (!im.length) return null;
  const src = im.attr('data-src') || im.attr('data-lazy-src') || im.attr('src');
  if (!src || src.startsWith('data:')) return null;
  return { src, alt: clean(im.attr('alt')), w: +im.attr('width') || null, h: +im.attr('height') || null };
}

function widget($, w) {
  const type = ($(w).attr('data-widget_type') || '').split('.')[0];
  const c = $(w).children('.elementor-widget-container').length ? $(w).children('.elementor-widget-container') : $(w);
  switch (type) {
    case 'heading': {
      const h = c.find('h1,h2,h3,h4,h5,h6,p,div,span').first();
      const tag = (h.length ? h[0].tagName : 'h2').toLowerCase();
      const a = c.find('a').first();
      return { t: 'h', level: /^h\d$/.test(tag) ? +tag[1] : 0, text: clean(c.text()), href: a.attr('href') || undefined };
    }
    case 'text-editor': {
      const html = cleanHtml($, c);
      return html ? { t: 'html', html } : null;
    }
    case 'image': {
      const i = imgOf($, c); if (!i) return null;
      const a = c.find('a').first(); if (a.length) i.href = a.attr('href');
      const cap = clean(c.find('figcaption').text()); if (cap) i.caption = cap;
      return { t: 'img', ...i };
    }
    case 'button': case 'eael-creative-button': {
      const a = c.find('a').first();
      return { t: 'btn', text: clean(a.text() || c.text()), href: a.attr('href') || '' };
    }
    case 'icon-box': case 'elementskit-icon-box': case 'image-box': case 'sina_content_box': {
      const title = clean(c.find('.elementor-icon-box-title, .elementor-image-box-title, .elementskit-info-box-title, h1,h2,h3,h4,h5,h6').first().text());
      const descEl = c.find('.elementor-icon-box-description, .elementor-image-box-description, .elementskit-box-body p, .sina-content-box-desc, p');
      const text = clean(descEl.map((_, e) => $(e).text()).get().join(' '));
      const a = c.find('a[href]').filter((_, e) => !/^#?$/.test($(e).attr('href') || '')).first();
      const btn = clean(c.find('.elementskit-btn, .sina-read-more, .elementor-button').first().text());
      return { t: 'card', title, text, href: a.attr('href') || undefined, more: btn || undefined, img: type === 'image-box' || type === 'sina_content_box' ? imgOf($, c) : undefined };
    }
    case 'icon-list': {
      const items = c.find('li').map((_, li) => {
        const a = $(li).find('a').first();
        return { text: clean($(li).text()), href: a.attr('href') || undefined };
      }).get().filter(x => x.text);
      return items.length ? { t: 'list', items } : null;
    }
    case 'counter': {
      const num = c.find('.elementor-counter-number');
      return { t: 'stat', value: (num.attr('data-to-value') || clean(num.text())), prefix: clean(c.find('.elementor-counter-number-prefix').text()), suffix: clean(c.find('.elementor-counter-number-suffix').text()), title: clean(c.find('.elementor-counter-title').text()) };
    }
    case 'eael-team-member': {
      return { t: 'person', name: clean(c.find('.eael-team-member-name').text()), role: clean(c.find('.eael-team-member-position').text()), text: clean(c.find('.eael-team-text p, .eael-team-content p').text()), img: imgOf($, c) };
    }
    case 'testimonial': case 'elementskit-testimonial': {
      return { t: 'quote', text: clean(c.find('.elementor-testimonial-content, .elementskit-commentor-coment, p').first().text()), name: clean(c.find('.elementor-testimonial-name, .elementskit-author-name').first().text()), role: clean(c.find('.elementor-testimonial-job, .elementskit-author-des').first().text()) };
    }
    case 'image-carousel': {
      const imgs = c.find('img').map((_, im) => ({ src: $(im).attr('data-src') || $(im).attr('src'), alt: clean($(im).attr('alt')) })).get().filter(i => i.src && !i.src.startsWith('data:'));
      return { t: 'gallery', imgs };
    }
    case 'elementskit-contact-form7': case 'eael-contact-form-7': {
      const fields = c.find('input,textarea,select').map((_, f) => ({ type: $(f).attr('type') || f.tagName, name: $(f).attr('name'), placeholder: $(f).attr('placeholder') })).get().filter(f => f.type !== 'hidden' && f.name);
      return { t: 'form', fields, id: c.find('form').attr('id') || '' };
    }
    case 'tf-slide-swiper': {
      const slides = c.find('.swiper-slide').map((_, s) => ({ text: clean($(s).text()), img: imgOf($, s) })).get();
      return { t: 'slides', slides };
    }
    default: return null; // spacer, divider, icon
  }
}

function extract(item, kind) {
  const html = fs.readFileSync(dir + '/html/' + item.slug + '.html', 'utf8');
  const $ = cheerio.load(html);
  const meta = {
    title: clean($('title').text()),
    description: $('meta[name=description]').attr('content') || '',
    robots: $('meta[name=robots]').attr('content') || '',
    canonical: $('link[rel=canonical]').attr('href') || '',
    ogImage: $('meta[property="og:image"]').attr('content') || '',
  };
  const doc = $('[data-elementor-type="wp-page"], [data-elementor-type="wp-post"]').first();
  const sections = [];
  if (doc.length) {
    // top-level sections/containers
    const tops = doc.children('.elementor-section, .e-con, .elementor-element').toArray();
    for (const s of tops) {
      const items = [];
      $(s).find('.elementor-widget').each((_, w) => {
        if ($(w).parents('.elementor-widget').length) return; // nested inside a widget
        const it = widget($, w);
        if (it) {
          // column key, used later to group side-by-side content
          const col = $(w).closest('.elementor-column, .e-con-inner > .e-con, .e-con');
          it.col = col.attr('data-id') || '';
          items.push(it);
        }
      });
      const bg = ($(s).attr('data-settings') || '').match(/"background_background":"(\w+)"/);
      if (items.length) sections.push({ id: $(s).attr('data-id'), bg: bg ? bg[1] : undefined, items });
    }
  } else {
    const body = $('.entry-content').first();
    const html2 = cleanHtml($, body.length ? body : cheerio.load(item.content.rendered).root());
    if (html2) sections.push({ id: 'classic', items: [{ t: 'html', html: html2 }] });
  }
  return { id: item.id, kind, slug: item.slug, link: item.link, title: cheerio.load(item.title.rendered).text(), modified: item.modified, date: item.date, meta, sections };
}

const out = [...pages.map(p => extract(p, 'page')), ...posts.map(p => extract(p, 'post'))];
fs.writeFileSync(dir + '/content.json', JSON.stringify(out, null, 1));
// readable dump
let txt = '';
for (const p of out) {
  txt += `\n\n######## ${p.title}  [${p.slug}]  modified ${p.modified.slice(0, 10)}\nTITLE: ${p.meta.title}\nDESC: ${p.meta.description}\n`;
  p.sections.forEach((s, i) => {
    txt += `--- section ${i} (${s.items.length} items)\n`;
    for (const it of s.items) {
      if (it.t === 'h') txt += `  [h${it.level}] ${it.text}${it.href ? ' -> ' + it.href : ''}\n`;
      else if (it.t === 'html') txt += `  [text] ${cheerio.load(it.html).text().slice(0, 400)}\n`;
      else if (it.t === 'img') txt += `  [img] ${it.src.split('/').pop()} alt="${it.alt}"\n`;
      else if (it.t === 'btn') txt += `  [btn] ${it.text} -> ${it.href}\n`;
      else if (it.t === 'card') txt += `  [card] ${it.title} :: ${it.text.slice(0, 160)}${it.href ? ' -> ' + it.href : ''}\n`;
      else if (it.t === 'list') txt += `  [list] ${it.items.map(x => x.text).join(' | ').slice(0, 300)}\n`;
      else if (it.t === 'stat') txt += `  [stat] ${it.prefix}${it.value}${it.suffix} ${it.title}\n`;
      else if (it.t === 'person') txt += `  [person] ${it.name} — ${it.role} :: ${it.text.slice(0, 120)}\n`;
      else if (it.t === 'quote') txt += `  [quote] ${it.text.slice(0, 200)} — ${it.name}, ${it.role}\n`;
      else if (it.t === 'form') txt += `  [form] ${it.fields.map(f => f.name).join(',')}\n`;
      else txt += `  [${it.t}] ${JSON.stringify(it).slice(0, 200)}\n`;
    }
  });
}
fs.writeFileSync(dir + '/content.txt', txt);
console.log('pages', out.length, 'sections', out.reduce((a, p) => a + p.sections.length, 0), 'items', out.reduce((a, p) => a + p.sections.reduce((b, s) => b + s.items.length, 0), 0));
