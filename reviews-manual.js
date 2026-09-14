(() => {
  const init = () => {
    const carousel = document.querySelector('.reviews-carousel');
    const track = carousel?.querySelector('.reviews-grid');
    if (!carousel || !track || carousel.dataset.manualReviewsReady === '1') return;
    carousel.dataset.manualReviewsReady = '1';

    let busy = false;
    let normalizing = false;
    let normalizeTimer = 0;

    const normalizeTrack = () => {
      if (normalizing || busy) return;
      normalizing = true;
      try {
        const group = track.querySelector('.reviews-loop-group');
        if (group) {
          const originals = [...group.children].filter(el => el.classList?.contains('review-card'));
          if (originals.length) track.replaceChildren(...originals);
        }
        track.classList.remove('reviews-marquee-track');
        track.style.animation = 'none';
        track.style.transition = 'none';
        track.style.transform = 'translate3d(0,0,0)';
      } finally {
        normalizing = false;
      }
      updateButtons();
    };

    const controls = document.createElement('div');
    controls.className = 'reviews-carousel-controls';
    controls.setAttribute('aria-label', 'Navigazione recensioni');

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'reviews-arrow reviews-arrow-prev';
    prev.setAttribute('aria-label', 'Recensione precedente');
    prev.innerHTML = '<span aria-hidden="true">‹</span>';

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'reviews-arrow reviews-arrow-next';
    next.setAttribute('aria-label', 'Recensione successiva');
    next.innerHTML = '<span aria-hidden="true">›</span>';

    controls.append(prev, next);
    carousel.appendChild(controls);

    function directCards() {
      return [...track.children].filter(el => el.classList?.contains('review-card'));
    }

    function updateButtons() {
      const disabled = directCards().length < 2;
      prev.disabled = disabled;
      next.disabled = disabled;
    }

    function stepSize() {
      const first = directCards()[0];
      if (!first) return 0;
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || '18') || 18;
      return first.getBoundingClientRect().width + gap;
    }

    const finishNext = () => {
      const cards = directCards();
      if (cards.length > 1) track.appendChild(cards[0]);
      track.style.transition = 'none';
      track.style.transform = 'translate3d(0,0,0)';
      busy = false;
    };

    const goNext = () => {
      if (busy) return;
      normalizeTrack();
      const cards = directCards();
      const distance = stepSize();
      if (cards.length < 2 || !distance) return;
      busy = true;
      track.style.transition = 'transform 360ms cubic-bezier(.22,.61,.36,1)';
      requestAnimationFrame(() => {
        track.style.transform = `translate3d(-${distance}px,0,0)`;
      });
      const fallback = setTimeout(() => {
        if (busy) finishNext();
      }, 450);
      track.addEventListener('transitionend', () => {
        clearTimeout(fallback);
        if (busy) finishNext();
      }, { once: true });
    };

    const goPrev = () => {
      if (busy) return;
      normalizeTrack();
      const cards = directCards();
      const distance = stepSize();
      if (cards.length < 2 || !distance) return;
      busy = true;
      track.insertBefore(cards[cards.length - 1], cards[0]);
      track.style.transition = 'none';
      track.style.transform = `translate3d(-${distance}px,0,0)`;
      void track.offsetWidth;
      track.style.transition = 'transform 360ms cubic-bezier(.22,.61,.36,1)';
      requestAnimationFrame(() => {
        track.style.transform = 'translate3d(0,0,0)';
      });
      const fallback = setTimeout(() => {
        track.style.transition = 'none';
        busy = false;
      }, 450);
      track.addEventListener('transitionend', () => {
        clearTimeout(fallback);
        track.style.transition = 'none';
        busy = false;
      }, { once: true });
    };

    prev.addEventListener('click', goPrev);
    next.addEventListener('click', goNext);

    const observer = new MutationObserver(() => {
      if (normalizing || busy) return;
      clearTimeout(normalizeTimer);
      normalizeTimer = setTimeout(normalizeTrack, 0);
    });
    observer.observe(track, { childList: true, subtree: true });

    window.addEventListener('resize', () => {
      if (busy) return;
      track.style.transition = 'none';
      track.style.transform = 'translate3d(0,0,0)';
    }, { passive: true });

    normalizeTrack();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
