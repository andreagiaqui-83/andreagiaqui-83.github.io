'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const code=fs.readFileSync('assets/review-share.js','utf8');
for(const [file,url] of [['index.html','https://andreagiaquinto.it/#lascia-recensione'],['lezioni-autocad/index.html','https://andreagiaquinto.it/lezioni-autocad/#lascia-recensione']]){
 test(file+': copies only the direct review link, without submitting or exposing visitor parameters',async()=>{
  const dom=new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'outside-only',url:url.replace('#','?email=private%40example.invalid&utm_source=internal#')});
  const {window:w}=dom,d=w.document;let copied,submitted=0;
  d.querySelector('#reviewForm').addEventListener('submit',()=>submitted++);
  w.navigator.clipboard={writeText:async text=>{copied=text;}};
  w.eval(code);const button=d.querySelector('[data-review-copy]');assert.equal(button.hidden,false);button.click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(copied,url);assert.equal(submitted,0);assert.match(d.querySelector('[data-review-copy-status]').textContent,/Link copiato/);
  assert.equal(d.querySelector('[data-review-copy-fallback]').hidden,true);
  w.navigator.clipboard={writeText:async()=>{throw Error('Denied');}};button.click();await new Promise(resolve=>setImmediate(resolve));
  const input=d.querySelector('[data-review-copy-url]');assert.equal(input.value,url);assert.equal(input.readOnly,true);assert.equal(d.activeElement,input);assert.equal(input.selectionEnd,url.length);
  assert.equal(d.querySelector('[data-review-copy-fallback]').hidden,false);assert.doesNotMatch(d.querySelector('[data-review-copy-status]').textContent,/Link copiato/);assert.equal(button.disabled,false);assert.equal(submitted,0);
  dom.window.close();
 });
}
