import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import worker from '../cloudflare-worker/src/index.js';
const choices=['Prospetto singolo','Tutti i prospetti','Vista 3D','Interni, cucina o bagno','Planimetria commerciale 2D','Planimetria 3D arredata','Virtual staging','Prima/dopo ristrutturazione','Video / walkthrough breve','Altro'];
test('Visual deliverables remain optional, retain inactive choices and reach quotes without leaking to analytics',async()=>{
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://andreagiaquinto.it/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,calls=[];
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.ResizeObserver=class{observe(){}};w.IntersectionObserver=class{observe(){}};w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.fetch=async(u,o)=>{calls.push({u,o});return{ok:true,json:async()=>u.includes('/api/session')?{ok:true,sessionId:'11111111-1111-4111-8111-111111111111',token:'fixture'}:u.includes('/api/submit')?{ok:true}:{ok:true,reviews:[]}}};
 for(const p of ['assets/measurement-config.js','assets/measurement.js','assets/services/services.js'])w.eval(fs.readFileSync(p,'utf8'));
 const d=w.document,f=d.querySelector('#quoteForm');d.querySelector('[data-choice=all]').click();const inputs=[...f.querySelectorAll('[name="Render_viste[]"]')];
 assert.deepEqual(inputs.map(x=>x.value),choices);assert.ok(inputs.every(x=>x.disabled&&!x.required));
 d.querySelector('#renderSelected').click();inputs.forEach(x=>x.checked=true);assert.ok(inputs.every(x=>!x.disabled));d.querySelector('#renderSelected').click();assert.equal(new w.FormData(f).get('Render_viste[]'),null);d.querySelector('#renderSelected').click();assert.ok(inputs.every(x=>x.checked));
 f.elements.Nome_cognome.value='Test riservato';f.elements.email.value='private@example.invalid';f.elements.Consenso_privacy.checked=true;f.elements.Indicazioni_lavoro.value='PRIVATE annuncio immobile';
 f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,30));const posts=calls.filter(x=>x.u.includes('/api/submit'));assert.equal(posts.length,1);
 const fields=JSON.parse(posts[0].o.body).fields;assert.deepEqual(fields['Render_viste[]'],choices);assert.equal(fields['Output[]'],'Render fotorealistici / viste prospettiche');
 const events=w.dataLayer.filter(x=>x[0]==='event');assert.equal(events.filter(x=>x[1]==='service_quote_success').length,1);assert.ok(!JSON.stringify(events).includes('PRIVATE'));assert.ok(!JSON.stringify(events).includes('private@example'));w.close();
});
test('All ten visual deliverables survive backend validation, storage and both emails idempotently',async()=>{
 const entries=new Map(),calls=[],old=global.fetch,origin='https://andreagiaquinto.it';
 const env={SIGNING_SECRET:'isolated-test-secret',ALLOWED_ORIGIN:origin,EMAIL_FROM:'test@example.invalid',EMAIL_TO:'recipient@example.invalid',SEND_CUSTOMER_COPY:'true',QUOTE_FILES:{get:async k=>entries.has(k)?{json:async()=>JSON.parse(entries.get(k))}:null,put:async(k,v)=>entries.set(k,v),list:async({prefix})=>({objects:[...entries.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false}),delete:async k=>entries.delete(k)}};
 const req=(path,body)=>new Request('https://worker.example'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const session=await(await worker.fetch(req('/api/session'),env)).json();const fields={Nome_cognome:'Test tecnico',email:'test@example.invalid','Output[]':['Render fotorealistici / viste prospettiche'],Consenso_privacy:'Acconsento',Contatto_preferito:'Email','Render_viste[]':choices};
 global.fetch=async(u,o)=>{calls.push(JSON.parse(o.body));return Response.json({id:'test'});};
 try{for(let i=0;i<2;i++)assert.equal((await worker.fetch(req('/api/submit',{...session,fields}),env)).status,200);assert.equal(calls.length,2);for(const email of calls)for(const choice of choices)assert.ok(email.html.includes(choice),choice);assert.deepEqual(JSON.parse(entries.get('quotes/'+session.sessionId+'/request.json')).fields['Render_viste[]'],choices);}finally{global.fetch=old;}
});
