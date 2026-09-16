from pathlib import Path
import re
import base64
import hashlib

html_path = Path('lezioni-autocad/index.html')
html = html_path.read_text(encoding='utf-8')

# 1. Ricostruisce la foto reale da segmenti verificati e genera un asset fisico WebP.
# Non dipende più da JavaScript, data URI o placeholder.
chunk_paths = [
    Path('.github/scripts/portrait.p1a'),
    Path('.github/scripts/portrait.p1b'),
    Path('.github/scripts/portrait.p1c'),
    Path('.github/scripts/portrait.p1d'),
    Path('.github/scripts/portrait.part2'),
    Path('.github/scripts/portrait.part3'),
    Path('.github/scripts/portrait.part4'),
]
missing = [str(p) for p in chunk_paths if not p.exists()]
if missing:
    raise SystemExit('segmenti foto mancanti: ' + ', '.join(missing))
raw = ''.join(p.read_text(encoding='utf-8').strip() for p in chunk_paths)
expected_len = 36252
expected_sha256 = '71f4604a33703046ac5b1c4db82fcc91d3a52271fc2d848df8f09f59c2cf3d0c'
if len(raw) != expected_len:
    raise SystemExit(f'lunghezza base64 foto errata: {len(raw)} != {expected_len}')
if hashlib.sha256(raw.encode()).hexdigest() != expected_sha256:
    raise SystemExit('checksum base64 foto non valido')
try:
    photo = base64.b64decode(raw, validate=True)
except Exception as exc:
    raise SystemExit(f'decodifica foto fallita: {exc}')
if not photo.startswith(b'RIFF') or b'WEBP' not in photo[:16]:
    raise SystemExit('foto WebP non valida')
photo_path = Path('lezioni-autocad/assets/andrea-giaquinto-autocad.webp')
photo_path.write_bytes(photo)

