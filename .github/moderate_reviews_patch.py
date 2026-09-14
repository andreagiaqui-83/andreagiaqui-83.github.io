from pathlib import Path
import re

# --- Cloudflare Worker: premoderazione recensioni ---
p = Path('cloudflare-worker/src/index.js')
s = p.read_text(encoding='utf-8')

start = s.find('async function submitReview(request, env, origin) {')
if start < 0:
    raise SystemExit('submitReview start not found')
# find next top-level function/export marker after submitReview
m = re.search(r'\n(?:async function |function |export default)', s[start+1:])
if not m:
    raise SystemExit('submitReview end not found')
end = start + 1 + m.start()

new_block = r'''async function reviewActionUrl(request, env, id, action, ttlSeconds = 60 * 60 * 24 * 30) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = await hmac(env.SIGNING_SECRET, `review|${id}|${action}|${exp}`);
  const u = new URL(request.url);
  u.pathname = '/api/review-manage';
  u.search = new URLSearchParams({ id, action, exp: String(exp), sig }).toString();
  return u.toString();
}

async function verifyReviewAction(env, id, action, exp, sig) {
  const n = Number(exp || 0);
  if (!id || !action || !Number.isFinite(n) || n < Math.floor(Date.now() / 1000)) return false;
  return sig === await hmac(env.SIGNING_SECRET, `review|${id}|${action}|${n}`);
}

async function findApprovedReviewById(env, id) {
  const listed = await env.QUOTE_FILES.list({ prefix: 'reviews/', limit: 100 });
  for (const item of listed.objects || []) {
    const obj = await env.QUOTE_FILES.get(item.key);
    if (!obj) continue;
    const review = await obj.json().catch(() => null);
    if (review?.id === id) return { key: item.key, review };
  }
  return null;
}

function moderationPage(title, message, ok = true) {
  return new Response(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;background:#f4f8fb;color:#17344e;margin:0;padding:40px 18px}.box{max-width:680px;margin:0 auto;background:#fff;border:1px solid #d7e2ec;border-radius:16px;padding:28px;box-shadow:0 10px 28px rgba(11,58,91,.08)}h1{font-size:26px;margin:0 0 14px;color:${ok ? '#0b4a6f' : '#9b2c2c'}}p{font-size:17px;line-height:1.55}</style></head><body><div class="box"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></div></body></html>`, { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function submitReview(request, env, origin) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ ok: false, error: 'Recensione non valida.' }, 400, origin, env);
  if (String(body.website || '').trim()) return json({ ok: true, pending: true }, 200, origin, env);

  const displayName = publicReviewName(body.name);
  const text = cleanReviewText(body.text, 600);
  const service = cleanReviewText(body.service, 80);
  if (!displayName) return json({ ok: false, error: 'Inserisci nome e cognome.' }, 400, origin, env);
  if (text.length < 8) return json({ ok: false, error: 'Scrivi una recensione un po’ più completa.' }, 400, origin, env);
  if (/https?:\/\//i.test(text)) return json({ ok: false, error: 'Non inserire link nella recensione.' }, 400, origin, env);
  if (await reviewRateLimited(request, env)) return json({ ok: false, error: 'Hai inviato troppe recensioni in poco tempo. Riprova più tardi.' }, 429, origin, env);

  const review = { id: crypto.randomUUID(), displayName, service, text, createdAt: new Date().toISOString(), status: 'pending' };
  await env.QUOTE_FILES.put(`reviews-pending/${review.id}.json`, JSON.stringify(review), { httpMetadata: { contentType: 'application/json' } });

  if (env.RESEND_API_KEY && env.EMAIL_TO) {
    try {
      const approveUrl = await reviewActionUrl(request, env, review.id, 'approve');
      const rejectUrl = await reviewActionUrl(request, env, review.id, 'reject');
      await sendEmail(env, {
        from: env.EMAIL_FROM || 'Preventivi CAD BIM <onboarding@resend.dev>',
        to: [env.EMAIL_TO],
        subject: `Recensione da approvare: ${displayName}`,
        html: `<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.5"><h2>Nuova recensione in attesa di approvazione</h2><p><strong>${escapeHtml(displayName)}</strong>${service ? ` · ${escapeHtml(service)}` : ''}</p><p style="padding:14px;background:#f6f8fa;border-radius:8px">${escapeHtml(text)}</p><p><a href="${escapeHtml(approveUrl)}" style="display:inline-block;background:#17653b;color:#fff;text-decoration:none;padding:10px 16px;border-radius:7px;font-weight:700;margin-right:10px">Approva e pubblica</a><a href="${escapeHtml(rejectUrl)}" style="display:inline-block;background:#9b2c2c;color:#fff;text-decoration:none;padding:10px 16px;border-radius:7px;font-weight:700">Rifiuta</a></p><p style="font-size:13px;color:#64748b">Il cliente non vede la recensione finché non la approvi.</p></div>`
      });
    } catch (_) {}
  }

  return json({ ok: true, pending: true, displayName }, 200, origin, env);
}

async function manageReview(request, env) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  const action = url.searchParams.get('action') || '';
  const exp = url.searchParams.get('exp') || '';
  const sig = url.searchParams.get('sig') || '';
  if (!(await verifyReviewAction(env, id, action, exp, sig))) return moderationPage('Link non valido', 'Il collegamento è scaduto o non è valido.', false);

  if (action === 'approve' || action === 'reject') {
    const pendingKey = `reviews-pending/${id}.json`;
    const obj = await env.QUOTE_FILES.get(pendingKey);
    if (!obj) return moderationPage('Recensione già gestita', 'Questa recensione è già stata approvata, rifiutata o non è più disponibile.');
    const review = await obj.json().catch(() => null);
    if (!review) return moderationPage('Errore', 'Non è stato possibile leggere la recensione.', false);

    if (action === 'reject') {
      await env.QUOTE_FILES.delete(pendingKey);
      return moderationPage('Recensione rifiutata', 'La recensione non è stata pubblicata ed è stata eliminata dalla coda di moderazione.');
    }

    const approved = { ...review, status: 'approved', approvedAt: new Date().toISOString() };
    const approvedKey = `reviews/${approved.createdAt.replace(/[:.]/g, '-')}-${approved.id}.json`;
    await env.QUOTE_FILES.put(approvedKey, JSON.stringify(approved), { httpMetadata: { contentType: 'application/json' } });
    await env.QUOTE_FILES.delete(pendingKey);

    if (env.RESEND_API_KEY && env.EMAIL_TO) {
      try {
        const deleteUrl = await reviewActionUrl(request, env, approved.id, 'delete', 60 * 60 * 24 * 365);
        await sendEmail(env, {
          from: env.EMAIL_FROM || 'Preventivi CAD BIM <onboarding@resend.dev>',
          to: [env.EMAIL_TO],
          subject: `Recensione pubblicata: ${approved.displayName}`,
          html: `<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.5"><h2>Recensione pubblicata</h2><p><strong>${escapeHtml(approved.displayName)}</strong></p><p>${escapeHtml(approved.text)}</p><p><a href="${escapeHtml(deleteUrl)}" style="display:inline-block;background:#9b2c2c;color:#fff;text-decoration:none;padding:10px 16px;border-radius:7px;font-weight:700">Elimina questa recensione</a></p><p style="font-size:13px;color:#64748b">Il link di eliminazione resta valido per 12 mesi.</p></div>`
        });
      } catch (_) {}
    }
    return moderationPage('Recensione approvata', 'La recensione è stata pubblicata. Riceverai anche un link email per eliminarla in seguito, se necessario.');
  }

  if (action === 'delete') {
    const found = await findApprovedReviewById(env, id);
    if (!found) return moderationPage('Recensione non trovata', 'La recensione risulta già eliminata o non è più disponibile.');
    await env.QUOTE_FILES.delete(found.key);
    return moderationPage('Recensione eliminata', 'La recensione è stata rimossa dal sito.');
  }

  return moderationPage('Azione non valida', 'L’azione richiesta non è supportata.', false);
}
'''
s = s[:start] + new_block + s[end:]

