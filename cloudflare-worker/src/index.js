const MAX_FILE_BYTES = 90 * 1024 * 1024;
const MAX_TOTAL_BYTES = 500 * 1024 * 1024;
const SESSION_TTL_SECONDS = 60 * 60 * 6;
const DOWNLOAD_TTL_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

const FIELD_LABELS = {
  Nuvola_di_punti_link_cloud: 'Nuvola di punti (link cloud)',
  Google_Maps_Earth: 'Google Maps / Earth',
  Indirizzo_fabbricato: 'Indirizzo del fabbricato',
  Coordinate_geografiche: 'Coordinate geografiche',
  Indicazioni_lavoro: 'Indicazioni sul lavoro',
  'Output[]': 'Output richiesti',
  Output: 'Output richiesti',
  Indicazioni_output: 'Indicazioni sull’output',
  Data_indicativa_consegna: 'Data indicativa di consegna',
  Professione: 'Professione',
  Note_conclusive: 'Note conclusive',
  Nome_cognome: 'Nome e cognome',
  Nome: 'Nome e cognome',
  Studio_societa: 'Studio / società',
  email: 'Email',
  Email: 'Email',
  Telefono_WhatsApp: 'Telefono / WhatsApp',
  Contatto_preferito: 'Contatto preferito',
  Consenso_privacy: 'Consenso privacy',
  Link_cloud_materiale_completo: 'Link cloud al materiale completo',
  Template_AutoCAD: 'Template AutoCAD',
  Template_Revit: 'Template Revit',
};

function corsHeaders(origin, env) {
  const allowed = env.ALLOWED_ORIGIN || 'https://andreagiaqui-83.github.io';
  return {
    'Access-Control-Allow-Origin': origin === allowed ? allowed : allowed,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token, X-File-Name, X-Field-Name, X-File-Size',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, status, origin, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin, env) },
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sanitizeFileName(name = 'file') {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 140) || 'file';
}

function base64Url(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message))));
}

async function makeToken(env, subject, exp) {
  return `${exp}.${await hmac(env.SIGNING_SECRET, `${subject}|${exp}`)}`;
}

async function verifyToken(env, subject, token) {
  if (!token || !token.includes('.')) return false;
  const [expRaw, sig] = token.split('.', 2);
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  return sig === await hmac(env.SIGNING_SECRET, `${subject}|${exp}`);
}

async function readSession(env, sessionId) {
  const obj = await env.QUOTE_FILES.get(`sessions/${sessionId}.json`);
  return obj ? await obj.json() : null;
}

async function writeSession(env, session) {
  await env.QUOTE_FILES.put(`sessions/${session.sessionId}.json`, JSON.stringify(session), {
    httpMetadata: { contentType: 'application/json' },
  });
}

async function createSession(_request, env, origin) {
  const sessionId = crypto.randomUUID();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = await makeToken(env, sessionId, exp);
  const meta = { sessionId, createdAt: new Date().toISOString(), totalBytes: 0, files: [] };
  await writeSession(env, meta);
  return json({ ok: true, sessionId, token, maxFileBytes: MAX_FILE_BYTES, maxTotalBytes: MAX_TOTAL_BYTES }, 200, origin, env);
}

