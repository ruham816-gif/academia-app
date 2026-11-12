'use strict';
/* =====================================================================
   APP JIU-JITSU E JUDÔ — versão conectada ao Supabase
   ===================================================================== */

/* ---------- ícones ---------- */
const P={
home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
calendar:'<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
card:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
check:'<path d="M20 6 9 17l-5-5"/>',
camera:'<path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>',
medal:'<circle cx="12" cy="15" r="6"/><path d="M8.5 9.8 6 2h4l2 5 2-5h4l-2.5 7.8"/>',
users:'<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
swap:'<path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>',
bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
crown:'<path d="M2 8l4 11h12l4-11-6 4-4-8-4 8z"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
chev:'<path d="m9 18 6-6-6-6"/>',
back:'<path d="m15 18-6-6 6-6"/>',
file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
money:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>',
x:'<path d="M18 6 6 18M6 6l12 12"/>',
link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
insta:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>',
play:'<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
belt:'<path d="M2 10h20v4H2z"/><path d="M10 9l-2 9M14 9l2 9"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
alert:'<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18h.01"/>',
download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'
};
const ic=(n,c='')=>`<svg class="i ${c}" viewBox="0 0 24 24">${P[n]}</svg>`;
const crown=()=>`<svg viewBox="0 0 24 24">${P.crown}</svg>`;

/* ---------- utilitários ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'R$ '+Number(v||0).toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const initials=n=>String(n||'?').split(' ').filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase();
const first=n=>String(n||'').split(' ')[0];
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const hoje=()=>iso(new Date());
const mesIni=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-01`;
const addMes=(s,n)=>{const [y,m]=s.split('-').map(Number);return mesIni(new Date(y,m-1+n,1))};
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const nomeMes=s=>MESES[+s.split('-')[1]-1];
const br=s=>{if(!s)return '';const [y,m,d]=String(s).slice(0,10).split('-');return `${d}/${m}/${y}`};
const brCurto=s=>br(s).slice(0,5);
const dataHora=ts=>{if(!ts)return '';const d=new Date(ts);return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`};
const dataExt=s=>{const [y,m,d]=s.split('-').map(Number);const dt=new Date(y,m-1,d);return `${DIAS[dt.getDay()]}, ${d} de ${MESES[m-1].toLowerCase()}`};
function idade(n){if(!n)return null;const [y,m,d]=n.split('-').map(Number);const t=new Date();let a=t.getFullYear()-y;if(t.getMonth()+1<m||(t.getMonth()+1===m&&t.getDate()<d))a--;return a}
function quando(ts){const d=new Date(ts),n=new Date();const min=Math.round((n-d)/60000);if(min<2)return 'agora';if(min<60)return `há ${min} min`;
 if(iso(d)===iso(n))return `hoje, ${pad(d.getHours())}h${pad(d.getMinutes())}`;const o=new Date(n);o.setDate(o.getDate()-1);if(iso(d)===iso(o))return `ontem, ${pad(d.getHours())}h${pad(d.getMinutes())}`;return dataHora(ts)}
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
let toastT;
function toast(msg,err){const t=$('#toast');t.className='toast'+(err?' err':'');t.innerHTML=ic(err?'alert':'check')+esc(msg);requestAnimationFrame(()=>t.classList.add('on'));clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),err?4200:2600)}
function openSheet(html){$('#sheet').innerHTML='<div class="grab"></div>'+html;$('#sheetbg').classList.add('on')}
function closeSheet(){$('#sheetbg').classList.remove('on')}
let busyN=0;function busy(v){busyN+=v?1:-1;if(busyN<0)busyN=0;$('#busy').classList.toggle('on',busyN>0)}

/* ---------- dados fixos ---------- */
const MODS={
  judo:{nome:'Judô',prof:'Ruhan Silva',logo:'img/judo_logo.webp'},
  jj:{nome:'Jiu-Jitsu',prof:'Renan Pinheiro',logo:'img/jj_logo.webp'}
};
const BELTS={
  judo:[['Branca','#f2f2f2'],['Cinza','#8d8f94'],['Azul','#1f5fd6'],['Amarela','#f3c623'],['Laranja','#ff8a1f'],['Verde','#2f9e4f'],['Roxa','#7b3fb5'],['Marrom','#6b4226'],['Preta','#141414']],
  jj:[['Branca','#f2f2f2'],['Cinza','#8d8f94'],['Amarela','#f3c623'],['Laranja','#ff8a1f'],['Verde','#2f9e4f'],['Azul','#1f5fd6'],['Roxa','#7b3fb5'],['Marrom','#6b4226'],['Preta','#141414']]
};
const COL={1:['Ouro','m1','1º'],2:['Prata','m2','2º'],3:['Bronze','m3','3º'],0:['Participação','m0','P']};
const STAFF_TABS=['painel','chamada','publicar','comps','gestao'];

/* ---------- conexão ---------- */
const CFG=window.APP_CONFIG||{};
let sb=null;
const ERROS=[[/Invalid login credentials/i,'E-mail ou senha incorretos.'],[/already registered|already been registered/i,'Este e-mail já tem conta. Use "Entrar".'],
 [/Email not confirmed/i,'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'],[/at least 6 characters|Password should/i,'A senha precisa ter pelo menos 6 caracteres.'],
 [/row-level security|permission denied|Não permitido|Sem permissão/i,'Você não tem permissão para isso.'],[/Failed to fetch|NetworkError|network/i,'Sem conexão com a internet. Tente de novo.'],
 [/rate limit|too many/i,'Muitas tentativas. Aguarde alguns minutos.'],[/invalid email|Unable to validate email/i,'E-mail inválido.'],[/duplicate key/i,'Esse registro já existe.']];
const traduz=m=>{for(const [r,t] of ERROS)if(r.test(m||''))return t;return m||'Algo deu errado. Tente de novo.'};
async function q(p){const r=await p;if(r&&r.error){const e=new Error(traduz(r.error.message));e.orig=r.error;console.error(r.error);throw e}return r?r.data:null}
async function act(fn){busy(true);try{await fn()}catch(e){console.error(e);toast(e.message||'Erro',true)}finally{busy(false)}}
const uid=()=>S.sess&&S.sess.user.id;

/* ---------- retorno da tela de pagamento ---------- */
const RET=(()=>{try{const u=new URL(location.href);if(u.searchParams.get('pagamento')==='retorno'){const g=k=>u.searchParams.get(k);
  const o={order_nsu:g('order_nsu'),transaction_nsu:g('transaction_nsu'),slug:g('slug'),receipt_url:g('receipt_url'),capture_method:g('capture_method')};history.replaceState(null,'',u.pathname);return o}}catch(e){}return null})();

/* ---------- estado ---------- */
let S={mod:LS.get('mod'),scr:'boot',sess:null,ctx:null,role:null,aluno:null,pname:'',tab:null,sub:null,rk:'comp',mat:null,D:{},ch:null,chData:null,newImg:null,newBlob:null,legDraft:'',cad:{}};
function go(o){if(o.tab&&o.tab!==S.tab)S.ch=null;Object.assign(S,o);render()}
function render(keep){
  if(S.mod&&S.scr!=='escolha')document.body.dataset.mod=S.mod;else document.body.removeAttribute('data-mod');
  const v={boot:vSpin,carregando:vSpin,semconfig:vSemConfig,erro:vErro,escolha:vEscolha,entrada:vEntrada,login:vLogin,cadastro:vCadastro,confirmeEmail:vConfirmeEmail,
    novasenha:vNovaSenha,retorno:vRetorno,semvinculo:vSemVinculo,aguardando:vAguardando,mat:vMat,app:vApp}[S.scr]||vErro;
  $('#app').innerHTML=v();
  if(!keep)window.scrollTo(0,0);
}

/* ---------- inicialização ---------- */
async function boot(){
  if(!window.supabase||!CFG.SUPABASE_URL||/COLE_AQUI/.test(CFG.SUPABASE_URL+CFG.SUPABASE_KEY)){S.scr='semconfig';render();return}
  sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  sb.auth.onAuthStateChange((ev,session)=>{S.sess=session;if(ev==='PASSWORD_RECOVERY'){S.scr='novasenha';render()}});
  try{const {data}=await sb.auth.getSession();S.sess=data.session}catch(e){S.sess=null}
  if(S.scr==='novasenha')return;
  if(RET&&RET.order_nsu){S.scr='retorno';S.ret={status:'conferindo'};render();
    try{const {data}=await sb.functions.invoke('pagamento',{body:{acao:'confirmar',...RET}});S.ret={status:data&&data.ok?'ok':'aguardando',metodo:data&&data.metodo}}catch(e){S.ret={status:'aguardando'}}
    render();return}
  if(S.sess)await entrarNoApp();else{S.scr=S.mod?'entrada':'escolha';render()}
}
async function entrarNoApp(){S.scr='carregando';render();
  try{await loadCtx();
    if(!S.mod){const c=contextos();S.mod=c[0]?c[0].mod:null}
    if(!S.mod){S.scr='escolha';render();return}
    await decide();
  }catch(e){console.error(e);S.erro=e.message;S.scr='erro';render()}}
async function loadCtx(){const u=uid();
  const [p,a,pf]=await Promise.all([q(sb.from('papeis').select('*').eq('user_id',u)),q(sb.from('alunos').select('*').eq('user_id',u).order('criado_em')),q(sb.from('perfis').select('*').eq('id',u).maybeSingle())]);
  S.ctx={papeis:p||[],alunos:a||[],perfil:pf||{nome:(S.sess.user.user_metadata||{}).nome||''}}}
function contextos(){const c=S.ctx;if(!c)return [];const l=[];
  c.papeis.forEach(p=>l.push({mod:p.modalidade,tipo:'staff',label:MODS[p.modalidade].nome,sub:p.papel==='resp'?'Professor responsável':'Professor auxiliar'}));
  c.alunos.filter(a=>a.status==='ativo'&&!c.papeis.some(p=>p.modalidade===a.modalidade)).forEach(a=>l.push({mod:a.modalidade,tipo:'aluno',id:a.id,label:MODS[a.modalidade].nome,sub:'Aluno: '+a.nome}));
  return l}
async function decide(){const c=S.ctx;LS.set('mod',S.mod);S.sub=null;S.ch=null;S.newImg=null;
  const pp=c.papeis.find(x=>x.modalidade===S.mod);
  if(pp){S.role=pp.papel;S.pname=pp.nome||c.perfil.nome||'Professor';S.aluno=null;if(!STAFF_TABS.includes(S.tab)||(S.tab==='gestao'&&S.role!=='resp'))S.tab='painel'}
  else{const al=c.alunos.filter(x=>x.modalidade===S.mod&&x.status==='ativo');
    if(!al.length){S.role=null;S.scr=c.alunos.some(x=>x.modalidade===S.mod&&x.status==='pendente')?'aguardando':'semvinculo';render();return}
    S.role='aluno';const pref=LS.get('aluno_'+S.mod);S.aluno=al.find(x=>x.id===pref)||al[0];if(STAFF_TABS.includes(S.tab)||!S.tab)S.tab='inicio'}
  S.scr='carregando';render();await loadData();S.scr='app';render()}
async function refresh(){busy(true);try{await loadData();render(true)}catch(e){toast(e.message,true)}finally{busy(false)}}

