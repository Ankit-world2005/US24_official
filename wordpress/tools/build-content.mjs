// Build the US24 Site plugin's content package (pages.json + media) from the crawled snapshot.
//
//   node build-content.mjs <tools/data/content.json> <us24-site/content>
//
// Input is the output of extract.mjs: every page of us24solutions.com as ordered items (headings, text,
// cards, images...) grouped by Elementor section. Output is Gutenberg block markup that uses only core
// blocks plus the theme's block styles, so every page stays editable in the block editor.
//
// Content stays as written on the live site, except for the fixes listed in FIXES / DROP_TEXT below and
// the per-page notes, which are shown to editors in the admin (Pages → "Review" column).
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const [SRC, OUT] = process.argv.slice(2);
if (!SRC || !OUT) throw new Error('usage: node build-content.mjs <content.json> <out dir>');
const SNAPSHOT = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const bySlug = Object.fromEntries(SNAPSHOT.map(p => [p.slug, p]));
const UPLOADS = 'https://us24solutions.com/wp-content/uploads/';

// ---------------------------------------------------------------- site structure
const LINES = {
  rcm: { name: 'Revenue Cycle Management', short: 'revenue cycle', hub: 'revenue-cycle-management', cls: 'line-rcm',
    children: ['end-to-end-revenue-cycle-management-services', 'provider-enrollment-credentialing-services', 'eligibility-verification-prior-authorization', 'medical-coding-services', 'medical-transcription-services', 'charge-entry-submission', 'payment-posting', 'accounts-receivable-services', 'denial-management', 'patient-billing-services'],
    extra: ['coding', 'medical-billing-professional-services'] },
  cyber: { name: 'Cyber Security', short: 'cyber security', hub: 'cyber-security-solutions', cls: 'line-cyber',
    children: ['application-security', 'cloud-security', 'end-point-security', 'incident-handling', 'managed-security-services', 'network-security', 'risk-management-compliance', 'security-intelligence-threat-modeling', 'security-operation-centre', 'vulnerability-assessment-penetration-testing'] },
  sfcrm: { name: 'Salesforce CRM', short: 'Salesforce CRM', hub: 'salesforce-crm', cls: 'line-salesforce',
    children: ['salesforce-admin-developer-support', 'salesforce-app-development', 'salesforce-consulting-services', 'salesforce-data-migration-services', 'salesforce-integration-services', 'salesforce-lightning-services'] },
  sfcloud: { name: 'Salesforce Cloud', short: 'Salesforce Cloud', hub: 'salesforce-cloud', cls: 'line-salesforce',
    children: ['salesforce-sales-cloud', 'salesforce-service-cloud', 'salesforce-marketing-cloud', 'salesforce-commerce-cloud', 'salesforce-community-cloud', 'salesforce-health-cloud', 'salesforce-financial-services-cloud', 'salesforce-government-cloud', 'salesforce-manufacturing-cloud', 'salesforce-nonprofit-cloud'] },
  web: { name: 'Web & App Development', short: 'development', hub: 'web-app-development', cls: 'line-tech',
    children: ['wordpress-development', 'php-development', 'java-development', 'python-development', 'react-js-development', 'android-app-development', 'ios-app-development'] },
  acct: { name: 'Accounting & Payroll', short: 'accounting', hub: 'accounting-payroll', cls: 'line-business',
    children: ['accounting-services', 'accounts-payable', 'payroll-services'] },
  devops: { name: 'DevOps', hub: 'devops', cls: 'line-tech', children: [] },
  digital: { name: 'Digital Marketing', hub: 'digital-marketing', cls: 'line-marketing', children: [] },
  laptop: { name: 'Laptop Repair & Software', hub: 'laptop-repair-software-services', cls: 'line-tech', children: [] },
};
// Order and one-line descriptions for the "Our services" grids (descriptions from the live home page cards and slider).
const SERVICE_ORDER = [
  ['rcm', 'Improve cash flow and market share with innovative revenue cycle management from US24 Solutions. Get 99% of your claims paid with expert staff.'],
  ['cyber', 'Ensure the security of your digital assets with professional cyber security services, from a 24x7 SOC to penetration testing.'],
  ['sfcrm', 'Elevate your Salesforce CRM performance with administration, app development, consulting, integration and data migration.'],
  ['sfcloud', 'Implementation and support for Salesforce clouds: Sales, Service, Marketing, Commerce, Health, Financial Services and more.'],
  ['web', 'Choose US24 Solutions for web and app development: an experienced team, modern stacks and exceptional websites.'],
  ['devops', 'Choose US24 Solutions for DevOps services: expertise, reliability and a commitment to delivering exceptional results.'],
  ['acct', 'Cost-efficient, reliable accounting and payroll solutions, tailored to your unique needs.'],
  ['digital', 'Data-driven digital marketing: websites that convert, SEO that ranks and ads that generate leads.'],
  ['laptop', 'Fast, transparent laptop repair and software services, from diagnosis and upgrades to business IT support.'],
];
const LINE_OF = {};
for (const [key, l] of Object.entries(LINES)) {
  LINE_OF[l.hub] = { key, hub: true };
  for (const c of [...l.children, ...(l.extra || [])]) LINE_OF[c] = { key, hub: false };
}
const COMPANY = ['home', 'about', 'contact', 'career', 'csr', 'privacy-policy', 'terms-conditions', 'legal', 'blogs', 'our-services'];
const LEGAL = new Set(['privacy-policy', 'terms-conditions', 'legal']);

// Post titles (used as the H1 unless HERO overrides it). Live titles are often ALL CAPS.
const TITLES = {
  home: 'Home', about: 'About', contact: 'Contact', career: 'Careers', csr: 'CSR', blogs: 'Blog',
  'revenue-cycle-management': 'Revenue Cycle Management', 'cyber-security-solutions': 'Cyber Security Solutions',
  'ios-app-development': 'iOS App Development', 'cloud-security': 'Cloud Security', 'end-point-security': 'Endpoint Security',
  'react-js-development': 'ReactJS Development', 'end-to-end-revenue-cycle-management-services': 'End-to-End Revenue Cycle Management Services',
  coding: 'Coding', 'web-app-development': 'Web & App Development',
};
// Hero overrides: eyebrow, H1 and lead. Leads marked "composed" are new copy built from facts on the site.
const HERO = {
  'revenue-cycle-management': { eyebrow: 'Revenue Cycle Management', h1: 'Transform the Revenue Cycle' },
  'cyber-security-solutions': { eyebrow: 'Information security' },
  'salesforce-crm': { eyebrow: 'Salesforce', h1: 'Salesforce CRM Services', lead: 'Elevate your Salesforce CRM performance with the comprehensive services offered by US24 Solutions: administration and developer support, app development, consulting, data migration, integration and Lightning.' },
  'salesforce-cloud': { eyebrow: 'Salesforce', h1: 'Salesforce Cloud Services', lead: 'Implementation, customization and support for Salesforce clouds, from Sales and Service Cloud to Health, Financial Services, Government, Manufacturing and Nonprofit.', composed: true },
  'web-app-development': { eyebrow: 'Technology', lead: 'Choose US24 Solutions for web and app development to take advantage of our experienced team, cutting-edge solutions, and dedication to creating exceptional websites and apps.' },
  'accounting-payroll': { eyebrow: 'Business services', lead: 'Get cost-efficient and reliable accounting and payroll solutions with US24 Solutions, tailored to meet your unique needs.' },
  'our-services': { eyebrow: 'What we do', lead: 'Revenue cycle management, IT, Salesforce, cyber security and back-office services from one partner, with teams in the US, UK and India.', composed: true },
  devops: { eyebrow: 'Technology', h1: 'DevOps Development & Consultancy' },
  'digital-marketing': { eyebrow: 'Growth', h1: 'Digital Marketing Services' },
  'laptop-repair-software-services': { eyebrow: 'IT support' },
  about: { eyebrow: 'Innovative Technology Driven', h1: 'About US24 Solutions' },
  contact: { eyebrow: 'Contact', h1: 'Have Questions?' },
  career: { eyebrow: 'Careers', h1: 'Join Our Emerging Team', lead: '' },
  csr: { eyebrow: 'CSR', h1: 'Corporate Social Responsibility' },
  'privacy-policy': { eyebrow: 'Legal', lead: '' },
  'terms-conditions': { eyebrow: 'Legal', lead: '' },
  legal: { eyebrow: 'Legal', h1: 'Legal Disclaimer', lead: '' },
  coding: { h1: 'Medical Coding' },
  blogs: { eyebrow: 'Insights', lead: 'News and guides from the US24 Solutions team.', composed: true },
};

