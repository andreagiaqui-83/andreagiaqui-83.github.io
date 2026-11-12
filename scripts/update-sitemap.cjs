// Deterministic dates: navigation/footer-only edits do not pretend the page content is new.
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const file='scripts/sitemap-content.json',state=JSON.parse(fs.readFileSync(file,'utf8')),check=process.argv.includes('--check');
const dateArg=process.argv.find(a=>a.startsWith('--date=')),date=dateArg?.slice(7);
if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Use an actual content-change date: YYYY-MM-DD');
for(const row of state){
 const d=new JSDOM(fs.readFileSync(row.file,'utf8')).window.document;
 const semantic=d.querySelector('main').innerHTML+['title','meta[name=description]','link[rel=canonical]'].map(sel=>d.querySelector(sel)?.outerHTML||'').join('')+[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>n.outerHTML).join('');
 const hash=crypto.createHash('sha256').update(semantic).digest('hex');
 if(row.contentHash!==hash){if(!date||check)throw Error('Content changed: '+row.file+'; update with --date=YYYY-MM-DD');row.contentHash=hash;row.lastmod=date;}
}
const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+state.map(r=>`  <url><loc>${r.url}</loc><lastmod>${r.lastmod}</lastmod></url>`).join('\n')+'\n</urlset>\n';
if(check){if(fs.readFileSync('sitemap.xml','utf8')!==xml)throw Error('Sitemap out of sync');}else{fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n');fs.writeFileSync('sitemap.xml',xml);}
console.log('Sitemap: '+state.length+' canonical pages; no build-time dates.');
