"""Apply the reviewed form revision to the verified d7fd076 baseline only."""
from pathlib import Path
import hashlib, json, re
from bs4 import BeautifulSoup

ROOT = Path.cwd()

def edit(name, callback):
    path = ROOT / name
    old = path.read_text(encoding='utf-8')
    new = callback(old)
    assert new != old, f'No change: {name}'
    path.write_text(new, encoding='utf-8')

def replace(text, old, new, count=1):
    assert text.count(old) == count, f'Unexpected source match: {old[:90]!r}'
    return text.replace(old, new)

TECH = '''<section class="service-options-panel" id="drawingPreferences" aria-labelledby="drawingTitle" hidden>
<h3 id="drawingTitle">Elaborati richiesti e specifiche CAD/BIM <span class="optional">Facoltativo</span></h3>
<p class="field-help" id="drawingHelp">Descrivi che cosa vuoi ricevere. Puoi indicare software e versione, unità di misura, scala, livello di dettaglio e formati di consegna. Compila soltanto le informazioni che conosci: le altre saranno concordate nel preventivo.</p>
<div class="drawing-guidance">
<p id="cad2dGuidance" hidden><strong>AutoCAD 2D.</strong> Indica se desideri soltanto le piante oppure anche prospetti, sezioni, pianta di copertura o inquadramento planovolumetrico. Se noti, specifica piani, superfici lorde e numero degli elaborati; aggiungi le preferenze per layer, stili di testo e di quota, scale di stampa, tavole e cartiglio.</p>
<p id="cad3dGuidance" hidden><strong>AutoCAD 3D.</strong> Descrivi l’edificio, l’oggetto o il componente da modellare, le parti da includere e il dettaglio richiesto. Specifica se ti serve soltanto il modello 3D oppure anche viste 2D, sezioni, quote e tavole impaginate, con layer, cartiglio e impostazioni di stampa.</p>
<p id="bimGuidance" hidden><strong>Revit / BIM.</strong> Indica se è sufficiente la geometria 3D oppure se servono anche famiglie e parametri, piante, prospetti, sezioni, abachi o tavole già preparate con cartiglio. Aggiungi versione Revit, disciplina, livello di dettaglio e dati informativi richiesti, con eventuali consegne RVT, IFC, DWG o PDF.</p>
</div>
<label for="drawingDetails">Le tue indicazioni per gli elaborati CAD/BIM <span class="optional">facoltative</span></label>
<textarea id="drawingDetails" name="Indicazioni_output" rows="5" maxlength="3000" aria-describedby="drawingHelp" placeholder="Esempio: AutoCAD 2D, piante di due piani, quattro prospetti, due sezioni e copertura; scala 1:100, layer separati, quote e tavole A3 con cartiglio. Oppure: Revit, modello 3D con abaco porte e finestre e tavole già impaginate." disabled></textarea>
</section>'''

MECHANICAL = '''<section class="service-options-panel" id="mechanicalPreferences" aria-labelledby="mechanicalTitle" hidden>
<h3 id="mechanicalTitle">Il tuo elaborato meccanico <span class="optional">Facoltativo</span></h3>
<p class="field-help" id="mechanicalHelp">Descrivi il particolare, il componente o l’assieme e indica se desideri un disegno 2D, un modello 3D o entrambi. Specifica l’uso previsto, le viste, le sezioni e i dettagli necessari; se disponibili, aggiungi unità, misure, materiali, tolleranze e riferimenti tecnici già definiti dal progettista.</p>
<p class="field-help" id="mechanicalStandards">Puoi richiedere layer dedicati, stili di testo e di quota, scale, formati delle tavole, cartiglio, impostazioni di stampa ed eventuale distinta componenti. Indica software, versione e formato di consegna; fattibilità e contenuti saranno verificati prima del preventivo.</p>
<label for="mechanicalDetails">Descrizione e istruzioni per il disegno meccanico <span class="optional">facoltative</span></label>
<textarea id="mechanicalDetails" name="Indicazioni_disegno_meccanico" rows="5" maxlength="3000" aria-describedby="mechanicalHelp mechanicalStandards" placeholder="Esempio: disegno 2D quotato e modello 3D di una staffa, tre viste e una sezione; misure in mm, layer separati, tavola A3 con cartiglio aziendale, consegna DWG e PDF. Allego lo schizzo e le specifiche disponibili." disabled></textarea>
</section>'''

