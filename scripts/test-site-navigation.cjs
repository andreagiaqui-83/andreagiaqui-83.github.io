// Publishing contract for current and future public HTML pages.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),{JSDOM}=require('jsdom');
const entries=JSON.parse(fs.readFileSync('scripts/site-pages.json','utf8'));
const docs=new Map(entries.map(e=>[e.file,new JSDOM(fs.readFileSync(e.file,'utf8')).window.document]));
function scan(dir='.') {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);if(e.isDirectory())return ['node_modules','.git','.github','docs','partials'].includes(e.name)?[]:scan(p);return e.name.endsWith('.html')&&!/^google[a-f0-9]+\.html$/.test(e.name)?[p.replace(/^\.\//,'')]:[];});}
test('Every public HTML page is registered and every secondary page declares its parent',()=>{
 assert.deepEqual([...entries.map(e=>e.file)].sort(),scan().sort());assert.equal(new Set(entries.map(e=>e.file)).size,entries.length);
 for(const e of entries){const d=docs.get(e.file);assert.equal(d.querySelectorAll('h1').length,1,e.file);const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size,e.file+' duplicate IDs');
 if(e.kind==='landing'){assert.equal(d.querySelectorAll('.page-return').length,0);assert.equal(d.querySelectorAll('.breadcrumb [data-home-link], .breadcrumb .page-back-button').length,0);continue;}
 assert.ok(e.parent?.label?.startsWith('Torna ')||(e.parent?.href==='/'&&e.parent.label==='Home'),e.file);const u=new URL(e.parent.href,'https://andreagiaquinto.it');assert.equal(u.origin,'https://andreagiaquinto.it');assert.equal(u.username,'');
 let dest=u.pathname.slice(1);if(!dest||dest.endsWith('/'))dest+='index.html';assert.ok(fs.existsSync(dest),e.file+' destination');
 const links=[...d.querySelectorAll('.page-back-button')];assert.equal(links.length,2,e.file);for(const a of links){assert.equal(a.getAttribute('href'),e.parent.href);assert.ok(a.textContent.includes(e.parent.label));assert.equal(a.hasAttribute('onclick'),false);}
 assert.ok(d.querySelector('[data-page-return="top"]').compareDocumentPosition(d.querySelector('h1'))&4,e.file+' top link');
 }
});
test('Shared footer, clean captions and working cookie controls remain synchronized',()=>{
 const canonical=new JSDOM(fs.readFileSync('partials/site-footer.html','utf8')).window.document.querySelector('footer').outerHTML;
 for(const [file,d] of docs){assert.equal(d.querySelectorAll('footer').length,1,file);assert.equal(d.querySelector('footer').outerHTML,canonical,file);
 assert.equal(d.querySelector('footer a[href*="linkedin"]'),null);assert.equal(d.querySelectorAll('footer .sf-nav a').length,9);
 assert.ok(d.querySelector('script[src*="assets/measurement.js"]'),file+' cookie controls');
 for(const el of d.querySelectorAll('figcaption,.visual-note'))assert.doesNotMatch(el.textContent,/illustrativ|intelligenza artificiale|creat[aoe].*\bIA\b/i,file);
 }
 cp.execFileSync(process.execPath,['scripts/sync-site-header.cjs','--check']);cp.execFileSync(process.execPath,['scripts/sync-page-navigation.cjs','--check']);cp.execFileSync(process.execPath,['scripts/sync-site-footer.cjs','--check']);
});
test('Plugin installers remain byte-identical to the approved baseline',()=>{
 const expected={'downloads/yqarch/YQArch_Italiano_3.64.exe':'6ed121ec822ba503ed139a2a5594593d6c609c6293eea5486fd55f4ca44a7906','downloads/express-tools/Express_Tools_Italiano_3.2-rc1.exe':'25e0380fa0e580ac556e353dc2ca2c50e34f62edefd3544cfa7f8b13f692e144'};
 for(const [file,hash] of Object.entries(expected))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
});
test('Commercial offer preserves section anchors, four styles and optional request contracts',()=>{
 const d=docs.get('index.html');for(const id of ['render','interior-design','modulo','nuvole-di-punti','tariffe'])assert.ok(d.getElementById(id),id);
 assert.equal(d.querySelectorAll('#interior-design .interior-style-card').length,4);assert.equal(d.querySelectorAll('[name="Render_viste[]"]').length,10);assert.ok([...d.querySelectorAll('[name="Render_viste[]"]')].every(x=>!x.required));
 assert.equal(d.querySelector('#renderSelected').value,'Render fotorealistici / viste prospettiche');assert.ok(d.querySelector('link[href*="assets/services/services.css"]'));assert.ok(d.querySelector('link[href*="assets/site-header.css"]'));
 const text=d.querySelector('#render').textContent;for(const term of ['agenzie immobiliari','property manager','Planimetrie commerciali 2D','Planimetrie 3D arredate','Virtual staging','walkthrough'])assert.ok(text.includes(term),term);
 const graph=JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent)['@graph'];const faq=graph.find(x=>x['@type']==='FAQPage').mainEntity;const visible=[...d.querySelectorAll('#faq details')];assert.equal(faq.length,visible.length);
 visible.forEach((x,i)=>{assert.equal(faq[i].name,x.querySelector('summary').textContent);assert.equal(faq[i].acceptedAnswer.text,(x.querySelector('.faq-answer')||x.querySelector('p')).textContent.replace(/\s+/g,' ').trim());});
 assert.ok(d.querySelector('#tariffe').textContent.includes('10 €'));assert.equal(d.querySelector('#pointCloud').disabled,false);
});

test('Homepage usa un solo header globale e separa gli strumenti AutoCAD dal portfolio',()=>{
 const d=docs.get('index.html');
 assert.equal(d.querySelectorAll('.sg-header').length,1);
 assert.equal(d.querySelector('.topbar'),null,'legacy topbar homepage');
 assert.equal(d.querySelector('.site-header'),null,'legacy site-header homepage');
 const tools=d.querySelector('#portfolio .portfolio-tools-block');
 assert.ok(tools,'blocco strumenti AutoCAD assente');
 assert.equal(tools.querySelector('h3')?.textContent.trim(),'Strumenti per il tuo AutoCAD');
 assert.ok(tools.querySelectorAll('.project-links a').length>=3);
});
test('Menu mobile globale dispone di pannello scorrevole e blocco scroll',()=>{
 const css=fs.readFileSync('assets/site-header.css','utf8');
 const js=fs.readFileSync('assets/site-header.js','utf8');
 assert.match(css,/\.sg-header \.sg-nav\.sg-open\{/);
 assert.match(css,/max-height:calc\(100dvh - 96px\)/);
 assert.match(css,/html\.sg-menu-open/);
 assert.match(js,/root\.classList\.toggle\('sg-menu-open',open\)/);
});
