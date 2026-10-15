const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const doc=new JSDOM(fs.readFileSync('preventivo/index.html','utf8')).window.document;
test('Personal quote has one visible form, multiple deliverables and optional materials without calculator',()=>{
 assert.equal(doc.querySelectorAll('#estimateForm').length,1);assert.equal(doc.querySelectorAll('.quote-step,.quote-progress,#estimateRange,#area').length,0);
 assert.equal(doc.querySelectorAll('[name=service]').length,18);assert.ok(doc.querySelector('#directFiles').multiple);assert.equal(doc.querySelector('#directFiles').getAttribute('accept'),null);
 for(const id of ['contactNotes','cloudLink','directFiles','contactPhone'])assert.equal(doc.getElementById(id).required,false);
 for(const id of ['contactName','contactEmail','privacy'])assert.equal(doc.getElementById(id).required,true);
 assert.match(doc.querySelector('.quote-hero').textContent,/risponderò via email/);assert.ok(doc.querySelector('.quote-direct-actions a[href^="mailto:"]'));assert.ok(doc.querySelector('.quote-direct-actions a[href^="https://wa.me/"]'));
});
test('Only confirmed business quote events remain eligible for measurement',()=>{
 const measurement=fs.readFileSync('assets/measurement.js','utf8');assert.match(measurement,/\['services','preventivo'\]\.includes\(document\.body\.dataset\.pageType\)/);
});
test('Legacy plugin entry routes point to the single page and are excluded from indexing',()=>{for(const [route,anchor] of [['yqarch-italiano','yqarch'],['blockhub-cad','blockhub'],['express-tools-italiano','express-tools']]){const d=new JSDOM(fs.readFileSync(route+'/index.html','utf8')).window.document;assert.match(d.querySelector('meta[http-equiv=refresh]').content,new RegExp('/ag-cad-tools/#'+anchor));assert.equal(d.querySelector('meta[name=robots]').content,'noindex,follow');assert.equal(d.querySelector('link[rel=canonical]').href,'https://andreagiaquinto.it/ag-cad-tools/');}});