/* ---------- carregamento de dados ---------- */
async function loadData(){const m=S.mod,D={};const mi=mesIni(),prox=addMes(mi,1),ant=addMes(mi,-1),ant2=addMes(mi,-2);D.mi=mi;D.ant=ant;
  const L=[
    q(sb.from('avisos').select('*').eq('modalidade',m).order('criado_em',{ascending:false}).limit(30)).then(r=>D.avisos=r||[]),
    q(sb.from('feed').select('*').eq('modalidade',m).order('criado_em',{ascending:false}).limit(1)).then(async r=>{D.feed=(r||[])[0]||null;
      if(D.feed){try{const s=await sb.storage.from('feed').createSignedUrl(D.feed.foto_path,60*60*6);D.feed.url=s.data&&s.data.signedUrl}catch(e){}}}),
    q(sb.rpc('ranking_mes',{p_mod:m,p_mes:mi})).then(r=>D.rank=r||[]),
    q(sb.rpc('ranking_mes',{p_mod:m,p_mes:ant})).then(r=>D.rankAnt=r||[])
  ];
  if(S.role==='aluno'){const a=S.aluno.id;
    L.push(
      q(sb.from('alunos').select('*').eq('id',a).single()).then(r=>{S.aluno=r}),
      q(sb.from('presencas').select('data').eq('aluno_id',a).gte('data',ant2)).then(r=>D.pres=(r||[]).map(x=>x.data)),
      q(sb.from('competicoes').select('*').eq('aluno_id',a).order('data',{ascending:false})).then(r=>D.comps=r||[]),
      q(sb.from('mensalidades').select('*').eq('aluno_id',a).order('competencia',{ascending:false}).limit(12)).then(r=>D.mens=r||[]),
      q(sb.from('graduacoes').select('*').eq('aluno_id',a).order('data',{ascending:true}).order('id',{ascending:true})).then(r=>D.grads=r||[]),
      q(sb.from('config').select('*').eq('modalidade',m).maybeSingle()).then(r=>D.cfg=r));
  }else{
    L.push(
      q(sb.from('alunos').select('*').eq('modalidade',m).order('nome')).then(r=>D.alunos=r||[]),
      q(sb.from('presencas').select('aluno_id,data').eq('modalidade',m).gte('data',mi).lt('data',prox)).then(r=>D.pres=r||[]),
      q(sb.from('competicoes').select('*').eq('modalidade',m).or(`status.eq.pendente,data.gte.${mi}`).order('data',{ascending:false})).then(r=>D.comps=r||[]));
    if(S.role==='resp')L.push(
      q(sb.from('config').select('*').eq('modalidade',m).maybeSingle()).then(r=>D.cfg=r),
      q(sb.from('papeis').select('*').eq('modalidade',m)).then(r=>D.equipe=r||[]),
      q(sb.from('convites_staff').select('*').eq('modalidade',m)).then(r=>D.convites=r||[]),
      (async()=>{await q(sb.rpc('gerar_mensalidades',{p_mod:m,p_comp:mi}));D.mens=await q(sb.from('mensalidades').select('*').eq('modalidade',m).eq('competencia',mi))||[]})());
  }
  await Promise.all(L);S.D=D}

/* ---------- regras ---------- */
function ordComp(rows){return rows.filter(s=>s.comps>0).sort((x,y)=>y.pts-x.pts||y.ouros-x.ouros||y.comps-x.comps||y.freq-x.freq)}
function ordFreq(rows){return rows.filter(s=>s.freq>0).sort((x,y)=>y.freq-x.freq||y.comps-x.comps)}
function tieWhy(x,y,k){if(k==='comp'){if(x.ouros!==y.ouros)return 'mais ouros';if(x.comps!==y.comps)return 'mais competições';if(x.freq!==y.freq)return 'mais treinos';return null}
  if(x.comps!==y.comps)return 'mais competições';return null}
function statusMens(row,cfg){const dia=cfg?cfg.dia_vencimento:10;if(row&&row.status==='pago')return 'pago';if(!row)return 'pendente';const t=new Date();
  const comp=row.competencia;const venc=new Date(+comp.slice(0,4),+comp.slice(5,7)-1,dia,23,59);
  if(row.criado_em&&new Date(row.criado_em)>venc)return 'pendente'; // entrou depois do vencimento: não conta como atraso neste mês
  return t>venc?'atrasado':'pendente'}
const contratoOk=(a,cfg)=>!!(a&&a.contrato_aceito_em&&cfg&&a.contrato_versao===cfg.contrato_versao);

/* ---------- peças visuais ---------- */
function belt(mod,f,g,w=220){const [n,c]=BELTS[mod][f]||BELTS[mod][0];const tip=mod==='jj';const tc=n==='Preta'?'#c62828':'#111';
  let s=`<svg class="belt" viewBox="0 0 200 24" width="${w}" height="${Math.round(w*.12)}"><rect x="1" y="2" width="198" height="20" rx="3" fill="${c}" stroke="rgba(255,255,255,.2)"/><rect x="1" y="5" width="198" height="1.4" fill="rgba(255,255,255,.14)"/><rect x="1" y="18" width="198" height="1.4" fill="rgba(0,0,0,.2)"/>`;
  if(tip){s+=`<rect x="140" y="2" width="44" height="20" fill="${tc}"/>`;for(let i=0;i<g;i++)s+=`<rect x="${174-i*8}" y="2" width="4" height="20" fill="#fff"/>`}
  return s+'</svg>'}
const faixaNome=(mod,f,g)=>(BELTS[mod][f]||BELTS[mod][0])[0]+(mod==='jj'&&g?` • ${g}º grau`:'');
const bdot=(mod,f)=>`<i class="bdot" style="background:${(BELTS[mod][f]||BELTS[mod][0])[1]}"></i>`;
const payBadge=p=>({pago:'<span class="badge b-ok">Em dia</span>',pendente:'<span class="badge b-warn">Pendente</span>',atrasado:'<span class="badge b-bad">Atrasado</span>'})[p];
function phArt(){return `<svg class="ph" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="pg" cx="72%" cy="12%" r="95%"><stop offset="0" style="stop-color:var(--acc);stop-opacity:.75"/><stop offset=".55" stop-color="#1a1012"/><stop offset="1" stop-color="#0b0b0e"/></radialGradient></defs><rect width="400" height="320" fill="url(#pg)"/><g stroke="rgba(255,255,255,.09)" stroke-width="1">${[0,1,2,3,4,5,6].map(i=>{const y=190+i*i*4+i*8;return `<line x1="0" y1="${y}" x2="400" y2="${y}"/>`}).join('')}${[-6,-4,-2,0,2,4,6].map(k=>`<line x1="${200+k*12}" y1="186" x2="${200+k*95}" y2="320"/>`).join('')}</g></svg><img class="ph-logo" src="${MODS[S.mod].logo}" alt="">`}
function feedCard(f){if(!f)return `<div class="feed">${phArt()}<div class="ov"><p class="cap">A foto do próximo treino aparece aqui</p><small>Os professores publicam pelo app</small></div></div>`;
  return `<div class="feed">${f.url?`<img class="ph-photo" src="${esc(f.url)}" alt="Foto do último treino">`:phArt()}<span class="tag live top"><i class="dot"></i>Último treino</span><div class="ov"><p class="cap">${esc(f.legenda||'Treino')}</p><small>${esc(f.autor_nome||'')} • ${quando(f.criado_em)}</small></div></div>`}
function kingCard(t,n,info){return `<div class="king"><span class="lab">Rei do Tatame</span><b class="kt">${t}</b><div class="kav">${crown()}${initials(n)}</div><p class="kn">${esc(n)}</p><small class="mut">${info}</small></div>`}
function kingVazio(t){return `<div class="king" style="opacity:.6"><span class="lab">Rei do Tatame</span><b class="kt">${t}</b><div class="kav">${crown()}?</div><p class="kn">A definir</p><small class="mut">sem dados ainda</small></div>`}
const backBar=(t)=>`<button class="back" onclick="go({sub:null})">${ic('back')}${t}</button>`;
const autor=()=>(S.role==='resp'?'Prof. ':'')+S.pname;

/* ---------- telas de entrada ---------- */
function vSpin(){return `<div class="center"><div class="spin"></div></div>`}
function vRetorno(){const r=S.ret||{};
  if(r.status==='conferindo')return `<div class="center"><div class="spin"></div><p class="mut mt16">Conferindo seu pagamento...</p></div>`;
  const ok=r.status==='ok';
  return `<div class="center"><div class="okbig" style="${ok?'':'background:linear-gradient(135deg,#d99a00,#f5b400);box-shadow:0 0 50px rgba(245,180,0,.4)'}">${ic(ok?'check':'refresh')}</div>
  <div class="h1">${ok?'Pagamento confirmado!':'Pagamento recebido'}</div>
  <p class="mut mt12">${ok?`Sua mensalidade já aparece como paga${r.metodo?' ('+esc(r.metodo)+')':''}. Obrigado!`:'A InfinitePay ainda está confirmando. Em instantes a mensalidade aparece como paga no app.'}</p>
  <button class="btn mt16" style="max-width:280px" onclick="continuarRetorno()">Continuar</button></div>`}
function continuarRetorno(){S.ret=null;if(S.sess)act(entrarNoApp);else go({scr:S.mod?'entrada':'escolha'})}
function vSemConfig(){return `<div class="center"><div class="h1">Quase lá</div><p class="mut mt12">O app ainda não foi conectado ao banco de dados. Preencha o arquivo config.js.</p></div>`}
function vErro(){return `<div class="center"><div class="h1">Ops</div><p class="mut mt12">${esc(S.erro||'Não foi possível carregar.')}</p><button class="btn mt16" style="max-width:260px" onclick="entrarNoApp()">${ic('refresh')}Tentar de novo</button><button class="link mt12" onclick="sair()">Sair da conta</button></div>`}
function vEscolha(){return `<div class="welcome fade">
  <div><div class="brand">Jiu-Jitsu<span>&amp; Judô</span></div><p class="mut mt12">Escolha sua modalidade</p></div>
  <div class="choose">
   <button class="mod-card jj" onclick="escolher('jj')"><img src="${MODS.jj.logo}" alt="Logo Jiu-Jitsu"><div><b>Jiu-Jitsu</b><small>Prof. ${MODS.jj.prof}</small></div></button>
   <button class="mod-card judo" onclick="escolher('judo')"><img src="${MODS.judo.logo}" alt="Logo Judô"><div><b>Judô</b><small>Prof. ${MODS.judo.prof}</small></div></button>
  </div><div></div></div>`}
function escolher(m){S.mod=m;LS.set('mod',m);if(S.sess&&S.ctx){act(decide)}else go({scr:'entrada'})}
function vEntrada(){const m=MODS[S.mod];return `<div class="welcome fade">
  <div><img class="biglogo" src="${m.logo}" alt=""><div class="h1" style="font-size:44px">${m.nome}</div><p class="mut mt8">Prof. responsável: ${m.prof}</p></div>
  <div style="margin-top:34px;display:flex;flex-direction:column;gap:10px">
   <button class="btn" onclick="go({scr:'login'})">${ic('user')}Entrar</button>
   <button class="btn ghost" onclick="go({scr:'cadastro',cad:{}})">${ic('file')}Criar conta e fazer matrícula</button>
   <button class="back" style="justify-content:center;margin-top:8px" onclick="go({scr:'escolha'})">${ic('swap')}Trocar modalidade</button>
  </div></div>`}
function vLogin(){const m=MODS[S.mod];return `<div class="wrap fade" style="padding-top:calc(20px + env(safe-area-inset-top))">
  <button class="back" onclick="go({scr:'entrada'})">${ic('back')}Voltar</button>
  <div style="text-align:center"><img class="biglogo" style="width:130px;height:120px" src="${m.logo}" alt=""><div class="h1">Entrar</div></div>
  <form onsubmit="event.preventDefault();entrar()">
  <label class="lbl">E-mail</label><input class="in" id="l_email" type="email" autocomplete="email" inputmode="email" placeholder="seu@email.com">
  <label class="lbl">Senha</label><input class="in" id="l_senha" type="password" autocomplete="current-password" placeholder="••••••••">
  <button class="btn mt16" type="submit">Entrar</button></form>
  <div style="text-align:center" class="mt12"><button class="link" onclick="esqueci()">Esqueci minha senha</button></div>
  <div style="text-align:center"><button class="link" onclick="go({scr:'cadastro',cad:{}})">Ainda não tenho conta</button></div></div>`}
