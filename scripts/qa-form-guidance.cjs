/* Guided request QA after the dedicated /preventivo/ launch. No real external writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const live=process.argv.includes('live'),base=live?'https://andreagiaquinto.it':'http://127.0.0.1:8892',stage=live?'live':'candidate';
const out=path.join(process.env.RUNNER_TEMP||'/tmp','form-guidance-proof');fs.mkdirSync(out,{recursive:true});
const widths=[320,390,768,1440],mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.avif':'image/avif','.webp':'image/webp'};
let server,browser;const report=[];
async function start(){if(live)return;server=http.createServer((req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,base).pathname);if(pathname.endsWith('/'))pathname+='index.html';const root=process.cwd(),file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep))throw Error('Path');const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(8892,'127.0.0.1',r));}
async function context(width,js=true){const ctx=await browser.newContext({viewport:{width,height:900},javaScriptEnabled:js,reducedMotion:'reduce',serviceWorkers:'block'}),writes=[],errors=[],google=[];await ctx.route('**/*',route=>{const req=route.request(),u=req.url();if(/google-analytics\.com|googletagmanager\.com|googleadservices\.com/.test(u)){google.push(u);return route.fulfill({body:''});}if(u.includes('cad-bim-preventivi.andrea-giaqui.workers.dev')){if(req.method()!=='GET')writes.push({url:u,method:req.method()});return route.fulfill({json:{ok:true,reviews:[],comments:[],nextCursor:null}});}assert.ok(['GET','HEAD','OPTIONS'].includes(req.method()),'Unexpected write '+u);return route.continue();});ctx.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));return{ctx,writes,errors,google};}
async function reject(page){const b=page.getByRole('button',{name:'Rifiuta facoltativi'});if(await b.isVisible())await b.click();}
async function axe(page,include){await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const v=await page.evaluate(async include=>(await axe.run({include},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})),include);assert.deepEqual(v,[]);}
(async()=>{await start();try{
 for(const [engine,type] of Object.entries({chromium,firefox,webkit})){
  browser=await type.launch();
  for(const width of widths){
   const env=await context(width),page=await env.ctx.newPage();
   let response=await page.goto(base+'/',{waitUntil:'networkidle'});assert.equal(response.status(),200);await reject(page);
   const reviewLink=page.locator('#recensioni a[href="#lascia-recensione"]');assert.equal(await reviewLink.count(),1);await reviewLink.click();assert.equal(new URL(page.url()).hash,'#lascia-recensione');assert.equal(await page.locator('#reviewForm').isVisible(),true);assert.equal(env.writes.length,0);
   response=await page.goto(base+'/preventivo/?servizio=scan-bim',{waitUntil:'networkidle'});assert.equal(response.status(),200);await reject(page);
   assert.equal(await page.locator('input[data-service="scanbim"]').isChecked(),true);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'quote step 1 overflow '+width);
   await page.locator('[data-step="1"] [data-next]').click();
   const area=page.locator('#area');assert.equal(await area.getAttribute('aria-describedby'),'areaHelp');assert.match(await page.locator('#areaHelp').innerText(),/superfici lorde di tutti i piani/i);
   await page.locator('[data-step="2"] [data-next]').click();assert.equal(await page.locator('[data-for-service~="revit"]').isVisible(),true);
   await page.locator('[data-step="3"] [data-next]').click();assert.equal(await page.locator('#pointCloudFields').isVisible(),true);
   for(const id of ['pointCloudLink','buildingAddress','geoCoords','mapLink'])assert.equal(await page.locator('#'+id).isVisible(),true,id);
   assert.match(await page.locator('#pointCloudFields').innerText(),/link cloud/i);
   await page.locator('[data-step="4"] [data-next]').click();await page.locator('[data-step="5"] [data-next]').click();assert.match(await page.locator('#estimateRange').innerText(),/€|Valutazione personalizzata/);
   await page.locator('[data-step="6"] [data-next]').click();
   const autofill={contactName:'given-name',contactSurname:'family-name',contactEmail:'email',contactPhone:'tel',contactCompany:'organization'};
   for(const [id,value] of Object.entries(autofill))assert.equal(await page.locator('#'+id).getAttribute('autocomplete'),value);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'quote final overflow '+width);
   if(engine==='chromium'&&[390,1440].includes(width)){await page.screenshot({animations:'disabled',path:path.join(out,stage+'-preventivo-'+width+'.png'),fullPage:true});}
   if(engine==='chromium'&&width===390)await axe(page,['.quote-app']);
   response=await page.goto(base+'/lezioni-autocad/',{waitUntil:'networkidle'});assert.equal(response.status(),200);await reject(page);assert.equal(await page.locator('.breadcrumb').count(),0);assert.equal(await page.locator('.sg-brand').getAttribute('href'),'/');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'lessons overflow');
   assert.deepEqual(env.errors,[]);assert.deepEqual(env.google,[]);assert.equal(env.writes.length,0);report.push({engine,width,status:'PASS'});await env.ctx.close();
  }
  const env=await context(390,false),page=await env.ctx.newPage();await page.goto(base+'/lezioni-autocad/');assert.equal(await page.locator('.sg-brand').getAttribute('href'),'/');await page.goto(base+'/preventivo/');assert.equal(await page.locator('.sg-brand').getAttribute('href'),'/');assert.equal(env.writes.length,0);await env.ctx.close();await browser.close();browser=null;
 }
 fs.writeFileSync(path.join(out,stage+'-form-guidance.json'),JSON.stringify(report,null,2));console.log('GUIDED PREVENTIVO VERIFIED',report.length);
}catch(error){fs.writeFileSync(path.join(out,'failure.txt'),String(error.stack||error));console.error(error);process.exitCode=1;}finally{await browser?.close();server?.close();}})();
