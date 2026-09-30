# Reviewed, branch-restricted migration. Never publishes main or changes binary assets.
from pathlib import Path
from bs4 import BeautifulSoup
import re,json,subprocess,sys
R=Path.cwd()
assert subprocess.check_output(['git','branch','--show-current'],text=True).strip()=='revisione-landing-20260930'
if '20260930-services-r7' in (R/'index.html').read_text():
 print('Revision already applied; no historical content overwritten.');sys.exit(0)
def replace(file,old,new,count=1):
 p=R/file;s=p.read_text();n=s.count(old);assert n==count,(file,old[:95],n,count);p.write_text(s.replace(old,new))
def put(file,text):
 p=R/file;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
# Protect all unrelated production code, prices, downloads and visual assets.
protected=['cloudflare-worker','assets/measurement.js','assets/measurement-config.js','assets/consent.css','assets/services/services.js','downloads/releases.json']
assert not subprocess.check_output(['git','diff','4256fc2b2badccf910dd4d70af918df209443d22','--',*protected]).strip()
p=R/'partials/site-footer.html';s=p.read_text();s,n=re.subn(r'<a\b[^>]*class="sf-social-link"[^>]*href="https://www\.linkedin\.com/[^>]*>.*?</a>','',s,flags=re.S);assert n==1;p.write_text(s)
for f,a,b in [
 ('index.html','Rappresentazione illustrativa dei servizi','Dal disegno tecnico alla visualizzazione degli spazi.'),
 ('index.html','Illustrazione del processo. Gli elaborati vengono sviluppati','Gli elaborati vengono sviluppati'),
 ('index.html','Visualizzazione illustrativa · Esterni, materiali e luce','Architettura contemporanea: materiali, luce e dettagli.'),
 ('index.html','Visualizzazione architettonica illustrativa di una casa','Render architettonico di una casa'),
 ('index.html','Immagini illustrative delle atmosfere: le proposte vengono sviluppate sul tuo ambiente e sul materiale disponibile.','Quattro atmosfere d’interni, da sviluppare sul tuo ambiente e sul materiale disponibile.'),
 ('lezioni-autocad/index.html','Illustrazione concettuale del percorso 2D → 3D.','Dal disegno 2D al modello 3D.'),
 ('yqarch-italiano/index.html','Architettura, spazi e dettagli. Visualizzazione illustrativa.','Architettura, spazi e dettagli.'),
 ('express-tools-italiano/index.html','Precisione e organizzazione nel disegno CAD. Immagine illustrativa.','Precisione e organizzazione nel disegno CAD.')]:replace(f,a,b)
