(() => {
  const APP_VERSION = '20260913k';
  document.documentElement.dataset.appVersion = APP_VERSION;
  const heroUrl = 'https://drive.google.com/thumbnail?id=1SdyG3fAIzvyOfmTzvx0NTRr1UEjWJqYx&sz=w2000&v=20260913c';
  const submitEndpoint = 'https://formsubmit.co/ajax/andrea.giaqui@gmail.com';

  document.title = 'Disegnatore AutoCAD e Revit Online | Preventivo Gratuito';
  document.querySelectorAll('a[href*="facebook.com/disegnatoreautocadonline"]').forEach(link => {
    if (link.closest('footer')) link.textContent = 'Facebook · Disegnatore AutoCAD e Revit';
  });

  const heroImg = document.querySelector('.hero-card img');
  if (heroImg) {
    heroImg.src = heroUrl;
    heroImg.width = 1800;
    heroImg.height = 600;
    heroImg.alt = 'Andrea Giaquinto - Disegnatore AutoCAD e Revit, servizi CAD BIM con preventivo gratuito';
  }

  const form = document.getElementById('quoteForm');
  const warning = document.getElementById('fileWarning');
  const success = document.getElementById('grazie');
  const maxBytes = 10 * 1024 * 1024;
  const fileInputs = form ? [...form.querySelectorAll('input[type="file"]')] : [];
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;

  const formatBytes = bytes => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const fileTotal = () => fileInputs.reduce((sum, input) => {
    return sum + [...(input.files || [])].reduce((s, f) => s + f.size, 0);
  }, 0);

  const setNotice = (message = '', type = 'warning') => {
    if (!warning) return;
    if (!message) {
      warning.hidden = true;
      warning.textContent = '';
      warning.className = 'notice';
      return;
    }
    warning.hidden = false;
    warning.textContent = message;
    warning.className = `notice notice-${type}`;
  };

  const validateFiles = () => {
    const total = fileTotal();
    if (total > maxBytes) {
      setNotice(`Gli allegati selezionati pesano ${formatBytes(total)}. Il limite complessivo per l'invio diretto è 10 MB. Rimuovi uno o più file oppure indica nelle note che vuoi inviare il materiale separatamente.`, 'warning');
      return false;
    }
    setNotice();
    return true;
  };

  const enhanceFileInput = input => {
    const host = input.parentElement;
    if (!host) return;
    let selected = host.querySelector('.selected-files');
    if (!selected) {
      selected = document.createElement('div');
      selected.className = 'selected-files';
      selected.setAttribute('aria-live', 'polite');
      input.insertAdjacentElement('afterend', selected);
    }

    const renderFiles = () => {
      selected.innerHTML = '';
      const files = [...(input.files || [])];
      if (!files.length) return;

      const title = document.createElement('div');
      title.className = 'selected-files-title';
      title.textContent = files.length === 1 ? '1 file selezionato' : `${files.length} file selezionati`;
      selected.appendChild(title);

      const list = document.createElement('div');
      list.className = 'selected-files-list';
      selected.appendChild(list);

      files.forEach((file, index) => {
        const chip = document.createElement('div');
        chip.className = 'selected-file';

        const preview = document.createElement('div');
        preview.className = 'file-preview';
        if (file.type && file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.alt = '';
          const objectUrl = URL.createObjectURL(file);
          img.src = objectUrl;
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
        remove.setAttribute('aria-label', `Rimuovi ${file.name}`);
        remove.title = 'Rimuovi file';
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          try {
            const dt = new DataTransfer();
            files.forEach((f, i) => { if (i !== index) dt.items.add(f); });
            input.files = dt.files;
          } catch (_) {
            input.value = '';
          }
          renderFiles();
          validateFiles();
        });

        chip.append(preview, meta, remove);
        list.appendChild(chip);
      });
    };

    input.addEventListener('change', () => {
      renderFiles();
      validateFiles();
    });
    renderFiles();
  };

  fileInputs.forEach(enhanceFileInput);

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const outputs = [...form.querySelectorAll('input[name="Output[]"]')];
      if (!outputs.some(i => i.checked)) {
        setNotice('Seleziona almeno un risultato finale che desideri ricevere.', 'warning');
        outputs[0]?.focus();
        return;
      }
      if (!validateFiles()) return;
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
        document.querySelectorAll('.selected-files').forEach(el => { el.innerHTML = ''; });
      } catch (error) {
        console.error(error);
        setNotice('Non è stato possibile completare l’invio automatico. I dati inseriti sono ancora nel modulo: puoi riprovare oppure contattarmi direttamente via email o WhatsApp senza perdere ciò che hai compilato.', 'error');
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
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
