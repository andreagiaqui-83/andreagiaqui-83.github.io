"""Re-export the eleven approved exercise views from PRIVATE vector PDF sources.

Only the two extension-line drawing operations of each detected dimension are
removed. The dimension line, architectural ticks, value glyphs and every other
source operation remain byte-identical. No PDF is created or published.

Usage: python scripts/suppress-exercise-dimension-extensions.py SOURCE_DIRECTORY
"""
from pathlib import Path
from io import BytesIO
import argparse
import hashlib
import json
import re

import fitz
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
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
GROUPS = {
    '03_Base_Attica': 'Base attica di Vignola',
    '04_Sezioni_Solidi': 'Un piano incontra un solido',
    '05_Ara_Pacis': 'Modello ispirato all’Ara Pacis',
    '06_Obelisco_Flaminio': 'Obelisco Flaminio',
    '08_Pianta_Sezione': 'Dalla vista 3D alla tavola 2D',
}
PATTERN = re.compile(rb'\nq\n.*?\nQ\n', re.S)
VERSION = '20261101-quote-senza-estensioni'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def points(box):
    return fitz.Rect(*(value / 1.15 for value in box))


def vector(line):
    if len(line['items']) != 1 or line['items'][0][0] != 'l':
        raise ValueError('Expected one native line primitive.')
    _, a, b = line['items'][0]
    return np.array([b.x - a.x, b.y - a.y])


def suppress(page):
    """Remove complete extension-line operations, with strict source guards."""
    doc = page.parent
    drawings = page.get_drawings()
    streams = [(xref, doc.xref_stream(xref)) for xref in page.get_contents()]
    chunks = [m.group() for _, stream in streams for m in PATTERN.finditer(stream)]
    if len(chunks) != len(drawings):
        raise ValueError('Source drawing/stream mapping is ambiguous; refusing edits.')
    dimensions = []
    remove = set()
    for i in range(len(drawings) - 5):
        group = drawings[i:i + 6]
        if [x['layer'] for x in group] != ['0', '0', 'quote', 'quote', '0', 'quote']:
            continue
        if [x['type'] for x in group] != ['s', 's', 'f', 'f', 's', 'f']:
            continue
        dim = vector(group[4])
        for extension in group[:2]:
            ext = vector(extension)
            if abs(float(np.dot(ext, dim))) > np.linalg.norm(ext) * np.linalg.norm(dim) * .001:
                raise ValueError('Extension is not perpendicular to the dimension line.')
        if any(len(tick['items']) != 4 for tick in group[2:4]):
            raise ValueError('Unexpected architectural end marks.')
        remove.update([i, i + 1])
        dimensions.append(i)
    all_layer_zero = {i for i, d in enumerate(drawings) if d['layer'] == '0' and d['type'] == 's'}
    expected_layer_zero = remove | {i + 4 for i in dimensions}
    if all_layer_zero != expected_layer_zero:
        raise ValueError('Unclassified possible dimension lines; manual review required.')
    before_unchanged = b''.join(chunk for i, chunk in enumerate(chunks) if i not in remove)
    ordinal = 0
    for xref, stream in streams:
        rewritten = []
        position = 0
        for match in PATTERN.finditer(stream):
            rewritten.append(stream[position:match.start()])
            if ordinal not in remove:
                rewritten.append(match.group())
            position = match.end()
            ordinal += 1
        rewritten.append(stream[position:])
        doc.update_stream(xref, b''.join(rewritten))
    after_chunks = [m.group() for xref, _ in streams for m in PATTERN.finditer(doc.xref_stream(xref))]
    if before_unchanged != b''.join(after_chunks):
        raise AssertionError('An operation other than an extension line was modified.')
    after_drawings = page.get_drawings()
    if len(after_drawings) != len(drawings) - 2 * len(dimensions):
        raise AssertionError('Unexpected drawing count after precise suppression.')
    return {
        'dimensions_corrected': len(dimensions),
        'extension_lines_removed': len(remove),
        'source_drawing_operations': len(drawings),
        'remaining_drawing_operations': len(after_drawings),
        'all_other_vector_operations_byte_identical': True,
        'preserved_operations_sha256': digest(before_unchanged),
        'removed_operation_indices': sorted(remove),
    }


def export(page, crop, masks):
    for mask in masks:
        page.add_redact_annot(points(mask), fill=(1, 1, 1))
    if masks:
        page.apply_redactions(images=2, graphics=2, text=0)
    clip = points(crop)
    scale = min(2.5, 2048 / max(clip.width, clip.height))
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=clip, alpha=False)
    return Image.open(BytesIO(pix.tobytes('png'))).convert('RGB')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_directory', type=Path)
    parser.add_argument('--destination', type=Path, default=ROOT / 'assets/portfolio')
    parser.add_argument('--audit', type=Path, default=ROOT / 'docs/exercise-dimensions-audit-20261101.json')
    args = parser.parse_args()
    args.destination.mkdir(parents=True, exist_ok=True)
    entries = []
    for key, source, index, crop, masks in SPECS:
        path = args.source_directory / f'Esercitazione_{source}.pdf'
        original_bytes = path.read_bytes()
        with fitz.open(stream=original_bytes, filetype='pdf') as doc:
            page = doc[index]
            result = suppress(page)
            corrected = export(page, crop, masks)
        # Existing images define the already-approved framing and native size.
        target = args.destination / f'{key}.webp'
        previous = Image.open(target).convert('RGB') if target.exists() else None
        if previous is not None and previous.size != corrected.size:
            raise AssertionError(f'Approved framing changed for {key}.')
        corrected.save(target, lossless=True, method=6)
        entry = {
            'key': key,
            'exercise': GROUPS[source],
            'source_type': 'private vector PDF; no original CAD available',
            'source_filename': path.name,
            'source_sha256': digest(original_bytes),
            'source_page': index + 1,
            'width': corrected.width,
            'height': corrected.height,
            'old_url': f'/assets/portfolio/{key}.webp',
            'versioned_url': f'/assets/portfolio/{key}.webp?v={VERSION}',
            'output_sha256': digest(target.read_bytes()),
            'output_bytes': target.stat().st_size,
            **result,
        }
        if previous is not None:
            before = np.asarray(previous)
            after = np.asarray(corrected)
            entry['changed_pixel_count'] = int(np.any(before != after, axis=2).sum())
        entries.append(entry)
        print(key, corrected.size, result['dimensions_corrected'])
    audit = {
        'date': '2026-11-01',
        'rule': 'No dimension extension lines; dimension line, value and architectural diagonal ticks retained.',
        'public_outputs': 'WebP only; no PDF or CAD download',
        'source_handling': 'Original PDFs read-only. Vector operations suppressed in memory before approved crops and anonymization. No new PDF file generated.',
        'cad_limit': 'Original CAD of these five existing exercises was not supplied. No DIMSE modification to unavailable CAD is claimed.',
        'exercise_count': len(GROUPS),
        'image_count': len(entries),
        'dimensions_corrected': sum(e['dimensions_corrected'] for e in entries),
        'extension_lines_removed': sum(e['extension_lines_removed'] for e in entries),
        'entries': entries,
    }
    args.audit.parent.mkdir(parents=True, exist_ok=True)
    args.audit.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
