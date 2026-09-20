(() => {
  'use strict';
  if (window.AGTracking) return;
  const cfg = window.AG_MEASUREMENT || {};
  const ga4 = /^G-[A-Z0-9]+$/.test(cfg.ga4Id || '') ? cfg.ga4Id : '';
  const ads = /^AW-\d+$/.test(cfg.adsId || '') ? cfg.adsId : '';
  // Services import GA4 key events into Ads; this needs advertising consent
  // even without a separate AW tag. Other pages keep their existing behavior.
  const importConsent = !!ga4 && cfg.conversionMode === 'ga4_import' && document.body.dataset.pageType === 'services';
  const marketingEnabled = !!ads || importConsent;
  const key = 'ag_cookie_preferences';
  const denied = {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'};
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  // Basic Consent Mode v2: no external Google script/request before opt-in.
  gtag('consent', 'default', denied);
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', false);
  let choice = {analytics:false, marketing:false}, loaded = false, configuredGA = false, configuredAds = false;
  const sent = new Set();
  function readChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      if (value?.version === cfg.consentVersion && value.expires > Date.now()) return {analytics:value.analytics === true, marketing:value.marketing === true && marketingEnabled};
    } catch (_) {}
    return null;
  }
  function cleanLocation() {
    const url = new URL(location.href), clean = new URL(url.origin + url.pathname);
    if (choice.analytics) for (const name of ['utm_source','utm_medium','utm_campaign','utm_id','utm_term','utm_content']) {
      const value = url.searchParams.get(name);
      if (value && /^[a-zA-Z0-9_. -]{1,100}$/.test(value)) clean.searchParams.set(name,value);
    }
    if (choice.marketing) for (const name of ['gclid','gbraid','wbraid']) {
      const value = url.searchParams.get(name);
      if (value && /^[a-zA-Z0-9_-]{1,200}$/.test(value)) clean.searchParams.set(name,value);
    }
    return clean.href;
  }
  function referrerOrigin() {try {return document.referrer ? new URL(document.referrer).origin : '';} catch (_) {return '';}}
  function configure() {
    const target = choice.analytics && ga4 ? ga4 : choice.marketing && ads ? ads : '';
    if (!target) return;
    if (!loaded) {
      loaded = true;
      gtag('js',new Date());
      const script = document.createElement('script'); script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(target);
      script.dataset.agMeasurement = 'true'; document.head.append(script);
    }
    if (choice.analytics && ga4 && !configuredGA) {
      configuredGA = true;
      gtag('config',ga4,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_flags:'SameSite=Lax;Secure',cookie_expires:60*60*24*180,page_location:cleanLocation(),page_referrer:referrerOrigin()});
      track('page_view',{});
    }
    if (choice.marketing && ads && !configuredAds) {
      configuredAds = true;
      gtag('config',ads,{send_page_view:false,allow_ad_personalization_signals:false,page_location:cleanLocation(),page_referrer:referrerOrigin()});
    }
  }
  function updateConsent() {
    gtag('consent','update',{analytics_storage:choice.analytics?'granted':'denied',ad_storage:choice.marketing?'granted':'denied',ad_user_data:choice.marketing?'granted':'denied',ad_personalization:'denied'});
  }
  function purgeCookies() {
    const hosts = [location.hostname, '.'+location.hostname, 'andreagiaquinto.it', '.andreagiaquinto.it'];
    for (const entry of document.cookie.split(';')) {
      const name = entry.trim().split('=')[0];
      if (/^(_ga|_gid|_gat|_gcl)/.test(name)) {
        document.cookie = name+'=; Max-Age=0; path=/; SameSite=Lax; Secure';
        for (const host of hosts) document.cookie = name+'=; Max-Age=0; path=/; domain='+host+'; SameSite=Lax; Secure';
      }
    }
  }
  function save(next) {
    const revoked = (choice.analytics && !next.analytics) || (choice.marketing && !next.marketing);
    choice = {analytics:next.analytics === true && !!ga4,marketing:next.marketing === true && marketingEnabled};
    updateConsent();
    try {localStorage.setItem(key,JSON.stringify({...choice,version:cfg.consentVersion,updated:Date.now(),expires:Date.now()+ (cfg.consentMaxAgeDays || 180)*86400000}));} catch (_) {}
    if (revoked) {
      if (ga4) window['ga-disable-'+ga4] = !choice.analytics;
      purgeCookies();
      // Drop the loaded tag runtime after withdrawal; the saved denied state is restored.
      location.reload(); return;
    }
    configure();
    document.dispatchEvent(new CustomEvent('ag:consentchange',{detail:{...choice}}));
  }
  const allowedEvents = new Set(['page_view','cta_click','contact_click','form_view','form_start','form_complete','form_submit_attempt','form_error','generate_lead','service_quote_success','scroll_depth']);
  function track(name,values={}) {
    if (!allowedEvents.has(name)) return;
    if (name === 'service_quote_success' && document.body.dataset.pageType !== 'services') return;
    const safe={page_type:document.body.dataset.pageType || 'site',page_location:cleanLocation(),page_referrer:referrerOrigin()};
    // Never pass form values, full URLs, names, email, telephone, or free text to Google.
    for (const field of ['cta_id','contact_method','form_id','error_type']) if (/^[a-z0-9_-]{1,60}$/.test(values[field]||'')) safe[field]=values[field];
    if ([50,90].includes(values.percent_scrolled)) safe.percent_scrolled=values.percent_scrolled;
    const isLead = name === 'generate_lead' || name === 'service_quote_success';
    if (isLead) {
      if (!/^[a-f0-9-]{36}$/i.test(values.lead_id || '') || sent.has(values.lead_id)) return;
      sent.add(values.lead_id);
    }
    if (choice.analytics && ga4 && configuredGA) gtag('event',name,{...safe,send_to:ga4});
    if (isLead && choice.marketing && ads && configuredAds && cfg.conversionMode === 'direct' && /^[a-zA-Z0-9_-]+$/.test(cfg.adsLeadLabel||'')) {
      gtag('event','conversion',{send_to:ads+'/'+cfg.adsLeadLabel,transaction_id:values.lead_id,page_location:cleanLocation()});
    }
  }
  window.AGTracking = Object.freeze({track,getConsent:()=>({...choice}),isConfigured:()=>!!(ga4||ads)});
  function makeDialog() {
    const dialog = document.createElement('dialog'); dialog.className='ag-consent'; dialog.setAttribute('aria-labelledby','ag-consent-title');
    dialog.innerHTML='<h2 id="ag-consent-title">Le tue preferenze cookie</h2><p>Il sito funziona anche senza cookie statistici o pubblicitari. Puoi cambiare scelta in qualsiasi momento dal link a fondo pagina.</p><div class="ag-consent-options"><label><input type="checkbox" checked disabled> Necessari <small>Funzioni del sito e memorizzazione delle preferenze.</small></label><label><input id="ag-analytics" type="checkbox"> Statistiche <small>Misurazione delle visite e dell’utilizzo con Google Analytics.</small></label><label><input id="ag-marketing" type="checkbox"> Misurazione pubblicitaria <small>Attribuzione delle richieste alle campagne Google Ads. Nessuna personalizzazione pubblicitaria.</small></label></div><p class="ag-consent-inactive" hidden>Nessun servizio Google di misurazione è attualmente attivo.</p><a href="/privacy/">Leggi l’informativa privacy e cookie</a><div class="ag-consent-actions"><button type="button" data-choice="reject">Rifiuta facoltativi</button><button type="button" data-choice="all">Accetta tutti</button><button type="button" data-choice="save">Salva preferenze</button></div><button type="button" class="ag-consent-close" aria-label="Chiudi senza accettare">Chiudi</button>';
    document.body.append(dialog);
    const analytics=dialog.querySelector('#ag-analytics'),marketing=dialog.querySelector('#ag-marketing');
    analytics.disabled=!ga4;marketing.disabled=!marketingEnabled;
    if(importConsent)marketing.parentElement.querySelector('small').textContent += ' Richiede anche il consenso alle statistiche.';
    dialog.querySelector('.ag-consent-inactive').hidden=!!(ga4||ads);
    function close() {dialog.close();document.dispatchEvent(new Event('ag:consentclose'));}
    function open() {analytics.checked=choice.analytics;marketing.checked=choice.marketing;dialog.showModal();document.dispatchEvent(new Event('ag:consentopen'));}
    dialog.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
      const action=button.dataset.choice;
      save(action==='all'?{analytics:true,marketing:true}:action==='reject'?{analytics:false,marketing:false}:{analytics:analytics.checked,marketing:marketing.checked});close();
    }));
    dialog.querySelector('.ag-consent-close').addEventListener('click',()=>{if(!readChoice()) save({analytics:false,marketing:false});close();});
    dialog.addEventListener('cancel',event=>{event.preventDefault();if(!readChoice()) save({analytics:false,marketing:false});close();});
    document.querySelectorAll('[data-consent-open]').forEach(button=>button.addEventListener('click',open));
    return open;
  }
  const previous=readChoice();if(previous){choice=previous;updateConsent();configure();}
  const openConsent=makeDialog();if(!previous&&(ga4||ads))openConsent();
  document.addEventListener('click',event=>{
    const anchor=event.target.closest('a');if(!anchor)return;
    if(anchor.dataset.cta)track('cta_click',{cta_id:anchor.dataset.cta});
    const href=anchor.getAttribute('href')||'';
    const method=href.startsWith('tel:')?'phone':href.startsWith('mailto:')?'email':/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)?'whatsapp':'';
    if(method)track('contact_click',{contact_method:method});
  });
  const scrolls=new Set();let scheduled=false;
  addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;const max=document.documentElement.scrollHeight-innerHeight;if(max<=0)return;const depth=scrollY/max*100;for(const percent of [50,90])if(depth>=percent&&!scrolls.has(percent)&&choice.analytics){scrolls.add(percent);track('scroll_depth',{percent_scrolled:percent});}});},{passive:true});
})();