replace('index.html','Atmosfera illustrativa ','Atmosfera d’arredo ',4)
s=(R/'index.html').read_text();m=re.search(r'<section\b[^>]*id="render"[^>]*>.*?</section>',s,re.S);assert m
figure=re.search(r'<figure\b.*?</figure>',m.group(),re.S).group()
render='''<section class="section render-section" id="render" aria-labelledby="renderTitleHeading">
<div class="wrap render-layout">
  <div class="render-copy">
    <p class="eyebrow">IMMOBILI DA PRESENTARE, VALORIZZARE E RIPENSARE</p>
    <h2 id="renderTitleHeading">Render e planimetrie per valorizzare i tuoi immobili</h2>
    <p class="lead">Rendi più chiari gli spazi, presenta le possibilità.</p>
    <p>Realizzo planimetrie 2D e 3D, render fotorealistici e proposte d’arredo per <strong>agenzie immobiliari, property manager, proprietari, imprese e piccoli studi</strong>.</p>
    <p>Elaborati su misura per presentare un immobile in vendita o in affitto, promuoverlo con immagini curate e confrontare soluzioni di arredamento o ristrutturazione.</p>
    <a class="button light" data-cta="render_cta" data-service="Render fotorealistici / viste prospettiche" href="#modulo">Richiedi preventivo gratuito <span aria-hidden="true">↗</span></a>
    <p class="micro">Invia ciò che hai già: planimetrie, fotografie, misure o modelli. Materiale facoltativo, valutazione personale.</p>
  </div>
  '''+figure+'''
</div>
<div class="wrap property-offer">
  <div class="property-services">
    <article class="property-service" id="planimetrie-commerciali">
      <span class="property-number" aria-hidden="true">01</span><h3>Planimetrie commerciali 2D</h3>
      <p>Ridisegno planimetrie pulite e leggibili, anche arredate e colorate, a partire dal materiale disponibile. Una grafica chiara per mostrare la distribuzione degli ambienti in annunci immobiliari, brochure e presentazioni.</p>
      <p class="property-benefit">Per leggere subito l’organizzazione degli spazi.</p>
    </article>
    <article class="property-service" id="planimetrie-3d">
      <span class="property-number" aria-hidden="true">02</span><h3>Planimetrie 3D arredate</h3>
      <p>Una vista tridimensionale d’insieme con arredi, materiali e distribuzione degli ambienti. Le geometrie vengono sviluppate sulla base delle misure e dei riferimenti disponibili, per presentare l’immobile in modo comprensibile.</p>
      <p class="property-benefit">Per mostrare come gli ambienti si collegano.</p>
    </article>
    <article class="property-service">
      <span class="property-number" aria-hidden="true">03</span><h3>Render fotorealistici di interni ed esterni</h3>
      <p>Dal soggiorno alla cucina e al bagno: immagini con materiali, illuminazione e inquadrature concordati. Viste utili a presentare un progetto, confrontare finiture e visualizzare una proposta prima di realizzarla.</p>
      <p class="property-benefit">Per valutare le soluzioni e comunicarle con chiarezza.</p>
    </article>
    <article class="property-service" id="virtual-staging">
      <span class="property-number" aria-hidden="true">04</span><h3>Virtual staging e prima/dopo</h3>
      <p>Proposte digitali di arredo inserite negli ambienti fotografati, con controllo di geometrie e proporzioni documentate. Per le ristrutturazioni preparo confronti fra stato attuale e proposta, distinguendo ciò che esiste dalle modifiche ipotizzate.</p>
      <p class="property-benefit">Per presentare il potenziale degli spazi, senza equivoci.</p>
    </article>
  </div>
  <div class="property-extras">
    <div><h3>Un referente anche per più immobili</h3><p>Gestisci più annunci o presenti immobili per i tuoi clienti? Concordiamo uno stile grafico coerente per planimetrie, render e presentazioni. Puoi richiedere un singolo lavoro oppure valutare una collaborazione continuativa.</p></div>
    <div><h3>Brevi video e walkthrough</h3><p>Su richiesta, preparo presentazioni video e brevi percorsi virtuali. Durata, inquadrature, materiali di partenza, formato e importo vengono definiti nel preventivo, in base all’utilizzo previsto.</p></div>
  </div>
  <p class="property-other">Realizzo anche <strong>render architettonici e di prodotto, viste di oggetti, prospetti e sezioni render</strong>. Per edifici reali, foto del contesto e riferimenti geografici aiutano a definire la proposta.</p>
  <div class="property-close"><p>Hai un immobile da presentare o un ambiente da ripensare?<br><strong>Indicami che cosa ti serve e dove userai gli elaborati.</strong></p><a class="button light" data-cta="render_property_quote" data-service="Render fotorealistici / viste prospettiche" href="#modulo">Parliamo del tuo immobile <span aria-hidden="true">↗</span></a></div>
  <p class="property-note">Preventivo gratuito e senza impegno. Consegne, tempi e costo concordati prima di iniziare. Le immagini di proposta non documentano lavori già realizzati.</p>
</div>
</section>'''
s=s[:m.start()]+render+s[m.end():];(R/'index.html').write_text(s)
replace('index.html','<div class="interior-grid">','<p class="interior-intro">Layout d’arredo, moodboard e render per confrontare distribuzione, colori, materiali e illuminazione: un supporto per ripensare la casa, presentare una proposta al cliente o definire l’atmosfera di un immobile.</p><div class="interior-grid">')
replace('index.html','Colori, finiture, pavimenti, arredi da mantenere o elementi da evitare: nel modulo puoi raccontare liberamente le tue preferenze.','Hai arredi da mantenere, materiali preferiti o uno stile diverso in mente? Nel modulo puoi indicare colori, finiture, pavimenti ed elementi da valorizzare o evitare: queste indicazioni guideranno la proposta per i tuoi ambienti.')
replace('index.html','<p>Prospetti e viste 3D render di edifici e oggetti, con materiali, luci e inquadrature curati. Puoi richiedere anche sezioni render.</p>','<p>Render di edifici e oggetti, planimetrie commerciali 2D/3D e virtual staging. Immagini curate per annunci, presentazioni e progetti; anche prospetti e sezioni render.</p>')
replace('index.html','<span>Render: viste, prospetti e sezioni</span>','<span>Render, planimetrie e virtual staging</span>')
replace('index.html','Quali render desideri?','Quali elaborati visuali desideri?')
replace('index.html','Puoi selezionare più opzioni. Per sezioni render o altre inquadrature, scegli “Altro” e descrivi la richiesta al passaggio 3.','Puoi selezionare più opzioni. Per sezioni render o richieste particolari, scegli “Altro” e descrivi il lavoro al passaggio 3. Planimetrie commerciali per annunci e presentazioni; il supporto DOCFA resta un servizio distinto.')
s=(R/'index.html').read_text();m=re.search(r'<section\b[^>]*id="renderPreferences"[^>]*>.*?</section>',s,re.S);assert m
new_options=''.join('<label class="output-option"><input disabled="" name="Render_viste[]" type="checkbox" value="'+x+'"/><span>'+x+'</span></label>' for x in ['Interni, cucina o bagno','Planimetria commerciale 2D','Planimetria 3D arredata','Virtual staging','Prima/dopo ristrutturazione','Video / walkthrough breve'])
section=m.group();needle=re.search(r'<label class="output-option"><input[^>]*name="Render_viste\[\]"[^>]*value="Altro"[^>]*>.*?</label>',section,re.S).group();section=section.replace(needle,new_options+needle)
s=s[:m.start()]+section+s[m.end():];(R/'index.html').write_text(s)
replace('index.html','Indica gli elaborati desiderati, i m² lordi di ciascun piano, il numero di prospetti/sezioni, render o piante di Interior Design ed eventuali copie PDF, se già noti.','Indica gli elaborati e l’uso previsto: annuncio di vendita/affitto, presentazione, arredo o ristrutturazione. Per i disegni tecnici, aggiungi m² lordi per piano e numero di prospetti/sezioni, se noti. Puoi richiedere anche copie PDF.')
faq_items=[
 ('faq-immobili','Lavori anche con agenzie immobiliari e property manager?','Sì. Realizzo planimetrie commerciali 2D e 3D arredate, render fotorealistici, virtual staging e contenuti visuali per agenzie immobiliari, property manager, proprietari, imprese e piccoli studi. Puoi richiedere elaborati per un singolo immobile oppure concordare uno stile coordinato per più annunci e presentazioni. Brevi video e walkthrough sono valutati su richiesta, con attività e importo definiti nel preventivo.'),
 ('faq-virtual-staging','Che differenza c’è tra virtual staging e proposta di ristrutturazione?','Il virtual staging presenta una proposta digitale di arredo negli ambienti fotografati, rispettando geometrie e proporzioni documentate. Una proposta di ristrutturazione può invece ipotizzare modifiche a finiture, pareti o distribuzione, da valutare con i professionisti incaricati. Nei confronti prima/dopo distinguo lo stato attuale dalla proposta: un’immagine di progetto non documenta lavori già eseguiti.'),
 ('faq-planimetrie-commerciali','A che cosa servono le planimetrie commerciali?','Sono elaborate per rendere leggibili gli spazi in annunci immobiliari, brochure e presentazioni. Possono essere pulite, arredate, colorate o rappresentate in 3D, in base al materiale disponibile e all’uso previsto. Il supporto grafico per planimetrie DOCFA è un servizio distinto, da concordare secondo i dati e le indicazioni del professionista incaricato.')]
