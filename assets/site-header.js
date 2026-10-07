(()=>{
  'use strict';
  const header=document.querySelector('.sg-header');
  const button=header?.querySelector('.sg-toggle'),nav=header?.querySelector('.sg-nav');
  if(!button||!nav)return;
  const root=document.documentElement,plugins=nav.querySelector('.sg-plugins');
  root.classList.add('sg-js','sg-ready');
  const closePlugins=()=>{if(plugins)plugins.open=false;};
  const setOpen=open=>{
    nav.classList.toggle('sg-open',open);
    button.setAttribute('aria-expanded',String(open));
    root.classList.toggle('sg-menu-open',open);
    if(!open)closePlugins();
  };
  const close=()=>setOpen(false);
  button.addEventListener('click',()=>setOpen(!nav.classList.contains('sg-open')));
  nav.addEventListener('click',e=>{if(e.target.closest('a'))close();});
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    if(plugins?.open){closePlugins();plugins.querySelector('summary').focus();}
    else if(nav.classList.contains('sg-open')){close();button.focus();}
  });
  document.addEventListener('click',e=>{
    if(!header.contains(e.target))close();
    else if(plugins&&!plugins.contains(e.target))closePlugins();
  });
  document.addEventListener('focusin',e=>{
    if(!header.contains(e.target))close();
    else if(plugins&&!plugins.contains(e.target))closePlugins();
  });
  const media=matchMedia('(min-width:1101px)');
  const onMedia=()=>close();
  if(media.addEventListener)media.addEventListener('change',onMedia);
  else media.addListener(onMedia);
})();
