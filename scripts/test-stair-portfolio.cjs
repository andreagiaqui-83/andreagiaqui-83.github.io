const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=()=>fs.readFileSync('portfolio/index.html','utf8');

test('Stair entries remain didactic, distinct and online only, with reciprocal material-study links',()=>{
 const d=new JSDOM(html()).window.document;
 for(const id of ['scala-due-rampe','scala-ventaglio']){
  assert.equal(d.querySelectorAll('#'+id).length,1);
  assert.equal(d.getElementById(id).closest('section').id,'esercitazioni-studenti');
  assert.match(d.getElementById(id).textContent,/Esercitazione svolta con gli studenti/);
 }
 assert.equal(d.getElementById('commerciali-titolo').textContent,'Render e planimetrie commerciali');
 assert.equal(d.getElementById('scala-ventaglio-render').closest('section').id,'commerciali');
 assert.ok(d.querySelector('#scala-ventaglio a[href="#scala-ventaglio-render"]'));
 assert.ok(d.querySelector('#scala-ventaglio-render a[href="#scala-ventaglio"]'));
 assert.match(d.getElementById('scala-ventaglio-render').textContent,/1.402 × 1.122[\s\S]*7.680 × 6.146[\s\S]*non immagini generate nativamente in 8K/);
 assert.equal(d.querySelectorAll('a[href$=".pdf"],a[href$=".dxf"],a[href$=".glb"],a[href$=".zip"]').length,0);
 const pair=[...d.querySelectorAll('.ag-stair-view-pair img')];assert.equal(pair.length,2);
 assert.equal(pair[0].width,pair[1].width);assert.equal(pair[0].height,pair[1].height);
});

test('Large images load only on zoom and the lightbox can return to its trigger',()=>{
 const dom=new JSDOM(html(),{url:'https://andreagiaquinto.it/portfolio/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document,dialog=d.querySelector('dialog');
 dialog.showModal=()=>dialog.setAttribute('open','');dialog.close=()=>{dialog.removeAttribute('open');dialog.dispatchEvent(new w.Event('close'));};
 w.HTMLElement.prototype.scrollIntoView=function(){};
 assert.equal(d.querySelector('dialog img').getAttribute('src'),null);
 w.eval(fs.readFileSync('assets/portfolio/portfolio.js','utf8'));
 for(const selector of ['#scala-due-rampe [data-full-src]','#scala-ventaglio-render [data-full-src]']){
  const trigger=d.querySelector(selector);trigger.click();
  assert.ok(dialog.open);assert.equal(dialog.querySelector('img').getAttribute('src'),trigger.dataset.fullSrc);
  d.querySelector('#ag-native-size').click();assert.equal(d.querySelector('#ag-native-size').getAttribute('aria-pressed'),'true');
  d.querySelector('#ag-close-zoom').click();assert.equal(dialog.open,false);assert.equal(d.activeElement,trigger);
  assert.equal(dialog.querySelector('img').getAttribute('src'),null);
 }
 dom.window.close();
});

test('All corrected exercise exports use the audited assets and the cache version',()=>{
 const d=new JSDOM(html()).window.document;
 const audit=JSON.parse(fs.readFileSync('docs/exercise-dimensions-audit-20261101.json','utf8'));
 assert.equal(audit.dimensions_corrected,61);assert.equal(audit.extension_lines_removed,122);
 for(const row of audit.entries){
  const imgs=[...d.querySelectorAll('img[src]')].filter(i=>i.getAttribute('src').split('?')[0]===row.old_url);
  assert.ok(imgs.length);for(const img of imgs)assert.equal(img.getAttribute('src'),row.versioned_url);
  const actual=require('node:crypto').createHash('sha256').update(fs.readFileSync(row.old_url.slice(1))).digest('hex');
  assert.equal(actual,row.output_sha256);assert.equal(row.all_other_vector_operations_byte_identical,true);
 }
});
