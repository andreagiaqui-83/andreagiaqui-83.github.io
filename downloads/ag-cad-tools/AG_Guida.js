/* Local-only help navigation. Search does not transmit queries. */
(()=>{'use strict';
const q=document.getElementById('q'),scope=document.getElementById('scope'),count=document.getElementById('count');
const cards=[...document.querySelectorAll('[data-command]')],groups=[...document.querySelectorAll('[data-group-section]')];
const normalize=s=>s.toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const index=cards.map(card=>({card,text:normalize(card.textContent+' '+(card.dataset.aliases||''))}));
function filter(){const terms=normalize(q.value.trim()).split(/\s+/).filter(Boolean);let n=0;
index.forEach(({card,text})=>{const show=(!scope.value||card.dataset.group===scope.value)&&terms.every(t=>text.includes(t));card.hidden=!show;if(show)n++;});
document.querySelectorAll('.subgroup').forEach(s=>{s.hidden=![...s.querySelectorAll('[data-command]')].some(c=>!c.hidden);if((terms.length||scope.value)&&!s.hidden)s.open=true;});
groups.forEach(s=>s.hidden=![...s.querySelectorAll('[data-command]')].some(c=>!c.hidden));
count.textContent=n+' schede visibili su '+cards.length+(n===0?'. Prova un nome, un alias o una parola più breve.':'');
}
q.addEventListener('input',filter);scope.addEventListener('change',filter);
document.getElementById('clear').addEventListener('click',()=>{q.value='';scope.value='';filter();q.focus();});
function showAnchor(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}if(!id)return;let el=document.getElementById(id);if(!el)return;
if(el.dataset.target)el=document.getElementById(el.dataset.target)||el;
q.value='';scope.value='';filter();for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
if(el.tagName==='DETAILS')el.open=true;el.scrollIntoView();}
window.addEventListener('hashchange',showAnchor);document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)showAnchor();});

document.getElementById('expand').addEventListener('click',()=>cards.filter(c=>!c.hidden).forEach(c=>{c.open=true;for(let p=c.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;c.querySelectorAll('details').forEach(d=>d.open=true);}));
document.getElementById('collapse').addEventListener('click',()=>cards.filter(c=>!c.hidden).forEach(c=>{c.open=false;c.querySelectorAll('details').forEach(d=>d.open=false);}));
filter();showAnchor();})();
