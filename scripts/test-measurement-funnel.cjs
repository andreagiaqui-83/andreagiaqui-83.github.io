const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const code=fs.readFileSync('assets/measurement.js','utf8'),quoteCode=fs.readFileSync('assets/preventivo.js','utf8');
const accepted={version:2,expires:Date.now()+100000,analytics:true,marketing:true};
function fixture({type='preventivo',stored=null,url='https://andreagiaquinto.it/preventivo/',testStored=false,storageFails=false}={}){
 const w=new JSDOM(fs.readFileSync('preventivo/index.html','utf8'),{url,runScripts:'outside-only',pretendToBeVisual:true}).window;
 w.document.body.dataset.pageType=type;w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.AG_MEASUREMENT={ga4Id:'G-TESTFIXTURE',adsId:'',conversionMode:'ga4_import',consentVersion:2};
 if(stored)w.localStorage.setItem('ag_cookie_preferences',JSON.stringify(stored));
 if(testStored)w.sessionStorage.setItem('ag_measurement_test','1');
 if(storageFails)Object.defineProperty(w,'sessionStorage',{get(){throw Error('blocked');}});
 const observers=[];w.IntersectionObserver=class{constructor(cb){observers.push(cb)}observe(){}};
 w.eval(code);return {w,observers,show(){observers.forEach(cb=>cb([{isIntersecting:true}]))}};
}
const events=w=>w.dataLayer.filter(x=>x[0]==='event');
const count=(w,name)=>events(w).filter(x=>x[1]===name).length;
test('Home and quote share all, analytics-only and rejected advertising preferences',()=>{
 for(const choice of [{analytics:true,marketing:true},{analytics:true,marketing:false},{analytics:false,marketing:false}]){
  const home=fixture({type:'services'}).w;
  home.document.querySelector('#ag-analytics').checked=choice.analytics;home.document.querySelector('#ag-marketing').checked=choice.marketing;home.document.querySelector('[data-choice=save]').click();
  const quote=fixture({stored:JSON.parse(home.localStorage.getItem('ag_cookie_preferences'))}).w;
  assert.equal(quote.document.querySelector('#ag-marketing').disabled,false);assert.deepEqual({...quote.AGTracking.getConsent()},choice);
  const update=quote.dataLayer.filter(x=>x[0]==='consent'&&x[1]==='update').at(-1)[2];assert.equal(update.ad_storage,choice.marketing?'granted':'denied');assert.equal(update.ad_personalization,'denied');
  assert.equal(quote.document.querySelectorAll('[data-ag-measurement]').length,choice.analytics?1:0);
  home.close();quote.close();
 }
});
test('Explicit QA mode blocks Google after opt-in, persists for the tab, and can be exited',()=>{
 for(const settings of [{url:'https://andreagiaquinto.it/?ag_test=1',type:'services'},{testStored:true},{url:'https://andreagiaquinto.it/?ag_test=1',storageFails:true}]){
  const {w}=fixture({...settings,stored:accepted});w.document.querySelector('[data-choice=all]').click();
  w.AGTracking.track('service_quote_success',{lead_id:w.crypto.randomUUID(),form_id:'online_quote'});
  assert.equal(w.AGTracking.isTestSession(),true);assert.equal(w.document.querySelectorAll('[data-ag-measurement]').length,0);assert.equal(events(w).length,0);w.close();
 }
 const {w}=fixture({testStored:true,stored:accepted,url:'https://andreagiaquinto.it/preventivo/?ag_test=0&utm_source=linkedin'});
 assert.equal(w.AGTracking.isTestSession(),false);assert.equal(count(w,'page_view'),1);assert.ok(!events(w)[0][2].page_location.includes('ag_test'));assert.match(events(w)[0][2].page_location,/utm_source=linkedin/);w.close();
});
test('Quote funnel is consent-gated and deduplicated; service preselection is not a start',()=>{
 const f=fixture({url:'https://andreagiaquinto.it/preventivo/?servizio=scan-bim'}),{w}=f;w.eval(quoteCode);f.show();
 const input=w.document.querySelector('#contactNotes');input.value='PRIVATE';input.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(events(w).length,0);
 w.document.querySelector('[data-choice=all]').click();assert.equal(count(w,'form_view'),1);assert.equal(count(w,'form_start'),0);
 w.document.querySelector('#quoteWebsite').dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(count(w,'form_start'),0);
 for(let i=0;i<3;i++){f.show();input.dispatchEvent(new w.Event('input',{bubbles:true}));input.dispatchEvent(new w.Event('change',{bubbles:true}));}
 assert.equal(count(w,'form_view'),1);assert.equal(count(w,'form_start'),1);assert.equal(count(w,'service_quote_success'),0);assert.ok(!JSON.stringify(events(w)).includes('PRIVATE'));w.close();
});
test('A view preceding the consent choice is not replayed after the form leaves the viewport',()=>{
 const f=fixture(),{w}=f;w.eval(quoteCode);f.show();f.observers.forEach(cb=>cb([{isIntersecting:false}]));w.document.querySelector('[data-choice=all]').click();assert.equal(count(w,'form_view'),0);f.show();assert.equal(count(w,'form_view'),1);w.close();
});
test('Contact methods stay distinct secondary interactions and do not contain addresses',()=>{
 const {w}=fixture({stored:accepted});for(const href of ['mailto:private@example.invalid','tel:+390000000000','https://wa.me/390000000000']){const a=w.document.createElement('a');a.href=href;a.addEventListener('click',e=>e.preventDefault());w.document.body.append(a);a.click();}
 assert.deepEqual(Array.from(events(w).filter(x=>x[1]==='contact_click'),x=>x[2].contact_method),['email','phone','whatsapp']);assert.equal(count(w,'service_quote_success'),0);assert.equal(count(w,'generate_lead'),0);assert.ok(!JSON.stringify(events(w)).includes('private@example'));w.close();
});
