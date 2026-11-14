// =====================================================================
//  FUNÇÃO "pagamento" — liga o app à InfinitePay (Checkout Integrado)
//  - aluno pede para pagar  -> cria o link de pagamento (Pix ou cartão)
//  - InfinitePay avisa (webhook) ou o aluno volta ao app -> confere e marca como pago
// =====================================================================
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPA_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? '';
const APP_URL = 'https://ruham816-gif.github.io/academia-app/';
const IP = 'https://api.checkout.infinitepay.io';
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

// data de hoje no fuso de Belém (AAAA-MM-DD)
const hojeBelem = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Belem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const limpaTag = (t) => String(t || '').trim().replace(/^\$/, '').replace(/^@/, '');

function acharUrl(d) {
  if (!d || typeof d !== 'object') return null;
  for (const k of ['url', 'link', 'checkout_url', 'payment_url', 'payment_link']) if (typeof d[k] === 'string' && /^https?:\/\//.test(d[k])) return d[k];
  if (d.data && typeof d.data === 'object') { const u = acharUrl(d.data); if (u) return u; }
  for (const v of Object.values(d)) if (typeof v === 'string' && /^https:\/\//.test(v)) return v;
  return null;
}

async function usuario(req) {
  const t = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!t) return null;
  const { data, error } = await admin.auth.getUser(t);
  return error ? null : data.user;
}

async function conferirNaInfinitePay(handle, order_nsu, transaction_nsu, slug) {
  const r = await fetch(IP + '/payment_check', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle, order_nsu, transaction_nsu, slug })
  });
  try { return await r.json(); } catch { return {}; }
}

// Confere com a InfinitePay e, se estiver pago, marca a mensalidade como paga
async function confirmar(order_nsu, info) {
  const { data: p } = await admin.from('pagamentos_online').select('*').eq('order_nsu', order_nsu).maybeSingle();
  if (!p) return { ok: false, motivo: 'pedido desconhecido' };
  const { data: m } = await admin.from('mensalidades').select('*').eq('id', p.mensalidade_id).maybeSingle();
  if (!m) return { ok: false, motivo: 'mensalidade não encontrada' };
  if (p.status === 'pago' && m.status === 'pago') return { ok: true, metodo: m.metodo, jaEstava: true };
  const { data: cfg } = await admin.from('config').select('infinitepay_handle').eq('modalidade', m.modalidade).maybeSingle();
  const chk = await conferirNaInfinitePay(limpaTag(cfg?.infinitepay_handle), order_nsu, info.transaction_nsu, info.slug);
  if (!chk || chk.success !== true || chk.paid !== true) return { ok: false, motivo: 'pagamento ainda não confirmado' };
  if (typeof chk.amount === 'number' && chk.amount < (p.valor_centavos || 0)) return { ok: false, motivo: 'valor divergente' };
  const metodo = chk.capture_method === 'pix' ? 'Pix' : 'Cartão';
  const agora = new Date().toISOString();
  await admin.from('pagamentos_online').update({
    status: 'pago', capture_method: chk.capture_method ?? null, valor_pago_centavos: chk.paid_amount ?? chk.amount ?? null,
    parcelas: chk.installments ?? null, transaction_nsu: info.transaction_nsu ?? null, slug: info.slug ?? null,
    receipt_url: info.receipt_url ?? p.receipt_url ?? null, pago_em: agora
  }).eq('order_nsu', order_nsu);
  if (m.status !== 'pago') await admin.from('mensalidades').update({ status: 'pago', metodo, pago_em: agora, registrado_por: null }).eq('id', m.id);
  return { ok: true, metodo };
}