// Pages that need an editor's attention. Shown in the import report and in the Pages list.
const NOTES = {
  'medical-billing-professional-services': ['Imported as a draft: the text names another company ("At Revele") and describes its ScoreCard product, so it looks copied. Rewrite before publishing. The page is not linked from the live menu.'],
  'salesforce-financial-services-cloud': ['Text matches cloudanalogy.com almost word for word ("Since 2015, Cloud Analogy has been assisting financial advisors…"). Rewrite in your own words.'],
  'salesforce-integration-services': ['The live page used an image named after Cloud Analogy (dropped). Check the text is original.'],
  'salesforce-consulting-services': ['The live page used an image named after Cloud Analogy (dropped). Check the text is original.'],
  'salesforce-app-development': ['The live page used an image named after Cloud Analogy (dropped). Check the text is original.'],
  'android-app-development': ['The live text describes a "Salesforce App Development Agency" on the Android page. The heading was corrected; the paragraph still needs rewriting.'],
  'ios-app-development': ['The text calls US24 "a top-tier Salesforce app development agency" on the iOS page. Rewrite that sentence.'],
  'laptop-repair-software-services': ['Removed an internal drafting sentence ("this service page can naturally extend your existing technology portfolio") and replaced the wrong heading "Invoice Processing". Prices are in INR; confirm they are current.'],
  coding: ['Thin page that duplicates Medical Coding Services. Consider redirecting /coding/ to /medical-coding-services/.'],
  'application-security': ['The text repeats the Security Intelligence Threat Modeling page instead of describing application security. Rewrite.'],
  'salesforce-health-cloud': ['Very little content on the live page (about 20 words). Add detail.'],
  'salesforce-sales-cloud': ['Very little content on the live page (about 20 words). Add detail.'],
  about: ['The live page says "10+ years of experience" while the home page counter says "05+ years". Pick one. The "Meet Our Team" button linked to a 404 page and was removed.'],
  home: ['Counters are copied from the live home page ("05+ years", "30+ employees"). Confirm they are current.'],
  'digital-marketing': ['Old phone/email in the closing paragraph replaced by the site-wide contact details.'],
};
const DRAFTS = new Set(['medical-billing-professional-services']);

