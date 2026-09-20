"""Hosted regression tests. All quote/review writes and analytics collection are mocked."""
import functools, hashlib, http.server, json, os, re, subprocess, sys, threading, time
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
from PIL import Image
from playwright.sync_api import sync_playwright, expect
ROOT=Path.cwd(); OUT=Path(os.environ.get('RUNNER_TEMP','/tmp'))/'services-restored-proof';OUT.mkdir(parents=True,exist_ok=True)
BASELINE='57df1aa2b030908a2bc2d9661f3f4ee3df5d97e1'
BUILD='20260920-services-r4'
def save(name,data): (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2))
def sha(data):return hashlib.sha256(data).hexdigest()
def static():
 s=BeautifulSoup(Path('index.html').read_text(),'html.parser')
 assert s.body['data-build']==BUILD
 assert 'restano inattivi' not in Path('privacy/index.html').read_text()
 assert len(s.select('h1'))==1
 assert s.select_one('.hp')['aria-hidden']=='true'
 assert not s.select('img[src*="drive.google"]')
 assert len(s.select('link[rel=stylesheet]'))==2
 assert s.select_one('#pointCloud').has_attr('disabled')
 assert len(s.select('#interior-design .interior-style-card'))==4
 assert s.select_one('textarea[name="Interior_Design_5a_proposta_personalizzata"]')
 for n in ['Minimal contemporaneo','Japandi','Mediterraneo contemporaneo','Organic Modern']:assert n in s.select_one('#interior-design').get_text()
 graph=json.loads(s.select_one('script[type="application/ld+json"]').string)['@graph']
 fq=next(x for x in graph if x['@type']=='FAQPage')['mainEntity'];visible=s.select('#faq details')
 assert len(fq)==len(visible)
 for item,detail in zip(fq,visible):
  assert item['name']==detail.summary.get_text()
  assert item['acceptedAnswer']['text']==detail.p.get_text()
 assert all(x['@type'] not in ['Offer','AggregateRating','Review'] for x in graph)
 active=[Path('index.html'),Path('assets/services/services.js'),Path('assets/services/services.css'),Path('assets/measurement.js'),Path('assets/measurement-config.js'),Path('reviews-carousel.js'),Path('favicon.svg')]
 for p in active:
  text=p.read_text();assert not re.search(r'las2mesh',text,re.I),p
  assert not re.search(r'\d[\d.,]*\s*(?:€|€/|euro)|€\s*\d',text,re.I),p
 for tag in s.select('[src],[href]'):
  value=tag.get('src') or tag.get('href')
  if not value or value.startswith(('http:','https:','mailto:','tel:','#')):continue
  file=ROOT/value.split('?')[0].lstrip('/')
  if file.is_dir():file=file/'index.html'
  assert file.exists(),value
 for p in Path('assets/services').glob('*'):
  if p.suffix in ['.avif','.webp','.jpg']:
   with Image.open(p) as im:im.load();assert im.width>0
 # Protected source tree and backend route: byte-level preservation.
 diff=subprocess.check_output(['git','diff',BASELINE,'HEAD','--','lezioni-autocad','cloudflare-worker/src/lessons.js','assets/measurement-config.js','assets/consent.css']).decode()
 assert not diff,'Protected course or shared tracking changed'
 old=BeautifulSoup(subprocess.check_output(['git','show',BASELINE+':index.html']), 'html.parser')
 assert [x.get_text(' ',strip=True) for x in old.select('#reviewsGrid .review-card')]==[x.get_text(' ',strip=True) for x in s.select('#reviewsGrid .review-card')]
 save('static.json',{'status':'PASS','build':BUILD,'baseline':BASELINE,'html_sha256':sha(Path('index.html').read_bytes()),'protected_tree':'lessons and config unchanged; shared consent scope limited to services','review_text':'unchanged','active_css_count':2})
 print('STATIC PASS',flush=True)