OTHER = '''<section class="service-options-panel" id="otherPreferences" aria-labelledby="otherTitle" hidden>
<h3 id="otherTitle">La tua richiesta su misura <span class="optional">Facoltativo</span></h3>
<p class="field-help" id="otherHelp">Racconta nel dettaglio il lavoro che ti serve, anche per disegno industriale, impianti, carpenteria, arredi, nautica, prodotto, packaging o altri ambiti. Indica che cosa deve rappresentare l’elaborato, a che cosa servirà e se desideri disegni 2D, modelli 3D o entrambi.</p>
<p class="field-help" id="otherStandards">Aggiungi, se noti, dimensioni, viste, sezioni, livello di dettaglio, software e formati, layer, quote, tavole e cartiglio. Segnala il materiale disponibile, gli standard da rispettare e le priorità: valuterò personalmente fattibilità e informazioni necessarie, senza richiederti un dossier completo.</p>
<label for="otherDetails">Descrivi il lavoro e il risultato desiderato <span class="optional">facoltativo</span></label>
<textarea id="otherDetails" name="Richiesta_personalizzata" rows="5" maxlength="3000" aria-describedby="otherHelp otherStandards" placeholder="Esempio: ho bisogno di disegni 2D e di un modello 3D per un arredo su misura, con dettagli costruttivi, quote e tavole PDF. Dispongo di fotografie, uno schizzo e alcune misure; vorrei valutare insieme gli elaborati necessari." disabled></textarea>
</section>'''

RENDER = '''<div class="custom-request-panel" id="renderCustomPanel" hidden>
<label for="renderCustom">Descrivi il tuo render personalizzato <span class="optional">facoltativo</span></label>
<p class="field-help" id="renderCustomHelp">Indica l’ambiente, l’edificio o il prodotto da rappresentare e l’uso delle immagini: annuncio immobiliare, presentazione al cliente o valutazione di una proposta. Descrivi inquadrature o sezioni, numero di viste, stile, materiali, colori, illuminazione e atmosfera; segnala elementi da mantenere, modificare o evitare. Puoi indicare anche formato, risoluzione e riferimenti disponibili.</p>
<textarea id="renderCustom" name="Render_personalizzato" rows="5" maxlength="3000" aria-describedby="renderCustomHelp" placeholder="Esempio: due render di un soggiorno con cucina, una vista dall’ingresso e una verso la vetrata; legno chiaro, toni sabbia e luce naturale. Manteniamo pavimento e infissi esistenti. Le immagini serviranno per presentare una proposta d’arredo." disabled></textarea>
</div>'''

