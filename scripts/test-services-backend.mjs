import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare-worker/src/index.js';
// Node stand-in for Cloudflare's native known-length stream; tests verify both bounds.
globalThis.FixedLengthStream = class extends TransformStream {
  constructor(length) {
    let size=0;
    super({transform(chunk,controller){size+=chunk.byteLength;if(size>length)throw new Error('overflow');controller.enqueue(chunk);},flush(){if(size!==length)throw new Error('incomplete');}});
  }
};
const origin='https://andreagiaquinto.it';
function fixture(){const entries=new Map();return{entries,env:{SIGNING_SECRET:'isolated-test-secret',ALLOWED_ORIGIN:origin,EMAIL_FROM:'test@example.invalid',EMAIL_TO:'recipient@example.invalid',QUOTE_FILES:{get:async k=>entries.has(k)?{json:async()=>JSON.parse(entries.get(k))}:null,put:async(k,v)=>{if(v?.getReader){let n=0;const reader=v.getReader();for(;;){const r=await reader.read();if(r.done)break;n+=r.value.byteLength;}entries.set(k,'bytes:'+n);}else entries.set(k,v);},list:async({prefix})=>({objects:[...entries.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false}),delete:async k=>entries.delete(k)}}};}
const req=(path,body)=>new Request('https://worker.example'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
const data=()=>({Nome_cognome:'Test tecnico',email:'test@example.invalid','Output[]':['Interior Design'],Consenso_privacy:'Acconsento',Contatto_preferito:'Email',Interior_Design_5a_proposta_personalizzata:'Legno chiaro <script>alert(1)</script>'});
async function session(f){return(await worker.fetch(req('/api/session'),f.env)).json();}
test('Services server rejects invalid contact, consent, output and unsafe cloud URLs',async()=>{const f=fixture(),ss=await session(f);for(const change of [{email:'bad'},{Consenso_privacy:''},{Nome_cognome:''},{'Output[]':[]},{'Output[]':['Unknown']},{Nuvola_di_punti_link_cloud:'javascript:alert(1)'},{Nuvola_di_punti_link_cloud:'https://'},{Nuvola_di_punti_link_cloud:['https://example.invalid']},{Nuvola_di_punti_link_cloud:'https://user:password@example.invalid'},{Nuvola_di_punti_link_cloud:'https://example.invalid/'+('x'.repeat(2000))},{Google_Maps_Earth:'javascript:alert(1)'},{Contatto_preferito:'Telefono'}]){const r=await worker.fetch(req('/api/submit',{...ss,fields:{...data(),...change}}),f.env);assert.equal(r.status,400,JSON.stringify(change));}});
test('Confirmed services submission preserves custom interior, escapes HTML and is idempotent',async()=>{const f=fixture(),ss=await session(f),calls=[];const old=global.fetch;global.fetch=async(u,o)=>{calls.push(JSON.parse(o.body));assert.equal(o.headers['Idempotency-Key'],'cad-quote/'+ss.sessionId);return Response.json({id:'test'});};try{for(let n=0;n<2;n++){const r=await worker.fetch(req('/api/submit',{...ss,fields:data()}),f.env);assert.equal(r.status,200);assert.equal((await r.json()).requestId,ss.sessionId);}assert.equal(calls.length,1);assert.ok(calls[0].html.includes('&lt;script&gt;'));assert.ok(calls[0].html.includes('Quinta proposta'));const changed=await worker.fetch(req('/api/submit',{...ss,fields:{...data(),Nome_cognome:'Changed'}}),f.env);assert.equal(changed.status,409);}finally{global.fetch=old;}});
test('Provider failure returns error and retry keeps the same delivery key',async()=>{const f=fixture(),ss=await session(f),keys=[];const old=global.fetch;global.fetch=async(u,o)=>{keys.push(o.headers['Idempotency-Key']);return keys.length===1?Response.json({message:'unavailable'},{status:503}):Response.json({id:'test'});};try{assert.equal((await worker.fetch(req('/api/submit',{...ss,fields:data()}),f.env)).status,503);assert.equal((await worker.fetch(req('/api/submit',{...ss,fields:data()}),f.env)).status,200);assert.equal(keys[0],keys[1]);}finally{global.fetch=old;}});
test('Services session rate limit stops thirteenth attempt',async()=>{const f=fixture();for(let n=0;n<12;n++)assert.equal((await worker.fetch(req('/api/session'),f.env)).status,200);assert.equal((await worker.fetch(req('/api/session'),f.env)).status,429);});
test('Uploads verify real bytes, direct point clouds to cloud links and reuse duplicate uploads',async()=>{const f=fixture(),ss=await session(f);const upload=(name,size,body)=>new Request('https://worker.example/api/upload/'+ss.sessionId,{method:'PUT',headers:{Origin:origin,'X-Session-Token':ss.token,'X-File-Name':name,'X-Field-Name':'Materiale_progetto[]','X-File-Size':String(size)},body});assert.equal((await worker.fetch(upload('a.las',3,'abc'),f.env)).status,400);assert.equal((await worker.fetch(upload('short.pdf',5,'abc'),f.env)).status,400);assert.equal((await worker.fetch(upload('long.pdf',2,'abc'),f.env)).status,400);assert.equal((await worker.fetch(upload('ok.pdf',3,'abc'),f.env)).status,200);assert.equal((await worker.fetch(upload('ok.pdf',3,'abc'),f.env)).status,200);const meta=JSON.parse(f.entries.get('sessions/'+ss.sessionId+'.json'));assert.equal(meta.files.length,1);assert.equal(meta.totalBytes,3);});
test('Services reviews exclude training while preserving existing review listing',async()=>{const f=fixture();for(const [id,service] of [['1','Lezioni AutoCAD'],['2','Render']])f.entries.set('reviews/'+id,JSON.stringify({displayName:'Test Rossi',text:'Servizio accurato',service,status:'approved'}));const result=await(await worker.fetch(new Request('https://worker.example/api/reviews?source=cad-services'),f.env)).json();assert.equal(result.reviews.length,1);assert.equal(result.reviews[0].service,'Render');});

test('Point-cloud links preserve any original format, reach both emails and storage, and remain idempotent',async()=>{
 const old=global.fetch,calls=[];global.fetch=async(u,o)=>{calls.push(JSON.parse(o.body));return Response.json({id:'test'});};
 try{for(const link of ['https://cloud.example.invalid/scan.e57','https://cloud.example.invalid/archive.customformat?download=1&key=private','https://cloud.example.invalid/folder/points']){
  const f=fixture();f.env.SEND_CUSTOMER_COPY='true';const ss=await session(f),fields={...data(),Nuvola_di_punti_link_cloud:link};const before=calls.length;
  for(let i=0;i<2;i++)assert.equal((await worker.fetch(req('/api/submit',{...ss,fields}),f.env)).status,200);
  assert.equal(calls.length-before,2);for(const mail of calls.slice(before)){assert.ok(mail.html.includes('Nuvola di punti'));assert.ok(mail.html.includes(link.replaceAll('&','&amp;')));}
  const saved=JSON.parse(f.entries.get('quotes/'+ss.sessionId+'/request.json'));assert.equal(saved.fields.Nuvola_di_punti_link_cloud,link);assert.equal(saved.pointCloudLink,link);
 }}finally{global.fetch=old;}
});

test('Render views and interior styles reach stored request and both confirmation emails',async()=>{
 const f=fixture();f.env.SEND_CUSTOMER_COPY='true';const ss=await session(f),calls=[],old=global.fetch;
 const fields={...data(),'Output[]':['Interior Design','Render fotorealistici / viste prospettiche'],'Interior_Design_stili[]':['Japandi','Personalizzata'],'Render_viste[]':['Prospetto singolo','Vista 3D']};
 global.fetch=async(u,o)=>{calls.push(JSON.parse(o.body));return Response.json({id:'test'});};
 try{const response=await worker.fetch(req('/api/submit',{...ss,fields}),f.env);assert.equal(response.status,200);assert.equal(calls.length,2);for(const email of calls){assert.ok(email.html.includes('Stili Interior Design da valutare'));assert.ok(email.html.includes('Japandi'));assert.ok(email.html.includes('Viste render richieste'));assert.ok(email.html.includes('Vista 3D'));}const saved=JSON.parse(f.entries.get('quotes/'+ss.sessionId+'/request.json'));assert.deepEqual(saved.fields['Interior_Design_stili[]'],fields['Interior_Design_stili[]']);assert.deepEqual(saved.fields['Render_viste[]'],fields['Render_viste[]']);}finally{global.fetch=old;}
});


test('Preventivo online accetta i nuovi servizi, conserva Maps e invia la copia indicativa quando richiesta',async()=>{
 const f=fixture();f.env.SEND_CUSTOMER_COPY='true';const ss=await session(f),calls=[],old=global.fetch;
 const fields={Nome_cognome:'Cliente prova',Email:'cliente@example.invalid','Output[]':['AutoCAD 2D','Computo metrico','Virtual staging'],Consenso_privacy:'Acconsento',Copia_stima_email:'Sì',Stima_automatica_indicativa:'100 € – 120 €',Superficie_indicativa:'240 m² lordi complessivi dei piani',Google_Maps_Earth:'https://maps.google.com/?q=45.0,9.0'};
 global.fetch=async(u,o)=>{calls.push(JSON.parse(o.body));return Response.json({id:'test'});};
 try{
  const response=await worker.fetch(req('/api/submit',{...ss,fields}),f.env);
  assert.equal(response.status,200);
  const payload=await response.json();assert.equal(payload.customerCopySent,true);
  assert.equal(calls.length,2);
  assert.match(calls[0].subject,/Preventivo online/);
  assert.match(calls[1].subject,/stima indicativa/i);
  assert.match(calls[1].html,/non costituisce un preventivo definitivo/i);
  assert.match(calls[1].html,/IVA/i);
  assert.match(calls[1].html,/100 € – 120 €/);
  const saved=JSON.parse(f.entries.get('quotes/'+ss.sessionId+'/request.json'));
  assert.deepEqual(saved.fields['Output[]'],fields['Output[]']);
  assert.equal(saved.fields.Google_Maps_Earth,fields.Google_Maps_Earth);
 }finally{global.fetch=old;}
});

test('Preventivo online rispetta la scelta di non inviare la copia cliente',async()=>{
 const f=fixture();f.env.SEND_CUSTOMER_COPY='true';const ss=await session(f),calls=[],old=global.fetch;
 const fields={Nome_cognome:'Cliente prova',Email:'cliente@example.invalid','Output[]':['Computo metrico estimativo'],Consenso_privacy:'Acconsento',Copia_stima_email:'No',Stima_automatica_indicativa:'Valutazione personalizzata'};
 global.fetch=async(u,o)=>{calls.push(JSON.parse(o.body));return Response.json({id:'test'});};
 try{
  const response=await worker.fetch(req('/api/submit',{...ss,fields}),f.env);
  assert.equal(response.status,200);
  const payload=await response.json();assert.equal(payload.customerCopySent,false);
  assert.equal(calls.length,1);
 }finally{global.fetch=old;}
});
