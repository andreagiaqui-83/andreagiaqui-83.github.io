from pathlib import Path
import re

# --- script.js: sostituisce il carosello automatico con navigazione manuale ciclica ---
p = Path('script.js')
s = p.read_text(encoding='utf-8')
start = s.find('  const unwrapReviewGroups = () => {')
end_marker = '  loadLiveReviews().finally(setupReviewMarquee);'
end = s.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit('review carousel block not found')
end += len(end_marker)

new_block = r'''  const unwrapReviewGroups = () => {
    if (!reviewsGrid) return [];
    const firstGroup = reviewsGrid.querySelector('.reviews-loop-group');
    if (!firstGroup) return [...reviewsGrid.children].filter(el => el.classList?.contains('review-card'));
    const originals = [...firstGroup.children].filter(el => el.classList?.contains('review-card'));
    reviewsGrid.replaceChildren(...originals);
    reviewsGrid.classList.remove('reviews-marquee-track');
    return originals;
  };

  let reviewIndex = 0;

  const getReviewCards = () => unwrapReviewGroups();

  const ensureReviewControls = () => {
    if (!reviewsCarousel) return;
    let prev = reviewsCarousel.querySelector('.review-nav-prev');
    let next = reviewsCarousel.querySelector('.review-nav-next');

    if (!prev) {
      prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'review-nav review-nav-prev';
      prev.setAttribute('aria-label', 'Recensione precedente');
      prev.innerHTML = '&#10094;';
      reviewsCarousel.appendChild(prev);
    }
    if (!next) {
      next = document.createElement('button');
      next.type = 'button';
      next.className = 'review-nav review-nav-next';
      next.setAttribute('aria-label', 'Recensione successiva');
      next.innerHTML = '&#10095;';
      reviewsCarousel.appendChild(next);
    }

    if (!prev.dataset.bound) {
      prev.dataset.bound = '1';
      prev.addEventListener('click', () => moveReview(-1));
    }
    if (!next.dataset.bound) {
      next.dataset.bound = '1';
      next.addEventListener('click', () => moveReview(1));
    }
  };

  const scrollReviewTo = (index, smooth = true) => {
    if (!reviewsCarousel || !reviewsGrid) return;
    const cards = getReviewCards();
    if (!cards.length) return;
    reviewIndex = ((index % cards.length) + cards.length) % cards.length;
    const target = cards[reviewIndex];
    const carouselRect = reviewsCarousel.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const left = reviewsCarousel.scrollLeft + targetRect.left - carouselRect.left - 2;
    reviewsCarousel.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  };

  const moveReview = direction => {
    const cards = getReviewCards();
    if (!cards.length) return;
    scrollReviewTo(reviewIndex + direction, true);
  };

  const setupReviewCarousel = () => {
    if (!reviewsCarousel || !reviewsGrid) return;
    const cards = getReviewCards();
    reviewsGrid.classList.remove('reviews-marquee-track');
    ensureReviewControls();
    const controls = reviewsCarousel.querySelectorAll('.review-nav');
    controls.forEach(button => { button.hidden = cards.length < 2; });
    if (cards.length) scrollReviewTo(Math.min(reviewIndex, cards.length - 1), false);
  };

  const addReviewCard = review => {
    if (!reviewsGrid || !review) return;
    const originals = getReviewCards();
    originals.unshift(createReviewCard(review));
    reviewsGrid.replaceChildren(...originals);
    reviewIndex = 0;
    setupReviewCarousel();
  };

  window.addEventListener('resize', () => scrollReviewTo(reviewIndex, false), { passive: true });
  loadLiveReviews().finally(setupReviewCarousel);'''

s = s[:start] + new_block + s[end:]
p.write_text(s, encoding='utf-8')

# --- enhancements.css: elimina animazione automatica e aggiunge frecce ---
p = Path('enhancements.css')
c = p.read_text(encoding='utf-8')
old = re.compile(r'/\* Carousel recensioni live \*/.*?\.review-submit-section\{', re.S)
m = old.search(c)
if not m:
    raise SystemExit('carousel css block not found')
css = r'''/* Carousel recensioni: navigazione manuale ciclica */
.reviews-carousel{position:relative;overflow:hidden;padding:4px 0 10px;touch-action:pan-y;overscroll-behavior-x:none;scroll-behavior:smooth}
.reviews-carousel .reviews-grid{display:flex;gap:18px;width:max-content;margin-top:26px;transform:none!important;animation:none!important;will-change:auto}
.reviews-loop-group{display:contents}
.reviews-carousel .review-card{flex:0 0 min(360px,82vw);width:min(360px,82vw);min-height:190px}
.review-nav{position:absolute;top:50%;z-index:5;width:46px;height:46px;border:1px solid #c5d9e7;border-radius:50%;background:rgba(255,255,255,.96);color:#0b4a6f;box-shadow:0 7px 22px rgba(11,58,91,.18);display:flex;align-items:center;justify-content:center;font-size:27px;line-height:1;cursor:pointer;transform:translateY(-50%);transition:transform .16s ease,background .16s ease,box-shadow .16s ease}
.review-nav:hover{background:#f0f8fd;box-shadow:0 9px 26px rgba(11,58,91,.23);transform:translateY(-50%) scale(1.05)}
.review-nav:focus-visible{outline:3px solid #63b7e6;outline-offset:2px}
.review-nav-prev{left:8px}.review-nav-next{right:8px}
.review-nav[hidden]{display:none!important}
@media(max-width:576px){.review-nav{width:40px;height:40px;font-size:23px}.review-nav-prev{left:5px}.review-nav-next{right:5px}}
.review-submit-section{'''
c = c[:m.start()] + css + c[m.end():]
p.write_text(c, encoding='utf-8')

# --- index.html: cache bust delle risorse modificate ---
p = Path('index.html')
h = p.read_text(encoding='utf-8')
h = re.sub(r'enhancements\.css(?:\?v=[^\"\']*)?', 'enhancements.css?v=20260914-manualreviews1', h)
h = re.sub(r'script\.js(?:\?v=[^\"\']*)?', 'script.js?v=20260914-manualreviews1', h)
p.write_text(h, encoding='utf-8')
