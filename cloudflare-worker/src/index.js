const MAX_FILE_BYTES = 90 * 1024 * 1024;
const MAX_TOTAL_BYTES = 500 * 1024 * 1024;
const SESSION_TTL_SECONDS = 60 * 60 * 6;
const DOWNLOAD_TTL_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function corsHeaders(origin, env) {
  const allowed = env.ALLOWED_ORIGIN || 'https://andreagiaqui-83.github.io';
  return {
    'Access-Control-Allow-Origin': origin === allowed ? allowed : allowed,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token, X-File-Name, X-Field-Name, X-File-Size',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data, status, origin, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin, env),
    },
  });
}

function sanitizeFileName(name = 'file') {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 140) || 'file';
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function base64Url(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message))));
}

async function makeToken(env, subject, exp) {
  const sig = await hmac(env.SIGNING_SECRET, `${subject}|${exp}`);
  return `${exp}.${sig}`;
}

async function verifyToken(env, subject, token) {
  if (!token || !token.includes('.')) return false;
  const [expRaw, sig] = token.split('.', 2);
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmac(env.SIGNING_SECRET, `${subject}|${exp}`);
  return sig === expected;
}

async function createSession(request, env, origin) {
  const sessionId = crypto.randomUUID();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = await makeToken(env, sessionId, exp);
  const meta = {
    sessionId,
    createdAt: new Date().toISOString(),
    totalBytes: 0,
    files: [],
  };
  await env.QUOTE_FILES.put(`sessions/${sessionId}.json`, JSON.stringify(meta), {
    httpMetadata: { contentType: 'application/json' },
  });
  return json({ ok: true, sessionId, token, maxFileBytes: MAX_FILE_BYTES, maxTotalBytes: MAX_TOTAL_BYTES }, 200, origin, env);
}

async function readSession(env, sessionId) {
  const obj = await env.QUOTE_FILES.get(`sessions/${sessionId}.json`);
  if (!obj) return null;
  return await obj.json();
}

async function writeSession(env, session) {
  await env.QUOTE_FILES.put(`sessions/${session.sessionId}.json`, JSON.stringify(session), {
    httpMetadata: { contentType: 'application/json' },
  });
}

async function uploadFile(request, env, origin, sessionId) {
  const token = request.headers.get('X-Session-Token') || '';
  if (!(await verifyToken(env, sessionId, token))) return json({ ok: false, error: 'Sessione non valida o scaduta.' }, 401, origin, env);

  const rawName = decodeURIComponent(request.headers.get('X-File-Name') || 'file');
  const fieldName = request.headers.get('X-Field-Name') || 'Allegato';
  const declaredSize = Number(request.headers.get('X-File-Size') || request.headers.get('Content-Length') || 0);
  if (!declaredSize || declaredSize < 0) return json({ ok: false, error: 'Dimensione file non valida.' }, 400, origin, env);
  if (declaredSize > MAX_FILE_BYTES) {
    return json({ ok: false, error: 'Il singolo file supera 90 MB. Usa un link cloud per questo file.' }, 413, origin, env);
  }

  const session = await readSession(env, sessionId);
  if (!session) return json({ ok: false, error: 'Sessione non trovata.' }, 404, origin, env);
  if ((session.totalBytes || 0) + declaredSize > MAX_TOTAL_BYTES) {
    return json({ ok: false, error: 'Gli allegati complessivi superano 500 MB. Usa un link cloud per il materiale eccedente.' }, 413, origin, env);
  }

  const safeName = sanitizeFileName(rawName);
  const fileId = crypto.randomUUID();
  const key = `quotes/${sessionId}/files/${fileId}-${safeName}`;
  await env.QUOTE_FILES.put(key, request.body, {
    httpMetadata: {
      contentType: request.headers.get('Content-Type') || 'application/octet-stream',
      contentDisposition: `attachment; filename="${safeName}"`,
    },
    customMetadata: {
      originalName: rawName.slice(0, 300),
      fieldName: fieldName.slice(0, 120),
      sessionId,
    },
  });

  const entry = { key, name: rawName, fieldName, size: declaredSize, uploadedAt: new Date().toISOString() };
  session.files = Array.isArray(session.files) ? session.files : [];
  session.files.push(entry);
  session.totalBytes = (session.totalBytes || 0) + declaredSize;
  await writeSession(env, session);

  return json({ ok: true, file: entry, totalBytes: session.totalBytes }, 200, origin, env);
}

