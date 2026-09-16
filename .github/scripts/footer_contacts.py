"""Update footer contacts and verify candidate and public browser rendering."""
from pathlib import Path
import functools
import hashlib
import html
import http.server
import json
import os
import re
import sys
import threading
import time
from urllib.parse import quote, urljoin, urlsplit, parse_qs
from bs4 import BeautifulSoup
import requests

BUILD = '20260916-contatti-01'
CSS = 'footer-contacts-20260916.css'
MESSAGE = 'Ciao Andrea, vorrei richiedere un preventivo.'
PROOF = Path(os.environ.get('RUNNER_TEMP', '/tmp')) / 'footer-proof'


def icon(body, stroke=False):
    attrs = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' if stroke else 'fill="currentColor"'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" {attrs} aria-hidden="true" focusable="false">{body}</svg>'


FB = icon('<circle cx="12" cy="12" r="12" fill="#0866ff"/><path fill="#fff" d="M16.671 15.469 17.203 12h-3.328V9.749c0-.949.465-1.874 1.956-1.874h1.513V4.922S15.971 4.688 14.658 4.688c-2.741 0-4.533 1.661-4.533 4.668V12H7.078v3.469h3.047v8.385a12.077 12.077 0 0 0 3.75 0v-8.385z"/>')
WA = icon('<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>', True)
PHONE = icon('<path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.19 18a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.91-8.67A2 2 0 0 1 4.11 1.2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.1a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.57 2.8.7A2 2 0 0 1 22 16.92z"/>', True)
MAIL = icon('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', True)


def prepare():
    p = Path('index.html')
    original = p.read_text(encoding='utf-8')
    soup = BeautifulSoup(original, 'html.parser')
    contact = soup.select_one('footer .contact-links')
    assert contact, 'Missing current contacts'
    tel = contact.select_one('a[href^="tel:"]')
    email = contact.select_one('a[href^="mailto:"]')
    facebook = contact.select_one('a[href^="https://www.facebook.com/"]')
    assert tel and email and facebook, 'Existing contacts must be preserved'
    number = re.sub(r'\D', '', tel['href'])
    assert number == '393337240544', 'Unexpected phone: do not publish a guessed number'
    assert facebook['href'] == 'https://www.facebook.com/disegnatoreautocadonline'
    wa_url = 'https://wa.me/' + number + '?text=' + quote(MESSAGE, safe='')
    new = (f'<div class="contact-links footer-contacts" role="group" aria-label="Contatti diretti e social">'
           f'<div class="footer-contact-actions">'
           f'<a class="footer-contact-button footer-contact-button--whatsapp" href="{html.escape(wa_url, quote=True)}" target="_blank" rel="noopener noreferrer" aria-label="Scrivimi su WhatsApp al numero +39 333 724 0544 (si apre in una nuova scheda)">{WA}<span>Scrivimi su WhatsApp</span></a>'
           f'<a class="footer-contact-button footer-contact-button--facebook" href="{html.escape(facebook["href"], quote=True)}" target="_blank" rel="noopener noreferrer" aria-label="Visita la pagina Facebook Disegnatore AutoCAD Online (si apre in una nuova scheda)">{FB}<span>Seguimi</span></a>'
           f'</div><div class="footer-contact-details">'
           f'<a class="footer-contact-link" href="{html.escape(tel["href"], quote=True)}" aria-label="Chiama Andrea Giaquinto al +39 333 724 0544">{PHONE}<span>{html.escape(tel.get_text(strip=True))}</span></a>'
           f'<a class="footer-contact-link" href="{html.escape(email["href"], quote=True)}">{MAIL}<span>{html.escape(email.get_text(strip=True))}</span></a>'
           '</div></div>')
    assert 'footer-contacts' not in original, 'Already installed: avoid duplicate controls'
    old_match = re.search(r'<div class="contact-links">.*?</div>', original)
    assert old_match
    updated = original[:old_match.start()] + new + original[old_match.end():]
    link = f'<link rel="stylesheet" href="{CSS}?v={BUILD}">'
    assert updated.count('</head>') == 1 and Path(CSS).is_file()
    updated = updated.replace('</head>', link + '</head>', 1)
    old_build = re.search(r'data-build="([^"]+)"', original)[1]
    updated, count = re.subn(r'data-build="[^"]+"', f'data-build="{BUILD}"', updated, count=1)
    assert count == 1
    assert updated.replace(new, old_match[0], 1).replace(link, '', 1).replace(f'data-build="{BUILD}"', f'data-build="{old_build}"', 1) == original
    assert re.search(r'<main\b.*?</main>', updated, re.S)[0] == re.search(r'<main\b.*?</main>', original, re.S)[0]
    script_path = Path('script.js')
    old_script = script_path.read_text(encoding='utf-8')
    destructive = "if (link.closest('footer')) link.textContent"
    guarded = "if (link.closest('footer') && !link.querySelector('svg')) link.textContent"
    assert old_script.count(destructive) == 1, 'Expected the known legacy footer label rewrite'
    new_script = old_script.replace(destructive, guarded, 1)
    assert new_script.replace(guarded, destructive, 1) == old_script
    script_pattern = r'(<script src="script\.js\?v=)[^"]+(")'
    updated, count = re.subn(script_pattern, lambda m: m[1] + BUILD + m[2], updated, count=1)
    assert count == 1, 'Must update the script cache key'
    script_path.write_text(new_script, encoding='utf-8')
    p.write_text(updated, encoding='utf-8')
    PROOF.mkdir(parents=True, exist_ok=True)
    (PROOF/'change-scope.json').write_text(json.dumps({'build': BUILD, 'scope': 'Footer contacts, scoped stylesheet, cache keys and guard preserving the Facebook icon; form logic unchanged', 'phone': tel['href'], 'facebook': facebook['href'], 'whatsapp': wa_url, 'unchanged_main': True}, indent=2))
    print('FOOTER_ONLY_CHANGE_VERIFIED', flush=True)


