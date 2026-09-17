"""GA4 browser tests. Forms and collection are mocked, apart from one optional
labelled live page_view smoke test after publication. No real leads or emails."""
import asyncio
import json
import mimetypes
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote
from playwright.async_api import async_playwright
BASE='https://andreagiaquinto.it'
MID='G-SQ7LJ1FVVY'
ROOT=Path('.').resolve()
OUT=Path('ga4-results'); OUT.mkdir(exist_ok=True)
LIVE=os.environ.get('GA4_TEST_LIVE')=='1'
KEY='ag_cookie_preferences'
report={'date':datetime.now(timezone.utc).isoformat(),'mode':'live' if LIVE else 'candidate','id':MID,'checks':[],'realEmailsSent':0,'realLeadsSent':0,'realPageViewsSent':0,'dashboardVerified':False}

def check(name,value,detail=None):
    row={'name':name,'ok':bool(value)}
    if detail is not None:row['detail']=detail
    report['checks'].append(row)
    print('CHECK '+json.dumps(row,ensure_ascii=False),flush=True)
    if not value:raise AssertionError(name+': '+str(detail))

def event_rows(request):
    common={k:v[-1] for k,v in parse_qs(urlparse(request.url).query).items()}
    # GA4 batches multiple records in one POST, separated by newlines. Each
    # event inherits the common URL parameters but has its own name/payload.
    lines=(request.post_data or '').strip().splitlines()
    if not lines:return [common]
    return [{**common,**{k:v[-1] for k,v in parse_qs(line).items()}} for line in lines]

