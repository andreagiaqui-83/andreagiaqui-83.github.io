"""Apply the DOCFA and common Home-navigation revision to baseline 1b6225c only."""
from pathlib import Path
import json,re,subprocess
ROOT=Path.cwd()
def change(name, fn):
 p=ROOT/name; old=p.read_text(encoding='utf-8'); new=fn(old)
 assert new!=old, f'No change: {name}'
 p.write_text(new,encoding='utf-8')
def once(text, old, new):
 assert text.count(old)==1, f'Unexpected match: {old[:100]}'
 return text.replace(old,new,1)
PANEL='''<section class="service-options-panel" id="docfaPreferences" aria-labelledby="docfaTitle" hidden>
<h3 id="docfaTitle">Dati e indicazioni per la planimetria catastale <span class="optional">Facoltativo</span></h3>
<p class="field-help" id="docfaHelp">Descrivi l’unità immobiliare e il disegno da predisporre per DOCFA. Inserisci soltanto i dati già disponibili: ciò che manca sarà chiarito con il professionista incaricato.</p>
<div class="docfa-guidance" id="docfaGuidance">
<p><strong>Identificazione e pratica.</strong> Comune, provincia, eventuale sezione urbana, foglio, particella/mappale e subalterno; eventuali identificativi graffati e categoria nota. Specifica piano, scala di accesso e interno, il tipo di aggiornamento e la causale già individuata dal tecnico. L’indirizzo può essere scritto nel campo dedicato al passaggio 2.</p>
<p><strong>Geometria e stato attuale.</strong> Tutti i piani, destinazioni dei locali, misure e spessori, porte, finestre, accessi e Nord. Indica altezze interne, minime e massime se variabili, porzioni sotto 1,50 m, soppalchi, pertinenze, confini e parti comuni pertinenti.</p>
<p><strong>Materiale disponibile.</strong> Rilievo quotato, disegni CAD/PDF, planimetria catastale precedente, visura ed eventuali elaborato planimetrico ed elenco subalterni. Segnala le modifiche da rappresentare e le indicazioni dell’ufficio competente già ricevute; carica al passaggio 2 solo documenti che sei autorizzato a condividere.</p>
<p><strong>Elaborati da consegnare.</strong> Specifica versione DOCFA, scala e formato A4/A3 concordati con il tecnico, file DXF ed eventuali copie DWG/PDF. Segnala se occorrono anche poligoni per le superfici o un elaborato planimetrico: sono attività da definire, non automaticamente comprese.</p>
</div>
<label for="docfaDetails">Le tue indicazioni catastali e grafiche <span class="optional">facoltative</span></label>
<textarea id="docfaDetails" name="Indicazioni_planimetria_DOCFA" rows="6" maxlength="3000" aria-describedby="docfaHelp docfaScope docfaPrivacy" placeholder="Esempio: appartamento al piano primo, foglio 12, particella 345, subalterno 6, altezza 2,70 m e balcone. Allego rilievo quotato, planimetria precedente e visura. Il tecnico richiede un DXF in scala 1:200, formato A4, per rappresentare la nuova distribuzione interna." disabled></textarea>
<p class="field-help" id="docfaScope"><strong>Supporto grafico per il professionista.</strong> La planimetria catastale è distinta da quella commerciale: rappresentazione essenziale, senza arredi o retini. Verifiche, causale, classamento, firma e presentazione della pratica restano al professionista abilitato incaricato.</p>
<p class="field-help" id="docfaPrivacy">Non inserire credenziali SISTER/SPID, documenti d’identità o dati personali non necessari al disegno. Massimo 3.000 caratteri.</p>
</section>
'''
def home(s):
 s=once(s,'<input type="checkbox" name="Output[]" value="Planimetria DOCFA in AutoCAD">','<input id="docfaSelected" aria-controls="docfaPreferences" aria-expanded="false" type="checkbox" name="Output[]" value="Planimetria DOCFA in AutoCAD">')
 s=once(s,'<section class="service-options-panel" id="renderPreferences"',PANEL+'<section class="service-options-panel" id="renderPreferences"')
 s=s.replace('20260930-services-r8','20260930-services-r9').replace('services.css?v=20260930-r8','services.css?v=20260930-r9').replace('services.js?v=20260930-r3','services.js?v=20260930-r4')
 return s
change('index.html',home)
change('assets/services/services.js',lambda s:once(once(once(once(s,
 "const mechanical=document.getElementById('mechanicalSelected'),other=document.getElementById('otherSelected');",
 "const mechanical=document.getElementById('mechanicalSelected'),other=document.getElementById('otherSelected');\n  const docfa=document.getElementById('docfaSelected');"),
 "showPanel('mechanicalPreferences',!!mechanical?.checked);",
 "showPanel('mechanicalPreferences',!!mechanical?.checked);\n    showPanel('docfaPreferences',!!docfa?.checked);"),
 "mechanical?.setAttribute('aria-expanded',String(mechanical.checked));",
 "mechanical?.setAttribute('aria-expanded',String(mechanical.checked));\n    docfa?.setAttribute('aria-expanded',String(docfa.checked));"),
 "customChoice,mechanical,other,renderCustom].filter(Boolean)","customChoice,mechanical,other,renderCustom,docfa].filter(Boolean)"))
