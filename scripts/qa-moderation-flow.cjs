// Real browser form navigations against an in-memory Worker; no remote writes or emails.
const assert = require('node:assert/strict');
const { createHmac, randomUUID } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const host = 'https://moderation.example.invalid';

function fixture(family, action) {
  const entries = new Map(), id = randomUUID(), exp = String(Math.floor(Date.now() / 1000) + 600);
  const project = 'express-tools', secret = 'isolated-moderation-browser-test';
  const createdAt = '2026-10-29T12:00:00.000Z';
  const pending = family === 'plugin' ? `plugin-comments-pending/${project}/${id}.json` : `reviews-pending/${id}.json`;
  const published = family === 'plugin' ? `plugin-comments/${project}/${createdAt}_${id}.json` : `reviews/${createdAt.replace(/[:.]/g, '-')}-${id}.json`;
  const record = { id, project, createdAt, name: 'Dati simulati', displayName: 'Dati simulati', text: 'Commento di prova conservato soltanto in memoria.', kind: 'Domanda', status: 'pending' };
  if (action === 'delete') {
    entries.set(published, JSON.stringify({ ...record, status: 'approved' }));
    if (family === 'plugin') entries.set(`plugin-comments-index/${project}/${id}.json`, JSON.stringify(record));
  } else entries.set(pending, JSON.stringify(record));
  const message = family === 'plugin' ? `plugin-comment|${project}|${id}|${action}|${exp}` : `review|${id}|${action}|${exp}`;
  const sig = createHmac('sha256', secret).update(message).digest('base64url');
  const url = new URL(family === 'plugin' ? '/api/plugin-comment-manage' : '/api/review-manage', host);
  url.search = new URLSearchParams({ ...(family === 'plugin' ? { project } : {}), id, action, exp, sig }).toString();
  const env = {
    SIGNING_SECRET: secret, ALLOWED_ORIGIN: 'https://andreagiaquinto.it',
    QUOTE_FILES: {
      get: async key => entries.has(key) ? { json: async () => JSON.parse(entries.get(key)) } : null,
      put: async (key, value) => entries.set(key, value),
      delete: async key => entries.delete(key),
      list: async ({ prefix }) => ({ objects: [...entries.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })), truncated: false })
    }
  };
  return { entries, env, pending, published, url: url.href };
}

async function main() {
  const worker = (await import(pathToFileURL(path.resolve(__dirname, '../cloudflare-worker/src/index.js')))).default;
  const playwright = require('playwright');
  const originalFetch = global.fetch;
  // Any attempt by the Worker to contact an email provider is a test failure.
  global.fetch = async () => { throw new Error('Unexpected external request in moderation test'); };
  let passed = 0;
  try {
    for (const engine of (process.env.QA_ENGINES || 'chromium,firefox,webkit').split(',')) {
      const browser = await playwright[engine].launch();
      try {
        for (const width of [390, 1440]) {
          for (const family of ['plugin', 'review']) {
            for (const action of ['approve', 'reject', 'delete']) {
              const f = fixture(family, action), before = JSON.stringify([...f.entries]);
              const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
              const posts = [];
              try {
                await context.route('**/*', async route => {
                  const request = route.request();
                  assert.equal(new URL(request.url()).origin, host, 'No external network requests');
                  const headers = await request.allHeaders();
                  if (request.method() === 'POST') posts.push(headers);
                  const response = await worker.fetch(new Request(request.url(), {
                    method: request.method(), headers,
                    ...(request.method() === 'POST' ? { body: request.postData() || '' } : {})
                  }), f.env);
                  await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
                });
                const page = await context.newPage();
                const initial = await page.goto(f.url);
                assert.equal(initial.status(), 200);
                assert.equal(JSON.stringify([...f.entries]), before, 'Opening the email link must not moderate');
                const button = page.getByRole('button');
                const box = await button.boundingBox();
                assert.ok(box && box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width);
                const [confirmation] = await Promise.all([
                  page.waitForResponse(r => r.request().method() === 'POST'), button.click()
                ]);
                assert.equal(confirmation.status(), 200, `${engine}/${family}/${action}: approval must pass the origin guard`);
                await page.waitForLoadState('load');
                assert.equal(posts.length, 1);
                assert.equal(posts[0].origin, host, 'Browser must retain its real origin');
                assert.equal(posts[0].referer, host + '/', 'Signed URL must not leak through Referer');
                assert.doesNotMatch(await page.locator('body').innerText(), /Origine non autorizzata|Link non valido/);
                if (action === 'approve') {
                  assert.ok(!f.entries.has(f.pending));
                  assert.ok(f.entries.has(f.published));
                } else if (action === 'reject') {
                  assert.ok(!f.entries.has(f.pending) && !f.entries.has(f.published));
                } else if (family === 'plugin') {
                  assert.equal(JSON.parse(f.entries.get(f.published)).deleted, true);
                } else assert.ok(!f.entries.has(f.published));
                // Reopening the email link is harmless and does not repeat a write.
                const completed = JSON.stringify([...f.entries]);
                await page.goto(f.url);
                assert.equal(JSON.stringify([...f.entries]), completed);
                passed++;
                console.log(`PASS ${engine} ${width}px ${family} ${action}`);
              } finally { await context.close(); }
            }
          }
        }
      } finally { await browser.close(); }
    }
  } finally { global.fetch = originalFetch; }
  console.log(`${passed} real-browser moderation flows passed; no real comments, email or analytics.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