def home(text):
    text = replace(text, '20260930-services-r7', '20260930-services-r8')
    text = replace(text, 'services.css?v=20260930-r7', 'services.css?v=20260930-r8')
    text = replace(text, 'services.js?v=20260927-r2', 'services.js?v=20260930-r3')
    text = replace(text, '<section class="review-submit-section wrap" aria-labelledby="reviewSubmitTitle">', '<section id="lascia-recensione" tabindex="-1" aria-labelledby="reviewSubmitTitle" class="review-submit-section wrap">')
    text = replace(text, '</div><div aria-label="Navigazione recensioni" class="reviews-toolbar" role="group">', '</div><div aria-label="Navigazione recensioni" class="reviews-toolbar" role="group"><div class="reviews-actions"><a class="button" href="#lascia-recensione">Lascia la tua recensione <span aria-hidden="true">↓</span></a></div>')
    text = replace(text, 'aria-controls="templatePreferences"', 'aria-controls="drawingPreferences templatePreferences"', 3)
    text = replace(text, '<input type="checkbox" name="Output[]" value="Disegno meccanico AutoCAD">', '<input id="mechanicalSelected" aria-controls="mechanicalPreferences" aria-expanded="false" type="checkbox" name="Output[]" value="Disegno meccanico AutoCAD">')
    text = replace(text, '<input type="checkbox" name="Output[]" value="Altro">', '<input id="otherSelected" aria-controls="otherPreferences" aria-expanded="false" type="checkbox" name="Output[]" value="Altro">')
    text = replace(text, '<section class="service-options-panel" id="templatePreferences"', TECH+'\n<section class="service-options-panel" id="templatePreferences"')
    text = replace(text, '<section class="service-options-panel" id="renderPreferences"', MECHANICAL+'\n<section class="service-options-panel" id="renderPreferences"')
    text = replace(text, 'Per sezioni render o richieste particolari, scegli “Altro” e descrivi il lavoro al passaggio 3.', 'Per sezioni render o richieste particolari, scegli “Altro”: comparirà uno spazio per descrivere il tuo render personalizzato.')
    text = replace(text, '<input type="checkbox" name="Render_viste[]" value="Altro" disabled>', '<input id="renderCustomSelected" aria-controls="renderCustomPanel" aria-expanded="false" type="checkbox" name="Render_viste[]" value="Altro" disabled>')
    text = replace(text, '<span>Altro</span></label></div></section>', '<span>Altro</span></label></div>'+RENDER+'</section>')
    text = replace(text, 'Le preferenze restano nel modulo se cambi selezione, ma vengono inviate solo per le opzioni attive.</p></section></fieldset>', 'Le preferenze restano nel modulo se cambi selezione, ma vengono inviate solo per le opzioni attive.</p></section>'+OTHER+'<p class="field-help service-details-note">Tutti i dettagli sono facoltativi. I testi restano in questa pagina quando cambi selezione e vengono inviati soltanto per i servizi e le opzioni attivi.</p></fieldset>')
    old = re.search(r'<section class="technical-details".*?</section>', text).group()
    new = '''<section class="technical-details" aria-labelledby="technicalDetailsTitle"><h3 class="technical-details-title" id="technicalDetailsTitle">Posizione dell’immobile <span>facoltativa</span></h3><div class="details-content"><p class="field-help" id="locationHelp">Per edifici e ambienti, indica l’indirizzo fisico e, se disponibili, le coordinate geografiche: aiutano a individuare l’immobile e comprenderne il contesto. Entrambi i campi sono facoltativi.</p><div class="grid-2"><label for="buildingAddress">Indirizzo del fabbricato<input id="buildingAddress" type="text" name="Indirizzo_fabbricato" maxlength="500" autocomplete="off" aria-describedby="locationHelp" placeholder="Via, numero civico, Comune e provincia"></label><label for="buildingCoordinates">Coordinate geografiche<input id="buildingCoordinates" type="text" name="Coordinate_geografiche" maxlength="200" aria-describedby="locationHelp" placeholder="Latitudine e longitudine, se disponibili"></label></div></div></section>'''
    text = replace(text, old, new)
    # Do not keep instructions in FAQs asking for the form field that has been removed.
    for a,b,count in [
        ('indirizzo, coordinate e link Google Maps / Earth', 'indirizzo fisico e coordinate geografiche', 2),
        ('indirizzo o link Google Maps / Earth', 'indirizzo fisico o coordinate geografiche', 2),
    ]:
        text = replace(text,a,b,count)
    return text
edit('index.html', home)

def ui(text):
    text = replace(text, "const bim=document.getElementById('bimSelected'),render=document.getElementById('renderSelected');", "const bim=document.getElementById('bimSelected'),render=document.getElementById('renderSelected');\n  const mechanical=document.getElementById('mechanicalSelected'),other=document.getElementById('otherSelected');\n  const renderCustom=document.getElementById('renderCustomSelected');")
    text = replace(text, 'const panel=document.getElementById(id);panel.hidden=!active;', 'const panel=document.getElementById(id);if(!panel)return;panel.hidden=!active;')
    text = replace(text, "showPanel('templatePreferences',cad||bim.checked);", "showPanel('drawingPreferences',cad||bim.checked);\n    showPanel('cad2dGuidance',cadChoices[0].checked);\n    showPanel('cad3dGuidance',cadChoices[1].checked);\n    showPanel('bimGuidance',bim.checked);\n    showPanel('templatePreferences',cad||bim.checked);")
    text = replace(text, "showPanel('renderPreferences',render.checked);", "showPanel('mechanicalPreferences',!!mechanical?.checked);\n    showPanel('otherPreferences',!!other?.checked);\n    showPanel('renderPreferences',render.checked);\n    // Nested controls must be evaluated after the parent, which enables its descendants.\n    showPanel('renderCustomPanel',render.checked&&!!renderCustom?.checked);")
    text = replace(text, "render.setAttribute('aria-expanded',String(render.checked));", "mechanical?.setAttribute('aria-expanded',String(mechanical.checked));\n    other?.setAttribute('aria-expanded',String(other.checked));\n    renderCustom?.setAttribute('aria-expanded',String(render.checked&&renderCustom.checked));\n    render.setAttribute('aria-expanded',String(render.checked));")
    text = replace(text, '[...cadChoices,bim,render,interior,customChoice].forEach', '[...cadChoices,bim,render,interior,customChoice,mechanical,other,renderCustom].filter(Boolean).forEach')
    return text