# 2. Elimina tutte le vecchie regole custom della hero, quindi inserisce una sola versione definitiva.
html = re.sub(r'/\* HERO-PROMO-V2 \*/.*?(?=</style>)', '', html, count=1, flags=re.S)
html = re.sub(r'/\* HERO AUTOCAD DEFINITIVA V1[0-9] \*/.*?(?=</style>)', '', html, count=1, flags=re.S)
final_css = r'''
/* HERO AUTOCAD DEFINITIVA V15 */
.hero-final{position:relative;display:grid;grid-template-columns:minmax(235px,.72fr) minmax(390px,1.25fr) minmax(330px,1fr);gap:24px;align-items:stretch;margin:6px 0 30px;padding:24px;border:1px solid rgba(105,229,255,.34);border-radius:28px;overflow:hidden;background:radial-gradient(circle at 14% 12%,rgba(105,229,255,.17),transparent 28%),radial-gradient(circle at 88% 22%,rgba(114,134,255,.16),transparent 30%),linear-gradient(135deg,#0c263d,#061523 72%);box-shadow:0 28px 72px rgba(0,0,0,.42)}
.hero-final::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(105,229,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(105,229,255,.045) 1px,transparent 1px);background-size:46px 46px}.hero-final>*{position:relative;z-index:1}
.hero-final-photo{position:relative;min-height:430px;border-radius:22px;overflow:hidden;border:1px solid rgba(105,229,255,.28);background:#06111c;box-shadow:0 20px 44px rgba(0,0,0,.32)}.hero-final-photo img{display:block;width:100%;height:100%;min-height:430px;object-fit:cover;object-position:center 8%;background:#06111c}.hero-final-photo-caption{position:absolute;left:12px;right:12px;bottom:12px;padding:12px 13px;border-radius:13px;background:rgba(5,18,31,.9);backdrop-filter:blur(7px)}.hero-final-photo-caption strong,.hero-final-photo-caption span{display:block}.hero-final-photo-caption span{margin-top:4px;color:#c7dae6;font-size:.8rem;line-height:1.35}
.hero-final-copy{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:8px 0}.hero-final-kicker{align-self:flex-start;display:inline-flex;padding:8px 12px;border-radius:999px;border:1px solid rgba(105,229,255,.3);background:rgba(5,18,31,.55);font-size:.74rem;font-weight:900;letter-spacing:.08em;color:#e8fbff}.hero-final-copy h1{max-width:none!important;margin:16px 0 14px!important;font-size:clamp(2.8rem,4.4vw,5rem)!important;line-height:.94!important;letter-spacing:-.055em!important}.hero-final-copy h1 span{display:block}.hero-final-copy p{margin:0;color:#c4d7e4;font-size:1.03rem;line-height:1.67}.hero-final-chips{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}.hero-final-chips span{padding:8px 11px;border-radius:999px;border:1px solid rgba(105,229,255,.2);background:#0f2a40;color:#effbff;font-size:.82rem;font-weight:800}.hero-final-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}.hero-final-actions .btn{min-height:54px;padding-inline:20px}
.hero-final-cad{display:flex;flex-direction:column;justify-content:center;min-height:430px;border-radius:22px;overflow:hidden;border:1px solid rgba(105,229,255,.22);background:linear-gradient(180deg,#071421,#0a2032);box-shadow:0 18px 40px rgba(0,0,0,.28)}.hero-final-cad img{display:block;width:100%;height:auto;max-height:390px;object-fit:contain;object-position:center;background:#071421}.hero-final-cad strong{display:block;padding:15px 16px 17px;text-align:center;color:#eafaff;font-size:.94rem;border-top:1px solid rgba(105,229,255,.12)}
.hero-final-trust{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 4px}.hero-final-trust span{border:1px solid var(--line);border-radius:999px;padding:8px 12px;color:var(--muted);font-size:.8rem;background:#0a1b2c}
.roadmap-visual img{opacity:1!important;visibility:visible!important;display:block!important;width:100%!important;height:auto!important}
@media(max-width:1120px){.hero-final{grid-template-columns:230px minmax(0,1fr)}.hero-final-cad{grid-column:1/-1;min-height:0}.hero-final-cad img{max-height:none;width:100%}.hero-final-photo,.hero-final-photo img{min-height:360px}}
@media(max-width:760px){.hero{padding-top:30px}.hero-final{grid-template-columns:1fr;padding:15px;gap:16px}.hero-final-copy{order:1;text-align:center}.hero-final-kicker{align-self:center}.hero-final-photo{order:2;max-width:310px;width:100%;margin-inline:auto}.hero-final-photo,.hero-final-photo img{min-height:360px}.hero-final-cad{order:3}.hero-final-copy h1{font-size:clamp(2.45rem,13vw,4.2rem)!important}.hero-final-chips,.hero-final-actions,.hero-final-trust{justify-content:center}.hero-final-actions{flex-direction:column}.hero-final-actions .btn{width:100%}}
'''
html = html.replace('</style>', final_css + '\n</style>', 1)

