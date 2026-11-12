'use strict';
const fs=require('node:fs');
const release=JSON.parse(fs.readFileSync('downloads/releases.json','utf8')).find(r=>r.project==='ag-cad-tools');
if(!release)throw Error('Missing authoritative release');
const origin='https://andreagiaquinto.it';
const data={name:'AG CAD Tools',version:release.version,datePublished:release.date,downloadUrl:origin+release.file,sha256:release.sha256,sizeBytes:release.bytes,price:0,priceCurrency:'EUR',language:'it',operatingSystem:'Windows x64',softwareRequirements:'AutoCAD completo 2024–2027 per Windows x64',authorVerifiedEnvironment:'AutoCAD 2027 italiano su Windows 11',verificationScope:release.status,url:origin+'/ag-cad-tools/',documentationUrl:origin+'/downloads/ag-cad-tools/AG_CAD_Tools_Help.html',compatibilityUrl:origin+'/downloads/ag-cad-tools/AG_CAD_Tools_Compatibilita.html'};
const out=JSON.stringify(data,null,2)+'\n',file='ag-cad-tools/release.json';
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==out)throw Error('Release metadata out of date');}else fs.writeFileSync(file,out);
console.log('Release metadata matches downloads/releases.json');