async def fixture(browser,width=1366,seed=None,smoke=False):
    context=await browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
    state={'google':[],'events':[],'writes':[],'errors':[],'actualResponses':[],'allowedReal':0}
    if seed is not None:
        await context.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('"+KEY+"',JSON.stringify("+json.dumps(seed)+"));sessionStorage.setItem('seeded','1');}")
    async def router(route):
        req=route.request;u=urlparse(req.url)
        if u.hostname=='cad-bim-preventivi.andrea-giaqui.workers.dev':
            if req.method=='POST':
                state['writes'].append(u.path)
                body=json.loads(req.post_data or '{}')
                if u.path=='/api/lessons':
                    return await route.fulfill(status=200,content_type='application/json',headers={'Access-Control-Allow-Origin':BASE},body=json.dumps({'ok':True,'requestId':body.get('requestId')}))
                return await route.abort()
            return await route.fulfill(status=200,content_type='application/json',headers={'Access-Control-Allow-Origin':BASE},body='{"ok":true,"reviews":[]}')
        if u.hostname=='andreagiaquinto.it':
            if req.method not in ('GET','HEAD'):return await route.abort()
            if LIVE:return await route.continue_()
            relative=unquote(u.path).lstrip('/')
            if not relative or relative.endswith('/'):relative+='index.html'
            path=(ROOT/relative).resolve()
            if not path.is_relative_to(ROOT) or not path.is_file():return await route.fulfill(status=404,body='Not found')
            return await route.fulfill(status=200,body=path.read_bytes(),content_type=mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
        if u.hostname=='www.googletagmanager.com' and u.path=='/gtag/js':
            state['google'].append('tag:'+parse_qs(u.query).get('id',[''])[0])
            if parse_qs(u.query).get('id')!=[MID]:return await route.abort()
            if LIVE:return await route.continue_()
            return await route.fulfill(status=200,content_type='application/javascript',body=(OUT/'google-tag.js').read_bytes())
        if (u.hostname or '').endswith('google-analytics.com') and '/collect' in u.path:
            rows=event_rows(req)
            state['events'].extend(rows)
            state['google'].extend('collect:'+p.get('en','') for p in rows)
            # Never forward batched synthetic records or any lead to Google.
            if smoke and len(rows)==1 and rows[0].get('en')=='page_view' and rows[0].get('tid')==MID and state['allowedReal']==0:
                state['allowedReal']+=1
                return await route.continue_()
            return await route.fulfill(status=204,headers={'Access-Control-Allow-Origin':'*'})
        state['google'].append('blocked:'+str(u.hostname)+u.path)
        return await route.abort()
    await context.route('**/*',router)
    page=await context.new_page()
    page.on('pageerror',lambda exc:state['errors'].append(str(exc)))
    def response(r):
        if smoke and (urlparse(r.url).hostname or '').endswith('google-analytics.com'):
            for p in event_rows(r.request):
                if p.get('en')=='page_view':state['actualResponses'].append({'status':r.status,'id':p.get('tid'),'event':p.get('en')})
    page.on('response',response)
    return context,page,state

async def ready(page,path='/lezioni-autocad/'):
    r=await page.goto(BASE+path,wait_until='domcontentloaded',timeout=45000)
    assert r and r.status==200
    await page.wait_for_function('!!window.AGTracking && !!document.querySelector(".ag-consent")')
    cfg=await page.evaluate('window.AG_MEASUREMENT')
    assert cfg['ga4Id']==MID and cfg['adsId']=='' and cfg['adsLeadLabel']=='' and cfg['consentVersion']==2

async def accept(page):
    await page.locator('#ag-analytics').check()
    await page.locator('[data-choice="save"]').click()

async def wait_event(page,state,name):
    for _ in range(150):
        if any(e.get('en')==name for e in state['events']):return
        await page.wait_for_timeout(100)
    report['failureDiagnostics']={'expectedEvent':name,'recordedEvents':[e.get('en') for e in state['events']],'mockedWrites':state['writes'],'errors':state['errors'],'googleRequests':state['google'],'pageState':await page.evaluate("({status:document.querySelector('#formStatus')?.textContent,events:window.dataLayer?.filter(x=>x[0]==='event').map(x=>x[1]),consent:window.AGTracking?.getConsent()})")}
    raise AssertionError('No intercepted GA4 event '+name)

async def cookie_names(context):
    return sorted(c['name'] for c in await context.cookies() if re.match(r'^(_ga|_gid|_gat|_gcl)',c['name']))

async def run(browser):
    for path in ('/','/lezioni-autocad/','/privacy/'):
        ctx,page,s=await fixture(browser)
        try:
            await ready(page,path);await page.wait_for_timeout(400)
            check('Default denies Google '+path,not s['google'] and not await cookie_names(ctx))
            check('Consent displayed '+path,await page.locator('.ag-consent').is_visible())
            check('Stats optional and Ads disabled '+path,not await page.locator('#ag-analytics').is_checked() and await page.locator('#ag-marketing').is_disabled())
            await page.locator('[data-choice="reject"]').click()
            await page.reload(wait_until='domcontentloaded');await page.wait_for_timeout(400)
            check('Rejection persists '+path,not s['google'] and not await cookie_names(ctx) and not await page.locator('.ag-consent').is_visible())
            check('No page exception '+path,not s['errors'],s['errors'])
        finally:await ctx.close()
    ctx,page,s=await fixture(browser)
    try:
        await ready(page,'/lezioni-autocad/?utm_source=technical_check&utm_medium=qa&utm_campaign=ga4_activation&email=PRIVATE%40example.invalid')
        await accept(page);await wait_event(page,s,'page_view');await page.wait_for_timeout(750)
        pv=[e for e in s['events'] if e.get('en')=='page_view']
        check('Single page view after explicit consent',len(pv)==1,len(pv))
        check('Correct measurement destination',pv[0].get('tid')==MID)
        check('Private query excluded','PRIVATE' not in json.dumps(s['events']) and 'email=' not in pv[0].get('dl',''))
        check('Only approved campaign parameters','utm_campaign=ga4_activation' in pv[0].get('dl',''))
        check('Analytics cookies created after consent',any(n.startswith('_ga') for n in await cookie_names(ctx)))
        check('No advertising cookies',not any(n.startswith('_gcl') for n in await cookie_names(ctx)))
        await page.locator('[data-consent-open]').click();await page.locator('[data-choice="all"]').click();await page.wait_for_timeout(300)
        check('Repeated preference save does not duplicate page view',len([e for e in s['events'] if e.get('en')=='page_view'])==1)
        await page.locator('#name').fill('Private Test Name')
        await page.locator('#email').fill('PRIVATE@example.invalid')
        await page.locator('#privacy').check()
        await page.locator('#lessonSubmit').click();await wait_event(page,s,'generate_lead')
        check('Mocked confirmed request generates one event',len([e for e in s['events'] if e.get('en')=='generate_lead'])==1)
        check('Contact fields absent from analytics','PRIVATE' not in json.dumps(s['events']) and 'Private Test Name' not in json.dumps(s['events']))
        check('Form API fully mocked',s['writes']==['/api/lessons'])
        await page.evaluate("window.AGTracking.track('contact_click',{contact_method:'whatsapp'})")
        await wait_event(page,s,'contact_click')
        check('WhatsApp click is not a lead',len([e for e in s['events'] if e.get('en')=='generate_lead'])==1)
        check('No direct Ads conversions',not any(e.get('en')=='conversion' for e in s['events']))
        await page.locator('[data-consent-open]').click();await page.locator('#ag-analytics').uncheck()
        async with page.expect_navigation(wait_until='domcontentloaded'):
            await page.locator('[data-choice="save"]').click()
        await page.wait_for_timeout(400)
        check('Withdrawal saved',await page.evaluate('window.AGTracking.getConsent().analytics') is False)
        check('Measurement cookies removed on withdrawal',not await cookie_names(ctx))
        before=len(s['google'])
        await page.reload(wait_until='domcontentloaded');await page.wait_for_timeout(500)
        check('No tag reload or events after withdrawal',len(s['google'])==before)
    finally:await ctx.close()
    seed={'version':1,'analytics':True,'marketing':True,'expires':9999999999999}
    ctx,page,s=await fixture(browser,seed=seed)
    try:
        await ready(page);await page.wait_for_timeout(400)
        check('Old preference version requires a fresh choice',await page.locator('.ag-consent').is_visible() and not s['google'])
    finally:await ctx.close()
    for width in (320,390,768,1366,1920):
        ctx,page,s=await fixture(browser,width=width)
        try:
            await ready(page);box=await page.locator('.ag-consent').bounding_box()
            check('Consent fits viewport '+str(width),bool(box and box['x']>=-1 and box['width']<=width+1 and box['height']<=901))
            if width in (390,1366):await page.screenshot(path=str(OUT/f'consent-{width}.png'))
            await page.keyboard.press('Escape')
            check('Escape rejects optional tracking '+str(width),not await page.locator('.ag-consent').is_visible() and not s['google'])
            await page.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
            await page.wait_for_function("[...document.images].filter(i=>i.currentSrc||i.getAttribute('src')).every(i=>i.complete)")
            check('Images intact '+str(width),await page.evaluate("[...document.images].filter(i=>i.currentSrc||i.getAttribute('src')).every(i=>i.naturalWidth>0)"))
            check('No overflow '+str(width),await page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
        finally:await ctx.close()
    if LIVE:
        ctx,page,s=await fixture(browser,smoke=True)
        try:
            await ready(page,'/lezioni-autocad/?utm_source=technical_check&utm_medium=qa&utm_campaign=ga4_activation')
            check('Live smoke: no request before choice',not s['google'])
            await accept(page)
            for _ in range(100):
                if s['actualResponses']:break
                await page.wait_for_timeout(100)
            check('One real labelled page view accepted by Google',s['allowedReal']==1 and len(s['actualResponses'])==1 and s['actualResponses'][0]['status'] in (200,204),s['actualResponses'])
            report['realPageViewsSent']=1;report['smoke']=s['actualResponses']
            check('Smoke generated no form request',not s['writes'])
        finally:await ctx.close()

async def main():
    try:
        async with async_playwright() as p:
            browser=await p.chromium.launch()
            try:await run(browser)
            finally:await browser.close()
    except Exception as exc:report['error']=str(exc)
    report['ok']=bool(report['checks']) and all(r['ok'] for r in report['checks']) and 'error' not in report
    (OUT/('live-report.json' if LIVE else 'candidate-browser.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print('GA4_RESULT '+json.dumps(report,ensure_ascii=False),flush=True)
    raise SystemExit(0 if report['ok'] else 1)
if __name__=='__main__':asyncio.run(main())
