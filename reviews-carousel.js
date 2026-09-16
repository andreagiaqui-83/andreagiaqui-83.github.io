/* Single controller: native touch scrolling, exact card navigation, no clones. */
(() => {
  'use strict';
  const init = () => {
    const view = document.getElementById('reviewsCarousel');
    const track = document.getElementById('reviewsGrid');
    const prev = document.getElementById('reviewsPrev');
    const next = document.getElementById('reviewsNext');
    const status = document.getElementById('reviewsPosition');
    if (!view || !track || !prev || !next || view.dataset.pagedReviews === '2') return;
    view.dataset.pagedReviews = '2';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let active = 0;
    let busy = false;
    let settleTimer = 0;
    let frame = 0;
    let width = view.clientWidth;
    const cards = () => Array.from(track.children).filter(el => el.classList.contains('review-card'));
    const maxScroll = () => Math.max(0, view.scrollWidth - view.clientWidth);
    const offset = card => card.getBoundingClientRect().left - view.getBoundingClientRect().left + view.scrollLeft;
    const nearest = list => list.reduce((best, card, i) => Math.abs(offset(card) - view.scrollLeft) < Math.abs(offset(list[best]) - view.scrollLeft) ? i : best, 0);
    const update = (announce = false) => {
      const list = cards();
      prev.disabled = list.length < 2 || view.scrollLeft <= 2;
      next.disabled = list.length < 2 || view.scrollLeft >= maxScroll() - 2;
      if (!list.length) { active = 0; return; }
      active = nearest(list);
      if (announce && status) {
        const rect = view.getBoundingClientRect();
        const visible = list.map((card,i) => ({i,r:card.getBoundingClientRect()})).filter(x => x.r.right > rect.left + 2 && x.r.left < rect.right - 2);
        const text = visible.length > 1 ? `Recensioni ${visible[0].i+1}–${visible[visible.length-1].i+1} di ${list.length}` : `Recensione ${active+1} di ${list.length}`;
        if (status.textContent !== text) status.textContent = text;
      }
    };
    const finish = () => {
      clearTimeout(settleTimer);
      busy = false;
      update(true);
    };
    const go = (index, smooth = true) => {
      const list = cards();
      if (!list.length) return;
      active = Math.max(0, Math.min(index, list.length - 1));
      const left = Math.max(0, Math.min(offset(list[active]), maxScroll()));
      busy = smooth && !reduced.matches && Math.abs(left - view.scrollLeft) > 1;
      view.scrollTo({left, behavior:busy ? 'smooth' : 'auto'});
      clearTimeout(settleTimer);
      settleTimer = setTimeout(finish, busy ? 800 : 40);
    };
    const move = direction => {
      if (busy) return;
      const list = cards();
      if (list.length < 2) return;
      go(nearest(list) + direction);
    };
    const enhance = () => {
      const list = cards();
      list.forEach((card,i) => {
        card.setAttribute('role','group');
        card.setAttribute('aria-roledescription','recensione');
        card.setAttribute('aria-label',`${i+1} di ${list.length}`);
      });
      prev.hidden = next.hidden = false;
      update(true);
    };
    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    view.addEventListener('keydown', event => {
      if (event.target !== view || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); go(event.key === 'Home' ? 0 : cards().length - 1); }
    });
    view.addEventListener('pointerdown', () => { busy = false; }, {passive:true});
    view.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(() => {frame = 0; update();});
      clearTimeout(settleTimer);
      settleTimer = setTimeout(finish, 140);
    }, {passive:true});
    view.addEventListener('scrollend', finish, {passive:true});
    const onResize = () => {
      if (width === view.clientWidth) return;
      width = view.clientWidth;
      const index = active;
      requestAnimationFrame(() => go(index, false));
    };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(view);
    else window.addEventListener('resize', onResize, {passive:true});
    new MutationObserver(enhance).observe(track, {childList:true});
    enhance();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