def browsers(base, stage):
    from playwright.sync_api import sync_playwright
    PROOF.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as p:
        for engine, widths in [('chromium', [320, 360, 393, 412, 768, 1024, 1440, 1920]), ('webkit', [390, 1440])]:
            browser = getattr(p, engine).launch()
            try:
                for width in widths:
                    context = browser.new_context(viewport={'width': width, 'height': 900}, device_scale_factor=2 if width < 768 else 1, is_mobile=width < 768, has_touch=width < 768)
                    page = context.new_page()
                    page.set_default_timeout(45000)
                    response = page.goto(base, wait_until='domcontentloaded')
                    assert response and response.status == 200
                    page.emulate_media(reduced_motion='reduce')
                    page.add_style_tag(content='html{scroll-behavior:auto!important}')
                    assert page.locator('body').get_attribute('data-build') == BUILD
                    render = page.locator('#render .render-visual img')
                    render.scroll_into_view_if_needed()
                    render.evaluate('(i)=>i.decode()')
                    assert render.evaluate('(i)=>i.naturalWidth') == 1280
                    footer = page.locator('footer')
                    footer.scroll_into_view_if_needed()
                    page.wait_for_timeout(300)
                    if width in [320, 390, 393, 1440]:
                        footer.screenshot(path=str(PROOF/f'{stage}-{engine}-{width}.png'), animations='disabled')
                    contacts = page.locator('footer .footer-contacts')
                    links = contacts.locator('a')
                    assert links.count() == 4
                    wa = contacts.locator('.footer-contact-button--whatsapp')
                    fb = contacts.locator('.footer-contact-button--facebook')
                    parsed = urlsplit(wa.get_attribute('href'))
                    assert parsed.scheme == 'https' and parsed.netloc == 'wa.me' and parsed.path == '/393337240544'
                    assert parse_qs(parsed.query)['text'] == [MESSAGE]
                    assert fb.get_attribute('href') == 'https://www.facebook.com/disegnatoreautocadonline'
                    assert contacts.locator('a[href="tel:+393337240544"]').count() == 1
                    assert contacts.locator('a[href="mailto:andrea.giaqui@gmail.com"]').count() == 1
                    assert contacts.locator('svg').count() == 4
                    metrics = []
                    for i in range(4):
                        a = links.nth(i)
                        b = a.bounding_box()
                        assert b and b['height'] >= 43.5 and b['width'] >= 44, b
                        assert b['x'] >= -1 and b['x'] + b['width'] <= width + 1, b
                        assert a.is_visible()
                        assert a.locator('svg').bounding_box()['width'] >= 19
                        metrics.append(b)
                    a, b = metrics[:2]
                    overlap = min(a['x']+a['width'], b['x']+b['width'])-max(a['x'], b['x']) > 1 and min(a['y']+a['height'], b['y']+b['height'])-max(a['y'], b['y']) > 1
                    assert not overlap
                    if width < 576:
                        assert b['y'] >= a['y'] + a['height'], (a,b)
                    for button in [wa, fb]:
                        assert button.get_attribute('target') == '_blank'
                        assert 'noopener' in button.get_attribute('rel')
                    wa.focus()
                    assert wa.evaluate('(a)=>document.activeElement===a')
                    results.append({'engine': engine, 'width': width, 'status': 'PASS', 'links': metrics, 'render_decoded': True})
                    print(stage.upper() + '_FOOTER_BROWSER_PASS', engine, width, flush=True)
                    context.close()
            finally:
                browser.close()
    (PROOF/f'{stage}-browser.json').write_text(json.dumps(results, indent=2))


