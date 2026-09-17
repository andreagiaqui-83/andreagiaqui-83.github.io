(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const $=selector=>document.querySelector(selector);
  const track=(event,values)=>window.AGTracking?.track(event,values);
  const backend='https://cad-bim-preventivi.andrea-giaqui.workers.dev';
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toggle=$('.menu-toggle'), nav=$('#navLinks');
  const closeMenu=()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Apri menu');};
  toggle.hidden=false;
  toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Chiudi menu':'Apri menu');});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){closeMenu();toggle.focus();}});
  document.addEventListener('click',event=>{if(!event.target.closest('.nav'))closeMenu();});
  matchMedia('(min-width:981px)').addEventListener('change',closeMenu);
  $('#year').textContent=new Date().getFullYear();
  const previewNote=$('.visual-preview-note');
  if(previewNote&&document.documentElement.dataset.visualPreview==='without-render')previewNote.hidden=false;
  const imageDialog=$('#programImageDialog'),imageDetail=$('#programImageDetail'),imageStage=$('#programImageStage'),imageZoom=$('#imageZoom');
  if(imageDialog&&typeof imageDialog.showModal==='function'){
    let imageOpener=null;
    const resetZoom=()=>{imageStage.classList.remove('is-zoomed');imageZoom.setAttribute('aria-pressed','false');imageZoom.textContent='Dimensioni reali';imageStage.scrollTop=0;imageStage.scrollLeft=0;};
    document.querySelectorAll('.program-image-link').forEach(link=>{
      link.setAttribute('aria-haspopup','dialog');
      link.addEventListener('click',event=>{
        if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
        event.preventDefault();imageOpener=link;resetZoom();
        $('#programImageTitle').textContent=link.dataset.imageTitle;
        imageDetail.alt=link.querySelector('img').alt;imageDetail.src=link.href;
        imageDialog.showModal();document.body.classList.add('image-viewer-open');
        document.dispatchEvent(new Event('ag:imageopen'));
      });
    });
    imageZoom.addEventListener('click',()=>{const zoomed=imageStage.classList.toggle('is-zoomed');imageZoom.setAttribute('aria-pressed',String(zoomed));imageZoom.textContent=zoomed?'Adatta alla finestra':'Dimensioni reali';imageStage.scrollTop=0;imageStage.scrollLeft=0;});
    $('#imageClose').addEventListener('click',()=>imageDialog.close());
    imageDialog.addEventListener('click',event=>{if(event.target!==imageDialog)return;const r=imageDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)imageDialog.close();});
    imageDialog.addEventListener('close',()=>{resetZoom();document.body.classList.remove('image-viewer-open');document.dispatchEvent(new Event('ag:imageclose'));imageOpener?.focus({preventScroll:true});});
  }
  const carousel=$('#reviewsCarousel'), grid=carousel.querySelector('.reviews-grid'),prev=$('#reviewsPrev'),next=$('#reviewsNext');
  function reviewNav(){const cards=[...grid.children],width=cards[0]?.getBoundingClientRect().width+22||1;const index=Math.round(carousel.scrollLeft/width);const visible=Math.max(1,Math.round((carousel.clientWidth+22)/width));prev.disabled=carousel.scrollLeft<4;next.disabled=carousel.scrollLeft>=carousel.scrollWidth-carousel.clientWidth-4;$('#reviewPosition').textContent='Recensioni '+(index+1)+'–'+Math.min(index+visible,cards.length)+' di '+cards.length;}
  function move(direction){const card=grid.firstElementChild;const step=card.getBoundingClientRect().width+22;const page=Math.max(1,Math.round((carousel.clientWidth+22)/step));carousel.scrollBy({left:direction*step*page,behavior:reduced()?'instant':'smooth'});}
  prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));carousel.addEventListener('scroll',reviewNav,{passive:true});new ResizeObserver(reviewNav).observe(carousel);reviewNav();
  carousel.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}});
  // Only approved training reviews. Existing user-supplied testimonials stay in HTML.
  fetch(backend+'/api/reviews?source=autocad-lessons',{credentials:'omit'}).then(async response=>{if(!response.ok)return;const result=await response.json();if(!result.ok||!Array.isArray(result.reviews))return;const seen=new Set([...grid.children].map(card=>card.querySelector('p').textContent.trim()));for(const review of result.reviews){if(!review.displayName||!review.text||seen.has(review.text.trim()))continue;if(!/^[^\s]+ [\p{L}]\.$/u.test(review.displayName))continue;seen.add(review.text.trim());const card=document.createElement('article');card.className='review-card';const mark=document.createElement('div');mark.className='review-mark';mark.setAttribute('aria-hidden','true');mark.textContent='“';const p=document.createElement('p');p.textContent=review.text;const who=document.createElement('span');who.textContent=review.displayName+' · '+(review.service||'Lezioni AutoCAD');card.append(mark,p,who);grid.append(card);}reviewNav();}).catch(()=>{});
  async function post(path,payload){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18000);try{const response=await fetch(backend+path,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(payload),signal:controller.signal});const result=await response.json().catch(()=>({}));if(!response.ok||result.ok!==true){const error=new Error('Invio non confermato');error.status=response.status;throw error;}return result;}finally{clearTimeout(timer);}}
  function showStatus(node,text,kind){node.textContent=text;node.className='form-status '+kind;node.hidden=false;node.focus({preventScroll:true});}
  const form=$('#lessonForm'),submit=$('#lessonSubmit'),status=$('#formStatus'),newRequest=$('#newRequest');
  let busy=false,submitted=false,requestId=crypto.randomUUID(),started=false,completed=false;
  const filled=()=>form.elements.name.value.trim().length>=2&&form.elements.email.validity.valid&&form.elements.email.value.trim()&&form.elements.privacy.checked;
  form.addEventListener('input',event=>{if(event.target.name==='website')return;if(!started){started=true;track('form_start',{form_id:'lesson_request'});}if(!completed&&filled()){completed=true;track('form_complete',{form_id:'lesson_request'});}});
  if('IntersectionObserver' in window){let viewed=false;const observer=new IntersectionObserver(entries=>{if(!viewed&&entries.some(x=>x.isIntersecting)){viewed=true;track('form_view',{form_id:'lesson_request'});observer.disconnect();}},{threshold:.25});observer.observe(form);}
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||submitted||!form.reportValidity())return;
    if(form.elements.website.value.trim()){showStatus(status,'Invio non disponibile. Contattami via email o WhatsApp.','error');return;}
    busy=true;submit.disabled=true;submit.textContent='Invio in corso…';form.setAttribute('aria-busy','true');
    track('form_submit_attempt',{form_id:'lesson_request'});
    const payload={requestId,name:form.elements.name.value.trim(),email:form.elements.email.value.trim(),message:form.elements.message.value.trim(),privacy:form.elements.privacy.checked,website:'',source:'autocad-lessons'};
    try{const result=await post('/api/lessons',payload);if(result.requestId!==requestId)throw new Error('Conferma non valida');submitted=true;showStatus(status,'Richiesta ricevuta. Ti ricontatterò personalmente per concordare giorno e orario.','success');track('generate_lead',{form_id:'lesson_request',lead_id:result.requestId});submit.textContent='Richiesta inviata ✓';form.reset();newRequest.hidden=false;}
    catch(error){const timeout=error.name==='AbortError';showStatus(status,timeout?'La conferma tarda ad arrivare. Puoi riprovare: la richiesta usa lo stesso identificativo per evitare duplicati. Oppure contattami via email o WhatsApp.':error.status===429?'Hai effettuato diversi tentativi. Attendi prima di riprovare oppure scrivimi su WhatsApp.':'Invio non confermato. I tuoi dati restano nel modulo: riprova oppure contattami via email o WhatsApp.','error');track('form_error',{form_id:'lesson_request',error_type:timeout?'timeout':'submission'});submit.disabled=false;submit.textContent='Riprova l’invio';}
    finally{busy=false;form.removeAttribute('aria-busy');}
  });
  newRequest.addEventListener('click',()=>{submitted=false;started=false;completed=false;requestId=crypto.randomUUID();submit.disabled=false;submit.textContent='Invia la richiesta ↗';status.hidden=true;newRequest.hidden=true;form.elements.name.focus();});
  const reviewForm=$('#reviewForm'),reviewSubmit=$('#reviewSubmit'),reviewStatus=$('#reviewStatus');let reviewBusy=false;
  reviewForm.addEventListener('submit',async event=>{event.preventDefault();if(reviewBusy||!reviewForm.reportValidity())return;const data=new FormData(reviewForm);if(String(data.get('name')).trim().split(/\s+/).length<2){showStatus(reviewStatus,'Inserisci nome e cognome. In pagina comparirà solo il nome con l’iniziale del cognome.','error');return;}reviewBusy=true;reviewSubmit.disabled=true;reviewSubmit.textContent='Invio in corso…';reviewForm.setAttribute('aria-busy','true');try{await post('/api/reviews',{name:String(data.get('name')).trim(),text:String(data.get('text')).trim(),service:String(data.get('service')),website:String(data.get('website')||''),privacy:data.get('privacy')==='1',source:'autocad-lessons'});showStatus(reviewStatus,'Grazie! La recensione è stata ricevuta. Se pubblicata, apparirà nel formato Nome C.','success');reviewForm.reset();reviewSubmit.textContent='Recensione inviata ✓';}catch(error){showStatus(reviewStatus,'Invio non confermato. Riprova oppure scrivimi su WhatsApp.','error');reviewSubmit.disabled=false;reviewSubmit.textContent='Invia recensione';}finally{reviewBusy=false;reviewForm.removeAttribute('aria-busy');}});
  const sticky=$('.mobile-cta');let contactVisible=false,dialogOpen=false,imageOpen=false;const visibleCTAs=new Set();
  const updateSticky=()=>{const hidden=contactVisible||dialogOpen||imageOpen||visibleCTAs.size>0||!!document.activeElement?.closest('input,textarea,select');sticky.classList.toggle('is-hidden',hidden);sticky.inert=hidden;};
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{contactVisible=entries[0].isIntersecting;updateSticky();},{threshold:0}).observe($('#contatti'));
  if('IntersectionObserver'in window){const ctaObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visibleCTAs.add(entry.target);else visibleCTAs.delete(entry.target);}updateSticky();},{threshold:.6});document.querySelectorAll('main a.btn[href="#contatti"]').forEach(el=>ctaObserver.observe(el));}
  document.addEventListener('focusin',updateSticky);document.addEventListener('focusout',()=>setTimeout(updateSticky,0));
  document.addEventListener('ag:consentopen',()=>{dialogOpen=true;updateSticky();});document.addEventListener('ag:consentclose',()=>{dialogOpen=false;updateSticky();});
  document.addEventListener('ag:imageopen',()=>{imageOpen=true;updateSticky();});document.addEventListener('ag:imageclose',()=>{imageOpen=false;updateSticky();});
})();
