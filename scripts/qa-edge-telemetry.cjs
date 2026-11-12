// Cloudflare adds its beacon only on the public site. Keep test visits out of
// its statistics, without allowing any real write or changing production.
'use strict';
async function mockEdgeTelemetry(route) {
  const request = route.request(), url = new URL(request.url());
  const beacon = request.method() === 'POST' && url.origin === 'https://andreagiaquinto.it' && url.pathname === '/cdn-cgi/rum';
  if (!beacon) return false;
  // Load the original script unchanged so browser SRI checks still run. Mock
  // only its outbound measurement, never the script or the page itself.
  await route.fulfill({status:204, body:''});
  return true;
}
module.exports = mockEdgeTelemetry;
