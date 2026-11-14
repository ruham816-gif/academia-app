// =====================================================================
//  FUNÇÃO "notificar" — avisos de mensalidade no celular (Web Push)
// =====================================================================
import { createClient } from 'npm:@supabase/supabase-js@2';

// Web Push sem bibliotecas externas (RFC 8291 + RFC 8188 + VAPID RFC 8292), usando só WebCrypto.
const te = new TextEncoder();

const b64u = {
  enc(buf) {
    const a = new Uint8Array(buf); let s = '';
    for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  dec(str) {
    let s = String(str).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    const b = atob(s); const out = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  }
};
const concat = (...arrs) => { const n = arrs.reduce((t, a) => t + a.length, 0); const o = new Uint8Array(n); let p = 0; for (const a of arrs) { o.set(a, p); p += a.length; } return o; };

async function hkdf(salt, ikm, info, len) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, len * 8));
}

// chave pública "crua" (65 bytes) + privada (32 bytes) -> JWK
function jwk(pubRaw, privRaw) {
  const j = { kty: 'EC', crv: 'P-256', x: b64u.enc(pubRaw.slice(1, 33)), y: b64u.enc(pubRaw.slice(33, 65)), ext: true };
  if (privRaw) j.d = b64u.enc(privRaw);
  return j;
}

// Criptografa a mensagem para uma inscrição (aes128gcm). "fixo" só é usado em testes.
async function criptografar(payload, uaPublicB64, authB64, fixo = null) {
  const uaPub = b64u.dec(uaPublicB64), auth = b64u.dec(authB64);
  let asPriv, asPub;
  if (fixo) {
    asPub = b64u.dec(fixo.asPublic);
    asPriv = await crypto.subtle.importKey('jwk', jwk(asPub, b64u.dec(fixo.asPrivate)), { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  } else {
    const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    asPriv = kp.privateKey; asPub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  }
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asPriv, 256));
  const keyInfo = concat(te.encode('WebPush: info\0'), uaPub, asPub);
  const ikm = await hkdf(auth, ecdh, keyInfo, 32);
  const salt = fixo ? b64u.dec(fixo.salt) : crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const plain = concat(typeof payload === 'string' ? te.encode(payload) : payload, new Uint8Array([2]));
  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, plain));
  const rs = 4096;
  const header = concat(salt, new Uint8Array([(rs >>> 24) & 255, (rs >>> 16) & 255, (rs >>> 8) & 255, rs & 255, asPub.length]), asPub);
  return concat(header, cipher);
}

// Cabeçalho de autorização VAPID
async function vapidAuth(endpoint, pubB64, privB64, sub) {
  const pub = b64u.dec(pubB64), priv = b64u.dec(privB64);
  const key = await crypto.subtle.importKey('jwk', jwk(pub, priv), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const aud = new URL(endpoint).origin;
  const head = b64u.enc(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u.enc(te.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(head + '.' + body)));
  return `vapid t=${head}.${body}.${b64u.enc(sig)}, k=${pubB64}`;
}

// Envia uma notificação. Retorna o status HTTP (201 = ok; 404/410 = inscrição expirada).
async function enviarPush(insc, mensagem, vapid) {
  const corpo = await criptografar(JSON.stringify(mensagem), insc.p256dh, insc.auth);
  const r = await fetch(insc.endpoint, {
    method: 'POST',
    headers: {
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', 'TTL': '86400', 'Urgency': 'normal',
      'Authorization': await vapidAuth(insc.endpoint, vapid.publica, vapid.privada, vapid.sub)
    },
    body: corpo
  });
  return r.status;
}

// ---------------------------------------------------------------------
//  Rotina diária: avisa no celular quem tem mensalidade vencendo ou atrasada.
//  Também envia uma notificação de teste quando o aluno ativa os avisos.
// ---------------------------------------------------------------------
const SUPA_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? '';
const APP_URL = 'https://ruham816-gif.github.io/academia-app/';
const MODN = { judo: 'Judô', jj: 'Jiu-Jitsu' };
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-token', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const dataBelem = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Belem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d));
const diasEntre = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); // b - a
const addMeses = (ini, n) => { const [y, m] = ini.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 10); };

async function segredos() {
  const { data } = await admin.from('app_segredos').select('nome,valor');
  return Object.fromEntries((data || []).map(r => [r.nome, r.valor]));
}

async function usuario(req) {
  const t = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!t) return null;
  const { data, error } = await admin.auth.getUser(t);
  return error ? null : data.user;
}

async function enviarPara(userId, msg, vapid) {
  const { data: subs } = await admin.from('push_inscricoes').select('*').eq('user_id', userId);
  let n = 0;
  for (const s of subs || []) {
    try {
      const st = await enviarPush(s, msg, vapid);
      if (st === 404 || st === 410) await admin.from('push_inscricoes').delete().eq('endpoint', s.endpoint);
      else if (st >= 200 && st < 300) n++;
      else console.error('push recusado', st, s.endpoint.slice(0, 40));
    } catch (e) { console.error('push erro', e); }
  }
  return n;
}