route = "    if (url.pathname === '/api/reviews' && request.method === 'POST') return submitReview(request, env, origin);"
if route not in s:
    raise SystemExit('review POST route not found')
s = s.replace(route, route + "\n    if (url.pathname === '/api/review-manage' && request.method === 'GET') return manageReview(request, env);")
p.write_text(s, encoding='utf-8')

# --- Frontend: messaggio corretto, nessuna pubblicazione immediata ---
p = Path('script.js')
s = p.read_text(encoding='utf-8')
# robustly replace the whole try body line used by the review form
old_re = re.compile(r"try \{ const r=await fetch\(`\$\{backendBase\}/api/reviews`,\{method:'POST',headers:\{'Content-Type':'application/json'\},body:JSON\.stringify\(payload\)\}\); const d=await r\.json\(\)\.catch\(\(\)=>\(\{\}\)\); if\(!r\.ok\|\|!d\.ok\) throw new Error\(d\.error\|\|'Invio non riuscito\.'\);.*?\} \n    catch\(error\)", re.S)
replacement = "try { const r=await fetch(`${backendBase}/api/reviews`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); const d=await r.json().catch(()=>({})); if(!r.ok||!d.ok) throw new Error(d.error||'Invio non riuscito.'); reviewForm.reset(); if(reviewStatus){reviewStatus.textContent=`Grazie ${d.displayName||''}! La recensione è stata inviata e sarà pubblicata dopo l’approvazione.`.replace(/\\s+/g,' ').trim();reviewStatus.className='review-status is-success';} }\n    catch(error)"
s2, n = old_re.subn(replacement, s, count=1)
if n != 1:
    raise SystemExit(f'review frontend submit block replacement count={n}')
s = s2
p.write_text(s, encoding='utf-8')

# Cache bust JS.
p = Path('index.html')
h = p.read_text(encoding='utf-8')
h = re.sub(r'script\.js(?:\?v=[^\"]*)?\" defer', 'script.js?v=20260914-moderation1\" defer', h)
p.write_text(h, encoding='utf-8')
