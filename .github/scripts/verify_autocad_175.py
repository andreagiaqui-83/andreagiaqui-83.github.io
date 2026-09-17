"""Read-only public AutoCAD 17.5 checks: no form submissions or ad activation."""
import asyncio
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright

BASE = 'https://andreagiaquinto.it'
URL = BASE + '/lezioni-autocad/'
EXPECTED = '20260917-autocad-v17.5'
WIDTHS = [320, 360, 375, 390, 412, 430, 600, 768, 800, 1024, 1366, 1440, 1920]
OUT = Path(os.environ.get('QA_OUTPUT', 'qa-results'))
OUT.mkdir(parents=True, exist_ok=True)

async def readonly(route):
    if route.request.method not in ('GET', 'HEAD', 'OPTIONS'):
        await route.abort('blockedbyclient')
    else:
        await route.continue_()

async def load_images(page):
    # Force lazy assets to load for integrity checks, not performance scoring.
    await page.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
    await page.wait_for_function("[...document.images].filter(i=>i.currentSrc||i.getAttribute('src')).every(i=>i.complete)", timeout=25000)

async def inspect(page):
    return await page.evaluate("""() => {
      const images = [...document.images].filter(i=>i.currentSrc||i.getAttribute('src'));
      const ids = [...document.querySelectorAll('[id]')].map(x=>x.id);
      const missingAnchors = [...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(decodeURIComponent(h.slice(1))));
      const sections = [...document.querySelectorAll('main section[id]')].map(e=>({id:e.id,visible:!!(e.getClientRects().length&&getComputedStyle(e).display!=='none')}));
      return {
        build:document.body.dataset.build, h1:document.querySelectorAll('h1').length,
        duplicateIds:ids.filter((x,i)=>ids.indexOf(x)!==i), missingAnchors,
        overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
        images:images.map(i=>({src:new URL(i.currentSrc||i.src,location.href).pathname,ok:i.complete&&i.naturalWidth>0,width:i.naturalWidth,height:i.naturalHeight})),
        googleScripts:[...document.scripts].filter(s=>/googletagmanager|google-analytics|doubleclick/.test(s.src)).map(s=>s.src),
        sections, forms:[...document.forms].map(f=>f.id),
        robots:document.querySelector('meta[name="robots"]')?.content,
        canonical:document.querySelector('link[rel="canonical"]')?.href,
        title:document.title,
        jsonLdValid:[...document.querySelectorAll('script[type="application/ld+json"]')].every(s=>{try{JSON.parse(s.textContent);return true}catch{return false}})
      };
    }""")

async def check_width(browser, width, lock):
    async with lock:
        result={'width':width,'checks':{},'errors':[],'httpErrors':[],'pageErrors':[]}
        context=await browser.new_context(viewport={'width':width,'height':900},device_scale_factor=2 if width<=800 else 1,reduced_motion='reduce')
        await context.route('**/*',readonly)
        page=await context.new_page()
        page.on('pageerror',lambda error:result['pageErrors'].append(str(error)))
        page.on('response',lambda r:result['httpErrors'].append({'status':r.status,'url':r.url}) if r.status>=400 and urlparse(r.url).netloc==urlparse(BASE).netloc else None)
        try:
            response=await page.goto(URL,wait_until='domcontentloaded',timeout=60000)
            result['checks']['http200']=bool(response and response.status==200)
            await page.wait_for_selector('.program-image-link',timeout=20000)
            await load_images(page)
            detail=await inspect(page)
            result['page']=detail
            result['checks'].update({
                'currentRelease':detail['build']==EXPECTED,
                'noHorizontalOverflow':detail['overflow']<=2,
                'oneH1':detail['h1']==1,
                'uniqueIds':not detail['duplicateIds'],
                'validAnchors':not detail['missingAnchors'],
                'allImagesLoaded':all(i['ok'] for i in detail['images']),
                'threeEnlargeableImages':await page.locator('.program-image-link').count()==3,
                'formsPreserved':all(f in detail['forms'] for f in ('lessonForm','reviewForm')),
                'trackingNotActive':not detail['googleScripts'],
                'structuredDataValid':detail['jsonLdValid'],
                'canonicalCorrect':detail['canonical']==URL,
            })
            await page.screenshot(path=str(OUT/f'hero-{width}.png'))
            if width in (390,1366):
                await page.screenshot(path=str(OUT/f'full-{width}.png'),full_page=True)
            modal_results=[]
            for idx in range(await page.locator('.program-image-link').count()):
                opener=page.locator('.program-image-link').nth(idx)
                await opener.click()
                await page.wait_for_function("document.querySelector('#programImageDialog')?.open === true")
                await page.wait_for_function("document.querySelector('#programImageDetail').complete && document.querySelector('#programImageDetail').naturalWidth>0")
                dimensions=await page.locator('#programImageDialog').bounding_box()
                await page.locator('#imageZoom').click()
                zoomed=await page.locator('#imageZoom').get_attribute('aria-pressed')=='true'
                await page.locator('#imageZoom').click()
                restored=await page.locator('#imageZoom').get_attribute('aria-pressed')=='false'
                if idx==0 and width in (390,1366):
                    await page.screenshot(path=str(OUT/f'lightbox-{width}.png'))
                await page.keyboard.press('Escape')
                await page.wait_for_function("!document.querySelector('#programImageDialog').open")
                focus=await opener.evaluate('(el)=>document.activeElement===el')
                modal_results.append({'image':idx+1,'loaded':True,'fitsViewport':bool(dimensions and dimensions['width']<=width+1 and dimensions['height']<=901),'zoom':zoomed and restored,'escape':True,'focusRestored':focus})
            result['dialogs']=modal_results
            result['checks']['imageViewer']=all(all(v for k,v in m.items() if k!='image') for m in modal_results)
            menu=page.locator('.menu-toggle')
            if await menu.is_visible():
                await page.evaluate('window.scrollTo(0,0)')
                await menu.click()
                opened=await menu.get_attribute('aria-expanded')=='true'
                await page.keyboard.press('Escape')
                closed=await menu.get_attribute('aria-expanded')=='false'
                result['checks']['mobileMenu']=opened and closed
            await page.locator('#contatti').scroll_into_view_if_needed()
            result['checks']['contactReachable']=await page.locator('#lessonForm').is_visible()
            result['checks']['noJavascriptExceptions']=not result['pageErrors']
            result['checks']['noAssetHttpErrors']=not result['httpErrors']
        except Exception as exc:
            result['errors'].append(str(exc))
        finally:
            result['ok']=not result['errors'] and all(result['checks'].values())
            await context.close()
        print(json.dumps({'width':width,'ok':result['ok'],'failed':[k for k,v in result['checks'].items() if not v],'errors':result['errors']},ensure_ascii=False),flush=True)
        return result

