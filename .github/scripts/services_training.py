"""Add the approved WhatsApp shortcut and AutoCAD course cross-link; validate real browsers."""
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
from urllib.parse import urljoin, urlparse, parse_qs, quote
import requests
from PIL import Image
from bs4 import BeautifulSoup

BUILD = '20260916-formazione-wa-01'
ASSET = 'assets/autocad-lezioni-personalizzate-4b462515.jpg'
CSS = 'training-whatsapp-20260916.css'
BASE = '5bf82ad2073cc56e34e4489ed075b44e111d3ad2'
REFERENCE = 'cc7da1e4c1ae21a54fd8bb9417317dbdc9872965'
SOURCE = Path('.github/training-media')
REPORT = Path(os.environ.get('RUNNER_TEMP', '/tmp')) / 'training-proof'
MANIFEST = SOURCE / 'manifest.json'
SOURCE_SHA = '4b46251558bac02dd873bcbdcfa2be7b8ee9a91fbecf6bff4f82e4610e7947e9'
PHONE = '393337240544'
PARTS = ['617dfcf00b9e1533716b80d239b55cd2b0a16e58','fba99b19769fb996a5ba99d7a2fe727abe721be8','d2c526d557caca39b6188aaf7052bec850e83a02','8764c6cf5cea727976ce8199c15cca13be3ab7e9','d23b8eedcfe135280bb7d5d7af37028ad9574654','5c56660f498fb47e5001f42629332593f389cb8c','fa885fe2d9227324f215c6357610eee2743f053b','57c9bc151e543767895541f91d9ecfe5940f0e43','ef9bd599098307f8edf1806b1a86246ccb016989','7733b9f648762c3908782773c9f5936a981703a1']

def digest(data):
    return hashlib.sha256(data).hexdigest()

def write_report(name, value):
    REPORT.mkdir(parents=True, exist_ok=True)
    (REPORT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')

@functools.lru_cache(maxsize=1)
def reference_html():
    # Pin the exact lesson revision visible in the user's reference screenshot.
    # Concurrent lesson-page work must not change the target or be overwritten.
    url = f'https://raw.githubusercontent.com/andreagiaqui-83/andreagiaqui-83.github.io/{REFERENCE}/lezioni-autocad/index.html'
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.content, 'html.parser')
    assert soup.select_one('.whatsapp-fab svg'), 'Approved button reference is missing'
    for script in soup.select('script'):
        script.decompose()
    return str(soup)