s=(R/'index.html').read_text();fm=re.search(r'<section\b[^>]*id="faq"[^>]*>.*?</section>',s,re.S);assert fm
pos=fm.start()+fm.group().rfind('</details>')+len('</details>');html=''.join(f'<details id="{id}"><summary>{q}</summary><p>{a}</p></details>' for id,q,a in faq_items);s=s[:pos]+html+s[pos:]
m=re.search(r'(<script[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)',s,re.S);graph=json.loads(m.group(2));ss=BeautifulSoup(s,'html.parser')
for obj in graph['@graph']:
 if obj.get('@type')=='FAQPage':obj['mainEntity']=[{'@type':'Question','name':d.summary.get_text(),'acceptedAnswer':{'@type':'Answer','text':re.sub(r'\s+',' ',(d.select_one('.faq-answer') or d.p).get_text()).strip()}} for d in ss.select('#faq details')]
 if obj.get('@type')=='WebPage':obj['dateModified']='2026-09-30'
 if obj.get('@id')=='https://andreagiaquinto.it/#service-render-card':obj['description']='Render di edifici e oggetti, planimetrie commerciali 2D/3D e virtual staging. Immagini per annunci, presentazioni e progetti; anche prospetti e sezioni render.'
 if obj.get('@id')=='https://andreagiaquinto.it/#service-interior-card':obj['description']='Layout d’arredo, moodboard e render per confrontare distribuzione, colori, materiali e illuminazione. Quattro direzioni stilistiche e una quinta personalizzata facoltativa; ogni render o pianta richiesta costa 10 €, con numero di elaborati concordato.'
 if obj.get('@type')=='ProfessionalService':obj['description']='Supporto freelance CAD e BIM online in tutta Italia: AutoCAD 2D/3D, Revit/BIM, disegno meccanico, supporto grafico DOCFA, nuvole di punti, render e Interior Design. Planimetrie commerciali, virtual staging e presentazioni di immobili per agenzie, property manager, proprietari, imprese e studi. Incarichi e formati concordati con preventivo personalizzato.'
