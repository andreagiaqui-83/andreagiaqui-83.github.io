(() => {
  'use strict';
  const backend = 'https://cad-bim-preventivi.andrea-giaqui.workers.dev';
  const canonicalOrigin = 'https://andreagiaquinto.it';
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('navLinks');
  if (toggle && nav) {
    document.documentElement.classList.add('js');
    toggle.hidden = false;
    const close = (focusToggle = false) => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Apri menu');
      toggle.textContent = '☰';
      if (focusToggle) toggle.focus();
    };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
      toggle.textContent = open ? '×' : '☰';
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => close()));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) close(true); });
    document.addEventListener('click', e => { if (!nav.contains(e.target) && !toggle.contains(e.target)) close(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1100) close(); });
  }
  document.getElementById('year').textContent = new Date().getFullYear();
  const carousel = document.getElementById('reviewsCarousel');
  const prev = document.getElementById('reviewsPrev');
  const next = document.getElementById('reviewsNext');
  if (carousel && prev && next) {
    prev.hidden = next.hidden = false;
    const update = () => {
      prev.disabled = carousel.scrollLeft < 2;
      next.disabled = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 2;
    };
    const move = direction => {
      const card = carousel.querySelector('.review-card');
      const step = card.getBoundingClientRect().width + 18;
      carousel.scrollBy({ left: direction * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    carousel.addEventListener('scroll', update, { passive: true });
    carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); }
    });
    window.addEventListener('resize', update);
    update();
  }
  const form = document.getElementById('lessonForm');
  const submit = document.getElementById('lessonSubmit');
  const status = document.getElementById('formStatus');
  const fallback = document.getElementById('formFallback');
  const newRequest = document.getElementById('newRequest');
  const nameInput = form.elements.namedItem('name');
  let busy = false;
  let completed = false;
  const values = () => {
    const data = new FormData(form);
    const get = key => String(data.get(key) || '').trim();
    return {
      Tipo_richiesta: 'LEZIONI AUTOCAD ONLINE — informazioni / prima lezione gratuita di 30 minuti',
      Pagina_origine: canonicalOrigin + '/lezioni-autocad/',
      Modalita_lezioni: 'Online in videoconferenza con condivisione dello schermo',
      Tariffa_lezioni: 'Prima lezione di 30 minuti gratuita; lezioni successive 15 euro/ora',
      Nome_cognome: get('name'), email: get('email'), Telefono_WhatsApp: get('phone'),
      Profilo: get('profile'), Corso_di_studi_settore: get('study'), Livello_AutoCAD: get('level'),
      Percorso_richiesto: get('path'), Obiettivo_lezioni: get('goal'), Messaggio: get('message'),
      Consenso_privacy: get('privacy') === '1' ? 'Informativa letta; richiesta di essere ricontattato per lezioni AutoCAD online.' : ''
    };
  };
  const showStatus = (message, kind) => {
    status.textContent = message;
    status.className = 'status ' + kind;
    status.hidden = false;
    status.focus({ preventScroll: true });
    const rect = status.getBoundingClientRect();
    if (rect.top < 90 || rect.bottom > innerHeight - 70) status.scrollIntoView({ block: 'center', behavior: 'auto' });
  };
  const buildFallback = () => {
    const data = values();
    const labels = { Nome_cognome: 'Nome', email: 'Email', Telefono_WhatsApp: 'Telefono / WhatsApp', Profilo: 'Profilo', Corso_di_studi_settore: 'Corso di studi / settore', Livello_AutoCAD: 'Livello AutoCAD', Percorso_richiesto: 'Percorso richiesto', Obiettivo_lezioni: 'Obiettivo', Messaggio: 'Messaggio' };
    const text = 'Ciao Andrea, vorrei informazioni sulle lezioni AutoCAD online e sulla prima lezione gratuita di 30 minuti (poi 15 euro/ora).\n\n' + Object.entries(labels).filter(([key]) => data[key]).map(([key, label]) => label + ': ' + data[key]).join('\n');
    document.getElementById('fallbackWhatsapp').href = 'https://wa.me/393337240544?text=' + encodeURIComponent(text);
    document.getElementById('fallbackEmail').href = 'mailto:andrea.giaqui@gmail.com?subject=' + encodeURIComponent('Lezioni AutoCAD online — richiesta informazioni') + '&body=' + encodeURIComponent(text);
    fallback.hidden = false;
  };
  const api = async (path, body) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const options = { method: 'POST', credentials: 'omit', cache: 'no-store', signal: controller.signal };
      if (body !== undefined) { options.headers = { 'Content-Type': 'application/json' }; options.body = JSON.stringify(body); }
      const response = await fetch(backend + path, options);
      let data;
      try { data = await response.json(); } catch (_) { throw new Error('Risposta non riconosciuta'); }
      if (!response.ok || data?.ok !== true) throw new Error('Invio non confermato');
      return data;
    } finally { clearTimeout(timeout); }
  };
  nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
  form.addEventListener('input', () => { if (!fallback.hidden) buildFallback(); });
  newRequest.addEventListener('click', () => {
    completed = false; submit.disabled = false; submit.textContent = 'Invia richiesta →';
    status.hidden = true; fallback.hidden = true; newRequest.hidden = true; nameInput.focus();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || completed) return;
    nameInput.setCustomValidity(nameInput.value.trim().length >= 2 ? '' : 'Inserisci un nome di almeno due caratteri.');
    if (!form.reportValidity()) return;
    if (String(form.elements.namedItem('website').value || '').trim()) { showStatus('Controlla i dati inseriti e riprova.', 'error'); return; }
    if (location.origin !== canonicalOrigin) {
      showStatus('Questa è un’anteprima. L’invio diretto funziona dalla pagina pubblicata su andreagiaquinto.it. Puoi comunque usare WhatsApp o email.', 'error'); buildFallback(); return;
    }
    busy = true; submit.disabled = true; submit.textContent = 'Invio in corso…'; fallback.hidden = true;
    form.setAttribute('aria-busy', 'true');
    showStatus('Invio della richiesta in corso…', 'progress');
    let submitAttempted = false;
    try {
      const fields = values();
      const session = await api('/api/session');
      if (typeof session.sessionId !== 'string' || !session.sessionId || typeof session.token !== 'string' || !session.token) throw new Error('Sessione non valida');
      submitAttempted = true;
      await api('/api/submit', { sessionId: session.sessionId, token: session.token, fields });
      completed = true;
      showStatus('Il servizio ha accettato la tua richiesta. Grazie! Andrea ti ricontatterà per concordare il percorso o la prima lezione gratuita. Non è necessario inviare di nuovo.', 'success');
      form.reset(); submit.textContent = 'Richiesta inviata ✓'; newRequest.hidden = false;
    } catch (_) {
      showStatus(submitAttempted ? 'Non è stato possibile confermare l’esito: la richiesta potrebbe essere già arrivata. I dati sono ancora nel modulo. Puoi contattare Andrea su WhatsApp o via email; un nuovo invio potrebbe generare un duplicato.' : 'Il collegamento al servizio non è riuscito. I dati sono ancora nel modulo: riprova oppure usa WhatsApp o email.', 'error');
      buildFallback(); submit.textContent = 'Riprova l’invio →';
    } finally { busy = false; submit.disabled = completed; form.removeAttribute('aria-busy'); }
  });
  submit.disabled = false;
})();