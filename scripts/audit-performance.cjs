// Comparable synthetic runs for the four public landing pages; no form submissions.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{spawnSync}=require('node:child_process');
const root=path.resolve(process.argv[2]||'.'),label=process.argv[3]||'candidate';
const out=path.join(process.env.RUNNER_TEMP||'/tmp','performance-proof',label);fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.avif':'image/avif','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'};
const server=http.createServer((req,res)=>{try{if(!['GET','HEAD'].includes(req.method))throw Error('Read only');let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p.endsWith('/'))p+='index.html';const file=path.resolve(root,'.'+p);if(!file.startsWith(root+path.sep))throw Error('Path');const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(8889,'127.0.0.1',r));const {spawn}=require('node:child_process'),summary=[];try{
 for(const route of ['/','/lezioni-autocad/','/yqarch-italiano/','/express-tools-italiano/'])for(const device of ['mobile','desktop']){
  const file=path.join(out,(route==='/'?'home':route.replaceAll('/',''))+'-'+device);
  const args=[require.resolve('lighthouse/cli/index.js'),'http://127.0.0.1:8889'+route,'--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage','--only-categories=performance,accessibility,best-practices,seo','--output=json','--output=html','--output-path='+file,'--quiet'];
  if(device==='desktop')args.push('--preset=desktop');
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{stdio:'inherit'});child.on('error',reject);child.on('close',code=>code?reject(Error('Lighthouse exit '+code)):resolve());});
  const data=JSON.parse(fs.readFileSync(file+'.report.json'));if(data.runtimeError)throw Error(JSON.stringify(data.runtimeError));
  const row={route,device,lighthouseVersion:data.lighthouseVersion,fetchTime:data.fetchTime,scores:Object.fromEntries(Object.entries(data.categories).map(([k,v])=>[k,Math.round(v.score*100)])),metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(k=>[k,data.audits[k].numericValue])),transferBytes:data.audits['total-byte-weight'].numericValue,failed:Object.entries(data.audits).filter(([k,v])=>v.score!==null&&v.score<1&&!['manual','informative','notApplicable'].includes(v.scoreDisplayMode)).map(([k,v])=>({id:k,title:v.title,value:v.displayValue}))};summary.push(row);console.log('LAB',JSON.stringify(row));
 }
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({kind:'single-run local synthetic audit; no field INP or email delivery test',reports:summary},null,2));
 }finally{server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