change('cloudflare-worker/src/index.js',lambda s:once(once(s,
 "  Richiesta_personalizzata: 'Richiesta personalizzata',",
 "  Richiesta_personalizzata: 'Richiesta personalizzata',\n  Indicazioni_planimetria_DOCFA: 'Indicazioni per la planimetria catastale DOCFA',"),
 "    Richiesta_personalizzata: outputs.includes('Altro'),",
 "    Richiesta_personalizzata: outputs.includes('Altro'),\n    Indicazioni_planimetria_DOCFA: outputs.includes('Planimetria DOCFA in AutoCAD'),"))
change('assets/services/services.css',lambda s:s+'''
/* DOCFA: concise guidance in the same optional panel as the other services. */
.docfa-guidance{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 24px;margin:18px 0 24px}
.docfa-guidance p{margin:0;font-size:14px;line-height:1.7;overflow-wrap:anywhere}
.docfa-guidance strong{display:block;margin-bottom:4px;color:var(--ink)}
@media(max-width:700px){.docfa-guidance{grid-template-columns:1fr;gap:16px}}
''')
old='''/* Explicit parent link above the hero, also usable without JavaScript. */
.breadcrumb{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 20px;font-size:13px;line-height:1.5;color:#b5c7d5}
.breadcrumb a{display:inline-flex;align-items:center;min-height:44px;padding:8px 12px;border:1px solid #476071;border-radius:8px;color:#d2f8ff;font-weight:700;text-decoration:none}
.breadcrumb a:hover{background:#173e50;color:#fff}.breadcrumb a:focus-visible{outline:3px solid #6eedfa;outline-offset:3px}
'''
change('lezioni-autocad/assets/landing.css',lambda s:once(s,old,'').rstrip()+'\n')
old='.breadcrumb{font-size:13px;color:var(--muted);margin-bottom:30px;display:flex;flex-wrap:wrap;gap:8px}.breadcrumb a{color:var(--muted)}'
change('assets/plugins/plugins.css',lambda s:once(s,old,''))
def navigation_css(s):
 s=s.replace('.page-return .page-back-button','.page-back-button')
 return s+'''
/* One visual language for Home and parent navigation on light and dark pages. */
.breadcrumb{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 24px;color:var(--muted,#50616c);font:400 13px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:normal}
.breadcrumb a:not(.page-back-button){display:inline-flex;align-items:center;min-height:48px;color:inherit;text-underline-offset:4px}
.breadcrumb>[aria-current="page"]{min-width:0;overflow-wrap:anywhere}
.page-back-button[data-home-link]{white-space:nowrap}
@media print{.breadcrumb{display:none}}
'''
change('assets/site-footer.css',navigation_css)
def generator(s):
 s=once(s," if(entry.kind==='landing')continue;",''' const before=fs.readFileSync(entry.file,'utf8');let after=before;
 const homeLink='<a class="page-back-button" data-home-link href="/" aria-label="Home — torna alla pagina principale di Andrea Giaquinto"><span aria-hidden="true">←</span><span>Home</span></a>';
 after=after.replace(/<nav\\b[^>]*class="[^\"]*\\bbreadcrumb\\b[^\"]*"[^>]*>[\\s\\S]*?<\\/nav>/g,nav=>nav.replace(/<a\\b[^>]*href="(?:\\/|https:\\/\\/andreagiaquinto\\.it\\/)"[^>]*>[\\s\\S]*?<\\/a>/,()=>homeLink));
 if(entry.kind==='landing'){
  if(after!==before){if(check)throw new Error('Home non sincronizzata: '+entry.file);fs.writeFileSync(entry.file,after);}
  continue;
 }''')
 s=once(s," const before=fs.readFileSync(entry.file,'utf8');let after=before;\n for(const position", " for(const position")
 s=once(s,'href="${escape(entry.parent.href)}"><span aria-hidden="true">←</span>', '${u.pathname===\'/\'?\'data-home-link aria-label="Home — torna alla pagina principale di Andrea Giaquinto" \':\'\'}href="${escape(entry.parent.href)}"><span aria-hidden="true">←</span>')
 return s
change('scripts/sync-page-navigation.cjs',generator)
change('scripts/sync-site-footer.cjs',lambda s:once(s,'site-footer.css?v=20260930-r2','site-footer.css?v=20260930-r3'))
def registry(s):
 pages=json.loads(s)
 for p in pages:
  if p.get('parent',{}).get('href')=='/':p['parent']['label']='Home'
 return json.dumps(pages,ensure_ascii=False,indent=2)+'\n'
