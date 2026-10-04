'use strict';
const fs=require('node:fs');
const entries=JSON.parse(fs.readFileSync('scripts/site-pages.json','utf8'));
for(const entry of entries){
 const before=fs.readFileSync(entry.file,'utf8');
 const after=before.replace(/<!-- PAGE-RETURN-(?:top|bottom):START -->[\s\S]*?<!-- PAGE-RETURN-(?:top|bottom):END -->/g,'').replace(/<nav\b[^>]*class="[^"]*\bbreadcrumb\b[^"]*"[^>]*>[\s\S]*?<\/nav>/g,'').replace(/<a\b[^>]*class="(?:guide-back|page-back-button)[^"]*"[^>]*>[\s\S]*?<\/a>/g,'');
 if(after!==before){if(process.argv.includes('--check'))throw Error('Ritorno ridondante: '+entry.file);fs.writeFileSync(entry.file,after);}
}
console.log('Navigazione globale: nessun ritorno ridondante in '+entries.length+' pagine.');
