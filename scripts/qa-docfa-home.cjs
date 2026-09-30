/* DOCFA and uniform Home navigation. Public checks never send a real request. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const live=process.argv.includes('live'),base=live?'https://andreagiaquinto.it':'http://127.0.0.1:8891',stage=live?'live':'candidate';
const out=path.join(process.env.RUNNER_TEMP||'/tmp','docfa-home-proof');fs.mkdirSync(out,{recursive:true});
const widths=[320,360,390,430,768,1024,1440,1920],entries=JSON.parse(fs.readFileSync('scripts/site-pages.json','utf8'));
const homePages=['lezioni-autocad/index.html','yqarch-italiano/index.html','express-tools-italiano/index.html','privacy/index.html','404.html','report-google/index.html'];
const routeFor=f=>'/'+(f.endsWith('index.html')?f.slice(0,-10):f);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.avif':'image/avif','.webp':'image/webp'};
let server,browser;const report=[];
async function start(){if(live)return;server=http.createServer((req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,base).pathname);if(pathname.endsWith('/'))pathname+='index.html';const root=process.cwd(),file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep))throw new Error('Invalid path');const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404);res.end();}});await new Promise(resolve=>server.listen(8891,'127.0.0.1',resolve));}
async function context(width,js=true){
 const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',javaScriptEnabled:js,serviceWorkers:'block'}),writes=[],errors=[],google=[];
 let fail=false;
 await ctx.route('**/*',async route=>{const r=route.request(),u=r.url();if(/google-analytics\.com|googletagmanager\.com|googleadservices\.com/.test(u)){google.push(u);return route.fulfill({body:''});}
 if(u.includes('cad-bim-preventivi.andrea-giaqui.workers.dev')){if(r.method()!=='GET')writes.push({url:u,body:r.postData()});if(u.endsWith('/api/session'))return route.fulfill({json:{ok:true,sessionId:'11111111-1111-4111-8111-111111111111',token:'mock'}});if(u.endsWith('/api/submit')&&fail){fail=false;return route.fulfill({status:503,json:{ok:false,error:'Errore simulato'}});}return route.fulfill({json:{ok:true,reviews:[],comments:[],nextCursor:null}});}
 assert.ok(['GET','HEAD','OPTIONS'].includes(r.method()),'Unexpected external write '+u);return route.continue();});
 ctx.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 return{ctx,writes,errors,google,failOnce:()=>{fail=true;}};
}
async function open(page,file){const res=await page.goto(base+routeFor(file),{waitUntil:'networkidle'});assert.ok(res.status()===200||(live&&file==='404.html'&&res.status()===404));const reject=page.getByRole('button',{name:'Rifiuta facoltativi'});if(await reject.isVisible())await reject.click();}
async function axe(page,selectors){await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const result=await page.evaluate(async include=>(await axe.run({include},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})),selectors);assert.deepEqual(result,[]);}
async function style(a){return a.evaluate(e=>{const s=getComputedStyle(e);return Object.fromEntries(['backgroundColor','color','borderTopColor','borderTopStyle','borderTopWidth','borderRadius','padding','fontFamily','fontSize','fontWeight','lineHeight','gap','minHeight','boxShadow'].map(k=>[k,s[k]]));});}
(async()=>{await start();try{
 for(const [engine,type]of Object.entries({chromium,firefox,webkit})){
  browser=await type.launch();
  for(const width of widths){const env=await context(width),page=await env.ctx.newPage();await open(page,'index.html');assert.equal(await page.locator('body').getAttribute('data-build'),'20260930-services-r9');
   const panel=page.locator('#docfaPreferences'),field=page.locator('#docfaDetails'),choice=page.locator('#docfaSelected');assert.equal(await panel.isVisible(),false);assert.equal(await field.isDisabled(),true);
   await choice.focus();await page.keyboard.press('Space');assert.equal(await choice.getAttribute('aria-expanded'),'true');assert.equal(await panel.isVisible(),true);assert.equal(await choice.evaluate(e=>e===document.activeElement),true);assert.equal(await page.locator('#drawingPreferences').isVisible(),false);assert.equal(await page.locator('#templatePreferences').isVisible(),false);
   await field.fill('RISERVATO foglio 12, particella 345, subalterno 6; altezza 2,70 m.');await choice.uncheck();assert.equal(await panel.isVisible(),false);assert.equal(await field.isDisabled(),true);assert.equal(await page.evaluate(()=>new FormData(document.querySelector('#quoteForm')).has('Indicazioni_planimetria_DOCFA')),false);
   await choice.check();assert.ok((await field.inputValue()).includes('RISERVATO'));await page.locator('#bimSelected').check();assert.equal(await field.isDisabled(),false);assert.equal(await page.locator('#bimGuidance').isVisible(),true);await page.locator('#bimSelected').uncheck();
   assert.equal(await page.locator('#quoteForm textarea[required]').count(),0);assert.equal(await page.locator('.technical-details input').count(),2);assert.equal(await page.locator('[name="Google_Maps_Earth"]').count(),0);
   await field.scrollIntoViewIfNeeded();const box=await field.boundingBox();assert.ok(box.x>=-1&&box.x+box.width<=width+1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await axe(page,['#quoteForm']);
   if(engine==='chromium'&&[320,390,768,1440].includes(width))await panel.screenshot({animations:'disabled',path:path.join(out,stage+'-docfa-'+width+'.png')});
   if(width===390){await page.locator('[name="Nome_cognome"]').fill('Collaudo non inviato');await page.locator('#quoteForm [name="email"]').fill('test@example.invalid');await page.locator('[name="Consenso_privacy"]').check();env.failOnce();await page.locator('#quoteSubmit').click();await page.waitForFunction(()=>document.querySelector('#fileWarning').textContent.includes('Invio non completato'));assert.ok((await field.inputValue()).includes('RISERVATO'));await page.locator('#quoteSubmit').click();await page.waitForFunction(()=>!document.querySelector('#grazie').hidden);const posts=env.writes.filter(r=>r.url.endsWith('/api/submit'));assert.equal(posts.length,2);assert.ok(JSON.parse(posts[1].body).fields.Indicazioni_planimetria_DOCFA.includes('RISERVATO'));assert.equal(await field.inputValue(),'');assert.equal(await panel.isVisible(),false);}
   assert.deepEqual(env.errors,[]);assert.deepEqual(env.google,[]);report.push({engine,width,page:'DOCFA',status:'PASS',writes:'intercepted'});await env.ctx.close();console.log('DOCFA',engine,width,'PASS');
  }
  for(const width of [320,390,1440]){let normal=null,hover=null;
   const env=await context(width),page=await env.ctx.newPage();
   for(const file of homePages){await open(page,file);const a=page.locator('[data-home-link]').first();assert.equal(await a.isVisible(),true);await page.mouse.move(0,0);const actual=await style(a);if(!normal)normal=actual;else assert.deepEqual(actual,normal,engine+' '+width+' '+file+' normal appearance');await a.hover();const hovered=await style(a);if(!hover)hover=hovered;else assert.deepEqual(hovered,hover,file+' hover appearance');
    await page.keyboard.press('Tab');await a.focus();assert.equal(await a.evaluate(e=>e===document.activeElement),true);assert.equal(await a.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');const b=await a.boundingBox();assert.ok(b.height>=48&&b.x>=-1&&b.x+b.width<=width+1);assert.equal(await a.getAttribute('href'),'/');assert.equal(await a.locator('span').last().textContent(),'Home');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await axe(page,[await page.locator('.breadcrumb').count()?'.breadcrumb':'.page-return']);
    if(engine==='chromium'&&[390,1440].includes(width)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({animations:'disabled',path:path.join(out,stage+'-home-'+file.replace(/[^a-z0-9]/gi,'-')+'-'+width+'.png')});}
    await a.click();await page.waitForURL(u=>u.pathname==='/');assert.equal(new URL(page.url()).origin,new URL(base).origin);report.push({engine,width,page:file,status:'PASS',Home:'identical shared appearance and direct destination'});
   }
   assert.deepEqual(env.errors,[]);assert.deepEqual(env.google,[]);assert.equal(env.writes.length,0);await env.ctx.close();
  }
  const env=await context(390,false),page=await env.ctx.newPage();
  for(const file of homePages){await open(page,file);await page.locator('[data-home-link]').first().click();await page.waitForURL(u=>u.pathname==='/');}
  assert.equal(env.writes.length,0);report.push({engine,javascript:false,status:'PASS',HomePages:homePages.length});await env.ctx.close();await browser.close();browser=null;
 }
 fs.writeFileSync(path.join(out,stage+'-docfa-home.json'),JSON.stringify(report,null,2));console.log('DOCFA AND HOME VERIFIED',report.length);
}catch(error){fs.writeFileSync(path.join(out,'failure.txt'),String(error.stack||error));console.error(error);process.exitCode=1;}finally{await browser?.close();server?.close();}})();
