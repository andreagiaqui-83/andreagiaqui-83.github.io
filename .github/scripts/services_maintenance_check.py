"""Validate only the services holding page; do not submit forms or alter lessons."""
import functools
import hashlib
import http.server
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

BUILD = '20260916-servizi-in-costruzione-01'
BASE = 'fdbcdf1289136f8daafd891e508d42728fe8fe18'
REPORT = Path(os.environ.get('RUNNER_TEMP', '/tmp')) / 'maintenance-proof'
ALLOWED = {'index.html', '.github/SERVICES-PUBLICATION.md', '.github/services-publication.json', '.github/scripts/services_maintenance_check.py', '.github/workflows/services-maintenance-verified.yml'}

def sha(data):
    return hashlib.sha256(data).hexdigest()

def record(name, data):
    REPORT.mkdir(parents=True, exist_ok=True)
    (REPORT/name).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def static_checks():
    changed = subprocess.check_output(['git','diff','--name-only',BASE,'HEAD'], text=True).splitlines()
    assert set(changed) <= ALLOWED, changed
    data = Path('index.html').read_bytes()
    soup = BeautifulSoup(data, 'html.parser')
    assert soup.body['data-services-state'] == 'construction'
    assert soup.body['data-build'] == BUILD
    assert soup.h1.get_text(strip=True) == 'Pagina in costruzione'
    assert 'I servizi non sono attivi.' in soup.get_text()
    assert 'andrea.giaquinto@gmail.com' in soup.get_text()
    assert 'andrea.giaqui@gmail.com' not in soup.get_text()
    assert not soup.select('form,input,button,iframe,object,embed,script[src],link[rel="stylesheet"]')
    assert not soup.select('script:not([type="application/ld+json"])')
    assert not soup.select('meta[http-equiv="refresh"]')
    assert soup.select_one('meta[name="robots"]')['content'] == 'index,follow'
    assert soup.select_one('link[rel="canonical"]')['href'] == 'https://andreagiaquinto.it/'
    assert not soup.select('[role="dialog"]')
    assert json.loads(soup.select_one('script[type="application/ld+json"]').string)['@type'] == 'Person'
    links = [a['href'] for a in soup.select('a')]
    assert len(links) == 4
    assert 'tel:+393337240544' in links and 'mailto:andrea.giaquinto@gmail.com' in links
    assert '/lezioni-autocad/' in links
    assert len([l for l in links if l.startswith('https://wa.me/393337240544?text=')]) == 1
    result = {'status':'PASS','build':BUILD,'changed':changed,'html_sha256':sha(data),'backup':BASE,'lessons_and_backend_unchanged':True}
    record('static.json',result)
    print('STATIC_PASS',json.dumps(result),flush=True)