def prepare():
    original = Path('index.html').read_text(encoding='utf-8')
    lessons = Path('lezioni-autocad/index.html').read_text(encoding='utf-8')
    assert 'id="formazione-autocad"' not in original and 'id="whatsappQuickContact"' not in original
    chunks = []
    for n, expected in enumerate(PARTS, 1):
        data = (SOURCE / f'part-{n:02}.bin').read_bytes()
        assert hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest() == expected, n
        chunks.append(data)
    data = b''.join(chunks)
    assert len(data) == 15338 and digest(data) == SOURCE_SHA
    (SOURCE / 'approved-workspace.avif').write_bytes(data)
    with Image.open(io.BytesIO(data)) as im:
        im.load()
        assert im.size == (618, 593)
        im.convert('RGB').save(ASSET, 'JPEG', quality=92, optimize=True, progressive=True)
    with Image.open(ASSET) as im:
        im.verify()
    approved = BeautifulSoup(reference_html(), 'html.parser').select_one('.whatsapp-fab')
    fab = re.search(r'<a\b[^>]*>.*?</a>', str(approved), re.S)
    assert fab, 'Lesson WhatsApp reference not found'
    fab = fab.group(0).replace('class="whatsapp-fab"', 'class="services-whatsapp-fab" id="whatsappQuickContact"')
    url = 'https://wa.me/' + PHONE + '?text=' + quote('Ciao Andrea, vorrei richiedere un preventivo.', safe='')
    fab = re.sub(r'href="[^"]+"', lambda m: f'href="{url}"', fab, count=1)
    snippet = (SOURCE / 'section.html').read_text(encoding='utf-8')
    updated = original.replace('</main>', snippet + '</main>', 1)
    updated = updated.replace('</body>', '\n' + fab + '\n</body>', 1)
    link = f'<link rel="stylesheet" href="{CSS}?v={BUILD}">'
    updated = updated.replace('</head>', link + '</head>', 1)
    updated, count = re.subn(r'data-build="[^"]+"', f'data-build="{BUILD}" data-training-crosslink="1"', updated, count=1)
    assert count == 1
    reverted = updated.replace(snippet, '', 1).replace('\n' + fab + '\n', '', 1).replace(link, '', 1)
    before_build = re.search(r'data-build="[^"]+"', original).group(0)
    reverted = reverted.replace(f'data-build="{BUILD}" data-training-crosslink="1"', before_build, 1)
    assert reverted == original, 'Unrelated markup was changed'
    old, new = BeautifulSoup(original, 'html.parser'), BeautifulSoup(updated, 'html.parser')
    for ident in ['quoteForm', 'reviewForm', 'render', 'servizi']:
        assert str(old.find(id=ident)) == str(new.find(id=ident)), ident
    for block in new.select('script[type="application/ld+json"]'):
        json.loads(block.string)
    assert len(new.select('#formazione-autocad a[href="/lezioni-autocad/"]')) == 1
    assert len(new.select('#whatsappQuickContact')) == 1
    Path('index.html').write_text(updated, encoding='utf-8')
    meta = {'build': BUILD, 'base': BASE, 'reference_revision': REFERENCE, 'path': ASSET, 'bytes': Path(ASSET).stat().st_size,
            'sha256': digest(Path(ASSET).read_bytes()), 'dimensions': [618,593],
            'source_sha256': SOURCE_SHA, 'css_sha256': digest(Path(CSS).read_bytes()),
            'original_html_sha256': digest(original.encode()),
            'lessons_sha256': digest(lessons.encode()), 'course_url': 'https://andreagiaquinto.it/lezioni-autocad/',
            'whatsapp_url': url, 'unchanged': ['Existing HTML', 'Render', 'Services', 'Quote form', 'Review form', 'Lesson landing', 'Backend']}
    MANIFEST.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for p in SOURCE.glob('part-*.bin'):
        p.unlink()
    write_report('manifest.json', meta)
    print('PREPARE_PASS', json.dumps(meta), flush=True)

METRICS = '''e => {const r=e.getBoundingClientRect(),s=getComputedStyle(e),a=e.querySelector('svg').getBoundingClientRect();
return {width:r.width,height:r.height,x:r.x,y:r.y,right:r.right,bottom:r.bottom,
font:s.fontFamily,size:s.fontSize,line:s.lineHeight,weight:s.fontWeight,padding:s.padding,
background:s.backgroundColor,color:s.color,radius:s.borderRadius,svgWidth:a.width,svgHeight:a.height,
spanDisplay:getComputedStyle(e.querySelector('span')).display};}'''

