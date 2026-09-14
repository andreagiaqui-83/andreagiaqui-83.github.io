(() => {
  const init = () => {
    const carousel=document.getElementById('reviewsCarousel');
    const track=document.getElementById('reviewsGrid');
    const prev=document.getElementById('reviewsPrev');
    const next=document.getElementById('reviewsNext');
    if(!carousel||!track||!prev||!next) return;

    carousel.querySelectorAll('.review-nav,.reviews-carousel-controls').forEach(el=>el.remove());

    let nav=document.querySelector('.reviews-external-nav');
    if(!nav){
      nav=document.createElement('div');
      nav.className='reviews-external-nav';
      nav.setAttribute('aria-label','Navigazione recensioni');
      carousel.parentNode.insertBefore(nav, carousel);
    }
    prev.className='reviews-external-arrow reviews-external-prev';
    next.className='reviews-external-arrow reviews-external-next';
    prev.innerHTML='&#10094;';
    next.innerHTML='&#10095;';
    nav.append(prev,next);

    track.classList.remove('reviews-marquee-track');
    track.style.animation='none';
    track.style.transition='none';
    track.style.transform='translate3d(0,0,0)';

    const flatten=()=>{
      const group=track.querySelector('.reviews-loop-group');
      if(group){
        const cards=[...group.children].filter(el=>el.classList.contains('review-card'));
        if(cards.length) track.replaceChildren(...cards);
      }
      return [...track.children].filter(el=>el.classList.contains('review-card'));
    };

    let busy=false;
    const step=dir=>{
      if(busy) return;
      const cards=flatten();
      if(cards.length<2) return;
      const first=cards[0];
      const gap=parseFloat(getComputedStyle(track).gap||'18')||18;
      const d=first.getBoundingClientRect().width+gap;
      busy=true;
      if(dir>0){
        track.style.transition='transform 300ms ease';
        requestAnimationFrame(()=>track.style.transform=`translate3d(-${d}px,0,0)`);
        setTimeout(()=>{
          const now=flatten();
          if(now.length>1) track.appendChild(now[0]);
          track.style.transition='none';
          track.style.transform='translate3d(0,0,0)';
          busy=false;
        },330);
      }else{
        const last=cards[cards.length-1];
        track.insertBefore(last,cards[0]);
        track.style.transition='none';
        track.style.transform=`translate3d(-${d}px,0,0)`;
        void track.offsetWidth;
        track.style.transition='transform 300ms ease';
        requestAnimationFrame(()=>track.style.transform='translate3d(0,0,0)');
        setTimeout(()=>{
          track.style.transition='none';
          busy=false;
        },330);
      }
    };

    prev.onclick=()=>step(-1);
    next.onclick=()=>step(1);
    const update=()=>{
      const disabled=flatten().length<2;
      prev.hidden=disabled;
      next.hidden=disabled;
    };
    update();
    new MutationObserver(()=>{if(!busy) update();}).observe(track,{childList:true,subtree:true});
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
