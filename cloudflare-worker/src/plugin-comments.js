const PROJECTS = {'yqarch':'YQArch Italiano','express-tools':'AG CAD Tools','blockhub-cad':'BlockHub CAD'};
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const clean = (v) => typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim() : '';
const read = async (env,key) => {const obj=await env.QUOTE_FILES.get(key);return obj ? obj.json() : null;};
const put = (env,key,value) => env.QUOTE_FILES.put(key,JSON.stringify(value),{httpMetadata:{contentType:'application/json'}});
const pendingKey = (p,id) => `plugin-comments-pending/${p}/${id}.json`;
const indexKey = (p,id) => `plugin-comments-index/${p}/${id}.json`;
const approvedKey = (r) => `plugin-comments/${r.project}/${r.createdAt}_${r.id}.json`;
function publicFields(r) {return {id:r.id,name:r.deleted?'Contributo rimosso':r.name,text:r.deleted?'Questo commento è stato rimosso.':r.text,createdAt:r.createdAt,kind:r.deleted?'':r.kind,environment:r.deleted?'':r.environment,deleted:!!r.deleted,parentId:r.parentId || null};}

async function boundedJson(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return null;
  const reader=request.body?.getReader();if(!reader)return null;
  let size=0;const chunks=[];
  for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>12000){await reader.cancel();return null;}chunks.push(r.value);}
  const all=new Uint8Array(size);let offset=0;for(const part of chunks){all.set(part,offset);offset+=part.length;}
  try{return JSON.parse(new TextDecoder().decode(all));}catch{return null;}
}

async function actionUrl(request,env,helpers,project,id,action) {
  const exp=String(Math.floor(Date.now()/1000)+365*86400);
  const sig=await helpers.hmac(env.SIGNING_SECRET,`plugin-comment|${project}|${id}|${action}|${exp}`);
  const u=new URL('/api/plugin-comment-manage',request.url);
  u.search=new URLSearchParams({project,id,action,exp,sig}).toString();return u.href;
}

async function list(request,env,origin,h,project) {
  const cursor=new URL(request.url).searchParams.get('cursor') || undefined;
  if(cursor && cursor.length>2000)return h.json({ok:false,error:'Pagina non valida.'},400,origin,env);
  const page=await env.QUOTE_FILES.list({prefix:`plugin-comments/${project}/`,limit:30,cursor});
  const comments=[];
  for(const entry of page.objects || []) {
    const r=await read(env,entry.key);if(!r)continue;
    const result=publicFields(r);
    if(r.parentId) {const parent=await read(env,indexKey(project,r.parentId));if(parent)result.replyTo={id:parent.id,name:parent.deleted?'Contributo rimosso':parent.name,text:parent.deleted?'Commento rimosso':parent.text.slice(0,160)};}
    comments.push(result);
  }
  comments.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
  return h.json({ok:true,comments,nextCursor:page.truncated?page.cursor:null},200,origin,env);
}

async function submit(request,env,origin,h,project) {
  const body=await boundedJson(request);
  if(!body || body.website || body.privacy!==true || !UUID.test(body.requestId || ''))return h.json({ok:false,error:'Controlla i campi e il consenso alla pubblicazione.'},400,origin,env);
  const name=clean(body.name),text=clean(body.text),kind=clean(body.kind),environment=clean(body.environment),parentId=body.parentId || null;
  if(name.length<2 || name.length>60 || text.length<10 || text.length>2000 || environment.length>120 || !['Domanda','Bug','Suggerimento','Esperienza','Risposta'].includes(kind) || (parentId && !UUID.test(parentId)))return h.json({ok:false,error:'Inserisci un nome da 2 a 60 caratteri e un messaggio da 10 a 2.000 caratteri.'},400,origin,env);
  if(/https?:\/\/|www\./i.test(text))return h.json({ok:false,error:'Nel commento non inserire link. Per allegati o log usa l’email indicata nella pagina.'},400,origin,env);
  if(parentId) {const parent=await read(env,indexKey(project,parentId));if(!parent || parent.deleted)return h.json({ok:false,error:'Il commento a cui rispondere non è più disponibile.'},400,origin,env);}
  const id=body.requestId.toLowerCase(),key=pendingKey(project,id);
  const fingerprint=await h.hmac(env.SIGNING_SECRET,JSON.stringify({name,text,kind,environment,parentId}));
  const receiptKey=`plugin-comment-requests/${project}/${id}.json`;
  const receipt=await read(env,receiptKey);
  if(receipt && receipt.fingerprint!==fingerprint)return h.json({ok:false,error:'Questo invio è già stato usato. Aggiorna la pagina per scrivere un nuovo commento.'},409,origin,env);
  if(receipt?.notified)return h.json({ok:true,pending:true},200,origin,env);
  let record=await read(env,key);
  if(!record) {
    const ip=request.headers.get('CF-Connecting-IP') || 'unknown';
    const hash=await h.hmac(env.SIGNING_SECRET,`plugin-comment-rate|${ip}`);
    const prefix=`plugin-comment-rate/${hash}/${new Date().toISOString().slice(0,13)}/`;
    const recent=await env.QUOTE_FILES.list({prefix,limit:5});
    if((recent.objects || []).length>=5)return h.json({ok:false,error:'Hai inviato diversi commenti in poco tempo. Riprova tra un’ora.'},429,origin,env);
    await env.QUOTE_FILES.put(prefix+id,'1');
    record={id,project,name,text,kind,environment,parentId,createdAt:new Date().toISOString(),publicationConsent:true};
    await put(env,key,record);await put(env,receiptKey,{fingerprint,notified:false});
  }
  // A delivery error remains retryable with the same ID; never report success without notification.
  if(!env.RESEND_API_KEY || !env.EMAIL_TO)throw new Error('Moderation mail unavailable');
  const esc=h.escapeHtml,links={};for(const a of ['approve','reject','delete'])links[a]=await actionUrl(request,env,h,project,id,a);
  await h.sendEmail(env,{from:env.EMAIL_FROM,to:[env.EMAIL_TO],subject:`${PROJECTS[project]} — ${parentId?'risposta':'commento'} da approvare`,html:`<h2>${esc(PROJECTS[project])}: ${esc(kind)}</h2><p><b>${esc(name)}</b> · ${esc(environment)}</p><p style="white-space:pre-wrap">${esc(text)}</p><p>${parentId?'È una risposta a un commento pubblicato.':''}</p><p><a href="${esc(links.approve)}">Approva e pubblica</a> · <a href="${esc(links.reject)}">Rifiuta</a></p><p><a href="${esc(links.delete)}">Rimuovi dopo la pubblicazione</a> (valido 12 mesi)</p><p>Ogni azione richiede conferma nella pagina. I nomi dei visitatori non sono verificati.</p>`},`plugin-comment/${project}/${id}`);
  await put(env,receiptKey,{fingerprint,notified:true});
  return h.json({ok:true,pending:true},200,origin,env);
}