def browser_checks(base, stage):
    from playwright.sync_api import sync_playwright
    REPORT.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as p:
        for engine, sizes in [('chromium',[320,360,393,412,600,601,768,900,1024,1440,1920]), ('webkit',[393,1440])]:
            browser = getattr(p, engine).launch()
            try:
                for width in sizes:
                    height = 852 if width < 768 else 1000
                    context = browser.new_context(viewport={'width':width,'height':height}, device_scale_factor=2 if width < 768 else 1,
                                                  is_mobile=width < 768, has_touch=width < 768)
                    page = context.new_page()
                    page.set_default_timeout(30000)
                    page.set_content(reference_html(), wait_until='domcontentloaded')
                    ref = page.locator('.whatsapp-fab').evaluate(METRICS)
                    response = page.goto(base, wait_until='domcontentloaded')
                    assert response and response.status == 200
                    assert page.locator('body').get_attribute('data-build') == BUILD
                    fab = page.locator('#whatsappQuickContact')
                    metrics = fab.evaluate(METRICS)
                    for key in ['width','height','x','y','svgWidth','svgHeight']:
                        assert abs(metrics[key]-ref[key]) < .6, (engine,width,key,metrics,ref)
                    for key in ['font','size','line','weight','padding','background','color','radius','spanDisplay']:
                        assert metrics[key] == ref[key], (engine,width,key,metrics,ref)
                    href = urlparse(fab.get_attribute('href'))
                    assert href.netloc == 'wa.me' and href.path == '/' + PHONE
                    assert parse_qs(href.query)['text'] == ['Ciao Andrea, vorrei richiedere un preventivo.']
                    assert fab.get_attribute('target') == '_blank' and 'noopener' in fab.get_attribute('rel')
                    fab.click(trial=True)
                    assert page.locator('footer a[href="tel:+393337240544"]').count() == 1
                    assert page.locator('footer a[href*="facebook.com/disegnatoreautocadonline"]').count() == 1
                    section = page.locator('#formazione-autocad')
                    section.scroll_into_view_if_needed()
                    image = section.locator('img')
                    image.scroll_into_view_if_needed()
                    image.evaluate('(i) => i.decode()')
                    assert image.evaluate('(i) => i.naturalWidth===618 && i.naturalHeight===593')
                    assert ASSET in image.get_attribute('src')
                    bounds = section.locator('.training-card').bounding_box()
                    assert bounds['x'] >= -1 and bounds['x']+bounds['width'] <= width+1, bounds
                    assert bounds['width'] <= 1122, bounds
                    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), width
                    assert section.locator('h2').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)') >= 28
                    button = section.locator('.training-cta')
                    button.scroll_into_view_if_needed()
                    button.click(trial=True)
                    if width in [393,1440]:
                        section.screenshot(path=str(REPORT/f'{stage}-{engine}-{width}-banner.png'), animations='disabled')
                        page.evaluate('document.documentElement.style.scrollBehavior="auto";window.scrollTo(0,document.body.scrollHeight)')
                        page.wait_for_timeout(250)
                        page.screenshot(path=str(REPORT/f'{stage}-{engine}-{width}-footer.png'), animations='disabled')
                    if width < 600:
                        cards = page.locator('#servizi .service-pro-card').evaluate_all('(a)=>a.map(e=>e.getBoundingClientRect().x)')
                        assert len(cards) == 6 and max(cards)-min(cards) < 2
                    render = page.locator('#render .render-visual img')
                    render.scroll_into_view_if_needed()
                    render.evaluate('(i)=>i.decode()')
                    assert render.evaluate('(i)=>i.naturalWidth===1280')
                    with page.expect_navigation(wait_until='domcontentloaded'):
                        button.click()
                    assert urlparse(page.url).path == '/lezioni-autocad/' and page.locator('#lessonForm').count() == 1
                    result = {'engine':engine,'viewport':width,'whatsapp':metrics,'reference':ref,'banner':bounds,'course_link':'PASS','render':'PASS','status':'PASS'}
                    results.append(result)
                    print(stage.upper()+'_BROWSER_PASS', engine, width, json.dumps(metrics), flush=True)
                    context.close()
            finally:
                browser.close()
    write_report(stage+'-browsers.json', results)
    return results

def local():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(Path.cwd()))
    server = http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        browser_checks(f'http://127.0.0.1:{server.server_port}/','local')
    finally:
        server.shutdown()
    print('LOCAL_ALL_PASS', flush=True)

def live():
    meta=json.loads(MANIFEST.read_text())
    for attempt in range(80):
        try:
            root=requests.get('https://andreagiaquinto.it/',timeout=20,headers={'Cache-Control':'no-cache'})
            root.raise_for_status()
            assert f'data-build="{BUILD}"' in root.text, 'Waiting for updated public HTML'
            assert 'id="whatsappQuickContact"' in root.text and 'id="formazione-autocad"' in root.text
            for path,expected in [(ASSET,meta['sha256']),(CSS,meta['css_sha256'])]:
                response=requests.get(urljoin(root.url,path)+'?v='+BUILD,timeout=25)
                response.raise_for_status()
                assert digest(response.content)==expected, path
                if path==ASSET:
                    assert 'image/jpeg' in response.headers['Content-Type']
                    with Image.open(io.BytesIO(response.content)) as im:
                        im.load(); assert im.size==(618,593)
            write_report('live-http.json',{'status':'PASS','build':BUILD,'url':root.url,'jpeg_sha256':meta['sha256'],'css_sha256':meta['css_sha256']})
            break
        except (AssertionError,requests.RequestException) as exc:
            print(f'WAIT_PUBLIC {attempt+1}/80: {exc}',flush=True)
            time.sleep(10)
    else:
        raise RuntimeError('New public build not confirmed')
    browser_checks('https://andreagiaquinto.it/','live')
    print('LIVE_TRAINING_WHATSAPP_VERIFIED',json.dumps(meta),flush=True)

if __name__=='__main__':
    {'prepare':prepare,'local':local,'live':live}[sys.argv[1]]()
