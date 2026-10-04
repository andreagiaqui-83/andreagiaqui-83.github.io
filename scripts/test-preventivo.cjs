const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');

const html=fs.readFileSync('preventivo/index.html','utf8');
const js=fs.readFileSync('assets/preventivo.js','utf8');
const doc=new JSDOM(html).window.document;

test('Preventivo online spiega la superficie lorda complessiva dei piani',()=>{
  const area=doc.getElementById('area');
  assert.ok(area,'campo area assente');
  assert.equal(area.getAttribute('aria-describedby'),'areaHelp');
  const help=doc.getElementById('areaHelp')?.textContent.replace(/\s+/g,' ').trim()||'';
  assert.match(help,/superfici lorde di tutti i piani interessati/i);
  for(const term of ['balconi','terrazzi','cortili','giardini','aree esterne']) assert.match(help,new RegExp(term,'i'));
  assert.match(help,/Non moltiplicare nuovamente il totale per il numero di piani/i);
});

test('Le formule CAD e BIM usano una sola volta la superficie complessiva',()=>{
  assert.match(js,/function base2d\(\)\{const a=num\('#area'\);/);
  assert.match(js,/function base3d\(\)\{return Math\.max\(30,num\('#area'\)\*CFG\.a3d/);
  assert.match(js,/function baseRevit\(\)\{let b=Math\.max\(30,num\('#area'\)\*CFG\.revit/);
  assert.doesNotMatch(js,/num\('#area'\)[^;\n]{0,120}\*\s*(?:int|num)\('#floors'/);
  assert.doesNotMatch(js,/(?:int|num)\('#floors'[^;\n]{0,120}\*\s*num\('#area'/);
});

test('Il riepilogo e i dati inviati qualificano i metri quadrati come lordi complessivi',()=>{
  assert.match(js,/m² lordi complessivi dei piani/);
  assert.match(js,/balconi, terrazzi, cortili, giardini, aree esterne e pertinenze esterne esclusi/);
});


test('Preventivo online usa il backend quote con sessione firmata e upload protetto',()=>{
  assert.match(js,/https:\/\/cad-bim-preventivi\.andrea-giaqui\.workers\.dev/);
  assert.match(js,/sessionToken/);
  assert.match(js,/\/api\/upload\/['"]?\+?encodeURIComponent\(sessionId\)/);
  assert.match(js,/'X-Session-Token':sessionToken/);
  assert.match(js,/'X-File-Size':String\(file\.size\)/);
  assert.match(js,/JSON\.stringify\(\{sessionId,token:sessionToken,fields\}\)/);
});

test('La conversione commerciale scatta soltanto dopo una risposta positiva del backend',()=>{
  const success=js.indexOf("window.AGTracking?.track('service_quote_success'");
  const submit=js.indexOf("const d=await r.json().catch(()=>({}))");
  const failure=js.indexOf("if(!r.ok)throw new Error");
  assert.ok(success>submit && success>failure);
  assert.match(js,/form_submit_attempt/);
  assert.match(js,/form_error/);
});

test('La copia cliente e la stampa PDF hanno fallback espliciti',()=>{
  assert.ok(doc.getElementById('customerCopyNote'));
  assert.ok(doc.getElementById('quotePrintMeta'));
  assert.match(js,/customerCopySent/);
  assert.match(js,/quote-printing/);
  assert.match(js,/afterprint/);
  const css=fs.readFileSync('assets/preventivo.css','utf8');
  assert.match(css,/STIMA AUTOMATICA INDICATIVA/);
  assert.match(css,/NON È UN PREVENTIVO DEFINITIVO/);
  assert.match(css,/Andrea Giaquinto · Disegnatore CAD e BIM/);
});

test('La misurazione ammette service_quote_success nella pagina preventivo',()=>{
  const measurement=fs.readFileSync('assets/measurement.js','utf8');
  assert.match(measurement,/\['services','preventivo'\]\.includes\(document\.body\.dataset\.pageType\)/);
});
