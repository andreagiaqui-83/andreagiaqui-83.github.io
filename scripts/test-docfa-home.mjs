import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import cp from 'node:child_process';
import {JSDOM} from 'jsdom';
import worker from '../cloudflare-worker/src/index.js';
const key='Indicazioni_planimetria_DOCFA', origin='https://andreagiaquinto.it';
function ui(){
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:origin,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.ResizeObserver=class{observe(){}};w.IntersectionObserver=class{observe(){}};
 w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const calls=[];w.fetch=async(u,o)=>{calls.push({u,o});return Response.json(u.endsWith('/api/session')?{ok:true,sessionId:'11111111-1111-4111-8111-111111111111',token:'mock'}:{ok:true,reviews:[]});};
 for(const path of ['assets/measurement-config.js','assets/measurement.js','assets/services/services.js'])w.eval(fs.readFileSync(path,'utf8'));
 const d=w.document,form=d.querySelector('#quoteForm');
 const toggle=(id,on)=>{const el=d.getElementById(id);el.checked=on;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
 const fill=()=>{form.elements.Nome_cognome.value='Collaudo riservato';form.elements.email.value='test@example.invalid';form.elements.Consenso_privacy.checked=true;};
 return {w,d,form,calls,toggle,fill,close:()=>w.close()};
}
async function send(f){f.form.dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));for(let i=0;i<200&&f.form.getAttribute('aria-busy')==='true';i++)await new Promise(r=>setTimeout(r,5));assert.notEqual(f.form.getAttribute('aria-busy'),'true');}
function store(){
 const entries=new Map(),env={SIGNING_SECRET:'local-only-fixture-secret',ALLOWED_ORIGIN:origin,EMAIL_FROM:'test@example.invalid',EMAIL_TO:'owner@example.invalid',SEND_CUSTOMER_COPY:'true',QUOTE_FILES:{get:async k=>entries.has(k)?{json:async()=>JSON.parse(entries.get(k))}:null,put:async(k,v)=>entries.set(k,v),list:async({prefix})=>({objects:[...entries.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false}),delete:async k=>entries.delete(k)}};
 const call=async(path,body)=>worker.fetch(new Request('https://worker.example'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env);
 return{entries,call};
}
const data=()=>({Nome_cognome:'Collaudo riservato',email:'test@example.invalid',Consenso_privacy:'Acconsento','Output[]':['Planimetria DOCFA in AutoCAD'],Contatto_preferito:'Email'});

test('DOCFA is optional, independent, retains text and is disabled/excluded when inactive',()=>{
 const f=ui();try{
 const input=f.d.querySelector('#docfaSelected'),field=f.d.querySelector('#docfaDetails'),panel=f.d.querySelector('#docfaPreferences');
 assert.equal(f.d.querySelectorAll(`[name="${key}"]`).length,1);assert.equal(panel.hidden,true);assert.equal(field.disabled,true);assert.equal(field.required,false);assert.equal(field.maxLength,3000);assert.ok(field.labels.length);
 for(const id of field.getAttribute('aria-describedby').split(' '))assert.ok(f.d.getElementById(id));
 input.focus();f.toggle('docfaSelected',true);assert.equal(f.d.activeElement,input);assert.equal(panel.hidden,false);assert.equal(input.getAttribute('aria-expanded'),'true');assert.equal(field.disabled,false);assert.equal(f.d.querySelector('#drawingPreferences').hidden,true);assert.equal(f.d.querySelector('#templatePreferences').hidden,true);
 field.value='RISERVATO foglio 12 particella 345 sub 6';f.toggle('cad2dSelected',true);f.d.querySelector('#drawingDetails').value='Disegni 2D';f.toggle('docfaSelected',false);
 assert.equal(panel.hidden,true);assert.equal(field.disabled,true);assert.equal(new f.w.FormData(f.form).get(key),null);assert.equal(f.d.querySelector('#drawingDetails').disabled,false);
 f.toggle('docfaSelected',true);assert.equal(field.value,'RISERVATO foglio 12 particella 345 sub 6');assert.equal(new f.w.FormData(f.form).get(key),field.value);f.toggle('cad2dSelected',false);assert.equal(field.disabled,false);
 assert.equal(f.d.querySelectorAll('.technical-details input').length,2);assert.equal(f.d.querySelectorAll('[name="Google_Maps_Earth"]').length,0);
 }finally{f.close();}
});

test('DOCFA service CTA opens its panel without selecting other services',()=>{
 const f=ui();try{f.d.querySelector('#docfa a[data-service]').click();assert.equal(f.d.querySelector('#docfaSelected').checked,true);assert.equal(f.d.querySelector('#docfaPreferences').hidden,false);assert.equal(f.d.querySelector('#drawingPreferences').hidden,true);}finally{f.close();}
});

test('DOCFA text reaches storage and both simulated emails safely; reset follows success only',async()=>{
 const f=ui(),s=store(),mails=[],old=global.fetch;global.fetch=async(u,o)=>{mails.push(JSON.parse(o.body));return Response.json({id:'mock'});};
 try{
 f.w.fetch=async(u,o={})=>{f.calls.push({u,o});if(u.endsWith('/api/session'))return s.call('/api/session');if(u.endsWith('/api/submit'))return s.call('/api/submit',JSON.parse(o.body));return Response.json({ok:true,reviews:[]});};
 f.fill();f.toggle('docfaSelected',true);const text='RISERVATO foglio 12, particella 345, sub 6 <script>alert(1)</script>';f.d.querySelector('#docfaDetails').value=text;await send(f);
 const submitted=JSON.parse(f.calls.find(x=>x.u.endsWith('/api/submit')).o.body),saved=JSON.parse(s.entries.get('quotes/'+submitted.sessionId+'/request.json')).fields;
 assert.equal(saved[key],text);assert.equal(mails.length,2);for(const mail of mails){assert.ok(mail.html.includes('Indicazioni per la planimetria catastale DOCFA'));assert.ok(mail.html.includes('&lt;script&gt;'));assert.ok(!mail.html.includes('<script>alert(1)</script>'));}
 assert.ok(!JSON.stringify((f.w.dataLayer||[]).filter(e=>e[0]==='event')).includes('RISERVATO'));
 assert.equal(f.d.querySelector('#grazie').hidden,false);assert.equal(f.d.querySelector('#docfaDetails').value,'');assert.equal(f.d.querySelector('#docfaDetails').disabled,true);assert.equal(f.d.querySelector('#docfaPreferences').hidden,true);
 await send(f);assert.equal(mails.length,2);
 }finally{global.fetch=old;f.close();}
});

test('Failed DOCFA request preserves text and retry omits it if the user deselects DOCFA',async()=>{
 const f=ui(),posts=[];let fail=true;try{
 f.w.fetch=async(u,o)=>{f.calls.push({u,o});if(u.endsWith('/api/submit')){posts.push(JSON.parse(o.body));return Response.json({ok:!fail,error:'Errore simulato'},{status:fail?503:200});}return Response.json({ok:true,sessionId:'11111111-1111-4111-8111-111111111111',token:'mock',reviews:[]});};
 f.fill();f.toggle('docfaSelected',true);f.toggle('otherSelected',true);f.d.querySelector('#docfaDetails').value='RISERVATO catasto';f.d.querySelector('#otherDetails').value='Richiesta conservata';await send(f);assert.equal(f.d.querySelector('#grazie').hidden,true);assert.equal(f.d.querySelector('#docfaDetails').value,'RISERVATO catasto');assert.equal(f.d.querySelector('#docfaDetails').disabled,false);
 f.toggle('docfaSelected',false);fail=false;await send(f);assert.equal(posts[0].fields[key],'RISERVATO catasto');assert.equal(posts[1].fields[key],undefined);assert.equal(posts[1].fields.Richiesta_personalizzata,'Richiesta conservata');assert.equal(f.calls.filter(c=>c.u.endsWith('/api/session')).length,1);
 }finally{f.close();}
});

test('Backend enforces DOCFA type/size and never stores inactive cadastral details',async()=>{
 const s=store(),session=await(await s.call('/api/session')).json(),mails=[],old=global.fetch;global.fetch=async(u,o)=>{mails.push(JSON.parse(o.body));return Response.json({id:'mock'});};
 try{
 for(const value of [['array'],{},17,'x'.repeat(3001)])assert.equal((await s.call('/api/submit',{...session,fields:{...data(),[key]:value}})).status,400);
 assert.equal(mails.length,0);
 const fields={...data(),'Output[]':['Altro'],[key]:'INACTIVE_CADASTRAL_PRIVATE'};assert.equal((await s.call('/api/submit',{...session,fields})).status,200);
 const saved=JSON.parse(s.entries.get('quotes/'+session.sessionId+'/request.json')).fields;assert.equal(saved[key],undefined);assert.ok(mails.every(m=>!m.html.includes('INACTIVE_CADASTRAL_PRIVATE')));
 }finally{global.fetch=old;}
});

test('Maximum multiservice details including DOCFA and legacy DOCFA submissions remain accepted',async()=>{
 const s=store(),mails=[],old=global.fetch;global.fetch=async(u,o)=>{mails.push(JSON.parse(o.body));return Response.json({id:'mock'});};
 try{
 const fields={...data(),'Output[]':['Planimetria DOCFA in AutoCAD','Elaborati AutoCAD 2D','Modello Revit / BIM 3D','Disegno meccanico AutoCAD','Render fotorealistici / viste prospettiche','Interior Design','Altro'],'Render_viste[]':['Altro'],[key]:'D'.repeat(3000),Render_personalizzato:'R'.repeat(3000),Indicazioni_disegno_meccanico:'M'.repeat(3000),Richiesta_personalizzata:'P'.repeat(3000),Indicazioni_output:'O'.repeat(3000),Indicazioni_lavoro:'L'.repeat(6000),Interior_Design_5a_proposta_personalizzata:'I'.repeat(6000)};
 assert.ok(JSON.stringify(fields).length<48000);const session=await(await s.call('/api/session')).json();for(let i=0;i<2;i++)assert.equal((await s.call('/api/submit',{...session,fields})).status,200);assert.equal(mails.length,2);
 const saved=JSON.parse(s.entries.get('quotes/'+session.sessionId+'/request.json')).fields;assert.equal(saved[key],fields[key]);
 const oldSession=await(await s.call('/api/session')).json();assert.equal((await s.call('/api/submit',{...oldSession,fields:data()})).status,200);
 }finally{global.fetch=old;}
});

test('Every Home link uses the common static component and guide parents remain intact',()=>{
 const entries=JSON.parse(fs.readFileSync('scripts/site-pages.json','utf8'));let homes=0;
 for(const entry of entries){const dom=new JSDOM(fs.readFileSync(entry.file,'utf8')),d=dom.window.document;
  for(const a of d.querySelectorAll('[data-home-link]')){homes++;assert.ok(a.classList.contains('page-back-button'));assert.equal(new URL(a.getAttribute('href'),origin).pathname,'/');assert.equal(a.querySelector('span:last-child').textContent,'Home');assert.equal(a.querySelector('[aria-hidden]').textContent,'←');assert.equal(a.hasAttribute('onclick'),false);}
  if(entry.kind==='landing'&&entry.file!=='index.html')assert.equal(d.querySelectorAll('.breadcrumb [data-home-link]').length,1,entry.file);
  if(entry.parent)for(const a of d.querySelectorAll('.page-return a'))assert.equal(a.getAttribute('href'),entry.parent.href);
  dom.window.close();
 }
 assert.equal(homes,9);for(const p of ['assets/plugins/plugins.css','lezioni-autocad/assets/landing.css'])assert.ok(!fs.readFileSync(p,'utf8').includes('.breadcrumb'));
 cp.execFileSync(process.execPath,['scripts/sync-page-navigation.cjs','--check']);cp.execFileSync(process.execPath,['scripts/sync-site-footer.cjs','--check']);
});
