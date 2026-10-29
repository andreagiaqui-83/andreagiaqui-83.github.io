import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import worker from '../cloudflare-worker/src/index.js';

const host = 'https://worker.example';
function fixture(family) {
  const entries = new Map(), id = randomUUID(), exp = String(Math.floor(Date.now() / 1000) + 600);
  const project = 'express-tools', secret = 'isolated-origin-test';
  const pending = family === 'plugin' ? `plugin-comments-pending/${project}/${id}.json` : `reviews-pending/${id}.json`;
  entries.set(pending, JSON.stringify({ id, project, name: 'Test', displayName: 'Test', text: 'Only simulated data', createdAt: '2026-10-29T12:00:00.000Z' }));
  const message = family === 'plugin' ? `plugin-comment|${project}|${id}|approve|${exp}` : `review|${id}|approve|${exp}`;
  const url = new URL(family === 'plugin' ? '/api/plugin-comment-manage' : '/api/review-manage', host);
  url.search = new URLSearchParams({ ...(family === 'plugin' ? { project } : {}), id, action: 'approve', exp, sig: createHmac('sha256', secret).update(message).digest('base64url') }).toString();
  return { entries, pending, url: url.href, env: { SIGNING_SECRET: secret, ALLOWED_ORIGIN: 'https://andreagiaquinto.it', QUOTE_FILES: {
    get: async k => entries.has(k) ? { json: async () => JSON.parse(entries.get(k)) } : null,
    put: async (k, v) => entries.set(k, v), delete: async k => entries.delete(k),
    list: async ({ prefix }) => ({ objects: [...entries.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })), truncated: false })
  } } };
}
for (const family of ['plugin', 'review']) {
  test(`${family}: confirmation preserves browser Origin without exposing the signed URL in Referer`, async () => {
    const f = fixture(family), before = JSON.stringify([...f.entries]);
    const response = await worker.fetch(new Request(f.url), f.env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Referrer-Policy'), 'strict-origin');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.match(response.headers.get('Content-Security-Policy'), /form-action 'self'; frame-ancestors 'none'/);
    const html = await response.text();
    assert.match(html, /<form method="post"/);
    assert.doesNotMatch(html, /name="referrer" content="no-referrer"/);
    assert.equal(JSON.stringify([...f.entries]), before, 'GET must not publish');
    const approved = await worker.fetch(new Request(f.url, { method: 'POST', headers: { Origin: host } }), f.env);
    assert.equal(approved.status, 200);
    assert.ok(!f.entries.has(f.pending));
    const after = JSON.stringify([...f.entries]);
    assert.equal((await worker.fetch(new Request(f.url, { method: 'POST', headers: { Origin: host } }), f.env)).status, 200);
    assert.equal(JSON.stringify([...f.entries]), after, 'Repeated approval is harmless');
  });
  test(`${family}: foreign/null origins and altered or expired signatures cannot publish`, async () => {
    const f = fixture(family), before = JSON.stringify([...f.entries]);
    for (const Origin of ['null', 'https://other.invalid']) {
      const response = await worker.fetch(new Request(f.url, { method: 'POST', headers: { Origin } }), f.env);
      assert.equal(response.status, 403);
      assert.equal((await response.json()).error, 'Origine non autorizzata.');
    }
    for (const [key, value] of [['sig', 'invalid'], ['exp', '1000000000'], ['action', 'delete']]) {
      const url = new URL(f.url); url.searchParams.set(key, value);
      const response = await worker.fetch(new Request(url, { method: 'POST', headers: { Origin: host } }), f.env);
      assert.ok(response.status >= 400);
      assert.match(await response.text(), /Link non valido/);
    }
    assert.equal(JSON.stringify([...f.entries]), before);
  });
}
