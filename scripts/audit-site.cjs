// Whole-site read-only audit. All remote writes and Google tracking are intercepted.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,firefox,webkit}=require('playwright');
const live=process.argv.includes('live'),root=process.cwd();
const base=live?'https://andreagiaquinto.it':'http://127.0.0.1:8887';
const out=path.join(process.env.RUNNER_TEMP||'/tmp','site-audit');fs.mkdirSync(out,{recursive:true});
const entries=JSON.parse(fs.readFileSync('scripts/site-pages.json'));
const widths=[320,360,375,390,393,412,430,600,768,800,820,1024,1280,1366,1440,1920];
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.avif':'image/avif','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
let server;
const report={mode:live?'live':'local',at:new Date().toISOString(),pages:[],issues:[],blockedWrites:[]};
async function run(){
 if(!live){server=http.createServer((req,res)=>{try{let name=decodeURIComponent(new URL(req.url,base).pathname);if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error('Path');const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(8887,'127.0.0.1',r));}
 const requested=(process.env.QA_ENGINES||'chromium,firefox,webkit').split(',');
 for(const [engine,type] of Object.entries({chromium,firefox,webkit}).filter(([name])=>requested.includes(name))){
  const opts=engine==='chromium'&&process.env.QA_BROWSER_OPTIONS?JSON.parse(process.env.QA_BROWSER_OPTIONS):{};
  const browser=await type.launch(opts);
  try{for(const entry of entries){
   const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',serviceWorkers:'block'}),page=await ctx.newPage();
   const errors=[],google=[];
   await ctx.route('**/*',async route=>{const req=route.request(),u=req.url();
    if(/google-analytics\.com|googletagmanager\.com|googleadservices\.com/.test(u)){google.push(u);return route.fulfill({status:200,body:''});}
    if(!['GET','HEAD','OPTIONS'].includes(req.method())){report.blockedWrites.push({url:u,method:req.method()});return route.abort();}
    if(u.includes('cad-bim-preventivi.andrea-giaqui.workers.dev'))return route.fulfill({json:{ok:true,reviews:[],comments:[],nextCursor:null}});
    return route.continue();
   });
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===new URL(base).origin&&!(entry.file==='404.html'&&r.status()===404))errors.push(r.status()+' '+r.url());});
   const url=entry.file==='index.html'?'/':'/'+entry.file.replace(/\/index\.html$/,'/');
   const response=await page.goto(base+url,{waitUntil:'networkidle'});
   const row={file:entry.file,engine,status:response.status(),widths:[],axe:[],googleBeforeConsent:google.length};
   const reject=page.getByRole('button',{name:'Rifiuta facoltativi'});if(await reject.isVisible())await reject.click();
   row.structure=await page.evaluate(()=>({lang:document.documentElement.lang,title:document.title,h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main').length,canonical:document.querySelector('link[rel=canonical]')?.href,robots:document.querySelector('meta[name=robots]')?.content,ids:[...document.querySelectorAll('[id]')].map(e=>e.id).filter((x,i,a)=>a.indexOf(x)!==i)}));
   // Force pending lazy images only for decoding checks, not for performance measurements.
   row.images=await page.evaluate(async()=>{const bad=[];await Promise.all([...document.images].filter(img=>img.getAttribute('src')||img.currentSrc).map(async img=>{img.loading='eager';try{await img.decode()}catch{bad.push((img.getAttribute('src')||img.currentSrc).slice(0,160))}}));return {total:document.images.length,broken:bad}});
   for(const width of widths){await page.setViewportSize({width,height:900});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);row.widths.push({width,overflow});if(overflow)report.issues.push({file:entry.file,engine,width,type:'overflow',nodes:await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&getComputedStyle(e).position!=='fixed'}).slice(0,12).map(e=>({tag:e.tagName,id:e.id,class:e.className,rect:e.getBoundingClientRect().toJSON()})))});
    if(engine==='chromium'&&[390,1440].includes(width)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,`${live?'live':'local'}-${entry.file.replace(/[^a-z0-9]/gi,'-')}-${width}.png`)});}
   }
   await page.setViewportSize({width:320,height:900});
   await page.addScriptTag({path:path.join(root,'node_modules/axe-core/axe.min.js')});
   row.axe=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html.slice(0,500)}))})));
   row.keyboard=await page.evaluate(()=>{const e=document.querySelector('.page-return a,.skip,.skip-link,.doc-skip');if(!e)return {skipOrReturn:false};e.focus();return {skipOrReturn:true,focusable:document.activeElement===e}});
   if(await page.locator('[data-consent-open]').count()){await page.locator('[data-consent-open]').first().click();row.cookiePreferences=await reject.isVisible();await reject.click();}
   row.errors=errors;row.googleAfterReject=google.length;
   if(row.axe.length)report.issues.push({file:entry.file,engine,type:'axe',violations:row.axe});
   if(errors.length||row.images.broken.length||row.structure.h1!==1||row.structure.ids.length||google.length)report.issues.push({file:entry.file,engine,type:'structure-assets-consent',errors,images:row.images,structure:row.structure,google});
   report.pages.push(row);console.log('AUDIT',engine,entry.file,'issues',report.issues.filter(x=>x.file===entry.file&&x.engine===engine).length);
   await ctx.close();
  }}finally{await browser.close();}
 }
}
run().catch(e=>{report.fatal=String(e.stack);console.error(e);process.exitCode=1}).finally(()=>{server?.close();fs.writeFileSync(path.join(out,(live?'live':'local')+'-audit.json'),JSON.stringify(report,null,2));console.log('AUDIT COMPLETE',report.pages.length,'pages',report.issues.length,'findings');if(report.issues.length||report.blockedWrites.length)process.exitCode=1;});