async def check_preview(browser):
    result={'checks':{},'errors':[]}
    context=await browser.new_context(viewport={'width':1366,'height':900},reduced_motion='reduce')
    await context.route('**/*',readonly)
    page=await context.new_page()
    try:
        await page.goto(URL,wait_until='domcontentloaded',timeout=60000)
        normal=await inspect(page)
        await page.goto(URL+'?anteprima=senza-render',wait_until='domcontentloaded',timeout=60000)
        preview=await inspect(page)
        removed=[s['id'] for s in normal['sections'] if s['visible'] and not next((t['visible'] for t in preview['sections'] if t['id']==s['id']),False)]
        result['hiddenSections']=removed
        result['checks']={
            'currentRelease':preview['build']==EXPECTED,
            'noindex':'noindex' in preview['robots'],
            'sameCanonical':preview['canonical']==URL,
            'oneSectionHidden':len(removed)==1,
            'previewNoteVisible':await page.locator('.visual-preview-note').is_visible(),
            'formsPreserved':normal['forms']==preview['forms'],
            'noHorizontalOverflow':preview['overflow']<=2,
        }
        await load_images(page)
        await page.screenshot(path=str(OUT/'preview-without-render.png'),full_page=True)
    except Exception as exc:
        result['errors'].append(str(exc))
    finally:
        await context.close()
    result['ok']=not result['errors'] and all(result['checks'].values())
    return result

async def main():
    began=time.monotonic()
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        try:
            lock=asyncio.Semaphore(3)
            widths=await asyncio.gather(*(check_width(browser,w,lock) for w in WIDTHS))
            preview=await check_preview(browser)
        finally:
            await browser.close()
    report={'checkedAt':datetime.now(timezone.utc).isoformat(),'sourceCommit':'40662acfd04fc3b6f58e029e8027a6b45b61ca10','expectedBuild':EXPECTED,'url':URL,'browser':'Chromium / Playwright 1.55.0','readOnly':True,'realEmailSent':False,'adsActivated':False,'fieldCoreWebVitalsMeasured':False,'widths':widths,'preview':preview,'elapsedSeconds':round(time.monotonic()-began,2)}
    report['ok']=all(x['ok'] for x in widths) and preview['ok']
    (OUT/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    summary=f"# AutoCAD 17.5 — verifica pubblica\n\nRelease: `{EXPECTED}`\n\nViewport superate: {sum(x['ok'] for x in widths)}/{len(WIDTHS)}. Anteprima: {'PASS' if preview['ok'] else 'FAIL'}.\n\nNessuna email inviata. Nessuna campagna attivata. Test browser automatizzati, non dati di performance sul campo.\n\n| Larghezza | Esito | Controlli falliti |\n|---|---|---|\n"
    for row in widths:
        summary+=f"| {row['width']} | {'PASS' if row['ok'] else 'FAIL'} | {', '.join(k for k,v in row['checks'].items() if not v) or '; '.join(row['errors']) or '—'} |\n"
    (OUT/'SUMMARY.md').write_text(summary,encoding='utf-8')
    step=os.environ.get('GITHUB_STEP_SUMMARY')
    if step:
        with open(step,'a',encoding='utf-8') as f:
            f.write(summary)
    print('QA_RESULT '+json.dumps({'ok':report['ok'],'widthsPassed':sum(x['ok'] for x in widths),'widthsTotal':len(WIDTHS),'preview':preview},ensure_ascii=False),flush=True)
    raise SystemExit(0 if report['ok'] else 1)

if __name__=='__main__':
    asyncio.run(main())