// Garante que todo aluno ativo tenha a mensalidade do mês (com o valor dele ou o padrão)
async function gerarMensalidades(hoje) {
  const comp = hoje.slice(0, 8) + '01';
  const { data: cfgs } = await admin.from('config').select('modalidade,preco');
  for (const c of cfgs || []) {
    const { data: al } = await admin.from('alunos').select('id').eq('modalidade', c.modalidade).eq('status', 'ativo');
    if (!al || !al.length) continue;
    const { data: va } = await admin.from('valores_alunos').select('aluno_id,valor').eq('modalidade', c.modalidade);
    const vm = Object.fromEntries((va || []).map(v => [v.aluno_id, v.valor]));
    const rows = al.map(a => ({ aluno_id: a.id, modalidade: c.modalidade, competencia: comp, valor: vm[a.id] ?? c.preco ?? 0 }));
    for (let i = 0; i < rows.length; i += 200)
      await admin.from('mensalidades').upsert(rows.slice(i, i + 200), { onConflict: 'aluno_id,competencia', ignoreDuplicates: true });
  }
}

// Decide se hoje é dia de lembrar esta mensalidade
function lembrete(m, dia, hoje) {
  const venc = `${String(m.competencia).slice(0, 7)}-${String(dia).padStart(2, '0')}`;
  const criado = dataBelem(m.criado_em);
  const mes = MESES[Number(String(m.competencia).slice(5, 7)) - 1];
  const mod = MODN[m.modalidade] || '';
  if (criado <= venc) {
    const d = diasEntre(venc, hoje);
    if (d === -3) return { titulo: 'Mensalidade vence em 3 dias', corpo: `${mod} • A mensalidade de ${mes} vence dia ${dia}. Toque para ver.` };
    if (d === -1) return { titulo: 'Mensalidade vence amanhã', corpo: `${mod} • A mensalidade de ${mes} vence amanhã, dia ${dia}. Toque para ver.` };
    if (d === 0) return { titulo: 'Mensalidade vence hoje', corpo: `${mod} • A mensalidade de ${mes} vence hoje. Toque para ver.` };
    if (d > 0 && (d === 1 || d === 3 || d % 7 === 0)) return { titulo: 'Mensalidade atrasada', corpo: `${mod} • A mensalidade de ${mes} venceu dia ${dia} (${d} dia${d > 1 ? 's' : ''} de atraso). Toque para ver.` };
    return null;
  }
  const d = diasEntre(criado, hoje); // entrou depois do vencimento: lembrete semanal de "em aberto"
  if (d > 0 && (d === 1 || d % 7 === 0)) return { titulo: 'Mensalidade em aberto', corpo: `${mod} • A mensalidade de ${mes} está em aberto. Toque para ver.` };
  return null;
}

async function rodarLembretes(vapid) {
  const hoje = dataBelem();
  await gerarMensalidades(hoje);
  const { data: cfgs } = await admin.from('config').select('modalidade,dia_vencimento');
  const dia = Object.fromEntries((cfgs || []).map(c => [c.modalidade, c.dia_vencimento || 10]));
  const desde = addMeses(hoje.slice(0, 8) + '01', -3);
  const { data: mens } = await admin.from('mensalidades').select('id,aluno_id,modalidade,competencia,criado_em,status').eq('status', 'pendente').gte('competencia', desde);
  const ids = [...new Set((mens || []).map(m => m.aluno_id))];
  const alunos = {};
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await admin.from('alunos').select('id,user_id,status').in('id', ids.slice(i, i + 100));
    for (const a of data || []) alunos[a.id] = a;
  }
  let enviados = 0, lembretes = 0;
  for (const m of mens || []) {
    const a = alunos[m.aluno_id];
    if (!a || a.status !== 'ativo' || !a.user_id) continue;
    const msg = lembrete(m, dia[m.modalidade] || 10, hoje);
    if (!msg) continue;
    const { error } = await admin.from('notificacoes_log').insert({ chave: `men${m.id}:${hoje}`, user_id: a.user_id });
    if (error) continue; // já avisado hoje
    lembretes++;
    enviados += await enviarPara(a.user_id, { ...msg, url: APP_URL + '#mensalidade', tag: `men${m.id}` }, vapid);
  }
  return { ok: true, hoje, pendentes: (mens || []).length, lembretes, enviados };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: true, servico: 'notificar' });
  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  try {
    const seg = await segredos();
    const vapid = { publica: seg.vapid_public, privada: seg.vapid_private, sub: APP_URL };
    if (!vapid.publica || !vapid.privada) return json({ erro: 'Chaves de notificação não configuradas.' }, 500);
    if (body.acao === 'teste') {
      const user = await usuario(req);
      if (!user) return json({ erro: 'Faça login novamente.' }, 401);
      const n = await enviarPara(user.id, { titulo: 'Notificações ativadas!', corpo: 'Você vai receber aqui os avisos de mensalidade.', url: APP_URL, tag: 'teste' }, vapid);
      return json({ ok: true, enviados: n });
    }
    if (!seg.cron_token || req.headers.get('x-token') !== seg.cron_token) return json({ erro: 'Não autorizado.' }, 401);
    return json(await rodarLembretes(vapid));
  } catch (e) {
    console.error(e);
    return json({ erro: 'Erro interno: ' + (e?.message || e) }, 500);
  }
});
