(() => {
  const form = document.getElementById('quoteForm');
  const warning = document.getElementById('fileWarning');
  const maxBytes = 10 * 1024 * 1024;
  const fileInputs = [...form.querySelectorAll('input[type="file"]')];

  const fileTotal = () => fileInputs.reduce((sum, input) => {
    return sum + [...(input.files || [])].reduce((s, f) => s + f.size, 0);
  }, 0);

  const validateFiles = () => {
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
  form.addEventListener('submit', e => {
    const outputs = [...form.querySelectorAll('input[name="Output[]"]')];
    const outputOk = outputs.some(i => i.checked);
    if (!validateFiles() || !outputOk) {
      e.preventDefault();
      if (!outputOk) {
        outputs[0].focus();
        warning.hidden = false;
        warning.textContent = 'Seleziona almeno un risultato finale che desideri ricevere.';
      }
    }
  });

  const params = new URLSearchParams(location.search);
  if (params.get('inviato') === '1') {
    const success = document.getElementById('grazie');
    success.hidden = false;
    setTimeout(() => success.scrollIntoView({behavior:'smooth', block:'center'}), 150);
  }
  document.getElementById('year').textContent = new Date().getFullYear();
})();
