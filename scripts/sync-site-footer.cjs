// Keep real, crawlable footer HTML in every public page. No runtime include or extra request.
const fs=require('node:fs');
const files=['index.html','lezioni-autocad/index.html','yqarch-italiano/index.html','express-tools-italiano/index.html','privacy/index.html','404.html'];
const footer=fs.readFileSync('partials/site-footer.html','utf8').trim();
const css='<link rel="stylesheet" href="/assets/site-footer.css?v=20260927-r1">';
const check=process.argv.includes('--check');
for(const file of files){const before=fs.readFileSync(file,'utf8');let after=before;
 if(/<footer\b[\s\S]*?<\/footer>/.test(after))after=after.replace(/<footer\b[\s\S]*?<\/footer>/,()=>footer);
 else after=after.replace('</body>',()=>footer+'\n</body>');
 after=after.replace(/<link\b[^>]*href="\/assets\/site-footer\.css[^>]*>\s*/g,'');
 after=after.replace('</head>',css+'</head>');
 if(after!==before){if(check)throw new Error('Footer non sincronizzato: '+file);fs.writeFileSync(file,after);}
}
console.log('Footer condiviso: '+files.length+' pagine sincronizzate.');