// Spelling and brand fixes applied to visible text (not to the legal pages, which keep their original wording).
const FIXES = [
  [/\bRecievable\b/g, 'Receivable'], [/\buntill\b/g, 'until'], [/\bCheif\b/gi, 'Chief'], [/\bCAHQ\b/g, 'CAQH'],
  [/\bPatients['’]? Billing\b/g, 'Patient Billing'],
  [/US24 Healthcare’s/g, 'US24 Solutions’'], [/US24 Healthcare's/g, "US24 Solutions'"], [/\bis expertise in\b/g, 'has expertise in'],
  // Missing space after a full stop in the live copy ("usage.Access").
  [/([a-z])\.([A-Z][a-z])/g, '$1. $2'],
  [/US24 HEALTHCARE SOLUTIONS/g, 'US24 Solutions'], [/US24 Healthcare Solutions/g, 'US24 Solutions'], [/US24 HEALTHCARE/g, 'US24 Solutions'], [/US24 Healthcare/g, 'US24 Solutions'],
  [/US24 Solution Company/g, 'US24 Solutions'], [/US24 Solution’s/g, 'US24 Solutions’'], [/US24 Solution's/g, "US24 Solutions'"], [/US24Solutions/g, 'US24 Solutions'],
  [/US24 SOLUTIONS/g, 'US24 Solutions'], [/\bworlds most\b/g, "world's most"], [/ ,/g, ','], [/\u00a0/g, ' '],
  // Internal drafting note left in the live laptop-repair copy.
  [/\s*As US24 Solutions already offers [^.]+?technology portfolio\./g, ''],
];
// Sentences dropped from body text (outdated contact details, internal drafting notes).
const DROP_TEXT = [
  /For more information on US24 Solutions and its services, email/i,
  /this service page can naturally extend your existing technology portfolio/i,
  /^\s*Email: contact@us24solutions\.com\s*Call:/i,
  /^\s*For Business enquiries/i,
  /^\s*Contact Us:\s*$/i,
  /^\s*Contact:\s*\+/i,
];
// Heading corrections for obvious copy-paste mistakes on the live site.
const HEADING_FIX = {
  'laptop-repair-software-services': { 'Invoice Processing': 'Laptop Repair for Individuals and Businesses' },
  'android-app-development': { 'Salesforce App Development Agency': 'Android App Development Agency' },
};

// ---------------------------------------------------------------- media we keep (the rest is clip art or stock)
const MEDIA = {
  '2021/12/US24-healthcare-solutions-HIPAA-compliance.jpg': { file: 'us24-hipaa-compliant.jpg', alt: 'HIPAA compliant', style: 'is-style-us24-light' },
  '2021/12/ISO-9001-2015-logo-1-1000x1000-1-150x150.png': { file: 'us24-iso-9001-2015.png', src: '2021/12/ISO-9001-2015-logo-1-1000x1000-1.png', alt: 'ISO 9001:2015 certified company', style: 'is-style-us24-light us24-badge-img' },
  '2021/11/RCM.png': { file: 'us24-rcm-process.png', alt: 'Revenue cycle management process: eligibility and benefits verification, patient pre-authorization, claims submission, payment posting, denial management, A/R follow-up and reporting', style: 'is-style-us24-light' },
  '2021/12/cyber-security-us24solutions.jpg': { file: 'us24-cyber-security.jpg', alt: '', style: 'is-style-us24-frame' },
  '2021/12/corporate-social-responsibility-e1638461885804.png': { file: 'us24-csr-activities.png', alt: 'CSR activities: environmental sustainability, ethical marketing and community involvement', style: 'is-style-us24-frame' },
  '2026/05/Laptop-Repair-Software-Services.jpg': { file: 'us24-laptop-repair.jpg', alt: 'Technician repairing the motherboard of an open laptop', style: 'is-style-us24-frame' },
  '2026/05/US24_Healthcare_3Page_Document-1-of-3-724x1024.png': { file: 'us24-healthcare-portfolio-1.png', alt: 'US24 Solutions healthcare marketing portfolio, page 1 of 3: Grow your practice with confidence', style: 'is-style-us24-frame' },
  '2026/05/US24_Healthcare_3Page_Document-2-of-3-724x1024.png': { file: 'us24-healthcare-portfolio-2.png', alt: 'US24 Solutions healthcare marketing portfolio, page 2 of 3: services, process and performance', style: 'is-style-us24-frame' },
  '2026/05/US24_Healthcare_3Page_Document-3-of-3-724x1024.png': { file: 'us24-healthcare-portfolio-3.png', alt: 'US24 Solutions healthcare marketing portfolio, page 3 of 3: your healthcare growth blueprint', style: 'is-style-us24-frame' },
  '2021/12/d-1.jpg': { file: 'us24-team-kiran.jpg', alt: 'Kiran, Director' },
  '2021/12/K.jpg': { file: 'us24-team-devdutt.jpg', alt: 'Devdutt, Chief Technology Officer' },
  '2022/02/dinesh-removebg-preview.jpg': { file: 'us24-team-dinesh.jpg', alt: 'Dinesh, Vice President' },
  '2022/02/vinit-removebg-preview.jpg': { file: 'us24-team-vinit.jpg', alt: 'Vinit, Senior Manager – Operations' },
  '2021/12/G-e1640893232877.jpg': { file: 'us24-team-amit.jpg', alt: 'Amit, Marketing Head' },
  '2021/12/a.jpg': { file: 'us24-team-nand-kishore.jpg', alt: 'Nand Kishore, HR & CSR Head' },
  '2021/12/Upendra.jpg': { file: 'us24-team-upendra.jpg', alt: 'Upendra, Finance Head' },
  '2022/02/dikshant-removebg-preview.jpg': { file: 'us24-team-dikshant.jpg', alt: 'Dikshant, Manager – Web Development' },
};
const mediaKey = src => src.replace(UPLOADS, '').replace(/^https?:\/\/[^/]+\/wp-content\/uploads\//, '');
const keptMedia = src => MEDIA[mediaKey(src)];
const usedMedia = new Map(); // file -> {alt,title,src}
function useMedia(m) { usedMedia.set(m.file, { alt: m.alt, title: m.alt || m.file.replace(/\.\w+$/, '').replace(/-/g, ' '), src: m.src || Object.keys(MEDIA).find(k => MEDIA[k] === m) }); return m.file; }

// Logo walls become text pills (cleaner on the dark theme, and readable by search engines).
const LOGO_NAMES = {
  eClinicalWorks: 'eClinicalWorks', MEDISOFT: 'Medisoft', lytec: 'Lytec', kareo: 'Kareo', EPIC: 'Epic', GATEWAYEDI: 'Gateway EDI', 'MERCURY-MEDICAL': 'Mercury Medical',
  'NECTGEN-HEALTHCARE': 'NextGen Healthcare', 'office-ally': 'Office Ally', TRIZETTO: 'TriZetto', 'Practice Mate': 'PracticeMate', 'ADVANCED-MD': 'AdvancedMD', ALLSCRIPTS: 'Allscripts',
  ATHENAHEALTH: 'athenahealth', availity: 'Availity', centricity: 'Centricity', CERNER: 'Cerner', citric: 'Citrix',
  'nexpose-logo-2.png': 'Nexpose', 'tool-we-use-2.png': 'McAfee', 'tool-we-use-4-1.png': 'EDR', 'tool-we-use-5.png': 'Sophos Endpoint', 'tool-we-use-6.png': 'Symantec',
  'tool-we-use-8.png': 'Nessus', 'tool-we-use-9.png': 'Qualys', 'rcm-tool-we-use-1.png': 'SolarWinds',
};

// ---------------------------------------------------------------- text helpers
const ACRONYMS = ['RCM', 'HIPAA', 'ISO', 'CRM', 'CSR', 'PHP', 'SEO', 'A/R', 'AR', 'NOC', 'SOC', 'NOC/SOC', 'EDI', 'ERA', 'EFT', 'US24', 'USA', 'UK', 'IT', 'API', 'EHR', 'CMS', 'UB04', 'IRS', 'DSO', 'EDR', 'ITIL', 'UI', 'UX', 'HR', 'CEO', 'CAQH', 'NPR', 'SSD', 'RAM', 'B2B', 'POS', 'CI', 'CD', 'AI'];
const SPECIAL = { ios: 'iOS', paas: 'PaaS', saas: 'SaaS', devops: 'DevOps', reactjs: 'ReactJS', wordpress: 'WordPress', salesforce: 'Salesforce', java: 'Java', python: 'Python', android: 'Android', india: 'India' };
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with', 'vs']);
function titleCase(s) {
  return s.toLowerCase().split(/(\s+)/).map((w, i) => {
    if (/^\s+$/.test(w)) return w;
    const bare = w.replace(/[^a-z0-9/&]/gi, '');
    const up = bare.toUpperCase();
    if (ACRONYMS.includes(up)) return w.replace(new RegExp(bare.replace(/[/&]/g, '\\$&'), 'i'), up);
    if (SPECIAL[bare]) return w.replace(bare, SPECIAL[bare]);
    if (i > 0 && SMALL.has(bare)) return w;
    return w.replace(/[a-z]/, c => c.toUpperCase());
  }).join('');
}
// Only ALL-CAPS strings are recased; mixed-case text is the author's choice and stays.
const recase = s => (/[a-z]/.test(s) || !/[A-Z]{3}/.test(s) ? s : titleCase(s));
const decode = s => cheerio.load(`<i>${s}</i>`)('i').text();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => esc(s).replace(/"/g, '&quot;');
const norm = s => s.replace(/\s+/g, ' ').trim();
function fixText(s, slug) {
  if (LEGAL.has(slug)) return s.replace(/\u00a0/g, ' ');
  for (const [re, to] of FIXES) s = s.replace(re, to);
  return s;
}
function truncate(s, max = 158) {
  s = norm(s);
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (stop > max * 0.55) return cut.slice(0, stop + 1);
  return cut.replace(/[\s,;:–-]+\S*$/, '') + '…';
}
// Internal links → {{home}}/slug/ (resolved to the target site at import time).
function fixHref(href) {
  if (!href) return '';
  href = href.trim();
  const m = href.match(/^(?:https?:)?\/\/(?:www\.)?us24solutions\.com(\/[^#?]*)?(.*)$/i) || (href.startsWith('/') && !href.startsWith('//') ? [null, href.replace(/[#?].*$/, ''), href.replace(/^[^#?]*/, '')] : null);
  if (!m) return href;
  let p = (m[1] || '/').replace(/^\/index\.php/, '');
  if (p === '/meet-our-team/') return '';
  return '{{home}}' + p + (m[2] || '');
}

// ---------------------------------------------------------------- block serializers (match core save() output)
function attrs(o) {
  const clean = Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v !== undefined && v !== '' && v !== null));
  if (!Object.keys(clean).length) return '';
  let j = JSON.stringify(clean).replace(/--/g, '\\u002d\\u002d').replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\\"/g, '\\u0022');
  j = j.replace(/"__MID__([^"]+?)__"/g, '{{media-id:$1}}').replace(/"__REF__([^"]+?)__"/g, '{{block:$1}}');
  return ' ' + j;
}
const cx = (...c) => c.filter(Boolean).join(' ');
const B = {
  p: (html, cls) => `<!-- wp:paragraph${attrs({ className: cls })} -->\n<p${cls ? ` class="${cls}"` : ''}>${html}</p>\n<!-- /wp:paragraph -->`,
  h: (html, level = 2, cls) => `<!-- wp:heading${attrs({ level: level === 2 ? undefined : level, className: cls })} -->\n<h${level} class="${cx('wp-block-heading', cls)}">${html}</h${level}>\n<!-- /wp:heading -->`,
  list: (items, { ordered, cls } = {}) => {
    const tag = ordered ? 'ol' : 'ul';
    return `<!-- wp:list${attrs({ ordered: ordered || undefined, className: cls })} -->\n<${tag} class="${cx('wp-block-list', cls)}">${items.map(i => `<!-- wp:list-item -->\n<li>${i}</li>\n<!-- /wp:list-item -->`).join('\n\n')}</${tag}>\n<!-- /wp:list -->`;
  },
  group: (inner, { tag = 'div', cls, align, anchor, layout = { type: 'constrained' } } = {}) =>
    `<!-- wp:group${attrs({ tagName: tag === 'div' ? undefined : tag, anchor, align, className: cls, layout })} -->\n<${tag}${anchor ? ` id="${anchor}"` : ''} class="${cx('wp-block-group', align && 'align' + align, cls)}">${[].concat(inner).filter(Boolean).join('\n\n')}</${tag}>\n<!-- /wp:group -->`,
  buttons: btns => btns.length ? `<!-- wp:buttons -->\n<div class="wp-block-buttons">${btns.map(b => `<!-- wp:button${attrs({ className: b.outline ? 'is-style-outline' : undefined })} -->\n<div class="${cx('wp-block-button', b.outline && 'is-style-outline')}"><a class="wp-block-button__link wp-element-button" href="${escAttr(b.href)}">${esc(b.text)}</a></div>\n<!-- /wp:button -->`).join('\n\n')}</div>\n<!-- /wp:buttons -->` : '',
  image: (file, { alt = '', cls, caption } = {}) =>
    `<!-- wp:image${attrs({ id: `__MID__${file}__`, sizeSlug: 'full', linkDestination: 'none', className: cls })} -->\n<figure class="${cx('wp-block-image size-full', cls)}"><img src="{{media:${file}}}" alt="${escAttr(alt)}" class="wp-image-{{media-id:${file}}}"/>${caption ? `<figcaption class="wp-element-caption">${esc(caption)}</figcaption>` : ''}</figure>\n<!-- /wp:image -->`,
  columns: (cols, { cls, align = 'wide' } = {}) =>
    `<!-- wp:columns${attrs({ align, className: cls })} -->\n<div class="${cx('wp-block-columns', align && 'align' + align, cls)}">${cols.map(c => `<!-- wp:column -->\n<div class="wp-block-column">${[].concat(c).join('\n\n')}</div>\n<!-- /wp:column -->`).join('\n\n')}</div>\n<!-- /wp:columns -->`,
  quote: (html, cite, cls = 'is-style-us24-quote') => `<!-- wp:quote${attrs({ className: cls })} -->\n<blockquote class="${cx('wp-block-quote', cls)}">${B.p(html)}${cite ? `<cite>${esc(cite)}</cite>` : ''}</blockquote>\n<!-- /wp:quote -->`,
  table: (head, rows, cls = 'us24-table') => `<!-- wp:table${attrs({ hasFixedLayout: false, className: cls })} -->\n<figure class="${cx('wp-block-table', cls)}"><table>${head.length ? `<thead><tr>${head.map(c => `<th>${c}</th>`).join('')}</tr></thead>` : ''}<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></figure>\n<!-- /wp:table -->`,
  self: (name, a) => `<!-- wp:${name}${attrs(a)} /-->`,
  ref: key => `<!-- wp:block${attrs({ ref: `__REF__${key}__` })} /-->`,
};
const grid = (inner, n, cls = 'us24-grid') => B.group(inner, { align: 'wide', cls, layout: { type: 'grid', columnCount: n % 4 === 0 && n >= 4 ? 4 : n === 2 ? 2 : 3, minimumColumnWidth: '15rem' } });
const vstack = { type: 'flex', orientation: 'vertical' };

// ---------------------------------------------------------------- HTML → blocks
const INLINE = new Set(['strong', 'b', 'em', 'i', 'a', 'br', 'code', 'sup', 'sub']);
function inline($, node, slug) {
  let out = '';
  $(node).contents().each((_, n) => {
    if (n.type === 'text') { out += esc(fixText(n.data, slug)); return; }
    if (n.type !== 'tag') return;
    const tag = n.tagName.toLowerCase();
    const inner = inline($, n, slug);
    if (!INLINE.has(tag)) { out += inner; return; }
    if (tag === 'br') { out += '<br>'; return; }
    if (!inner.trim()) { out += inner; return; }
    if (tag === 'a') {
      const href = fixHref($(n).attr('href'));
      out += href ? `<a href="${escAttr(href)}">${inner}</a>` : inner;
      return;
    }
    const t = tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag;
    out += `<${t}>${inner}</${t}>`;
  });
  return out.replace(/\s+/g, ' ').replace(/^(\s|<br>)+|(\s|<br>)+$/g, '').replace(/<\/strong>\s*<strong>/g, ' ');
}
const textOf = html => norm(cheerio.load(`<i>${String(html).replace(/<br\s*\/?>/gi, ' ').replace(/<\/(p|li|h[1-6]|div|td|th|tr|figcaption)>/gi, '$& ')}</i>`)('i').text());
const dropped = html => DROP_TEXT.some(re => re.test(textOf(html)));

// Parse a text-editor fragment into neutral parts: {k:'h',text,level} {k:'p',html} {k:'list',items,ordered} {k:'table',head,rows}
function parseHtml(html, slug) {
  const $ = cheerio.load(`<div id="r">${html}</div>`);
  const r = $('#r');
  // Flatten <li><ul><li>…</li></ul></li> wrappers and drop empty items/lists.
  for (let k = 0; k < 3; k++) {
    r.find('li').each((_, li) => {
      const kids = $(li).children();
      if (kids.length === 1 && /^(ul|ol)$/i.test(kids[0].tagName) && !norm($(li).clone().children().remove().end().text())) $(li).replaceWith($(kids[0]).children());
    });
  }
  r.find('li').each((_, li) => { if (!norm($(li).text())) $(li).remove(); });
  r.find('ul,ol').each((_, l) => { if (!$(l).children('li').length) $(l).remove(); });
  const parts = [];
  const push = p => {
    const last = parts[parts.length - 1];
    if (p.k === 'list' && last && last.k === 'list' && last.ordered === p.ordered) { last.items.push(...p.items); return; }
    parts.push(p);
  };
  const walk = el => {
    $(el).contents().each((_, n) => {
      if (n.type === 'text') { const t = norm(n.data); if (t) push({ k: 'p', html: esc(fixText(t, slug)) }); return; }
      if (n.type !== 'tag') return;
      const tag = n.tagName.toLowerCase();
      // Recase before the brand fixes, so "US24 HEALTHCARE …" does not end up half upper-case.
      if (/^h[1-6]$/.test(tag)) { const t = norm($(n).text()); if (t) push({ k: 'h', text: fixText(recase(t), slug), level: +tag[1] }); return; }
      if (tag === 'ul' || tag === 'ol') {
        // The live lists repeat some items ("Reduce AR backlogs" twice); keep the first.
        const dedupe = new Set();
        const items = $(n).children('li').map((_, li) => inline($, li, slug)).get().filter(x => {
          const k = textOf(x).toLowerCase().replace(/[.\s]+$/, '');
          if (!k || dedupe.has(k)) return false;
          dedupe.add(k);
          return true;
        });
        if (items.length) push({ k: 'list', items, ordered: tag === 'ol' && items.length > 1 });
        return;
      }
      if (tag === 'table') {
        const head = $(n).find('thead th, thead td').map((_, c) => inline($, c, slug)).get();
        const rows = $(n).find('tbody tr').map((_, tr) => [$(tr).children('td,th').map((_, c) => inline($, c, slug)).get()]).get();
        if (rows.length) push({ k: 'table', head, rows });
        return;
      }
      if (tag === 'p' || tag === 'blockquote') {
        const h = inline($, n, slug);
        if (!h || dropped(h)) return;
        const t = textOf(h);
        // A paragraph that is only bold, short and not an intro ("…:") is a sub-heading.
        const kids = $(n).children();
        const allBold = kids.length >= 1 && kids.toArray().every(k => /^(strong|b)$/i.test(k.tagName)) && norm($(n).text()) === norm(kids.text());
        if (allBold && t.length <= 70 && !/[:.]$/.test(t)) { push({ k: 'h', text: fixText(recase(norm($(n).text())), slug), level: 3 }); return; }
        // "– item" paragraphs are a list.
        if (/^[–—•-]\s+/.test(t)) { push({ k: 'list', items: [h.replace(/^[–—•-]\s+/, '')], ordered: false }); return; }
        push({ k: 'p', html: h });
        return;
      }
      if (INLINE.has(tag)) { const h = inline($, n, slug); if (h) push({ k: 'p', html: h }); return; }
      walk(n); // div, span, section…
    });
  };
  walk(r);
  return parts;
}

// Render neutral parts as blocks. Runs of ≥3 "sub-heading + short text/list" become a card grid.
function renderParts(parts, ctx) {
  const out = [];
  let i = 0;
  while (i < parts.length) {
    const groups = [];
    let j = i;
    while (j < parts.length && parts[j].k === 'h' && parts[j].level >= 3) {
      const body = [];
      let k = j + 1;
      while (k < parts.length && parts[k].k !== 'h' && parts[k].k !== 'table') body.push(parts[k++]);
      const size = body.reduce((a, b) => a + (b.html ? textOf(b.html).length : b.items ? b.items.join(' ').length : 0), 0);
      if (!body.length || size > 420) break;
      groups.push({ title: parts[j].text, body });
      j = k;
    }
    if (groups.length >= 3) {
      out.push(grid(groups.map(g => B.group([B.h(esc(g.title), 3), ...g.body.map(b => b.k === 'list' ? B.list(b.items, { cls: 'is-style-us24-check' }) : B.p(b.html))], { cls: 'is-style-us24-card', layout: vstack })), groups.length));
      i = j;
      continue;
    }
    const p = parts[i++];
    if (p.k === 'h') out.push(B.h(esc(p.text), Math.max(3, Math.min(4, p.level))));
    else if (p.k === 'p') out.push(B.p(p.html));
    else if (p.k === 'list') {
      const short = p.items.every(x => textOf(x).split(' ').length <= 6);
      const cls = short && p.items.length >= 4 ? 'is-style-us24-check is-columns' : 'is-style-us24-check';
      out.push(p.ordered && !short ? B.list(p.items, { ordered: true }) : B.list(p.items, { cls }));
    } else if (p.k === 'table') out.push(B.table(p.head, p.rows));
  }
  // A heading with nothing after it (its button was a "Contact us" link) is dropped.
  while (out.length && out[out.length - 1].startsWith('<!-- wp:heading')) out.pop();
  return out;
}

// ---------------------------------------------------------------- page model
function lineOf(slug) { const l = LINE_OF[slug]; return l ? { ...LINES[l.key], key: l.key, isHub: l.hub } : null; }
function titleOf(slug) { return TITLES[slug] || recase(decode(bySlug[slug].title)); }
// Lead paragraph of a page (after taglines shared by several pages are skipped).
const leadCache = {};
function rawLead(p) {
  for (const it of p.sections[0]?.items || []) if (it.t === 'html') { const parts = parseHtml(it.html, p.slug).filter(x => x.k === 'p'); if (parts.length) return parts; }
  return [];
}
const leadCounts = {};
for (const p of SNAPSHOT) { const l = rawLead(p)[0]; if (l) leadCounts[textOf(l.html)] = (leadCounts[textOf(l.html)] || 0) + 1; }
// The lead paragraph is removed from the body wherever it appears, so it is never shown twice.
function leadOf(slug) {
  if (slug in leadCache) return leadCache[slug];
  const p = bySlug[slug];
  let out = { html: '', text: '' };
  if (HERO[slug] && 'lead' in HERO[slug]) out.html = esc(HERO[slug].lead);
  else {
    const first = rawLead(p)[0];
    if (first && leadCounts[textOf(first.html)] < 2) out.html = first.html;
    else {
      // A tagline shared by several pages ("Security is always excessive…"): use the first real paragraph of the body.
      for (let s = 1; s < p.sections.length && !out.html; s++) for (const it of p.sections[s].items) {
        if (it.t !== 'html') continue;
        const para = parseHtml(it.html, slug).find(x => x.k === 'p' && textOf(x.html).length > 60);
        if (para) { out.html = para.html; break; }
      }
      if (!out.html && first) out.html = first.html;
    }
  }
  out.text = textOf(out.html);
  out.key = paraKey(out.text);
  // A long plain paragraph: its first sentences become the lead, the rest stays in the body.
  if (out.text.length > 300 && !/<[a-z]/i.test(out.html)) {
    const sentences = out.text.split(/(?<=[.!?])\s+(?=[A-Z])/);
    let lead = sentences.shift();
    while (sentences.length && (lead + ' ' + sentences[0]).length <= 240) lead += ' ' + sentences.shift();
    if (sentences.length) { out.html = esc(lead); out.rest = sentences.join(' '); out.text = lead; }
  }
  return (leadCache[slug] = out);
}
// Near-duplicate key for paragraphs: the first 60 letters/digits, lower-cased.
function paraKey(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60); }
// Taglines shared by several hero sections; they never appear in a page body.
const TAGLINE_KEYS = new Set(Object.entries(leadCounts).filter(([, n]) => n >= 2).map(([t]) => paraKey(t)));
const cardText = slug => truncate(textOf(leadOf(slug).html), 150);

// ---------------------------------------------------------------- sections
function section(inner, { alt, cls, tight } = {}) {
  return B.group([].concat(inner), { tag: 'section', align: 'full', cls: cx('us24-section', alt && 'is-alt', tight && 'is-tight', cls) });
}
function head({ eyebrow, title, lead, centered, wide }) {
  const inner = [eyebrow && B.p(esc(eyebrow), 'is-style-us24-eyebrow'), title && B.h(esc(title), 2), lead && B.p(lead, 'is-style-us24-lead')].filter(Boolean);
  return inner.length ? B.group(inner, { align: wide ? 'wide' : undefined, cls: cx('us24-section-head', centered && 'is-centered'), layout: { type: 'default' } }) : '';
}
function heroBand(slug, { crumbs = true, buttons = [] } = {}) {
  const line = lineOf(slug);
  const o = HERO[slug] || {};
  const title = o.h1 || titleOf(slug);
  const eyebrow = o.eyebrow ?? (line ? line.name : '');
  const trail = [`<a href="{{home}}/">Home</a>`];
  if (line && !line.isHub) trail.push(`<a href="{{home}}/${line.hub}/">${esc(titleOf(line.hub))}</a>`);
  trail.push(esc(titleOf(slug)));
  const lead = leadOf(slug).html;
  return B.group(
    B.group([
      crumbs && slug !== 'home' ? B.p(trail.join(' / '), 'is-style-us24-crumbs') : '',
      eyebrow ? B.p(esc(eyebrow), 'is-style-us24-eyebrow') : '',
      B.h(esc(title), 1, 'us24-display'),
      lead ? B.p(lead, 'is-style-us24-lead') : '',
      B.buttons(buttons),
    ].filter(Boolean), { align: 'wide', cls: 'us24-hero-band__inner', layout: { type: 'default' } }),
    { tag: 'section', align: 'full', cls: cx('us24-hero-band', line ? line.cls : 'line-company') }
  );
}
function card(title, text, href, { compact, cls } = {}) {
  const t = href ? `<a href="${escAttr(href)}">${esc(title)}</a>` : esc(title);
  return B.group([B.h(t, 3), !compact && text ? B.p(esc(text)) : ''].filter(Boolean), { cls: cx('is-style-us24-card', href && 'has-link', compact && 'is-compact', cls), layout: vstack });
}
const pageCard = (slug, opts) => card(titleOf(slug), cardText(slug), `{{home}}/${slug}/`, opts);

// Body: Elementor sections → segments → blocks.
const SKIP_SECTION = s => s.items.some(i => i.t === 'form') || s.items.every(i => i.t === 'card' && /OFFICE$/i.test(i.title));
function bodySegments(p, { skipFirst = true, skip = [] } = {}) {
  const slug = p.slug;
  const pageTitle = norm(titleOf(slug)).toLowerCase();
  const lead = leadOf(slug);
  const segs = [];
  const seen = new Set();
  p.sections.forEach((s, si) => {
    if (skip.includes(si) || SKIP_SECTION(s)) return;
    if (skipFirst && si === 0) {
      // The first section is the hero; only text beyond the lead paragraph (and kept images) continues into the body.
      const rest = s.items.filter(i => i.t === 'html' || (i.t === 'img' && keptMedia(i.src)));
      if (rest.length) segs.push({ title: '', items: rest.map(i => ({ ...i })), si });
      return;
    }
    let cur = null;
    const open = (title) => { cur = { title, items: [], si }; segs.push(cur); };
    // Three or more sub-headings with text and no section heading: keep them together (they become cards).
    const subs = s.items.filter(i => i.t === 'h' && i.level >= 3).length;
    const keepSubs = subs >= 3 && !s.items.some(i => i.t === 'h' && i.level > 0 && i.level <= 2);
    const prev = segs[segs.length - 1];
    // Continue the previous segment when it is only a heading, or when this section continues its grid.
    const kinds = new Set(s.items.map(i => i.t));
    if (prev && (!prev.items.length || ([...kinds].every(k => k === 'card' || k === 'person') && prev.items.length && prev.items.every(i => kinds.has(i.t))))) cur = prev;
    for (let it of s.items) {
      if (it.t === 'h') {
        let text = fixText(recase(norm(it.text)), slug);
        text = HEADING_FIX[slug]?.[it.text] || HEADING_FIX[slug]?.[text] || text;
        if (text.toLowerCase() === pageTitle && !cur) { open(''); continue; }
        if (keepSubs) { if (!cur) open(''); cur.items.push({ ...it, text }); continue; }
        if (it.level <= 2 || it.level === 0 || !cur || (!cur.title && !cur.items.length)) { if (cur && !cur.title && !cur.items.length) cur.title = text; else open(text); continue; }
        it = { ...it, text };
      }
      if (it.t === 'btn') continue; // section buttons are mostly "Contact us"; pages get their own CTAs
      if (it.t === 'img' && !keptMedia(it.src)) continue;
      if (it.t === 'html') {
        const k = norm(textOf(it.html));
        if (seen.has(k)) continue;
        seen.add(k);
      }
      if (!cur) open('');
      cur.items.push(it);
    }
  });
  // Remove the hero lead (and shared taglines) from the body, then drop items and segments left empty.
  for (const sg of segs) {
    for (const it of sg.items) {
      if (it.t !== 'html') continue;
      it.html = removeParas(it.html, k => TAGLINE_KEYS.has(k), slug, '');
      if (lead.key) it.html = removeParas(it.html, k => k === lead.key, slug, lead.rest || '');
    }
    sg.items = sg.items.filter(it => it.t !== 'html' || textOf(it.html));
  }
  return segs.filter(sg => sg.items.length);
}
// Remove top-level paragraphs whose near-duplicate key matches (or replace them with the lead's remainder).
function removeParas(html, match, slug, replacement) {
  const $ = cheerio.load(`<div id="r">${html}</div>`);
  $('#r').children('p').each((_, n) => {
    if (!match(paraKey(fixText(norm($(n).text()), slug)))) return;
    if (replacement) $(n).text(replacement); else $(n).remove();
  });
  return $('#r').html();
}

const SEEN = {}; // slug -> paragraph keys already rendered (the live pages repeat paragraphs across sections)
function renderSegment(sg, slug, alt) {
  const items = sg.items;
  const cards = items.filter(i => i.t === 'card');
  const persons = items.filter(i => i.t === 'person');
  const imgs = items.filter(i => i.t === 'img' && keptMedia(i.src));
  const quotes = items.filter(i => i.t === 'quote');
  const gallery = items.find(i => i.t === 'gallery');
  const seen = (SEEN[slug] ||= new Set());
  const fresh = parts => parts.filter(x => {
    if (x.k !== 'p') return true;
    const k = paraKey(textOf(x.html));
    if (k.length >= 30 && seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const textParts = items.flatMap(i => i.t === 'html' ? fresh(parseHtml(i.html, slug))
    : i.t === 'h' ? [{ k: 'h', text: i.text, level: 3 }]
    : i.t === 'list' ? [{ k: 'list', items: i.items.map(x => x.href && fixHref(x.href) ? `<a href="${escAttr(fixHref(x.href))}">${esc(fixText(x.text, slug))}</a>` : esc(fixText(x.text, slug))), ordered: false }]
    : []);
  const title = sg.title;

  if (persons.length) {
    return section([head({ title, wide: true }), grid(persons.map(pp => {
      const m = pp.img && keptMedia(pp.img.src);
      const name = titleCase(pp.name), role = titleCase(pp.role.replace(/\s*-\s*/, ' – ')).replace(/Cheif/i, 'Chief');
      return B.group([m ? B.image(useMedia(m), { alt: m.alt, cls: 'is-style-us24-avatar' }) : '', B.h(esc(name), 3), B.p(esc(role))].filter(Boolean), { cls: 'is-style-us24-card us24-person', layout: { type: 'flex', orientation: 'vertical', justifyContent: 'center' } });
    }), 4)], { alt });
  }
  if (cards.length && cards.length >= textParts.filter(x => x.k !== 'h').length) {
    const intro = renderParts(textParts.filter(x => x.k !== 'h'), {});
    const tiles = cards.map(c => {
      const target = c.href && fixHref(c.href);
      const tslug = target && target.startsWith('{{home}}/') ? target.replace('{{home}}/', '').replace(/\/$/, '') : '';
      const own = norm(fixText(c.text, slug));
      // Cards pointing at another page show that page's own summary (the live cards often had the wrong one).
      const text = tslug && bySlug[tslug] ? cardText(tslug) : own;
      const ttl = tslug && bySlug[tslug] ? titleOf(tslug) : recase(norm(fixText(c.title, slug)));
      return card(ttl, text, tslug && bySlug[tslug] ? `{{home}}/${tslug}/` : (target || ''));
    });
    return section([head({ title, wide: true }), ...(intro.length ? [B.group(intro, { align: 'wide', cls: 'us24-prose us24-section-intro', layout: { type: 'default' } })] : []), grid(tiles, cards.length)], { alt });
  }
  if (quotes.length) {
    const cite = q => '— ' + [q.name, q.role].map(x => norm(x || '').replace(/^[-–—\s]+|[,\s]+$/g, '')).filter(Boolean).join(', ');
    return section(B.group(quotes.map(q => B.quote(esc(fixText(q.text.replace(/^"|"$/g, ''), slug)), cite(q))), { layout: { type: 'constrained' } }), { alt, tight: true });
  }
  const textBlocks = renderParts(textParts, {});
  const pills = gallery ? B.list(gallery.imgs.map(g => esc(LOGO_NAMES[g.alt] || LOGO_NAMES[g.src.split('/').pop()] || g.alt)).filter(Boolean), { cls: 'is-style-us24-pills' }) : '';
  if (imgs.length >= 3 && !textBlocks.length) {
    // Galleries in file order (the live page shows the portfolio as page 3, 2, 1).
    const ms = imgs.map(im => keptMedia(im.src)).sort((a, b) => a.file.localeCompare(b.file));
    const t = title || (ms.every(m => /portfolio/.test(m.file)) ? 'Our healthcare marketing portfolio' : '');
    return section([head({ title: t, wide: true }), grid(ms.map(m => B.image(useMedia(m), { alt: m.alt, cls: m.style })), ms.length, 'us24-gallery')], { alt });
  }
  if (imgs.length && textBlocks.length) {
    const m = keptMedia(imgs[0].src);
    const left = [title ? B.h(esc(title), 2) : '', ...textBlocks, pills].filter(Boolean);
    return section(B.columns([left, B.image(useMedia(m), { alt: m.alt, cls: m.style })], { cls: 'us24-split' }), { alt });
  }
  if (imgs.length) {
    // A heading with a badge (ISO certificate) or a lone illustration.
    const m = keptMedia(imgs[0].src);
    return section([head({ title, centered: true }), B.group(B.image(useMedia(m), { alt: m.alt, cls: m.style }), { cls: 'us24-badge-row', layout: { type: 'flex', justifyContent: 'center' } })], { alt, tight: true });
  }
  if (!textBlocks.length && pills) return section([head({ title, centered: true }), B.group(pills, { cls: 'us24-pill-wall', layout: { type: 'flex', justifyContent: 'center', flexWrap: 'wrap' } })], { alt });
  const hasGrid = textBlocks.some(b => b.includes('"type":"grid"'));
  const hasTable = textBlocks.some(b => b.startsWith('<!-- wp:table'));
  if (hasGrid) {
    // Mixed prose and a card grid: keep prose in the reading column, the grid wide.
    const out = [head({ title })];
    let buf = [];
    const flush = () => { if (buf.length) out.push(B.group(buf, { cls: 'us24-prose', layout: { type: 'default' } })); buf = []; };
    for (const b of textBlocks) { if (b.includes('"type":"grid"')) { flush(); out.push(b); } else buf.push(b); }
    flush();
    return section(out, { alt });
  }
  // Text continuing from the hero (section 0) sits close under it.
  return section([title ? B.h(esc(title), 2) : '', B.group([...textBlocks, pills].filter(Boolean), { cls: cx('us24-prose', hasTable && 'has-table'), layout: { type: 'default' } })].filter(Boolean), { alt, tight: sg.si === 0, cls: sg.si === 0 ? 'is-continuation' : '' });
}

function renderBody(p, opts) {
  return bodySegments(p, opts).map((sg, i) => renderSegment(sg, p.slug, i % 2 === 1));
}

// ---------------------------------------------------------------- synced patterns
const SYNCED = [
  {
    key: 'contact', title: 'US24 – Free quote form & offices',
    content: section([
      head({ eyebrow: 'Get a free quote', title: 'Tell us what you need', lead: 'Fill out the form and a member of our team will be in touch shortly. Prefer to talk? Call or email any of our offices.', wide: true }),
      B.columns([B.self('us24/contact-form', { variant: 'contact' }), B.self('us24/offices', { layout: 'cards' })], { cls: 'us24-contact' }),
    ], { cls: 'us24-contact-section' }),
  },
  {
    key: 'trial', title: 'US24 – Risk-free trial',
    content: section(B.group([
      B.group([
        B.p('Risk-free trial', 'is-style-us24-eyebrow'),
        B.h('Our risk-free 30–90 day trial, with no long-term contract', 2),
        B.p('Experience the difference our services make in your net revenue. We believe deeply in what we do, and it’s important for us to see how well every part works together, from billing through customer support and analytics.'),
      ], { cls: 'us24-cta__text', layout: { type: 'default' } }),
      B.buttons([{ text: 'Get a free trial now', href: '{{home}}/contact/' }, { text: 'Explore services', href: '{{home}}/our-services/', outline: true }]),
    ], { align: 'wide', cls: 'us24-cta', layout: { type: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', verticalAlignment: 'center' } }), { tight: true }),
  },
];

// ---------------------------------------------------------------- page composers
const CTA_ADVICE = { text: 'Need advice? Let’s talk', href: '{{home}}/contact/' };
function servicesGrid(alt) {
  return section([
    head({ eyebrow: 'Services', title: 'Our services', lead: 'One partner for revenue cycle management, IT and back-office work.', wide: true }),
    grid(SERVICE_ORDER.map(([k, d]) => B.group([B.h(`<a href="{{home}}/${LINES[k].hub}/">${esc(LINES[k].name)}</a>`, 3), B.p(esc(d))], { cls: cx('is-style-us24-card has-link', LINES[k].cls), layout: vstack })), 9),
  ], { alt });
}
function homePage() {
  const p = bySlug.home;
  const about = p.sections[1].items;
  const [rcmList, itList] = about.filter(i => i.t === 'list');
  const intro = parseHtml(about.find(i => i.t === 'html').html, 'home').filter(x => x.k === 'p');
  const stats = p.sections[4].items;
  const quote = p.sections[5].items.find(i => i.t === 'quote');
  const ehr = bySlug['revenue-cycle-management'].sections.flatMap(s => s.items).find(i => i.t === 'gallery');
  const pill = items => B.list(items.map(x => esc(fixText(x.text, 'home').replace(/Website Development- /, 'Website development: '))), { cls: 'is-style-us24-pills' });
  return [
    B.self('us24/hero-3d', { align: 'full' }),
    servicesGrid(false),
    section(B.columns([
      [B.p('About US24 Solutions', 'is-style-us24-eyebrow'), B.h('Customized solutions for every client', 2), ...intro.slice(0, 1).map(x => B.p(x.html)), B.buttons([{ text: 'Learn more about us', href: '{{home}}/about/', outline: true }])],
      [B.h('Revenue cycle services', 3), pill(rcmList.items), B.h('Technology & business services', 3), pill(itList.items)],
    ], { cls: 'us24-split' }), { alt: true }),
    section([
      head({ eyebrow: 'In numbers', title: 'US24 at a glance', wide: true }),
      grid(stats.map(s => B.group([B.p(esc(`${s.prefix}${s.value}${s.suffix}`), 'us24-stat__num'), B.p(esc(s.title.replace(/Centers/, 'Centres')), 'us24-stat__label')], { cls: 'is-style-us24-card us24-stat', layout: vstack })), 4, 'us24-grid us24-stats'),
    ]),
    B.ref('trial'),
    section([head({ eyebrow: 'What our clients say', centered: true }), B.group(B.quote(esc(quote.text), '— ' + quote.name.replace(/,\s*$/, '')), { layout: { type: 'constrained' } })], { tight: true }),
    section([head({ eyebrow: 'Systems we work in', title: 'Inside the EHR and PM systems you already use', centered: true }), B.group(B.list(ehr.imgs.map(g => esc(LOGO_NAMES[g.alt] || g.alt)), { cls: 'is-style-us24-pills' }), { cls: 'us24-pill-wall', layout: { type: 'flex', justifyContent: 'center', flexWrap: 'wrap' } })], { alt: true }),
    B.ref('contact'),
  ];
}
function hubPage(slug) {
  const line = lineOf(slug);
  const p = bySlug[slug];
  const kids = line.children;
  const blocks = [heroBand(slug, { buttons: [CTA_ADVICE, { text: 'Start a free trial', href: '{{home}}/contact/', outline: true }] })];
  if (kids.length) blocks.push(section([head({ eyebrow: line.name, title: `Our ${line.short} services`, wide: true }), grid(kids.map(k => pageCard(k)), kids.length)]));
  // The rest of the hub body, minus its own card grid (rebuilt above).
  // RCM sections 9–10 ("The results will amaze you") build stats from loose headings; they become a stats grid.
  const isRcm = slug === 'revenue-cycle-management';
  const segs = bodySegments(p, { skip: isRcm ? [9, 10] : [] }).filter(sg => !sg.items.every(i => i.t === 'card'));
  if (isRcm) {
    const at = segs.findIndex(sg => sg.si > 10);
    segs.splice(at < 0 ? segs.length : at, 0, { stats: true });
  }
  segs.forEach((sg, i) => {
    if (sg.stats) {
      blocks.push(section([head({ eyebrow: 'Results', title: 'The results will amaze you', wide: true }), grid([
        ['Up to 20%', 'reduction in cost to collect'], ['Up to 5%', 'increase in net patient revenue'], ['Up to 40%', 'increase in patient satisfaction'],
      ].map(([n, l]) => B.group([B.p(esc(n), 'us24-stat__num'), B.p(esc(l), 'us24-stat__label')], { cls: 'is-style-us24-card us24-stat', layout: vstack })), 3, 'us24-grid us24-stats')], { alt: i % 2 === 0 }));
    } else blocks.push(renderSegment(sg, slug, i % 2 === 0));
  });
  if (slug === 'revenue-cycle-management') blocks.push(B.ref('trial'));
  blocks.push(B.ref('contact'));
  return blocks;
}
function childPage(slug) {
  const line = lineOf(slug);
  const p = bySlug[slug];
  const blocks = [heroBand(slug, { buttons: [CTA_ADVICE, ...(line.children.length ? [{ text: `All ${line.short} services`, href: `{{home}}/${line.hub}/`, outline: true }] : [])] })];
  blocks.push(...renderBody(p));
  const sibs = line.children.filter(s => s !== slug);
  if (sibs.length) blocks.push(section([head({ eyebrow: line.name, title: 'Related services', wide: true }), grid(sibs.map(s => pageCard(s, { compact: true })), 3)], { alt: true, tight: true }));
  return blocks;
}
function standalonePage(slug) {
  const blocks = [heroBand(slug, { buttons: [CTA_ADVICE, { text: 'See all services', href: '{{home}}/our-services/', outline: true }] })];
  const p = bySlug[slug];
  if (slug === 'laptop-repair-software-services') {
    // The repair list and the photo read best side by side.
    const list = parseHtml(p.sections[1].items[0].html, slug);
    const m = MEDIA['2026/05/Laptop-Repair-Software-Services.jpg'];
    blocks.push(section(B.columns([[B.h(esc(list[0].text), 2), B.list(list[1].items, { cls: 'is-style-us24-check is-columns' })], B.image(useMedia(m), { alt: m.alt, cls: m.style })], { cls: 'us24-split' })));
    blocks.push(...bodySegments(p).filter(sg => sg.si >= 2).map((sg, i) => renderSegment(sg, slug, i % 2 === 0)));
  } else if (slug === 'digital-marketing') {
    const s1 = p.sections[1].items;
    const subs = [];
    for (let i = 0; i < s1.length; i++) if (s1[i].t === 'h' && /^\d\)/.test(s1[i].text)) subs.push({ title: s1[i].text.replace(/^\d\)\s*/, ''), html: s1.slice(i + 1).find(x => x.t === 'html').html });
    const introHtml = s1.find(x => x.t === 'html').html;
    blocks.push(section([head({ eyebrow: 'What we do', title: 'Complete digital marketing', lead: parseHtml(introHtml, slug)[0].html, wide: true }),
      grid(subs.map((s, n) => B.group([B.p(`0${n + 1}`, 'us24-card__num'), B.h(esc(s.title), 3), ...renderParts(parseHtml(s.html, slug).map(x => x.k === 'h' ? { k: 'p', html: `<strong>${esc(x.text)}</strong>` } : x), {}).map(b => b.replace('is-style-us24-check is-columns', 'is-style-us24-check'))], { cls: 'is-style-us24-card', layout: vstack })), 3)]));
    blocks.push(...bodySegments(p).filter(sg => sg.si >= 2).map((sg, i) => renderSegment(sg, slug, i % 2 === 0)));
  } else {
    blocks.push(...renderBody(p));
  }
  return blocks;
}
function companyPage(slug) {
  const p = bySlug[slug];
  if (slug === 'contact') return [heroBand(slug), B.ref('contact')];
  if (slug === 'our-services') return [heroBand(slug, { buttons: [CTA_ADVICE] }), servicesGrid(false), B.ref('trial'), B.ref('contact')];
  if (slug === 'blogs') return [heroBand(slug)];
  if (slug === 'career') {
    const culture = parseHtml(p.sections[1].items.find(i => i.t === 'html').html, slug)[0];
    const cards = p.sections.slice(3).flatMap(s => s.items).filter(i => i.t === 'card');
    return [
      heroBand(slug, { buttons: [{ text: 'Apply now', href: '#apply' }] }),
      section([head({ eyebrow: 'Why join us?', title: 'Company culture', lead: culture.html, wide: true }), grid(cards.map(c => card(norm(c.title), norm(c.text), '')), cards.length)]),
      B.group([
        head({ eyebrow: 'Apply now', title: 'Send us your CV', lead: 'Tell us which role you are interested in and attach your CV. Our HR team reads every application.' }),
        B.self('us24/contact-form', { variant: 'career' }),
      ], { tag: 'section', align: 'full', anchor: 'apply', cls: 'us24-section is-alt', layout: { type: 'constrained' } }),
    ];
  }
  const buttons = slug === 'about' ? [{ text: 'Work with us', href: '{{home}}/contact/' }, { text: 'Our services', href: '{{home}}/our-services/', outline: true }]
    : slug === 'csr' ? [{ text: 'Contact us', href: '{{home}}/contact/', outline: true }] : [];
  const blocks = [heroBand(slug, { buttons })];
  if (LEGAL.has(slug) || slug === 'coding') {
    // Classic text pages: drop the leading line that repeats the title.
    const parts = p.sections.flatMap((s, si) => si === 0 && s.id !== 'classic' ? [] : s.items).filter(i => i.t === 'html').flatMap(i => parseHtml(i.html, slug));
    while (parts.length && parts[0].k !== 'list' && /^(legal|terms (&|and) conditions|privacy policy)$/i.test(textOf(parts[0].html || esc(parts[0].text)))) parts.shift();
    blocks.push(section(B.group(renderParts(parts.map(x => x.k === 'h' ? { ...x, level: Math.max(3, x.level) } : x), {}), { cls: 'us24-prose', layout: { type: 'default' } })));
    return blocks;
  }
  blocks.push(...renderBody(p, { skipFirst: true }));
  return blocks;
}

// ---------------------------------------------------------------- descriptions
function describe(slug) {
  const lead = textOf(leadOf(slug).html);
  let d = lead;
  if (!d && (LEGAL.has(slug) || bySlug[slug].sections[0]?.id === 'classic')) {
    // Text pages: the first real paragraphs, not the headings above them.
    const paras = bySlug[slug].sections.flatMap(s => s.items).filter(i => i.t === 'html').flatMap(i => parseHtml(i.html, slug)).filter(x => x.k === 'p').map(x => textOf(x.html));
    d = paras.filter(x => !/^(welcome to|legal disclaimer)/i.test(x) && x.length > 30).slice(0, 2).join(' ');
  }
  if (d.length < 90) {
    // Add the next sentence of the body.
    const secs = bySlug[slug].sections;
    const body = (secs[0]?.id === 'classic' ? secs : secs.slice(1)).flatMap(s => s.items).filter(i => i.t === 'html').map(i => textOf(fixText(i.html, slug))).join(' ')
      .replace(/^(Legal|Terms & Conditions|Privacy Policy)\s*/i, '');
    const extra = body.replace(lead, '').split(/(?<=[.!?])\s+/).find(x => x.length > 40);
    if (extra) d = d ? `${/[.!?]$/.test(d) ? d : d + '.'} ${extra}` : extra;
  }
  return truncate(fixText(d, slug), 158);
}

// ---------------------------------------------------------------- assemble
const items = [];
const order = [...COMPANY, ...Object.values(LINES).flatMap(l => [l.hub, ...l.children, ...(l.extra || [])])];
const missing = SNAPSHOT.filter(p => p.kind === 'page' && !order.includes(p.slug)).map(p => p.slug);
if (missing.length) throw new Error('pages not mapped: ' + missing.join(', '));
order.forEach((slug, n) => {
  const p = bySlug[slug];
  if (!p) throw new Error('missing page ' + slug);
  const line = lineOf(slug);
  const blocks = slug === 'home' ? homePage()
    : COMPANY.includes(slug) || slug === 'coding' ? companyPage(slug)
    : line.isHub && line.children.length ? hubPage(slug)
    : line.isHub ? standalonePage(slug)
    : childPage(slug);
  const notes = [...(NOTES[slug] || [])];
  if (HERO[slug]?.composed) notes.push('Intro sentence written for the new site from facts on the live pages.');
  items.push({
    type: 'page', slug, title: titleOf(slug), status: DRAFTS.has(slug) ? 'draft' : 'publish', template: 'canvas', order: n,
    content: blocks.filter(Boolean).join('\n\n'), description: slug === 'home' ? 'US24 Solutions offers end-to-end revenue cycle management for healthcare, plus Salesforce CRM, web development, DevOps, cyber security and accounting & payroll.' : describe(slug),
    notes, front: slug === 'home' || undefined, posts_page: slug === 'blogs' || undefined,
  });
});
for (const p of SNAPSHOT.filter(x => x.kind === 'post')) {
  const parts = p.sections.flatMap(s => s.items).filter(i => i.t === 'html').flatMap(i => parseHtml(i.html, p.slug));
  items.push({ type: 'post', slug: p.slug, title: decode(p.title), status: 'publish', date: p.date.replace('T', ' '), excerpt: truncate(textOf(parts.find(x => x.k === 'p')?.html || ''), 200),
    content: B.group(renderParts(parts, {}), { cls: 'us24-prose', layout: { type: 'default' } }), description: truncate(textOf(parts.find(x => x.k === 'p')?.html || ''), 158), notes: [] });
}

// Duplicate descriptions are an SEO problem; report them so they can be fixed in NOTES/HERO.
const dupes = Object.entries(items.reduce((a, i) => ((a[i.description] = (a[i.description] || []).concat(i.slug)), a), {})).filter(([, v]) => v.length > 1);

// ---------------------------------------------------------------- media download + write
fs.mkdirSync(path.join(OUT, 'media'), { recursive: true });
const media = {};
for (const [file, m] of usedMedia) {
  const dest = path.join(OUT, 'media', file);
  if (!fs.existsSync(dest)) {
    const r = await fetch(UPLOADS + m.src, { headers: { 'User-Agent': 'Mozilla/5.0 US24 content build' } });
    if (!r.ok) throw new Error(`download ${m.src}: ${r.status}`);
    fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  }
  media[file] = { alt: m.alt, title: m.title };
}
for (const f of fs.readdirSync(path.join(OUT, 'media'))) if (!usedMedia.has(f)) fs.unlinkSync(path.join(OUT, 'media', f));

const pkg = { version: '1.0.0', generated: new Date().toISOString().slice(0, 10), source: 'us24solutions.com', media, blocks: SYNCED, items };
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pkg, null, 1) + '\n');
console.log(`items ${items.length} (pages ${items.filter(i => i.type === 'page').length}, drafts ${items.filter(i => i.status === 'draft').length}), media ${usedMedia.size}, patterns ${SYNCED.length}`);
if (dupes.length) console.log('duplicate descriptions:', JSON.stringify(dupes));
