'use strict';
// Verify the same-origin downloads as served to the website's normal browser client.
// No real form submissions, analytics, security-setting changes or executable runs.
const {chromium}=require('playwright');
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const base='https://andreagiaquinto.it';
const releases=JSON.parse(fs.readFileSync('downloads/releases.json','utf8'));
const files=['/downloads/releases.json','/downloads/portfolio/Andrea_Giaquinto_Portfolio.pdf',...releases.map(r=>r.file),...releases.map(r=>`/downloads/${r.project}/SHA256_AG_CAD_Tools_${r.version}.txt`)];
(async()=>{
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext();
  await context.route('**/*',route=>{
   const request=route.request();
   if(!['GET','HEAD','OPTIONS'].includes(request.method()))return route.abort();
   if(/google-analytics\.com|googletagmanager\.com|googleadservices\.com/.test(request.url()))return route.fulfill({status:200,body:''});
   return route.continue();
  });
  const page=await context.newPage();
  await page.goto(base+'/ag-cad-tools/?ag_test=1',{waitUntil:'networkidle'});
  for(const file of files){
   const actual=await page.evaluate(async file=>{
    const response=await fetch(file,{cache:'no-store'});
    if(!response.ok)throw new Error(file+': HTTP '+response.status);
    const data=await response.arrayBuffer();
    const hash=await crypto.subtle.digest('SHA-256',data);
    return{bytes:data.byteLength,sha256:Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')};
   },file);
   const expected=fs.readFileSync(file.slice(1));
   assert.equal(actual.bytes,expected.length,file+' size');
   assert.equal(actual.sha256,crypto.createHash('sha256').update(expected).digest('hex'),file+' SHA-256');
   console.log('PUBLIC FILE VERIFIED',file,actual.bytes,actual.sha256);
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
