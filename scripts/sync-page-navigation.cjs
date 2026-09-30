// Explicit parent links: work on direct visits and without browser history or JavaScript.
'use strict';
const fs=require('node:fs');
const entries=JSON.parse(fs.readFileSync('scripts/site-pages.json','utf8'));
const check=process.argv.includes('--check');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
let count=0;
for(const entry of entries){
 const before=fs.readFileSync(entry.file,'utf8');let after=before;
 const homeLink='<a class="page-back-button" data-home-link href="/" aria-label="Home — torna alla pagina principale di Andrea Giaquinto"><span aria-hidden="true">←</span><span>Home</span></a>';
 after=after.replace(/<nav\b[^>]*class="[^"]*\bbreadcrumb\b[^"]*"[^>]*>[\s\S]*?<\/nav>/g,nav=>nav.replace(/<a\b[^>]*href="(?:\/|https:\/\/andreagiaquinto\.it\/)"[^>]*>[\s\S]*?<\/a>/,()=>homeLink));
 if(entry.kind==='landing'){
  if(after!==before){if(check)throw new Error('Home non sincronizzata: '+entry.file);fs.writeFileSync(entry.file,after);}
  continue;
 }
 if(!entry.parent || !entry.parent.label || !entry.parent.href)throw new Error('Pagina senza destinazione di ritorno: '+entry.file);
 const u=new URL(entry.parent.href,'https://andreagiaquinto.it');
 if(u.origin!=='https://andreagiaquinto.it'||u.username||u.password)throw new Error('Destinazione esterna non ammessa: '+entry.file);
 for(const position of ['top','bottom']){
  const legacy=position==='top'&&entry.file.includes('YQArch_Italiano_3.64_GUIDA')?' guide-back':'';
  const block=`<!-- PAGE-RETURN-${position}:START --><div class="page-return page-return-${position}" data-page-return="${position}"><a class="page-back-button${legacy}" ${u.pathname==='/'?'data-home-link aria-label="Home — torna alla pagina principale di Andrea Giaquinto" ':''}href="${escape(entry.parent.href)}"><span aria-hidden="true">←</span><span>${escape(entry.parent.label)}</span></a></div><!-- PAGE-RETURN-${position}:END -->`;
  const pattern=new RegExp(`<!-- PAGE-RETURN-${position}:START -->[\\s\\S]*?<!-- PAGE-RETURN-${position}:END -->`,'g');
  if(pattern.test(after)){pattern.lastIndex=0;after=after.replace(pattern,()=>block);}
  else if(position==='top'){
   const old=/<a\b[^>]*class="guide-back"[^>]*>[\s\S]*?<\/a>/;
   if(old.test(after))after=after.replace(old,()=>block);
   else {if(!/<h1\b/.test(after))throw new Error('Titolo principale assente: '+entry.file);after=after.replace(/<h1\b/,()=>block+'<h1');}
  } else {
   if(!after.includes('</main>'))throw new Error('Contenuto principale assente: '+entry.file);
   after=after.replace('</main>',()=>block+'</main>');
  }
 }
 if(after!==before){if(check)throw new Error('Navigazione non sincronizzata: '+entry.file);fs.writeFileSync(entry.file,after);}
 count++;
}
console.log('Navigazione di ritorno: '+count+' pagine verificate.');