edit('assets/services/services.js',ui)
edit('assets/services/services.css',lambda t: t+'''\n/* Guided requests: reveal without stealing focus; keep labels and help outside placeholders. */
.reviews-toolbar{align-items:center;flex-wrap:wrap}.reviews-actions{margin-right:auto}.reviews-actions .button{max-width:100%}
#lascia-recensione{scroll-margin-top:100px}
.drawing-guidance{margin:0 0 22px;padding:0 0 0 16px;border-left:3px solid var(--accent)}
.drawing-guidance p{font-size:14px;line-height:1.75;color:var(--ink);margin:12px 0}
.custom-request-panel{margin-top:24px;padding-top:22px;border-top:1px solid #afc7c1}
.service-options-panel textarea{min-height:150px}.service-details-note{margin:22px 0 0}
@media(max-width:600px){.drawing-guidance{padding-left:12px}.drawing-guidance p{font-size:13px}.reviews-actions{flex:0 0 100%}.reviews-actions .button{width:100%}}
''')

def lesson(text):
    text=replace(text,'20260930-autocad-v17.9','20260930-autocad-v17.10')
    text=replace(text,'landing.css?v=17.8','landing.css?v=17.10')
    text=replace(text,'<section class="hero" id="top"><div class="container">','<section class="hero" id="top"><div class="container">\n<nav class="breadcrumb" aria-label="Percorso"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Lezioni AutoCAD</span></nav>')
    text=replace(text,'"dateModified":"2026-09-27"','"dateModified":"2026-09-30"')
    return text
edit('lezioni-autocad/index.html',lesson)
edit('lezioni-autocad/assets/landing.css',lambda t:t+'''\n/* Explicit parent link above the hero, also usable without JavaScript. */
.breadcrumb{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 20px;font-size:13px;line-height:1.5;color:#b5c7d5}
.breadcrumb a{display:inline-flex;align-items:center;min-height:44px;padding:8px 12px;border:1px solid #476071;border-radius:8px;color:#d2f8ff;font-weight:700;text-decoration:none}
.breadcrumb a:hover{background:#173e50;color:#fff}.breadcrumb a:focus-visible{outline:3px solid #6eedfa;outline-offset:3px}
''')

def backend(text):
    text=replace(text,"  'Render_viste[]': 'Viste render richieste',", "  'Render_viste[]': 'Viste render richieste',\n  Render_personalizzato: 'Render personalizzato',\n  Indicazioni_disegno_meccanico: 'Indicazioni per il disegno meccanico',\n  Richiesta_personalizzata: 'Richiesta personalizzata',")
    text=replace(text,'JSON.stringify(fields).length > 24000','JSON.stringify(fields).length > 48000')
    marker="  for (const key of ['Nuvola_di_punti_link_cloud','Link_cloud_materiale_completo','Google_Maps_Earth']) {"
    code='''  // New optional descriptions are bounded and never retained for inactive services.
  // Keep legacy fields/clients compatible, including Indicazioni_output and old map links.
  const detailOptions = {
    Render_personalizzato: outputs.includes('Render fotorealistici / viste prospettiche') && [].concat(fields['Render_viste[]'] || []).includes('Altro'),
    Indicazioni_disegno_meccanico: outputs.includes('Disegno meccanico AutoCAD'),
    Richiesta_personalizzata: outputs.includes('Altro'),
  };
  for (const [key, active] of Object.entries(detailOptions)) {
    if (fields[key] !== undefined && (typeof fields[key] !== 'string' || fields[key].length > 3000)) {
      return json({ok:false,error:'Ogni descrizione personalizzata può contenere al massimo 3000 caratteri di testo.'},400,origin,env);
    }
    if (!active) delete fields[key];
  }
'''
    return replace(text,marker,code+marker)
edit('cloudflare-worker/src/index.js',backend)