// Cria o link de pagamento da mensalidade
async function criar(user, body) {
  const { data: a } = await admin.from('alunos').select('*').eq('id', body.aluno_id || '').maybeSingle();
  if (!a || a.user_id !== user.id) return json({ erro: 'Aluno não encontrado.' }, 403);
  if (a.status !== 'ativo') return json({ erro: 'A matrícula ainda não está ativa.' }, 400);
  const { data: cfg } = await admin.from('config').select('*').eq('modalidade', a.modalidade).maybeSingle();
  const handle = limpaTag(cfg?.infinitepay_handle);
  if (!handle) return json({ erro: 'O professor ainda não ativou o pagamento pelo app. Pague diretamente a ele.' }, 400);

  let m = null;
  if (body.mensalidade_id) {
    ({ data: m } = await admin.from('mensalidades').select('*').eq('id', body.mensalidade_id).eq('aluno_id', a.id).maybeSingle());
    if (!m) return json({ erro: 'Mensalidade não encontrada.' }, 404);
  } else {
    const comp = hojeBelem().slice(0, 8) + '01';
    const { data: va } = await admin.from('valores_alunos').select('valor').eq('aluno_id', a.id).maybeSingle();
    await admin.from('mensalidades').upsert({ aluno_id: a.id, modalidade: a.modalidade, competencia: comp, valor: va?.valor ?? cfg.preco },
      { onConflict: 'aluno_id,competencia', ignoreDuplicates: true });
    ({ data: m } = await admin.from('mensalidades').select('*').eq('aluno_id', a.id).eq('competencia', comp).maybeSingle());
  }
  if (!m) return json({ erro: 'Não foi possível preparar a mensalidade.' }, 500);
  if (m.status === 'pago') return json({ erro: 'Esta mensalidade já está paga.' }, 400);
  const centavos = Math.round(Number(m.valor) * 100);
  if (!(centavos >= 100)) return json({ erro: 'Valor da mensalidade inválido. Fale com o professor.' }, 400);

  const nomeMod = a.modalidade === 'judo' ? 'Judô' : 'Jiu-Jitsu';
  const mes = MESES[Number(String(m.competencia).slice(5, 7)) - 1] + '/' + String(m.competencia).slice(0, 4);
  const order_nsu = `men${m.id}-${Date.now()}`;
  const payload = {
    handle,
    items: [{ quantity: 1, price: centavos, description: `Mensalidade ${nomeMod} ${mes} - ${a.nome}`.slice(0, 120) }],
    order_nsu,
    redirect_url: APP_URL + '?pagamento=retorno',
    webhook: { url: `${SUPA_URL}/functions/v1/pagamento`, events: ['paid'] },
    customer: { name: (a.acesso === 'responsavel' && a.resp_nome) ? a.resp_nome : a.nome, email: user.email }
  };
  const r = await fetch(IP + '/links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const txt = await r.text();
  let d = {}; try { d = JSON.parse(txt); } catch { /* resposta não-JSON */ }
  if (!r.ok) {
    const msg = String(d.message || d.error || txt || r.status);
    if (/external_checkout_not_enabled/i.test(msg)) return json({ erro: 'O Checkout Integrado não está habilitado na InfinitePay do professor.' }, 502);
    return json({ erro: 'A InfinitePay recusou o pagamento: ' + msg.slice(0, 200) }, 502);
  }
  const url = acharUrl(d);
  if (!url) return json({ erro: 'Resposta inesperada da InfinitePay.', detalhe: txt.slice(0, 300) }, 502);
  await admin.from('pagamentos_online').insert({
    order_nsu, mensalidade_id: m.id, aluno_id: a.id, modalidade: a.modalidade, url, valor_centavos: centavos, status: 'aberto', criado_por: user.id
  });
  return json({ url, order_nsu });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: true, servico: 'pagamento' });
  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  try {
    // 1) Aviso da InfinitePay (webhook): não tem login, então sempre conferimos com a InfinitePay
    if (!body.acao && (body.invoice_slug || body.transaction_nsu) && body.order_nsu) {
      const r = await confirmar(String(body.order_nsu), { transaction_nsu: body.transaction_nsu, slug: body.invoice_slug, receipt_url: body.receipt_url });
      if (r.ok || r.motivo === 'pedido desconhecido') return json({ ok: true });
      return json({ ok: false, motivo: r.motivo }, 400); // 400 = InfinitePay tenta de novo depois
    }
    // 2) Aluno voltou da tela de pagamento
    if (body.acao === 'confirmar') {
      if (!body.order_nsu) return json({ ok: false, motivo: 'faltam dados' }, 400);
      return json(await confirmar(String(body.order_nsu), { transaction_nsu: body.transaction_nsu, slug: body.slug, receipt_url: body.receipt_url }));
    }
    // 3) Aluno pediu para pagar
    const user = await usuario(req);
    if (!user) return json({ erro: 'Sua sessão expirou. Entre de novo no app.' }, 401);
    return await criar(user, body);
  } catch (e) {
    console.error(e);
    return json({ erro: 'Erro interno: ' + (e?.message || e) }, 500);
  }
});
