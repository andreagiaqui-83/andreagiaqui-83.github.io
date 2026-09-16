"""Apply and verify the services review carousel without changing other sections."""
import functools
import hashlib
import http.server
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import threading
import time
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

BUILD = '20260916-recensioni-02'
CSS = 'reviews-carousel.css'
JS = 'reviews-carousel.js'
MANIFEST = Path('.github/reviews-paged-manifest.json')
REPORT = Path(os.environ.get('RUNNER_TEMP', '/tmp')) / 'reviews-proof'
FILES = ['index.html', 'script.js', CSS, JS]

def sha(data):
    return hashlib.sha256(data).hexdigest()

def write(name, obj):
    REPORT.mkdir(parents=True, exist_ok=True)
    (REPORT/name).write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')

def prepare():
    html = Path('index.html').read_text(encoding='utf-8')
    core = Path('script.js').read_text(encoding='utf-8')
    assert 'data-reviews-build=' not in html
    old = BeautifulSoup(html, 'html.parser')
    marker = '  const unwrapReviewGroups = () => {'
    assert core.count(marker) == 1 and core.rstrip().endswith('})();')
    prefix = core[:core.index(marker)]
    revised_core = prefix + '  // Navigation is owned by reviews-carousel.js; data loading stays independent.\n  loadLiveReviews();\n\n})();\n'
    assert revised_core[:len(prefix)] == prefix
    updated = html
    for pattern in [r'<link\b[^>]*href="reviews-(?:manual|fixed)\.css[^\"]*"[^>]*>', r'<script\b[^>]*src="reviews-(?:manual|fixed)\.js[^\"]*"[^>]*>\s*</script>']:
        updated, count = re.subn(pattern, '', updated)
        assert count == 2, (pattern,count)
    nav = '<div class="reviews-toolbar" role="group" aria-label="Navigazione recensioni"><button type="button" id="reviewsPrev" aria-controls="reviewsCarousel" aria-label="Recensione precedente" disabled hidden><span aria-hidden="true">❮</span></button><button type="button" id="reviewsNext" aria-controls="reviewsCarousel" aria-label="Recensione successiva" hidden><span aria-hidden="true">❯</span></button></div><p id="reviewsPosition" class="reviews-sr-status" role="status" aria-live="polite" aria-atomic="true"></p>'
    updated,count = re.subn(r'<div class="reviews-external-nav"[^>]*>.*?</div>', nav, updated, count=1, flags=re.S)
    assert count == 1
    old_view = '<div class="reviews-carousel" id="reviewsCarousel" tabindex="0" aria-label="Recensioni clienti">'
    new_view = '<div class="reviews-carousel" id="reviewsCarousel" tabindex="0" role="region" aria-roledescription="carosello" aria-label="Recensioni clienti: scorri o usa le frecce">'
    assert updated.count(old_view) == 1
    updated = updated.replace(old_view,new_view,1)
    updated = updated.replace('<div class="reviews-grid" id="reviewsGrid" aria-live="polite">','<div class="reviews-grid" id="reviewsGrid">',1)
    before = 'Puoi sfogliare le recensioni con le frecce a destra e sinistra e pubblicare anche la tua.'
    after = 'Sfoglia le recensioni con le frecce oppure scorri con il dito sul cellulare. Puoi pubblicare anche la tua.'
    assert updated.count(before) == 1
    updated = updated.replace(before,after,1)
    updated = updated.replace('</head>',f'<link rel="stylesheet" href="{CSS}?v={BUILD}"></head>',1)
    updated = updated.replace('</body>',f'<script src="{JS}?v={BUILD}" defer></script></body>',1)
    updated,count = re.subn(r'src="script\.js\?v=[^\"]+"',f'src="script.js?v={BUILD}"',updated,count=1)
    assert count == 1
    updated,count = re.subn(r'data-build="[^\"]+"',f'data-build="{BUILD}" data-reviews-build="{BUILD}"',updated,count=1)
    assert count == 1
    new = BeautifulSoup(updated, 'html.parser')
    untouched = ['quoteForm','reviewForm','render','servizi','formazione-autocad','whatsappQuickContact']
    for ident in untouched:
        assert str(new.find(id=ident)) == str(old.find(id=ident)), ident
    assert str(new.footer) == str(old.footer)
    assert [str(e) for e in new.select('#reviewsGrid .review-card')] == [str(e) for e in old.select('#reviewsGrid .review-card')]
    assert len(new.select('#reviewsPrev')) == len(new.select('#reviewsNext')) == 1
    for block in new.select('script[type="application/ld+json"]'):
        json.loads(block.string)
    Path('index.html').write_text(updated,encoding='utf-8')
    Path('script.js').write_text(revised_core,encoding='utf-8')
    for file in ['script.js',JS]:
        subprocess.run(['node','--check',file],check=True)
    meta = {'build':BUILD,'files':{f:sha(Path(f).read_bytes()) for f in FILES},'unchanged_sections':untouched+['footer','reviews content'],'core_prefix_sha256':sha(prefix.encode()),'lessons_sha256':sha(Path('lezioni-autocad/index.html').read_bytes())}
    MANIFEST.write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
    write('manifest.json',meta)
    print('PREPARE_PASS',json.dumps(meta),flush=True)