for id,name,desc in [
 ('planimetrie-commerciali','Planimetrie commerciali 2D','Ridisegno di planimetrie pulite, arredate e colorate per annunci immobiliari, brochure e presentazioni.'),
 ('planimetrie-3d','Planimetrie 3D arredate','Viste tridimensionali degli ambienti con arredi e materiali, sulla base di misure e riferimenti disponibili.'),
 ('virtual-staging','Virtual staging e prima/dopo','Proposte digitali di arredo e confronti fra stato attuale e ipotesi di ristrutturazione, con controllo di geometrie e proporzioni documentate.')]:graph['@graph'].append({'@type':'Service','@id':'https://andreagiaquinto.it/#service-'+id,'name':name,'serviceType':name,'description':desc,'provider':{'@id':'https://andreagiaquinto.it/#servizio'},'areaServed':'Italia','url':'https://andreagiaquinto.it/#'+id})
s=s[:m.start(2)]+json.dumps(graph,ensure_ascii=False,separators=(',',':'))+s[m.end(2):];(R/'index.html').write_text(s)
p=R/'assets/services/services.css';p.write_text(p.read_text()+'''
/* Offerta immobiliare — 30 settembre 2026. Nessun nuovo asset o script di pagina. */
.render-layout{grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}
.render-copy h2{font-size:clamp(34px,3.25vw,46px);line-height:1.12}
.render-copy strong{color:#f7faf9}.render-copy .micro{margin:16px 0 0;font-size:13px}
.render-visual{min-width:0}.property-offer{margin-top:44px}
.property-services{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.property-service{min-width:0;padding:28px;border:1px solid #35505f;border-radius:16px;background:#132f40}
.property-number{display:block;color:#b5efca;font-size:12px;letter-spacing:.12em;font-weight:750;margin-bottom:14px}
.property-service h3{color:#f7faf9;font-size:23px;line-height:1.3;margin-bottom:14px}
.property-service p,.property-extras p{color:#c9d8df;font-size:15px;line-height:1.7}
.property-service .property-benefit{color:#b5efca;font-size:14px;margin:18px 0 0}
.property-extras{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:36px;padding-block:34px;border-bottom:1px solid #35505f}
.property-extras h3{font-size:21px;color:#f7faf9}.property-extras p{margin:0}
.property-other{font-size:14px;line-height:1.75;color:#c9d8df;margin:24px 0 30px}.property-other strong{color:#edf5f6}
.property-close{display:flex;justify-content:space-between;align-items:center;gap:28px}.property-close p{margin:0;font-size:16px;color:#c9d8df}.property-close strong{color:#f7faf9}.property-close .button{flex-shrink:0}
.property-note{font-size:13px;line-height:1.7;color:#becdd5;margin:20px 0 0;max-width:820px}
.interior-intro{max-width:880px;margin:0 0 28px;color:var(--muted);font-size:16px;line-height:1.7}
@media(max-width:900px){.render-layout{gap:30px}.property-service{padding:24px}.property-close{align-items:flex-start;flex-direction:column;gap:20px}}
@media(max-width:800px){.render-layout{grid-template-columns:1fr}.render-visual{max-width:680px;width:100%}.render-copy{max-width:680px}.render-copy h2{font-size:clamp(32px,6vw,44px)}}
@media(max-width:600px){.property-services,.property-extras{grid-template-columns:1fr}.property-service{padding:23px 20px}.property-service h3{font-size:22px}.property-offer{margin-top:30px}.property-extras{gap:28px;padding-block:28px}.property-close .button{width:100%}.property-close br{display:none}.property-close strong::before{content:' '}.property-note{font-size:13px}.interior-intro{font-size:15px}.render-copy .button{max-width:100%}}
''')
builds={'20260927-services-r6':'20260930-services-r7','20260927-autocad-v17.8':'20260930-autocad-v17.9','20260927-plugins-r4':'20260930-plugins-r5','20260927-guides-r2':'20260930-guides-r3'}
for f in ['index.html','lezioni-autocad/index.html','yqarch-italiano/index.html','express-tools-italiano/index.html','express-tools-italiano/guida/index.html','downloads/yqarch/YQArch_Italiano_3.64_GUIDA.html','.github/scripts/site_consistency_qa.cjs','.github/scripts/plugins_qa.cjs','.github/scripts/services_qa.py']:
 p=R/f;t=p.read_text()
 for a,b in builds.items():t=t.replace(a,b)
 p.write_text(t)
