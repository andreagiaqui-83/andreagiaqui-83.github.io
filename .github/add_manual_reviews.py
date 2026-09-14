from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

css = '<link rel="stylesheet" href="reviews-manual.css?v=20260914-1">'
js = '<script src="reviews-manual.js?v=20260914-1" defer></script>'

if css not in s:
    marker = '<link rel="stylesheet" href="enhancements.css?v=20260914-marquee3">'
    if marker in s:
        s = s.replace(marker, marker + css, 1)
    else:
        s = s.replace('</head>', css + '</head>', 1)

if js not in s:
    if '</body>' not in s:
        raise SystemExit('body end not found')
    s = s.replace('</body>', js + '</body>', 1)

p.write_text(s, encoding='utf-8')
