const {chromium,firefox,webkit}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http'),crypto=require('node:crypto');
const root=process.cwd(),out=path.join(process.env.RUNNER_TEMP||'/tmp','plugins-proof');fs.mkdirSync(out,{recursive:true});
const live=process.argv[2]==='live',base=live?'https://andreagiaquinto.it':'http://127.0.0.1:8767';
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.exe':'application/octet-stream','.txt':'text/plain'};
let server;
if(!live)server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,base).pathname);if(name.endsWith('/'))name+='index.html';const target=path.join(root,name);try{const bytes=fs.readFileSync(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end('Missing');}}).listen(8767,'127.0.0.1');
const activeBrowsers=new Set();
(async()=>{try{
 const report=[];
 if(live){for(const release of JSON.parse(fs.readFileSync('downloads/releases.json'))){const response=await fetch(base+release.file);assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),release.sha256);report.push({download:release.file,bytes:bytes.length,sha256:'PASS'});}
  // Read the API through the actual browser client, as visitors do. No real POSTs.
  const probe=await chromium.launch();activeBrowsers.add(probe);const probePage=await probe.newPage();
  await probePage.goto(base+'/yqarch-italiano/',{waitUntil:'networkidle'});
  for(const project of ['yqarch','express-tools']){const result=await probePage.evaluate(async project=>{const r=await fetch('https://cad-bim-preventivi.andrea-giaqui.workers.dev/api/plugin-comments?project='+project,{credentials:'omit'});return {status:r.status,ok:(await r.json()).ok};},project);assert.equal(result.status,200);assert.equal(result.ok,true);report.push({api:project,status:'PASS'});}
  await probe.close();
 }
 for(const [engine,type] of Object.entries({chromium,webkit,firefox})){
  const browser=await type.launch();activeBrowsers.add(browser);
  for(const width of [320,390,768,1440])for(const slug of ['yqarch-italiano','ag-cad-tools']){
   const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1}),page=await context.newPage(),errors=[],google=[],posts=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
   await page.route(/google-analytics\.com|googletagmanager\.com|googleadservices\.com/,async route=>{google.push(route.request().url());await route.fulfill({status:200,body:''});});
   await page.route('**/api/plugin-comments?**',async route=>{if(route.request().method()==='POST'){posts.push(route.request().postDataJSON());await route.fulfill({json:{ok:true,pending:true}});}else await route.fulfill({json:{ok:true,comments:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',name:'Visitatore di prova',text:'Come posso consultare la guida offline?',kind:'Domanda',environment:'Dati simulati per la verifica',createdAt:'2026-09-27T10:00:00Z'}],nextCursor:null}});});
   const response=await page.goto(base+'/'+slug+'/',{waitUntil:'networkidle'});assert.equal(response.status(),200);assert.equal(await page.locator('body').getAttribute('data-build'),(slug==='yqarch-italiano'?'20261003-yqarch-3.78-r1':'20261003-site-r1'));assert.equal(google.length,0);
   await page.getByRole('button',{name:'Rifiuta facoltativi'}).click();assert.equal(google.length,0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),engine+' '+width+' '+slug+' overflow');
   assert.equal(await page.locator('h1').count(),1);
   for(const image of await page.locator('img').all())assert.ok(await image.evaluate(e=>e.complete&&e.naturalWidth>0));
   if(width===320||width===1440){await page.addScriptTag({path:path.join(root,'node_modules/axe-core/axe.min.js')});const axe=await page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);}
   if(width===390||width===1440){await page.screenshot({path:path.join(out,`${live?'live':'candidate'}-${engine}-${width}-${slug}-hero.png`)});for(const [selector,label]of [['#download','download'],['#commenti','comments'],['#sostieni','support']])await page.locator(selector).screenshot({style:'.topbar,.skip{visibility:hidden!important}',path:path.join(out,`${live?'live':'candidate'}-${engine}-${width}-${slug}-${label}.png`)});}
   await page.locator('.comment button').click();await page.locator('[name=name]').fill('Simulazione');await page.locator('[name=text]').fill('Questa risposta è intercettata dal test e non raggiunge il server.');await page.locator('[name=privacy]').check();await page.locator('#comment-form [type=submit]').click();await page.waitForFunction(()=>document.querySelector('#comment-status').textContent.includes('moderazione'));assert.equal(posts.length,1);assert.equal(posts[0].parentId,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
   const conversions=await page.evaluate(()=>(window.dataLayer||[]).filter(x=>['generate_lead','service_quote_success'].includes(x[1])));assert.equal(conversions.length,0);assert.equal(google.length,0);assert.deepEqual(errors,[]);
   report.push({engine,width,slug,status:'PASS'});await context.close();
  }
  for(const width of [320,1440]){const ctx=await browser.newContext({viewport:{width,height:900}}),home=await ctx.newPage();await home.route('**/api/reviews**',r=>r.fulfill({json:{ok:true,reviews:[]}}));await home.goto(base+'/',{waitUntil:'networkidle'});await home.getByRole('button',{name:'Rifiuta facoltativi'}).click();assert.ok(await home.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await home.locator('.site-footer .sf-nav a').count(),8);await home.locator('footer').screenshot({path:path.join(out,`home-${engine}-${width}-footer.png`)});await ctx.close();}
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();await page.goto(base+'/express-tools-italiano/guida/',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Rifiuta facoltativi'}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await context.close();await browser.close();
 }
 fs.writeFileSync(path.join(out,(live?'live':'candidate')+'-report.json'),JSON.stringify(report,null,2));console.log('PLUGIN PAGES VERIFIED',report.length);
}catch(error){console.error(error);process.exitCode=1;}finally{for(const browser of activeBrowsers)await browser.close().catch(()=>{});if(server)server.close();}})();
