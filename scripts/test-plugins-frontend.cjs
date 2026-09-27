const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const script=fs.readFileSync('assets/plugins/plugins.js','utf8');
for(const slug of ['yqarch-italiano','express-tools-italiano'])test(slug+': canonical, one H1, synced FAQ, internal paths and direct installer',()=>{
 const d=new JSDOM(fs.readFileSync(slug+'/index.html','utf8')).window.document;assert.equal(d.querySelectorAll('h1').length,1);assert.equal(d.querySelector('link[rel=canonical]').href,'https://andreagiaquinto.it/'+slug+'/');
 const graph=JSON.parse(d.querySelector('[type="application/ld+json"]').textContent)['@graph'];const faq=graph.find(x=>x['@type']==='FAQPage');assert.deepEqual([...d.querySelectorAll('#faq details')].map(x=>({q:x.querySelector('summary').textContent,a:x.querySelector('p').textContent})),faq.mainEntity.map(x=>({q:x.name,a:x.acceptedAnswer.text})));
 for(const a of d.querySelectorAll('[href],[src]')){let value=a.getAttribute('href')||a.getAttribute('src');if(value.startsWith('/')){const path=value.split(/[?#]/)[0];assert.ok(fs.existsSync('.'+path+(path.endsWith('/')?'index.html':'')),path);}else if(value.startsWith('#'))assert.ok(d.getElementById(value.slice(1)),value);}
 assert.ok(d.querySelector('a[download][href$=".exe"]'));assert.ok(d.querySelector('#comment-form input[name=privacy]').required);assert.ok(d.querySelector('[data-consent-open]'));
});
test('Installer manifest matches the exact source bytes; EXEs retain their PE signatures',()=>{for(const r of JSON.parse(fs.readFileSync('downloads/releases.json'))){const file=fs.readFileSync('.'+r.file);assert.equal(file.length,r.bytes);assert.equal(file.subarray(0,2).toString(),'MZ');assert.equal(crypto.createHash('sha256').update(file).digest('hex'),r.sha256);}});
test('Guest replies render text safely, retain failed submissions and never emit lead conversions',async()=>{
 const dom=new JSDOM(fs.readFileSync('yqarch-italiano/index.html','utf8'),{url:'https://andreagiaquinto.it/yqarch-italiano/',runScripts:'outside-only'}),w=dom.window,requests=[],events=[];
 w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.scrollIntoView=()=>{};w.AGTracking={track:(...args)=>events.push(args)};let post=0;
 w.fetch=async(url,opts)=>{requests.push({url,opts});if(opts?.method==='POST'){post++;return {ok:post>1,json:async()=>post>1?{ok:true,pending:true}:{ok:false,error:'Riprova'}};}return {ok:true,json:async()=>({ok:true,comments:[{id:'id1',name:'<img src=x>',text:'<script>window.BAD=1</script>',kind:'Bug',createdAt:'2026-09-27T10:00:00Z'}],nextCursor:null})};};
 w.eval(script);await new Promise(r=>setTimeout(r,10));assert.equal(w.document.querySelectorAll('#comments-list script,#comments-list img').length,0);assert.match(w.document.querySelector('#comments-list').textContent,/<script>/);
 w.document.querySelector('.comment button').click();const f=w.document.querySelector('#comment-form');f.elements.name.value='Test';f.elements.text.value='La risposta di prova';f.elements.privacy.checked=true;f.reportValidity=()=>true;
 f.dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,10));assert.equal(f.elements.text.value,'La risposta di prova');assert.equal(w.document.querySelector('#comment-status').textContent,'Riprova');
 f.dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,10));assert.equal(f.elements.text.value,'');assert.match(w.document.querySelector('#comment-status').textContent,/moderazione/);assert.equal(events.length,0);
 const bodies=requests.filter(r=>r.opts?.method==='POST').map(r=>JSON.parse(r.opts.body));assert.equal(bodies[0].parentId,'id1');assert.equal(bodies[0].requestId,bodies[1].requestId);dom.window.close();
});