function entrar(){const e=$('#l_email').value.trim(),s=$('#l_senha').value;if(!e||!s){toast('Preencha e-mail e senha',true);return}
  act(async()=>{const r=await q(sb.auth.signInWithPassword({email:e,password:s}));S.sess=r.session;await entrarNoApp()})}
function esqueci(){const e=($('#l_email')||{}).value;openSheet(`<h3>Recuperar senha</h3><p class="mut">Enviaremos um link para criar uma nova senha.</p>
  <label class="lbl">E-mail</label><input class="in" id="r_email" type="email" value="${esc(e||'')}"><button class="btn mt16" onclick="enviarReset()">Enviar link</button>`)}
function enviarReset(){const e=$('#r_email').value.trim();if(!e)return;act(async()=>{await q(sb.auth.resetPasswordForEmail(e,{redirectTo:location.origin+location.pathname}));closeSheet();toast('Link enviado! Veja seu e-mail.')})}
function vNovaSenha(){return `<div class="wrap fade" style="padding-top:calc(30px + env(safe-area-inset-top))"><div class="h1">Nova senha</div>
  <label class="lbl">Digite a nova senha</label><input class="in" id="n_s1" type="password" autocomplete="new-password"><label class="lbl">Repita a senha</label><input class="in" id="n_s2" type="password" autocomplete="new-password">
  <button class="btn mt16" onclick="salvarSenha()">Salvar nova senha</button></div>`}
function salvarSenha(){const a=$('#n_s1').value,b=$('#n_s2').value;if(a.length<6){toast('A senha precisa ter pelo menos 6 caracteres',true);return}if(a!==b){toast('As senhas não são iguais',true);return}
  act(async()=>{await q(sb.auth.updateUser({password:a}));toast('Senha alterada!');history.replaceState(null,'',location.pathname);await entrarNoApp()})}
function vCadastro(){const c=S.cad;return `<div class="wrap fade" style="padding-top:calc(20px + env(safe-area-inset-top))">
  <button class="back" onclick="go({scr:S.sess?'semvinculo':'entrada'})">${ic('back')}Voltar</button>
  <div class="h1">Criar conta</div><p class="mut mt8">Use os dados de quem vai usar o app. Para aluno menor de idade, normalmente é o responsável.</p>
  <form onsubmit="event.preventDefault();criarConta()">
  <label class="lbl">Seu nome completo</label><input class="in" id="c_nome" autocomplete="name" value="${esc(c.nome||'')}">
  <label class="lbl">E-mail</label><input class="in" id="c_email" type="email" autocomplete="email" inputmode="email" value="${esc(c.email||'')}">
  <label class="lbl">Crie uma senha (mínimo 6 caracteres)</label><input class="in" id="c_senha" type="password" autocomplete="new-password">
  <button class="btn mt16" type="submit">Criar conta</button></form>
  <div style="text-align:center" class="mt12"><button class="link" onclick="go({scr:'login'})">Já tenho conta</button></div></div>`}
function criarConta(){const nome=$('#c_nome').value.trim(),email=$('#c_email').value.trim(),senha=$('#c_senha').value;S.cad={nome,email};
  if(!nome||!email||!senha){toast('Preencha todos os campos',true);return}if(senha.length<6){toast('A senha precisa ter pelo menos 6 caracteres',true);return}
  act(async()=>{const r=await q(sb.auth.signUp({email,password:senha,options:{data:{nome},emailRedirectTo:location.origin+location.pathname}}));
    if(r.session){S.sess=r.session;await entrarNoApp()}else{S.scr='confirmeEmail';render()}})}
function vConfirmeEmail(){return `<div class="center"><div class="okbig">${ic('check')}</div><div class="h1">Confirme seu e-mail</div><p class="mut mt12">Enviamos um link para <b>${esc(S.cad.email||'seu e-mail')}</b>. Toque nele e depois volte aqui para entrar e concluir a matrícula.</p><button class="btn mt16" style="max-width:260px" onclick="go({scr:'login'})">Ir para o login</button></div>`}
function vSemVinculo(){const m=MODS[S.mod];const outros=contextos();const nome=S.ctx&&S.ctx.perfil.nome;return `<div class="welcome fade">
  <div><img class="biglogo" style="width:150px;height:140px" src="${m.logo}" alt=""><div class="h1">Olá${nome?', '+esc(first(nome)):''}!</div><p class="mut mt12">Você ainda não tem matrícula no ${m.nome}.</p></div>
  <div style="margin-top:30px;display:flex;flex-direction:column;gap:10px">
   <button class="btn" onclick="iniciarMat()">${ic('file')}Fazer matrícula no ${m.nome}</button>
   ${outros.map(o=>`<button class="btn ghost" onclick="trocarPara('${o.mod}','${o.id||''}')">${ic('swap')}Ir para ${o.label}</button>`).join('')}
   <button class="btn ghost" onclick="go({scr:'escolha'})">${ic('swap')}Trocar modalidade</button>
   <button class="link mt8" onclick="sair()">Sair da conta</button></div></div>`}
function vAguardando(){const m=MODS[S.mod];const outros=contextos();return `<div class="welcome fade"><div class="okbig" style="background:linear-gradient(135deg,#d99a00,#f5b400);box-shadow:0 0 50px rgba(245,180,0,.4)">${ic('file')}</div>
  <div class="h1">Matrícula enviada</div><p class="mut mt12">Aguardando aprovação do Prof. ${m.prof}. Assim que for aprovada, o app libera tudo para você.</p>
  <div style="margin-top:30px;display:flex;flex-direction:column;gap:10px"><button class="btn" onclick="act(entrarNoApp)">${ic('refresh')}Verificar de novo</button>
  <button class="btn ghost" onclick="iniciarMat()">${ic('plus')}Matricular outra pessoa</button>
  ${outros.map(o=>`<button class="btn ghost" onclick="trocarPara('${o.mod}','${o.id||''}')">${ic('swap')}Ir para ${o.label}</button>`).join('')}
  <button class="link mt8" onclick="sair()">Sair da conta</button></div></div>`}
async function sair(){closeSheet();try{await sb.auth.signOut()}catch(e){}S={...S,sess:null,ctx:null,role:null,aluno:null,tab:null,sub:null,D:{},scr:S.mod?'entrada':'escolha'};render()}
function trocarPara(mod,id){closeSheet();S.mod=mod;if(id)LS.set('aluno_'+mod,id);act(decide)}

/* ---------- matrícula ---------- */
function iniciarMat(){const nome=S.ctx&&S.ctx.perfil.nome;S.mat={step:1,d:{nome:''},titular:nome};S.scr='mat';render();
  act(async()=>{const r=await q(sb.rpc('contrato_publico',{p_mod:S.mod}));S.mat.contrato=(r&&r[0])||{texto:'',versao:1}})}
function vMat(){const m=S.mat,d=m.d,mod=MODS[S.mod];const menor=d.idade!=null&&d.idade<18;const total=menor?3:2;const pos=m.step===3?total:m.step===2?2:1;let body='';
  if(m.step===1)body=`<div class="h1">Matrícula — ${mod.nome}</div><p class="mut mt8">Dados de quem vai treinar. O professor aprova depois.</p>
   <div class="radio mt12"><button class="${d.outro?'':'on'}" onclick="S.mat.d.outro=false;S.mat.d.nome=S.mat.titular||'';render(true)">Para mim</button><button class="${d.outro?'on':''}" onclick="S.mat.d.outro=true;S.mat.d.nome='';render(true)">Para filho(a) / outra pessoa</button></div>
   <label class="lbl">Nome completo do aluno</label><input class="in" id="f_nome" value="${esc(d.outro?d.nome:(d.nome||m.titular||''))}">
   <label class="lbl">Data de nascimento</label><input class="in" id="f_nasc" type="date" value="${esc(d.nasc||'')}" max="${hoje()}">
   <label class="lbl">Telefone (WhatsApp)</label><input class="in" id="f_tel" inputmode="tel" value="${esc(d.tel||'')}" placeholder="(91) 90000-0000">
   <button class="btn mt16" onclick="matNext()">Continuar</button>`;
  if(m.step===2)body=`<div class="h1">Responsável</div><p class="mut mt8">${esc(first(d.nome))} tem ${d.idade} anos. O responsável aceita o contrato e, normalmente, fica com o acesso ao app.</p>
   <label class="lbl">Nome do responsável</label><input class="in" id="f_resp" value="${esc(d.resp||(d.outro?m.titular||'':''))}">
   <label class="lbl">Parentesco</label><select class="in" id="f_par">${['Mãe','Pai','Avó / Avô','Tio / Tia','Outro'].map(x=>`<option ${d.par===x?'selected':''}>${x}</option>`).join('')}</select>
   <label class="lbl">Telefone do responsável</label><input class="in" id="f_rtel" inputmode="tel" value="${esc(d.rtel||'')}" placeholder="(91) 90000-0000">
   <button class="btn mt16" onclick="matNext()">Continuar</button>`;
  if(m.step===3)body=`<div class="h1">Contrato</div><p class="mut mt8">Leia com atenção antes de aceitar.</p>
   <div class="contract mt12 ctr-txt">${m.contrato?esc(m.contrato.texto):'<div class="spin"></div>'}</div>
   <label class="chk"><input type="checkbox" id="f_ace"><span>Li e aceito o contrato${menor?` como responsável de ${esc(first(d.nome))}`:''}. Ficarão registrados nome, data e hora do aceite.</span></label>
   <button class="btn mt16" onclick="matEnviar()">Enviar matrícula</button>`;
  return `<div class="wrap fade" style="padding-top:calc(20px + env(safe-area-inset-top))"><button class="back" onclick="matBack()">${ic('back')}Voltar</button>
   <div class="steps">${Array.from({length:total},(_,i)=>`<i class="${i<pos?'on':''}"></i>`).join('')}</div>${body}</div>`}
function matNext(){const m=S.mat,d=m.d;
  if(m.step===1){d.nome=$('#f_nome').value.trim();d.nasc=$('#f_nasc').value;d.tel=$('#f_tel').value.trim();
    if(!d.nome||!d.nasc){toast('Preencha nome e data de nascimento',true);return}d.idade=idade(d.nasc);if(d.idade<0||d.idade>110){toast('Confira a data de nascimento',true);return}m.step=d.idade<18?2:3}
  else if(m.step===2){d.resp=$('#f_resp').value.trim();d.par=$('#f_par').value;d.rtel=$('#f_rtel').value.trim();if(!d.resp){toast('Informe o nome do responsável',true);return}m.step=3}
  render()}
function matBack(){const m=S.mat;if(m.step===1){go({scr:S.ctx&&S.ctx.alunos.some(a=>a.modalidade===S.mod&&a.status==='pendente')?'aguardando':'semvinculo'});return}m.step=m.step===3&&m.d.idade<18?2:1;render()}
function matEnviar(){if(!$('#f_ace').checked){toast('É preciso aceitar o contrato',true);return}const d=S.mat.d;
  act(async()=>{await q(sb.rpc('solicitar_matricula',{p_mod:S.mod,p_nome:d.nome,p_nascimento:d.nasc,p_telefone:d.tel||null,p_resp_nome:d.resp||null,p_resp_parentesco:d.par||null,p_resp_telefone:d.rtel||null}));
    await loadCtx();S.scr='aguardando';render();toast('Matrícula enviada!')})}