def local():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(Path.cwd()))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        browsers(f'http://127.0.0.1:{server.server_port}/', 'local')
    finally:
        server.shutdown()
    print('LOCAL_FOOTER_VERIFIED', flush=True)


def live():
    base = 'https://andreagiaquinto.it/'
    expected_html = Path('index.html').read_bytes()
    expected_css = Path(CSS).read_bytes()
    expected_script = Path('script.js').read_bytes()
    for attempt in range(80):
        try:
            response = requests.get(base, timeout=20, headers={'Cache-Control': 'no-cache'})
            response.raise_for_status()
            assert response.content == expected_html, 'Waiting for exact published HTML'
            sheet = requests.get(urljoin(base, CSS) + '?v=' + BUILD, timeout=20)
            sheet.raise_for_status()
            assert 'text/css' in sheet.headers.get('Content-Type', '')
            assert sheet.content == expected_css, 'Waiting for complete CSS'
            js = requests.get(urljoin(base, 'script.js') + '?v=' + BUILD, timeout=20)
            js.raise_for_status()
            assert js.content == expected_script, 'Waiting for fixed footer icon guard'
            break
        except (requests.RequestException, AssertionError) as exc:
            print(f'Waiting for public delivery {attempt+1}/80: {exc}', flush=True)
            time.sleep(8)
    else:
        raise RuntimeError('Published footer not verified')
    browsers(base, 'live')
    report = {'build': BUILD, 'status': 'PASS', 'url': base, 'html_http': response.status_code, 'css_http': sheet.status_code, 'script_http': js.status_code, 'html_sha256': hashlib.sha256(expected_html).hexdigest(), 'css_sha256': hashlib.sha256(expected_css).hexdigest(), 'script_sha256': hashlib.sha256(expected_script).hexdigest(), 'browser_checks': 10}
    (PROOF/'live-http.json').write_text(json.dumps(report, indent=2))
    print('LIVE_FOOTER_VERIFIED', json.dumps(report), flush=True)


if __name__ == '__main__':
    {'prepare': prepare, 'local': local, 'live': live}[sys.argv[1]]()
