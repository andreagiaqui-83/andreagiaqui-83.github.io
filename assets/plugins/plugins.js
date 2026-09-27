(() => {
  'use strict';
  const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#page-nav');
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
  nav?.addEventListener('click',e=>{if(e.target.closest('a')){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open');}});
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(button.dataset.copy);button.textContent='Copiato';}catch{button.textContent='Seleziona e copia il dato qui sopra';}
  }));
  const project=document.body.dataset.project,form=document.querySelector('#comment-form');if(!project||!form)return;
  const base='https://cad-bim-preventivi.andrea-giaqui.workers.dev/api/plugin-comments?project='+encodeURIComponent(project);
  const list=document.querySelector('#comments-list'),status=document.querySelector('#comments-status'),more=document.querySelector('#comments-more'),feedback=document.querySelector('#comment-status'),reply=document.querySelector('#reply-context'),replyText=document.querySelector('#reply-label');
  const fields=form.elements;let cursor=null,parentId=null,inflight=false,loading=false,requestId=crypto.randomUUID();
  const seen=new Set();
  function element(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
  function cancelReply(){parentId=null;reply.hidden=true;fields.kind.value='Domanda';}
  document.querySelector('#cancel-reply').addEventListener('click',cancelReply);
  function render(c) {
    if(seen.has(c.id))return;seen.add(c.id);
    const article=element('article',null,'comment');article.id='comment-'+c.id;
    const head=element('div',null,'comment-head');head.append(element('strong',c.name));
    const time=element('time',new Date(c.createdAt).toLocaleString('it-IT',{dateStyle:'medium',timeStyle:'short'}));time.dateTime=c.createdAt;head.append(time);article.append(head);
    if(c.kind)article.append(element('span',c.kind,'comment-tag'));
    if(c.replyTo){const quote=element('blockquote');quote.append(element('strong','In risposta a '+c.replyTo.name),element('p',c.replyTo.text));article.append(quote);}
    article.append(element('p',c.text));if(c.environment)article.append(element('p',c.environment,'environment'));
    if(!c.deleted){const button=element('button','Rispondi','plain-button');button.type='button';button.addEventListener('click',()=>{parentId=c.id;replyText.textContent='Stai rispondendo a '+c.name;reply.hidden=false;fields.kind.value='Risposta';fields.text.focus();form.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});article.append(button);}
    list.append(article);
  }
  async function load(reset=false){
    if(loading)return;loading=true;more.disabled=true;
    status.textContent='Caricamento dei commenti…';
    try {
      const response=await fetch(base+(reset||!cursor?'':'&cursor='+encodeURIComponent(cursor)),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});
      const data=await response.json();if(!response.ok||!data.ok)throw new Error();
      if(reset){list.replaceChildren();seen.clear();}
      data.comments.forEach(render);cursor=data.nextCursor;more.hidden=!cursor;
      status.textContent=seen.size?'Commenti e risposte in ordine cronologico, dal più vecchio al più recente.':'Ancora nessun commento pubblicato. Puoi essere il primo a condividere una domanda o un suggerimento.';
    }catch{status.textContent='Non riesco a caricare i commenti. Usa “Aggiorna commenti” per riprovare.';}finally{loading=false;more.disabled=false;}
  }
  document.querySelector('#comments-refresh').addEventListener('click',()=>load(true));more.addEventListener('click',()=>load());
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(inflight||!form.reportValidity())return;inflight=true;
    const button=form.querySelector('[type=submit]');button.disabled=true;feedback.textContent='Invio in corso…';
    const body={requestId,name:fields.name.value.trim(),text:fields.text.value.trim(),kind:fields.kind.value,environment:fields.environment.value.trim(),website:fields.website.value,privacy:fields.privacy.checked,parentId};
    try {
      const response=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
      const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'Invio non confermato. Riprova tra poco.');
      form.reset();cancelReply();requestId=crypto.randomUUID();feedback.textContent='Grazie! Il tuo contributo è stato ricevuto. Sarà visibile dopo la moderazione, con il nome che hai scelto.';
    }catch(error){feedback.textContent=(error.name!=='Error')?'Invio non confermato. Il testo è ancora qui: riprova tra poco.':error.message;}
    finally{inflight=false;button.disabled=false;}
  });
  // Visitor contents, replies and download actions never emit service/lesson lead conversions.
  form.querySelector('[type=submit]').disabled=false;
  load(true);
})();
