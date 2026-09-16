// Independent endpoint for the AutoCAD training landing. Existing CAD/BIM upload flow is untouched.
export async function submitLesson(request, env, origin, {json, sendEmail, hmac, escapeHtml}) {
  if (Number(request.headers.get('Content-Length') || 0)>12000) return json({ok:false,error:'Richiesta troppo grande.'},413,origin,env);
  const raw=await request.text();
  if(raw.length>12000)return json({ok:false,error:'Richiesta troppo grande.'},413,origin,env);
  let body;try{body=JSON.parse(raw);}catch(_){return json({ok:false,error:'Richiesta non valida.'},400,origin,env);}
  const name=String(body?.name||'').trim(),email=String(body?.email||'').trim(),message=String(body?.message||'').trim();
  const id=String(body?.requestId||'');
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)||name.length<2||name.length>100||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||/[\r\n]/.test(email)||message.length>2000||body.privacy!==true||String(body.website||'').trim()||body.source!=='autocad-lessons')return json({ok:false,error:'Controlla i campi richiesti.'},400,origin,env);
  const payload={name,email,message,privacy:true,source:'autocad-lessons'};
  const fingerprint=await hmac(env.SIGNING_SECRET,JSON.stringify(payload));
  const recordKey=`lessons/${id}.json`;
  const stored=await env.QUOTE_FILES.get(recordKey);
  const existing=stored?await stored.json():null;
  if(existing){
    if(existing.fingerprint!==fingerprint)return json({ok:false,error:'Richiesta già utilizzata. Inizia una nuova richiesta.'},409,origin,env);
    if(existing.status==='sent')return json({ok:true,requestId:id},200,origin,env);
    if(Date.now()-new Date(existing.createdAt).getTime()>23*3600000)return json({ok:false,error:'Richiesta da verificare: contatta Andrea via email.'},409,origin,env);
  }
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const rateKey=await hmac(env.SIGNING_SECRET,`lesson-rate|${ip}`),hour=new Date().toISOString().slice(0,13);
  const prefix=`lesson-rate/${rateKey}/${hour}/`;
  const count=await env.QUOTE_FILES.list({prefix,limit:6});
  if((count.objects||[]).length>=5)return json({ok:false,error:'Attendi prima di riprovare.'},429,origin,env);
  await env.QUOTE_FILES.put(prefix+crypto.randomUUID(),'1');
  // Store before delivery; retries reuse Resend's idempotency key and the same request ID.
  if(!existing)await env.QUOTE_FILES.put(recordKey,JSON.stringify({id,fingerprint,status:'pending',createdAt:new Date().toISOString(),...payload}),{httpMetadata:{contentType:'application/json'}});
  try{
    await sendEmail(env,{from:env.EMAIL_FROM,to:[env.EMAIL_TO],reply_to:email,subject:'Lezioni AutoCAD — richiesta sessione gratuita',html:`<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Richiesta lezioni AutoCAD</h2><p><strong>Nome:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Obiettivo:</strong><br>${escapeHtml(message||'Non specificato').replace(/\n/g,'<br>')}</p><p>Prima sessione gratuita di 30 minuti; lezioni successive 15 €/ora.</p><p>Informativa privacy letta e contatto richiesto.</p><p>Riferimento: ${id}</p></div>`},'autocad-lesson/'+id);
    await env.QUOTE_FILES.put(recordKey,JSON.stringify({id,fingerprint,status:'sent',createdAt:existing?.createdAt||new Date().toISOString(),submittedAt:new Date().toISOString(),...payload}),{httpMetadata:{contentType:'application/json'}});
  }catch(_){return json({ok:false,error:'Invio non confermato. Riprova o usa email e WhatsApp.'},503,origin,env);}
  return json({ok:true,requestId:id},200,origin,env);
}
