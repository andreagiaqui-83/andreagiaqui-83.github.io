"""Install the approved Render visual and verify real browser decoding."""
import functools
import hashlib
import http.server
import io
import json
import os
from pathlib import Path
import re
import sys
import threading
import time
from urllib.parse import urljoin
from PIL import Image
import requests

BUILD = '20260916-render-28cdfe14'
NAME = 'assets/render-rilievo-fotorealistico-28cdfe14.jpg'
SOURCE_SHA = '28cdfe14c8325f143db354cdaac1465404beb1a97b587ef96a06113cec3e75ea'
SOURCE_DIR = Path('.github/render-media')
REPORT_DIR = Path(os.environ.get('RUNNER_TEMP', '/tmp')) / 'render-proof'
PARTS = [
'dcb8ceb4efc556616792c1a70ca0154bc290be37',
'60bcdc838c5ccfae74cb72a246b6c9269c690db6',
'6701b875e9dcc764057cb9ef06283aea43e6e73a',
'de6d2b2c3182963de43f947d70d82301d019ef49',
'a61c4b4c9bea14977695d0cc446c002c925a21b4',
'4591e5932fd04483cab07d27968687212efd14c1',
'740733fa29bc96f78daebe24f0f44e0c7011d61c',
'4e819936a39247bdbe5dcdc1ac39be832d6d69a3',
'abf22fb930e02cb4127f479ed0c2a502c304155e',
'f9411bde1d57126bc7e89a2a04c439ffe4bf8feb',
'4721597f203fedd521b28d13cc9d8a8bc65b2c03',
'de503e41961da7e01e5b42a4055f6fadf893fcef',
]

def sha(data):
    return hashlib.sha256(data).hexdigest()

def image_check(data):
    with Image.open(io.BytesIO(data)) as im:
        assert im.format == 'JPEG', im.format
        im.load()
        assert im.size == (1280, 720), im.size
    return {'bytes': len(data), 'sha256': sha(data), 'dimensions': [1280, 720]}

