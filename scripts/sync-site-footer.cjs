// Keep crawlable footer HTML and functioning cookie controls in every public page.
const fs=require('node:fs');
const files=JSON.parse(fs.readFileSync('scripts/site-pages.json','utf8')).map(page=>page.file);
const footer=fs.readFileSync('partials/site-footer.html','utf8').trim();
const css='<link rel="stylesheet" href="/assets/site-footer.css?v=20260930-r2">';
const check=process.argv.includes('--check');
for(const file of files){const before=fs.readFileSync(file,'utf8');let after=before;
 if(/<footer\b[\s\S]*?<\/footer>/.test(after))after=after.replace(/<footer\b[\s\S]*?<\/footer>/,()=>footer);
 else after=after.replace('</body>',()=>footer+'\n</body>');
 after=after.replace(/<link\b[^>]*href="\/assets\/site-footer\.css[^>]*>\s*/g,'');
 if(!/src="[^"\s]*assets\/measurement\.js/.test(after)){
  if(!/href="[^"\s]*assets\/consent\.css/.test(after))after=after.replace('</head>','<link rel="stylesheet" href="/assets/consent.css?v=17"></head>');
  after=after.replace('</body>','<script defer src="/assets/measurement-config.js?v=ga4-20260917"></script><script defer src="/assets/measurement.js?v=20260920-services-ads"></script></body>');
 }
 after=after.replace('</head>',css+'</head>');
 if(after!==before){if(check)throw new Error('Footer non sincronizzato: '+file);fs.writeFileSync(file,after);}
}
console.log('Footer condiviso: '+files.length+' pagine sincronizzate.');