async function uploadFile(request, env, origin, sessionId) {
  const token = request.headers.get('X-Session-Token') || '';
  if (!(await verifyToken(env, sessionId, token))) {
    return json({ ok: false, error: 'Sessione non valida o scaduta.' }, 401, origin, env);
  }

  const rawName = decodeURIComponent(request.headers.get('X-File-Name') || 'file');
  const fieldName = request.headers.get('X-Field-Name') || 'Allegato';
  const declaredSize = Number(request.headers.get('X-File-Size') || request.headers.get('Content-Length') || 0);
  if (!declaredSize || declaredSize < 0) return json({ ok: false, error: 'Dimensione file non valida.' }, 400, origin, env);
  if (declaredSize > MAX_FILE_BYTES) return json({ ok: false, error: 'Il singolo file supera 90 MB. Usa un link cloud per questo file.' }, 413, origin, env);

  const session = await readSession(env, sessionId);
  if (!session) return json({ ok: false, error: 'Sessione non trovata.' }, 404, origin, env);
  if ((session.totalBytes || 0) + declaredSize > MAX_TOTAL_BYTES) {
    return json({ ok: false, error: 'Gli allegati complessivi superano 500 MB. Usa un link cloud per il materiale eccedente.' }, 413, origin, env);
  }

  const safeName = sanitizeFileName(rawName);
  const key = `quotes/${sessionId}/files/${crypto.randomUUID()}-${safeName}`;
  await env.QUOTE_FILES.put(key, request.body, {
    httpMetadata: {
      contentType: request.headers.get('Content-Type') || 'application/octet-stream',
      contentDisposition: `attachment; filename="${safeName}"`,
    },
    customMetadata: { originalName: rawName.slice(0, 300), fieldName: fieldName.slice(0, 120), sessionId },
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
  if (sig !== await hmac(env.SIGNING_SECRET, `${key}|${exp}`)) return new Response('Link non valido.', { status: 403 });
  const obj = await env.QUOTE_FILES.get(key);
  if (!obj) return new Response('File non trovato.', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'private, no-store');
  if (!headers.get('Content-Disposition')) {
    headers.set('Content-Disposition', `attachment; filename="${sanitizeFileName(obj.customMetadata?.originalName || key.split('/').pop())}"`);
  }
  return new Response(obj.body, { headers });
}

function normalizeFieldValue(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean).join(', ');
  return String(value ?? '').trim();
}

function prettifyFieldName(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key.replace(/\[\]$/, '').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function rowsFromFields(fields, { includePrivacy = true } = {}) {
  return Object.entries(fields || {})
    .filter(([key, value]) => {
      if (key.startsWith('_')) return false;
      if (!includePrivacy && key === 'Consenso_privacy') return false;
      return normalizeFieldValue(value) !== '';
    })
    .map(([key, value]) => {
      const label = prettifyFieldName(key);
      const text = normalizeFieldValue(value);
      const isEmail = label === 'Email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
      const isPhone = label === 'Telefono / WhatsApp' && /^[+\d][\d\s().-]{5,}$/.test(text);
      const isUrl = /^https?:\/\//i.test(text);
      let rendered = escapeHtml(text);
      if (isEmail) rendered = `<a href="mailto:${escapeHtml(text)}">${escapeHtml(text)}</a>`;
      else if (isPhone) rendered = `<a href="tel:${escapeHtml(text.replace(/[^+\d]/g, ''))}">${escapeHtml(text)}</a>`;
      else if (isUrl) rendered = `<a href="${escapeHtml(text)}">${escapeHtml(text)}</a>`;
      return `<tr><td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;width:34%;vertical-align:top"><strong>${escapeHtml(label)}</strong></td><td style="padding:9px 12px;border-bottom:1px solid #e2e8f0">${rendered}</td></tr>`;
    })
    .join('');
}

function formatFileSize(bytes) {
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

function attachmentList(uploads) {
  if (!uploads.length) return '<p style="margin:6px 0 0;color:#64748b">Nessun allegato caricato direttamente.</p>';
  return `<table style="border-collapse:collapse;width:100%;max-width:900px">${uploads.map(f => `
    <tr>
      <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0"><strong>${escapeHtml(f.name)}</strong><br><span style="color:#64748b;font-size:13px">${escapeHtml(formatFileSize(f.size))}</span></td>
      <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right"><a href="${escapeHtml(f.downloadUrl)}" style="display:inline-block;padding:8px 13px;border-radius:6px;background:#0b4a6f;color:#fff;text-decoration:none;font-weight:700">Scarica</a></td>
    </tr>`).join('')}</table>`;
}

function getCustomerEmail(fields) {
  return String(fields?.email || fields?.Email || '').trim();
}

async function sendEmail(env, payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
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
  for (const file of session.files || []) uploads.push({ ...file, downloadUrl: await makeDownloadUrl(request, env, file.key) });

  const cloudLink = String(fields.Link_cloud_materiale_completo || '').trim();
  const ownerHtml = `
    <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.5">
      <h2 style="margin:0 0 18px">Nuova richiesta preventivo AutoCAD / Revit</h2>
      <table style="border-collapse:collapse;width:100%;max-width:900px">${rowsFromFields(fields)}</table>
      <h3 style="margin:24px 0 8px">Allegati</h3>
      ${attachmentList(uploads)}
      ${cloudLink ? `<p style="margin-top:16px"><strong>Link cloud al materiale completo:</strong><br><a href="${escapeHtml(cloudLink)}">${escapeHtml(cloudLink)}</a></p>` : ''}
      ${uploads.length ? '<p style="color:#64748b;font-size:13px">I link agli allegati scadono dopo 30 giorni.</p>' : ''}
    </div>`;

  const customerEmail = getCustomerEmail(fields);
  await sendEmail(env, {
    from: env.EMAIL_FROM,
    to: [env.EMAIL_TO],
    reply_to: customerEmail || undefined,
    subject: 'Nuova richiesta preventivo AutoCAD / Revit dal sito',
    html: ownerHtml,
  });

  let customerCopySent = false;
  if (customerEmail && env.SEND_CUSTOMER_COPY === 'true') {
    const customerHtml = `
      <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.5">
        <h2 style="margin:0 0 14px">Richiesta di preventivo ricevuta</h2>
        <p>Grazie. La tua richiesta è stata ricevuta correttamente.</p>
        <p>Esaminerò personalmente il materiale e ti ricontatterò appena possibile. Non è necessario compilare nuovamente il modulo.</p>
        <h3 style="margin:24px 0 8px">Riepilogo della richiesta</h3>
        <table style="border-collapse:collapse;width:100%;max-width:900px">${rowsFromFields(fields, { includePrivacy: false })}</table>
        <h3 style="margin:24px 0 8px">Materiale inviato</h3>
        <p>${uploads.length ? `${uploads.length} file caricati correttamente (${escapeHtml(formatFileSize(uploads.reduce((s, f) => s + Number(f.size || 0), 0)))} complessivi).` : 'Nessun file caricato direttamente dal modulo.'}</p>
        ${cloudLink ? `<p><strong>Link cloud indicato:</strong><br><a href="${escapeHtml(cloudLink)}">${escapeHtml(cloudLink)}</a></p>` : ''}
        <p style="margin-top:26px"><strong>Andrea Giaquinto</strong><br>Disegnatore AutoCAD e Revit · CAD | BIM | CONSULENZA<br><a href="mailto:andrea.giaqui@gmail.com">andrea.giaqui@gmail.com</a><br><a href="tel:+393337240544">+39 333 724 0544</a> · WhatsApp / Telegram</p>
      </div>`;
    try {
      await sendEmail(env, {
        from: env.EMAIL_FROM,
        to: [customerEmail],
        reply_to: env.EMAIL_TO,
        subject: 'Conferma richiesta di preventivo AutoCAD / Revit',
        html: customerHtml,
      });
      customerCopySent = true;
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
    customerCopySent,
  }), { httpMetadata: { contentType: 'application/json' } });

  return json({ ok: true, customerCopySent }, 200, origin, env);
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



function publicReviewName(fullName = '') {
  const parts = String(fullName).trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (parts.length < 2) return '';
  const first = parts[0].slice(0, 40);
  const initial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${initial}.`;
}
function cleanReviewText(value = '', max = 600) { return String(value).replace(/\s+/g, ' ').trim().slice(0, max); }
async function reviewRateLimited(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'; const hour = new Date().toISOString().slice(0, 13); const hash = await hmac(env.SIGNING_SECRET, `review-rate|${ip}`); const prefix = `review-rate/${hash}/${hour}/`; const list = await env.QUOTE_FILES.list({prefix,limit:4});
  if ((list.objects || []).length >= 3) return true; await env.QUOTE_FILES.put(`${prefix}${crypto.randomUUID()}`, '1'); return false;
}
async function listReviews(_request, env, origin) {
  const listed = await env.QUOTE_FILES.list({prefix:'reviews/',limit:100}); const keys=(listed.objects||[]).map(o=>o.key).sort().slice(-50); const reviews=[];
  for(const key of keys){const obj=await env.QUOTE_FILES.get(key);if(!obj)continue;const review=await obj.json().catch(()=>null);if(review?.displayName&&review?.text)reviews.push(review);}
  reviews.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))); return json({ok:true,reviews},200,origin,env);
}
async function submitReview(request, env, origin) {
  const body=await request.json().catch(()=>null); if(!body)return json({ok:false,error:'Recensione non valida.'},400,origin,env); if(String(body.website||'').trim())return json({ok:true,review:null},200,origin,env);
  const displayName=publicReviewName(body.name); const text=cleanReviewText(body.text,600); const service=cleanReviewText(body.service,80);
  if(!displayName)return json({ok:false,error:'Inserisci nome e cognome.'},400,origin,env); if(text.length<8)return json({ok:false,error:'Scrivi una recensione un po’ più completa.'},400,origin,env); if(/https?:\/\//i.test(text))return json({ok:false,error:'Non inserire link nella recensione.'},400,origin,env); if(await reviewRateLimited(request,env))return json({ok:false,error:'Hai inviato troppe recensioni in poco tempo. Riprova più tardi.'},429,origin,env);
  const review={id:crypto.randomUUID(),displayName,service,text,createdAt:new Date().toISOString()}; const key=`reviews/${review.createdAt.replace(/[:.]/g,'-')}-${review.id}.json`; await env.QUOTE_FILES.put(key,JSON.stringify(review),{httpMetadata:{contentType:'application/json'}});
  if(env.RESEND_API_KEY&&env.EMAIL_TO){try{await sendEmail(env,{from:env.EMAIL_FROM||'Preventivi CAD BIM <onboarding@resend.dev>',to:[env.EMAIL_TO],subject:`Nuova recensione da ${displayName}`,html:`<div style="font-family:Arial,sans-serif"><h2>Nuova recensione pubblicata</h2><p><strong>${escapeHtml(displayName)}</strong>${service?` · ${escapeHtml(service)}`:''}</p><p>${escapeHtml(text)}</p></div>`});}catch(_){}}
  return json({ok:true,review},200,origin,env);
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
    if (url.pathname === '/api/reviews' && request.method === 'GET') return listReviews(request, env, origin);
    if (url.pathname === '/api/reviews' && request.method === 'POST') return submitReview(request, env, origin);
    if (url.pathname === '/api/download' && request.method === 'GET') return downloadFile(request, env);
    return json({ ok: false, error: 'Endpoint non trovato.' }, 404, origin, env);
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(cleanup(env));
  },
};