async function deleteUploadedFile(request, env, origin, sessionId) {
  const token = request.headers.get('X-Session-Token') || '';
  if (!(await verifyToken(env, sessionId, token))) return json({ ok: false, error: 'Sessione non valida o scaduta.' }, 401, origin, env);
  const body = await request.json().catch(() => ({}));
  const key = String(body.key || '');
  if (!key.startsWith(`quotes/${sessionId}/files/`)) return json({ ok: false, error: 'File non valido.' }, 400, origin, env);
  const session = await readSession(env, sessionId);
  if (!session) return json({ ok: false, error: 'Sessione non trovata.' }, 404, origin, env);
  const found = (session.files || []).find(f => f.key === key);
  await env.QUOTE_FILES.delete(key);
  session.files = (session.files || []).filter(f => f.key !== key);
  if (found) session.totalBytes = Math.max(0, (session.totalBytes || 0) - Number(found.size || 0));
  await writeSession(env, session);
  return json({ ok: true, totalBytes: session.totalBytes }, 200, origin, env);
}

async function makeDownloadUrl(request, env, key) {
  const exp = Math.floor(Date.now() / 1000) + DOWNLOAD_TTL_SECONDS;
  const sig = await hmac(env.SIGNING_SECRET, `${key}|${exp}`);
  const base = new URL(request.url);
  base.pathname = '/api/download';
  base.search = new URLSearchParams({ key, exp: String(exp), sig }).toString();
  return base.toString();
}

async function downloadFile(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  const exp = Number(url.searchParams.get('exp') || 0);
  const sig = url.searchParams.get('sig') || '';
  if (!key.startsWith('quotes/') || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return new Response('Link non valido o scaduto.', { status: 403 });
  const expected = await hmac(env.SIGNING_SECRET, `${key}|${exp}`);
  if (sig !== expected) return new Response('Link non valido.', { status: 403 });
  const obj = await env.QUOTE_FILES.get(key);
  if (!obj) return new Response('File non trovato.', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'private, no-store');
  if (!headers.get('Content-Disposition')) {
    const fallback = sanitizeFileName(obj.customMetadata?.originalName || key.split('/').pop());
    headers.set('Content-Disposition', `attachment; filename="${fallback}"`);
  }
  return new Response(obj.body, { headers });
}

function rowsFromFields(fields) {
  return Object.entries(fields || {})
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, value]) => `<tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>${escapeHtml(key)}</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(Array.isArray(value) ? value.join(', ') : value ?? '')}</td></tr>`)
    .join('');
}

async function sendEmail(env, payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `Resend ${response.status}`);
  return result;
}