STATE = '''() => {const v=document.getElementById('reviewsCarousel'),r=v.getBoundingClientRect(),a=[...document.querySelectorAll('#reviewsGrid > .review-card')];
return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,box:{x:r.x,width:r.width,right:r.right},scroll:v.scrollLeft,max:v.scrollWidth-v.clientWidth,
prev:document.getElementById('reviewsPrev').disabled,next:document.getElementById('reviewsNext').disabled,
cards:a.map((e,i)=>{const q=e.getBoundingClientRect();return {index:i,x:q.x,width:q.width,right:q.right,visible:Math.min(q.right,r.right)-Math.max(q.x,r.x)>2,text:e.textContent};}),
touch:getComputedStyle(v).touchAction,snap:getComputedStyle(v).scrollSnapType,transform:getComputedStyle(document.getElementById('reviewsGrid')).transform};}'''

BUTTON = '''e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {width:r.width,height:r.height,background:s.backgroundColor,color:s.color,radius:s.borderRadius};}'''

def assert_rest(page, width, expected=None):
    page.wait_for_timeout(260)
    s=page.evaluate(STATE)
    assert s['documentWidth'] <= width+1,s
    assert s['box']['x'] >= -1 and s['box']['right'] <= width+1,s
    assert s['transform']=='none' and s['touch']=='auto' and s['snap']=='x mandatory',s
    assert len(s['cards']) >= 6
    if width <= 767:
        shown=[x for x in s['cards'] if x['visible']]
        assert len(shown)==1,s
        assert abs(shown[0]['width']-s['box']['width'])<1,s
        assert abs(shown[0]['x']-s['box']['x'])<1,s
        if expected is not None:
            assert shown[0]['index']==expected,s
    return s

def swipe(page, direction):
    box=page.locator('#reviewsCarousel').bounding_box()
    assert box
    session=page.context.new_cdp_session(page)
    y=box['y']+min(box['height']/2,100)
    start=box['x']+box['width']*(.83 if direction>0 else .17)
    end=box['x']+box['width']*(.17 if direction>0 else .83)
    session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':start,'y':y}]})
    for step in range(1,11):
        session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':start+(end-start)*step/10,'y':y}]})
        page.wait_for_timeout(35)
    session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    session.detach()
    page.wait_for_timeout(800)

