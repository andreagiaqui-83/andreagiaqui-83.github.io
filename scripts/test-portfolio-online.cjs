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
  assert.ok(fs.existsSync(new URL(el.getAttribute('src'),'https://andreagiaquinto.it').pathname.slice(1)),el.src);
  assert.ok(Number(el.getAttribute('width'))>=1500,el.src);
  assert.ok(el.closest('[data-zoom]'),el.src);
 }
 assert.equal(d.querySelectorAll('#sezioni-storiche').length,1);
 assert.equal(d.querySelectorAll('#sezioni-storiche img').length,6);
 assert.equal(d.querySelectorAll('#sezioni-storiche .ag-history-pair').length,2);
 assert.match(d.querySelector('#sezioni-storiche').textContent,/Visualizzazione illustrativa/);
 assert.equal([...d.querySelectorAll('main>.ag-section')].at(-1).id,'esercitazioni-studenti');
});

test('Portfolio reorganisation preserves the five approved covers and every existing case image',()=>{
 const d=new JSDOM(fs.readFileSync('portfolio/index.html','utf8')).window.document;
 const hash=require('node:crypto').createHash;
 assert.deepEqual([...d.querySelectorAll('.ag-hero,.ag-section > .ag-divider')].map(e=>hash('sha256').update(e.outerHTML.replace('Render e planimetrie commerciali</h2>','Planimetrie commerciali</h2>').replaceAll('?v=20261101-quote-senza-estensioni','')).digest('hex')),["d27f4e056e84e9cce2307f1d8193539f511698f4694b66609459caf5be6db32e","e206802d72de8e13b673e70d64d3d3e5fd4a32c86c2d22add5f325311018e51c","f8961a70994fb8728737d049182ac97bb3aef74272aa006cf0eac8ad10bd1a9a","bda3b71dc7bea6de0f8815a7c3cd7dc3219b6b30e30fa65fd00193af29fa557c","f4feb76360f2f8bebe0807fd67ce1f44d551c613a37734249419fdfba82336b3"]);
 const existing=["base-cad","casa-copertura","casa-piano-primo","casa-piano-terra","casa-prospetto-est","casa-prospetto-nord","casa-prospetto-ovest","casa-prospetto-sud","casa-sezione-a","casa-sezione-b","commerciale-ampio-2d","commerciale-ampio-3d","commerciale-compatto-2d","commerciale-compatto-3d","dwg-editor","dwg-scansione","energia-abaco-serramenti","energia-documento-planimetrico","energia-modello-stato-fatto","energia-modello-stato-progetto","energia-piano-terra-confronto","energia-piano-tipo-confronto","energia-piante-catastali","energia-prospetti-principali","energia-render-stato-fatto","energia-render-stato-progetto","energia-render-stato-progetto","modello-ifc-revit","nuvola-planimetria","nuvola-sezione","render-alternativo","render-esterno","render-sezioni","scansione-annotata","scansione-base","scansione-piante","scansione-prospetti","scansione-sezioni","schizzo-primo","schizzo-terra","stato-comparativo","stato-fatto","stato-progetto","storico-sezione-ab-cad","storico-sezione-ab-fonte","storico-sezione-ab-render","storico-sezione-cd-cad","storico-sezione-cd-fonte","storico-sezione-cd-render","studio-ara-proiezioni","studio-ara-sezione-orizzontale","studio-ara-sezione-verticale","studio-base-pianta","studio-base-profilo","studio-obelisco","studio-pianta","studio-sezione-aperture","studio-solidi-parallelepipedo","studio-solidi-piramide-esagonale","studio-solidi-piramide-obliqua"];
 const current=[...d.querySelectorAll('.ag-case [data-zoom],.ag-exercise [data-zoom]')].map(e=>e.dataset.zoom);
 for(const id of new Set(existing)) assert.equal(current.filter(x=>x===id).length,existing.filter(x=>x===id).length,id);
 for(const c of d.querySelectorAll('.ag-case,.ag-exercise')) assert.ok(c.querySelector('.ag-case-process,.ag-energy-process'),c.id);
});
test('A direct link opens its drawing group without opening unrelated galleries',()=>{
 const dom=new JSDOM(fs.readFileSync('portfolio/index.html','utf8'),{url:'https://andreagiaquinto.it/portfolio/#prospetti-laterali',runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.HTMLElement.prototype.scrollIntoView=function(){};
 dom.window.eval(fs.readFileSync('assets/portfolio/portfolio.js','utf8'));
 const d=dom.window.document;
 assert.equal(d.querySelector('#prospetti-laterali').open,true);
 assert.equal(d.querySelectorAll('details[open]').length,1);
 assert.equal(d.querySelector('#prospetti-laterali').querySelectorAll('img').length,2);
 dom.window.close();
});
