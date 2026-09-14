from pathlib import Path
import re

# Replace JS animation loop with a CSS marquee to avoid mobile main-thread lockups.
p = Path('script.js')
s = p.read_text(encoding='utf-8')
start_marker = '  let reviewFrame = null;'
end_marker = '  loadLiveReviews().finally(() => { prepareInfiniteReviews(); startReviewAutoScroll(); });'
start = s.find(start_marker)
end = s.find(end_marker, start)
if start == -1 or end == -1:
    raise SystemExit('review animation block not found')
end += len(end_marker)
new = '''  const unwrapReviewGroups = () => {
    if (!reviewsGrid) return [];
    const firstGroup = reviewsGrid.querySelector('.reviews-loop-group');
    if (!firstGroup) return [...reviewsGrid.children].filter(el => el.classList?.contains('review-card'));
    const originals = [...firstGroup.children].filter(el => el.classList?.contains('review-card'));
    reviewsGrid.replaceChildren(...originals);
    reviewsGrid.classList.remove('reviews-marquee-track');
    return originals;
  };

  const setupReviewMarquee = () => {
    if (!reviewsGrid) return;
    const originals = unwrapReviewGroups();
    if (originals.length < 2) return;

    const groupA = document.createElement('div');
    groupA.className = 'reviews-loop-group';
    originals.forEach(card => groupA.appendChild(card));

    const groupB = document.createElement('div');
    groupB.className = 'reviews-loop-group';
    groupB.setAttribute('aria-hidden', 'true');
    originals.forEach(card => {
      const clone = card.cloneNode(true);
      clone.tabIndex = -1;
      groupB.appendChild(clone);
    });

    reviewsGrid.replaceChildren(groupA, groupB);
    reviewsGrid.classList.add('reviews-marquee-track');
  };

  const addReviewCard = review => {
    if (!reviewsGrid || !review) return;
    const originals = unwrapReviewGroups();
    originals.unshift(createReviewCard(review));
    reviewsGrid.replaceChildren(...originals);
    setupReviewMarquee();
  };

  loadLiveReviews().finally(setupReviewMarquee);'''
s = s[:start] + new + s[end:]

# Replace the post-submit insertion so a live review is integrated safely into the marquee.
s = s.replace(
    "if(d.review){ reviewsGrid?.prepend(createReviewCard(d.review)); setTimeout(rebuildReviewLoop,0); } reviewForm.reset();",
    "if(d.review) addReviewCard(d.review); reviewForm.reset();"
)
s = s.replace(
    "if(d.review) reviewsGrid?.prepend(createReviewCard(d.review)); reviewForm.reset();",
    "if(d.review) addReviewCard(d.review); reviewForm.reset();"
)
p.write_text(s, encoding='utf-8')

# Replace old carousel CSS with a compositor-friendly CSS-only infinite marquee.
p = Path('enhancements.css')
css = p.read_text(encoding='utf-8')
start = css.find('/* Carousel recensioni live */')
if start == -1:
    raise SystemExit('carousel css marker not found')
# Keep review form rules, replacing only carousel-specific rules up to the form section.
form_marker = '.review-submit-section{'
form_pos = css.find(form_marker, start)
if form_pos == -1:
    raise SystemExit('review form css marker not found')
carousel_css = '''/* Carousel recensioni live */
.reviews-carousel{overflow:hidden;padding:4px 0 10px;touch-action:pan-y;overscroll-behavior-x:none}
.reviews-carousel .reviews-grid{display:flex;gap:18px;width:max-content;margin-top:26px}
.reviews-carousel .reviews-grid.reviews-marquee-track{animation:reviewsMarquee 48s linear infinite;will-change:transform}
.reviews-loop-group{display:flex;gap:18px;flex:none;width:max-content}
.reviews-carousel .review-card{flex:0 0 min(360px,82vw);width:min(360px,82vw);min-height:190px}
@keyframes reviewsMarquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(calc(-50% - 9px),0,0)}}
@media(hover:hover){.reviews-carousel:hover .reviews-marquee-track{animation-play-state:paused}}
'''
css = css[:start] + carousel_css + css[form_pos:]
# Remove obsolete carousel media rules and add safe mobile/reduced-motion rules.
css = css.replace('@media(max-width:850px){.review-submit-card{grid-template-columns:1fr}.reviews-carousel .review-card{flex-basis:min(340px,86vw);width:min(340px,86vw)}}', '@media(max-width:850px){.review-submit-card{grid-template-columns:1fr}.reviews-carousel .review-card{flex-basis:min(340px,86vw);width:min(340px,86vw)}}')
css = css.replace('@media(prefers-reduced-motion:reduce){.reviews-carousel{scroll-behavior:auto}}', '@media(prefers-reduced-motion:reduce){.reviews-carousel .reviews-marquee-track{animation:none!important;transform:none!important}}')
p.write_text(css, encoding='utf-8')

# Bust both JS and CSS caches.
p = Path('index.html')
h = p.read_text(encoding='utf-8')
h = re.sub(r'enhancements\.css\?v=[^\"]+', 'enhancements.css?v=20260914-marquee3', h)
h = re.sub(r'script\.js\?v=[^\"]+', 'script.js?v=20260914-marquee3', h)
if 'script.js?v=' not in h:
    h = h.replace('script.js" defer', 'script.js?v=20260914-marquee3" defer')
p.write_text(h, encoding='utf-8')
