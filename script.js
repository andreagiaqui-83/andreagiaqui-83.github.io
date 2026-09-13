(() => {
  const heroUrl = 'https://drive.google.com/thumbnail?id=1SdyG3fAIzvyOfmTzvx0NTRr1UEjWJqYx&sz=w2000&v=20260913c';
  const autocadUrl = 'https://drive.google.com/thumbnail?id=1ZLHpD-KR3HZx47eoMglPhQRWCnR0JRdn&sz=w1200';
  const revitUrl = 'https://drive.google.com/thumbnail?id=1oxeTkAUGxvlykUHbijB6IK55uBZJBZKK&sz=w1200';

  // Load visual refinements without changing the core stylesheet.
  if (!document.querySelector('link[href="enhancements.css"]')) {
    const extraCss = document.createElement('link');
    extraCss.rel = 'stylesheet';
    extraCss.href = 'enhancements.css?v=20260913b';
    document.head.appendChild(extraCss);
  }

  // Replace the opening graphic with the new professional banner built around Andrea's portrait.
  const heroImg = document.querySelector('.hero-card img');
  if (heroImg) {
    heroImg.src = heroUrl;
    heroImg.width = 1800;
    heroImg.height = 600;
    heroImg.alt = 'Andrea Giaquinto - servizi AutoCAD, Revit e BIM con preventivo gratuito';
  }

  // Add a visual CAD/BIM showcase between services and pricing.
  const services = document.getElementById('servizi');
  const price = document.getElementById('preventivo');
  if (services && price && !document.querySelector('.visual-showcase')) {
    const showcase = document.createElement('section');
    showcase.className = 'section visual-showcase';
    showcase.setAttribute('aria-label', 'Esempi grafici CAD e BIM');
    showcase.innerHTML = `
      <div class="wrap">
        <div class="section-heading visual-heading">
          <p class="eyebrow">DAL 2D AL MODELLO BIM</p>
          <h2>Disegno tecnico, modellazione e ricostruzione 3D</h2>
          <p>AutoCAD, Revit e modellazione BIM possono partire da foto, planimetrie, PDF e nuvole di punti e convergere in un unico processo coordinato.</p>
        </div>
        <div class="visual-grid">
          <figure class="visual-card">
            <img src="${autocadUrl}" alt="Esempio professionale di disegno AutoCAD 2D" loading="lazy">
            <figcaption><strong>AutoCAD 2D</strong><span>Piante, prospetti, sezioni e documentazione tecnica.</span></figcaption>
          </figure>
          <figure class="visual-card">
            <img src="${revitUrl}" alt="Esempio professionale di modellazione Revit BIM 3D" loading="lazy">
            <figcaption><strong>Revit / BIM</strong><span>Ricostruzione 3D da rilievi, immagini e nuvole di punti.</span></figcaption>
          </figure>
        </div>
      </div>`;
    price.parentNode.insertBefore(showcase, price);
  }

  // Add a compact visual callout inside the quote form.
  const form = document.getElementById('quoteForm');
  if (form) {
    const fieldsets = [...form.querySelectorAll('fieldset')];
    if (fieldsets[2] && fieldsets[3] && !form.querySelector('.form-visual')) {
      const visual = document.createElement('aside');
      visual.className = 'form-visual';
      visual.setAttribute('aria-label', 'Esempio di modellazione CAD BIM');
      visual.innerHTML = `
        <div class="form-visual-copy">
          <span class="mini-eyebrow">ELABORAZIONE MULTIMODALE</span>
          <strong>Foto, disegni e rilievi possono lavorare insieme.</strong>
          <p>Non serve avere una documentazione perfetta o completa: il materiale disponibile viene valutato nel suo insieme per costruire il risultato richiesto.</p>
        </div>
        <img src="${revitUrl}" alt="Modellazione Revit BIM da materiale tecnico" loading="lazy">`;
      form.insertBefore(visual, fieldsets[3]);
    }
  }

  const warning = document.getElementById('fileWarning');
  const maxBytes = 10 * 1024 * 1024;
  const fileInputs = form ? [...form.querySelectorAll('input[type="file"]')] : [];

  const fileTotal = () => fileInputs.reduce((sum, input) => {
    return sum + [...(input.files || [])].reduce((s, f) => s + f.size, 0);
  }, 0);

  const validateFiles = () => {
    if (!warning) return true;
    const total = fileTotal();
    if (total > maxBytes) {
      warning.hidden = false;
      warning.textContent = `Gli allegati selezionati pesano ${(total/1024/1024).toFixed(1)} MB. Il limite complessivo per l'invio diretto è 10 MB. Riduci gli allegati oppure indica nelle note che vuoi inviare il materiale separatamente.`;
      return false;
    }
    warning.hidden = true;
    warning.textContent = '';
    return true;
  };

  fileInputs.forEach(i => i.addEventListener('change', validateFiles));
  if (form) {
    form.addEventListener('submit', e => {
      const outputs = [...form.querySelectorAll('input[name="Output[]"]')];
      const outputOk = outputs.some(i => i.checked);
      if (!validateFiles() || !outputOk) {
        e.preventDefault();
        if (!outputOk && outputs[0]) {
          outputs[0].focus();
          if (warning) {
            warning.hidden = false;
            warning.textContent = 'Seleziona almeno un risultato finale che desideri ricevere.';
          }
        }
      }
    });
  }

  const params = new URLSearchParams(location.search);
  if (params.get('inviato') === '1') {
    const success = document.getElementById('grazie');
    if (success) {
      success.hidden = false;
      setTimeout(() => success.scrollIntoView({behavior:'smooth', block:'center'}), 150);
    }
  }
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