def run_browser(base,stage):
 result=[]
 with sync_playwright() as p:
  for engine,sizes in [('chromium',[(320,740),(360,800),(375,812),(390,844),(393,852),(412,915),(430,932),(600,900),(768,1024),(820,1180),(1024,768),(1366,768),(1440,900),(1920,1080)]),('webkit',[(390,844),(1440,900)]),('firefox',[(390,844),(1440,900)])]:
   browser=getattr(p,engine).launch()
   try:
    for width,height in sizes:
     ctx=browser.new_context(viewport={'width':width,'height':height},has_touch=width<768,reduced_motion='reduce',device_scale_factor=1)
     page=ctx.new_page();page.set_default_timeout(20000);errors=[];bad=[];google=[];posts=[]
     page.on('pageerror',lambda e:errors.append(str(e)))
     page.on('response',lambda r:bad.append([r.status,r.url]) if r.status>=400 else None)
     def mock(route):
      u=route.request.url
      if '/api/session' in u: route.fulfill(json={'ok':True,'sessionId':'11111111-1111-4111-8111-111111111111','token':'isolated-fixture'})
      elif '/api/submit' in u: posts.append(route.request.post_data_json);route.fulfill(json={'ok':True})
      elif '/api/upload/' in u: route.fulfill(json={'ok':True})
      elif '/api/reviews' in u:
       route.fulfill(json={'ok':True,'reviews':[]})
      else:route.fulfill(status=404,json={'ok':False})
     page.route('**/cad-bim-preventivi.andrea-giaqui.workers.dev/**',mock)
     def google_route(route):
      google.append(route.request.url)
      if '/gtag/js' in route.request.url:route.fulfill(body='',content_type='application/javascript')
      else:route.fulfill(status=204,body='')
     page.route(re.compile(r'https://([^/]*\.)?(google-analytics.com|googletagmanager.com|googleadservices.com)/'),google_route)
     page.add_init_script("window.__qaVitals={lcp:0,cls:0};try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__qaVitals.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__qaVitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});}catch(e){}")
     r=page.goto(base,wait_until='networkidle');assert r.status==200
     assert page.locator('body').get_attribute('data-build')==BUILD
     assert not google,'Google before consent'
     expect(page.locator('.ag-consent')).to_be_visible()
     assert page.locator('.ag-consent').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
     page.get_by_role('button',name='Rifiuta facoltativi').click()
     assert not google
     if engine=='chromium' and width in [320,1440]:
      page.add_script_tag(path=str(ROOT/'node_modules/axe-core/axe.min.js'))
      axe=page.evaluate("async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})")
      save(f'{stage}-accessibility-{width}.json',axe)
      assert not axe['violations'],[(x['id'],[n['target'] for n in x['nodes']]) for x in axe['violations']]
     expect(page.locator('#pointCloud')).to_be_disabled()
     if not page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'):
      overflow=page.evaluate("[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&getComputedStyle(e).position==='absolute';}).map(e=>({tag:e.tagName,id:e.id,class:e.className,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width}))")
      page.screenshot(path=str(OUT/f'{stage}-{engine}-{width}-overflow.png'),full_page=True)
      raise AssertionError((engine,width,'overflow',overflow))
     cta=page.locator('.hero [data-cta=hero_quote]').bounding_box();assert cta['width']>=44 and cta['height']>=44
     if width>=1366:assert cta['y']+cta['height']<=height,(width,'hero CTA below fold')
     if width in [390,1440]:page.screenshot(path=str(OUT/f'{stage}-{engine}-{width}-hero.png'))
     for img in page.locator('img').all():
      img.scroll_into_view_if_needed();expect(img).to_have_js_property('complete',True);assert img.evaluate('(e)=>e.naturalWidth>0'),img.get_attribute('src')
     if width in [390,1440]:page.locator('#interior-design').screenshot(path=str(OUT/f'{stage}-{engine}-{width}-interior.png'))
     # Check rendered words: DOM text extraction alone missed a hidden <br> joining words.
     headings=page.locator('h1,h2,h3').evaluate_all("els=>els.map(e=>({visible:e.innerText,source:e.textContent})).filter(h=>h.visible.trim())")
     for heading in headings:
      assert re.sub(r'\s+',' ',heading['visible']).strip()==re.sub(r'\s+',' ',heading['source']).strip(),(engine,width,heading)
     assert page.locator('#faq h2').inner_text()=='Le risposte che ti servono.',(engine,width,'FAQ word spacing')
     if width in [390,1440]:
      page.locator('#faq h2').scroll_into_view_if_needed()
      page.screenshot(path=str(OUT/f'{stage}-{engine}-{width}-faq.png'))
     # Permanently visible forms and aligned legal actions on every viewport.
     for selector in ['.technical-details', '#reviewForm']:
      target=page.locator(selector)
      expect(target).to_be_visible()
      assert target.evaluate("e=>!e.closest('details')")
      for field in target.locator('input:not(.hp),textarea,button').all():
       expect(field).to_be_visible()
       box=field.bounding_box();assert box['x']>=-1 and box['x']+box['width']<=width+1,(width,selector,box)
     legal=page.locator('.legal-links').evaluate("e=>[...e.children].map(n=>{const r=n.getBoundingClientRect();const t=document.createRange();t.selectNodeContents(n);const b=t.getBoundingClientRect();return {top:r.top,height:r.height,textTop:b.top,textHeight:b.height};})")
     assert abs(legal[0]['textTop']-legal[1]['textTop'])<=1,(engine,width,legal)
     assert all(x['height']>=44 for x in legal)
     if width in [390,1440]:
      for selector,name in [('.compatibility-note','compatibility'),('.technical-details','technical'),('.review-submit-section','review-form'),('.legal','footer')]:
       page.locator(selector).screenshot(path=str(OUT/f'{stage}-{engine}-{width}-{name}.png'))
     # Mobile: complete cards, arrows, keyboard first/last and responsive resize.
     view=page.locator('#reviewsCarousel');view.scroll_into_view_if_needed()
     def one_card():
      return view.evaluate('e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll(".review-card")].filter(c=>{const b=c.getBoundingClientRect();return Math.min(b.right,r.right)-Math.max(b.left,r.left)>2;}).length;}')
     if width<768:assert one_card()==1,(width,'partial next review')
     expect(page.locator('#reviewsPrev')).to_be_disabled()
     page.locator('#reviewsNext').click();page.wait_for_timeout(200)
     if width<768:assert one_card()==1
     view.focus();page.keyboard.press('End');page.wait_for_timeout(200);expect(page.locator('#reviewsNext')).to_be_disabled()
     page.keyboard.press('Home');page.wait_for_timeout(200);expect(page.locator('#reviewsPrev')).to_be_disabled()
     if width==390:
      page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(200)
      assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
      page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200);assert one_card()==1
      page.evaluate('''()=>{let c=document.createElement('article');c.className='review-card';c.innerHTML='<p>'+('Recensione tecnica di prova isolata. '.repeat(18))+'</p><span>Test T.</span>';document.querySelector('#reviewsGrid').append(c);}''')
      view.focus();page.keyboard.press('End');page.wait_for_timeout(200);assert one_card()==1
     # Accessible conditional interior input and preservation.
     page.locator('#interiorSelected').check();expect(page.locator('#interiorPreferences')).to_be_visible()
     page.locator('#interiorCustom').fill('Test riservato: legno chiaro, materiali naturali')
     page.locator('#interiorSelected').uncheck();expect(page.locator('#interiorCustom')).to_be_disabled()
     page.locator('#interiorSelected').check();expect(page.locator('#interiorCustom')).to_have_value('Test riservato: legno chiaro, materiali naturali')
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
     if width<768:expect(page.locator('#whatsappQuickContact')).not_to_be_visible()
     if width in [390,1440]:page.locator('#modulo').screenshot(path=str(OUT/f'{stage}-{engine}-{width}-form.png'))
     # Upload accumulation, removal, rejected extension, byte-progress mock.
     page.locator('#projectFiles').set_input_files({'name':'test-a.pdf','mimeType':'application/pdf','buffer':b'%PDF-test'})
     page.locator('#projectFiles').set_input_files({'name':'test-b.dwg','mimeType':'application/octet-stream','buffer':b'DWG-test'})
     expect(page.locator('#projectDropzone .selected-file')).to_have_count(2)
     page.get_by_role('button',name='Rimuovi test-a.pdf',exact=True).click();expect(page.locator('#projectDropzone .selected-file')).to_have_count(1)
     page.locator('#projectFiles').set_input_files({'name':'cloud.las','mimeType':'application/octet-stream','buffer':b'las-test'})
     expect(page.locator('#projectDropzone .selected-file')).to_have_count(1)
     expect(page.locator('#fileWarning')).to_contain_text('non disponibile')
     f=page.locator('#quoteForm');f.locator('[name=Nome_cognome]').fill('Test riservato');f.locator('[name=email]').fill('private@example.invalid');f.locator('[name=Consenso_privacy]').check()
     page.get_by_role('button',name='Preferenze cookie',exact=True).click();page.get_by_role('button',name='Accetta tutti',exact=True).click()
     assert len([u for u in google if '/gtag/js' in u])==1
     consent=page.evaluate('window.AGTracking.getConsent()');assert consent['analytics'] and consent['marketing']
     page.locator('#quoteSubmit').click();expect(page.locator('#grazie')).to_be_visible();assert len(posts)==1
     assert posts[0]['fields']['Interior_Design_5a_proposta_personalizzata'].startswith('Test riservato')
     assert 'Nuvola_di_punti_link_cloud' not in posts[0]['fields']
     events=page.evaluate('window.dataLayer.filter(x=>x[0]==="event").map(x=>({name:x[1],data:x[2]}))')
     assert len([e for e in events if e['name']=='page_view'])==1
     assert len([e for e in events if e['name']=='service_quote_success'])==1
     assert not [e for e in events if e['name']=='generate_lead']
     serialized=json.dumps(events);assert 'private@example' not in serialized and 'riservato' not in serialized and 'test-b' not in serialized
     assert not errors,errors
     assert not bad,bad
     vitals=page.evaluate('({lab:window.__qaVitals,navigation:performance.getEntriesByType("navigation").map(n=>({ttfb:n.responseStart-n.requestStart,domContentLoaded:n.domContentLoadedEventEnd-n.startTime})),resources:performance.getEntriesByType("resource").length})')
     result.append({'browser':engine,'width':width,'height':height,'status':'PASS','vitals':vitals})
     print(stage,engine,width,'PASS',flush=True)
     ctx.close()
   finally:browser.close()
 save(stage+'-browsers.json',result)

