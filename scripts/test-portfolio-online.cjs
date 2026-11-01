const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
test('Portfolio is online only and publishes presentation images, never source CAD or retired PDFs',()=>{
 const html=fs.readFileSync('portfolio/index.html','utf8');
 const d=new JSDOM(html).window.document;
 assert.equal(d.querySelectorAll('a[href$=".pdf"],a[href$=".dxf"],a[href$=".dwg"],a[href$=".ifc"],a[href$=".zip"]').length,0);
 assert.doesNotMatch(html,/downloads\/portfolio|application\/pdf|Scarica il portfolio/i);
 for(const obsolete of ['casa-prospetti.webp','casa-sezioni.webp'])assert.equal(fs.existsSync('assets/portfolio/'+obsolete),false);
 for(const file of ['Andrea_Giaquinto_Portfolio.pdf','Portfolio_Riqualificazione_Energetica.pdf'])assert.equal(fs.existsSync('downloads/portfolio/'+file),false);
 const drawings=[...d.querySelectorAll('#cad-2d img')];
 assert.equal(drawings.length,9);
 assert.equal(new Set(drawings.map(e=>e.src)).size,9);
 for(const el of [...drawings,...d.querySelectorAll('#sezioni-storiche img')]){
  assert.ok(fs.existsSync(el.getAttribute('src').slice(1)),el.src);
  assert.ok(Number(el.getAttribute('width'))>=1500,el.src);
  assert.ok(el.closest('[data-zoom]'),el.src);
 }
 assert.equal(d.querySelectorAll('#sezioni-storiche').length,1);
 assert.equal(d.querySelectorAll('#sezioni-storiche img').length,6);
 assert.equal(d.querySelectorAll('#sezioni-storiche .ag-history-pair').length,2);
 assert.match(d.querySelector('#sezioni-storiche').textContent,/Visualizzazione illustrativa/);
 assert.equal([...d.querySelectorAll('main>.ag-section')].at(-1).id,'esercitazioni-studenti');
});
