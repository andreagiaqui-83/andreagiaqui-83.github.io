(() => {
  const init = () => {
    document.querySelectorAll('input[type="file"]').forEach(input => {
      const label = input.closest('label');
      if (!label || label.dataset.dropReady === '1') return;
      label.dataset.dropReady = '1';
      label.classList.add('file-dropzone');
      input.setAttribute('multiple','');

      const stop = event => { event.preventDefault(); event.stopPropagation(); };
      ['dragenter','dragover'].forEach(type => label.addEventListener(type, event => {
        stop(event); label.classList.add('is-dragover');
      }));
      ['dragleave','drop'].forEach(type => label.addEventListener(type, event => {
        stop(event); label.classList.remove('is-dragover');
      }));
      label.addEventListener('drop', event => {
        const files = [...(event.dataTransfer?.files || [])];
        if (!files.length) return;
        try {
          const dt = new DataTransfer();
          files.forEach(file => dt.items.add(file));
          input.files = dt.files;
        } catch (_) { return; }
        input.dispatchEvent(new Event('change', { bubbles:true }));
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