def agents(text):
    return replace(text,'Mantenere sempre visibili la sezione “Dettagli tecnici e posizione” e il modulo recensioni. Gli allegati e i dettagli tecnici restano facoltativi.', 'Mantenere sempre visibili la posizione dell’immobile (indirizzo e coordinate, senza campo Google Maps/Earth) e il modulo recensioni. Le specifiche CAD/BIM compaiono sotto i servizi quando si seleziona AutoCAD 2D, AutoCAD 3D o Revit/BIM. Allegati e dettagli restano facoltativi.')+'''\n## Richieste guidate — aggiornamento del 30 settembre 2026
- Dal carosello recensioni della home, il link «Lascia la tua recensione» porta a `#lascia-recensione`, senza invii né eventi lead.
- Specifiche CAD/BIM: mantenere `Indicazioni_output`, con istruzioni pertinenti alle selezioni attive; template esistenti conservati subito dopo.
- «Altro» nei render apre `Render_personalizzato`; Disegno meccanico apre `Indicazioni_disegno_meccanico`; «Altro / da valutare» apre `Richiesta_personalizzata`. Ogni nuovo testo è facoltativo, massimo 3000 caratteri, validato anche dal backend.
- Nascondere e disabilitare i campi inattivi senza cancellarne il testo nella pagina; riattivarli con le scelte precedenti. Nessun autofocus al cambio servizio; ripristino dopo errore e azzeramento solo dopo invio confermato.
- Il breadcrumb «Home / Lezioni AutoCAD» precede il titolo delle lezioni. Il collegamento Home deve funzionare anche senza JavaScript.
'''
edit('AGENTS.md',agents)
edit('lezioni-autocad/AGENTS.md',lambda t:t+'\n## Navigazione — 30 settembre 2026\nConservare il percorso «Home / Lezioni AutoCAD» sopra il riquadro iniziale, con Home collegata alla pagina principale tramite link HTML statico, visibile anche su mobile e senza JavaScript.\n')
edit('.github/SERVICES-PUBLICATION.md',lambda t:t+'''\n## Richieste guidate — 30 settembre 2026, build r8
La posizione dell’immobile resta visibile e contiene soltanto indirizzo e coordinate. Le specifiche CAD/BIM (`Indicazioni_output`) sono ora condizionali, nel primo passaggio prima dei template. Nuovi testi facoltativi per render personalizzato, disegno meccanico e altri ambiti; conservazione locale durante i cambi di selezione, esclusione delle opzioni inattive, ripristino in caso di errore. Il backend conserva i campi storici per i vecchi client, valida i tre nuovi testi (3000 caratteri ciascuno) e porta il limite complessivo JSON a 48000 caratteri per non penalizzare le richieste multiservizio. Nel carosello è presente il collegamento al modulo recensioni; la landing lezioni include Home sopra il titolo. Prezzi, guide, installer, immagini e configurazione di misurazione invariati.\n''')

def manifest(text):
    data=json.loads(text);data.update(build='20260930-services-r8',baseline='d7fd076a3f88e74bd5a27f277f60c1e95ffddcc0',technical_details_always_visible=False,location_always_visible=True,technical_details_condition='AutoCAD 2D / AutoCAD 3D / Revit-BIM selected',lessons_scope='breadcrumb Home; other content and functionality unchanged')
    data['conditional_text_fields']=['Indicazioni_output','Render_personalizzato','Indicazioni_disegno_meccanico','Richiesta_personalizzata']
    return json.dumps(data,ensure_ascii=False,indent=2)+'\n'
edit('.github/services-publication.json',manifest)
edit('.github/scripts/services_qa.py',lambda t:replace(t,"BUILD='20260930-services-r7'","BUILD='20260930-services-r8'"))
edit('.github/scripts/site_consistency_qa.cjs',lambda t:replace(t,'20260930-autocad-v17.9','20260930-autocad-v17.10'))

def workflow(text):
    text=replace(text,"      - 'scripts/qa-landing-20260930.cjs'", "      - 'scripts/qa-landing-20260930.cjs'\n      - 'scripts/qa-form-guidance.cjs'\n      - 'scripts/test-form-guidance.mjs'")
    text=replace(text,'          node scripts/qa-landing-20260930.cjs local','          node scripts/qa-landing-20260930.cjs local\n          node scripts/qa-form-guidance.cjs local')
    text=replace(text,'          node scripts/qa-landing-20260930.cjs live','          node scripts/qa-landing-20260930.cjs live\n          node scripts/qa-form-guidance.cjs live')
    return replace(text,'            ${{ runner.temp }}/landing-proof/','            ${{ runner.temp }}/landing-proof/\n            ${{ runner.temp }}/form-guidance-proof/')
edit('.github/workflows/plugins-verified.yml',workflow)

# Validate the result without reserializing the surrounding page or changing asset bytes.
s=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser')
assert len(s.select('[name="Indicazioni_output"]'))==1
assert not s.select('[name="Google_Maps_Earth"]')
assert len(s.select('.technical-details input'))==2
assert s.select_one('#lascia-recensione #reviewForm')
for field in ['drawingDetails','mechanicalDetails','renderCustom','otherDetails']:
    node=s.select_one('#'+field);assert node and node.has_attr('disabled') and not node.has_attr('required')
graph=json.loads(s.select_one('script[type="application/ld+json"]').string)['@graph']
faq=next(n for n in graph if n['@type']=='FAQPage')['mainEntity']
for item,detail in zip(faq,s.select('#faq details')):
    assert item['acceptedAnswer']['text']==re.sub(r'\s+',' ',(detail.select_one('.faq-answer') or detail.p).get_text()).strip()
print('Form guidance revision applied and HTML contracts verified.')
