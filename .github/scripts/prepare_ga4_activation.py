"""Prepare a GA4-only candidate; production remains untouched until verification."""
from pathlib import Path
from urllib.request import Request, urlopen
import hashlib
import json
import subprocess

BASE = '1f0f328adea95643e2a232f5f34a487f46b12508'
MID = 'G-SQ7LJ1FVVY'
STREAM = '15795461390'
OUT = Path('ga4-results'); OUT.mkdir(exist_ok=True)
FILES = ['assets/measurement-config.js','index.html','lezioni-autocad/index.html','privacy/index.html']
originals = {p: subprocess.check_output(['git','show',f'{BASE}:{p}']).decode('utf-8') for p in FILES}
for name, original in originals.items():
    assert Path(name).read_text(encoding='utf-8') == original, f'Unexpected baseline: {name}'

# Validate the exact identifier read from the owner's screenshot against Google's
# public tag endpoint before committing anything. Fetching JS is not an event.
url = 'https://www.googletagmanager.com/gtag/js?id=' + MID
with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}), timeout=30) as response:
    tag=response.read(); tag_status=response.status
assert tag_status==200 and len(tag)>10000 and MID.encode() in tag, 'The provided Google tag could not be validated'
(OUT/'google-tag.js').write_bytes(tag)
(OUT/'tag-validation.json').write_text(json.dumps({'id':MID,'httpStatus':tag_status,'measurementIdFound':True,'streamIdFromScreenshot':STREAM,'streamIdInTag':STREAM.encode() in tag,'bytes':len(tag),'eventsSent':0},indent=2))

cfg = originals[FILES[0]]
cfg = cfg.replace('Keep IDs empty until the real Google property is connected.', 'GA4 ID supplied by the site owner; Google Ads remains inactive.')
assert cfg.count("ga4Id: ''")==1 and cfg.count('consentVersion: 1')==1
cfg = cfg.replace("ga4Id: ''", "ga4Id: '"+MID+"'").replace('consentVersion: 1','consentVersion: 2')
assert "adsId: ''" in cfg and "adsLeadLabel: ''" in cfg
Path(FILES[0]).write_text(cfg,encoding='utf-8')

old_include = '/assets/measurement-config.js?v=17'
new_include = '/assets/measurement-config.js?v=ga4-20260917'
for name in FILES[1:]:
    text=originals[name]
    assert text.count(old_include)==1, f'Expected one configuration include in {name}'
    text=text.replace(old_include,new_include)
    if name!='privacy/index.html':
        assert text.replace(new_include,old_include)==originals[name], 'Unexpected layout change'
    Path(name).write_text(text,encoding='utf-8')

path=Path('privacy/index.html'); text=path.read_text(encoding='utf-8')
old_notice='Nella configurazione pubblicata non sono inseriti identificativi Google Analytics o Google Ads: questi strumenti sono <strong>inattivi</strong>. Non vengono caricati font esterni, video incorporati o widget social.'
new_notice='Il sito utilizza <strong>Google Analytics 4</strong> per statistiche sulle visite e sulle interazioni, esclusivamente dopo il consenso alla categoria <strong>Statistiche</strong>. Google Ads e la misurazione pubblicitaria restano <strong>inattivi</strong>. Non vengono caricati font esterni, video incorporati o widget social.'
assert text.count(old_notice)==1
text=text.replace(old_notice,new_notice).replace('aggiornata il 16 settembre 2026','aggiornata il 17 settembre 2026')
text=text.replace('Google</a> per la casella Gmail e gli eventuali servizi di misurazione.','Google</a> per la casella Gmail e Google Analytics 4, quando acconsenti alle statistiche.')
text=text.replace('Statistiche, se attivate','Statistiche (Google Analytics 4)')
text=text.replace('Misurazione pubblicitaria, se attivata','Misurazione pubblicitaria (inattiva)')
text=text.replace('Google Ads per attribuire richieste alle campagne. Solo dopo consenso specifico; nessuna personalizzazione pubblicitaria. Gli eventuali cookie _gcl_* hanno una durata determinata dal servizio, generalmente fino a 90 giorni.','Google Ads non è attualmente configurato: non vengono impostati dal sito cookie pubblicitari _gcl_* e la relativa opzione è disabilitata. Un’eventuale futura attivazione richiederà una scelta specifica e l’aggiornamento di questa informativa.')
text=text.replace('Il sistema predisposto usa Consent Mode v2','Il sistema usa Consent Mode v2')
anchor='<p>I dati dei moduli, nomi, indirizzi email, telefono e messaggi non vengono inviati agli strumenti di misurazione.'
assert text.count(anchor)==1
extra='<p>La base giuridica delle statistiche è il consenso, art. 6, par. 1, lett. a del GDPR. Google Analytics riceve informazioni sulle pagine visitate, provenienza, tipo di dispositivo e interazioni, oltre a identificativi pseudonimi e informazioni tecniche necessarie al servizio. Sono disabilitati Google Signals, User-ID, personalizzazione pubblicitaria e invio dei dati di contatto a Google. I report servono a comprendere l’utilizzo del sito e migliorare pagine e percorsi di contatto.</p><p>Il servizio Analytics è fornito da Google Ireland Limited e può comportare trattamenti presso altre società del gruppo e trasferimenti fuori dallo Spazio economico europeo. Per le condizioni, le garanzie applicabili e le modalità di trattamento consulta <a href="https://business.safety.google/adsprocessorterms/" target="_blank" rel="noopener noreferrer">i termini sul trattamento dei dati</a> e <a href="https://policies.google.com/technologies/partner-sites?hl=it" target="_blank" rel="noopener noreferrer">come Google utilizza i dati dei siti partner</a>. La durata dei cookie sul dispositivo, indicata sopra, è distinta dalla conservazione dei dati nei report: per questi valgono le impostazioni della proprietà Analytics e le <a href="https://support.google.com/analytics/answer/7667196?hl=it" target="_blank" rel="noopener noreferrer">regole di conservazione del servizio</a>.</p>'
text=text.replace(anchor,extra+anchor)
path.write_text(text,encoding='utf-8')

# Preserve all graphics, the landing body, both forms, reviews and the backend.
protected=['assets/measurement.js','assets/consent.css','lezioni-autocad/assets','cloudflare-worker']
subprocess.run(['git','diff','--exit-code',BASE,'--',*protected],check=True)
assert Path('lezioni-autocad/index.html').read_text().split('<body',1)[1]==originals['lezioni-autocad/index.html'].split('<body',1)[1]
changed=subprocess.check_output(['git','diff','--name-only']).decode().splitlines()
assert set(changed)==set(FILES), changed
report={'base':BASE,'measurementId':MID,'streamId':STREAM,'adsActive':False,'consentVersion':2,'files':{},'landingBodyUnchanged':True,'graphicsAndBackendUnchanged':True,'realEmailsSent':0,'realAnalyticsEventsSent':0}
for name in FILES:
    body=Path(name).read_bytes()
    report['files'][name]={'sha256':hashlib.sha256(body).hexdigest(),'gitBlob':subprocess.check_output(['git','hash-object',name]).decode().strip()}
(OUT/'candidate-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'changes.diff').write_bytes(subprocess.check_output(['git','diff','--',*FILES]))
print('GA4_CANDIDATE '+json.dumps(report,ensure_ascii=False))