def browsers(base, stage):
    REPORT.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as p:
        for engine, widths in [('chromium',[320,360,393,412,600,768,1024,1440,1920]), ('webkit',[390,1440])]:
            browser = getattr(p,engine).launch()
            try:
                for width in widths:
                    height = 852 if width < 768 else 1000
                    context = browser.new_context(viewport={'width':width,'height':height}, device_scale_factor=2 if width<768 else 1, is_mobile=width<768, has_touch=width<768, reduced_motion='reduce')
                    def safety(route):
                        if route.request.method not in ('GET','HEAD','OPTIONS'):
                            route.abort()
                        else:
                            route.continue_()
                    context.route('**/*',safety)
                    page = context.new_page()
                    page.set_default_timeout(25000)
                    failures=[]
                    page.on('pageerror',lambda e: failures.append(str(e)))
                    response=page.goto(base,wait_until='domcontentloaded')
                    assert response and response.status==200
                    assert page.locator('body').get_attribute('data-services-state')=='construction'
                    assert page.locator('body').get_attribute('data-build')==BUILD
                    assert page.locator('h1').inner_text()=='Pagina in costruzione'
                    assert page.locator('form,input,button,iframe').count()==0
                    assert page.locator('script[src]').count()==0
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'), width
                    for selector in ['h1','.inactive','.contact-panel','.courses','.notice']:
                        box=page.locator(selector).bounding_box()
                        assert box and box['width']>0 and box['x']>=-1 and box['x']+box['width']<=width+1, (width,selector,box)
                    assert page.locator('a[href="mailto:andrea.giaquinto@gmail.com"] strong').inner_text()=='andrea.giaquinto@gmail.com'
                    for link in page.locator('a').all():
                        assert link.bounding_box()['height'] >= 44
                        link.click(trial=True)
                    assert not failures, failures
                    if width in [393,390,1440]:
                        page.screenshot(path=str(REPORT/f'{stage}-{engine}-{width}.png'),full_page=True,animations='disabled')
                    # Existing deep links cannot reveal the old quote form or review UI.
                    if width in [393,390,1440]:
                        for path in ['#modulo','#recensioni','index.html?inviato=1#grazie']:
                            r=page.goto(urljoin(base,path),wait_until='domcontentloaded')
                            assert r is None or r.status==200
                            assert page.locator('body').get_attribute('data-services-state')=='construction'
                            assert page.locator('form,input[type="file"]').count()==0
                    with page.expect_navigation(wait_until='domcontentloaded'):
                        page.locator('.course-link').click()
                    assert urlparse(page.url).path=='/lezioni-autocad/'
                    assert page.locator('#lessonForm').count()==1
                    assert page.locator('[data-services-state="construction"]').count()==0
                    # Confirm the cross-link from the lesson landing returns to the notice.
                    if width in [393,1440]:
                        backlink=page.locator('footer a[href="https://andreagiaquinto.it/"]').first
                        if stage=='live' and backlink.count():
                            with page.expect_navigation(wait_until='domcontentloaded'):
                                backlink.click()
                            assert page.locator('body').get_attribute('data-services-state')=='construction'
                    result={'browser':engine,'width':width,'status':'PASS','notice':True,'no_forms':True,'contact_targets':'PASS','course_navigation':'PASS'}
                    results.append(result)
                    print(stage.upper()+'_BROWSER_PASS',json.dumps(result),flush=True)
                    context.close()
                # Native contact and course links remain available with scripting disabled.
                context=browser.new_context(viewport={'width':393,'height':852},java_script_enabled=False)
                page=context.new_page()
                r=page.goto(base,wait_until='domcontentloaded')
                assert r and r.status==200
                assert page.locator('.inactive').inner_text()=='I servizi non sono attivi.'
                assert page.locator('form').count()==0
                assert page.locator('a[href="tel:+393337240544"]').is_visible()
                page.locator('.course-link').click()
                page.wait_for_url('**/lezioni-autocad/')
                context.close()
                print(stage.upper()+'_NO_JS_PASS',engine,flush=True)
            finally:
                browser.close()
    record(stage+'-browsers.json',results)
    print(stage.upper()+'_ALL_PASS',len(results),'viewport checks and two no-JavaScript checks',flush=True)

def local():
    static_checks()
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(Path.cwd())))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        browsers(f'http://127.0.0.1:{server.server_port}/','local')
    finally:
        server.shutdown()

def live():
    expected=sha(Path('index.html').read_bytes())
    for attempt in range(80):
        try:
            response=requests.get('https://andreagiaquinto.it/',timeout=25,headers={'Cache-Control':'no-cache'})
            response.raise_for_status()
            assert response.status==200 and sha(response.content)==expected, 'Waiting for public holding page'
            alternate=requests.get('https://andreagiaquinto.it/index.html',timeout=25)
            alternate.raise_for_status()
            assert sha(alternate.content)==expected
            course=requests.get('https://andreagiaquinto.it/lezioni-autocad/',timeout=25)
            course.raise_for_status()
            assert 'id="lessonForm"' in course.text and 'data-services-state="construction"' not in course.text
            robots=requests.get('https://andreagiaquinto.it/robots.txt',timeout=25)
            robots.raise_for_status()
            assert robots.content==Path('robots.txt').read_bytes()
            record('live-http.json',{'status':'PASS','build':BUILD,'url':response.url,'http':response.status_code,'html_sha256':expected,'courses_http':course.status_code,'robots_unchanged':True})
            break
        except (requests.RequestException,AssertionError) as e:
            print(f'WAIT_PUBLIC {attempt+1}/80: {e}',flush=True)
            time.sleep(10)
    else:
        raise RuntimeError('Maintenance publication was not confirmed')
    browsers('https://andreagiaquinto.it/','live')
    print('LIVE_SERVICES_MAINTENANCE_VERIFIED',BUILD,flush=True)

if __name__=='__main__':
    {'local':local,'live':live}[sys.argv[1]]()