def browser_checks(base,stage):
    from playwright.sync_api import sync_playwright
    results=[]
    REPORT.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        for engine,widths in [('chromium',[320,360,393,412,600,767,768,850,1024,1440,1920]),('webkit',[390,767,1440])]:
            browser=getattr(p,engine).launch()
            try:
                for width in widths:
                    context=browser.new_context(viewport={'width':width,'height':1000},device_scale_factor=2 if width<=767 else 1,is_mobile=width<=767,has_touch=width<=767,reduced_motion='reduce')
                    def route_request(route):
                        if route.request.method not in ['GET','HEAD','OPTIONS']:
                            route.abort();return
                        if stage=='local' and '/api/reviews' in route.request.url:
                            route.fulfill(status=200,content_type='application/json',body='{"reviews":[]}');return
                        route.continue_()
                    context.route('**/*',route_request)
                    page=context.new_page();page.set_default_timeout(25000)
                    page.goto(urljoin(base,'lezioni-autocad/'),wait_until='domcontentloaded')
                    reference=page.locator('.review-toolbar button').first.evaluate(BUTTON)
                    response=page.goto(base,wait_until='domcontentloaded')
                    assert response and response.status==200
                    assert page.locator('body').get_attribute('data-reviews-build')==BUILD
                    page.wait_for_function("document.getElementById('reviewsCarousel').dataset.pagedReviews==='2'")
                    page.locator('#recensioni').scroll_into_view_if_needed()
                    prev=page.locator('#reviewsPrev');nxt=page.locator('#reviewsNext');view=page.locator('#reviewsCarousel')
                    assert prev.count()==nxt.count()==1
                    actual=nxt.evaluate(BUTTON)
                    assert actual==reference,(engine,width,actual,reference)
                    a,b=prev.bounding_box(),nxt.bounding_box()
                    assert abs(a['y']-b['y'])<1 and abs(b['x']-a['x']-a['width']-10)<1,(a,b)
                    assert page.locator('.review-nav,.reviews-carousel-controls,.reviews-external-nav').count()==0
                    start=assert_rest(page,width,0)
                    assert start['prev'] and not start['next'],start
                    nxt.click();s=assert_rest(page,width,1);assert s['scroll']>start['scroll']
                    nxt.click();assert_rest(page,width,2)
                    prev.click();assert_rest(page,width,1)
                    view.focus();page.keyboard.press('End');end=assert_rest(page,width,len(start['cards'])-1);assert end['next']
                    page.keyboard.press('Home');s=assert_rest(page,width,0);assert s['prev']
                    page.keyboard.press('ArrowRight');assert_rest(page,width,1)
                    page.keyboard.press('ArrowLeft');assert_rest(page,width,0)
                    swipe_result='not run'
                    if engine=='chromium' and width in [393,412]:
                        view.scroll_into_view_if_needed()
                        swipe(page,1);assert_rest(page,width,1)
                        swipe(page,-1);assert_rest(page,width,0)
                        swipe_result='PASS: native touch both directions'
                    if width in [393,390,1440]:
                        page.emulate_media(reduced_motion='no-preference')
                        nxt.click();page.wait_for_timeout(850);assert_rest(page,width,1)
                        prev.click();page.wait_for_timeout(850);assert_rest(page,width,0)
                        page.emulate_media(reduced_motion='reduce')
                        page.locator('#recensioni').screenshot(path=str(REPORT/f'{stage}-{engine}-{width}-reviews.png'),animations='disabled')
                    if stage=='local' and width==393:
                        page.evaluate("() => {let e=document.querySelector('#reviewsGrid .review-card').cloneNode(true);e.querySelector('p').textContent='Recensione sintetica solo nel test locale';document.getElementById('reviewsGrid').appendChild(e);}")
                        page.wait_for_timeout(100)
                        view.focus();page.keyboard.press('End');assert_rest(page,width,len(start['cards']))
                        page.keyboard.press('Home');assert_rest(page,width,0)
                        nxt.click();assert_rest(page,width,1)
                        page.set_viewport_size({'width':600,'height':1000});page.wait_for_timeout(300);assert_rest(page,600,1)
                        page.set_viewport_size({'width':393,'height':1000});page.wait_for_timeout(300);assert_rest(page,393,1)
                    assert page.locator('#quoteForm').count()==page.locator('#reviewForm').count()==1
                    assert page.locator('#whatsappQuickContact').get_attribute('href').startswith('https://wa.me/393337240544')
                    assert page.locator('#formazione-autocad .training-cta').get_attribute('href')=='/lezioni-autocad/'
                    result={'browser':engine,'width':width,'status':'PASS','card_width':start['cards'][0]['width'],'viewport_width':start['box']['width'],'one_card_mobile':width<=767,'arrow_size':actual,'swipe':swipe_result}
                    results.append(result);print(stage.upper()+'_BROWSER_PASS',json.dumps(result),flush=True)
                    context.close()
            finally:
                browser.close()
    write(stage+'-results.json',results)
    print(stage.upper()+'_ALL_PASS',len(results),flush=True)

def local():
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(Path.cwd())))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:browser_checks(f'http://127.0.0.1:{server.server_port}/','local')
    finally:server.shutdown()

def live():
    meta=json.loads(MANIFEST.read_text())
    for attempt in range(80):
        try:
            root=requests.get('https://andreagiaquinto.it/',timeout=25,headers={'Cache-Control':'no-cache'})
            root.raise_for_status()
            assert f'data-reviews-build="{BUILD}"' in root.text,'Waiting for public build'
            for file,expected in meta['files'].items():
                r=requests.get(urljoin(root.url,file)+'?v='+BUILD,timeout=25);r.raise_for_status()
                assert sha(r.content)==expected,file
            write('live-http.json',{'status':'PASS','build':BUILD,'url':root.url,'files':meta['files']})
            break
        except (requests.RequestException,AssertionError) as exc:
            print(f'WAIT_PUBLIC {attempt+1}/80: {exc}',flush=True);time.sleep(10)
    else:raise RuntimeError('Public deployment not confirmed')
    browser_checks('https://andreagiaquinto.it/','live')
    print('LIVE_REVIEWS_PAGED_VERIFIED',BUILD,flush=True)

if __name__=='__main__':
    {'prepare':prepare,'local':local,'live':live}[sys.argv[1]]()
