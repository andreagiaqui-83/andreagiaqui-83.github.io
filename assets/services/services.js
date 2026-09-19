/* Services UI and quote upload. Content and schema are authored in HTML. */
(() => {
  'use strict';
  const backend = 'https://cad-bim-preventivi.andrea-giaqui.workers.dev';
  const MAX_FILE = 90 * 1024 * 1024, MAX_TOTAL = 500 * 1024 * 1024;
  const POINT_CLOUD_AVAILABLE = false;
  const unsupported = file => !POINT_CLOUD_AVAILABLE && /\.(las|laz|e57|rcp|rcs)$/i.test(file.name);
  const track = (event, values = {}) => window.AGTracking?.track(event, {form_id:'service_quote', ...values});
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollTo = element => element?.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'center'});
  const menu = document.querySelector('.menu-toggle'), nav = document.getElementById('navLinks');
  const closeMenu = () => { menu?.setAttribute('aria-expanded','false'); nav?.classList.remove('is-open'); };
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
  nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
  matchMedia('(min-width:901px)').addEventListener('change',closeMenu);
  document.querySelectorAll('a[href*="facebook.com/disegnatoreautocadonline"]').forEach(a=>a.addEventListener('click',()=>track('cta_click',{cta_id:'facebook_click'})));
  const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
  const form=document.getElementById('quoteForm');
  if(!form)return;
  const submit=document.getElementById('quoteSubmit'),notice=document.getElementById('fileWarning'),success=document.getElementById('grazie');
  const progress=document.getElementById('uploadProgress'),cloud=form.elements.Link_cloud_materiale_completo;
  const interior=document.getElementById('interiorSelected'),panel=document.getElementById('interiorPreferences'),custom=document.getElementById('interiorCustom');
  const updateInterior=()=>{panel.hidden=!interior.checked;interior.setAttribute('aria-expanded',String(interior.checked));custom.disabled=!interior.checked;};
  interior.addEventListener('change',()=>{updateInterior();if(interior.checked)track('cta_click',{cta_id:'interior_design_selected'});});updateInterior();
  document.querySelectorAll('[data-service]').forEach(a=>a.addEventListener('click',()=>{
    const check=[...form.querySelectorAll('[name="Output[]"]')].find(x=>x.value===a.dataset.service);
    if(check && !check.checked){check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));}
  }));
  let started=false, formSeen=false, sending=false, submitted=false, currentSession=null;
  const markStart=()=>{if(!started){started=true;track('form_start');}};
  form.addEventListener('input',markStart,{passive:true});
  form.addEventListener('change',markStart,{passive:true});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!formSeen){formSeen=true;track('form_view');}},{threshold:.1}).observe(form);
  const setNotice=(text='',type='info',focus=false)=>{notice.textContent=text;notice.className='notice notice-'+type;notice.hidden=!text;if(focus){notice.focus();scrollTo(notice);}};
  const files=new Map([...form.querySelectorAll('input[type=file]')].map(input=>[input,[]]));
  const fileKey=file=>[file.name,file.size,file.lastModified,file.type].join('|');
  const allFiles=()=>[...files.entries()].flatMap(([input,list])=>list.map(file=>({input,file})));
  const total=()=>allFiles().reduce((sum,x)=>sum+x.file.size,0);
  const needsCloud=()=>allFiles().some(x=>x.file.size>MAX_FILE)||total()>MAX_TOTAL;
  const bytes=value=>value>=1024*1024?(value/1024/1024).toFixed(1)+' MB':Math.max(1,Math.round(value/1024))+' KB';
  const updateLimits=()=>{
    const over=needsCloud();cloud.required=over;
    if(over)setNotice('Il materiale supera 90 MB per file o 500 MB complessivi. Inserisci un link cloud a tutti gli allegati: invierò il collegamento senza caricare direttamente questi file.');
    else if(!sending)setNotice();
  };
  const renderFiles=input=>{
    const box=input.closest('.file-dropzone').querySelector('.selected-files');box.replaceChildren();
    (files.get(input)||[]).forEach(file=>{
      const row=document.createElement('div');row.className='selected-file';
      const meta=document.createElement('div');meta.className='file-meta';
      const name=document.createElement('strong');name.textContent=file.name;
      const size=document.createElement('small');size.textContent=bytes(file.size);
      const remove=document.createElement('button');remove.type='button';remove.className='remove-file';remove.textContent='×';remove.setAttribute('aria-label','Rimuovi '+file.name);remove.disabled=sending;
      remove.addEventListener('click',()=>{files.set(input,files.get(input).filter(x=>x!==file));renderFiles(input);updateLimits();input.focus();});
      meta.append(name,size);row.append(meta,remove);box.append(row);
    });
  };
  const addFiles=(input,incoming)=>{
    if(sending)return;
    const list=[...files.get(input)],keys=new Set(list.map(fileKey));let rejected=false,empty=false;
    for(const file of incoming){if(unsupported(file)){rejected=true;continue;}if(!file.size){empty=true;continue;}if(!keys.has(fileKey(file))){list.push(file);keys.add(fileKey(file));}}
    files.set(input,list);input.value='';renderFiles(input);updateLimits();markStart();
    track('cta_click',{cta_id:'file_upload_interaction'});
    if(rejected)setNotice('I file di nuvole di punti non sono accettati: il servizio è attualmente non disponibile. Gli altri allegati restano selezionati.','warning');
    else if(empty)setNotice('Un file vuoto non è stato aggiunto. Controlla il file e selezionalo di nuovo.','warning');
  };
  for(const input of files.keys()){
    input.addEventListener('change',()=>addFiles(input,[...input.files]));
    const zone=input.closest('.file-dropzone');
    for(const event of ['dragenter','dragover'])zone.addEventListener(event,e=>{e.preventDefault();if(!sending)zone.classList.add('is-dragover');});
    for(const event of ['dragleave','drop'])zone.addEventListener(event,e=>{e.preventDefault();zone.classList.remove('is-dragover');});
    zone.addEventListener('drop',e=>addFiles(input,[...(e.dataTransfer?.files||[])]));
  }
  const validate=()=>{
    form.querySelectorAll('[aria-invalid]').forEach(x=>x.removeAttribute('aria-invalid'));
    const outputs=[...form.querySelectorAll('[name="Output[]"]')];
    if(!outputs.some(x=>x.checked)){setNotice('Seleziona almeno un servizio, oppure “Altro / da valutare”.','warning');outputs[0].focus();return false;}
    const phone=form.elements.Telefono_WhatsApp;
    phone.required=['WhatsApp','Telefono'].includes(form.elements.Contatto_preferito.value);
    cloud.required=needsCloud();
    if(!form.checkValidity()){
      const invalid=form.querySelector(':invalid');invalid?.setAttribute('aria-invalid','true');
      const details=invalid?.closest('details');if(details)details.open=true;
      setNotice(invalid===phone?'Inserisci un recapito per essere contattato tramite telefono o WhatsApp.':invalid===cloud?'Inserisci il link cloud al materiale completo.':'Controlla i campi obbligatori e la presa visione dell’informativa privacy.','warning');
      form.reportValidity();return false;
    }
    for(const input of form.querySelectorAll('input[type=url]:not(:disabled)')){
      if(input.value && !/^https?:\/\//i.test(input.value)){input.setAttribute('aria-invalid','true');input.closest('details')?.setAttribute('open','');setNotice('Inserisci un collegamento che inizi con https:// o http://.','warning');input.focus();return false;}
    }
    return true;
  };
  form.elements.Contatto_preferito.addEventListener('change',()=>{form.elements.Telefono_WhatsApp.required=['WhatsApp','Telefono'].includes(form.elements.Contatto_preferito.value);});
  const fields=()=>{
    const result={};
    for(const [key,value] of new FormData(form)){
      if(value instanceof File || key.startsWith('_'))continue;
      if(key==='Nuvola_di_punti_link_cloud' && !POINT_CLOUD_AVAILABLE)continue;
      if(result[key]===undefined)result[key]=value;else result[key]=[].concat(result[key],value);
    }
    return result;
  };
  const api=async(path,options={})=>{
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),45000);
    try{
      const response=await fetch(backend+path,{...options,signal:controller.signal});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||payload.ok!==true){const error=new Error(payload.error||'Il server non ha confermato la richiesta.');error.status=response.status;throw error;}
      return payload;
    }finally{clearTimeout(timeout);}
  };
  const upload=(session,input,file,completedBytes,totalBytes)=>new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();xhr.open('PUT',backend+'/api/upload/'+encodeURIComponent(session.sessionId));xhr.timeout=180000;
    xhr.setRequestHeader('X-Session-Token',session.token);xhr.setRequestHeader('X-File-Name',encodeURIComponent(file.name));xhr.setRequestHeader('X-Field-Name',input.name);xhr.setRequestHeader('X-File-Size',String(file.size));xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');
    xhr.upload.onprogress=e=>{if(e.lengthComputable)progress.value=Math.min(100,Math.round((completedBytes+e.loaded)/totalBytes*100));};
    xhr.onload=()=>{let data={};try{data=JSON.parse(xhr.responseText);}catch(_){}if(xhr.status>=200&&xhr.status<300&&data.ok===true)resolve(data);else reject(new Error(data.error||'Caricamento non riuscito.'));};
    xhr.onerror=()=>reject(new Error('Connessione interrotta durante il caricamento.'));
    xhr.ontimeout=()=>reject(new Error('Il caricamento richiede troppo tempo. Puoi usare il link cloud.'));
    xhr.send(file);
  });
  const lock=locked=>{
    form.setAttribute('aria-busy',String(locked));
    form.querySelectorAll('input,textarea,select,button').forEach(x=>{if(locked){x.dataset.wasDisabled=String(x.disabled);x.disabled=true;}else{x.disabled=x.dataset.wasDisabled==='true';delete x.dataset.wasDisabled;}});
    if(!locked){submit.disabled=submitted;updateInterior();}
  };
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(sending||submitted)return;
    if(form.elements._honey.value.trim()){setNotice('Non è stato possibile validare la richiesta. Contattami direttamente.','error',true);return;}
    if(!validate()){track('form_error',{error_type:'validation'});return;}
    const data=fields(),items=allFiles(),useCloud=needsCloud();
    if(useCloud)data.Modalita_materiale='Materiale completo tramite link cloud';
    const signature=JSON.stringify(items.map(x=>[x.input.name,fileKey(x.file)]))+String(useCloud);
    if(currentSession?.signature!==signature)currentSession=null;
    sending=true;track('form_submit_attempt');lock(true);setNotice('Preparazione della richiesta…');submit.textContent='Preparazione invio…';
    try{
      if(!currentSession){const result=await api('/api/session',{method:'POST'});if(!result.sessionId||!result.token)throw new Error('Sessione di caricamento non valida.');currentSession={...result,signature,uploaded:new Set()};}
      if(!useCloud && items.length){
        progress.hidden=false;let completed=0;
        for(let i=0;i<items.length;i++){
          const {input,file}=items[i],key=input.name+'|'+fileKey(file);
          submit.textContent=`Caricamento ${i+1} di ${items.length}…`;setNotice(`Caricamento allegato ${i+1} di ${items.length}. Attendi la conferma prima di chiudere la pagina.`);
          if(!currentSession.uploaded.has(key)){await upload(currentSession,input,file,completed,total());currentSession.uploaded.add(key);}
          completed+=file.size;progress.value=Math.round(completed/total()*100);
        }
      }
      submit.textContent='Invio richiesta…';setNotice('Invio della richiesta in corso…');
      await api('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:currentSession.sessionId,token:currentSession.token,fields:data,website:''})});
      submitted=true;setNotice();success.hidden=false;
      track('form_complete');track('generate_lead',{lead_id:currentSession.sessionId});
      form.reset();for(const input of files.keys()){files.set(input,[]);renderFiles(input);}cloud.required=false;
      success.focus();scrollTo(success);
    }catch(error){
      if(error.status===401||error.status===404||error.status===409)currentSession=null;
      track('form_error',{error_type:error.name==='AbortError'?'timeout':'network_or_server'});
      setNotice('Invio non completato. I dati e gli allegati sono ancora nel modulo: puoi riprovare o contattarmi direttamente. '+(error.name==='AbortError'?'La connessione ha impiegato troppo tempo.':error.message),'error',true);
      const links=document.createElement('div');links.className='submit-fallback';links.innerHTML='<a href="mailto:andrea.giaqui@gmail.com">Scrivimi via email</a><a href="https://wa.me/393337240544" target="_blank" rel="noopener noreferrer">Contattami su WhatsApp</a>';notice.append(links);
    }finally{sending=false;lock(false);progress.hidden=true;submit.textContent=submitted?'Richiesta inviata':'Richiedi preventivo gratuito ↗';}
  });
  document.getElementById('newQuote').addEventListener('click',()=>{submitted=false;started=false;currentSession=null;success.hidden=true;submit.disabled=false;submit.textContent='Richiedi preventivo gratuito ↗';form.querySelector('[name="Output[]"]').focus();scrollTo(form);});
  submit.disabled=false;
  const wa=document.getElementById('whatsappQuickContact');let consentOpen=false,quoteVisible=false;
  const updateWA=()=>{const editing=form.contains(document.activeElement);wa?.classList.toggle('is-obscured',consentOpen||((quoteVisible||editing)&&matchMedia('(max-width:767px)').matches));};
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{quoteVisible=entries.some(x=>x.isIntersecting);updateWA();},{threshold:0}).observe(form);
  document.addEventListener('focusin',updateWA);document.addEventListener('focusout',()=>setTimeout(updateWA,0));
  document.addEventListener('ag:consentopen',()=>{consentOpen=true;updateWA();});document.addEventListener('ag:consentclose',()=>{consentOpen=false;updateWA();});
  consentOpen=!!document.querySelector('.ag-consent[open]');updateWA();
  const reviewForm=document.getElementById('reviewForm'),reviewStatus=document.getElementById('reviewStatus'),grid=document.getElementById('reviewsGrid');
  const addReview=review=>{const card=document.createElement('article');card.className='review-card';const mark=document.createElement('div');mark.className='review-mark';mark.textContent='“';mark.setAttribute('aria-hidden','true');const text=document.createElement('p');text.textContent=review.text||'';const meta=document.createElement('span');meta.textContent=[review.displayName||'Cliente',review.service||'Recensione cliente'].join(' · ');card.append(mark,text,meta);grid.append(card);};
  fetch(backend+'/api/reviews?source=cad-services').then(r=>r.ok?r.json():{}).then(data=>{const seen=new Set([...grid.children].map(x=>x.querySelector('p')?.textContent.trim()));for(const r of (data.reviews||[]).slice().reverse())if(r.source!=='autocad-lessons' && !seen.has((r.text||'').trim())){addReview(r);seen.add((r.text||'').trim());}}).catch(()=>{});
  reviewForm?.addEventListener('submit',async e=>{
    e.preventDefault();if(!reviewForm.reportValidity())return;
    const button=reviewForm.querySelector('[type=submit]');if(button.disabled)return;
    const fd=new FormData(reviewForm),payload={name:String(fd.get('name')||'').trim(),service:String(fd.get('service')||'').trim(),text:String(fd.get('text')||'').trim(),website:String(fd.get('website')||'').trim(),privacy:true,source:'cad-services'};
    button.disabled=true;reviewStatus.textContent='Invio alla moderazione…';
    try{await api('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});reviewForm.reset();reviewStatus.className='review-status is-success';reviewStatus.textContent='Grazie. La recensione sarà pubblicata dopo l’approvazione.';}catch(error){reviewStatus.className='review-status is-error';reviewStatus.textContent=error.name==='AbortError'?'Invio non confermato. Riprova più tardi.':error.message;}finally{button.disabled=false;}
  });
})();