def prepare():
    source = SOURCE_DIR / 'approved-render-28cdfe14.avif'
    if source.exists():
        data = source.read_bytes()
    else:
        chunks = []
        for i, expected in enumerate(PARTS, 1):
            data = (SOURCE_DIR / f'part-{i:02}.bin').read_bytes()
            actual = hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()
            assert actual == expected, (i, actual, expected)
            chunks.append(data)
        data = b''.join(chunks)
    assert len(data) == 67313 and sha(data) == SOURCE_SHA, 'Incomplete approved image'
    source.write_bytes(data)
    with Image.open(io.BytesIO(data)) as im:
        im.load()
        assert im.size == (1280, 720)
        im.convert('RGB').save(NAME, 'JPEG', quality=94, optimize=True, progressive=True)
    payload = Path(NAME).read_bytes()
    metadata = image_check(payload)
    assert metadata['bytes'] > 100_000
    for old in ['render-hero-final-universal.jpg', 'render-hero-marketing-20260916.jpg']:
        (Path('assets') / old).write_bytes(payload)
    original = Path('index.html').read_text(encoding='utf-8')
    pattern = r'(<figure\b[^>]*class="render-visual"[^>]*>\s*)<img\b[^>]*>'
    tag = (f'<img src="{NAME}?v={BUILD}" width="1280" height="720" '
           'loading="eager" decoding="async" '
           'alt="Dal rilievo al render fotorealistico: da foto, nuvole di punti ed elaborati tecnici al modello 3D e al render. Dai dati alla realtà.">')
    updated, count = re.subn(pattern, lambda m: m[1] + tag, original)
    assert count == 1, f'Expected exactly one Render visual, found {count}'
    updated, count = re.subn(r'data-build="[^"]+"', f'data-build="{BUILD}"', updated, count=1)
    assert count == 1
    Path('index.html').write_text(updated, encoding='utf-8')
    for part in SOURCE_DIR.glob('part-*.bin'):
        part.unlink()
    metadata.update({'build': BUILD, 'path': NAME, 'source_sha256': SOURCE_SHA})
    (SOURCE_DIR / 'manifest.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print('APPROVED_ASSET_INTEGRITY_PASS', json.dumps(metadata), flush=True)


def browser_checks(base, stage):
    from playwright.sync_api import sync_playwright
    results = []
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        configurations = [('chromium', w, 980 if w > 767 else 852) for w in [360, 393, 412, 768, 1280, 1440, 1920]]
        configurations += [('webkit', 390, 844), ('webkit', 1440, 980)]
        for engine in ['chromium', 'webkit']:
            browser = getattr(p, engine).launch()
            try:
                for _, width, height in [c for c in configurations if c[0] == engine]:
                    context = browser.new_context(viewport={'width': width, 'height': height},
                        device_scale_factor=2 if width < 768 else 1,
                        is_mobile=width < 768, has_touch=width < 768)
                    page = context.new_page()
                    page.set_default_timeout(30000)
                    response = page.goto(urljoin(base, '?rendercheck=' + BUILD), wait_until='domcontentloaded')
                    assert response and response.status == 200
                    img = page.locator('#render .render-visual img')
                    assert img.count() == 1
                    img.scroll_into_view_if_needed()
                    page.wait_for_function('''() => {const i=document.querySelector('#render .render-visual img');
                        return i.complete && i.naturalWidth===1280 && i.naturalHeight===720;}''')
                    img.evaluate('(i) => i.decode()')
                    info = img.evaluate('''i => {const r=i.getBoundingClientRect(); const s=getComputedStyle(i);
                        const w=i.closest('.render-pro-layout').getBoundingClientRect();
                        return {src:i.currentSrc,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,
                        width:r.width,height:r.height,left:r.left,right:r.right,containerWidth:w.width,
                        opacity:s.opacity,visibility:s.visibility,display:s.display,
                        viewport:window.innerWidth,build:document.body.dataset.build};}''')
                    assert NAME in info['src'] and info['build'] == BUILD, info
                    assert info['display'] != 'none' and info['visibility'] == 'visible' and float(info['opacity']) > 0
                    assert info['width'] > 250 and info['height'] > 100, info
                    assert info['left'] >= -1 and info['right'] <= info['viewport'] + 1, info
                    assert info['containerWidth'] <= 1122, info
                    assert abs(info['width']/info['height'] - 16/9) < .015, info
                    if width < 768:
                        cards = page.locator('#servizi .service-pro-card').evaluate_all('(a)=>a.map(e=>{let r=e.getBoundingClientRect();return {x:r.x,w:r.width};})')
                        assert len(cards) == 6 and max(c['x'] for c in cards)-min(c['x'] for c in cards) < 2, cards
                    if width in [390, 393, 1440]:
                        page.locator('#render').screenshot(path=str(REPORT_DIR/f'{stage}-{engine}-{width}-section.png'), animations='disabled')
                        img.screenshot(path=str(REPORT_DIR/f'{stage}-{engine}-{width}-image.png'), animations='disabled')
                    info.update({'engine': engine, 'testWidth': width, 'status': 'PASS'})
                    results.append(info)
                    print(stage.upper() + '_BROWSER_PASS', engine, width, flush=True)
                    context.close()
            finally:
                browser.close()
    (REPORT_DIR/f'{stage}-browser.json').write_text(json.dumps(results, indent=2))
    return results


def local_check():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(Path.cwd()))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/'
    try:
        response = requests.get(urljoin(base, NAME), timeout=20)
        response.raise_for_status()
        assert 'image/jpeg' in response.headers.get('Content-Type', '')
        image_check(response.content)
        browser_checks(base, 'local')
    finally:
        server.shutdown()
    print('LOCAL_RENDER_VERIFIED', flush=True)


def live_check():
    expected = json.loads((SOURCE_DIR/'manifest.json').read_text())
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    failures = []
    for attempt in range(60):
        try:
            root = requests.get('https://andreagiaquinto.it/', timeout=20, headers={'Cache-Control': 'no-cache'})
            root.raise_for_status()
            assert NAME in root.text and f'data-build="{BUILD}"' in root.text, 'Waiting for public HTML deployment'
            response = requests.get(urljoin(root.url, NAME) + '?v=' + BUILD, timeout=20)
            response.raise_for_status()
            assert 'image/jpeg' in response.headers.get('Content-Type', ''), response.headers
            actual = image_check(response.content)
            assert actual['sha256'] == expected['sha256'], actual
            (REPORT_DIR/'live-http.json').write_text(json.dumps({'url': response.url, 'http': response.status_code,
                'content_type': response.headers['Content-Type'], **actual, 'build': BUILD}, indent=2))
            break
        except (requests.RequestException, AssertionError) as exc:
            failures.append(str(exc))
            print(f'Waiting for verified public deployment ({attempt+1}/60): {exc}', flush=True)
            time.sleep(12)
    else:
        raise RuntimeError('Public image not yet verified: ' + failures[-1])
    browser_checks('https://andreagiaquinto.it/', 'live')
    print('LIVE_RENDER_VERIFIED', json.dumps(expected), flush=True)

if __name__ == '__main__':
    {'prepare': prepare, 'local': local_check, 'live': live_check}[sys.argv[1]]()