replace('index.html','/assets/services/services.css?v=20260927-r6','/assets/services/services.css?v=20260930-r7')
f='downloads/express-tools/Express_Tools_Italiano_3.2-rc1_Report.html';replace(f,'<html lang="it"><meta','<html lang="it"><head><meta');replace(f,'</style><main>','</style></head><body data-page-type="plugin-report"><main>');replace(f,'</main></html>','</main></body></html>')
entries=[{'file':f,'kind':'landing'} for f in ['index.html','lezioni-autocad/index.html','yqarch-italiano/index.html','express-tools-italiano/index.html']]
for f,kind,href,label in [
 ('express-tools-italiano/guida/index.html','guide','/express-tools-italiano/','Torna a Express Tools Italiano'),
 ('downloads/yqarch/YQArch_Italiano_3.64_GUIDA.html','guide','https://andreagiaquinto.it/yqarch-italiano/','Torna a YQArch Italiano'),
 ('downloads/yqarch/YQArch_Italiano_3.64_REPORT.html','report','https://andreagiaquinto.it/yqarch-italiano/','Torna a YQArch Italiano'),
 ('downloads/express-tools/Express_Tools_Italiano_3.2-rc1_Report.html','report','https://andreagiaquinto.it/express-tools-italiano/','Torna a Express Tools Italiano'),
 ('privacy/index.html','service','/','Torna ai servizi di Andrea'),('404.html','service','/','Torna alla pagina principale'),
 ('report-google/index.html','service','/','Torna al sito principale'),('report-google/privacy/index.html','service','/report-google/','Torna a Report Google'),('report-google/termini/index.html','service','/report-google/','Torna a Report Google')]:entries.append({'file':f,'kind':kind,'parent':{'href':href,'label':label}})