# 3. Hero unica e stabile: nessun duplicato sotto, nessun loader dinamico.
hero = '''<section class="hero" id="top"><div class="container"><div class="hero-final" aria-label="Lezioni, corsi e ripetizioni AutoCAD 2D e 3D online"><div class="hero-final-photo"><img src="assets/andrea-giaquinto-autocad.webp?v=20260916-15" width="640" height="800" alt="Andrea Giaquinto, disegnatore AutoCAD certificato Autodesk ACU"><div class="hero-final-photo-caption"><strong>Andrea Giaquinto</strong><span>Disegnatore AutoCAD certificato Autodesk ACU · oltre 20 anni di esperienza CAD</span></div></div><div class="hero-final-copy"><span class="hero-final-kicker">LEZIONI · CORSI · RIPETIZIONI AUTOCAD</span><h1>Impara AutoCAD <span>davvero.</span></h1><p>Lezioni individuali e percorsi personalizzati per scuola, università e lavoro. Parti da zero, supera un blocco o perfeziona il metodo lavorando su esercizi, tavole e progetti reali.</p><div class="hero-final-chips"><span>Solo online</span><span>AutoCAD 2D + 3D</span><span>30 min gratis</span><span>15 €/ora</span><span>Maturità</span><span>Certificazioni Autodesk</span></div><div class="hero-final-actions"><a class="btn primary" href="#contatti">Prenota la prima lezione gratis →</a><a class="btn" href="#studenti">Trova il tuo percorso</a></div></div><div class="hero-final-cad"><img src="assets/autocad_dalla_bozza_alla_pianta.webp?v=20260916-15" alt="AutoCAD italiano 2027: dalle prime linee a una planimetria completa"><strong>Dalle basi ai tuoi progetti reali · impari facendo</strong></div></div><div class="hero-final-trust"><span>Certificato Autodesk ACU</span><span>Lezioni personalizzate 1:1</span><span>Corsi su misura</span><span>Online in tutta Italia</span></div></div><div class="container stats"><div><strong>2D + 3D</strong><small>Dal disegno tecnico alla modellazione</small></div><div><strong>Scuola, università, lavoro</strong><small>Lezioni costruite sui tuoi obiettivi</small></div><div><strong>15 €/ora</strong><small>Dopo la prima lezione gratuita di 30 minuti</small></div></div></section>'''
html, count = re.subn(r'<section class="hero" id="top">.*?</section>\s*(?=<section class="section" id="programma">)', hero + '\n', html, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'hero sostituita {count} volte')

# 4. Rimuove le tre illustrazioni SVG giudicate poco professionali, senza toccare le 4 card del programma.
html, removed = re.subn(r'<div class="visual-strip" aria-label="Le fasi delle lezioni">.*?</div>\s*(?=</div></section>)', '', html, count=1, flags=re.S)
# Se erano già state eliminate, non è un errore.

# 5. Ripristina e forza la seconda immagine della roadmap.
# Gestisce sia markup con <strong> sia eventuale variante con <h3>.
html = re.sub(
    r'(<article class="roadmap-card">\s*)<div class="roadmap-visual">\s*</div>(\s*<(?:strong|h3)>2\.)',
    r'\1<div class="roadmap-visual"><img src="assets/autocad_planimetria.webp?v=20260916-15" alt="AutoCAD italiano 2027: planimetria architettonica completa"></div>\2',
    html,
    count=1,
    flags=re.S,
)
html = re.sub(r'src="assets/autocad_planimetria\.webp(?:\?v=[^"]*)?"', 'src="assets/autocad_planimetria.webp?v=20260916-15"', html, count=1)

# 6. Elimina loader foto e aggiorna build.
html = re.sub(r'<script id="heroPortraitLoader">.*?</script>', '', html, flags=re.S)
html = re.sub(r'data-build="[^"]+"', 'data-build="20260916-autocad-v15"', html, count=1)

# Controlli anti-regressione prima di scrivere.
checks = {
    'hero finale': 'class="hero-final"' in html,
    'foto fisica': 'andrea-giaquinto-autocad.webp?v=20260916-15' in html,
    'loader rimosso': 'heroPortraitLoader' not in html,
    'vecchia hero rimossa': 'class="hero-promo"' not in html,
    'vecchio banner rotto rimosso': 'class="hero-wide-banner"' not in html,
    'visual strip rimossa': 'class="visual-strip"' not in html,
    'roadmap card 2 presente': 'autocad_planimetria.webp?v=20260916-15' in html,
    'recensioni intatte': 'id="recensioni"' in html,
    'contatti intatti': 'id="contatti"' in html,
    'programma intatto': 'id="programma"' in html,
}
bad = [k for k, ok in checks.items() if not ok]
if bad:
    raise SystemExit('controlli anti-regressione falliti: ' + ', '.join(bad))
for asset in ['autocad_dalla_bozza_alla_pianta.webp','autocad_planimetria.webp','autocad_comandi_base.webp','autocad_layout_tavola.webp','autocad_3d.webp']:
    if not Path('lezioni-autocad/assets', asset).exists():
        raise SystemExit('asset mancante: ' + asset)

html_path.write_text(html, encoding='utf-8')
print(f'PASS V15: foto {len(photo)} byte, hero unica, visual strip rimossa={removed}, roadmap completa')