change('scripts/site-pages.json',registry)
change('lezioni-autocad/index.html',lambda s:s.replace('20260930-autocad-v17.10','20260930-autocad-v17.11').replace('landing.css?v=17.10','landing.css?v=17.11'))
for name in ['yqarch-italiano/index.html','express-tools-italiano/index.html','express-tools-italiano/guida/index.html']:
 p=Path(name);s=p.read_text();s2=re.sub(r'plugins\.css\?v=[^"\s]+','plugins.css?v=20260930-r6',s)
 assert s2!=s; p.write_text(s2)
change('.github/services-publication.json',lambda s:s.replace('20260930-services-r8','20260930-services-r9'))
change('AGENTS.md',lambda s:s+'''
## DOCFA e navigazione Home — 30 settembre 2026
- Planimetrie DOCFA apre `docfaPreferences` con il campo `Indicazioni_planimetria_DOCFA`: facoltativo, massimo 3000 caratteri, validato e trasmesso soltanto per il servizio attivo. Conservazione temporanea in pagina, esclusione quando deselezionato, reset soltanto dopo invio riuscito. Nessun dato catastale nei tracciamenti.
- Il servizio DOCFA è supporto grafico al professionista, non una pratica completa con firma e presentazione. Chiedere dati identificativi, rilievo e riferimenti pertinenti, senza richiedere credenziali o documenti d’identità. Per testi e aggiornamenti consultare le fonti annotate in `.github/DOCFA-CONTENT-SOURCES.md`.
- Home e ritorni alle pagine di riferimento usano la medesima classe `page-back-button` in `assets/site-footer.css`; niente varianti locali concorrenti in CSS delle lezioni o dei plugin. I collegamenti Home sono marcati `data-home-link` e generati da `sync-page-navigation.cjs`. Guide e report conservano il collegamento al proprio plugin o pagina madre.
''')
change('.github/SERVICES-PUBLICATION.md',lambda s:s+'''
## DOCFA e Home uniforme — 30 settembre 2026, build r9
Aggiunto il campo facoltativo `Indicazioni_planimetria_DOCFA` con istruzioni basate sul Vademecum nazionale dell’Agenzia delle Entrate (fonti in DOCFA-CONTENT-SOURCES.md). Conservazione in pagina, esclusione front-end e server per servizio inattivo, limite 3000 caratteri e nessuna variazione alle tariffe. Home e ritorni alle pagine madri condividono aspetto, icona, dimensioni, hover e focus, senza dipendere da JavaScript. La posizione dell’immobile mantiene solo indirizzo e coordinate.
''')
change('lezioni-autocad/AGENTS.md',lambda s:s+'''
- Il link Home usa `page-back-button` e il CSS condiviso `/assets/site-footer.css`, come le altre pagine. Non reintrodurre uno stile breadcrumb locale divergente; preservare il percorso Home / Lezioni AutoCAD e le destinazioni statiche.
''')
for name in ['scripts/qa-form-guidance.cjs','.github/scripts/services_qa.py','.github/scripts/site_consistency_qa.cjs']:
 change(name,lambda s:s.replace('20260930-services-r8','20260930-services-r9').replace('20260930-autocad-v17.10','20260930-autocad-v17.11'))
change('scripts/qa-landing-20260930.cjs',lambda s:s.replace("page.locator('.page-back-button')", "page.locator('.page-return .page-back-button')"))
change('scripts/test-site-navigation.cjs',lambda s:s.replace("if(e.kind==='landing'){assert.equal(d.querySelectorAll('.page-back-button').length,0);continue;}","if(e.kind==='landing'){assert.equal(d.querySelectorAll('.page-return').length,0);if(e.file!=='index.html')assert.equal(d.querySelectorAll('.breadcrumb [data-home-link]').length,1);continue;}").replace("assert.ok(e.parent?.label?.startsWith('Torna '),e.file);","assert.ok(e.parent?.label?.startsWith('Torna ')||(e.parent?.href==='/'&&e.parent.label==='Home'),e.file);"))
meta=Path('.github/services-publication.json');obj=json.loads(meta.read_text());obj['baseline']='1b6225c69b0f3ac7445d0c2f80f4635838bb845c';obj['conditional_text_fields'].append('Indicazioni_planimetria_DOCFA');obj['docfa_scope']='Supporto grafico; firma e presentazione restano al professionista abilitato';obj['home_navigation']='Common page-back-button style for every Home and parent link';meta.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
subprocess.run(['node','scripts/sync-page-navigation.cjs'],check=True)
subprocess.run(['node','scripts/sync-site-footer.cjs'],check=True)
print('DOCFA and common Home revision applied.')
