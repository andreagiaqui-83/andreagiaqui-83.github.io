// Publishing contract for current and future public HTML pages.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),{JSDOM}=require('jsdom');
const entries=JSON.parse(fs.readFileSync('scripts/site-pages.json','utf8'));
const docs=new Map(entries.map(e=>[e.file,new JSDOM(fs.readFileSync(e.file,'utf8')).window.document]));
function scan(dir='.') {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);if(e.isDirectory())return ['node_modules','.git','.github','docs','partials'].includes(e.name)?[]:scan(p);return e.name.endsWith('.html')&&!/^google[a-f0-9]+\.html$/.test(e.name)?[p.replace(/^\.\//,'')]:[];});}
test('Every public HTML page is registered and every secondary page declares its parent',()=>{
 assert.deepEqual([...entries.map(e=>e.file)].sort(),scan().sort());assert.equal(new Set(entries.map(e=>e.file)).size,entries.length);
 for(const e of entries){const d=docs.get(e.file);assert.equal(d.querySelectorAll('h1').length,1,e.file);const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size,e.file+' duplicate IDs');
 if(e.kind==='landing'){assert.equal(d.querySelectorAll('.page-return').length,0);if(e.file!=='index.html')assert.equal(d.querySelectorAll('.breadcrumb [data-home-link]').length,1);continue;}
 assert.ok(e.parent?.label?.startsWith('Torna ')||(e.parent?.href==='/'&&e.parent.label==='Home'),e.file);const u=new URL(e.parent.href,'https://andreagiaquinto.it');assert.equal(u.origin,'https://andreagiaquinto.it');assert.equal(u.username,'');
 let dest=u.pathname.slice(1);if(!dest||dest.endsWith('/'))dest+='index.html';assert.ok(fs.existsSync(dest),e.file+' destination');
 const links=[...d.querySelectorAll('.page-back-button')];assert.equal(links.length,2,e.file);for(const a of links){assert.equal(a.getAttribute('href'),e.parent.href);assert.ok(a.textContent.includes(e.parent.label));assert.equal(a.hasAttribute('onclick'),false);}
 assert.ok(d.querySelector('[data-page-return="top"]').compareDocumentPosition(d.querySelector('h1'))&4,e.file+' top link');
 }
});
test('Shared footer, clean captions and working cookie controls remain synchronized',()=>{
 const canonical=new JSDOM(fs.readFileSync('partials/site-footer.html','utf8')).window.document.querySelector('footer').outerHTML;
 for(const [file,d] of docs){assert.equal(d.querySelectorAll('footer').length,1,file);assert.equal(d.querySelector('footer').outerHTML,canonical,file);
 assert.equal(d.querySelector('footer a[href*="linkedin"]'),null);assert.equal(d.querySelectorAll('footer .sf-nav a').length,4);
 assert.ok(d.querySelector('script[src*="assets/measurement.js"]'),file+' cookie controls');
 for(const el of d.querySelectorAll('figcaption,.visual-note'))assert.doesNotMatch(el.textContent,/illustrativ|intelligenza artificiale|creat[aoe].*\bIA\b/i,file);
 }
 cp.execFileSync(process.execPath,['scripts/sync-page-navigation.cjs','--check']);cp.execFileSync(process.execPath,['scripts/sync-site-footer.cjs','--check']);
});
test('Plugin installers remain byte-identical to the approved baseline',()=>{
 const expected={'downloads/yqarch/YQArch_Italiano_3.73.exe':'07165f6a941ebb4b97e4842d4cdf4a03a017bd433cda8a17eb8f7aa419c6280d','downloads/express-tools/Express_Tools_Italiano_3.2-rc1.exe':'25e0380fa0e580ac556e353dc2ca2c50e34f62edefd3544cfa7f8b13f692e144'};
 for(const [file,hash] of Object.entries(expected))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
});
test('Commercial offer preserves section anchors, four styles and optional request contracts',()=>{
 const d=docs.get('index.html');for(const id of ['render','interior-design','modulo','nuvole-di-punti','tariffe'])assert.ok(d.getElementById(id),id);
 assert.equal(d.querySelectorAll('#interior-design .interior-style-card').length,4);assert.equal(d.querySelectorAll('[name="Render_viste[]"]').length,10);assert.ok([...d.querySelectorAll('[name="Render_viste[]"]')].every(x=>!x.required));
 assert.equal(d.querySelector('#renderSelected').value,'Render fotorealistici / viste prospettiche');assert.equal(d.querySelectorAll('link[rel="stylesheet"]').length,3);
 const text=d.querySelector('#render').textContent;for(const term of ['agenzie immobiliari','property manager','Planimetrie commerciali 2D','Planimetrie 3D arredate','Virtual staging','walkthrough'])assert.ok(text.includes(term),term);
 const graph=JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent)['@graph'];const faq=graph.find(x=>x['@type']==='FAQPage').mainEntity;const visible=[...d.querySelectorAll('#faq details')];assert.equal(faq.length,visible.length);
 visible.forEach((x,i)=>{assert.equal(faq[i].name,x.querySelector('summary').textContent);assert.equal(faq[i].acceptedAnswer.text,(x.querySelector('.faq-answer')||x.querySelector('p')).textContent.replace(/\s+/g,' ').trim());});
 assert.ok(d.querySelector('#tariffe').textContent.includes('10 €'));assert.equal(d.querySelector('#pointCloud').disabled,false);
});
