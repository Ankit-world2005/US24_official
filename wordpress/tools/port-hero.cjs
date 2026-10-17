// Port the standalone "US24 3D Hero.html" script into the theme's block view script.
// The 3D scene (helpers → post-processing) is copied verbatim; only the DOM wiring, the copy and the
// claims change. Every replacement must match exactly once, so a changed source fails loudly.
//
// usage: node port-hero.cjs "<path to US24 3D Hero.html>" <out view.js>
const fs = require('fs');

const [src, out] = process.argv.slice(2);
const html = fs.readFileSync(src, 'utf8');
const m = html.match(/<script>\n([\s\S]*?)\n<\/script>/);
if (!m) throw new Error('inline script not found');
const lines = m[1].split('\n');

// Scene body: from "// ---------- helpers ----------" up to (not including) "// ---------- hotspots ----------".
const start = lines.findIndex(l => l.includes('// ---------- helpers ----------'));
const hot = lines.findIndex(l => l.includes('// ---------- hotspots ----------'));
const setup = lines.findIndex(l => l.includes("const reduce = window.matchMedia"));
if (start < 0 || hot < 0 || setup < 0) throw new Error('section markers not found');

let renderer = lines.slice(setup, start).join('\n');
let scene = lines.slice(start, hot).join('\n');
let tail = lines.slice(hot, lines.length - 1).join('\n'); // drop the closing "})();"

