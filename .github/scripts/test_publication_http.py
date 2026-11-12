"""Content integrity must still detect real regressions after CDN normalization."""
import unittest
from publication_http import normalized_html

class PublicationIntegrity(unittest.TestCase):
    def test_only_known_edge_transformations_are_reversed(self):
        email = 'andrea.giaqui@gmail.com'
        key = 99
        encoded = bytes([key] + [b ^ key for b in email.encode()]).hex()
        original = f'<h1>Servizi</h1><a href="mailto:{email}">{email}</a>\n</body>'
        online = f'<h1>Servizi</h1><a href="/cdn-cgi/l/email-protection#{encoded}"><span class="__cf_email__" data-cfemail="{encoded}">[email&#160;protected]</span></a>\n<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/v1" data-cf-beacon=\'{{"version":"1"}}\'></script>\n</body>'
        self.assertEqual(normalized_html(online.encode()), original.encode())
        self.assertNotEqual(normalized_html(online.replace('Servizi', 'Contenuto diverso').encode()), original.encode())
        self.assertNotEqual(normalized_html(online.replace('</body>', '<script src="/changed.js"></script></body>').encode()), original.encode())
        self.assertEqual(normalized_html(original.encode()), original.encode())
        wrapped = f'<p>Contatto: <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="{encoded}">[email&#160;protected]</a></p>'
        self.assertEqual(normalized_html(wrapped.encode()), f'<p>Contatto: {email}</p>'.encode())

    def test_unrecognized_scripts_and_mail_links_remain(self):
        html = b'<a href="mailto:other@example.com">Email</a><script src="https://example.com/beacon.min.js"></script>'
        self.assertEqual(normalized_html(html), html)

if __name__ == '__main__':
    unittest.main()
