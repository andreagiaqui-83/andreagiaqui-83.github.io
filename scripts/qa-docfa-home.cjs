/* DOCFA, Preventivo online and global navigation. Public checks never send a real request. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const live=process.argv.includes('live'),base=live?'https://andreagiaquinto.it':'http://127.0.0.1:8891',stage=live?'live':'candidate';
const out=path.join(process.env.RUNNER_TEMP||'/tmp','docfa-home-proof');fs.mkdirSync(out,{recursive:true});
const widths=[320,360,390,430,768,1024,1440],landingPages=['index.html','preventivo/index.html','lezioni-autocad/index.html','yqarch-italiano/index.html','ag-cad-tools/index.html','blockhub-cad/index.html','portfolio/index.html','recensioni/index.html','contatti/index.html'];
const routeFor=f=>f==='index.html'?'/':'/'+f.replace(/index\.html$/,'');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.avif':'image/avif','.webp':'image/webp'};
let server,browser;const report=[];
async function start(){if(live)return;server=http.createServer((req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,base).pathname);if(pathname.endsWith('/'))pathname+='index.html';const root=process.cwd(),file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep))throw new Error('Invalid path');const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404);res.end();}});await new Promise(resolve=>server.listen(8891,'127.0.0.1',resolve));}
async function envFor(width,js=true){
 const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',javaScriptEnabled:js,serviceWorkers:'block'}),writes=[],errors=[],google=[];
 await ctx.route('**/*',async route=>{const r=route.request(),u=r.url();if(/google-analytics\.com|googletagmanager\.com|googleadservices\.com/.test(u)){google.push(u);return route.fulfill({body:''});}
 if(u.includes('cad-bim-preventivi.andrea-giaqui.workers.dev')){if(r.method()!=='GET')writes.push({url:u,method:r.method()});if(u.endsWith('/api/session'))return route.fulfill({json:{ok:true,sessionId:'11111111-1111-4111-8111-111111111111',token:'mock'}});if(u.includes('/api/upload/'))return route.fulfill({json:{ok:true}});if(u.endsWith('/api/submit'))return route.fulfill({json:{ok:true,requestId:'11111111-1111-4111-8111-111111111111',customerCopySent:true}});return route.fulfill({json:{ok:true,reviews:[],comments:[],nextCursor:null}});}
 assert.ok(['GET','HEAD','OPTIONS'].includes(r.method()),'Unexpected external write '+u);return route.continue();});
 ctx.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 return{ctx,writes,errors,google};
}
async function open(page,file){const res=await page.goto(base+routeFor(file),{waitUntil:'networkidle'});assert.ok(res.status()===200);const reject=page.getByRole('button',{name:'Rifiuta facoltativi'});if(await reject.isVisible())await reject.click();}
async function axe(page,selectors){await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const result=await page.evaluate(async include=>(await axe.run({include},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})),selectors);assert.deepEqual(result,[]);}
(async()=>{await start();try{
 for(const [engine,type] of Object.entries({chromium,firefox,webkit})){
  browser=await type.launch();
  for(const width of widths){
   const env=await envFor(width),page=await env.ctx.newPage();
   await page.goto(base+'/preventivo/?servizio=docfa',{waitUntil:'networkidle'});
   const reject=page.getByRole('button',{name:'Rifiuta facoltativi'});if(await reject.isVisible())await reject.click();
   const docfa=page.locator('input[data-service="docfa"]');assert.equal(await docfa.isChecked(),true);
   assert.equal(await page.locator('.sg-header').count(),1);assert.equal(await page.locator('.breadcrumb .page-back-button').count(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),engine+' '+width+' preventivo overflow');
   await page.locator('[data-step="1"] [data-next]').click();await page.locator('[data-step="2"] [data-next]').click();
   const card=page.locator('[data-for-service~="docfa"]');assert.equal(await card.isVisible(),true);assert.equal(await card.locator('#docfaCount').isVisible(),true);
   if(width<=430){const toggle=page.locator('.sg-toggle');assert.equal(await toggle.isVisible(),true);await toggle.click();assert.equal(await page.locator('.sg-nav').isVisible(),true);assert.equal(await page.locator('.sg-nav a').count(),9);assert.ok(await page.locator('.sg-nav').evaluate(e=>e.scrollHeight>=e.clientHeight));await toggle.click();}
   if(engine==='chromium'&&[390,1440].includes(width)){await page.screenshot({animations:'disabled',path:path.join(out,stage+'-preventivo-docfa-'+width+'.png')});}
   if(engine==='chromium'&&width===390)await axe(page,['.quote-app']);
   assert.deepEqual(env.errors,[]);assert.deepEqual(env.google,[]);assert.equal(env.writes.length,0);report.push({engine,width,page:'preventivo-docfa',status:'PASS'});await env.ctx.close();
  }
  for(const width of [390,1440]){
   const env=await envFor(width),page=await env.ctx.newPage();
   for(const file of landingPages){await open(page,file);assert.equal(await page.locator('.sg-header').count(),1,file);assert.equal(await page.locator('.breadcrumb .page-back-button,[data-page-return]').count(),0,file+' redundant Home/return');const brand=page.locator('.sg-brand');assert.equal(await brand.getAttribute('href'),'/');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file+' overflow');}
   assert.deepEqual(env.errors,[]);assert.deepEqual(env.google,[]);assert.equal(env.writes.length,0);await env.ctx.close();
  }
  const env=await envFor(390,false),page=await env.ctx.newPage();for(const file of landingPages){await open(page,file);const brand=page.locator('.sg-brand');assert.equal(await brand.getAttribute('href'),'/');}assert.equal(env.writes.length,0);await env.ctx.close();
  await browser.close();browser=null;
 }
 fs.writeFileSync(path.join(out,stage+'-docfa-home.json'),JSON.stringify(report,null,2));console.log('DOCFA, PREVENTIVO AND GLOBAL NAV VERIFIED',report.length);
}catch(error){fs.writeFileSync(path.join(out,'failure.txt'),String(error.stack||error));console.error(error);process.exitCode=1;}finally{await browser?.close();server?.close();}})();
