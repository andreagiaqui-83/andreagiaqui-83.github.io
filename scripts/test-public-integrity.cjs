'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const entries=JSON.parse(fs.readFileSync('scripts/site-pages.json'));
const docs=new Map(entries.map(e=>[e.file,new JSDOM(fs.readFileSync(e.file,'utf8')).window.document]));
const origin='https://andreagiaquinto.it';
test('Every public page has unique IDs and valid internal resources, links and anchors',()=>{
 for(const [file,d] of docs){
  assert.equal(d.documentElement.lang,'it',file);assert.equal(d.querySelectorAll('h1').length,1,file);
  const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(ids.length,new Set(ids).size,file+' duplicate IDs');
  const base=new URL('/'+file,origin);
  const urls=[...d.querySelectorAll('[href],[src]')].flatMap(e=>[e.getAttribute('href'),e.getAttribute('src')].filter(Boolean));
  for(const e of d.querySelectorAll('[srcset]'))urls.push(...e.getAttribute('srcset').split(',').map(s=>s.trim().split(/\s+/)[0]));
  for(const value of urls){if(/^(data:|mailto:|tel:|javascript:)/.test(value))continue;const u=new URL(value,base);if(u.origin!==origin)continue;let name=decodeURIComponent(u.pathname).slice(1);if(!name||name.endsWith('/'))name+='index.html';assert.ok(fs.existsSync(name),file+' missing '+value);if(u.hash&&docs.has(name))assert.ok(docs.get(name).getElementById(decodeURIComponent(u.hash.slice(1))),file+' missing anchor '+value);}
  for(const script of d.querySelectorAll('[type="application/ld+json"]'))assert.doesNotThrow(()=>JSON.parse(script.textContent),file);
  for(const a of d.querySelectorAll('a[target="_blank"]'))assert.ok(a.relList.contains('noopener'),file+' unsafe new tab');
 }
});
test('Indexable pages have unique titles, descriptions, correct canonicals and existing social images',()=>{
 const titles=new Set(),descriptions=new Set();
 for(const [file,d] of docs){if((d.querySelector('meta[name=robots]')?.content||'').includes('noindex'))continue;
  assert.ok(d.title.trim(),file);assert.ok(!titles.has(d.title),file+' duplicate title');titles.add(d.title);
  const description=d.querySelector('meta[name=description]')?.content;assert.ok(description,file);assert.ok(!descriptions.has(description),file+' duplicate description');descriptions.add(description);
  const route=file==='index.html'?'/':'/'+file.replace(/\/index\.html$/,'/');assert.equal(d.querySelector('link[rel=canonical]')?.href,origin+route,file);
  for(const e of d.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]')){const u=new URL(e.content);assert.equal(u.protocol,'https:');if(u.origin===origin)assert.ok(fs.existsSync('.'+u.pathname),file+' social image');}
 }
});
test('Current software metadata, download links and manifest agree; guide retains all command IDs',()=>{
 const releases=JSON.parse(fs.readFileSync('downloads/releases.json'));
 for(const [file,d] of docs){for(const s of d.querySelectorAll('[type="application/ld+json"]')){const g=JSON.parse(s.textContent)['@graph']||[];for(const app of g.filter(x=>x['@type']==='SoftwareApplication')){const r=releases.find(r=>origin+r.file===app.downloadUrl);assert.ok(r,file);assert.equal(app.softwareVersion,r.version,file);assert.ok(d.querySelector('a[href="'+r.file+'"]'),file);}}}
 const guide=docs.get('downloads/yqarch/YQArch_Italiano_3.78_GUIDA.html');assert.equal(guide.querySelectorAll('article.card').length,646);assert.equal(new Set([...guide.querySelectorAll('article.card')].map(e=>e.id)).size,646);
 assert.ok(!releases.some(r=>r.version==='3.72'));
});

test('All FAQ schemas match visible questions and complete answers exactly',()=>{
 const normalize=s=>s.replace(/\s+/g,' ').trim();
 for(const [file,d] of docs){const schemas=[...d.querySelectorAll('[type="application/ld+json"]')].flatMap(s=>{const o=JSON.parse(s.textContent);return o['@graph']||[o]}).filter(o=>o['@type']==='FAQPage');if(!schemas.length)continue;
 const visible=[...d.querySelectorAll('#faq details')];assert.equal(schemas.length,1,file);const questions=schemas[0].mainEntity;assert.equal(questions.length,visible.length,file);
 visible.forEach((el,i)=>{assert.equal(normalize(questions[i].name),normalize(el.querySelector('summary').textContent),file);const answer=el.querySelector('.faq-answer')||el.querySelector('p');assert.equal(normalize(questions[i].acceptedAnswer.text),normalize(answer.textContent),file);});}
});
test('Private JobMailer policy remains reachable by legacy deep link and absent from public discovery',()=>{
 const file='cad-bim-job-mailer/privacy/index.html',d=docs.get(file);assert.ok(d);assert.equal(d.querySelector('meta[name=robots]').content,'noindex,nofollow');assert.doesNotMatch(fs.readFileSync('sitemap.xml','utf8'),/cad-bim-job-mailer/);assert.doesNotMatch(fs.readFileSync('partials/site-footer.html','utf8'),/cad-bim-job-mailer/);const policy=docs.get('privacy/index.html');assert.equal(policy.querySelector('h2#cad-bim-job-mailer'),null);assert.ok([...policy.scripts].some(s=>s.textContent.includes('location.hash==="#cad-bim-job-mailer"')&&s.textContent.includes('location.replace("/cad-bim-job-mailer/privacy/")')));
});
