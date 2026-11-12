// Cloudflare adds its beacon only on the public site. Keep test visits out of
// its statistics, without allowing any real write or changing production.
'use strict';
async function mockEdgeTelemetry(route) {
  const request = route.request(), url = new URL(request.url());
  const script = request.method() === 'GET' && url.origin === 'https://static.cloudflareinsights.com' && /^\/beacon\.min\.js(?:\/[a-zA-Z0-9]+)?$/.test(url.pathname);
  const beacon = request.method() === 'POST' && url.origin === 'https://andreagiaquinto.it' && url.pathname === '/cdn-cgi/rum';
  if (!script && !beacon) return false;
  await route.fulfill(script ? {status:200, contentType:'application/javascript', body:''} : {status:204, body:''});
  return true;
}
module.exports = mockEdgeTelemetry;
