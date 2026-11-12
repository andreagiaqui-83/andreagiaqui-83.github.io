"""Read-only publication checks; preserve Cloudflare protections and content checks."""
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BASE = 'https://andreagiaquinto.it/'
HEADERS = {'User-Agent': 'AndreaGiaquintoSiteAudit/1.0 (+https://andreagiaquinto.it/)', 'Cache-Control': 'no-cache'}
REDIRECTS = {name + '/index.html': BASE + 'ag-cad-tools/' for name in ('blockhub-cad', 'yqarch-italiano', 'express-tools-italiano')}

def decode_email(value):
    data = bytes.fromhex(value)
    return bytes(byte ^ data[0] for byte in data[1:]).decode('utf-8')

def normalized_html(data):
    """Undo only observed edge email encoding and two known injected scripts.

    Everything else, including text, links, styles and application scripts, is
    compared byte for byte. This does not change or disable the public page.
    """
    text = data.decode('utf-8')
    text = re.sub(r'href="/cdn-cgi/l/email-protection#([0-9a-f]+)"', lambda m: 'href="mailto:' + decode_email(m[1]) + '"', text)
    text = re.sub(r'<span class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email(?:&#160;|\s)protected\]</span>', lambda m: decode_email(m[1]), text)
    text = re.sub(r'<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email(?:&#160;|\s)protected\]</a>', lambda m: decode_email(m[1]), text)
    text = re.sub(r'<script data-cfasync="false" src="/cdn-cgi/scripts/[a-zA-Z0-9]+/cloudflare-static/email-decode\.min\.js"></script>', '', text)
    text = re.sub(r'<script type="module" src="https://static\.cloudflareinsights\.com/beacon\.min\.js(?:/[a-zA-Z0-9]+)?"[^>]* data-cf-beacon=\'[^\']*\'[^>]*></script>\n?', '', text)
    return text.encode('utf-8')

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def check_file(file):
    route = '' if file == 'index.html' else file.removesuffix('index.html') if file.endswith('/index.html') else file
    request = urllib.request.Request(BASE + route, headers=HEADERS)
    if file in REDIRECTS:
        try:
            urllib.request.build_opener(NoRedirect).open(request, timeout=25)
        except urllib.error.HTTPError as error:
            assert error.code == 301 and error.headers.get('Location') == REDIRECTS[file], (file, error.code, error.headers.get('Location'))
            return
        raise AssertionError(file + ': expected permanent 301 redirect')
    with urllib.request.urlopen(request, timeout=25) as response:
        data = response.read()
    if file.endswith('.html'):
        data = normalized_html(data)
    expected = Path(file).read_bytes()
    assert hashlib.sha256(data).digest() == hashlib.sha256(expected).digest(), file + ': published content differs'

def main():
    files = [e['file'] for e in json.loads(Path('scripts/site-pages.json').read_text()) if e['file'] != '404.html'] if '--all' in sys.argv else (sys.argv[1:] or ['index.html'])
    for attempt in range(12):
        try:
            with ThreadPoolExecutor(max_workers=4) as pool:
                list(pool.map(check_file, files))
            print('Verified published content and permanent redirects:', len(files))
            return
        except urllib.error.HTTPError as error:
            if error.code in (401, 403, 429):
                raise  # Report blocked access; do not loop or change identity.
            if attempt == 11:
                raise
            print('Waiting for publication:', error, flush=True)
        except (AssertionError, urllib.error.URLError) as error:
            if attempt == 11:
                raise
            print('Waiting for publication:', error, flush=True)
        time.sleep(10)

if __name__ == '__main__':
    main()