def local():
 static()
 srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT)))
 threading.Thread(target=srv.serve_forever,daemon=True).start()
 try:run_browser(f'http://127.0.0.1:{srv.server_port}/','local')
 finally:srv.shutdown()

def live():
 expected=sha(Path('index.html').read_bytes())
 for i in range(30):
  r=requests.get('https://andreagiaquinto.it/',timeout=20)
  if r.status_code==200 and sha(r.content)==expected:break
  print('Waiting for public deployment',i,flush=True);time.sleep(10)
 else:raise RuntimeError('Live hash does not match candidate')
 s=BeautifulSoup(r.content,'html.parser');assets=set()
 for tag in s.select('[src],[href]'):
  u=tag.get('src') or tag.get('href')
  if u and not u.startswith(('#','tel:','mailto:')):
   url=urljoin(r.url,u)
   if urlparse(url).netloc=='andreagiaquinto.it':assets.add(url)
 for tag in s.select('[srcset]'):
  for candidate in tag['srcset'].split(','):assets.add(urljoin(r.url,candidate.strip().split()[0]))
 assets.update('https://andreagiaquinto.it/'+str(p) for p in Path('assets/services').glob('*') if p.suffix in ['.avif','.webp','.jpg'])
 assets.update(['https://andreagiaquinto.it/robots.txt','https://andreagiaquinto.it/sitemap.xml','https://andreagiaquinto.it/google935272c73b59739f.html'])
 proof=[]
 for u in sorted(assets):
  response=requests.get(u,timeout=25);assert response.status_code==200,(u,response.status_code)
  local=ROOT/urlparse(u).path.lstrip('/');local=local/'index.html' if local.is_dir() else local
  assert local.exists() and sha(local.read_bytes())==sha(response.content),(u,'hash mismatch')
  if local.suffix in ['.avif','.webp','.jpg','.svg']:assert response.headers.get('Content-Type','').startswith('image/'),(u,'mime')
  proof.append({'url':u,'status':response.status_code,'bytes':len(response.content),'mime':response.headers.get('Content-Type'),'sha256':sha(response.content)})
 save('live-assets.json',proof)
 run_browser('https://andreagiaquinto.it/','live')

if __name__=='__main__':{'local':local,'live':live,'static':static}[sys.argv[1]]()
