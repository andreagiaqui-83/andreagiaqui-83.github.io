(() => {
  const backendBase = 'https://cad-bim-preventivi.andrea-giaqui.workers.dev';
  const maxFileBytes = 90 * 1024 * 1024;
  const maxTotalBytes = 500 * 1024 * 1024;

  document.title = 'Disegnatore AutoCAD 2D/3D, Revit BIM e Disegno Meccanico | Preventivo Gratuito';
  document.querySelectorAll('a[href*="facebook.com/disegnatoreautocadonline"]').forEach(link => {
    if (link.closest('footer')) link.textContent = 'Facebook · Disegnatore AutoCAD e Revit';
  });

  const form = document.getElementById('quoteForm');
  if (!form) return;

  const warning = document.getElementById('fileWarning');
  const success = document.getElementById('grazie');
  const submitButton = form.querySelector('button[type="submit"]');
  const fileInputs = [...form.querySelectorAll('input[type="file"]')];

  // Il backend è gestito dal Worker Cloudflare: impedisce qualunque fallback nativo verso FormSubmit.
  form.removeAttribute('action');
  form.removeAttribute('enctype');

  const photoInput = form.querySelector('input[name="Foto_immagini_fabbricato[]"]');
  if (photoInput) {
    const label = photoInput.closest('label');
    label?.classList.add('upload-label', 'photo-upload-label');
    const help = label?.querySelector('small');
    if (help) help.textContent = 'Esterni, interni, viste dall’alto, dettagli costruttivi o altre immagini utili, in qualsiasi formato immagine.';
  }

  const mechanicalInput = form.querySelector('input[name="Disegni_meccanici[]"]');
  if (mechanicalInput) {
    mechanicalInput.removeAttribute('accept');
    const label = mechanicalInput.closest('label');
    label?.classList.add('upload-label', 'mechanical-upload-label');
    const help = label?.querySelector('small');
    if (help) help.textContent = 'Schizzi a mano, fotografie, immagini, PDF, scansioni, DWG/DXF, quote, particolari, assiemi o qualsiasi altro riferimento utile, in qualsiasi formato.';
  }

  const docsInput = form.querySelector('input[name="Disegni_documentazione[]"]');
  if (docsInput) {
    docsInput.removeAttribute('accept');
    const label = docsInput.closest('label');
    label?.classList.add('upload-label', 'docs-upload-label');
    const help = label?.querySelector('small');
    if (help) help.textContent = 'PDF, scansioni, immagini, DWG/DXF, file Revit, IFC, PLY, OBJ e altra documentazione tecnica, in qualsiasi formato.';
  }

  const micro = form.querySelector('.micro');
  if (micro) {
    micro.textContent = 'Gli allegati possono essere caricati direttamente fino a 90 MB per singolo file e 500 MB complessivi. Per materiale più grande puoi usare un link cloud oppure inviarlo via email o WhatsApp/Telegram.';
  }

  // Ogni pulsante Sfoglia è additivo: nuove selezioni si sommano sempre alle precedenti.
  fileInputs.forEach(input => input.setAttribute('multiple', ''));

  const fileStore = new Map();
  fileInputs.forEach(input => fileStore.set(input, []));

  const fileKey = file => `${file.name}__${file.size}__${file.lastModified}__${file.type}`;
  const formatBytes = bytes => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const syncNativeInput = input => {
    try {
      const dt = new DataTransfer();
      (fileStore.get(input) || []).forEach(file => dt.items.add(file));
      input.files = dt.files;
    } catch (_) {
      // Lo store JavaScript resta comunque la fonte autorevole dei file selezionati.
    }
  };

  const allFiles = () => [...fileStore.entries()].flatMap(([input, files]) =>
    files.map(file => ({ input, file }))
  );
  const fileTotal = () => allFiles().reduce((sum, item) => sum + item.file.size, 0);
  const hasOversizeFile = () => allFiles().some(item => item.file.size > maxFileBytes);

  const setNotice = (message = '', type = 'warning') => {
    if (!warning) return;
    warning.hidden = !message;
    warning.className = message ? `notice notice-${type}` : 'notice';
    warning.textContent = message;
  };

  const addFallbackContacts = () => {
    if (!warning || warning.querySelector('.submit-fallback')) return;
    const fallback = document.createElement('div');
    fallback.className = 'submit-fallback';
    fallback.innerHTML = '<a href="mailto:andrea.giaqui@gmail.com">Invia email a andrea.giaqui@gmail.com</a><a href="https://wa.me/393337240544" target="_blank" rel="noopener">WhatsApp / Telegram: +39 333 724 0544</a>';
    warning.appendChild(fallback);
  };

  let cloudBox = null;
  let cloudInput = null;
  if (warning) {
    cloudBox = document.createElement('div');
    cloudBox.className = 'cloud-upload-box';
    cloudBox.hidden = true;
    cloudBox.innerHTML = `
      <div class="cloud-upload-head"><strong>Materiale oltre i limiti di caricamento diretto</strong><span>Carica tutti i file su un servizio cloud e incolla qui sotto il link condiviso.</span></div>
      <div class="cloud-services" aria-label="Servizi cloud suggeriti">
        <a href="https://drive.google.com/" target="_blank" rel="noopener">Google Drive</a>
        <a href="https://www.dropbox.com/" target="_blank" rel="noopener">Dropbox</a>
        <a href="https://onedrive.live.com/" target="_blank" rel="noopener">OneDrive</a>
        <a href="https://wetransfer.com/" target="_blank" rel="noopener">WeTransfer</a>
      </div>
      <label>Link cloud al materiale completo<input type="url" name="Link_cloud_materiale_completo" placeholder="https://..." inputmode="url"></label>
      <small>Assicurati che il collegamento sia accessibile a chi possiede il link. In alternativa puoi inviare il materiale a andrea.giaqui@gmail.com oppure via WhatsApp/Telegram al +39 333 724 0544.</small>`;
    warning.insertAdjacentElement('beforebegin', cloudBox);
    cloudInput = cloudBox.querySelector('input[name="Link_cloud_materiale_completo"]');
  }

  const directUploadAllowed = () => !hasOversizeFile() && fileTotal() <= maxTotalBytes;

  const updateCloudFallback = () => {
    const total = fileTotal();
    const oversize = hasOversizeFile();
    const overTotal = total > maxTotalBytes;
    const needsCloud = oversize || overTotal;

    if (cloudBox) cloudBox.hidden = !needsCloud;
    if (cloudInput) cloudInput.required = needsCloud;

    if (needsCloud) {
      const reason = oversize
        ? 'Almeno un file supera 90 MB'
        : `Gli allegati selezionati pesano ${formatBytes(total)} e superano 500 MB complessivi`;
      setNotice(`${reason}. Carica il materiale su un cloud e incolla il link condiviso, oppure invialo a andrea.giaqui@gmail.com / WhatsApp-Telegram +39 333 724 0544.`, 'info');
    } else {
      if (cloudInput) {
        cloudInput.required = false;
        cloudInput.value = '';
      }
      setNotice();
    }
    return !needsCloud || Boolean(cloudInput?.value.trim());
  };

  const ensureSelectedContainer = input => {
    let selected = input.parentElement?.querySelector('.selected-files');
    if (!selected) {
      selected = document.createElement('div');
      selected.className = 'selected-files';
      selected.setAttribute('aria-live', 'polite');
      input.insertAdjacentElement('afterend', selected);
    }
    return selected;
  };

  const renderFiles = input => {
    const selected = ensureSelectedContainer(input);
    const files = fileStore.get(input) || [];
    selected.innerHTML = '';

    files.forEach((file, index) => {
      const chip = document.createElement('div');
      chip.className = 'selected-file';

      const preview = document.createElement('div');
      preview.className = 'file-preview';
      if (file.type?.startsWith('image/')) {
        const img = document.createElement('img');
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        img.alt = '';
        img.onload = () => URL.revokeObjectURL(objectUrl);
        preview.appendChild(img);
      } else {
        preview.textContent = (file.name.split('.').pop() || 'FILE').toUpperCase();
      }

      const meta = document.createElement('div');
      meta.className = 'file-meta';
      const name = document.createElement('strong');
      name.textContent = file.name;
      const size = document.createElement('span');
      size.textContent = formatBytes(file.size);
      meta.append(name, size);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'file-remove';
      remove.textContent = '×';
      remove.title = 'Rimuovi file';
      remove.setAttribute('aria-label', `Rimuovi ${file.name}`);
      remove.addEventListener('click', () => {
        const current = fileStore.get(input) || [];
        current.splice(index, 1);
        fileStore.set(input, current);
        syncNativeInput(input);
        renderFiles(input);
        updateCloudFallback();
      });

      chip.append(preview, meta, remove);
      selected.appendChild(chip);
    });
  };

  fileInputs.forEach(input => {
    let beforePicker = [];

    const snapshot = () => {
      beforePicker = [...(fileStore.get(input) || [])];
    };
    input.addEventListener('pointerdown', snapshot);
    input.addEventListener('click', snapshot);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') snapshot();
    });

    input.addEventListener('change', () => {
      const incoming = [...(input.files || [])];
      const base = beforePicker.length ? beforePicker : [...(fileStore.get(input) || [])];
      const merged = [...base];
      const keys = new Set(base.map(fileKey));

      incoming.forEach(file => {
        const key = fileKey(file);
        if (!keys.has(key)) {
          merged.push(file);
          keys.add(key);
        }
      });

      fileStore.set(input, merged);
      syncNativeInput(input);
      renderFiles(input);
      updateCloudFallback();
      beforePicker = [...merged];
    });

    input._clearStoredFiles = () => {
      fileStore.set(input, []);
      syncNativeInput(input);
      renderFiles(input);
    };
  });

  cloudInput?.addEventListener('input', () => {
    if (!directUploadAllowed() && cloudInput.value.trim()) {
      setNotice('Link cloud inserito. La richiesta verrà inviata senza caricare direttamente i file che superano i limiti.', 'info');
    }
  });

  const faqWrap = document.querySelector('#faq .wrap');
  if (faqWrap) {
    const materialDetails = [...faqWrap.querySelectorAll('details')].find(details =>
      details.querySelector('summary')?.textContent.trim() === 'Quale materiale posso inviare?'
    );
    if (materialDetails) {
      const answer = materialDetails.querySelector('p');
      if (answer) answer.textContent = 'Puoi inviare foto, immagini, piante, prospetti, sezioni, PDF, scansioni, DWG/DXF, file Revit, file di interscambio come IFC, file mesh come OBJ o PLY e, più in generale, qualsiasi file relativo al progetto in qualsiasi formato. Per le nuvole di punti è previsto un link cloud.';
    }

    const revitPointCloudDetails = [...faqWrap.querySelectorAll('details')].find(details => {
      const text = details.querySelector('summary')?.textContent.trim() || '';
      return text === 'Posso richiedere un modello Revit da LAS, LAZ o E57?' || (text.includes('modello Revit') && (text.includes('LAS') || text.includes('nuvola')));
    });
    if (revitPointCloudDetails) {
      const answer = revitPointCloudDetails.querySelector('p');
      if (answer) answer.textContent = 'Sì. Puoi inviare il collegamento cloud alla nuvola di punti. Per ottenere una ricostruzione più accurata è preferibile allegare anche le foto dei prospetti dell’edificio o del fabbricato, eventuali planimetrie disponibili, l’indirizzo fisico preciso e qualsiasi altro materiale utile a comprendere meglio la nuvola di punti, gli spazi, i livelli e gli elementi architettonici presenti.';
    }
  }

  document.querySelectorAll('script[type="application/ld+json"]').forEach(node => {
    try {
      const data = JSON.parse(node.textContent || '{}');
      if (data['@type'] === 'FAQPage' && Array.isArray(data.mainEntity)) {
        const materialQ = data.mainEntity.find(item => item.name === 'Quale materiale posso inviare per un lavoro CAD o BIM?');
        if (materialQ?.acceptedAnswer) {
          materialQ.acceptedAnswer.text = 'Puoi inviare foto, immagini, piante, prospetti, sezioni, PDF, scansioni, DWG/DXF, file Revit, file di interscambio come IFC, file mesh come OBJ o PLY e qualsiasi altro file relativo al progetto, in qualsiasi formato. Per le nuvole di punti è previsto un link cloud.';
        }
        const revitQ = data.mainEntity.find(item => item.name === 'Posso chiedere un modello Revit da una nuvola di punti?');
        if (revitQ?.acceptedAnswer) {
          revitQ.acceptedAnswer.text = 'Sì. La nuvola di punti può essere fornita tramite link cloud nei formati disponibili, ad esempio LAS, LAZ, E57, RCP o RCS. Per una ricostruzione più accurata è preferibile inviare anche foto dei prospetti dell’edificio o del fabbricato, eventuali planimetrie disponibili, l’indirizzo fisico preciso e qualsiasi altro materiale utile a interpretare meglio la nuvola di punti e gli elementi architettonici.';
        }
        const limitQ = data.mainEntity.find(item => item.name === 'Qual è il limite di caricamento dei file?');
        if (limitQ?.acceptedAnswer) {
          limitQ.acceptedAnswer.text = 'Gli allegati possono essere caricati direttamente fino a 90 MB per singolo file e 500 MB complessivi. Per materiale più grande è possibile usare un link cloud Google Drive, Dropbox, OneDrive, WeTransfer o altro servizio, oppure inviarlo via email a andrea.giaqui@gmail.com o via WhatsApp/Telegram al +39 333 724 0544.';
        }
        node.textContent = JSON.stringify(data);
      }
    } catch (_) {}
  });

  if (faqWrap && !document.getElementById('faq-upload-limit')) {
    const details = document.createElement('details');
    details.id = 'faq-upload-limit';
    details.innerHTML = `<summary>Qual è il limite di caricamento dei file?</summary><p>Gli allegati possono essere caricati direttamente fino a <strong>90 MB per singolo file</strong> e <strong>500 MB complessivi</strong>. Se il materiale supera uno di questi limiti, puoi caricarlo su Google Drive, Dropbox, OneDrive, WeTransfer o un altro servizio cloud e inserire nel modulo il link condiviso. In alternativa puoi inviarmi tutto direttamente via email a <a href="mailto:andrea.giaqui@gmail.com">andrea.giaqui@gmail.com</a> oppure tramite WhatsApp/Telegram al <a href="tel:+393337240544">+39 333 724 0544</a>.</p>`;
    faqWrap.appendChild(details);
  } else if (faqWrap) {
    const limitDetails = document.getElementById('faq-upload-limit');
    const p = limitDetails?.querySelector('p');
    if (p) p.innerHTML = 'Gli allegati possono essere caricati direttamente fino a <strong>90 MB per singolo file</strong> e <strong>500 MB complessivi</strong>. Se il materiale supera uno di questi limiti, puoi caricarlo su Google Drive, Dropbox, OneDrive, WeTransfer o un altro servizio cloud e inserire nel modulo il link condiviso. In alternativa puoi inviarmi tutto direttamente via email a <a href="mailto:andrea.giaqui@gmail.com">andrea.giaqui@gmail.com</a> oppure tramite WhatsApp/Telegram al <a href="tel:+393337240544">+39 333 724 0544</a>.';
  }

  const collectFields = () => {
    const fields = {};
    const data = new FormData(form);
    for (const [key, value] of data.entries()) {
      if (value instanceof File || key.startsWith('_')) continue;
      if (fields[key] === undefined) {
        fields[key] = value;
      } else if (Array.isArray(fields[key])) {
        fields[key].push(value);
      } else {
        fields[key] = [fields[key], value];
      }
    }
    return fields;
  };

  const apiJson = async (path, options = {}) => {
    const response = await fetch(`${backendBase}${path}`, options);
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || `Errore ${response.status}`);
    }
    return payload;
  };

  const uploadFiles = async (sessionId, token) => {
    const items = allFiles();
    for (let i = 0; i < items.length; i += 1) {
      const { input, file } = items[i];
      if (submitButton) submitButton.innerHTML = `CARICAMENTO ALLEGATI ${i + 1}/${items.length}…`;
      setNotice(`Caricamento ${i + 1} di ${items.length}: ${file.name}`, 'info');
      await apiJson(`/api/upload/${encodeURIComponent(sessionId)}`, {
        method: 'PUT',
        headers: {
          'X-Session-Token': token,
          'X-File-Name': encodeURIComponent(file.name),
          'X-Field-Name': input.name,
          'X-File-Size': String(file.size),
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });
    }
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const outputs = [...form.querySelectorAll('input[name="Output[]"]')];
    if (!outputs.some(input => input.checked)) {
      setNotice('Seleziona almeno un risultato finale che desideri ricevere.', 'warning');
      outputs[0]?.focus();
      return;
    }

    const needsCloud = !directUploadAllowed();
    if (needsCloud && !cloudInput?.value.trim()) {
      updateCloudFallback();
      cloudInput?.focus();
      setNotice('Il materiale supera i limiti di caricamento diretto. Inserisci un link cloud al materiale prima di inviare la richiesta.', 'warning');
      return;
    }

    if (!form.reportValidity()) return;

    const originalLabel = submitButton?.innerHTML;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = 'PREPARAZIONE INVIO…';
    }
    setNotice('Preparazione della richiesta…', 'info');

    try {
      const fields = collectFields();
      if (needsCloud) {
        fields.Allegati_non_caricati_direttamente = allFiles().map(({ input, file }) => `${input.name}: ${file.name} (${formatBytes(file.size)})`);
        fields.Dimensione_totale_allegati = formatBytes(fileTotal());
        fields.Modalita_materiale = 'Materiale completo tramite link cloud';
      }

      const session = await apiJson('/api/session', { method: 'POST' });

      if (!needsCloud && allFiles().length) {
        await uploadFiles(session.sessionId, session.token);
      }

      if (submitButton) submitButton.innerHTML = 'INVIO RICHIESTA…';
      setNotice('Invio della richiesta in corso…', 'info');

      await apiJson('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          token: session.token,
          fields
        })
      });

      setNotice();
      if (success) {
        success.hidden = false;
        success.innerHTML = '<h3>Richiesta inviata correttamente ✓</h3><p>Grazie. Ho ricevuto la tua richiesta di preventivo. Esaminerò personalmente il materiale e ti ricontatterò appena possibile. Non è necessario compilare nuovamente il modulo.</p>';
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      form.reset();
      fileInputs.forEach(input => input._clearStoredFiles?.());
      if (cloudBox) cloudBox.hidden = true;
      if (cloudInput) {
        cloudInput.required = false;
        cloudInput.value = '';
      }
    } catch (error) {
      console.error(error);
      setNotice(`Non è stato possibile completare l’invio automatico (${error.message || 'errore di connessione'}). I dati inseriti sono ancora nel modulo: puoi riprovare oppure inviare direttamente il materiale via email a andrea.giaqui@gmail.com oppure tramite WhatsApp/Telegram al +39 333 724 0544.`, 'error');
      addFallbackContacts();
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalLabel || 'RICHIEDI IL PREVENTIVO GRATUITO →';
      }
    }
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();


  const reviewsCarousel = document.getElementById('reviewsCarousel');
  const reviewsGrid = document.getElementById('reviewsGrid');
  const reviewForm = document.getElementById('reviewForm');
  const reviewStatus = document.getElementById('reviewStatus');
  const createReviewCard = review => {
    const article = document.createElement('article'); article.className = 'review-card';
    const mark = document.createElement('div'); mark.className = 'review-mark'; mark.setAttribute('aria-hidden','true'); mark.textContent = '“';
    const text = document.createElement('p'); text.textContent = review.text || '';
    const meta = document.createElement('span'); meta.textContent = [review.displayName || 'Cliente', review.service || 'Recensione cliente'].filter(Boolean).join(' · ');
    article.append(mark,text,meta); return article;
  };
  const loadLiveReviews = async () => {
    if (!reviewsGrid) return;
    try { const r = await fetch(`${backendBase}/api/reviews`); if (!r.ok) return; const d = await r.json(); (d.reviews || []).slice().reverse().forEach(x => reviewsGrid.appendChild(createReviewCard(x))); } catch (_) {}
  };
  if (reviewForm) reviewForm.addEventListener('submit', async event => {
    event.preventDefault(); const button = reviewForm.querySelector('button[type="submit"]'); const fd = new FormData(reviewForm);
    const payload = {name:String(fd.get('name')||'').trim(),service:String(fd.get('service')||'').trim(),text:String(fd.get('text')||'').trim(),website:String(fd.get('website')||'').trim()};
    if (reviewStatus) { reviewStatus.textContent='Pubblicazione in corso…'; reviewStatus.className='review-status'; } if (button) button.disabled=true;
    try { const r=await fetch(`${backendBase}/api/reviews`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); const d=await r.json().catch(()=>({})); if(!r.ok||!d.ok) throw new Error(d.error||'Invio non riuscito.'); if(d.review) reviewsGrid?.prepend(createReviewCard(d.review)); reviewForm.reset(); if(reviewStatus){reviewStatus.textContent=`Grazie! La recensione è stata pubblicata come ${d.review.displayName}.`;reviewStatus.className='review-status is-success';} }
    catch(error){if(reviewStatus){reviewStatus.textContent=error.message||'Non è stato possibile pubblicare la recensione.';reviewStatus.className='review-status is-error';}} finally{if(button)button.disabled=false;}
  });
  let reviewAutoTimer=null; const stopReviewAutoScroll=()=>{if(reviewAutoTimer){clearInterval(reviewAutoTimer);reviewAutoTimer=null;}};
  const startReviewAutoScroll=()=>{if(!reviewsCarousel||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;stopReviewAutoScroll();reviewAutoTimer=setInterval(()=>{const max=reviewsCarousel.scrollWidth-reviewsCarousel.clientWidth;if(max<=4)return;if(reviewsCarousel.scrollLeft>=max-2)reviewsCarousel.scrollTo({left:0,behavior:'smooth'});else reviewsCarousel.scrollBy({left:1,behavior:'auto'});},28);};
  if(reviewsCarousel){reviewsCarousel.addEventListener('mouseenter',stopReviewAutoScroll);reviewsCarousel.addEventListener('mouseleave',startReviewAutoScroll);reviewsCarousel.addEventListener('touchstart',stopReviewAutoScroll,{passive:true});reviewsCarousel.addEventListener('touchend',()=>setTimeout(startReviewAutoScroll,1400),{passive:true});reviewsCarousel.addEventListener('focusin',stopReviewAutoScroll);reviewsCarousel.addEventListener('focusout',startReviewAutoScroll);}
  loadLiveReviews().finally(startReviewAutoScroll);

})();