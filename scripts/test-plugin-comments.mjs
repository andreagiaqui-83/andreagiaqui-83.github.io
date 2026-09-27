import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare-worker/src/index.js';
const origin='https://andreagiaquinto.it',host='https://worker.example';
function fixture(){const entries=new Map();return {entries,env:{SIGNING_SECRET:'test-only',RESEND_API_KEY:'mocked',EMAIL_FROM:'test@example.invalid',EMAIL_TO:'moderator@example.invalid',ALLOWED_ORIGIN:origin,QUOTE_FILES:{get:async k=>entries.has(k)?{json:async()=>JSON.parse(entries.get(k))}:null,put:async(k,v)=>entries.set(k,v),delete:async k=>entries.delete(k),list:async({prefix,limit=1000,cursor='0'})=>{const keys=[...entries.keys()].filter(k=>k.startsWith(prefix)).sort(),offset=Number(cursor),slice=keys.slice(offset,offset+limit);return {objects:slice.map(key=>({key})),truncated:keys.length>offset+limit,cursor:String(offset+limit)};}}}};}
function request(body,project='yqarch',headers={}){return new Request(host+'/api/plugin-comments?project='+project,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});}
const payload=(change={})=>({requestId:crypto.randomUUID(),name:'Visitatore',kind:'Domanda',text:'Come si usa questo comando?',environment:'AutoCAD 2027 IT',privacy:true,website:'',...change});
const listing=async(f,project='yqarch',suffix='')=>(await worker.fetch(new Request(host+'/api/plugin-comments?project='+project+suffix),f.env)).json();
function link(mail,action){return mail.html.match(new RegExp('href="([^"]*action='+action+'[^\"]*)"'))[1].replaceAll('&amp;','&');}
const manage=(url,method='POST')=>new Request(url,{method,headers:method==='POST'?{Origin:host}:{}});
async function mocked(fn){const previous=global.fetch,mails=[];global.fetch=async(_u,o)=>{mails.push({...JSON.parse(o.body),key:o.headers['Idempotency-Key']});return Response.json({id:'mock-only'});};try{await fn(mails);}finally{global.fetch=previous;}}

test('Anonymous comments stay private until signed POST approval; GET and tampering cannot publish',()=>mocked(async mails=>{
 const f=fixture(),body=payload({name:'<b>Visitor</b>',text:'Un problema <script>alert(1)</script>'});
 assert.equal((await worker.fetch(request(body),f.env)).status,200);assert.equal((await listing(f)).comments.length,0);assert.equal(mails.length,1);assert.ok(mails[0].html.includes('&lt;script&gt;'));
 const approve=link(mails[0],'approve');assert.equal((await worker.fetch(manage(approve,'GET'),f.env)).status,200);assert.equal((await listing(f)).comments.length,0);
 assert.equal((await worker.fetch(manage(approve.replace('action=approve','action=delete')),f.env)).status,403);
 assert.equal((await worker.fetch(manage(approve),f.env)).status,200);const result=await listing(f);assert.equal(result.comments.length,1);assert.equal(result.comments[0].name,body.name);assert.equal(result.comments[0].text,body.text);assert.equal(result.comments[0].publicationConsent,undefined);assert.equal(result.comments[0].fingerprint,undefined);assert.equal((await listing(f,'express-tools')).comments.length,0);
 assert.equal((await worker.fetch(request(body),f.env)).status,200);assert.equal(mails.length,1);
}));
test('Replies require an approved parent in the same project; deletion removes quoted personal contents',()=>mocked(async mails=>{
 const f=fixture(),parent=payload();await worker.fetch(request(parent),f.env);const pmail=mails[0];await worker.fetch(manage(link(pmail,'approve')),f.env);
 assert.equal((await worker.fetch(request(payload({parentId:parent.requestId}),'express-tools'),f.env)).status,400);
 const reply=payload({parentId:parent.requestId,kind:'Risposta',text:'Prova ad aprire la guida inclusa.'});await worker.fetch(request(reply),f.env);await worker.fetch(manage(link(mails[1],'approve')),f.env);
 let comments=(await listing(f)).comments;assert.equal(comments[1].replyTo.name,parent.name);assert.equal(comments[1].parentId,parent.requestId);
 await worker.fetch(manage(link(pmail,'delete')),f.env);comments=(await listing(f)).comments;assert.ok(comments[0].deleted);assert.equal(comments[0].name,'Contributo rimosso');assert.equal(comments[1].replyTo.text,'Commento rimosso');
 assert.equal((await worker.fetch(request(payload({parentId:parent.requestId})),f.env)).status,400);
}));
test('Consent, input bounds, allowed project, origin, honeypot and unpublished-parent checks',async()=>{
 const f=fixture();for(const change of [{privacy:false},{name:'a'},{text:'short'},{text:'a'.repeat(2001)},{environment:'x'.repeat(121)},{website:'bot'},{kind:'unknown'},{requestId:'bad'},{text:'Visit https://spam.invalid now'},{parentId:crypto.randomUUID()}])assert.equal((await worker.fetch(request(payload(change)),f.env)).status,400,JSON.stringify(change));
 assert.equal((await worker.fetch(request(payload(),'__proto__'),f.env)).status,400);assert.equal((await worker.fetch(request(payload(),'yqarch',{Origin:'https://other.invalid'}),f.env)).status,403);
 assert.equal((await worker.fetch(request(payload({text:'x'.repeat(16000)})),f.env)).status,400);
 assert.equal((await worker.fetch(request(payload(),'yqarch',{'Content-Type':'text/plain'}),f.env)).status,400);
});
test('Rate limit stops the sixth new contribution; retries are idempotent and changed contents conflict',()=>mocked(async mails=>{
 const f=fixture(),first=payload();for(let i=0;i<5;i++)assert.equal((await worker.fetch(request(i?payload():first),f.env)).status,200);
 assert.equal((await worker.fetch(request(payload()),f.env)).status,429);assert.equal((await worker.fetch(request(first),f.env)).status,200);assert.equal(mails.length,5);
 assert.equal((await worker.fetch(request({...first,text:'Un messaggio cambiato.'}),f.env)).status,409);
}));
test('Failed moderation delivery preserves the submission and retry uses the same provider key',async()=>{
 const f=fixture(),body=payload(),old=global.fetch,keys=[];global.fetch=async(_u,o)=>{keys.push(o.headers['Idempotency-Key']);return Response.json(keys.length===1?{error:'no'}:{id:'mock'}, {status:keys.length===1?503:200});};
 try{assert.equal((await worker.fetch(request(body),f.env)).status,503);assert.equal((await worker.fetch(request(body),f.env)).status,200);assert.deepEqual(keys,[keys[0],keys[0]]);assert.equal([...f.entries.keys()].filter(k=>k.startsWith('plugin-comments-pending/')).length,1);}finally{global.fetch=old;}
});
test('Chronological pagination exposes only thirty records at a time without losing the next page',async()=>{
 const f=fixture();for(let i=0;i<35;i++){const record={id:crypto.randomUUID(),project:'yqarch',createdAt:new Date(Date.UTC(2026,8,27,10,i)).toISOString(),name:'Test',text:'Solo dati simulati',kind:'Domanda'};f.entries.set(`plugin-comments/yqarch/${record.createdAt}_${record.id}.json`,JSON.stringify(record));}
 const first=await listing(f),second=await listing(f,'yqarch','&cursor='+first.nextCursor);assert.equal(first.comments.length,30);assert.equal(second.comments.length,5);assert.equal(second.nextCursor,null);assert.ok(first.comments.at(-1).createdAt<second.comments[0].createdAt);
});
