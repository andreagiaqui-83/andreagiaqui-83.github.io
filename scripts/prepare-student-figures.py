"""Export only approved drawing areas; source PDFs stay outside the public repo."""
from pathlib import Path
from io import BytesIO
import argparse, json
import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('source_directory', type=Path)
args = parser.parse_args()
# Rectangles use pixels from the reviewed 1.15x PDF render; convert to PDF points.
# Explicit crops exclude title blocks, dates, assignment notes and review comments.
SPECS = [
 ('studio-base-pianta', '03_Base_Attica', 0, (90,100,1120,835), [(860,550,1120,725)]),
 ('studio-base-profilo', '03_Base_Attica', 1, (38,175,1160,705), []),
 ('studio-solidi-parallelepipedo', '04_Sezioni_Solidi', 0, (55,185,1230,775), [(710,640,1230,735)]),
 ('studio-solidi-piramide-obliqua', '04_Sezioni_Solidi', 1, (55,185,1230,775), [(710,640,1230,735)]),
 ('studio-solidi-piramide-esagonale', '04_Sezioni_Solidi', 2, (55,185,1230,780), [(710,650,1230,830)]),
 ('studio-ara-proiezioni', '05_Ara_Pacis', 0, (80,170,735,845), []),
 ('studio-ara-sezione-verticale', '05_Ara_Pacis', 1, (80,275,645,645), []),
 ('studio-ara-sezione-orizzontale', '05_Ara_Pacis', 2, (210,335,650,770), []),
 ('studio-obelisco', '06_Obelisco_Flaminio', 0, (380,145,1090,826), [(800,310,1190,540)]),
 ('studio-pianta', '08_Pianta_Sezione', 0, (100,165,775,790), []),
 ('studio-sezione-aperture', '08_Pianta_Sezione', 1, (80,240,1285,655), [(895,220,1285,280),(890,610,1285,790)]),
]
dest = ROOT/'assets/portfolio'
meta = json.loads((dest/'figures.json').read_text())
def points(box): return fitz.Rect(*(value/1.15 for value in box))
for key,source,index,crop,masks in SPECS:
    with fitz.open(args.source_directory/f'Esercitazione_{source}.pdf') as doc:
        page=doc[index]
        for mask in masks: page.add_redact_annot(points(mask),fill=(1,1,1))
        if masks: page.apply_redactions(images=2,graphics=2,text=0)
        clip=points(crop)
        scale=min(2.5,2048/max(clip.width,clip.height))
        pix=page.get_pixmap(matrix=fitz.Matrix(scale,scale),clip=clip,alpha=False)
        image=Image.open(BytesIO(pix.tobytes('png'))).convert('RGB')
        image.save(dest/f'{key}.webp',lossless=True,method=6)
        meta[key]={'width':image.width,'height':image.height,'dark':False}
        print(key,image.size,(dest/f'{key}.webp').stat().st_size)
(dest/'figures.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
