'use strict';
document.querySelectorAll('[data-review-share]').forEach(function (panel) {
  const button = panel.querySelector('[data-review-copy]');
  const input = panel.querySelector('[data-review-copy-url]');
  const fallback = panel.querySelector('[data-review-copy-fallback]');
  const status = panel.querySelector('[data-review-copy-status]');
  if (!button || !input || !fallback || !status) return;
  button.hidden = false;
  button.addEventListener('click', async function () {
    button.disabled = true;
    status.textContent = '';
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(input.value);
      fallback.hidden = true;
      status.textContent = 'Link copiato. Puoi incollarlo in un messaggio.';
    } catch (_) {
      fallback.hidden = false;
      status.textContent = 'Copia il link dal campo qui sotto.';
      input.focus();
      input.select();
    } finally {
      button.disabled = false;
    }
  });
});
