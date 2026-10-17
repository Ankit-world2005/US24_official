/* US24 3D hero: front-end script for the us24/hero-3d block.
 * Ported from "US24 3D Hero.html" by wordpress/tools/port-hero.cjs. Edit the data below or the source file,
 * not the scene code in the middle (it is regenerated). Needs three.js r128 + addons (registered by the theme). */
(function(){
  'use strict';
  const root = document.querySelector('.us24-hero[data-us24-hero]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';

  const HOME = (root.dataset.home || '/').replace(/\/?$/, '/');
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
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    const canvas = root.querySelector('.us24-hero__gl');
    let renderer;
    try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'}); }
    catch(e){ fail(); return; }
    renderer.setPixelRatio(Math.min(small ? 1.5 : 2, window.devicePixelRatio||1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 900);
    const controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.07;
    controls.minDistance = 10; controls.maxDistance = 95;
    controls.maxPolarAngle = Math.PI*0.46;
    controls.enablePan = false;
    controls.autoRotateSpeed = 0.22;
    // Website-friendly: the mouse wheel and phone swipes keep scrolling the page instead of zooming the model.
    controls.enableZoom = false;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) controls.enabled = false;
    canvas.style.touchAction = 'pan-y';

    // ---------- helpers ----------
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    function canvasTex(w, h, draw, srgb){
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      if (srgb !== false) t.encoding = THREE.sRGBEncoding;
      t.anisotropy = maxAniso;
      return t;
    }
    function rand(seed){ let s = seed % 2147483647; if (s <= 0) s += 2147483646; return ()=> (s = s * 16807 % 2147483647) / 2147483647; }
    const pickables = [];
    function tag(obj, key){ obj.traverse(o=>{ if (o.isMesh){ o.userData.key = key; pickables.push(o); } }); }
    function shadowAll(obj){ obj.traverse(o=>{ if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; } }); }
    const rgb = (c,k)=>'rgb('+Math.round(Math.min(255,c[0]*k))+','+Math.round(Math.min(255,c[1]*k))+','+Math.round(Math.min(255,c[2]*k))+')';

    // ---------- sun & sky (golden hour) ----------
    const SUN_DIR = new THREE.Vector3(-0.78, 0.26, 0.57).normalize();
    const sunPhi = Math.atan2(SUN_DIR.z, -SUN_DIR.x);
    const sunU = ((sunPhi/(Math.PI*2)) % 1 + 1) % 1;
    const sunElev = Math.asin(SUN_DIR.y);
    function paintSky(g, W, H){
      const gr = g.createLinearGradient(0,0,0,H);
      [[0,'#1D3466'],[0.18,'#36558E'],[0.33,'#7A88B4'],[0.42,'#C9A2A6'],[0.47,'#F0B98C'],[0.5,'#FFD7A0'],[0.505,'#7D7378'],[0.6,'#3A3A44'],[1,'#1A1C22']].forEach(s=>gr.addColorStop(s[0], s[1]));
      g.fillStyle = gr; g.fillRect(0,0,W,H);
      const sx = sunU*W, sy = H*(0.5 - sunElev/Math.PI);
      [sx, sx-W, sx+W].forEach(x=>{
        let rg = g.createRadialGradient(x, sy, 0, x, sy, W*0.28);
        rg.addColorStop(0,'rgba(255,214,160,0.75)'); rg.addColorStop(0.35,'rgba(255,170,110,0.25)'); rg.addColorStop(1,'rgba(255,150,100,0)');
        g.fillStyle = rg; g.fillRect(0,0,W,H*0.52);
        rg = g.createRadialGradient(x, sy, 0, x, sy, W*0.012);
        rg.addColorStop(0,'rgba(255,250,235,1)'); rg.addColorStop(1,'rgba(255,236,200,0)');
        g.fillStyle = rg; g.fillRect(x-W*0.02, sy-W*0.02, W*0.04, W*0.04);
      });
      const r = rand(1234);
      g.save();
      if ('filter' in g) g.filter = 'blur(6px)';
      for (let i=0;i<140;i++){
        const cx = r()*W, cy = H*(0.28 + r()*0.19), rw = W*(0.02 + r()*0.07), rh = H*(0.004 + r()*0.012);
        let du = Math.abs(cx - sx)/W; du = Math.min(du, 1-du);
        const warm = Math.max(0, 1 - du*3.2);
        const col = warm > 0.05 ? 'rgba(255,'+Math.round(170+60*warm)+','+Math.round(140+40*warm)+','+(0.18+0.35*warm)+')' : 'rgba(150,135,165,'+(0.18+r()*0.2)+')';
        g.fillStyle = col;
        g.beginPath(); g.ellipse(cx, cy, rw, rh, 0, 0, Math.PI*2); g.fill();
      }
      g.restore();
    }
    const skyTex = canvasTex(2048, 1024, paintSky);
    const skyGeo = new THREE.SphereGeometry(400, 64, 32);
    const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({map:skyTex, side:THREE.BackSide, fog:false, toneMapped:false}));
    scene.add(sky);

    // Environment for reflections: the same sky plus a dark ground
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({map:skyTex, side:THREE.BackSide})));
    const eg = new THREE.Mesh(new THREE.CircleGeometry(49, 32), new THREE.MeshBasicMaterial({color:0x24262C})); eg.rotation.x = -Math.PI/2; eg.position.y = -2; envScene.add(eg);
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, 0.02).texture;

    scene.add(new THREE.HemisphereLight(0xA9BCE0, 0x3A3028, 0.55));
    const sun = new THREE.DirectionalLight(0xFFBE8C, 2.6);
    sun.position.copy(SUN_DIR).multiplyScalar(60); sun.target.position.set(0,0,-3);
    sun.castShadow = true;
    const sm = small ? 2048 : 4096;
    sun.shadow.mapSize.set(sm, sm);
    Object.assign(sun.shadow.camera, {left:-48, right:48, top:42, bottom:-42, near:1, far:180});
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.025;
    scene.add(sun, sun.target);
    const bounce = new THREE.DirectionalLight(0x7F97CF, 0.4); bounce.position.set(40, 25, -30); scene.add(bounce);
    scene.fog = new THREE.Fog(0x9C8C98, 80, 300);

    // ---------- materials ----------
    const roofMat = new THREE.MeshStandardMaterial({color:0x5A5F66, roughness:0.92});
    const concrete = new THREE.MeshStandardMaterial({color:0xC9CBCD, roughness:0.85});
    const darkMetal = new THREE.MeshStandardMaterial({color:0x2A3038, roughness:0.35, metalness:0.85});
    const aluminium = new THREE.MeshStandardMaterial({color:0xB8BEC6, roughness:0.3, metalness:0.9});

    // ---------- contact shadows ----------
    const aoTex = canvasTex(128, 128, (g,w,h)=>{
      g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0,0,w,h);
      if ('filter' in g) g.filter = 'blur(14px)';
      g.fillStyle = 'rgba(0,0,0,1)'; g.fillRect(w*0.24, h*0.24, w*0.52, h*0.52);
    }, false);
    const aoMat = new THREE.MeshBasicMaterial({map:aoTex, transparent:true, opacity:0.55, depthWrite:false, color:0x000000});
    function contact(w, d, x, z, y, k){
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w*(k||1.9), d*(k||1.9)), aoMat);
      m.rotation.x = -Math.PI/2; m.position.set(x, y!=null?y:0.262, z); m.renderOrder = 1; scene.add(m);
    }

    // ---------- facades ----------
    function facade(cols, rows, o){
      const r = rand(o.seed||7);
      const cw = 32, ch = 44, W = Math.min(1024, cols*cw), H = Math.min(1024, rows*ch);
      const cellW = W/cols, cellH = H/rows;
      const mx = o.mullion || 3, sp = o.spandrel != null ? o.spandrel : 0.22;
      const cells = [];
      for (let y=0;y<rows;y++) for (let x=0;x<cols;x++) cells.push({x, y, lit: r() < o.lit, blinds: r() < 0.35, warm: r() < 0.7, k: 0.5 + r()*0.5, tint: 0.85 + r()*0.3});
      const map = canvasTex(W, H, (g)=>{
        g.fillStyle = o.frame; g.fillRect(0,0,W,H);
        cells.forEach(c=>{
          const x0 = c.x*cellW + mx, y0 = c.y*cellH + mx, w = cellW - mx*2, h = cellH*(1-sp) - mx;
          const gr = g.createLinearGradient(0, y0, 0, y0+h);
          gr.addColorStop(0, rgb(o.sky, c.tint)); gr.addColorStop(0.55, rgb(o.glass, c.tint)); gr.addColorStop(1, rgb(o.glass, c.tint*0.7));
          g.fillStyle = gr; g.fillRect(x0, y0, w, h);
          if (c.blinds){ g.fillStyle = 'rgba(220,214,200,0.35)'; for (let k=0;k<h*0.45;k+=3) g.fillRect(x0, y0+k, w, 1.2); }
          g.fillStyle = o.spandrelColor || 'rgba(0,0,0,0.35)';
          g.fillRect(c.x*cellW, c.y*cellH + cellH*(1-sp), cellW, cellH*sp);
        });
      });
      const emissiveMap = canvasTex(W, H, (g)=>{
        g.fillStyle = '#000'; g.fillRect(0,0,W,H);
        cells.forEach(c=>{
          if (!c.lit) return;
          const x0 = c.x*cellW + mx, y0 = c.y*cellH + mx, w = cellW - mx*2, h = cellH*(1-sp) - mx;
          const gr = g.createLinearGradient(0, y0, 0, y0+h);
          const col = c.warm ? [255, 214, 160] : [205, 225, 255];
          gr.addColorStop(0, 'rgba('+col+','+c.k+')'); gr.addColorStop(1, 'rgba('+col+','+(c.k*0.35)+')');
          g.fillStyle = gr; g.fillRect(x0, y0, w, h);
          if (c.blinds){ g.fillStyle = 'rgba(0,0,0,0.5)'; for (let k=0;k<h*0.45;k+=3) g.fillRect(x0, y0+k, w, 1.2); }
        });
      });
      const roughnessMap = canvasTex(W, H, (g)=>{
        g.fillStyle = 'rgb(205,205,205)'; g.fillRect(0,0,W,H);
        cells.forEach(c=>{
          const x0 = c.x*cellW + mx, y0 = c.y*cellH + mx;
          g.fillStyle = 'rgb(18,18,18)'; g.fillRect(x0, y0, cellW - mx*2, cellH*(1-sp) - mx);
        });
      }, false);
      return {map, emissiveMap, roughnessMap};
    }
    const facadeMats = [];
    function facadeMat(w, h, o){
      const f = facade(Math.max(2, Math.round(w*o.density)), Math.max(1, Math.round(h/o.floorH)), o);
      const m = new THREE.MeshStandardMaterial({map:f.map, emissiveMap:f.emissiveMap, roughnessMap:f.roughnessMap, emissive:0xffffff, emissiveIntensity:o.glow!=null?o.glow:0.55, roughness:1, metalness:o.metal!=null?o.metal:0.55, envMapIntensity:1.5});
      facadeMats.push(m);
      return m;
    }

    function building(p){
      const g = new THREE.Group(), y0 = p.y||0, st = p.style;
      const front = facadeMat(p.w, p.h, st), side = facadeMat(p.d, p.h, Object.assign({}, st, {seed:(st.seed||1)+11}));
      const body = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), [side, side, roofMat, roofMat, front, front]);
      body.position.y = p.h/2 + y0; g.add(body);
      const slabMat = new THREE.MeshStandardMaterial({color:new THREE.Color(st.frame), roughness:0.6, metalness:0.3});
      const floors = Math.round(p.h/st.floorH);
      for (let k=1;k<floors;k++){ const s = new THREE.Mesh(new THREE.BoxGeometry(p.w+0.07, 0.06, p.d+0.07), slabMat); s.position.y = y0 + k*(p.h/floors); g.add(s); }
      if (!p.noRoof){
        const parapet = new THREE.Mesh(new THREE.BoxGeometry(p.w+0.12, 0.35, p.d+0.12), slabMat); parapet.position.y = p.h + y0 + 0.17; g.add(parapet);
        const inner = new THREE.Mesh(new THREE.BoxGeometry(p.w-0.2, 0.36, p.d-0.2), roofMat); inner.position.y = p.h + y0 + 0.19; g.add(inner);
        const r = rand(st.seed||3);
        for (let i=0;i<(p.units!=null?p.units:2);i++){
          const u = new THREE.Mesh(new THREE.BoxGeometry(0.7+r()*0.6, 0.45+r()*0.35, 0.6+r()*0.5), aluminium);
          u.position.set((r()-0.5)*(p.w-1.6), p.h+y0+0.55, (r()-0.5)*(p.d-1.6)); g.add(u);
        }
        if (p.tank){ const t = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.9, 16), concrete); t.position.set(p.w*0.22, p.h+y0+0.8, -p.d*0.2); g.add(t); }
      }
      g.position.set(p.x, 0, p.z);
      shadowAll(g);
      if (!p.y) contact(p.w, p.d, p.x, p.z);
      return g;
    }

    // ---------- ground ----------
    const grassTex = canvasTex(512, 512, (g,w,h)=>{
      g.fillStyle = '#3F5132'; g.fillRect(0,0,w,h);
      const r = rand(42);
      for (let i=0;i<14000;i++){ const v = r(); g.fillStyle = v<0.5 ? 'rgba(80,100,58,0.35)' : 'rgba(48,62,38,0.35)'; g.fillRect(r()*w, r()*h, 2, 3); }
      for (let x=0;x<w;x+=64){ g.fillStyle = 'rgba(255,255,255,0.025)'; g.fillRect(x, 0, 32, h); }
    });
    grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.repeat.set(60, 60);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({map:grassTex, roughness:1}));
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

    function asphalt(len, lanes){
      const t = canvasTex(1024, 192, (g,w,h)=>{
        g.fillStyle = '#2A2C30'; g.fillRect(0,0,w,h);
        const r = rand(9);
        for (let i=0;i<9000;i++){ const v = 30+Math.round(r()*40); g.fillStyle = 'rgba('+v+','+v+','+(v+3)+',0.5)'; g.fillRect(r()*w, r()*h, 1.5, 1.5); }
        for (let i=0;i<6;i++){ g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, h*(0.28+i*0.09), w, h*0.03); }
        g.fillStyle = '#E6E2D6'; g.fillRect(0, 8, w, 4); g.fillRect(0, h-12, w, 4);
        g.fillStyle = '#E2B13C'; g.fillRect(0, h/2-5, w, 3); g.fillRect(0, h/2+2, w, 3);
      });
      t.wrapS = THREE.RepeatWrapping; t.repeat.set(len/10, 1);
      return new THREE.MeshStandardMaterial({map:t, roughness:0.55, metalness:0.15, envMapIntensity:1.2});
    }
    function road(len, width, x, z, rot){
      const m = new THREE.Mesh(new THREE.PlaneGeometry(len, width), asphalt(len));
      m.rotation.x = -Math.PI/2; m.rotation.z = rot||0; m.position.set(x, 0.02, z); m.receiveShadow = true; scene.add(m);
    }
    road(200, 6.4, 0, 8, 0); road(49.6, 5, -9, -20.2, Math.PI/2); road(49.6, 5, 9, -20.2, Math.PI/2);
    // crosswalks
    const zebraMat = new THREE.MeshStandardMaterial({color:0xE8E6DE, roughness:0.7});
    [-9, 9].forEach(x=>{ for (let i=0;i<8;i++){ const s = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.42), zebraMat); s.rotation.x = -Math.PI/2; s.position.set(x, 0.035, 5.35 + i*0.76); s.receiveShadow = true; scene.add(s); } });

    const paverTex = canvasTex(256, 256, (g,w,h)=>{
      g.fillStyle = '#BDBDB8'; g.fillRect(0,0,w,h);
      const r = rand(3);
      for (let y=0;y<h;y+=32) for (let x=0;x<w;x+=64){ const v = 175+Math.round(r()*30); g.fillStyle = 'rgb('+v+','+v+','+(v-4)+')'; g.fillRect(x+((y/32)%2)*32+1, y+1, 62, 30); }
    });
    paverTex.wrapS = paverTex.wrapT = THREE.RepeatWrapping;
    function plaza(w, d, x, z){
      const t = paverTex.clone(); t.needsUpdate = true; t.repeat.set(w/3, d/3);
      const top = new THREE.MeshStandardMaterial({map:t, roughness:0.8});
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), [concrete, concrete, top, concrete, concrete, concrete]);
      m.position.set(x, 0.125, z); m.receiveShadow = true; scene.add(m);
    }
    plaza(16, 18, -18.5, -4); plaza(14, 18, 0, -4); plaza(16, 18, 18.5, -4);
    plaza(200, 2.4, 0, 12.4);
    // parking stalls in front of the clinics
    const stallTex = canvasTex(512, 64, (g,w,h)=>{ g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0,0,w,h); g.fillStyle = '#F2F0EA'; for (let x=0;x<=w;x+=64) g.fillRect(x, 0, 3, h); }, true);
    const stalls = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.6), new THREE.MeshBasicMaterial({map:stallTex, transparent:true, opacity:0.8, depthWrite:false}));
    stalls.rotation.x = -Math.PI/2; stalls.position.set(-18.5, 0.262, 3.4); scene.add(stalls);

    // ---------- trees ----------
    const trunkMat = new THREE.MeshStandardMaterial({color:0x4C3A2C, roughness:0.95});
    const leafCols = [0x3D6B35, 0x4E7A3A, 0x2F5A30, 0x6A8A3E];
    const leafMats = leafCols.map(c=>new THREE.MeshStandardMaterial({color:c, roughness:0.9, flatShading:true}));
    function blob(radius, seed){
      const geo = new THREE.IcosahedronGeometry(radius, 2);
      const pos = geo.attributes.position, r = rand(seed), v = new THREE.Vector3();
      for (let i=0;i<pos.count;i++){ v.fromBufferAttribute(pos, i); v.multiplyScalar(0.82 + r()*0.32); pos.setXYZ(i, v.x, v.y, v.z); }
      geo.computeVertexNormals();
      return geo;
    }
    function tree(x, z, s, seed){
      const g = new THREE.Group(), r = rand(seed);
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08*s, 0.14*s, 1.6*s, 7), trunkMat); t.position.y = 0.8*s; g.add(t);
      const n = 3 + Math.floor(r()*3);
      for (let i=0;i<n;i++){
        const l = new THREE.Mesh(blob((0.55+r()*0.35)*s, seed*10+i), leafMats[Math.floor(r()*leafMats.length)]);
        l.position.set((r()-0.5)*0.9*s, (1.7 + r()*0.8)*s, (r()-0.5)*0.9*s); g.add(l);
      }
      g.position.set(x, 0.25, z); shadowAll(g); scene.add(g);
      contact(1.2*s, 1.2*s, x, z, 0.262, 1.6);
    }
    [[-25,4.2],[-12,4.2],[-25,-12.5],[-12,-12.5],[6,4.6],[-6,4.6],[12,4.2],[25,4.2],[25,-12.5],[12,-12.5],[-30,12.4],[-21,12.4],[-12,12.4],[-3,12.4],[6,12.4],[15,12.4],[24,12.4],[33,12.4],[-34,-6],[34,-4],[-36,-16],[36,-18],[-6,-12.8],[-2,-12.8]].forEach(([x,z],i)=>tree(x, z, 0.95+((i*37)%6)/10, 50+i));

    // ---------- street lights ----------
    const lampMat = new THREE.MeshStandardMaterial({color:0x222222, emissive:0xFFCF8F, emissiveIntensity:1.6});
    const glowTex = canvasTex(64, 64, (g,w,h)=>{
      const gr = g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
      gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.22,'rgba(255,255,255,.8)'); gr.addColorStop(0.55,'rgba(255,255,255,.15)'); gr.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0,0,w,h);
    });
    const lampGlow = new THREE.SpriteMaterial({map:glowTex, color:0xFFC27A, transparent:true, opacity:0.35, depthWrite:false, blending:THREE.AdditiveBlending});
    function lamp(x, z, facing){
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 3.6, 10), darkMetal); pole.position.y = 1.8; g.add(pole);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8), darkMetal); arm.rotation.x = Math.PI/2; arm.position.set(0, 3.55, 0.45*facing); g.add(arm);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.5), lampMat); head.position.set(0, 3.5, 0.9*facing); g.add(head);
      const glow = new THREE.Sprite(lampGlow); glow.scale.setScalar(1.1); glow.position.set(0, 3.42, 0.9*facing); g.add(glow);
      g.position.set(x, 0.25, z); scene.add(g);
      pole.castShadow = true; arm.castShadow = true;
    }
    for (let x=-70; x<=70; x+=10){ lamp(x, 4.5, 1); lamp(x+5, 11.5, -1); }

    // ---------- cars ----------
    const carColors = [0x9E1B23, 0xE9EBEE, 0x1A222D, 0x2F5F96, 0x7E848C, 0x1C4F41, 0xC9C2B4, 0x0F0F12];
    const glassMat = new THREE.MeshStandardMaterial({color:0x0B1016, roughness:0.05, metalness:0.95, envMapIntensity:1.6});
    const tyreMat = new THREE.MeshStandardMaterial({color:0x121212, roughness:0.9});
    const headMat = new THREE.MeshStandardMaterial({color:0x222222, emissive:0xFFF2D6, emissiveIntensity:2.4});
    const tailMat = new THREE.MeshStandardMaterial({color:0x220000, emissive:0xFF2A2A, emissiveIntensity:2});
    const bodyShape = new THREE.Shape();
    [[-0.95,0.2],[0.95,0.2],[0.98,0.44],[0.62,0.54],[0.28,0.82],[-0.46,0.84],[-0.82,0.58],[-0.98,0.52]].forEach((p,i)=> i ? bodyShape.lineTo(p[0],p[1]) : bodyShape.moveTo(p[0],p[1]));
    const winShape = new THREE.Shape();
    [[0.56,0.56],[0.26,0.79],[-0.44,0.8],[-0.76,0.58]].forEach((p,i)=> i ? winShape.lineTo(p[0],p[1]) : winShape.moveTo(p[0],p[1]));
    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {depth:0.8, bevelEnabled:true, bevelThickness:0.06, bevelSize:0.05, bevelSegments:3, steps:1}); bodyGeo.translate(0,0,-0.4);
    const winGeo = new THREE.ExtrudeGeometry(winShape, {depth:0.82, bevelEnabled:true, bevelThickness:0.05, bevelSize:0.02, bevelSegments:2, steps:1}); winGeo.translate(0,0,-0.41);
    const tyreGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.16, 20); tyreGeo.rotateX(Math.PI/2);
    const rimGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.17, 12); rimGeo.rotateX(Math.PI/2);
    function car(color){
      const g = new THREE.Group();
      const paint = new THREE.MeshStandardMaterial({color, roughness:0.18, metalness:0.7, envMapIntensity:1.4});
      g.add(new THREE.Mesh(bodyGeo, paint));
      g.add(new THREE.Mesh(winGeo, glassMat));
      [[0.6,0.45],[0.6,-0.45],[-0.62,0.45],[-0.62,-0.45]].forEach(([x,z])=>{
        const t = new THREE.Mesh(tyreGeo, tyreMat); t.position.set(x, 0.19, z); g.add(t);
        const r = new THREE.Mesh(rimGeo, aluminium); r.position.set(x, 0.19, z); g.add(r);
      });
      [0.28,-0.28].forEach(z=>{
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.2), headMat); h.position.set(1.0, 0.42, z); g.add(h);
        const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.2), tailMat); t.position.set(-1.0, 0.48, z); g.add(t);
      });
      shadowAll(g);
      return g;
    }
    [[-23.5,3.4],[-21,3.4],[-16,3.4],[-13.5,3.4],[17,3.4],[20,3.4],[14.5,3.4]].forEach(([x,z],i)=>{ const c = car(carColors[i%carColors.length]); c.position.set(x, 0.25, z); c.rotation.y = Math.PI/2; scene.add(c); contact(2.0, 1.0, x, z, 0.263, 1.25); });
    const traffic = [];
    for (let i=0;i<14;i++){
      const east = i%2===0, c = car(carColors[(i*3)%carColors.length]);
      c.position.set(-84 + i*12, 0.02, east ? 9.5 : 6.5); c.rotation.y = east ? 0 : Math.PI; scene.add(c);
      traffic.push({c, dir: east ? 1 : -1, speed: 5.5 + (i%3)*1.4});
    }

    // ---------- clinics ----------
    const practice = new THREE.Group(); scene.add(practice);
    const crossMat = new THREE.MeshStandardMaterial({color:0x000000, emissive:0xffffff, emissiveIntensity:1.1, emissiveMap: canvasTex(128,128,(g,w,h)=>{
      g.fillStyle = '#EEF5F2'; g.fillRect(0,0,w,h);
      g.fillStyle = '#12A57B'; g.fillRect(w*0.38, h*0.14, w*0.24, h*0.72); g.fillRect(w*0.14, h*0.38, w*0.72, h*0.24);
    })});
    const clinicStyle = (seed)=>({frame:'#E4E2DC', glass:[46,66,76], sky:[150,170,190], lit:0.45, density:1.4, floorH:1.4, seed, metal:0.4, spandrel:0.3, spandrelColor:'#D8D4CB', glow:0.45});
    [{x:-23, z:-8, w:5.5, d:4.5, h:4.2},{x:-15, z:-9, w:4.5, d:4.5, h:7},{x:-23, z:-0.5, w:4.5, d:4, h:2.8},{x:-14.5, z:-1, w:4, d:4, h:5.6}].forEach((b,i)=>{
      practice.add(building(Object.assign({style:clinicStyle(20+i), units:2}, b)));
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), crossMat); s.position.set(b.x + b.w*0.3, b.h - 0.6, b.z + b.d/2 + 0.04); practice.add(s);
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.3), concrete); canopy.position.set(b.x - b.w*0.15, 1.45, b.z + b.d/2 + 0.65); canopy.castShadow = true; practice.add(canopy);
      [-1, 1].forEach(sx=>{ const pst = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), aluminium); pst.position.set(b.x - b.w*0.15 + sx*1.1, 0.85, b.z + b.d/2 + 1.2); practice.add(pst); });
    });
    tag(practice, 'practice');

    // ---------- HQ ----------
    const hq = new THREE.Group(); scene.add(hq);
    const HQ = {x:0, z:-4, w:9, d:7}, lobbyH = 2.4, floorH = 2.4, base = 0.25;
    const lobbyGlass = new THREE.MeshStandardMaterial({color:0x8FA5B4, roughness:0.04, metalness:0.9, transparent:true, opacity:0.55, emissive:0xFFD2A0, emissiveIntensity:0.35, envMapIntensity:1.6});
    const lobby = new THREE.Mesh(new THREE.BoxGeometry(HQ.w-0.6, lobbyH, HQ.d-0.6), lobbyGlass); lobby.position.set(HQ.x, lobbyH/2+base, HQ.z); hq.add(lobby); tag(lobby, 'core');
    const lobbyFloor = new THREE.Mesh(new THREE.BoxGeometry(HQ.w-0.7, 0.05, HQ.d-0.7), new THREE.MeshStandardMaterial({color:0xD8D2C6, roughness:0.3})); lobbyFloor.position.set(HQ.x, base+0.03, HQ.z); hq.add(lobbyFloor);
    for (let i=0;i<6;i++){ const col = new THREE.Mesh(new THREE.BoxGeometry(0.3, lobbyH, 0.3), concrete); col.position.set(HQ.x - HQ.w/2 + 0.6 + i*(HQ.w-1.2)/5, lobbyH/2+base, HQ.z + HQ.d/2 - 0.3); hq.add(col); }
    const floors = [{key:'front', color:0xF68535, css:'#F68535', name:'Front end'},{key:'mid', color:0x5B82FF, css:'#7C9CFF', name:'Mid-cycle'},{key:'back', color:0xFFC145, css:'#FFCF5C', name:'Back end'},{key:'consult', color:0x4FC3FF, css:'#5FD0FF', name:'Credentialing'}];
    const ledMats = {};
    floors.forEach((f, i)=>{
      const y0 = base + lobbyH + i*floorH;
      const style = {frame:'#20262E', glass:[34,52,70], sky:[170,160,175], lit:0.7, density:1.8, floorH:floorH, seed:60+i, mullion:2, spandrel:0.16, spandrelColor:'#1A1F26', metal:0.7, glow:0.6};
      const front = facadeMat(HQ.w, floorH, style), side = facadeMat(HQ.d, floorH, Object.assign({}, style, {seed:70+i}));
      const g = new THREE.Group();
      const slab = new THREE.Mesh(new THREE.BoxGeometry(HQ.w, floorH-0.22, HQ.d), [side, side, roofMat, roofMat, front, front]); slab.position.set(HQ.x, y0 + (floorH-0.22)/2, HQ.z); g.add(slab);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(HQ.w+0.4, 0.22, HQ.d+0.4), concrete); plate.position.set(HQ.x, y0 + floorH - 0.11, HQ.z); g.add(plate);
      const led = new THREE.MeshStandardMaterial({color:0x111111, emissive:f.color, emissiveIntensity:1.3}); ledMats[f.key] = led;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(HQ.w+0.42, 0.04, HQ.d+0.42), led); strip.position.set(HQ.x, y0 + floorH - 0.235, HQ.z); g.add(strip);
      for (let k=1;k<12;k++){ const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, floorH-0.22, 0.32), darkMetal); fin.position.set(HQ.x - HQ.w/2 + k*(HQ.w/12), y0 + (floorH-0.22)/2, HQ.z + HQ.d/2 + 0.16); g.add(fin); }
      hq.add(g); tag(g, f.key);
    });
    const roofY = base + lobbyH + floors.length*floorH;
    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(HQ.w+0.5, 0.45, HQ.d+0.5), darkMetal); roofSlab.position.set(HQ.x, roofY+0.22, HQ.z); hq.add(roofSlab);
    const signMat = new THREE.MeshStandardMaterial({color:0x000000, emissive:0xffffff, emissiveIntensity:1.5});
    function drawSign(){
      const t = canvasTex(1024, 256, (g,w,h)=>{
        g.fillStyle = '#000'; g.fillRect(0,0,w,h); g.textBaseline = 'middle';
        const big = '800 150px "Bricolage Grotesque", "Segoe UI", sans-serif', sm = '700 70px "Bricolage Grotesque", "Segoe UI", sans-serif';
        g.font = big; const wa = g.measureText('US').width, wb = g.measureText('24').width;
        g.font = sm; const wc = g.measureText(' SOLUTIONS').width;
        let x = (w - (wa+wb+wc))/2;
        g.font = big; const wu = g.measureText('U').width; g.fillStyle = '#FFFFFF'; g.fillText('U', x, h/2); g.fillStyle = '#F68535'; g.fillText('S', x + wu, h/2); x += wa;
        g.fillStyle = '#FFFFFF'; g.fillText('24', x, h/2); x += wb;
        g.font = sm; g.fillStyle = '#FFFFFF'; g.fillText(' SOLUTIONS', x, h/2+20);
      });
      if (signMat.emissiveMap) signMat.emissiveMap.dispose();
      signMat.emissiveMap = t; signMat.needsUpdate = true;
    }
    drawSign();
    if (document.fonts && document.fonts.load) document.fonts.load('800 150px "Bricolage Grotesque"').then(drawSign).catch(()=>{});
    const signFrame = new THREE.Mesh(new THREE.BoxGeometry(7.4, 1.9, 0.18), darkMetal); signFrame.position.set(HQ.x, roofY+1.6, HQ.z+1.2); hq.add(signFrame);
    const signF = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), signMat); signF.position.set(HQ.x, roofY+1.6, HQ.z+1.3); hq.add(signF);
    const signB = signF.clone(); signB.rotation.y = Math.PI; signB.position.z = HQ.z+1.1; hq.add(signB);
    [-3,3].forEach(dx=>{ const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), darkMetal); leg.position.set(HQ.x+dx, roofY+0.6, HQ.z+1.2); hq.add(leg); });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 3, 8), aluminium); mast.position.set(HQ.x+3.4, roofY+1.9, HQ.z-2.6); hq.add(mast);
    const beaconMat = new THREE.MeshStandardMaterial({color:0x220000, emissive:0xFF3B3B, emissiveIntensity:3});
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), beaconMat); beacon.position.set(HQ.x+3.4, roofY+3.45, HQ.z-2.6); hq.add(beacon);
    for (let i=0;i<3;i++){ const u = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.9), aluminium); u.position.set(HQ.x-3+i*1.5, roofY+0.75, HQ.z-2.4); hq.add(u); }
    const ent = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 2.2), concrete); ent.position.set(HQ.x, 2.25, HQ.z+HQ.d/2+1.0); hq.add(ent);
    shadowAll(hq);
    tag(roofSlab, 'core'); tag(signF, 'core'); tag(signB, 'core'); tag(signFrame, 'core');
    contact(HQ.w, HQ.d, HQ.x, HQ.z);
    // reflecting pool in front of HQ
    const poolRim = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.3, 1.9), concrete); poolRim.position.set(HQ.x, 0.4, 2.6); poolRim.receiveShadow = true; scene.add(poolRim);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 1.5), new THREE.MeshStandardMaterial({color:0x0C1B26, roughness:0.03, metalness:0.95, envMapIntensity:2})); water.rotation.x = -Math.PI/2; water.position.set(HQ.x, 0.56, 2.6); water.receiveShadow = true; scene.add(water);
    [-4.6, 4.6].forEach(x=>{ const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.5), concrete); b.position.set(x, 0.45, 2.6); b.castShadow = true; scene.add(b); });

    // data center annex
    const dc = new THREE.Group(); scene.add(dc);
    dc.add(building({x:4.2, z:-10.6, w:4.6, d:3.2, h:3, units:4, style:{frame:'#3A414B', glass:[28,36,46], sky:[90,96,110], lit:0, density:1.2, floorH:3, seed:90, metal:0.4, spandrel:0.5, spandrelColor:'#3A414B'}}));
    const rackTex = canvasTex(256, 64, (g,w,h)=>{ g.fillStyle = '#000'; g.fillRect(0,0,w,h); const r = rand(5); for (let x=4;x<w;x+=10) for (let y=6;y<h;y+=8) if (r()<0.55){ g.fillStyle = r()<0.8 ? '#F68535' : '#7C9CFF'; g.fillRect(x, y, 4, 2); } });
    const rack = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), new THREE.MeshStandardMaterial({color:0x000000, emissive:0xffffff, emissiveMap:rackTex, emissiveIntensity:1.3})); rack.position.set(4.2, 1.5, -10.6+1.61); dc.add(rack);
    tag(dc, 'datacenter');

    // ---------- payer towers ----------
    const payers = new THREE.Group(); scene.add(payers);
    const tStyle = (seed, glass)=>({frame:'#1C232C', glass, sky:[176,162,170], lit:0.35, density:1.6, floorH:1.3, seed, mullion:2, spandrel:0.18, spandrelColor:'#151A21', metal:0.75, glow:0.5});
    const towers = [
      {x:14, z:-9, w:4.5, d:4.5, h:15, glass:[30,48,66]},
      {x:21.5, z:-8, w:5.2, d:5.2, h:9, glass:[26,42,60], top:{w:4, d:4, h:13}},
      {x:22, z:0, w:4, d:4, h:12, glass:[40,56,70]},
      {x:14.5, z:-1, w:3.6, d:3.6, h:9.6, glass:[36,60,76]}
    ];
    towers.forEach((t,i)=>{
      payers.add(building({x:t.x, z:t.z, w:t.w, d:t.d, h:t.h, units:t.top?0:1, noRoof:!!t.top, tank:!t.top, style:tStyle(100+i, t.glass)}));
      let topY = t.h;
      if (t.top){
        const ledge = new THREE.Mesh(new THREE.BoxGeometry(t.w+0.1, 0.3, t.d+0.1), roofMat); ledge.position.set(t.x, t.h+0.15, t.z); ledge.castShadow = ledge.receiveShadow = true; payers.add(ledge);
        payers.add(building({x:t.x, z:t.z, w:t.top.w, d:t.top.d, h:t.top.h, y:t.h+0.3, units:1, style:tStyle(120+i, t.glass)}));
        topY = t.h + 0.3 + t.top.h;
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.1, 3.6, 8), aluminium); spire.position.set(t.x, topY+2.1, t.z); spire.castShadow = true; payers.add(spire);
      }
      const tw = t.top ? t.top.w : t.w, td = t.top ? t.top.d : t.d;
      const crown = new THREE.Mesh(new THREE.BoxGeometry(tw+0.16, 0.08, td+0.16), new THREE.MeshStandardMaterial({color:0x111111, emissive:0xF68535, emissiveIntensity:1.2})); crown.position.set(t.x, topY - 0.35, t.z); payers.add(crown);
    });
    tag(payers, 'payers');

    // background skyline in haze
    const far = rand(321);
    for (let i=0;i<60;i++){
      const ang = -Math.PI*0.05 - far()*Math.PI*0.9, rad = 85 + far()*70;
      const x = Math.cos(ang)*rad, z = Math.sin(ang)*rad*0.7 - 25;
      const h = 10 + far()*36, w = 5 + far()*7;
      const m = facadeMat(w, h, {frame:'#3A3F4A', glass:[60,66,82], sky:[170,150,160], lit:0.15, density:0.9, floorH:2, seed:400+i, mullion:3, spandrel:0.25, spandrelColor:'#3A3F4A', metal:0.4, glow:0.35});
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w*(0.7+far()*0.6)), [m,m,roofMat,roofMat,m,m]); b.position.set(x, h/2, z); scene.add(b);
    }

    // ---------- hologram globe ----------
    const globe = new THREE.Group(); globe.position.set(HQ.x, roofY + 9.5, HQ.z); scene.add(globe);
    const R = 2.4;
    const gcore = new THREE.Mesh(new THREE.SphereGeometry(R*0.985, 48, 32), new THREE.MeshStandardMaterial({color:0x0A1640, roughness:0.15, metalness:0.6, transparent:true, opacity:0.55, envMapIntensity:1.5}));
    globe.add(gcore); gcore.userData.key = 'offices'; pickables.push(gcore);
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(R, 36, 18), new THREE.MeshBasicMaterial({color:0x7C9CFF, wireframe:true, transparent:true, opacity:0.22, depthWrite:false})));
    function ll(lat, lon, r){ const phi=(90-lat)*Math.PI/180, th=(lon+180)*Math.PI/180; return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(th), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(th)); }
    const offices = [{name:'Chicago', lat:41.88, lon:-87.63},{name:'Uxbridge', lat:51.55, lon:-0.48},{name:'Noida', lat:28.54, lon:77.39}];
    const pinMat = new THREE.MeshStandardMaterial({color:0x3A1A05, emissive:0xF68535, emissiveIntensity:2.2});
    const officeAnchors = [];
    offices.forEach(o=>{
      const p = ll(o.lat, o.lon, R);
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), pinMat); pin.position.copy(p); pin.userData.key='offices'; globe.add(pin); pickables.push(pin);
      const a = new THREE.Object3D(); a.position.copy(p.clone().multiplyScalar(1.3)); globe.add(a); officeAnchors.push({anchor:a, name:o.name});
    });
    for (let i=0;i<3;i++){
      const a = ll(offices[i].lat, offices[i].lon, R), b = ll(offices[(i+1)%3].lat, offices[(i+1)%3].lon, R);
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R*1.45);
      globe.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 48, 0.025, 6, false), new THREE.MeshBasicMaterial({color:0xFFB27A, transparent:true, opacity:0.85})));
    }
    const beamH = 9.5 - R - 0.5;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(R*0.5, 0.8, beamH, 32, 1, true), new THREE.MeshBasicMaterial({color:0x5B82FF, transparent:true, opacity:0.08, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending}));
    beam.position.set(HQ.x, roofY + 0.5 + beamH/2, HQ.z); scene.add(beam);
    const projector = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.35, 32), new THREE.MeshStandardMaterial({color:0x2A3038, emissive:0x5B82FF, emissiveIntensity:0.5, metalness:0.8, roughness:0.25}));
    projector.position.set(HQ.x, roofY+0.6, HQ.z); projector.castShadow = true; scene.add(projector);

    // ---------- data flows (subtle light streaks) ----------
    function curve(points){ return new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],p[2]))); }
    const frontZ = HQ.z + HQ.d/2;
    const flows = [];
    function addFlow(c, color, count, speed, size){
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(c, 180, 0.02, 6, false), new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.16, depthWrite:false})));
      const mats = [1, 0.6, 0.35, 0.2, 0.1].map(o=>new THREE.SpriteMaterial({map:glowTex, color, transparent:true, opacity:o, depthWrite:false, blending:THREE.AdditiveBlending, fog:false}));
      for (let i=0;i<count;i++){
        const parts = mats.map((m,k)=>{ const s = new THREE.Sprite(m); s.scale.setScalar(size*(1-k*0.15)); scene.add(s); return s; });
        flows.push({parts, c, t:i/count, speed});
      }
    }
    addFlow(curve([[-18,8,-3],[-12,11.5,0],[-6,9.5,frontZ+2.4],[0,7.4,frontZ+3],[6,10.5,frontZ+2.2],[12,16,-2],[17,18.5,-6]]), 0x8FAEFF, 14, 0.045, 0.75);
    addFlow(curve([[19,9,-11],[12,6.5,-14],[5,5.2,-12],[0,4.8,HQ.z-HQ.d/2-2.4],[-6,5.4,-12],[-12,6.2,-14],[-18,6,-11]]), 0xFF9A4D, 12, 0.04, 0.8);
    addFlow(curve([[15,12,-6],[11,16,-2],[5,12.5,frontZ+1.6],[0, base+lobbyH+2*floorH+1.1, frontZ+0.7]]), 0xFFD36B, 3, 0.06, 0.7);

    // ---------- post-processing: bloom, tilt-shift lens, film grain & vignette ----------
    let composer = null, bloom = null, hTilt = null, vTilt = null, grain = null;
    const GrainShader = {
      uniforms:{ tDiffuse:{value:null}, time:{value:0}, amount:{value:0.03}, vignette:{value:0.42} },
      vertexShader:'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader:'uniform sampler2D tDiffuse; uniform float time; uniform float amount; uniform float vignette; varying vec2 vUv;'+
        'float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }'+
        'void main(){ vec4 c = texture2D(tDiffuse, vUv); float n = rnd(vUv*vec2(1873.0,1237.0) + fract(time)); c.rgb += (n-0.5)*amount;'+
        'float d = distance(vUv, vec2(0.5)); c.rgb *= 1.0 - vignette*smoothstep(0.38, 0.9, d); gl_FragColor = c; }'
    };
    try {
      if (THREE.EffectComposer && THREE.UnrealBloomPass && THREE.GammaCorrectionShader){
        const rt = renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget
          ? new THREE.WebGLMultisampleRenderTarget(4, 4, {format:THREE.RGBAFormat})
          : new THREE.WebGLRenderTarget(4, 4, {format:THREE.RGBAFormat});
        composer = new THREE.EffectComposer(renderer, rt);
        composer.addPass(new THREE.RenderPass(scene, camera));
        bloom = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.45, 0.86);
        composer.addPass(bloom);
        if (THREE.HorizontalTiltShiftShader && THREE.VerticalTiltShiftShader){
          hTilt = new THREE.ShaderPass(THREE.HorizontalTiltShiftShader); vTilt = new THREE.ShaderPass(THREE.VerticalTiltShiftShader);
          hTilt.uniforms.r.value = vTilt.uniforms.r.value = 0.52;
          composer.addPass(hTilt); composer.addPass(vTilt);
        }
        composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
        grain = new THREE.ShaderPass(GrainShader);
        composer.addPass(grain);
      }
    } catch(e){ composer = null; }

    // ---------- hotspots ----------
    const labelsEl = root.querySelector('.us24-hero__labels');
    const hots = [
      {key:'core', text:'US24 HQ', c:'#F68535', pos:new THREE.Vector3(HQ.x, roofY+3.2, HQ.z+1.2)},
      {key:'practice', text:'Clinics', c:'#7C9CFF', pos:new THREE.Vector3(-18.5, 9.2, -4)},
      {key:'payers', text:'Payers', c:'#FFCF5C', pos:new THREE.Vector3(21.5, 26.5, -8)},
      {key:'datacenter', text:'Technology', c:'#5FD0FF', pos:new THREE.Vector3(4.2, 4.6, -10.6), minor:true}
    ];
    floors.forEach((f,i)=>hots.push({key:f.key, text:f.name, c:f.css, pos:new THREE.Vector3(HQ.x - HQ.w/2 - 0.5, base+lobbyH+i*floorH+floorH*0.55, HQ.z + HQ.d/2), side:'left', minor:true}));
    officeAnchors.forEach(o=>hots.push({key:'offices', text:o.name, c:'#F68535', obj:o.anchor, minor:true}));
    hots.forEach(d=>{
      const b = document.createElement('button'); b.type='button'; b.className='us24-hot'+(d.minor?' minor':''); b.dataset.key=d.key; b.style.setProperty('--c', d.c);
      b.innerHTML = '<span class="dot"></span>'+esc(d.text);
      b.addEventListener('click', ()=>{ stopTour(); focus(d.key); });
      labelsEl.appendChild(b); d.el = b;
    });

    // ---------- views & tour ----------
    const VIEWS = {
      overview:{pos:[10,22,52], target:[0,6,-3]},
      core:{pos:[15,7.5,18], target:[0,6.8,-4]},
      practice:{pos:[-31,9,17], target:[-18.5,3.2,-4]},
      payers:{pos:[36,12,20], target:[18,10,-4]},
      offices:{pos:[7,21,9], target:[0,roofY+9.5,-4]}
    };
    const KEY_VIEW = {core:'core', front:'core', mid:'core', back:'core', consult:'core', datacenter:'core', practice:'practice', payers:'payers', offices:'offices', overview:'overview'};
    let tween = null;
    function flyTo(name, dur){
      const v = VIEWS[name]; if (!v) return;
      const toP = new THREE.Vector3(...v.pos);
      if (name==='overview' && hero.clientWidth < 820) toP.set(0, 36, 76);
      tween = {fromP:camera.position.clone(), toP, fromT:controls.target.clone(), toT:new THREE.Vector3(...v.target), t:0, dur:dur||2.4};
      if (reduce){ camera.position.copy(tween.toP); controls.target.copy(tween.toT); tween = null; }
    }
    function focus(key){ showCard(key); flyTo(KEY_VIEW[key]||'overview'); markTour(key); }

    const tourEl = root.querySelector('.us24-hero__tour');
    const playBtn = document.createElement('button'); playBtn.type='button'; playBtn.className='icon';
    tourEl.appendChild(playBtn);
    const tourBtns = STOPS.map((s,i)=>{
      const b = document.createElement('button'); b.type='button'; b.setAttribute('aria-pressed','false');
      b.innerHTML = esc(s.name)+'<span class="bar"></span>';
      b.addEventListener('click', ()=>{ stopTour(); tourIndex = i; focus(s.id); });
      tourEl.appendChild(b); return b;
    });
    function markTour(key){ tourBtns.forEach((b,i)=>b.setAttribute('aria-pressed', String(STOPS[i].id===key))); }

    let touring = CONFIG.autoTour && !reduce, tourIndex = -1, tourTime = 0;
    function setPlayIcon(){
      playBtn.setAttribute('aria-label', touring ? 'Pause tour' : 'Play tour');
      playBtn.innerHTML = touring
        ? '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14l12-7z" fill="currentColor"/></svg>';
    }
    function stopTour(){ touring = false; tourTime = 0; setPlayIcon(); tourBtns.forEach(b=>b.querySelector('.bar').style.transform='scaleX(0)'); }
    function nextStop(){ tourIndex = (tourIndex + 1) % STOPS.length; tourTime = 0; focus(STOPS[tourIndex].id); }
    playBtn.addEventListener('click', ()=>{ if (touring) stopTour(); else { touring = true; setPlayIcon(); nextStop(); } });
    setPlayIcon();
    controls.addEventListener('start', ()=>{ tween = null; if (touring) stopTour(); });

    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    let downAt = null;
    canvas.addEventListener('pointerdown', e=>{ downAt=[e.clientX,e.clientY]; });
    canvas.addEventListener('pointerup', e=>{
      if (!downAt || Math.hypot(e.clientX-downAt[0], e.clientY-downAt[1]) > 6) return;
      const r = canvas.getBoundingClientRect();
      mouse.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1);
      ray.setFromCamera(mouse, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      if (hit && hit.object.userData.key){ stopTour(); focus(hit.object.userData.key); }
    });

    function resize(){
      const w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w/Math.max(1,h);
      camera.fov = w < 820 ? 46 : 36;
        if (w >= 821 && !hero.classList.contains('nocopy')) camera.setViewOffset(w, h, -Math.round(w * 0.15), 0, w, h); else camera.clearViewOffset();
        camera.updateProjectionMatrix();
      if (composer){
        composer.setSize(w, h); bloom.resolution.set(w, h);
        if (hTilt){ hTilt.uniforms.h.value = 1.1 / w; vTilt.uniforms.v.value = 1.1 / h; }
      }
    }
    window.addEventListener('resize', resize); if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero); resize();

    camera.position.set(-50, 75, 120); controls.target.set(0, 4, -3);
    showCard('overview'); markTour('overview');
    if (reduce){ const v = VIEWS.overview; camera.position.set(...v.pos); controls.target.set(...v.target); }
    else { flyTo('overview', 4.5); }
    if (touring){ tourIndex = STOPS.length - 1; tourTime = -2.5; }

    let visible = true;
    if ('IntersectionObserver' in window){ new IntersectionObserver(es=>{ visible = es[0].isIntersecting; }, {threshold:0.01}).observe(hero); }

    const tmp = new THREE.Vector3(), nrm = new THREE.Vector3(), toCam = new THREE.Vector3();
    const clock = new THREE.Clock();
    let first = true;
    function frame(){
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, clock.getDelta());
      if (!visible || document.hidden) return;
      const t = clock.elapsedTime;
      if (tween){
        tween.t = Math.min(1, tween.t + dt/tween.dur);
        const e = tween.t<.5 ? 4*tween.t*tween.t*tween.t : 1-Math.pow(-2*tween.t+2,3)/2;
        camera.position.lerpVectors(tween.fromP, tween.toP, e);
        controls.target.lerpVectors(tween.fromT, tween.toT, e);
        if (tween.t>=1) tween = null;
      }
      controls.autoRotate = !reduce && !tween;
      if (touring){
        tourTime += dt;
        const p = Math.max(0, Math.min(1, tourTime/CONFIG.tourSeconds));
        tourBtns.forEach((b,i)=>b.querySelector('.bar').style.transform = 'scaleX('+(i===tourIndex ? p : 0)+')');
        if (tourTime >= CONFIG.tourSeconds) nextStop();
      }
      if (!reduce){
        globe.rotation.y += 0.12*dt;
        beaconMat.emissiveIntensity = (Math.sin(t*3) > 0.6) ? 5 : 0.2;
        traffic.forEach(v=>{ v.c.position.x += v.dir*v.speed*dt; if (v.c.position.x > 90) v.c.position.x = -90; if (v.c.position.x < -90) v.c.position.x = 90; });
        flows.forEach(f=>{ f.t = (f.t + f.speed*dt) % 1; });
      }
      flows.forEach(f=>f.parts.forEach((s,k)=>{ f.c.getPointAt(((f.t - k*0.006) % 1 + 1) % 1, s.position); }));
      Object.keys(ledMats).forEach(k=>{ ledMats[k].emissiveIntensity = (k===currentKey) ? 2.6 + Math.sin(t*4)*0.8 : 1.2; });
      if (grain) grain.uniforms.time.value = t;
      controls.update();
      if (composer) composer.render(); else renderer.render(scene, camera);
      if (first){ first = false; root.classList.add('is-live'); loading.style.opacity = '0'; setTimeout(()=>loading.remove(), 900); }

      const w = hero.clientWidth, h = hero.clientHeight;
      hots.forEach(d=>{
        if (d.obj) d.obj.getWorldPosition(tmp); else tmp.copy(d.pos);
        let hidden = false;
        if (d.obj){ nrm.copy(tmp).sub(globe.position); toCam.copy(camera.position).sub(globe.position); if (nrm.dot(toCam) < 0) hidden = true; }
        tmp.project(camera);
        if (tmp.z > 1) hidden = true;
        const x = (tmp.x*0.5+0.5)*w, y = (-tmp.y*0.5+0.5)*h;
        d.el.style.transform = 'translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) '+(d.side==='left' ? 'translate(-100%,-50%)' : 'translate(-50%,-120%)');
        d.el.style.opacity = hidden ? '0' : '1';
        d.el.style.pointerEvents = hidden ? 'none' : 'auto';
      });
    }
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start, {once:true});
})();