function swap(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected 1 match, got ${n}: ${from}`);
  return text.replace(from, to);
}

renderer = swap(renderer, "const canvas = document.getElementById('gl');", "const canvas = root.querySelector('.us24-hero__gl');");

tail = swap(tail, "const labelsEl = document.getElementById('labels');", "const labelsEl = root.querySelector('.us24-hero__labels');");
tail = swap(tail, "{key:'datacenter', text:'Automation', c:'#2FD3A6'", "{key:'datacenter', text:'Technology', c:'#5FD0FF'");

// Brand palette: the standalone file is teal; the site is US24 blue and orange (logo navy #253A8D, orange #F68535).
// Claims stay blue, payments become orange, denials gold. Each swap must match exactly once.
const SCENE_COLOURS = [
  ["const floors = [{key:'front', color:0x2FD3A6, css:'#2FD3A6', name:'Front end'},{key:'mid', color:0x5B9BFF, css:'#6FA8FF', name:'Mid-cycle'},{key:'back', color:0xF5B04A, css:'#FFB84F', name:'Back end'},{key:'consult', color:0xA48BFF, css:'#A48BFF', name:'Credentialing'}];",
   "const floors = [{key:'front', color:0xF68535, css:'#F68535', name:'Front end'},{key:'mid', color:0x5B82FF, css:'#7C9CFF', name:'Mid-cycle'},{key:'back', color:0xFFC145, css:'#FFCF5C', name:'Back end'},{key:'consult', color:0x4FC3FF, css:'#5FD0FF', name:'Credentialing'}];"],
  // Rooftop sign spelled like the logo: U and 24 in white, the S in orange.
  ["g.fillStyle = '#FFFFFF'; g.fillText('US', x, h/2); x += wa;",
   "const wu = g.measureText('U').width; g.fillStyle = '#FFFFFF'; g.fillText('U', x, h/2); g.fillStyle = '#F68535'; g.fillText('S', x + wu, h/2); x += wa;"],
  ["g.fillStyle = '#2FD3A6'; g.fillText('24', x, h/2); x += wb;", "g.fillStyle = '#FFFFFF'; g.fillText('24', x, h/2); x += wb;"],
  ["r()<0.8 ? '#2FD3A6' : '#5B9BFF'", "r()<0.8 ? '#F68535' : '#7C9CFF'"],
  ["emissive:0xF5B04A", "emissive:0xF68535"],
  ["color:0x0A1A2C", "color:0x0A1640"],
  ["color:0x2FD3A6, wireframe:true", "color:0x7C9CFF, wireframe:true"],
  ["color:0x0E3B30, emissive:0x2FD3A6", "color:0x3A1A05, emissive:0xF68535"],
  ["color:0x8EF0D2", "color:0xFFB27A"],
  ["color:0x2FD3A6, transparent:true, opacity:0.06", "color:0x5B82FF, transparent:true, opacity:0.08"],
  ["emissive:0x2FD3A6, emissiveIntensity:0.5", "emissive:0x5B82FF, emissiveIntensity:0.5"],
  ["0x7FB2FF, 14", "0x8FAEFF, 14"],
  ["0x46E6B9, 12", "0xFF9A4D, 12"],
  ["0xFFBE5C, 3", "0xFFD36B, 3"],
];
for (const [from, to] of SCENE_COLOURS) scene = swap(scene, from, to);
tail = swap(tail, "text:'US24 HQ', c:'#2FD3A6'", "text:'US24 HQ', c:'#F68535'");
tail = swap(tail, "text:'Clinics', c:'#6FA8FF'", "text:'Clinics', c:'#7C9CFF'");
tail = swap(tail, "text:'Payers', c:'#FFB84F'", "text:'Payers', c:'#FFCF5C'");
tail = swap(tail, "key:'offices', text:o.name, c:'#2FD3A6'", "key:'offices', text:o.name, c:'#F68535'");
tail = swap(tail, "b.className='hot'+(d.minor?' minor':'');", "b.className='us24-hot'+(d.minor?' minor':'');");
tail = swap(tail, "const tourEl = document.getElementById('tour');", "const tourEl = root.querySelector('.us24-hero__tour');");
tail = swap(tail, "if (first){ first = false; loading.style.opacity = '0'; setTimeout(()=>loading.remove(), 900); }",
  "if (first){ first = false; root.classList.add('is-live'); loading.style.opacity = '0'; setTimeout(()=>loading.remove(), 900); }");
// On a website the headline sits on the left, so shift the projection right to keep the city (and its labels) clear
// of the text. Labels and raycasting use the same projection matrix, so they stay aligned.
tail = swap(tail, "camera.fov = w < 820 ? 46 : 36; camera.updateProjectionMatrix();",
  "camera.fov = w < 820 ? 46 : 36;\n      if (w >= 821 && !hero.classList.contains('nocopy')) camera.setViewOffset(w, h, -Math.round(w * 0.15), 0, w, h); else camera.clearViewOffset();\n      camera.updateProjectionMatrix();");
tail = swap(tail, "window.addEventListener('resize', resize); resize();",
  "window.addEventListener('resize', resize); if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero); resize();");

const preamble = `/* US24 3D hero: front-end script for the us24/hero-3d block.
 * Ported from "US24 3D Hero.html" by wordpress/tools/port-hero.cjs. Edit the data below or the source file,
 * not the scene code in the middle (it is regenerated). Needs three.js r128 + addons (registered by the theme). */
(function(){
  'use strict';
  const root = document.querySelector('.us24-hero[data-us24-hero]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';

  const HOME = (root.dataset.home || '/').replace(/\\/?$/, '/');
  const link = slug => HOME + slug + '/';
  const CONFIG = {
    autoTour: root.dataset.autoTour !== '0',
    tourSeconds: Math.max(3, parseFloat(root.dataset.tourSeconds) || 8)
  };
  const hero = root;

  // Facts below match us24solutions.com (crawled 2026-10-15): home, about, RCM and end-to-end RCM pages.
  const STOPS = [
    {id:'core', name:'US24 HQ', c:'#F68535', eyebrow:'Headquarters', title:'One team, the whole revenue cycle',
      text:'Each floor of the building is one stage of the cycle, backed by our own robotic process automation.',
      list:['Front end · Mid-cycle · Back end · Credentialing','99% of claims paid','Up to 5% more net patient revenue'],
      href:link('end-to-end-revenue-cycle-management-services'), more:'End-to-end RCM'},
    {id:'practice', name:'Clinics', c:'#7C9CFF', eyebrow:'Your practice', title:'Charges in, payments back',
      text:'We work inside the EHR and practice management systems you already use.',
      list:['eClinicalWorks, Epic, athenahealth, Kareo','AdvancedMD, Cerner, NextGen, Allscripts','Eligibility verified before the visit'],
      href:link('eligibility-verification-prior-authorization'), more:'Eligibility & prior authorization'},
    {id:'payers', name:'Payers', c:'#FFCF5C', eyebrow:'Insurers', title:'Clean claims, fewer denials',
      text:'Claims go out electronically. Denials come back to our back-end floor to be worked and resubmitted.',
      list:['Electronic CMS-1500 / UB-04 claims','EDI, ERA and EFT enrollment','Persistent A/R follow-up'],
      href:link('denial-management'), more:'Denial management'},
    {id:'offices', name:'Global teams', c:'#F68535', eyebrow:'Chicago · Uxbridge · Noida', title:'Three offices, one cycle',
      text:'Teams in the US, UK and India keep work moving across time zones.',
      list:['USA headquarters in Chicago, IL','UK office in Uxbridge','India office in Noida'],
      href:link('contact'), more:'Contact an office'},
    {id:'overview', name:'Overview', c:'#F68535', eyebrow:'US24 Solutions', title:'RCM, IT services & consulting',
      text:'Risk-free 30–90 day trial with no long-term contract.',
      list:['ISO 9001:2015 certified','HIPAA compliant','100+ happy customers and counting'],
      href:link('about'), more:'About US24'}
  ];
  const EXTRA = {
    front:{c:'#F68535', eyebrow:'Floor 1 · Front end', title:'Before the visit', text:'Coverage and authorizations confirmed up front.', list:['Patient scheduling & appointments','Eligibility verification & prior authorization','Patient registration & demographics'], href:link('eligibility-verification-prior-authorization'), more:'Eligibility & prior authorization'},
    mid:{c:'#7C9CFF', eyebrow:'Floor 2 · Mid-cycle', title:'Charges & coding', text:'Codes built to hold up to payer review.', list:['Charge entry & charge audit','Medical coding & coding audit','Clinical documentation improvement'], href:link('medical-coding-services'), more:'Medical coding'},
    back:{c:'#FFCF5C', eyebrow:'Floor 3 · Back end', title:'Getting paid', text:'Every open or denied claim worked to resolution.', list:['Remittance processing & payment posting','Accounts receivable follow-up','Denial management & credit balances'], href:link('accounts-receivable-services'), more:'Accounts receivable'},
    consult:{c:'#5FD0FF', eyebrow:'Floor 4 · Credentialing', title:'Credentialing & enrollment', text:'Providers enrolled with payers and kept current.', list:['Credentialing & re-credentialing','EDI, ERA and EFT enrollment','CAQH profile maintenance'], href:link('provider-enrollment-credentialing-services'), more:'Enrollment & credentialing'},
    datacenter:{c:'#5FD0FF', eyebrow:'Technology annex', title:'Automation, and IT for clients', text:'Proprietary robotic process automation runs inside our billing work, and the same engineers deliver IT services.', list:['Salesforce CRM & cloud','Web, app & DevOps','Cyber security & 24x7 NOC/SOC'], href:link('our-services'), more:'All services'}
  };

  const card = root.querySelector('.us24-hero__card');
  function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  let currentKey = 'overview';
  function showCard(key){
    const d = STOPS.find(s=>s.id===key) || EXTRA[key]; if (!d) return;
    currentKey = key;
    card.classList.add('swap');
    setTimeout(()=>{
      card.style.setProperty('--c', d.c);
      card.innerHTML = '<div class="eyebrow">'+esc(d.eyebrow)+'</div><h2>'+esc(d.title)+'</h2><p>'+esc(d.text)+'</p><ul>'+d.list.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>'
        + (d.href ? '<a class="more" href="'+esc(d.href)+'">'+esc(d.more||'Learn more')+' →</a>' : '');
      card.classList.remove('swap');
    }, 180);
    root.querySelectorAll('.us24-hot').forEach(h=>h.classList.toggle('on', h.dataset.key===key));
  }

  const loading = document.createElement('div');
  loading.className = 'us24-hero__loading'; loading.setAttribute('aria-hidden', 'true'); loading.textContent = 'LOADING 3D…';
  function fail(){ loading.remove(); root.classList.add('is-fallback'); showCard('overview'); }

  function start(){
  if (!window.THREE || !THREE.OrbitControls) { fail(); return; }
  root.appendChild(loading);
`;

const ending = `
  }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start, {once:true});
})();
`;

const body = [renderer, scene, tail].join('\n');
const indented = body.split('\n').map(l => (l ? '  ' + l : l)).join('\n');
fs.writeFileSync(out, preamble + indented + ending);
console.log('wrote', out, (preamble + indented + ending).split('\n').length, 'lines');
