import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import worker from '../cloudflare-worker/src/index.js';
const origin='https://andreagiaquinto.it';
const html=fs.readFileSync('index.html','utf8');
const detailFields=['Render_personalizzato','Indicazioni_disegno_meccanico','Richiesta_personalizzata'];
const outputs=['Elaborati AutoCAD 2D','Modello AutoCAD 3D','Modello Revit / BIM 3D','Disegno meccanico AutoCAD','Render fotorealistici / viste prospettiche','Interior Design','Altro'];
function store(){
 const entries=new Map();
 const env={SIGNING_SECRET:'isolated-fixture-secret',ALLOWED_ORIGIN:origin,EMAIL_FROM:'test@example.invalid',EMAIL_TO:'owner@example.invalid',SEND_CUSTOMER_COPY:'true',QUOTE_FILES:{get:async k=>entries.has(k)?{json:async()=>JSON.parse(entries.get(k))}:null,put:async(k,v)=>entries.set(k,v),list:async({prefix})=>({objects:[...entries.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false}),delete:async k=>entries.delete(k)}};
 const request=(path,body)=>new Request('https://worker.example'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const call=async(path,body)=>worker.fetch(request(path,body),env);
 return {entries,env,call};
}
function fixture(){
 const dom=new JSDOM(html,{url:origin,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.ResizeObserver=class{observe(){}};w.IntersectionObserver=class{observe(){}};
 w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 const requests=[];w.fetch=async(u,o)=>{requests.push({u,o});return{ok:true,json:async()=>u.includes('/api/session')?{ok:true,sessionId:'11111111-1111-4111-8111-111111111111',token:'fixture'}:{ok:true,reviews:[]}};};
 for(const p of ['assets/measurement-config.js','assets/measurement.js','assets/services/services.js'])w.eval(fs.readFileSync(p,'utf8'));
 const d=w.document,form=d.querySelector('#quoteForm');
 const toggle=(id,on)=>{const input=d.getElementById(id);input.checked=on;input.dispatchEvent(new w.Event('change',{bubbles:true}));};
 return{w,d,form,requests,toggle,close:()=>w.close()};
}
function fill(f){f.form.elements.Nome_cognome.value='Test riservato';f.form.elements.email.value='private@example.invalid';f.form.elements.Consenso_privacy.checked=true;}
async function send(f){f.form.dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));for(let n=0;n<200&&f.form.getAttribute('aria-busy')==='true';n++)await new Promise(r=>setTimeout(r,5));assert.notEqual(f.form.getAttribute('aria-busy'),'true','Request did not settle');}
function data(){return {Nome_cognome:'Test riservato',email:'private@example.invalid','Output[]':outputs,Consenso_privacy:'Acconsento',Contatto_preferito:'Email','Render_viste[]':['Altro']};}

test('CAD/BIM specifications follow all seven selection combinations and retain disabled text',()=>{
 const f=fixture();try{
 const keys=['cad2dSelected','cad3dSelected','bimSelected'],hints=['cad2dGuidance','cad3dGuidance','bimGuidance'];
 assert.equal(f.d.querySelectorAll('[name="Indicazioni_output"]').length,1);
 assert.equal(f.d.querySelectorAll('[name="Google_Maps_Earth"]').length,0);
 assert.equal(f.d.querySelectorAll('.technical-details input').length,2);
 assert.equal(f.d.querySelectorAll('.technical-details textarea').length,0);
 const field=f.d.querySelector('#drawingDetails');field.value='PRIVATE CAD e BIM';
 for(let mask=0;mask<8;mask++){
  keys.forEach((id,i)=>f.toggle(id,!!(mask&(1<<i))));
  assert.equal(f.d.querySelector('#drawingPreferences').hidden,mask===0);assert.equal(field.disabled,mask===0);assert.equal(field.required,false);
  hints.forEach((id,i)=>assert.equal(f.d.getElementById(id).hidden,!(mask&(1<<i))));
  assert.equal(new f.w.FormData(f.form).get('Indicazioni_output'),mask?'PRIVATE CAD e BIM':null);
  assert.equal(f.d.querySelector('#templateCAD').disabled,!(mask&3));assert.equal(f.d.querySelector('#templateBIM').disabled,!(mask&4));
 }
 keys.forEach(id=>f.toggle(id,false));assert.equal(field.value,'PRIVATE CAD e BIM');
 for(const field of f.d.querySelectorAll('.technical-details input'))assert.equal(field.disabled,false);
 }finally{f.close();}
});

test('Render Other is independent from service Other; parent and child toggles preserve content without stealing focus',()=>{
 const f=fixture();try{
 const field=f.d.querySelector('#renderCustom'),other=f.d.querySelector('#otherDetails');
 f.toggle('renderSelected',true);assert.equal(field.disabled,true);assert.equal(other.disabled,true);
 f.d.querySelector('#renderCustomSelected').focus();f.toggle('renderCustomSelected',true);
 assert.equal(f.d.activeElement.id,'renderCustomSelected');assert.equal(field.disabled,false);assert.equal(field.required,false);
 field.value='PRIVATE render <b>cucina</b>';f.toggle('otherSelected',true);other.value='PRIVATE settore industriale';
 f.toggle('renderCustomSelected',false);assert.equal(field.value,'PRIVATE render <b>cucina</b>');assert.equal(new f.w.FormData(f.form).get(field.name),null);assert.equal(other.disabled,false);
 f.toggle('renderCustomSelected',true);f.toggle('renderSelected',false);assert.equal(field.disabled,true);assert.equal(f.d.querySelector('#renderCustomSelected').checked,true);
 f.toggle('renderSelected',true);assert.equal(field.disabled,false);assert.equal(new f.w.FormData(f.form).get(field.name),field.value);
 f.toggle('otherSelected',false);assert.equal(other.disabled,true);assert.equal(other.value,'PRIVATE settore industriale');assert.equal(field.disabled,false);
 }finally{f.close();}
});

test('Mechanical and other descriptions are optional, independent and restored on re-selection',()=>{
 const f=fixture();try{
 for(const [choice,id] of [['mechanicalSelected','mechanicalDetails'],['otherSelected','otherDetails']]){
  const field=f.d.getElementById(id);assert.equal(field.disabled,true);f.toggle(choice,true);field.value='PRIVATE '+id;
  assert.equal(field.required,false);assert.equal(field.disabled,false);f.toggle(choice,false);
  assert.equal(new f.w.FormData(f.form).get(field.name),null);f.toggle(choice,true);assert.equal(field.value,'PRIVATE '+id);
 }
 f.toggle('interiorSelected',true);f.toggle('interiorCustomSelected',true);f.d.querySelector('#interiorCustom').value='PRIVATE quinta proposta';
 f.toggle('mechanicalSelected',false);assert.equal(f.d.querySelector('#interiorCustom').disabled,false);assert.equal(f.d.querySelector('#otherDetails').disabled,false);
 }finally{f.close();}
});

test('Browser form reaches the real worker code, storage and both simulated emails, with no personal text in analytics',async()=>{
 const f=fixture(),s=store(),mails=[],old=global.fetch;global.fetch=async(u,o)=>{mails.push(JSON.parse(o.body));return Response.json({id:'fixture'});};
 try{
 f.w.fetch=async(u,o={})=>{f.requests.push({u,o});if(u.endsWith('/api/session'))return s.call('/api/session');if(u.endsWith('/api/submit'))return s.call('/api/submit',JSON.parse(o.body));return Response.json({ok:true,reviews:[]});};
 f.d.querySelector('[data-choice=all]').click();fill(f);
 for(const id of ['cad2dSelected','bimSelected','mechanicalSelected','renderSelected','renderCustomSelected','otherSelected','interiorSelected','interiorCustomSelected'])f.toggle(id,true);
 const texts={drawingDetails:'PRIVATE piante e abachi',renderCustom:'PRIVATE render <script>alert(1)</script>',mechanicalDetails:'PRIVATE staffa 2D/3D',otherDetails:'PRIVATE disegno industriale',interiorCustom:'PRIVATE quinta proposta'};
 for(const [id,text] of Object.entries(texts))f.d.getElementById(id).value=text;
 f.form.elements.Indirizzo_fabbricato.value='PRIVATE via di esempio';f.form.elements.Coordinate_geografiche.value='PRIVATE coordinate';
 await send(f);assert.equal(f.d.querySelector('#grazie').hidden,false);assert.equal(mails.length,2);
 const post=JSON.parse(f.requests.find(x=>x.u.endsWith('/api/submit')).o.body),saved=JSON.parse(s.entries.get('quotes/'+post.sessionId+'/request.json')).fields;
 for(const key of ['Indicazioni_output',...detailFields,'Interior_Design_5a_proposta_personalizzata','Indirizzo_fabbricato','Coordinate_geografiche']){assert.equal(saved[key],post.fields[key]);assert.ok(saved[key].includes('PRIVATE'));}
 for(const email of mails){for(const label of ['Render personalizzato','Indicazioni per il disegno meccanico','Richiesta personalizzata'])assert.ok(email.html.includes(label));assert.ok(email.html.includes('&lt;script&gt;'));assert.ok(!email.html.includes('<script>alert(1)</script>'));}
 assert.equal(saved.Google_Maps_Earth,undefined);const events=f.w.dataLayer.filter(x=>x[0]==='event');assert.ok(!JSON.stringify(events).includes('PRIVATE'));assert.ok(!JSON.stringify(events).includes('private@example'));assert.equal(events.filter(x=>x[1]==='service_quote_success').length,1);
 for(const id of Object.keys(texts))assert.equal(f.d.getElementById(id).value,'');
 for(const id of ['drawingDetails','renderCustom','mechanicalDetails','otherDetails'])assert.equal(f.d.getElementById(id).disabled,true);
 await send(f);assert.equal(mails.length,2);
 }finally{global.fetch=old;f.close();}
});

test('Failed submission retains every new detail; retry excludes only deactivated descriptions and reuses the session',async()=>{
 const f=fixture();let fail=true;const submissions=[];try{
 f.w.fetch=async(u,o)=>{f.requests.push({u,o});if(u.endsWith('/api/submit')){submissions.push(JSON.parse(o.body));return{ok:!fail,status:fail?503:200,json:async()=>({ok:!fail,error:'Simulated failure'})};}return{ok:true,json:async()=>u.endsWith('/api/session')?{ok:true,sessionId:'11111111-1111-4111-8111-111111111111',token:'fixture'}:{ok:true,reviews:[]}};};
 fill(f);for(const id of ['cad3dSelected','mechanicalSelected','otherSelected','renderSelected','renderCustomSelected'])f.toggle(id,true);
 for(const id of ['drawingDetails','mechanicalDetails','otherDetails','renderCustom'])f.d.getElementById(id).value='PRIVATE '+id;
 await send(f);assert.equal(f.d.querySelector('#grazie').hidden,true);
 for(const id of ['drawingDetails','mechanicalDetails','otherDetails','renderCustom']){assert.equal(f.d.getElementById(id).value,'PRIVATE '+id);assert.equal(f.d.getElementById(id).disabled,false);}
 f.toggle('renderCustomSelected',false);f.toggle('otherSelected',false);fail=false;await send(f);
 assert.equal(submissions.length,2);assert.equal(submissions[1].fields.Render_personalizzato,undefined);assert.equal(submissions[1].fields.Richiesta_personalizzata,undefined);assert.equal(submissions[1].fields.Indicazioni_output,'PRIVATE drawingDetails');assert.equal(submissions[1].fields.Indicazioni_disegno_meccanico,'PRIVATE mechanicalDetails');assert.equal(f.requests.filter(x=>x.u.endsWith('/api/session')).length,1);
 }finally{f.close();}
});

test('Backend rejects invalid or oversized custom fields before sending and strips inactive descriptions',async()=>{
 const s=store(),session=await(await s.call('/api/session')).json(),mails=[],old=global.fetch;global.fetch=async(u,o)=>{mails.push(JSON.parse(o.body));return Response.json({id:'fixture'});};
 try{
 for(const key of detailFields)for(const value of [['not a string'],'x'.repeat(3001)])assert.equal((await s.call('/api/submit',{...session,fields:{...data(),[key]:value}})).status,400);
 assert.equal((await s.call('/api/submit',{...session,fields:{...data(),Indicazioni_lavoro:'x'.repeat(48001)}})).status,400);assert.equal(mails.length,0);
 const fields={...data(),'Output[]':['Elaborati AutoCAD 2D'],Indicazioni_output:'Legacy-compatible output',Google_Maps_Earth:'https://example.invalid/legacy',...Object.fromEntries(detailFields.map(k=>[k,'INACTIVE_PRIVATE']))};
 assert.equal((await s.call('/api/submit',{...session,fields})).status,200);const saved=JSON.parse(s.entries.get('quotes/'+session.sessionId+'/request.json')).fields;
 for(const key of detailFields)assert.equal(saved[key],undefined);assert.equal(saved.Google_Maps_Earth,fields.Google_Maps_Earth);assert.equal(saved.Indicazioni_output,fields.Indicazioni_output);assert.ok(mails.every(x=>!x.html.includes('INACTIVE_PRIVATE')));
 }finally{global.fetch=old;}
});

test('Maximum-length multi-service descriptions are accepted and retries send no duplicate email',async()=>{
 const s=store(),session=await(await s.call('/api/session')).json(),old=global.fetch,mails=[];global.fetch=async(u,o)=>{mails.push(JSON.parse(o.body));return Response.json({id:'fixture'});};
 const fields={...data(),Indicazioni_output:'A'.repeat(3000),Indicazioni_lavoro:'B'.repeat(6000),Interior_Design_5a_proposta_personalizzata:'C'.repeat(6000),...Object.fromEntries(detailFields.map((k,i)=>[k,String(i).repeat(3000)])),Indirizzo_fabbricato:'D'.repeat(500),Coordinate_geografiche:'E'.repeat(200)};
 try{assert.ok(JSON.stringify(fields).length>24000);for(let n=0;n<2;n++)assert.equal((await s.call('/api/submit',{...session,fields})).status,200);assert.equal(mails.length,2);const saved=JSON.parse(s.entries.get('quotes/'+session.sessionId+'/request.json')).fields;for(const key of Object.keys(fields))assert.deepEqual(saved[key],fields[key]);}finally{global.fetch=old;}
});

test('Review invitation and lesson Home breadcrumb point to static, unique destinations',()=>{
 const f=fixture();try{
 const link=f.d.querySelector('#recensioni a[href="#lascia-recensione"]'),target=f.d.querySelector('#lascia-recensione');assert.ok(link);assert.equal(f.d.querySelectorAll('#lascia-recensione').length,1);assert.ok(target.querySelector('#reviewForm'));assert.equal(target.closest('details'),null);
 for(const id of ['drawingDetails','mechanicalDetails','renderCustom','otherDetails']){const field=f.d.getElementById(id);assert.ok(field.labels.length);assert.ok(field.getAttribute('aria-describedby').split(' ').every(ref=>f.d.getElementById(ref)));}
 const lesson=new JSDOM(fs.readFileSync('lezioni-autocad/index.html','utf8'));assert.equal(lesson.window.document.querySelector('.breadcrumb'),null);lesson.window.close();
 }finally{f.close();}
});