put('scripts/site-pages.json',json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
put('scripts/sync-page-navigation.cjs',r'''// Explicit parent links: work on direct visits and without browser history or JavaScript.
'use strict';
const fs=require('node:fs');
const entries=JSON.parse(fs.readFileSync('scripts/site-pages.json','utf8'));
const check=process.argv.includes('--check');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
let count=0;
for(const entry of entries){
 if(entry.kind==='landing')continue;
 if(!entry.parent || !entry.parent.label || !entry.parent.href)throw new Error('Pagina senza destinazione di ritorno: '+entry.file);
 const u=new URL(entry.parent.href,'https://andreagiaquinto.it');
 if(u.origin!=='https://andreagiaquinto.it'||u.username||u.password)throw new Error('Destinazione esterna non ammessa: '+entry.file);
 const before=fs.readFileSync(entry.file,'utf8');let after=before;
 for(const position of ['top','bottom']){
  const legacy=position==='top'&&entry.file.includes('YQArch_Italiano_3.64_GUIDA')?' guide-back':'';
  const block=`<!-- PAGE-RETURN-${position}:START --><div class="page-return page-return-${position}" data-page-return="${position}"><a class="page-back-button${legacy}" href="${escape(entry.parent.href)}"><span aria-hidden="true">←</span><span>${escape(entry.parent.label)}</span></a></div><!-- PAGE-RETURN-${position}:END -->`;
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
''')
put('scripts/sync-site-footer.cjs',r'''// Keep crawlable footer HTML and functioning cookie controls in every public page.
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
''')
p=R/'assets/site-footer.css';p.write_text(p.read_text()+'''
/* Secondary pages: prominent static parent links, never history.back(). */
.page-return{display:block;position:static;max-width:100%;clear:both;text-align:left}
.page-return-top{margin:0 0 24px}.page-return-bottom{margin:36px 0 12px;padding-top:22px;border-top:1px solid #b9cbd0}
.page-return .page-back-button{display:inline-flex;align-items:center;justify-content:flex-start;gap:10px;box-sizing:border-box;min-height:48px;max-width:100%;padding:12px 18px;margin:0;border:1px solid #0e6572;border-radius:9px;background:#0e6572;color:#fff;font:650 15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:normal;text-decoration:none;white-space:normal;overflow-wrap:anywhere;text-align:left}
.page-return .page-back-button:hover{background:#104a55;color:#fff;border-color:#104a55}
.page-return .page-back-button:focus-visible{outline:3px solid #ad5700;outline-offset:4px}
.page-return .page-back-button>span:first-child{flex-shrink:0;font-size:20px}
.page-return .page-back-button>span:last-child{min-width:0}
@media(max-width:600px){.page-return .page-back-button{font-size:14px;padding:12px 15px;min-height:48px}.page-return-bottom{margin-top:28px}}
@media print{.page-return{display:none}}
''')
for f in ['downloads/yqarch/YQArch_Italiano_3.64_REPORT.html','downloads/express-tools/Express_Tools_Italiano_3.2-rc1_Report.html']:
 p=R/f;t=p.read_text();t=re.sub(r'(<table\b[\s\S]*?</table>)',lambda m:'<div class="report-table-scroll" role="region" tabindex="0" aria-label="Tabella tecnica, scorribile orizzontalmente">'+m.group(1)+'</div>',t)
 css='<style>.report-table-scroll{max-width:100%;overflow-x:auto;margin:18px 0}.report-table-scroll:focus-visible{outline:3px solid #ad5700;outline-offset:3px}.report-table-scroll table{margin:0}main{min-width:0}pre{max-width:100%;overflow:auto}code{overflow-wrap:anywhere}body>.site-footer .sf-wrap{width:calc(100% - 36px)}@media(max-width:600px){body{overflow-wrap:anywhere}h1{font-size:clamp(24px,7vw,36px)}}.report-table-scroll:focus{outline-offset:2px}</style>'
 t=t.replace('</head>',css+'</head>');p.write_text(t)
p=R/'AGENTS.md';t=p.read_text().replace('WhatsApp, Facebook e LinkedIn con icone e link verificati','WhatsApp e Facebook con icone e link verificati (nessun pulsante LinkedIn nel footer)').replace('usare didascalie illustrative senza indicazioni sull’IA','usare didascalie descrittive senza diciture «illustrativa» o riferimenti all’IA')
t+='''
## Continuità e navigazione — direttiva del 30 settembre 2026
- Conservare la baseline avanzata delle quattro landing e le tariffe pubblicate. Non estendere la tariffa di 10 € a video, walkthrough o pacchetti; tali attività sono concordate nel preventivo.
- Il footer non include «Seguimi su LinkedIn». Conservare gli altri contatti e i riferimenti all’identità nei dati strutturati, salvo nuova richiesta.
- Eliminare nelle didascalie «immagine illustrativa», formule equivalenti e riferimenti all’IA. Distinguere comunque stato attuale e proposta; non presentare un render come lavoro già realizzato.
- Ogni pagina secondaria, guida o rapporto deve dichiarare la pagina di riferimento in `scripts/site-pages.json` e includere pulsanti di ritorno ben visibili in alto e in basso. Usare link HTML espliciti e descrittivi, non `history.back()` o referrer non verificati.
- Dopo aggiunte o aggiornamenti eseguire `node scripts/sync-page-navigation.cjs` e `node scripts/sync-site-footer.cjs`; registrare tutte le nuove pagine HTML, escluse soltanto verifiche di proprietà e frammenti di template. I test impediscono pubblicazioni senza destinazione di ritorno.
- Home: render e planimetrie commerciali si rivolgono anche ad agenzie, property manager, proprietari, imprese e piccoli studi. Preservare gli altri servizi tecnici, i quattro stili e la quinta proposta. Le nuove preferenze visuali usano il contratto esistente `Render_viste[]`: non modificare nomi/ID o backend senza necessità.
''';p.write_text(t)
p=R/'lezioni-autocad/AGENTS.md';t=p.read_text().replace('Le immagini restano dichiarate illustrative quando non rappresentano schermate o lavori reali.','Le immagini non devono essere presentate come schermate o lavori reali se non lo sono. La direttiva del 30 settembre 2026 richiede didascalie descrittive, senza diciture «illustrativa» o riferimenti all’IA, e il footer senza pulsante LinkedIn.');p.write_text(t)
for f in ['.github/SERVICES-PUBLICATION.md','.github/PLUGINS-PUBLICATION.md']:
 p=R/f;p.write_text(p.read_text()+'''
## Aggiornamento 30 settembre 2026
Footer comune senza pulsante LinkedIn; didascalie descrittive senza formule illustrative o riferimenti IA. Ogni pagina secondaria ha pulsanti statici di ritorno in alto e in basso, con destinazioni registrate in `scripts/site-pages.json`. Tariffe e installer invariati. La home amplia render, planimetrie commerciali e virtual staging senza alterare endpoint, consenso, tracciamento o nomi dei campi. I report tecnici mantengono contenuti e limiti dichiarati; cambiano soltanto navigazione, contenitore responsive delle tabelle e footer.
''')
p=R/'.github/services-publication.json';j=json.loads(p.read_text());j['build']='20260930-services-r7';j['baseline']='4256fc2b2badccf910dd4d70af918df209443d22';j['lessons_unchanged']=False;j['lessons_scope']='footer e didascalia; offerta, modulo, recensioni, backend e tracciamento invariati';j['render_deliverables']+=['planimetrie commerciali 2D','planimetrie 3D arredate','virtual staging controllato','prima/dopo proposta di ristrutturazione','video e walkthrough brevi su preventivo'];p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
p=R/'sitemap.xml';p.write_text(p.read_text().replace('2026-09-27','2026-09-30'))
subprocess.run(['node','scripts/sync-page-navigation.cjs'],check=True);subprocess.run(['node','scripts/sync-site-footer.cjs'],check=True)
# Assert that tariff markup and original download bytes did not change.
old=BeautifulSoup(subprocess.check_output(['git','show','4256fc2b2badccf910dd4d70af918df209443d22:index.html']),'html.parser');new=BeautifulSoup((R/'index.html').read_text(),'html.parser')
assert str(old.select_one('#tariffe'))==str(new.select_one('#tariffe'))
assert old.select_one('#faq-tariffe').get_text()==new.select_one('#faq-tariffe').get_text()
assert not subprocess.check_output(['git','diff','4256fc2b2badccf910dd4d70af918df209443d22','--','downloads/*.exe','downloads/*/*.exe',*protected]).strip()
print('Reviewed landing revision applied; prices, production code and installers preserved.')
