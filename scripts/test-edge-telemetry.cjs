'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),mock=require('./qa-edge-telemetry.cjs');
test('QA intercepts only the known Cloudflare beacon and never contact or unknown writes',async()=>{
  for(const [url,method,expected] of [
    ['https://static.cloudflareinsights.com/beacon.min.js/vce701823','GET',true],
    ['https://andreagiaquinto.it/cdn-cgi/rum?','POST',true],
    ['https://andreagiaquinto.it/api/submit','POST',false],
    ['https://cad-bim-preventivi.andrea-giaqui.workers.dev/api/submit','POST',false],
    ['https://andreagiaquinto.it.evil.example/cdn-cgi/rum','POST',false],
    ['https://andreagiaquinto.it/cdn-cgi/rum/other','POST',false],
    ['https://static.cloudflareinsights.com/unknown.js','GET',false],
  ]){
    let response;
    const route={request:()=>({url:()=>url,method:()=>method}),fulfill:async value=>{response=value;}};
    assert.equal(await mock(route),expected,url);
    assert.equal(!!response,expected,url);
  }
});