async function manage(request,env,h) {
  const u=new URL(request.url),p=u.searchParams,project=p.get('project'),id=p.get('id'),action=p.get('action'),exp=p.get('exp'),sig=p.get('sig');
  const esc=h.escapeHtml;
  const page=(title,content,status=200)=>new Response(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title><style>body{font:18px/1.6 system-ui;max-width:680px;margin:40px auto;padding:20px;color:#102b3a}button{font:inherit;padding:14px 24px}blockquote{margin:20px 0;padding:16px;background:#f0f5f4;white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><h1>${esc(title)}</h1>${content}</body></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'"}});
  if(!Object.hasOwn(PROJECTS,project) || !UUID.test(id || '') || !['approve','reject','delete'].includes(action) || !/^\d{10}$/.test(exp || '') || Number(exp)<Date.now()/1000 || sig!==await h.hmac(env.SIGNING_SECRET,`plugin-comment|${project}|${id}|${action}|${exp}`))return page('Link non valido','<p>Il collegamento è scaduto o non è valido.</p>',403);
  const record=await read(env,action==='delete'?indexKey(project,id):pendingKey(project,id));
  if(!record || record.deleted)return page('Commento già gestito','<p>Nessuna modifica necessaria.</p>');
  if(request.method==='GET')return page('Conferma la tua scelta',`<p>${esc(PROJECTS[project])} · ${esc(record.name)}</p><blockquote>${esc(record.text)}</blockquote><form method="post" action="${esc(u.href)}"><button>${{approve:'Approva e pubblica',reject:'Rifiuta commento',delete:'Rimuovi commento'}[action]}</button></form>`);
  if(action==='reject'){await env.QUOTE_FILES.delete(pendingKey(project,id));return page('Commento rifiutato','<p>Il contributo è stato eliminato dalla coda.</p>');}
  if(action==='approve') {
    const approved={...record,approvedAt:new Date().toISOString()};
    await put(env,indexKey(project,id),approved);await put(env,approvedKey(approved),approved);await env.QUOTE_FILES.delete(pendingKey(project,id));
    return page('Commento pubblicato','<p>Il contributo è ora visibile sulla pagina del progetto. Conserva l’email per poterlo rimuovere.</p>');
  }
  const removed={id:record.id,project:record.project,createdAt:record.createdAt,parentId:record.parentId,deleted:true};
  await put(env,indexKey(project,id),removed);await put(env,approvedKey(record),removed);
  return page('Commento rimosso','<p>Nome, messaggio e ambiente sono stati rimossi. Resta un segnaposto per rendere comprensibili le risposte.</p>');
}

export async function pluginComments(request,env,origin,h) {
  const u=new URL(request.url);
  try {
    if(u.pathname==='/api/plugin-comment-manage')return await manage(request,env,h);
    const project=u.searchParams.get('project');
    if(!Object.hasOwn(PROJECTS,project))return h.json({ok:false,error:'Progetto non valido.'},400,origin,env);
    return await (request.method==='GET'?list:submit)(request,env,origin,h,project);
  } catch {return h.json({ok:false,error:'Invio o caricamento non confermato. Riprova tra poco; il testo resta nel modulo.'},503,origin,env);}
}
