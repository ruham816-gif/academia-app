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
export function lembrete(m, dia, hoje) {
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

// Avisos do pagamento: aluno -> professor responsável (pediu link / informou pagamento)
// e professor -> aluno (link enviado / pagamento confirmado / não recebido)
async function avisoPagamento(user, tipo, mid, vapid) {
  if (!mid) return { ok: false };
  const { data: m } = await admin.from('mensalidades').select('*').eq('id', mid).maybeSingle();
  if (!m) return { ok: false };
  const { data: a } = await admin.from('alunos').select('id,nome,user_id').eq('id', m.aluno_id).maybeSingle();
  if (!a) return { ok: false };
  const { data: resps } = await admin.from('papeis').select('user_id').eq('modalidade', m.modalidade).eq('papel', 'resp');
  const ehResp = (resps || []).some(r => r.user_id === user.id);
  const mes = MESES[Number(String(m.competencia).slice(5, 7)) - 1];
  const mod = MODN[m.modalidade] || '';
  const nome = String(a.nome || '').split(' ')[0];
  let msg = null, para = [], marca = '';
  if (tipo === 'link_pedido' && a.user_id === user.id && m.link_solicitado_em && !m.link_pagamento) {
    msg = { titulo: 'Pedido de link do cartão', corpo: `${mod} • ${nome} pediu o link para pagar a mensalidade de ${mes} no cartão.` };
    para = (resps || []).map(r => r.user_id); marca = m.link_solicitado_em;
  } else if (tipo === 'pago_informado' && a.user_id === user.id && m.informado_em && m.status === 'pendente') {
    msg = { titulo: 'Pagamento informado', corpo: `${mod} • ${nome} informou que pagou a mensalidade de ${mes} via ${m.informado_metodo || 'Pix'}. Confirme o recebimento.` };
    para = (resps || []).map(r => r.user_id); marca = m.informado_em;
  } else if (tipo === 'link_enviado' && ehResp && m.link_pagamento && a.user_id) {
    msg = { titulo: 'Seu link de pagamento chegou', corpo: `${mod} • Toque para pagar a mensalidade de ${mes} no cartão.` };
    para = [a.user_id]; marca = String(m.link_pagamento).slice(0, 80);
  } else if (tipo === 'pago_confirmado' && ehResp && m.status === 'pago' && a.user_id) {
    msg = { titulo: 'Pagamento confirmado', corpo: `${mod} • A mensalidade de ${mes} está paga. Obrigado!` };
    para = [a.user_id]; marca = String(m.pago_em || '');
  } else if (tipo === 'pago_recusado' && ehResp && m.status === 'pendente' && !m.informado_em && a.user_id) {
    msg = { titulo: 'Pagamento não identificado', corpo: `${mod} • O professor não encontrou o pagamento de ${mes}. Toque para ver.` };
    para = [a.user_id]; marca = new Date().toISOString().slice(0, 13);
  }
  if (!msg) return { ok: false };
  let enviados = 0;
  for (const u of [...new Set(para)]) {
    const { error } = await admin.from('notificacoes_log').insert({ chave: `${tipo}:${mid}:${u}:${marca}`, user_id: u });
    if (error) continue; // já avisado
    const url = APP_URL + (para.includes(a.user_id) && u === a.user_id ? '#mensalidade' : '#financeiro');
    enviados += await enviarPara(u, { ...msg, url, tag: `${tipo}${mid}` }, vapid);
  }
  return { ok: true, enviados };
}

// Novo aviso publicado pelo professor: notifica no celular todos os alunos ativos da modalidade
async function avisoNovo(user, avisoId, vapid) {
  if (!avisoId) return { ok: false };
  const { data: av } = await admin.from('avisos').select('*').eq('id', avisoId).maybeSingle();
  if (!av) return { ok: false };
  const { data: pp } = await admin.from('papeis').select('papel').eq('modalidade', av.modalidade).eq('user_id', user.id).maybeSingle();
  if (!pp) return { ok: false, erro: 'Não permitido' };
  if (Date.now() - Date.parse(av.criado_em) > 15 * 60 * 1000) return { ok: false, erro: 'Aviso antigo' };
  const { error } = await admin.from('notificacoes_log').insert({ chave: `aviso:${av.id}`, user_id: user.id });
  if (error) return { ok: true, enviados: 0 }; // já foi enviado
  const { data: al } = await admin.from('alunos').select('user_id').eq('modalidade', av.modalidade).eq('status', 'ativo').not('user_id', 'is', null);
  const ids = [...new Set((al || []).map(a => a.user_id))].filter(u => u !== user.id);
  const subs = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await admin.from('push_inscricoes').select('*').in('user_id', ids.slice(i, i + 100));
    subs.push(...(data || []));
  }
  const texto = String(av.texto || '').replace(/\s+/g, ' ').trim();
  const msg = { titulo: `Novo aviso • ${MODN[av.modalidade] || ''}`, corpo: texto.length > 150 ? texto.slice(0, 147) + '…' : texto, url: APP_URL, tag: `aviso${av.id}` };
  let enviados = 0;
  for (let i = 0; i < subs.length; i += 25) { // envia de 25 em 25 ao mesmo tempo
    const r = await Promise.all(subs.slice(i, i + 25).map(async (s) => {
      try {
        const st = await enviarPush(s, msg, vapid);
        if (st === 404 || st === 410) await admin.from('push_inscricoes').delete().eq('endpoint', s.endpoint);
        return st >= 200 && st < 300 ? 1 : 0;
      } catch (e) { console.error('push erro', e); return 0; }
    }));
    enviados += r.reduce((t, x) => t + x, 0);
  }
  return { ok: true, alunos: ids.length, enviados };
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
      const n = await enviarPara(user.id, { titulo: 'Notificações ativadas!', corpo: 'Você vai receber aqui os avisos da academia e de mensalidade.', url: APP_URL, tag: 'teste' }, vapid);
      return json({ ok: true, enviados: n });
    }
    if (body.acao === 'novo_aviso') {
      const user = await usuario(req);
      if (!user) return json({ erro: 'Faça login novamente.' }, 401);
      return json(await avisoNovo(user, Number(body.aviso_id), vapid));
    }
    if (body.acao === 'aviso') {
      const user = await usuario(req);
      if (!user) return json({ erro: 'Faça login novamente.' }, 401);
      return json(await avisoPagamento(user, String(body.tipo || ''), Number(body.mensalidade_id), vapid));
    }
    if (!seg.cron_token || req.headers.get('x-token') !== seg.cron_token) return json({ erro: 'Não autorizado.' }, 401);
    return json(await rodarLembretes(vapid));
  } catch (e) {
    console.error(e);
    return json({ erro: 'Erro interno: ' + (e?.message || e) }, 500);
  }
});
