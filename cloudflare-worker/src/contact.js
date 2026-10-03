// Private general enquiries. No lesson or service conversion is emitted.
export async function submitContact(request, env, origin, {json, sendEmail, hmac, escapeHtml}) {
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({ok:false,error:'Formato non valido.'},415,origin,env);
  const reader=request.body?.getReader();if(!reader)return json({ok:false,error:'Richiesta non valida.'},400,origin,env);
  let size=0;const chunks=[];for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>24000){await reader.cancel();return json({ok:false,error:'Richiesta troppo grande.'},413,origin,env);}chunks.push(r.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}const raw=new TextDecoder().decode(bytes);
  let body;try{body=JSON.parse(raw);}catch(_){return json({ok:false,error:'Richiesta non valida.'},400,origin,env);}
  const name=String(body?.name||'').trim(),email=String(body?.email||'').trim(),message=String(body?.message||'').trim();
  const id=String(body?.requestId||'');
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)||name.length<2||name.length>100||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||/[\r\n]/.test(email)||message.length<10||message.length>4000||body.privacy!==true||String(body.website||'').trim()||body.source!=='contact')return json({ok:false,error:'Controlla i campi richiesti.'},400,origin,env);
  const topics={'informazioni':'Informazioni generali','servizi':'Servizi CAD/BIM e render','lezioni':'Lezioni AutoCAD','ag-cad-tools':'AG CAD Tools','yqarch':'YQArch Italiano','blockhub-cad':'BlockHub CAD','collaborazione':'Collaborazione professionale'};
  const topic=String(body.topic||''),reference=String(body.reference||'').trim();
  if(!Object.hasOwn(topics,topic)||reference.length>1000)return json({ok:false,error:'Controlla argomento e link.'},400,origin,env);
  if(reference){try{const u=new URL(reference);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error();}catch{return json({ok:false,error:'Usa un link http o https valido, senza credenziali.'},400,origin,env);}}
  const payload={name,email,message,topic,reference,privacy:true,source:'contact'};
  const fingerprint=await hmac(env.SIGNING_SECRET,JSON.stringify(payload));
  const recordKey=`contacts/${id}.json`;
  const stored=await env.QUOTE_FILES.get(recordKey);
  const existing=stored?await stored.json():null;
  if(existing){
    if(existing.fingerprint!==fingerprint)return json({ok:false,error:'Richiesta già utilizzata. Inizia una nuova richiesta.'},409,origin,env);
    if(existing.status==='sent')return json({ok:true,requestId:id},200,origin,env);
    if(Date.now()-new Date(existing.createdAt).getTime()>23*3600000)return json({ok:false,error:'Richiesta da verificare: contatta Andrea via email.'},409,origin,env);
  }
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const rateKey=await hmac(env.SIGNING_SECRET,`contact-rate|${ip}`),hour=new Date().toISOString().slice(0,13);
  const prefix=`contact-rate/${rateKey}/${hour}/`;
  const count=await env.QUOTE_FILES.list({prefix,limit:6});
  if((count.objects||[]).length>=5)return json({ok:false,error:'Attendi prima di riprovare.'},429,origin,env);
  await env.QUOTE_FILES.put(prefix+crypto.randomUUID(),'1');
  // Store before delivery; retries reuse Resend's idempotency key and the same request ID.
  if(!existing)await env.QUOTE_FILES.put(recordKey,JSON.stringify({id,fingerprint,status:'pending',createdAt:new Date().toISOString(),...payload}),{httpMetadata:{contentType:'application/json'}});
  try{
    await sendEmail(env,{from:env.EMAIL_FROM,to:[env.EMAIL_TO],reply_to:email,subject:'Sito Andrea Giaquinto — '+topics[topic],html:`<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Messaggio dal modulo Contatti</h2><p><b>Argomento:</b> ${escapeHtml(topics[topic])}</p><p><b>Nome:</b> ${escapeHtml(name)}</p><p><b>Email:</b> ${escapeHtml(email)}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p><p><b>Riferimento fornito:</b> ${escapeHtml(reference||'Nessuno')}</p><p>Informativa letta e contatto richiesto. ID: ${id}</p></div>`},'contact/'+id);
    await env.QUOTE_FILES.put(recordKey,JSON.stringify({id,fingerprint,status:'sent',createdAt:existing?.createdAt||new Date().toISOString(),submittedAt:new Date().toISOString(),...payload}),{httpMetadata:{contentType:'application/json'}});
  }catch(_){return json({ok:false,error:'Invio non confermato. Riprova o usa email e WhatsApp.'},503,origin,env);}
  return json({ok:true,requestId:id},200,origin,env);
}