async function submitQuote(request, env, origin) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ ok: false, error: 'Richiesta non valida.' }, 400, origin, env);
  const sessionId = String(body.sessionId || '');
  const token = String(body.token || '');
  if (!(await verifyToken(env, sessionId, token))) return json({ ok: false, error: 'Sessione non valida o scaduta.' }, 401, origin, env);

  const session = await readSession(env, sessionId);
  if (!session) return json({ ok: false, error: 'Sessione non trovata.' }, 404, origin, env);
  const fields = body.fields || {};
  const uploads = [];
  for (const file of session.files || []) {
    uploads.push({ ...file, downloadUrl: await makeDownloadUrl(request, env, file.key) });
  }

  const cloudLink = String(fields.Link_cloud_materiale_completo || '').trim();
  const fileRows = uploads.length
    ? uploads.map(f => `<li><a href="${escapeHtml(f.downloadUrl)}">${escapeHtml(f.name)}</a> — ${Math.round(f.size / 1024)} KB (${escapeHtml(f.fieldName)})</li>`).join('')
    : '<li>Nessun allegato caricato direttamente.</li>';

  const ownerHtml = `
    <h2>Nuova richiesta preventivo AutoCAD / Revit</h2>
    <table style="border-collapse:collapse;width:100%;max-width:900px">${rowsFromFields(fields)}</table>
    <h3>Allegati</h3><ul>${fileRows}</ul>
    ${cloudLink ? `<p><strong>Link cloud:</strong> <a href="${escapeHtml(cloudLink)}">${escapeHtml(cloudLink)}</a></p>` : ''}
    <p>I link agli allegati scadono dopo 30 giorni.</p>`;

  await sendEmail(env, {
    from: env.EMAIL_FROM,
    to: [env.EMAIL_TO],
    reply_to: fields.Email || undefined,
    subject: 'Nuova richiesta preventivo AutoCAD / Revit dal sito',
    html: ownerHtml,
  });

  const customerEmail = String(fields.Email || '').trim();
  if (customerEmail && env.SEND_CUSTOMER_COPY === 'true') {
    const customerHtml = `
      <h2>Richiesta di preventivo ricevuta</h2>
      <p>Grazie. La richiesta è stata ricevuta correttamente e verrà valutata personalmente.</p>
      <p>Se servono informazioni aggiuntive verrai ricontattato senza dover compilare nuovamente il modulo.</p>
      <h3>Riepilogo</h3>
      <table style="border-collapse:collapse;width:100%;max-width:900px">${rowsFromFields(fields)}</table>
      <p>Andrea Giaquinto · CAD | BIM | CONSULENZA<br>+39 333 724 0544 · WhatsApp / Telegram<br>andrea.giaqui@gmail.com</p>`;
    try {
      await sendEmail(env, {
        from: env.EMAIL_FROM,
        to: [customerEmail],
        subject: 'Copia della richiesta di preventivo CAD / BIM',
        html: customerHtml,
      });
    } catch (error) {
      console.error('Customer confirmation email failed', error);
    }
  }

  await env.QUOTE_FILES.put(`quotes/${sessionId}/request.json`, JSON.stringify({
    sessionId,
    submittedAt: new Date().toISOString(),
    fields,
    files: session.files || [],
    cloudLink,
  }), { httpMetadata: { contentType: 'application/json' } });

  return json({ ok: true }, 200, origin, env);
}

async function cleanup(env) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let cursor;
  do {
    const listed = await env.QUOTE_FILES.list({ prefix: 'quotes/', limit: 1000, cursor });
    const oldKeys = listed.objects.filter(obj => obj.uploaded && new Date(obj.uploaded).getTime() < cutoff).map(obj => obj.key);
    if (oldKeys.length) await env.QUOTE_FILES.delete(oldKeys);
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  let sessionCursor;
  do {
    const listed = await env.QUOTE_FILES.list({ prefix: 'sessions/', limit: 1000, cursor: sessionCursor });
    const oldKeys = listed.objects.filter(obj => obj.uploaded && new Date(obj.uploaded).getTime() < cutoff).map(obj => obj.key);
    if (oldKeys.length) await env.QUOTE_FILES.delete(oldKeys);
    sessionCursor = listed.truncated ? listed.cursor : undefined;
  } while (sessionCursor);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || 'https://andreagiaqui-83.github.io';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    if (origin && origin !== allowed) return json({ ok: false, error: 'Origine non autorizzata.' }, 403, origin, env);

    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true, service: 'cad-bim-quote-backend' }, 200, origin, env);
    if (url.pathname === '/api/session' && request.method === 'POST') return createSession(request, env, origin);
    if (url.pathname.startsWith('/api/upload/') && request.method === 'PUT') return uploadFile(request, env, origin, url.pathname.split('/').pop());
    if (url.pathname.startsWith('/api/upload/') && request.method === 'DELETE') return deleteUploadedFile(request, env, origin, url.pathname.split('/').pop());
    if (url.pathname === '/api/submit' && request.method === 'POST') return submitQuote(request, env, origin);
    if (url.pathname === '/api/download' && request.method === 'GET') return downloadFile(request, env);
    return json({ ok: false, error: 'Endpoint non trovato.' }, 404, origin, env);
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(cleanup(env));
  },
};
