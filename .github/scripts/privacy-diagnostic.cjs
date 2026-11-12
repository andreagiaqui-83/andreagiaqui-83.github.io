'use strict';
// Isolated verification of a2c4c2a. No production writes or source changes.
const {chromium, firefox, webkit} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(process.env.RUNNER_TEMP || '/tmp', 'privacy-diagnostic');
fs.mkdirSync(out, {recursive:true});
const engine = process.env.QA_ENGINE || 'chromium';
const results = [];
const failures = [];
const sampleId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
async function state(page) {
  return page.evaluate(() => {
    const input = document.querySelector('#comment-form [name=privacy]');
    const r = input.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return {checked:input.checked, disabled:input.disabled, connected:input.isConnected,
      rect:{x:r.x,y:r.y,w:r.width,h:r.height}, scrollY, active:document.activeElement?.outerHTML,
      hit:hit?.outerHTML?.slice(0,500), animations:document.getAnimations().map(a=>({state:a.playState,target:a.effect?.target?.outerHTML?.slice(0,200)})),
      events:window.__qaEvents, shifts:window.__qaShifts, samples:window.__qaSamples?.slice(-20),
      overflow:document.documentElement.scrollWidth>innerWidth+1};
  });
}
async function settled(page) {
  await page.waitForFunction(() => {
    const a=window.__qaSamples;
    if(!a || a.length<12)return false;
    const s=a.slice(-12), first=s[0];
    return s.every(v=>Math.abs(v.y-first.y)<0.1 && Math.abs(v.x-first.x)<0.1 && Math.abs(v.scroll-first.scroll)<0.1);
  });
}
(async()=>{
  const browser = await ({chromium,firefox,webkit}[engine]).launch();
  try {
    for (const width of [320,390,768,1440]) for (const consent of ['close','reject','accept']) {
      const context = await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
      await context.tracing.start({screenshots:true,snapshots:true,sources:true});
      const writes=[],errors=[];
      await context.route('**/*', async route=>{
        const request=route.request(), u=new URL(request.url());
        if(/google-analytics\.com|googletagmanager\.com|googleadservices\.com/.test(u.hostname))return route.fulfill({status:200,body:''});
        if(u.hostname==='andreagiaquinto.it' && u.pathname==='/cdn-cgi/rum' && request.method()==='POST')return route.fulfill({status:204,body:''});
        if(u.pathname==='/api/plugin-comments' && request.method()==='GET')return route.fulfill({json:{ok:true,comments:[{id:sampleId,name:'Fixture locale QA',text:'Commento simulato esclusivamente nel browser di verifica.',kind:'Domanda',createdAt:'2026-01-01T12:00:00Z'}],nextCursor:null}});
        if(!['GET','HEAD'].includes(request.method())){writes.push({url:u.origin+u.pathname,method:request.method()});return route.abort('blockedbyclient');}
        return route.continue();
      });
      const page=await context.newPage();
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>{
        window.__qaEvents=[];window.__qaSamples=[];window.__qaShifts=[];
        for(const type of ['pointerdown','pointerup','click','input','change','focusin','keydown'])document.addEventListener(type,e=>{
          if(e.target.closest?.('#comment-form'))window.__qaEvents.push({type,target:e.target.name||e.target.tagName,checked:e.target.checked,key:e.key,time:performance.now(),scroll:scrollY,prevented:e.defaultPrevented});
        },true);
        const sample=()=>{const el=document.querySelector('[name=privacy]');if(el){const r=el.getBoundingClientRect();window.__qaSamples.push({x:r.x,y:r.y,scroll:scrollY});if(window.__qaSamples.length>60)window.__qaSamples.shift();}requestAnimationFrame(sample);};requestAnimationFrame(sample);
        try{new PerformanceObserver(list=>{window.__qaShifts.push(...list.getEntries().map(e=>({value:e.value,recent:e.hadRecentInput})));}).observe({type:'layout-shift',buffered:true});}catch{}
      });
      let failed=false;
      try {
        const response=await page.goto('https://andreagiaquinto.it/ag-cad-tools/?ag_test=1',{waitUntil:'networkidle'});
        assert.equal(response.status(),200);
        await page.getByRole('button',{name:consent==='close'?'Chiudi senza accettare':consent==='reject'?'Rifiuta facoltativi':'Accetta tutti',exact:true}).click();
        const input=page.locator('#comment-form [name=privacy]');
        const label=page.locator('#comment-form label.check span');
        assert.equal(await input.count(),1);
        assert.ok(await input.isVisible());assert.ok(await input.isEnabled());
        for(const mode of ['main','reply']) {
          if(mode==='reply') {
            // Reproduce original order without an artificial delay before check().
            await page.locator('.comment button').click();
            await page.locator('[name=name]').fill('Simulazione QA');
            await page.locator('[name=text]').fill('Solo verifica locale: nessun commento viene inviato.');
            await input.check();assert.equal(await input.isChecked(),true);
            await input.uncheck();
            assert.equal(await page.locator('[name=kind]').inputValue(),'Risposta');
          }
          await input.scrollIntoViewIfNeeded();await settled(page);
          const before=await state(page);
          assert.equal(before.overflow,false);
          assert.ok(before.hit?.includes('name="privacy"'),JSON.stringify(before));
          await input.click();assert.equal(await input.isChecked(),true);
          await label.click();assert.equal(await input.isChecked(),false);
          await label.click();assert.equal(await input.isChecked(),true);
          await input.click();assert.equal(await input.isChecked(),false);
          await page.locator('[name=text]').focus();await page.keyboard.press('Tab');
          assert.ok(await input.evaluate(e=>document.activeElement===e),'Privacy reached by keyboard Tab');
          await page.keyboard.press('Space');assert.equal(await input.isChecked(),true);
          await page.keyboard.press('Space');assert.equal(await input.isChecked(),false);
          // Menu interaction after scroll. Desktop uses Services disclosure.
          const menu=page.locator('.sg-toggle');
          if(await menu.isVisible())await menu.click();
          await page.locator('.sg-services summary').click();
          await page.keyboard.press('Escape');
          if(await menu.isVisible())await page.keyboard.press('Escape');
          assert.equal(await menu.getAttribute('aria-expanded'),'false');
          await input.check();assert.equal(await input.isChecked(),true);await input.uncheck();
          await page.mouse.wheel(0,450);await page.mouse.wheel(0,-450);
          await input.scrollIntoViewIfNeeded();await settled(page);
          for(let i=0;i<3;i++){await input.check();assert.equal(await input.isChecked(),true);await input.uncheck();assert.equal(await input.isChecked(),false);}
          await page.getByRole('button',{name:'Preferenze cookie',exact:true}).click();
          await page.getByRole('button',{name:'Chiudi senza accettare',exact:true}).click();
          await input.check();assert.equal(await input.isChecked(),true);await input.uncheck();
          const after=await state(page);
          assert.equal(after.disabled,false);assert.equal(after.connected,true);assert.equal(after.overflow,false);
          results.push({engine,width,consent,mode,status:'PASS',before,after});
          console.log('PASS',engine,width,consent,mode,'input/label/Tab/Space/menu/scroll/cookie; zero submissions');
        }
        await page.getByRole('button',{name:'Annulla risposta',exact:true}).click();
        assert.equal(await page.locator('[name=kind]').inputValue(),'Domanda');
        assert.equal(writes.length,0,JSON.stringify(writes));assert.deepEqual(errors,[]);
      } catch(e) {
        failed=true;failures.push({engine,width,consent,error:e.stack,state:await state(page).catch(()=>null),writes,errors});
        console.error('FAIL',engine,width,consent,e.message);
        await page.screenshot({path:path.join(out,`${engine}-${width}-${consent}-failure.png`)});
      } finally {
        await context.tracing.stop(failed?{path:path.join(out,`${engine}-${width}-${consent}-trace.zip`)}:{});
        await context.close();
      }
    }
  } finally {await browser.close();fs.writeFileSync(path.join(out,`${engine}-report.json`),JSON.stringify({engine,results,failures},null,2));}
  console.log(JSON.stringify({engine,passed:results.length,failed:failures.length}));
  if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
