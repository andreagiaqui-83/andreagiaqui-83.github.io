(() => {
  const submitEndpoint = 'https://formsubmit.co/ajax/andrea.giaqui@gmail.com';
  const maxBytes = 10 * 1024 * 1024;

  document.title = 'Disegnatore AutoCAD e Revit Online | Preventivo Gratuito';
  document.querySelectorAll('a[href*="facebook.com/disegnatoreautocadonline"]').forEach(link => {
    if (link.closest('footer')) link.textContent = 'Facebook · Disegnatore AutoCAD e Revit';
  });

  const form = document.getElementById('quoteForm');
  if (!form) return;

  const warning = document.getElementById('fileWarning');
  const success = document.getElementById('grazie');
  const submitButton = form.querySelector('button[type="submit"]');
  const fileInputs = [...form.querySelectorAll('input[type="file"]')];

  const photoInput = form.querySelector('input[name="Foto_immagini_fabbricato[]"]');
  if (photoInput) {
    const label = photoInput.closest('label');
    label?.classList.add('upload-label', 'photo-upload-label');
    const help = label?.querySelector('small');
    if (help) help.textContent = 'Esterni, interni, viste dall’alto, dettagli costruttivi o altre immagini utili, in qualsiasi formato immagine.';
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
  if (micro) micro.textContent = 'Gli allegati possono essere inviati direttamente fino a 10 MB complessivi. Oltre 10 MB puoi usare un link cloud oppure inviare il materiale via email o WhatsApp/Telegram.';

  // Tutti i pulsanti Sfoglia sono additivi: nuove selezioni si sommano sempre alle precedenti.
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
    const dt = new DataTransfer();
    (fileStore.get(input) || []).forEach(file => dt.items.add(file));
    input.files = dt.files;
  };

  const fileTotal = () => [...fileStore.values()].flat().reduce((sum, file) => sum + file.size, 0);
  const selectedFileNames = () => [...fileStore.entries()].flatMap(([input, files]) =>
    files.map(file => `${input.name}: ${file.name} (${formatBytes(file.size)})`)
  );

  const setNotice = (message = '', type = 'warning') => {
    if (!warning) return;
    warning.hidden = !message;
    warning.className = message ? `notice notice-${type}` : 'notice';
    warning.textContent = message;
  };

  let cloudBox = null;
  let cloudInput = null;
  if (warning) {
    cloudBox = document.createElement('div');
    cloudBox.className = 'cloud-upload-box';
    cloudBox.hidden = true;
    cloudBox.innerHTML = `
      <div class="cloud-upload-head"><strong>Materiale superiore a 10 MB</strong><span>Carica tutti i file su un servizio cloud e incolla qui sotto il link condiviso.</span></div>
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

  const updateCloudFallback = () => {
    const total = fileTotal();
    const overLimit = total > maxBytes;
    if (cloudBox) cloudBox.hidden = !overLimit;
    if (cloudInput) cloudInput.required = overLimit;
    if (overLimit) {
      setNotice(`Gli allegati selezionati pesano ${formatBytes(total)}. Caricali su un cloud e incolla il link condiviso, oppure inviali a andrea.giaqui@gmail.com / WhatsApp-Telegram +39 333 724 0544.`, 'info');
    } else {
      if (cloudInput) {
        cloudInput.required = false;
        cloudInput.value = '';
      }
      setNotice();
    }
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

    // Salva esplicitamente lo stato prima che il browser apra il selettore file.
    const snapshot = () => {
      beforePicker = [...(fileStore.get(input) || [])];
    };
    input.addEventListener('pointerdown', snapshot);
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
    if (fileTotal() > maxBytes && cloudInput.value.trim()) {
      setNotice('Link cloud inserito. La richiesta verrà inviata senza allegare direttamente i file superiori al limite.', 'info');
    }
  });

  const faqWrap = document.querySelector('#faq .wrap');
  if (faqWrap && !document.getElementById('faq-upload-limit')) {
    const details = document.createElement('details');
    details.id = 'faq-upload-limit';
    details.innerHTML = `<summary>Qual è il limite di caricamento dei file?</summary><p>Gli allegati inviati direttamente dal modulo possono arrivare fino a <strong>10 MB complessivi</strong>. Se il materiale supera questo limite, puoi caricarlo su Google Drive, Dropbox, OneDrive, WeTransfer o un altro servizio cloud e inserire nel modulo il link condiviso. In alternativa puoi inviarmi tutto direttamente via email a <a href="mailto:andrea.giaqui@gmail.com">andrea.giaqui@gmail.com</a> oppure tramite WhatsApp/Telegram al <a href="tel:+393337240544">+39 333 724 0544</a>.</p>`;
    faqWrap.appendChild(details);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const outputs = [...form.querySelectorAll('input[name="Output[]"]')];
    if (!outputs.some(i => i.checked)) {
      setNotice('Seleziona almeno un risultato finale che desideri ricevere.', 'warning');
      outputs[0]?.focus();
      return;
    }

    const total = fileTotal();
    const overLimit = total > maxBytes;
    if (overLimit && !cloudInput?.value.trim()) {
      updateCloudFallback();
      cloudInput?.focus();
      setNotice('Gli allegati superano 10 MB. Inserisci un link cloud al materiale prima di inviare la richiesta.', 'warning');
      return;
    }
    if (!form.reportValidity()) return;

    const originalLabel = submitButton?.innerHTML;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = 'INVIO IN CORSO…';
    }
    setNotice('Invio della richiesta in corso…', 'info');

    try {
      const data = new FormData(form);
      data.set('_subject', 'Nuova richiesta preventivo AutoCAD / Revit dal sito');
      data.set('_template', 'table');
      data.set('_captcha', 'true');
      data.set('_url', location.href.split('?')[0]);

      if (overLimit) {
        fileInputs.forEach(input => data.delete(input.name));
        data.set('Allegati_non_inviati_direttamente', selectedFileNames().join(' | '));
        data.set('Dimensione_totale_allegati', formatBytes(total));
        data.set('Modalita_materiale', 'Materiale completo tramite link cloud');
      }

      const response = await fetch(submitEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      let payload = {};
      try { payload = await response.json(); } catch (_) {}
      if (!response.ok || payload.success === false) throw new Error(payload.message || `Errore ${response.status}`);

      setNotice();
      if (success) {
        success.hidden = false;
        success.innerHTML = '<h3>Richiesta inviata correttamente ✓</h3><p>Grazie. Ho ricevuto la tua richiesta di preventivo. Esaminerò personalmente il materiale e ti ricontatterò appena possibile. Non è necessario compilare nuovamente il modulo.</p>';
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
      fileInputs.forEach(input => input._clearStoredFiles?.());
      if (cloudBox) cloudBox.hidden = true;
      if (cloudInput) cloudInput.required = false;
    } catch (error) {
      console.error(error);
      setNotice('Non è stato possibile completare l’invio automatico. I dati inseriti sono ancora nel modulo: puoi riprovare oppure contattarmi via email o WhatsApp/Telegram.', 'error');
      if (warning && !warning.querySelector('.submit-fallback')) {
        const fallback = document.createElement('div');
        fallback.className = 'submit-fallback';
        fallback.innerHTML = '<a href="mailto:andrea.giaqui@gmail.com">Invia email</a><a href="https://wa.me/393337240544" target="_blank" rel="noopener">Apri WhatsApp</a>';
        warning.appendChild(fallback);
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalLabel || 'RICHIEDI IL PREVENTIVO GRATUITO →';
      }
    }
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();