/* ---------- casca do app ---------- */
function vApp(){const isAl=S.role==='aluno';
  const tabs=isAl?[['inicio','Início','home'],['treinos','Treinos','calendar'],['ranking','Ranking','trophy'],['mensal','Mensalidade','card'],['perfil','Perfil','user']]
   :[['painel','Painel','grid'],['chamada','Chamada','check'],['publicar','Publicar','camera'],['comps','Competições','medal']].concat(S.role==='resp'?[['gestao','Gestão','users']]:[]);
  const fn=(isAl?{inicio:aInicio,treinos:aTreinos,ranking:vRanking,mensal:aMensal,perfil:aPerfil}:{painel:pPainel,chamada:pChamada,publicar:pPublicar,comps:pComps,gestao:pGestao})[S.tab]||(isAl?aInicio:pPainel);
  let body;try{body=fn()}catch(e){console.error(e);body=`<div class="empty">Erro ao montar a tela: ${esc(e.message)}</div>`}
  return topbar()+`<main class="wrap fade">${body}</main><nav class="nav">${tabs.map(t=>`<button class="${S.tab===t[0]?'on':''}" onclick="go({tab:'${t[0]}',sub:null})">${ic(t[2])}<span>${t[1]}</span></button>`).join('')}</nav>`}
function topbar(){const m=MODS[S.mod],isAl=S.role==='aluno';const ctx=contextos();const alMod=isAl?S.ctx.alunos.filter(a=>a.modalidade===S.mod&&a.status==='ativo'):[];
  const sw=ctx.length>1||alMod.length>1?`<button class="swap" onclick="trocaSheet()">${ic('swap')}Trocar</button>`:'';
  return `<header class="topbar"><img src="${m.logo}" class="tlogo" alt=""><div class="tt"><b>${m.nome}</b><small>${isAl?(alMod.length>1?esc(first(S.aluno.nome)):'Área do aluno'):S.role==='resp'?'Professor responsável':'Professor auxiliar'}</small></div>${sw}<button class="avatar" onclick="${isAl?"go({tab:'perfil',sub:null})":'contaSheet()'}">${initials(isAl?S.aluno.nome:S.pname)}</button></header>`}
function trocaSheet(){const c=S.ctx;const l=[];
  c.papeis.forEach(p=>l.push([p.modalidade,'',MODS[p.modalidade].nome,p.papel==='resp'?'Professor responsável':'Professor auxiliar']));
  c.alunos.filter(a=>a.status==='ativo'&&!c.papeis.some(p=>p.modalidade===a.modalidade)).forEach(a=>l.push([a.modalidade,a.id,MODS[a.modalidade].nome,'Aluno: '+a.nome]));
  openSheet(`<h3>Trocar perfil</h3><p class="mut">Escolha onde quer entrar.</p><div class="mt12">${l.map(x=>{const on=x[0]===S.mod&&(!x[1]||(S.aluno&&S.aluno.id===x[1]));
   return `<button class="li" style="${on?'border-color:var(--acc)':''}" onclick="trocarPara('${x[0]}','${x[1]}')"><img src="${MODS[x[0]].logo}" style="width:34px;height:34px;object-fit:contain" alt=""><div class="grow">${x[2]}<small>${esc(x[3])}</small></div>${on?'<span class="badge b-ok">Atual</span>':ic('chev')}</button>`}).join('')}</div>
   <button class="btn ghost mt12" onclick="closeSheet();go({scr:'escolha'})">${ic('plus')}Matrícula em outra modalidade</button>`)}
function contaSheet(){openSheet(`<h3>${esc(S.pname)}</h3><p class="mut">${S.role==='resp'?'Professor responsável':'Professor auxiliar'} • ${MODS[S.mod].nome}<br>${esc(S.sess.user.email)}</p>
  ${instalarCard()}<div class="mt16"><button class="btn danger" onclick="sair()">${ic('logout')}Sair da conta</button></div>`)}
let deferredPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e});
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
function instalarCard(){if(standalone())return '';const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="card mt12"><div class="row">${ic('download')}<b>Instalar no celular</b></div><p class="mut mt8" style="font-size:13px">${deferredPrompt?'Toque no botão para instalar o app.':ios?'No Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início".':'No menu do navegador (⋮), toque em "Instalar app" ou "Adicionar à tela inicial".'}</p>${deferredPrompt?`<button class="btn sm mt8" onclick="instalar()">Instalar app</button>`:''}</div>`}
async function instalar(){if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;closeSheet()}

/* ---------- ALUNO ---------- */
function rankRows(r){return (r||[]).map(x=>({a:{id:x.aluno_id,nome:x.nome},pts:x.pts,ouros:x.ouros,comps:x.comps,freq:x.freq}))}
function aInicio(){const D=S.D,a=S.aluno,mi=D.mi;const rc=ordComp(rankRows(D.rank)),rf=ordFreq(rankRows(D.rank));const pc=rc.findIndex(s=>s.a.id===a.id),pf=rf.findIndex(s=>s.a.id===a.id);
  const ac=ordComp(rankRows(D.rankAnt))[0],af=ordFreq(rankRows(D.rankAnt))[0];const temAnt=ac||af;
  const kc=temAnt?ac:rc[0],kf=temAnt?af:rf[0];const presMes=(D.pres||[]).filter(x=>x>=mi).length;
  const mrow=(D.mens||[]).find(x=>x.competencia===mi);const st=statusMens(mrow,D.cfg);
  return `<div class="hello"><small>Bem-vindo de volta</small><h1 class="h1">Olá, ${esc(first(a.nome))}</h1></div>
  ${!contratoOk(a,D.cfg)?`<button class="warnbox" onclick="go({tab:'perfil',sub:'contrato'})">${ic('alert')}<span><b>Contrato aguardando seu aceite.</b><br>Toque para ler e aceitar.</span></button>`:''}
  ${st!=='pago'&&online()?`<button class="warnbox" onclick="go({tab:'mensal'})">${ic('money')}<span><b>Mensalidade de ${nomeMes(mi).toLowerCase()} ${st==='atrasado'?'atrasada':'em aberto'}.</b><br>Toque para pagar por Pix ou cartão.</span></button>`:''}
  ${feedCard(D.feed)}
  <div class="sec-t">Avisos ${D.avisos.length?`<span class="cnt">${D.avisos.length}</span>`:''}</div>
  <div>${D.avisos.length?D.avisos.slice(0,5).map(v=>`<div class="aviso">${ic('bell')}<div><p>${esc(v.texto)}</p><small>${esc(v.autor_nome||'')} • ${quando(v.criado_em)}</small></div></div>`).join(''):'<div class="empty">Nenhum aviso no momento.</div>'}</div>
  <div class="sec-t">Reis do Tatame <small class="mut">${temAnt?nomeMes(D.ant):nomeMes(mi)+' • parcial'}</small></div>
  <div class="kings">${kc?kingCard('Competição',kc.a.nome,`${kc.pts} pts • ${kc.ouros} ouro${kc.ouros!==1?'s':''}`):kingVazio('Competição')}${kf?kingCard('Frequência',kf.a.nome,kf.freq+' treinos'):kingVazio('Frequência')}</div>
  <button class="race card" onclick="go({tab:'ranking'})"><div><span class="tag live"><i class="dot"></i>Disputa de ${nomeMes(mi).toLowerCase()}</span><p>${pf>=0?`Você está em <b>${pf+1}º</b> na Frequência`:'Treine para entrar no ranking de Frequência'}${pc>=0?` e em <b>${pc+1}º</b> na Competição`:''}.</p></div>${ic('chev')}</button>
  <div class="stats3"><div class="stat acc"><b>${presMes}</b><small>Treinos no mês</small></div><div class="stat"><b style="font-size:20px;padding-top:6px">${BELTS[S.mod][a.faixa][0]}</b><small>Faixa atual</small></div><div class="stat"><b style="font-size:20px;padding-top:6px;color:${st==='pago'?'var(--ok)':st==='pendente'?'var(--warn)':'var(--bad)'}">${st==='pago'?'Em dia':st==='pendente'?'Pendente':'Atrasada'}</b><small>Mensalidade</small></div></div>`}
function aTreinos(){const D=S.D,mi=D.mi;const pres=D.pres||[];const y=+mi.slice(0,4),m=+mi.slice(5,7);const dias=new Date(y,m,0).getDate();const off=new Date(y,m-1,1).getDay();const h=hoje();
  let cal=['D','S','T','Q','Q','S','S'].map(w=>`<div class="wd">${w}</div>`).join('')+'<div></div>'.repeat(off);
  for(let d=1;d<=dias;d++){const ds=`${mi.slice(0,8)}${pad(d)}`;cal+=`<div class="d tr ${pres.includes(ds)?'pr':''} ${ds===h?'today':''} ${ds>h?'fut':''}">${d}</div>`}
  const cnt=s=>pres.filter(x=>x>=s&&x<addMes(s,1)).length;const n=cnt(mi);
  return `<div class="hello"><small>${nomeMes(mi)} de ${y}</small><h1 class="h1">Minha frequência</h1></div>
  <div class="card"><div class="ch-count">${n}</div><small class="mut">treino${n!==1?'s':''} neste mês</small></div>
  <div class="card mt12"><div class="cal">${cal}</div><div class="legend"><span><i style="background:var(--acc)"></i>Presente</span><span><i style="outline:2px solid #fff;outline-offset:-2px"></i>Hoje</span></div></div>
  <div class="stats3"><div class="stat acc"><b>${n}</b><small>${nomeMes(mi)}</small></div><div class="stat"><b>${cnt(D.ant)}</b><small>${nomeMes(D.ant)}</small></div><div class="stat"><b>${cnt(addMes(mi,-2))}</b><small>${nomeMes(addMes(mi,-2))}</small></div></div>`}
function vRanking(){const D=S.D,k=S.rk;const list=k==='comp'?ordComp(rankRows(D.rank)):ordFreq(rankRows(D.rank));const meId=S.role==='aluno'?S.aluno.id:null;
  const val=s=>k==='comp'?`${s.pts} pts`:`${s.freq} treino${s.freq!==1?'s':''}`;
  const sub=s=>k==='comp'?`${s.ouros} ouro${s.ouros!==1?'s':''} • ${s.comps} comp.`:`${s.comps} comp.`;
  const same=(x,y)=>k==='comp'?x.pts===y.pts:x.freq===y.freq;const top=[list[1],list[0],list[2]];
  const pod=top.map((s,i)=>s?`<div class="pod p${[2,1,3][i]}"><div class="av">${i===1?crown():''}${initials(s.a.nome)}</div><div class="nm">${esc(s.a.nome.split(' ').slice(0,2).join(' '))}</div><div class="val">${val(s)}</div><div class="blk">${[2,1,3][i]}</div></div>`:'<div></div>').join('');
  const rows=list.map((s,i)=>{const prev=list[i-1];let note=`<small>${sub(s)}</small>`;if(prev&&same(prev,s)){const w=tieWhy(prev,s,k);note=`<small class="tie">${w?`Empate com ${esc(first(prev.a.nome))} — desempate: ${w}`:`Empatado com ${esc(first(prev.a.nome))} em todos os critérios`}</small>`}
    return `<div class="rk ${s.a.id===meId?'me':''}"><div class="pos">${i+1}</div><div class="av" style="width:34px;height:34px;font-size:11px">${initials(s.a.nome)}</div><div class="nm">${esc(s.a.nome)}${s.a.id===meId?' (você)':''}${note}</div><div class="vl">${val(s)}</div></div>`}).join('');
  const hist=[[D.ant,D.rankAnt]].map(([mes,r])=>{const c=ordComp(rankRows(r))[0],f=ordFreq(rankRows(r))[0];return c||f?`<div class="li"><div style="color:var(--gold)">${ic('crown')}</div><div class="grow">${nomeMes(mes)}<small>Competição: ${c?esc(c.a.nome):'—'} • Frequência: ${f?esc(f.a.nome):'—'}</small></div></div>`:''}).join('');
  return `<div class="hello"><small>Disputa de ${nomeMes(D.mi).toLowerCase()} • parcial</small><h1 class="h1">Rei do Tatame</h1></div>
  <div class="seg"><button class="${k==='comp'?'on':''}" onclick="go({rk:'comp'})">Competição</button><button class="${k==='freq'?'on':''}" onclick="go({rk:'freq'})">Frequência</button></div>
  ${list.length?`<div class="podium">${pod}</div><div>${rows}</div>`:`<div class="empty mt16">${k==='comp'?'Nenhum resultado de competição confirmado neste mês ainda.':'Nenhuma presença registrada neste mês ainda.'}</div>`}
  <div class="card mt16 rules"><b>Como funciona</b>${k==='comp'?`<div class="pts"><div><b>3</b>Ouro</div><div><b>2</b>Prata</div><div><b>1</b>Bronze</div><div><b>1</b>Particip.</div></div><ol class="mt8"><li>Mais pontos no mês</li><li>Desempate: mais ouros</li><li>Depois: mais competições</li><li>Por último: mais treinos</li></ol><p class="mut tiny mt8">Só contam resultados confirmados pelo professor.</p>`:`<ol class="mt8"><li>Mais presenças nos treinos do mês</li><li>Desempate: mais competições no mês</li></ol>`}</div>
  ${hist?`<div class="sec-t">Campeões anteriores</div>${hist}`:''}`}
function aMensal(){const D=S.D,a=S.aluno,cfg=D.cfg||{preco:0,dia_vencimento:10};const mi=D.mi;const row=(D.mens||[]).find(x=>x.competencia===mi);const st=statusMens(row,cfg);
  const label={pago:'Em dia',pendente:'Pendente',atrasado:'Atrasada'}[st];const hist=(D.mens||[]).filter(x=>x.competencia!==mi);
  return `<div class="hello"><small>${MODS[S.mod].nome}</small><h1 class="h1">Mensalidade</h1></div>
  <div class="paycard ${st}"><span class="st" style="color:${st==='pago'?'#4ee28a':st==='pendente'?'#ffcc3d':'#ff7a7a'}">${label}</span><div class="big">${money(row?row.valor:cfg.preco)}</div><small class="mut">${nomeMes(mi)}/${mi.slice(0,4)} • vencimento ${pad(cfg.dia_vencimento)}/${mi.slice(5,7)}</small>
  ${st==='pago'?`<p class="mt12" style="font-size:14px">Pago${row.metodo?' via <b>'+row.metodo+'</b>':''}${row.pago_em?' em '+br(row.pago_em.slice(0,10)):''}.</p>`:''}</div>
  ${st!=='pago'&&online()?`<button class="btn mt12" onclick="pagarOnline(${row?row.id:'null'})">${ic('money')}Pagar agora — Pix ou cartão</button><p class="mut tiny mt8" style="text-align:center">Pagamento seguro pela InfinitePay. Pix sem taxa; cartão em até 12x.</p>`:''}
  ${st!=='pago'&&!online()?`<div class="info">${ic('info')}<span>Pague diretamente ao professor responsável (Pix ou em espécie). Ele registra o pagamento aqui no app.</span></div>`:''}
  ${st!=='pago'&&online()?`<div class="info">${ic('info')}<span>Também é possível pagar em espécie ao professor responsável, que registra no app.</span></div>`:''}
  ${hist.length?`<div class="sec-t">Histórico</div>${hist.map(h=>`<div class="li"><div class="grow">${nomeMes(h.competencia)}/${h.competencia.slice(0,4)}<small>${h.status==='pago'?'Pago'+(h.metodo?' via '+h.metodo:'')+(h.pago_em?' em '+br(h.pago_em.slice(0,10)):''):money(h.valor)}</small></div>${h.status!=='pago'&&online()?`<button class="btn sm" onclick="pagarOnline(${h.id})">Pagar</button>`:payBadge(statusMens(h,cfg))}</div>`).join('')}`:''}`}
const online=()=>!!(S.D.cfg&&S.D.cfg.infinitepay_handle);
function pagarOnline(mid){act(async()=>{const r=await sb.functions.invoke('pagamento',{body:{aluno_id:S.aluno.id,mensalidade_id:mid||null}});
  if(r.error){let msg=r.error.message;try{const b=await r.error.context.json();msg=b.erro||msg}catch(e){}throw new Error(msg)}
  const d=r.data||{};if(!d.url)throw new Error(d.erro||'Não foi possível abrir o pagamento.');
  toast('Abrindo a InfinitePay...');setTimeout(()=>{location.href=d.url},300)})}
function aPerfil(){if(S.sub)return backBar('Perfil')+({grad:aGrad,comp:aComp,contrato:aContrato,redes:aRedes}[S.sub]||aGrad)();
  const a=S.aluno,D=S.D;const pend=(D.comps||[]).filter(c=>c.status==='pendente').length;const ok=contratoOk(a,D.cfg);const ctx=contextos();
  return `<div class="card prof-h"><div class="av">${initials(a.nome)}</div><h2>${esc(a.nome)}</h2><small class="mut">${MODS[S.mod].nome}${a.aluno_desde?' • aluno desde '+br(a.aluno_desde).slice(3):''}</small>${belt(S.mod,a.faixa,a.grau,230)}<b>${faixaNome(S.mod,a.faixa,a.grau)}</b>
  ${a.resp_nome?`<p class="mut tiny mt8">Responsável: ${esc(a.resp_nome)} • Acesso ao app: ${a.acesso==='responsavel'?'responsável':'próprio aluno'}</p>`:''}</div>
  <div class="menu mt12">
   <button class="li" onclick="go({sub:'grad'})">${ic('belt')}<div class="grow">Minha graduação<small>${faixaNome(S.mod,a.faixa,a.grau)}</small></div>${ic('chev')}</button>
   <button class="li" onclick="go({sub:'comp'})">${ic('medal')}<div class="grow">Minhas competições<small>Resultados e envio de novos</small></div>${pend?`<span class="badge b-warn">${pend} aguardando</span>`:''}${ic('chev')}</button>
   <button class="li" onclick="go({sub:'contrato'})">${ic('file')}<div class="grow">Contrato<small>${ok?'Aceito em '+dataHora(a.contrato_aceito_em):'Aguardando seu aceite'}</small></div>${ok?'':'<span class="badge b-warn">Pendente</span>'}${ic('chev')}</button>
   <button class="li" onclick="go({sub:'redes'})">${ic('link')}<div class="grow">Redes sociais<small>Academia e professores</small></div>${ic('chev')}</button>
   ${ctx.length>1||S.ctx.alunos.filter(x=>x.modalidade===S.mod&&x.status==='ativo').length>1?`<button class="li" onclick="trocaSheet()">${ic('swap')}<div class="grow">Trocar perfil<small>Outra modalidade ou outro aluno</small></div>${ic('chev')}</button>`:''}
   <button class="li" onclick="go({scr:'escolha'})">${ic('plus')}<div class="grow">Matrícula em outra modalidade</div>${ic('chev')}</button>
   <button class="li" onclick="sair()">${ic('logout')}<div class="grow">Sair<small>${esc(S.sess.user.email)}</small></div></button>
  </div>${instalarCard()}`}
function aGrad(){const a=S.aluno,g=S.D.grads||[];return `<div class="card prof-h"><small class="mut">Faixa atual</small>${belt(S.mod,a.faixa,a.grau,260)}<h2>${faixaNome(S.mod,a.faixa,a.grau)}</h2></div>
  <div class="sec-t">Histórico</div>${g.length?`<div class="card"><div class="tl">${[...g].reverse().map(h=>`<div><b>${faixaNome(S.mod,h.faixa,h.grau)}</b><br><small>${br(h.data)}</small></div>`).join('')}</div>`:'<div class="empty">Sem histórico ainda.</div>'}
  <div class="info">${ic('info')}<span>A graduação é atualizada somente pelo professor responsável.</span></div>`}
function compRow(c,nome){const [n,cls,t]=COL[c.colocacao];return `<div class="li"><div class="medal ${cls}">${t}</div><div class="grow">${nome?esc(nome):esc(c.evento)}<small>${nome?esc(c.evento)+' • ':''}${c.categoria?esc(c.categoria)+' • ':''}${brCurto(c.data)}</small></div>${c.status==='confirmado'?`<span class="badge b-ok">${n}</span>`:'<span class="badge b-warn">Aguardando</span>'}</div>`}
function aComp(){const l=S.D.comps||[];return `<div class="h1 mt8">Minhas competições</div><button class="btn mt12" onclick="compSheet(false)">${ic('plus')}Enviar resultado</button>
  <div class="mt12">${l.length?l.map(c=>compRow(c)).join(''):'<div class="empty">Nenhuma competição registrada.</div>'}</div>
  <div class="info">${ic('info')}<span>Resultados enviados por você ficam "Aguardando" até um professor confirmar. Só depois contam no ranking.</span></div>`}
function aContrato(){const a=S.aluno,cfg=S.D.cfg;const ok=contratoOk(a,cfg);return `<div class="h1 mt8">Contrato</div><div class="contract mt12 ctr-txt">${esc(cfg?cfg.contrato_texto:'')}</div>
  ${ok?`<div class="info" style="border-style:solid;border-color:rgba(46,204,113,.35)">${ic('check')}<span>Aceito por <b>${esc(a.contrato_aceito_por)}</b> em ${dataHora(a.contrato_aceito_em)}.</span></div>`
  :`${a.contrato_aceito_em?`<div class="info">${ic('info')}<span>O contrato foi atualizado. Leia e aceite a nova versão.</span></div>`:''}<label class="chk"><input type="checkbox" id="f_ace"><span>Li e aceito o contrato${a.acesso==='responsavel'&&a.resp_nome?' como responsável':''}.</span></label><button class="btn mt12" onclick="aceitar()">Aceitar contrato</button>`}`}
function aceitar(){if(!$('#f_ace').checked){toast('Marque "Li e aceito" para continuar',true);return}act(async()=>{await q(sb.rpc('aceitar_contrato',{p_aluno:S.aluno.id}));await loadData();render(true);toast('Contrato aceito')})}
function aRedes(){return `<div class="h1 mt8">Redes sociais</div><p class="mut mt8">Os links serão adicionados em breve.</p>
  <div class="mt12">${[['insta','Instagram da academia'],['insta','Instagram do Prof. '+MODS[S.mod].prof],['chat','WhatsApp da academia'],['play','YouTube']].map(r=>`<div class="li">${ic(r[0])}<div class="grow">${esc(r[1])}<small>Em breve</small></div></div>`).join('')}</div>`}
function compSheet(isProf){const al=isProf?(S.D.alunos||[]).filter(a=>a.status==='ativo'):[];if(isProf&&!al.length){toast('Nenhum aluno ativo ainda',true);return}
  openSheet(`<h3>${isProf?'Lançar resultado':'Enviar resultado'}</h3><p class="mut">${isProf?'Entra direto no ranking.':'O professor precisa confirmar.'}</p>
  ${isProf?`<label class="lbl">Aluno</label><select class="in" id="k_al">${al.map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join('')}</select>`:''}
  <label class="lbl">Competição</label><input class="in" id="k_ev" placeholder="Ex.: Copa Regional">
  <div class="gap8"><div style="flex:1"><label class="lbl">Data</label><input class="in" id="k_dt" type="date" value="${hoje()}" max="${hoje()}"></div><div style="flex:1"><label class="lbl">Colocação</label><select class="in" id="k_col"><option value="1">Ouro (1º)</option><option value="2">Prata (2º)</option><option value="3">Bronze (3º)</option><option value="0">Participação</option></select></div></div>
  <label class="lbl">Categoria (opcional)</label><input class="in" id="k_cat" placeholder="Ex.: Adulto -73kg">
  <button class="btn mt16" onclick="salvarComp(${isProf})">${isProf?'Lançar resultado':'Enviar para o professor'}</button>`)}
function salvarComp(isProf){const ev=$('#k_ev').value.trim(),dt=$('#k_dt').value;if(!ev||!dt){toast('Informe competição e data',true);return}
  const row={aluno_id:isProf?$('#k_al').value:S.aluno.id,modalidade:S.mod,evento:ev,data:dt,categoria:$('#k_cat').value.trim()||null,colocacao:+$('#k_col').value,status:isProf?'confirmado':'pendente'};
  if(isProf)row.confirmado_por=uid();
  act(async()=>{await q(sb.from('competicoes').insert(row));closeSheet();await loadData();render(true);toast(isProf?'Resultado lançado':'Enviado! Aguardando confirmação')})}

/* ---------- PROFESSOR ---------- */
const ativos=()=>(S.D.alunos||[]).filter(a=>a.status==='ativo');
const nomeAluno=id=>{const a=(S.D.alunos||[]).find(x=>x.id===id);return a?a.nome:'—'};
function pPainel(){if(S.sub==='ranking')return backBar('Painel')+vRanking();
  const D=S.D,resp=S.role==='resp',h=hoje();const at=ativos();const presHoje=(D.pres||[]).filter(p=>p.data===h).length;const pend=(D.comps||[]).filter(c=>c.status==='pendente').length;
  const mats=(D.alunos||[]).filter(a=>a.status==='pendente').length;const aberto=(D.mens||[]).filter(x=>x.status!=='pago').length;
  const rc=ordComp(rankRows(D.rank)),rf=ordFreq(rankRows(D.rank));
  return `<div class="hello"><small>${dataExt(h)}</small><h1 class="h1">Olá, ${resp?'Prof. ':''}${esc(first(S.pname))}</h1></div>
  <div class="grid2"><div class="stat acc"><b>${at.length}</b><small>Alunos ativos</small></div><div class="stat"><b>${presHoje}</b><small>Presentes hoje</small></div>
  <div class="stat"><b style="color:${pend?'var(--warn)':''}">${pend}</b><small>Resultados p/ confirmar</small></div>
  ${resp?`<div class="stat"><b style="color:${aberto?'var(--bad)':''}">${aberto}</b><small>Mensalidades em aberto</small></div>`:`<div class="stat"><b>${D.avisos.length}</b><small>Avisos ativos</small></div>`}</div>
  ${resp&&mats?`<button class="li mt12" onclick="go({tab:'gestao',sub:'mats'})">${ic('file')}<div class="grow">${mats} matrícula${mats>1?'s':''} aguardando aprovação<small>Toque para revisar</small></div><span class="cnt">${mats}</span></button>`:''}
  <div class="sec-t">Ações rápidas</div>
  <div class="grid2"><button class="tile" onclick="go({tab:'chamada'})">${ic('check')}<b>Fazer chamada</b><small>Treino de hoje</small></button><button class="tile" onclick="go({tab:'publicar'})">${ic('camera')}<b>Postar foto</b><small>Feed dos alunos</small></button>
  <button class="tile" onclick="go({tab:'publicar'})">${ic('bell')}<b>Novo aviso</b><small>Para todos</small></button><button class="tile" onclick="go({tab:'comps'})">${ic('medal')}<b>Competições</b><small>Lançar e confirmar</small></button></div>
  <div class="sec-t">Líderes de ${nomeMes(D.mi).toLowerCase()} <small class="mut">parcial</small></div>
  <div class="kings">${rc[0]?kingCard('Competição',rc[0].a.nome,`${rc[0].pts} pts • ${rc[0].ouros} ouro${rc[0].ouros!==1?'s':''}`):kingVazio('Competição')}${rf[0]?kingCard('Frequência',rf[0].a.nome,rf[0].freq+' treinos'):kingVazio('Frequência')}</div>
  <button class="btn ghost mt12" onclick="go({sub:'ranking'})">${ic('trophy')}Ver rankings completos</button>
  ${resp?'':`<div class="info">${ic('shield')}<span>Acesso de auxiliar: chamada, fotos, avisos e competições. Graduação, matrículas e valores ficam com o professor responsável.</span></div>`}
  ${instalarCard()}`}
function pChamada(){const D=S.D;const at=ativos();if(!S.chData)S.chData=hoje();const d=S.chData;
  if(!S.ch)S.ch=new Set((D.pres||[]).filter(p=>p.data===d).map(p=>p.aluno_id));
  const nMes=id=>(D.pres||[]).filter(p=>p.aluno_id===id).length;
  return `<div class="card"><div class="ch-head"><div><small class="mut">${dataExt(d)}</small><div class="h1" style="font-size:28px;margin-top:4px">Chamada</div></div><div style="text-align:right"><div class="ch-count" id="chc">${S.ch.size}</div><small class="mut">de ${at.length}</small></div></div>
  <label class="lbl">Data do treino</label><input class="in sm" type="date" value="${d}" min="${D.mi}" max="${hoje()}" onchange="S.chData=this.value;S.ch=null;render(true)">
  <div class="gap8 mt12"><button class="btn sm ghost" onclick="chTodos(true)">Marcar todos</button><button class="btn sm ghost" onclick="chTodos(false)">Limpar</button></div></div>
  <div class="mt12">${at.length?at.map(a=>`<button class="rowch ${S.ch.has(a.id)?'on':''}" id="ch-${a.id}" onclick="tg('${a.id}')"><div class="av">${initials(a.nome)}</div><div class="grow">${esc(a.nome)}<small>${bdot(S.mod,a.faixa)}${faixaNome(S.mod,a.faixa,a.grau)} • ${nMes(a.id)} no mês</small></div><div class="ck">${ic('check')}</div></button>`).join(''):'<div class="empty">Nenhum aluno ativo ainda.</div>'}</div>
  ${at.length?`<div class="sticky"><button class="btn" onclick="salvarChamada()">${ic('check')}Salvar chamada</button></div>`:''}`}
function tg(id){S.ch.has(id)?S.ch.delete(id):S.ch.add(id);document.getElementById('ch-'+id).classList.toggle('on');$('#chc').textContent=S.ch.size}
function chTodos(v){S.ch=new Set(v?ativos().map(a=>a.id):[]);render(true)}
function salvarChamada(){const d=S.chData,D=S.D;const antes=new Set((D.pres||[]).filter(p=>p.data===d).map(p=>p.aluno_id));
  const add=[...S.ch].filter(id=>!antes.has(id)),del=[...antes].filter(id=>!S.ch.has(id));
  act(async()=>{if(add.length)await q(sb.from('presencas').upsert(add.map(id=>({aluno_id:id,data:d,modalidade:S.mod})),{onConflict:'aluno_id,data',ignoreDuplicates:true}));
    if(del.length)await q(sb.from('presencas').delete().eq('data',d).in('aluno_id',del));
    const n=S.ch.size;S.ch=null;await loadData();render(true);toast(`Chamada salva: ${n} presente${n!==1?'s':''}`)})}
function pPublicar(){const D=S.D;const img=S.newImg;
  return `<div class="hello"><small>Feed dos alunos</small><h1 class="h1">Publicar</h1></div>
  <div class="sec-t" style="margin-top:6px">Foto do treino</div>
  ${img?`<div class="upl"><img src="${img}" alt="Prévia"></div>`:`<div style="opacity:.9">${feedCard(D.feed)}</div><p class="mut tiny mt8">Foto que os alunos estão vendo agora.</p>`}
  <label class="btn ghost mt12">${ic('camera')}${img?'Trocar foto':'Escolher foto'}<input type="file" accept="image/*" hidden onchange="lerFoto(this)"></label>
  <label class="lbl">Legenda</label><input class="in" id="leg" value="${esc(S.legDraft)}" placeholder="Ex.: Treino de quedas — ${dataExt(hoje()).split(',')[0].toLowerCase()}">
  <button class="btn mt12" onclick="publicarFoto()">Publicar no feed</button>
  <div class="info">${ic('info')}<span>A nova foto substitui a anterior na tela inicial dos alunos. Só alunos e professores da modalidade conseguem ver.</span></div>
  <div class="sec-t">Avisos</div>
  <textarea class="in" id="avtxt" placeholder="Ex.: Não haverá treino no feriado."></textarea>
  <button class="btn mt8" onclick="publicarAviso()">${ic('bell')}Publicar aviso</button>
  <div class="mt12">${D.avisos.map(v=>`<div class="aviso">${ic('bell')}<div><p>${esc(v.texto)}</p><small>${esc(v.autor_nome||'')} • ${quando(v.criado_em)}</small></div><button class="x" onclick="apagarAviso(${v.id})" aria-label="Apagar">${ic('x')}</button></div>`).join('')}</div>`}
function lerFoto(inp){const f=inp.files&&inp.files[0];if(!f)return;S.legDraft=$('#leg').value;const r=new FileReader();
  r.onload=e=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1600/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
    c.toBlob(b=>{S.newBlob=b;S.newImg=URL.createObjectURL(b);render(true)},'image/jpeg',.85)};im.onerror=()=>toast('Não consegui abrir essa imagem',true);im.src=e.target.result};r.readAsDataURL(f)}
function publicarFoto(){if(!S.newBlob){toast('Escolha uma foto primeiro',true);return}const leg=$('#leg').value.trim()||'Treino de hoje';
  act(async()=>{const path=`${S.mod}/${Date.now()}.jpg`;await q(sb.storage.from('feed').upload(path,S.newBlob,{contentType:'image/jpeg',upsert:false}));
    await q(sb.from('feed').insert({modalidade:S.mod,foto_path:path,legenda:leg,autor_nome:autor()}));S.newImg=null;S.newBlob=null;S.legDraft='';await loadData();render(true);toast('Foto publicada no feed')})}
function publicarAviso(){const t=$('#avtxt').value.trim();if(!t){toast('Escreva o aviso',true);return}act(async()=>{await q(sb.from('avisos').insert({modalidade:S.mod,texto:t,autor_nome:autor()}));await loadData();render(true);toast('Aviso publicado')})}
function apagarAviso(id){act(async()=>{await q(sb.from('avisos').delete().eq('id',id));await loadData();render(true);toast('Aviso removido')})}
function pComps(){const D=S.D;const pend=(D.comps||[]).filter(c=>c.status==='pendente'),ok=(D.comps||[]).filter(c=>c.status==='confirmado'&&c.data>=D.mi);
  return `<div class="hello"><small>Resultados</small><h1 class="h1">Competições</h1></div>
  <button class="btn" onclick="compSheet(true)">${ic('plus')}Lançar resultado</button>
  <div class="sec-t">Aguardando confirmação ${pend.length?`<span class="cnt">${pend.length}</span>`:''}</div>
  ${pend.length?pend.map(c=>{const [n,cls,t]=COL[c.colocacao];return `<div class="card" style="margin-bottom:8px"><div class="row"><div class="medal ${cls}">${t}</div><div style="flex:1"><b>${esc(nomeAluno(c.aluno_id))}</b><br><small class="mut">${esc(c.evento)}${c.categoria?' • '+esc(c.categoria):''} • ${brCurto(c.data)} • ${n}</small></div></div><p class="mut tiny mt8">Enviado pelo aluno</p><div class="gap8 mt8"><button class="btn sm ok" style="flex:1" onclick="confComp('${c.id}',true)">${ic('check')}Confirmar</button><button class="btn sm danger" style="flex:1" onclick="confComp('${c.id}',false)">Recusar</button></div></div>`}).join(''):'<div class="empty">Nada para confirmar.</div>'}
  <div class="sec-t">Resultados de ${nomeMes(D.mi).toLowerCase()}</div>${ok.map(c=>compRow(c,nomeAluno(c.aluno_id))).join('')||'<div class="empty">Nenhum resultado ainda.</div>'}`}
function confComp(id,v){act(async()=>{if(v)await q(sb.from('competicoes').update({status:'confirmado',confirmado_por:uid()}).eq('id',id));else await q(sb.from('competicoes').delete().eq('id',id));
  await loadData();render(true);toast(v?'Confirmado — já conta no ranking':'Resultado recusado')})}

/* ---------- GESTÃO (responsável) ---------- */
function pGestao(){if(S.role!=='resp')return '';if(S.sub)return backBar('Gestão')+({mats:gMats,alunos:gAlunos,fin:gFin,equipe:gEquipe,contratos:gContratos}[S.sub]||gMats)();
  const D=S.D;const at=ativos();const mens=D.mens||[];const rec=mens.filter(x=>x.status==='pago').reduce((t,x)=>t+Number(x.valor),0);const ab=mens.filter(x=>x.status!=='pago').reduce((t,x)=>t+Number(x.valor),0);
  const ac=at.filter(a=>contratoOk(a,D.cfg)).length;const mats=(D.alunos||[]).filter(a=>a.status==='pendente').length;const aux=(D.equipe||[]).filter(x=>x.papel==='aux').length;
  return `<div class="hello"><small>Somente professor responsável</small><h1 class="h1">Gestão</h1></div>
  <div class="card"><small class="mut">${nomeMes(D.mi)}/${D.mi.slice(0,4)}</small><div class="row mt8" style="justify-content:space-between"><div><b style="font-size:22px;color:var(--ok)">${money(rec)}</b><br><small class="mut">recebido</small></div><div style="text-align:right"><b style="font-size:22px;color:var(--warn)">${money(ab)}</b><br><small class="mut">em aberto</small></div></div><div class="bar mt12"><i style="width:${Math.round(rec/((rec+ab)||1)*100)}%;background:linear-gradient(90deg,#1fa85a,#2ecc71)"></i></div></div>
  <div class="grid2 mt12">
   <button class="tile" onclick="go({sub:'mats'})">${mats?`<span class="cnt">${mats}</span>`:''}${ic('file')}<b>Matrículas</b><small>${mats} aguardando</small></button>
   <button class="tile" onclick="go({sub:'alunos'})">${ic('users')}<b>Alunos</b><small>${at.length} ativos</small></button>
   <button class="tile" onclick="go({sub:'fin'})">${ic('money')}<b>Financeiro</b><small>Mensalidades</small></button>
   <button class="tile" onclick="go({sub:'contratos'})">${ic('shield')}<b>Contratos</b><small>${ac} de ${at.length} aceitos</small></button>
   <button class="tile" onclick="go({sub:'equipe'})">${ic('user')}<b>Equipe</b><small>${aux} auxiliar${aux!==1?'es':''}</small></button>
   <button class="tile" onclick="go({tab:'painel',sub:'ranking'})">${ic('trophy')}<b>Rankings</b><small>Rei do Tatame</small></button>
  </div>`}
function gMats(){const l=(S.D.alunos||[]).filter(a=>a.status==='pendente');return `<div class="h1 mt8">Matrículas</div>
  <button class="btn ghost mt12" onclick="novoAlunoSheet()">${ic('plus')}Cadastrar aluno direto</button>
  <div class="sec-t">Aguardando aprovação</div>
  ${l.length?l.map(m=>{const id=idade(m.nascimento);return `<div class="card" style="margin-bottom:8px"><div class="row"><div class="av">${initials(m.nome)}</div><div style="flex:1"><b>${esc(m.nome)}</b><br><small class="mut">${id!=null?id+' anos • ':''}enviada em ${br(m.criado_em.slice(0,10))}</small></div></div>
   ${m.resp_nome?`<p class="mt8" style="font-size:13px">Responsável: <b>${esc(m.resp_nome)}</b>${m.resp_parentesco?' ('+esc(m.resp_parentesco)+')':''}${m.resp_telefone?' • '+esc(m.resp_telefone):''}</p>`:''}
   <p class="mut tiny mt8">${m.telefone?esc(m.telefone)+' • ':''}${esc(m.email_acesso||'')}${m.contrato_aceito_em?' • contrato aceito em '+dataHora(m.contrato_aceito_em):''}</p>
   <div class="gap8 mt12"><button class="btn sm ok" style="flex:1" onclick="aprovar('${m.id}',true)">${ic('check')}Aprovar</button><button class="btn sm danger" style="flex:1" onclick="aprovar('${m.id}',false)">Recusar</button></div></div>`}).join(''):'<div class="empty">Nenhuma matrícula pendente.</div>'}`}
function aprovar(id,v){act(async()=>{await q(sb.from('alunos').update({status:v?'ativo':'recusado'}).eq('id',id));await loadData();render(true);toast(v?'Matrícula aprovada!':'Matrícula recusada')})}
function novoAlunoSheet(){openSheet(`<h3>Cadastrar aluno</h3><p class="mut">O aluno entra no app criando uma conta com o e-mail de acesso informado.</p>
  <label class="lbl">Nome completo</label><input class="in" id="n_nome"><label class="lbl">Data de nascimento</label><input class="in" id="n_nasc" type="date" max="${hoje()}">
  <label class="lbl">Telefone</label><input class="in" id="n_tel" inputmode="tel">
  <label class="lbl">Responsável (se menor de idade)</label><input class="in" id="n_resp">
  <label class="lbl">E-mail de quem vai usar o app (opcional)</label><input class="in" id="n_email" type="email" inputmode="email">
  <label class="lbl">Faixa</label><select class="in" id="n_faixa">${BELTS[S.mod].map((b,i)=>`<option value="${i}">${b[0]}</option>`).join('')}</select>
  <button class="btn mt16" onclick="salvarNovo()">Cadastrar</button>`)}
function salvarNovo(){const nome=$('#n_nome').value.trim(),nasc=$('#n_nasc').value;if(!nome||!nasc){toast('Preencha nome e nascimento',true);return}const menor=idade(nasc)<18;const resp=$('#n_resp').value.trim();
  if(menor&&!resp){toast('Informe o responsável',true);return}
  act(async()=>{await q(sb.from('alunos').insert({modalidade:S.mod,nome,nascimento:nasc,telefone:$('#n_tel').value.trim()||null,resp_nome:resp||null,acesso:menor?'responsavel':'aluno',email_acesso:$('#n_email').value.trim()||null,faixa:+$('#n_faixa').value,status:'ativo'}));
    closeSheet();await loadData();render(true);toast('Aluno cadastrado')})}
function gAlunos(){const l=(S.D.alunos||[]).filter(a=>a.status==='ativo'||a.status==='inativo');const mrow=id=>(S.D.mens||[]).find(x=>x.aluno_id===id);
  return `<div class="h1 mt8">Alunos</div><div class="search mt12">${ic('search')}<input class="in" placeholder="Buscar aluno" oninput="filtra(this.value)"></div>
  <div class="mt12">${l.length?l.map(a=>`<button class="li fa" style="${a.status==='inativo'?'opacity:.5':''}" data-n="${esc(a.nome.toLowerCase())}" onclick="alunoSheet('${a.id}')"><div class="av">${initials(a.nome)}</div><div class="grow">${esc(a.nome)}<small>${bdot(S.mod,a.faixa)}${faixaNome(S.mod,a.faixa,a.grau)}${a.resp_nome?' • menor':''}${a.status==='inativo'?' • inativo':''}${!a.user_id?' • sem login':''}</small></div>${a.status==='ativo'?payBadge(statusMens(mrow(a.id),S.D.cfg)):''}</button>`).join(''):'<div class="empty">Nenhum aluno ainda.</div>'}</div>`}
function filtra(v){v=v.toLowerCase();document.querySelectorAll('.fa').forEach(e=>e.style.display=e.dataset.n.includes(v)?'':'none')}
function alunoSheet(id){const a=(S.D.alunos||[]).find(x=>x.id===id),jj=S.mod==='jj',D=S.D;const m=(D.mens||[]).find(x=>x.aluno_id===id);const st=statusMens(m,D.cfg);const nPres=(D.pres||[]).filter(p=>p.aluno_id===id).length;const id2=idade(a.nascimento);
  openSheet(`<div class="row"><div class="av" style="width:54px;height:54px;font-size:17px;border:2px solid var(--acc)">${initials(a.nome)}</div><div><h3>${esc(a.nome)}</h3><small class="mut">${id2!=null?id2+' anos':''}${a.resp_nome?' • responsável: '+esc(a.resp_nome):''}${a.telefone?' • '+esc(a.telefone):''}</small></div></div>
  <hr class="sep"><b>Graduação</b>${belt(S.mod,a.faixa,a.grau,240)}
  <div class="gap8"><div style="flex:2"><label class="lbl">Faixa</label><select class="in" id="g_f">${BELTS[S.mod].map((b,i)=>`<option value="${i}" ${i===a.faixa?'selected':''}>${b[0]}</option>`).join('')}</select></div>
  ${jj?`<div style="flex:1"><label class="lbl">Grau</label><select class="in" id="g_g">${[0,1,2,3,4].map(g=>`<option ${g===a.grau?'selected':''}>${g}</option>`).join('')}</select></div>`:''}</div>
  <button class="btn sm mt8" style="width:100%" onclick="salvarGrad('${a.id}')">Salvar graduação</button>
  <hr class="sep"><b>Acesso ao app</b>
  ${a.resp_nome?`<div class="radio"><button class="${a.acesso==='responsavel'?'on':''}" onclick="setCampo('${a.id}',{acesso:'responsavel'})">Responsável<br><small>${esc(first(a.resp_nome))}</small></button><button class="${a.acesso==='aluno'?'on':''}" onclick="setCampo('${a.id}',{acesso:'aluno'})">Próprio aluno<br><small>${esc(first(a.nome))}</small></button></div>`:''}
  <label class="lbl">E-mail de quem usa o app ${a.user_id?'<span class="badge b-ok">conta ligada</span>':'<span class="badge b-mut">sem conta</span>'}</label>
  <div class="gap8"><input class="in sm" id="g_em" type="email" value="${esc(a.email_acesso||'')}"><button class="btn sm" onclick="setCampo('${a.id}',{email_acesso:$('#g_em').value.trim()||null})">Salvar</button></div>
  ${a.status==='ativo'?`<hr class="sep"><div class="row" style="justify-content:space-between"><b>Mensalidade de ${nomeMes(D.mi).toLowerCase()}</b>${payBadge(st)}</div>
  <p class="mut mt8" style="font-size:13px">${money(m?m.valor:(D.cfg||{}).preco)}${m&&m.status==='pago'?' • pago'+(m.metodo?' via '+m.metodo:''):''}</p>
  ${m&&m.status!=='pago'?`<button class="btn sm ok mt8" style="width:100%" onclick="pagSheet(${m.id})">${ic('money')}Registrar pagamento</button>`:''}`:''}
  <hr class="sep"><div class="row" style="justify-content:space-between"><b>Frequência</b><span>${nPres} treino${nPres!==1?'s':''} em ${nomeMes(D.mi).toLowerCase()}</span></div>
  <div class="row mt12" style="justify-content:space-between"><b>Contrato</b>${contratoOk(a,D.cfg)?'<span class="badge b-ok">Aceito</span>':'<span class="badge b-warn">Pendente</span>'}</div>
  ${a.status==='ativo'?`<button class="btn danger mt16" onclick="setCampo('${a.id}',{status:'inativo'},true)">Inativar aluno</button>`:`<button class="btn ok mt16" onclick="setCampo('${a.id}',{status:'ativo'},true)">Reativar aluno</button>`}`)}
function salvarGrad(id){const a=S.D.alunos.find(x=>x.id===id);const f=+$('#g_f').value,g=$('#g_g')?+$('#g_g').value:0;if(f===a.faixa&&g===a.grau){toast('Nenhuma alteração',true);return}
  act(async()=>{await q(sb.from('alunos').update({faixa:f,grau:g}).eq('id',id));await loadData();alunoSheet(id);render(true);toast('Graduação atualizada: '+faixaNome(S.mod,f,g))})}
function setCampo(id,obj,fechar){act(async()=>{await q(sb.from('alunos').update(obj).eq('id',id));await loadData();if(fechar)closeSheet();else alunoSheet(id);render(true);toast('Salvo')})}
function pagSheet(mid){const m=S.D.mens.find(x=>x.id===mid);openSheet(`<h3>Registrar pagamento</h3><p class="mut">${esc(nomeAluno(m.aluno_id))} • ${nomeMes(m.competencia)} • ${money(m.valor)}</p>
  <label class="lbl">Forma de pagamento</label><div class="radio" id="pg_m">${['Espécie','Pix','Cartão'].map((x,i)=>`<button class="${i===0?'on':''}" onclick="document.querySelectorAll('#pg_m button').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${x}</button>`).join('')}</div>
  <button class="btn ok mt16" onclick="registrarPag(${mid})">${ic('check')}Confirmar pagamento</button>`)}
function registrarPag(mid){const met=$('#pg_m .on').textContent;act(async()=>{await q(sb.from('mensalidades').update({status:'pago',metodo:met,pago_em:new Date().toISOString(),registrado_por:uid()}).eq('id',mid));closeSheet();await loadData();render(true);toast('Pagamento registrado ('+met+')')})}
function desfazerPag(mid){act(async()=>{await q(sb.from('mensalidades').update({status:'pendente',metodo:null,pago_em:null}).eq('id',mid));await loadData();render(true);toast('Pagamento desfeito')})}
function gFin(){const D=S.D,cfg=D.cfg||{preco:0,dia_vencimento:10};const mens=D.mens||[];const g=k=>mens.filter(x=>statusMens(x,cfg)===k);const ord={atrasado:0,pendente:1,pago:2};const met=k=>mens.filter(x=>x.status==='pago'&&x.metodo===k).length;
  return `<div class="h1 mt8">Financeiro</div><p class="mut mt8">${nomeMes(D.mi)}/${D.mi.slice(0,4)}</p>
  <div class="sum3 mt12"><div class="stat"><b style="color:var(--ok)">${g('pago').length}</b><small>Em dia</small></div><div class="stat"><b style="color:var(--warn)">${g('pendente').length}</b><small>Pendentes</small></div><div class="stat"><b style="color:var(--bad)">${g('atrasado').length}</b><small>Atrasados</small></div></div>
  <div class="card mt12"><small class="mut">Recebido por forma de pagamento</small><div class="sum3 mt8"><div><b>${met('Cartão')}</b> <small class="mut">Cartão</small></div><div><b>${met('Pix')}</b> <small class="mut">Pix</small></div><div><b>${met('Espécie')}</b> <small class="mut">Espécie</small></div></div></div>
  <div class="sec-t">Alunos</div>
  ${mens.length?[...mens].sort((x,y)=>ord[statusMens(x,cfg)]-ord[statusMens(y,cfg)]||nomeAluno(x.aluno_id).localeCompare(nomeAluno(y.aluno_id))).map(m=>{const s=statusMens(m,cfg);return `<div class="li"><div class="av" style="width:34px;height:34px;font-size:11px">${initials(nomeAluno(m.aluno_id))}</div><div class="grow">${esc(nomeAluno(m.aluno_id))}<small>${m.status==='pago'?'Pago via '+(m.metodo||'—')+(m.pago_em?' em '+brCurto(m.pago_em.slice(0,10)):''):money(m.valor)+' • vence '+pad(cfg.dia_vencimento)+'/'+D.mi.slice(5,7)}</small></div>${m.status==='pago'?`<button class="badge b-ok" style="border:0" onclick="if(confirmar(this))desfazerPag(${m.id})">Pago</button>`:`<button class="btn sm ok" onclick="pagSheet(${m.id})">Registrar</button>`}</div>`}).join(''):'<div class="empty">Nenhuma mensalidade neste mês (sem alunos ativos).</div>'}
  <div class="sec-t">Configuração</div>
  <div class="card"><div class="gap8"><div style="flex:1"><label class="lbl" style="margin-top:0">Valor (R$)</label><input class="in sm" id="cf_p" type="number" step="0.01" inputmode="decimal" value="${cfg.preco}"></div><div style="flex:1"><label class="lbl" style="margin-top:0">Vencimento (dia)</label><input class="in sm" id="cf_d" type="number" min="1" max="28" value="${cfg.dia_vencimento}"></div></div>
  <label class="lbl">Sua InfiniteTag (pagamento pelo app)</label><div class="search"><span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--mut);font-weight:700">$</span><input class="in sm" id="cf_tag" style="padding-left:28px" autocapitalize="none" autocorrect="off" placeholder="suatag" value="${esc((cfg.infinitepay_handle||'').replace(/^\$/,''))}"></div>
  <p class="mut tiny mt8">${cfg.infinitepay_handle?'<b style="color:var(--ok)">Pagamento pelo app ativo.</b> Os alunos pagam por Pix ou cartão e o app marca como pago sozinho.':'Preencha para os alunos pagarem por Pix ou cartão direto no app. Deixe vazio para desativar.'}</p>
  <button class="btn sm mt12" style="width:100%" onclick="salvarCfg()">Salvar</button><p class="mut tiny mt8">O novo valor vale para as próximas mensalidades geradas.</p></div>`}
function confirmar(b){if(b.dataset.c){return true}b.dataset.c=1;b.textContent='Desfazer?';b.className='badge b-warn';setTimeout(()=>{if(b.isConnected){delete b.dataset.c;b.textContent='Pago';b.className='badge b-ok'}},3000);return false}
function salvarCfg(){const p=parseFloat($('#cf_p').value),d=parseInt($('#cf_d').value);if(!(p>=0)||!(d>=1&&d<=28)){toast('Confira valor e dia (1 a 28)',true);return}
  const tag=($('#cf_tag').value||'').trim().replace(/^[$@]/,'').toLowerCase();if(tag&&!/^[a-z0-9_.-]{2,40}$/.test(tag)){toast('InfiniteTag inválida. Use só letras, números, _ ou .',true);return}
  act(async()=>{await q(sb.from('config').update({preco:p,dia_vencimento:d,infinitepay_handle:tag||null}).eq('modalidade',S.mod));await loadData();render(true);toast('Configuração salva')})}
function gEquipe(){const D=S.D;const eq=D.equipe||[];const aux=eq.filter(e=>e.papel==='aux');const conv=(D.convites||[]).filter(c=>c.papel==='aux');
  return `<div class="h1 mt8">Equipe</div>
  ${eq.filter(e=>e.papel==='resp').map(e=>`<div class="li mt12"><div class="av" style="border:2px solid var(--acc)">${initials(e.nome)}</div><div class="grow">Prof. ${esc(e.nome||'')}<small>Responsável • acesso completo</small></div></div>`).join('')}
  <div class="sec-t">Auxiliares</div>
  ${aux.map(x=>`<div class="li"><div class="av">${initials(x.nome)}</div><div class="grow">${esc(x.nome||'Auxiliar')}<small>Com acesso ao app</small></div><button class="btn sm danger" onclick="remAux('${x.user_id}')">Remover</button></div>`).join('')}
  ${conv.map(c=>`<div class="li"><div class="av">${initials(c.nome||c.email)}</div><div class="grow">${esc(c.nome||c.email)}<small>${esc(c.email)} • aguardando criar a conta</small></div><button class="btn sm danger" onclick="remConvite('${esc(c.email)}')">Remover</button></div>`).join('')}
  ${!aux.length&&!conv.length?'<div class="empty">Nenhum auxiliar ainda.</div>':''}
  <div class="card mt12"><b>Adicionar auxiliar</b><label class="lbl">Nome</label><input class="in sm" id="aux_n"><label class="lbl">E-mail (o mesmo que ele vai usar para criar a conta)</label><input class="in sm" id="aux_e" type="email" inputmode="email">
  <button class="btn sm mt12" style="width:100%" onclick="addAux()">${ic('plus')}Adicionar</button></div>
  <div class="card mt12"><b>O que o auxiliar pode fazer</b><div class="mt8" style="font-size:13.5px;line-height:1.7">${ic('check')} Marcar frequência<br>${ic('check')} Postar fotos e avisos<br>${ic('check')} Lançar e confirmar competições<br><span class="mut">${ic('x')} Graduação, matrículas, contratos e valores</span></div></div>`}
function addAux(){const n=$('#aux_n').value.trim(),e=$('#aux_e').value.trim().toLowerCase();if(!n||!e){toast('Preencha nome e e-mail',true);return}
  act(async()=>{await q(sb.from('convites_staff').insert({email:e,modalidade:S.mod,papel:'aux',nome:n}));await loadData();render(true);toast(first(n)+' adicionado à equipe')})}
function remAux(userId){act(async()=>{await q(sb.from('papeis').delete().eq('user_id',userId).eq('modalidade',S.mod).eq('papel','aux'));await loadData();render(true);toast('Auxiliar removido')})}
function remConvite(email){act(async()=>{await q(sb.from('convites_staff').delete().eq('email',email).eq('modalidade',S.mod));await loadData();render(true);toast('Removido')})}
function gContratos(){const D=S.D,cfg=D.cfg||{contrato_texto:'',contrato_versao:1};const at=ativos();const ok=at.filter(a=>contratoOk(a,cfg));const pct=at.length?Math.round(ok.length/at.length*100):0;
  return `<div class="h1 mt8">Contratos</div><div class="card mt12"><div class="row" style="justify-content:space-between"><b>${ok.length} de ${at.length} aceitos</b><span>${pct}%</span></div><div class="bar mt8"><i style="width:${pct}%"></i></div><p class="mut tiny mt8">Versão atual do contrato: ${cfg.contrato_versao}</p></div>
  <div class="sec-t">Falta aceitar</div>${at.filter(a=>!contratoOk(a,cfg)).map(a=>`<div class="li"><div class="av" style="width:34px;height:34px;font-size:11px">${initials(a.nome)}</div><div class="grow">${esc(a.nome)}<small>${a.resp_nome?'Aceite pelo responsável: '+esc(a.resp_nome):'Aceite pelo próprio aluno'}${!a.user_id?' • ainda sem login':''}</small></div><span class="badge b-warn">Pendente</span></div>`).join('')||'<div class="empty">Todos aceitaram.</div>'}
  <div class="sec-t">Aceitos</div>${ok.map(a=>`<div class="li"><div class="grow">${esc(a.nome)}<small>Aceito por ${esc(a.contrato_aceito_por||'')} em ${dataHora(a.contrato_aceito_em)}</small></div><span class="badge b-ok">Aceito</span></div>`).join('')||'<div class="empty">Ninguém ainda.</div>'}
  <div class="sec-t">Texto do contrato</div><textarea class="in" id="ct_txt" style="min-height:260px">${esc(cfg.contrato_texto)}</textarea>
  <button class="btn mt8" onclick="salvarContrato()">Salvar texto</button><p class="mut tiny mt8">Ao mudar o texto, todos os alunos precisam aceitar a nova versão.</p>`}
function salvarContrato(){const t=$('#ct_txt').value.trim();if(!t){toast('O contrato não pode ficar vazio',true);return}if(t===(S.D.cfg||{}).contrato_texto){toast('Nenhuma alteração',true);return}
  act(async()=>{await q(sb.from('config').update({contrato_texto:t}).eq('modalidade',S.mod));await loadData();render(true);toast('Contrato atualizado. Alunos verão a nova versão.')})}

/* ---------- PWA ---------- */
if('serviceWorker' in navigator&&location.protocol==='https:'){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})})}

boot();
