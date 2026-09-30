from pathlib import Path
import subprocess
assert subprocess.check_output(['git','branch','--show-current'],text=True).strip()=='revisione-landing-20260930'
p=Path('scripts/qa-landing-20260930.cjs');s=p.read_text()
old="res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));"
new="const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);"
assert s.count(old)==1 or new in s
s=s.replace(old,new)
old='(async()=>{const report=[];try{'
new="(async()=>{const report=[];try{\n if(!live){const missing=await fetch(base+'/__qa_missing_resource__.txt');assert.equal(missing.status,404,'Test server must handle absent files without crashing');}"
if '__qa_missing_resource__' not in s:
 assert old in s;s=s.replace(old,new)
p.write_text(s)
p=Path('index.html');s=p.read_text()
for old in ['Architettura contemporanea illustrativa e servizi CAD, BIM e render di Andrea Giaquinto','Architettura contemporanea illustrativa e servizi CAD/BIM e render']:
 s=s.replace(old,'Render architettonico di una casa contemporanea con giardino e vetrate')
p.write_text(s)
p=Path('AGENTS.md');s=p.read_text().replace('I test impediscono pubblicazioni senza destinazione di ritorno.','I test devono essere superati prima della pubblicazione; ogni pagina secondaria deve avere una destinazione di ritorno valida.');p.write_text(s)
print('Test-server 404 handling fixed; social image alternatives describe the actual image.')
