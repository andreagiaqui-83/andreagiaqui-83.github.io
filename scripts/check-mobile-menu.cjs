'use strict';
const assert=require('node:assert/strict');

// Real layout/hit-testing is essential: the old menu had correct ARIA/classes
// while its sticky header and links were outside the viewport after scrolling.
module.exports=async function checkMobileMenu(page,{extended=false,touch=false}={}){
 const results=[];
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const state=()=>page.evaluate(()=>{
  const header=document.querySelector('.sg-header'),button=header.querySelector('.sg-toggle'),nav=header.querySelector('.sg-nav');
  const b=button.getBoundingClientRect(),n=nav.getBoundingClientRect();
  return {y:scrollY,open:button.getAttribute('aria-expanded')==='true',locked:document.documentElement.classList.contains('sg-menu-open'),
   button:{x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom},nav:{top:n.top,bottom:n.bottom,height:n.height},
   buttonHit:button.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)),
   navHit:nav.contains(document.elementFromPoint(n.x+n.width/2,n.top+Math.min(30,n.height/2))),
   inner:nav.scrollTop,innerMax:nav.scrollHeight-nav.clientHeight,viewport:innerHeight};
 });
 const toggle=async()=>{
  const s=await state();
  assert.ok(s.button.y>=0&&s.button.bottom<=s.viewport&&s.buttonHit,'Menu toggle must remain visible and clickable after scrolling');
  const x=s.button.x+s.button.width/2,y=s.button.y+s.button.height/2;
  if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
  await settle();
 };
 const sizes=extended?[{width:360,height:740},{width:390,height:844},{width:760,height:360}]:[{width:360,height:740}];
 for(const size of sizes){
  await page.setViewportSize(size);
  for(const ratio of extended?[0,.5,1]:[.5]){
   await page.evaluate(r=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*r,behavior:'instant'}),ratio);
   await settle();
   const before=await state();
   for(let cycle=0;cycle<2;cycle++){
    await toggle();
    const opened=await state();
    assert.ok(opened.open&&opened.locked&&opened.buttonHit&&opened.navHit,'Open menu and close button must be painted and reachable');
    assert.ok(opened.nav.top>=0&&opened.nav.bottom<=opened.viewport+1,'Menu must fit the visible viewport');
    assert.ok(Math.abs(opened.y-before.y)<=2,'Opening must preserve the document scroll position');
    // Wheel outside the panel must not scroll the background.
    if(!touch){await page.mouse.move(2,size.height-2);await page.mouse.wheel(0,180);await settle();assert.ok(Math.abs((await state()).y-opened.y)<=2,'Background must remain locked');}
    if(cycle===0){await toggle();}else{await page.keyboard.press('Escape');await settle();}
    const closed=await state();
    assert.ok(!closed.open&&!closed.locked&&closed.buttonHit,'Closing must release the scroll lock');
    assert.ok(Math.abs(closed.y-before.y)<=2,'Closing must preserve the document scroll position');
   }
   results.push({...size,ratio,y:before.y});
  }
 }
 if(extended){
  // Short landscape viewport: all eight destinations remain reachable by
  // scrolling the panel, without scrolling the underlying page.
  await toggle();
  const opened=await state();
  assert.ok(opened.innerMax>0,'Landscape menu needs internal scrolling');
  const last=page.locator('.sg-nav a').last();
  await last.focus();await settle();
  const lastHit=await last.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});
  assert.ok(lastHit,'Last menu destination must be visible and clickable');
  assert.ok(Math.abs((await state()).y-opened.y)<=2,'Moving through the menu must not move the page');
  await page.keyboard.press('Escape');await settle();
  // Outside interaction closes the panel.
  await page.setViewportSize({width:390,height:844});await settle();await toggle();
  await page.mouse.click(2,800);await settle();assert.ok(!(await state()).locked,'Outside click releases the lock');
  // Switching to desktop while open releases the lock and shows normal nav.
  await toggle();await page.setViewportSize({width:1280,height:900});await settle();
  assert.ok(!(await state()).locked,'Desktop breakpoint releases the mobile lock');
  assert.equal(await page.locator('.sg-nav a:visible').count(),8);
 }
 // Check that scrolling really works again, not only that a class disappeared.
 await page.setViewportSize({width:360,height:740});
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await settle();
 if(!touch){await page.mouse.move(2,700);await page.mouse.wheel(0,300);await page.waitForFunction(()=>scrollY>0);}
 return results;
};
