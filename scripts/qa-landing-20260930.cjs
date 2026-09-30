// Browser verification. All form writes and analytics collection are intercepted.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const entries=JSON.parse(fs.readFileSync('scripts/site-pages.json','utf8'));
const live=process.argv.includes('live'),out=path.join(process.env.RUNNER_TEMP||'/tmp','landing-proof');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.avif':'image/avif','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
let server;const base=live?'https://andreagiaquinto.it':'http://127.0.0.1:8779';
const routeFor=f=>'/'+(f.endsWith('index.html')?f.slice(0,-10):f);
if(!live)server=http.createServer((req,res)=>{let name=new URL(req.url,base).pathname;if(name.endsWith('/'))name+='index.html';try{const file=path.join(process.cwd(),decodeURIComponent(name));const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end();}}).listen(8779,'127.0.0.1');
const safeName=s=>s.replace(/[^a-z0-9]+/gi,'-');
(async()=>{const report=[];try{
 if(!live){const missing=await fetch(base+'/__qa_missing_resource__.txt');assert.equal(missing.status,404,'Test server must handle absent files without crashing');}
 for(const [engine,type] of Object.entries({chromium,firefox,webkit})){
  const browser=await type.launch();
  for(const entry of entries){const widths=entry.file==='index.html'?[320,360,390,430,768,1024,1440,1920]:[320,1440];
   for(const width of widths){
    const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[],google=[],writes=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',async route=>{const req=route.request(),u=req.url();if(/google-analytics\.com|googletagmanager\.com|googleadservices\.com/.test(u)){google.push(u);return route.fulfill({status:200,body:''});}if(u.includes('cad-bim-preventivi.andrea-giaqui.workers.dev')){if(req.method()!=='GET')writes.push(req.postData());return route.fulfill({json:{ok:true,reviews:[],comments:[]}});}assert.ok(['GET','HEAD','OPTIONS'].includes(req.method()),'Unexpected write '+u);return route.continue();});
    const response=await page.goto(base+routeFor(entry.file),{waitUntil:'networkidle'});assert.ok(response.status()===200||(live&&entry.file==='404.html'&&response.status()===404));
    const reject=page.getByRole('button',{name:'Rifiuta facoltativi'});if(await reject.isVisible())await reject.click();
    const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:innerWidth}));assert.ok(overflow.scroll<=width+1,JSON.stringify({engine,file:entry.file,width,overflow}));assert.equal(await page.locator('footer a[href*="linkedin"]').count(),0);
    for(const a of await page.locator('.page-back-button').all()){assert.equal(await a.getAttribute('href'),entry.parent.href);await a.scrollIntoViewIfNeeded();const box=await a.boundingBox();assert.ok(box.height>=44&&box.x>=-1&&box.x+box.width<=width+1,entry.file+' return control');await a.focus();assert.equal(await a.evaluate(e=>e===document.activeElement),true);}
    for(const a of await page.locator('.site-footer a,.site-footer button').all()){await a.scrollIntoViewIfNeeded();const box=await a.boundingBox();assert.ok(box.height>=43&&box.x>=-1&&box.x+box.width<=width+1,entry.file+' footer control '+await a.innerText());}
    await page.locator('footer [data-consent-open]').click();assert.ok(await reject.isVisible());await reject.click();await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
    const violations=await page.evaluate(async()=>{const include=['.site-footer','.page-return'];if(document.querySelector('#render'))include.push('#render','.interior-intro');return(await axe.run({include:include.filter(s=>document.querySelector(s))},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)}));});assert.deepEqual(violations,[],JSON.stringify({engine,file:entry.file,width}));
    if(engine==='chromium'&&[320,390,768,1440].includes(width)){
     if(entry.file==='index.html')for(const id of ['render','interior-design'])await page.locator('#'+id).screenshot({animations:'disabled',path:path.join(out,`${live?'live':'candidate'}-${id}-${width}.png`)});
     if(entry.kind!=='landing'){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({animations:'disabled',path:path.join(out,`${live?'live':'candidate'}-${safeName(entry.file)}-${width}.png`)});}
    }
    assert.deepEqual(errors,[],entry.file);assert.deepEqual(google,[],entry.file+' analytics before consent');assert.deepEqual(writes,[]);report.push({engine,width,file:entry.file,status:'PASS',axe:'PASS',returns:entry.parent?2:0});console.log('REVISION',engine,width,entry.file,'PASS');await ctx.close();
   }
  }
  const ctx=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});
  for(const entry of entries.filter(e=>e.parent)){const page=await ctx.newPage();await page.goto(base+routeFor(entry.file));const a=page.locator('.page-back-button').first();await a.click();const expected=new URL(entry.parent.href,'https://andreagiaquinto.it');await page.waitForURL(u=>u.pathname===expected.pathname);assert.equal(new URL(page.url()).pathname,expected.pathname);report.push({engine,file:entry.file,status:'PASS',javascript:false,parent:expected.pathname});await page.close();}
  await ctx.close();await browser.close();
 }
 fs.writeFileSync(path.join(out,(live?'live':'candidate')+'-revision.json'),JSON.stringify(report,null,2));console.log('REVISION VERIFIED',report.length);
 }catch(e){fs.writeFileSync(path.join(out,'failure.txt'),String(e.stack||e));console.error(e);process.exitCode=1;}finally{server?.close();}
})();
