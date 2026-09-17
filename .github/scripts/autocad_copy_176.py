"""Text-only AutoCAD 17.6 candidate. Run only on the isolated staging branch."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import re
import subprocess

BASE = '33d42d3238083c16180ee6e455831a81dfbe463c'
TARGET = Path('lezioni-autocad/index.html')
OUT = Path('qa-results')
OUT.mkdir(exist_ok=True)
original = subprocess.check_output(['git', 'show', f'{BASE}:{TARGET}']).decode('utf-8')
assert TARGET.read_text(encoding='utf-8') == original, 'Unexpected HTML version; do not overwrite'
replacements = [
    (': ricostruzione illustrativa IA dell’ambiente AutoCAD 2027 italiano.', '.', 3),
    ('Ricostruzioni illustrative generate con IA, ispirate ad AutoCAD 2027 in italiano; non sono schermate originali del programma. Gli esercizi vengono scelti in base al tuo percorso.', 'Gli esercizi vengono scelti in base al tuo percorso.', 1),
    ('<p class="visual-note">Illustrazione concettuale generata con IA.</p>', '', 1),
    ('Illustrazione generata con IA, ispirata ad AutoCAD 2027 italiano. Seleziona “Dimensioni reali” e scorri per leggere i dettagli.', 'Seleziona “Dimensioni reali” e scorri per leggere i dettagli.', 1),
    ('data-build="20260917-autocad-v17.5"', 'data-build="20260917-autocad-v17.6"', 1),
]
updated = original
for old, new, count in replacements:
    assert updated.count(old) == count, f'Expected {count} exact occurrences of: {old[:90]}'
    updated = updated.replace(old, new)
# Lowercase 'ai' is an Italian preposition and must not be removed.
assert not re.search(r'\b(?:IA|AI)\b', updated), 'Technology acronym remains in HTML'
assert not re.search(r'intelligenza\s+artificiale', updated, re.I), 'AI phrase remains in HTML'

class Signature(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.images=[]; self.links=[]; self.ids=[]; self.scripts=[]; self.css=[]; self.alts=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag in ('img','source'):
            self.images.append((tag, sorted((k,v) for k,v in a.items() if k!='alt')))
        if tag=='img' and a.get('src'): self.alts.append(a.get('alt',''))
        if tag=='a': self.links.append(a.get('href'))
        if 'id' in a: self.ids.append(a['id'])
        if tag=='script' and a.get('src'): self.scripts.append(a['src'])
        if tag=='link' and a.get('rel')=='stylesheet': self.css.append(a.get('href'))
    handle_startendtag = handle_starttag

before=Signature(); before.feed(original)
after=Signature(); after.feed(updated)
checks={
    'identical_image_files_and_responsive_attributes':before.images==after.images,
    'identical_links':before.links==after.links,
    'identical_ids':before.ids==after.ids,
    'identical_javascript_includes':before.scripts==after.scripts,
    'identical_stylesheets':before.css==after.css,
    'identical_forms':re.findall(r'<form\b.*?</form>',original,re.S)==re.findall(r'<form\b.*?</form>',updated,re.S),
    'identical_hero':re.search(r'<section class="hero".*?</section>',original,re.S).group()==re.search(r'<section class="hero".*?</section>',updated,re.S).group(),
    'identical_reviews':re.search(r'<section class="section" id="recensioni">.*?</section>',original,re.S).group()==re.search(r'<section class="section" id="recensioni">.*?</section>',updated,re.S).group(),
    'all_source_image_alt_texts_nonempty':all(str(alt).strip() for alt in after.alts),
    'only_requested_note_removed':original.count('<p class="visual-note">')==updated.count('<p class="visual-note">')+1,
    'modal_instructions_preserved':'<p id="programImageNote">Seleziona “Dimensioni reali” e scorri per leggere i dettagli.</p>' in updated,
}
assert all(checks.values()), checks
TARGET.write_text(updated,encoding='utf-8')

production_changes = subprocess.check_output(['git','diff','--name-only',BASE,'--','lezioni-autocad','assets','index.html','cloudflare-worker','privacy']).decode().splitlines()
assert production_changes==['lezioni-autocad/index.html'],production_changes
report={'base':BASE,'build':'20260917-autocad-v17.6','checks':checks,'image_elements_unchanged':len(after.images),'production_files_changed':production_changes,'html_sha256':hashlib.sha256(updated.encode()).hexdigest(),'email_sent':False,'google_activated':False}
(OUT/'copy-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'changes.diff').write_bytes(subprocess.check_output(['git','diff','--',str(TARGET)]))
(OUT/'index.html').write_text(updated,encoding='utf-8')

# Reuse the existing 13-width acceptance test on the candidate, without editing
# the production QA script. The canonical must remain the real HTTPS URL.
qa=Path('.github/scripts/verify_autocad_175.py').read_text(encoding='utf-8')
qa=qa.replace("BASE = 'https://andreagiaquinto.it'", "BASE = 'http://127.0.0.1:8765'")
qa=qa.replace('20260917-autocad-v17.5','20260917-autocad-v17.6')
qa=qa.replace("detail['canonical']==URL", "detail['canonical']=='https://andreagiaquinto.it/lezioni-autocad/'")
qa=qa.replace("preview['canonical']==URL", "preview['canonical']=='https://andreagiaquinto.it/lezioni-autocad/'")
qa=qa.replace('AutoCAD 17.5','AutoCAD 17.6 candidate')
qa=qa.replace("'40662acfd04fc3b6f58e029e8027a6b45b61ca10'", "'33d42d3238083c16180ee6e455831a81dfbe463c'")
(OUT/'verify_candidate.py').write_text(qa,encoding='utf-8')
print('COPY_CHECKS '+json.dumps(report,ensure_ascii=False))
