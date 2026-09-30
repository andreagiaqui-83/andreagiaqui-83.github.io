/* Browser regression for the guided form. All writes and analytics are intercepted. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const live=process.argv.includes('live'),base=live?'https://andreagiaquinto.it':'http://127.0.0.1:8879';
const out=path.join(process.env.RUNNER_TEMP||'/tmp','form-guidance-proof');fs.mkdirSync(out,{recursive:true});
const widths=[320,360,375,390,412,430,600,768,800,1024,1366,1440,1920];
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.avif':'image/avif','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'};
let server;const report=[],stage=live?'live':'candidate';
async function start(){if(live)return;server=http.createServer((req,res)=>{try{let name=decodeURIComponent(new URL(req.url,base).pathname);if(name.endsWith('/'))name+='index.html';const root=process.cwd(),file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw new Error('Invalid path');const body=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:body);}catch{if(!res.headersSent)res.writeHead(404);res.end();}});await new Promise(resolve=>server.listen(8879,'127.0.0.1',resolve));}
async function context(browser,width,js=true){
 const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',javaScriptEnabled:js,serviceWorkers:'block'}),writes=[],google=[],errors=[];
 let failNext=false;
 await ctx.route('**/*',async route=>{const req=route.request(),u=req.url();
  if(/google-analytics\.com|googletagmanager\.com|googleadservices\.com/.test(u)){google.push(u);return route.fulfill({status:200,body:''});}
  if(u.includes('cad-bim-preventivi.andrea-giaqui.workers.dev')){
   if(req.method()!=='GET')writes.push({url:u,body:req.postData()});
   if(u.endsWith('/api/session'))return route.fulfill({json:{ok:true,sessionId:'11111111-1111-4111-8111-111111111111',token:'fixture'}});
   if(u.endsWith('/api/submit')&&failNext){failNext=false;return route.fulfill({status:503,json:{ok:false,error:'Errore simulato di collaudo'}});}
   return route.fulfill({json:{ok:true,reviews:[],comments:[]}});
  }
  assert.ok(['GET','HEAD','OPTIONS'].includes(req.method()),'Unexpected external write '+u);return route.continue();
 });
 ctx.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
 return {ctx,writes,google,errors,failOnce:()=>{failNext=true;}};
}
async function open(page,url){const response=await page.goto(base+url,{waitUntil:'networkidle'});assert.equal(response.status(),200);const reject=page.getByRole('button',{name:'Rifiuta facoltativi'});if(await reject.isVisible())await reject.click();}
async function shown(page,id,yes){assert.equal(await page.locator('#'+id).isVisible(),yes,id+' visibility');}
async function checkBox(page,id,on){await page.locator('#'+id).setChecked(on);}
async function inBounds(page,selector,width){for(const field of await page.locator(selector).all()){if(!await field.isVisible())continue;await field.scrollIntoViewIfNeeded();const box=await field.boundingBox();assert.ok(box&&box.x>=-1&&box.x+box.width<=width+1,selector+' '+JSON.stringify(box));}}
async function axe(page,selectors){await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const violations=await page.evaluate(async include=>(await axe.run({include},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})),selectors);assert.deepEqual(violations,[]);}
(async()=>{await start();let browser;try{
 for(const [engine,type] of Object.entries({chromium,firefox,webkit})){
  browser=await type.launch();
  for(const width of widths){
   const env=await context(browser,width),page=await env.ctx.newPage();
   await open(page,'/');assert.equal(await page.locator('body').getAttribute('data-build'),'20260930-services-r8');
   await shown(page,'drawingPreferences',false);await shown(page,'mechanicalPreferences',false);await shown(page,'otherPreferences',false);
   assert.equal(await page.locator('[name="Google_Maps_Earth"]').count(),0);
   assert.equal(await page.locator('.technical-details input').count(),2);assert.equal(await page.locator('.technical-details textarea').count(),0);
   await page.locator('#recensioni a[href="#lascia-recensione"]').click();await page.waitForFunction(()=>location.hash==='#lascia-recensione'&&document.activeElement.id==='lascia-recensione');await shown(page,'reviewForm',true);assert.equal(env.writes.length,0);
   await checkBox(page,'cad2dSelected',true);await shown(page,'drawingPreferences',true);await shown(page,'cad2dGuidance',true);await shown(page,'cad3dGuidance',false);await shown(page,'bimGuidance',false);
   await page.locator('#drawingDetails').fill('PRIVATE piante, prospetti e sezioni');
   await checkBox(page,'cad3dSelected',true);await checkBox(page,'bimSelected',true);await shown(page,'cad3dGuidance',true);await shown(page,'bimGuidance',true);
   for(const id of ['cad2dSelected','cad3dSelected','bimSelected'])await checkBox(page,id,false);
   await shown(page,'drawingPreferences',false);assert.equal(await page.locator('#drawingDetails').inputValue(),'PRIVATE piante, prospetti e sezioni');
   assert.equal(await page.locator('#drawingDetails').isDisabled(),true);await checkBox(page,'bimSelected',true);await shown(page,'bimGuidance',true);
   await checkBox(page,'mechanicalSelected',true);await page.locator('#mechanicalDetails').fill('PRIVATE staffa meccanica 2D e 3D');
   await checkBox(page,'otherSelected',true);await page.locator('#otherDetails').fill('PRIVATE richiesta industriale');
   await checkBox(page,'renderSelected',true);await shown(page,'renderCustomPanel',false);await checkBox(page,'renderCustomSelected',true);await shown(page,'renderCustomPanel',true);
   await page.locator('#renderCustom').fill('PRIVATE render personalizzato');await checkBox(page,'renderCustomSelected',false);await shown(page,'renderCustomPanel',false);assert.equal(await page.locator('#renderCustom').inputValue(),'PRIVATE render personalizzato');
   await checkBox(page,'renderCustomSelected',true);await checkBox(page,'renderSelected',false);assert.equal(await page.locator('#renderCustom').isDisabled(),true);await checkBox(page,'renderSelected',true);assert.equal(await page.locator('#renderCustom').isDisabled(),false);
   await checkBox(page,'interiorSelected',true);await checkBox(page,'interiorCustomSelected',true);await page.locator('#interiorCustom').fill('PRIVATE quinta proposta');
   const included=await page.evaluate(()=>Object.fromEntries(new FormData(document.querySelector('#quoteForm'))));
   assert.equal(included.Render_personalizzato,'PRIVATE render personalizzato');assert.equal(included.Richiesta_personalizzata,'PRIVATE richiesta industriale');assert.equal(included.Indicazioni_disegno_meccanico,'PRIVATE staffa meccanica 2D e 3D');
   assert.equal(included.Indicazioni_output,'PRIVATE piante, prospetti e sezioni');
   assert.equal(await page.locator('#quoteForm textarea[required]').count(),0);
   await inBounds(page,'#quoteForm textarea,.technical-details input,#recensioni .reviews-actions a',width);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'home overflow '+width);
   await axe(page,['#quoteForm','#recensioni .reviews-actions']);
   if(engine==='chromium'&&[320,390,768,1440].includes(width)){
    for(const id of ['drawingPreferences','renderPreferences','mechanicalPreferences','otherPreferences'])await page.locator('#'+id).screenshot({animations:'disabled',path:path.join(out,`${stage}-${id}-${width}.png`)});
    await page.locator('.technical-details').screenshot({path:path.join(out,`${stage}-location-${width}.png`)});
    await page.locator('#recensioni').screenshot({path:path.join(out,`${stage}-reviews-${width}.png`)});
   }
   if(width===390){
    await page.locator('[name="Nome_cognome"]').fill('Collaudo riservato');await page.locator('#quoteForm [name="email"]').fill('test@example.invalid');await page.locator('[name="Consenso_privacy"]').check();env.failOnce();
    await page.locator('#quoteSubmit').click();await page.waitForFunction(()=>document.querySelector('#fileWarning').textContent.includes('Invio non completato'));
    assert.equal(await page.locator('#renderCustom').inputValue(),'PRIVATE render personalizzato');assert.equal(await page.locator('#mechanicalDetails').inputValue(),'PRIVATE staffa meccanica 2D e 3D');
    await checkBox(page,'otherSelected',false);await checkBox(page,'renderCustomSelected',false);await page.locator('#quoteSubmit').click();await page.waitForFunction(()=>!document.querySelector('#grazie').hidden);
    const sent=env.writes.filter(x=>x.url.endsWith('/api/submit'));assert.equal(sent.length,2);const fields=JSON.parse(sent[1].body).fields;assert.equal(fields.Render_personalizzato,undefined);assert.equal(fields.Richiesta_personalizzata,undefined);assert.equal(fields.Indicazioni_disegno_meccanico,'PRIVATE staffa meccanica 2D e 3D');assert.equal(env.writes.filter(x=>x.url.endsWith('/api/session')).length,1);
    for(const id of ['drawingDetails','renderCustom','mechanicalDetails','otherDetails','interiorCustom'])assert.equal(await page.locator('#'+id).inputValue(),'');
   }
   report.push({engine,width,page:'home',status:'PASS',form:'visibility, preserved values, optional fields, bounds, accessibility',mockedSubmit:width===390});
   await open(page,'/lezioni-autocad/');assert.equal(await page.locator('body').getAttribute('data-build'),'20260930-autocad-v17.10');
   const home=page.locator('.breadcrumb a[href="/"]');assert.equal(await home.isVisible(),true);const box=await home.boundingBox();assert.ok(box.height>=44&&box.x>=0&&box.x+box.width<=width+1);assert.ok(box.y<(await page.locator('h1').boundingBox()).y);
   await home.focus();assert.equal(await home.evaluate(e=>e===document.activeElement),true);await axe(page,['.breadcrumb']);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'lessons overflow');
   if(engine==='chromium'&&[320,390,768,1440].includes(width)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({animations:'disabled',path:path.join(out,`${stage}-lessons-home-${width}.png`)});}
   await home.click();await page.waitForURL(u=>u.pathname==='/');assert.equal(new URL(page.url()).origin,new URL(base).origin);assert.deepEqual(env.errors,[]);assert.deepEqual(env.google,[]);
   report.push({engine,width,page:'lessons',status:'PASS',homeLink:'clicked, keyboard-focusable, accessible'});await env.ctx.close();console.log('GUIDED FORM',engine,width,'PASS');
  }
  const env=await context(browser,390,false),page=await env.ctx.newPage();
  await page.goto(base+'/');await page.locator('#recensioni a[href="#lascia-recensione"]').click();assert.equal(new URL(page.url()).hash,'#lascia-recensione');
  await page.goto(base+'/lezioni-autocad/');await page.locator('.breadcrumb a[href="/"]').click();await page.waitForURL(u=>u.pathname==='/');assert.equal(env.writes.length,0);assert.deepEqual(env.google,[]);
  report.push({engine,javascript:false,status:'PASS',links:['review form','lesson Home']});await env.ctx.close();await browser.close();browser=null;
 }
 fs.writeFileSync(path.join(out,stage+'-form-guidance.json'),JSON.stringify(report,null,2));console.log('FORM GUIDANCE VERIFIED',report.length);
}catch(error){fs.writeFileSync(path.join(out,'failure.txt'),String(error.stack||error));console.error(error);process.exitCode=1;}finally{await browser?.close();server?.close();}})();
