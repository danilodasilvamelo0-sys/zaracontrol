/* ============================================================
   DIARIO.JS — extraído de Diario.html
   ============================================================ */

// ── CONFIG ──
const SB_URL = 'https://ltwamldgdwqzyssoukzl.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0d2FtbGRnZHdxenlzc291a3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzEzMDUsImV4cCI6MjA4MjQ0NzMwNX0.UVyo0c0BHslB7mCU74Qx8rdo42HA0WPAyDQ6J-FIakE';
const UID = 'default';
// Hash SHA-256 — não é a senha, é uma impressão digital de mão única
const PH = 'c26302fce3d3af8faf9056b40a6f4a8c6db1832e7eba08ed1fabfac617d23f08';
// Hash da senha do Livro Negro (padrão: noir123)
// Para trocar: calcule SHA-256 da nova senha em https://emn178.github.io/online-tools/sha256.html
const PH_NOIR = '72ccb5d953d3a82da50f6da6fcd2a1e054e1ccb4ecfeb9a851a23a69611b2f4a';

let sb = null;
let dados = { diario: [], noir: [] };
let atual = { diario: null, noir: null };
let tags = { diario: [], noir: [] };
let aTimer = null;
let modoAtual = 'diario';

// ── SENHA ──
async function hashStr(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function verificarSenha() {
  const inp = document.getElementById('lockInp');
  const err = document.getElementById('lockErr');
  const val = inp.value;
  if (!val) { err.textContent = 'Digite a senha.'; return; }
  err.textContent = '...';
  const h = await hashStr(val);
  if (h === PH) {
    sessionStorage.setItem('zara_auth', '1');
    document.getElementById('lockScreen').classList.add('gone');
    document.getElementById('appLayout').style.display = 'flex';
    await init();
  } else {
    err.textContent = 'Senha incorreta.';
    inp.value = '';
    inp.focus();
    setTimeout(() => { err.textContent = '\u00a0'; }, 2500);
  }
}

// ── SUPABASE ──
async function initSB() {
  try {
    sb = supabase.createClient(SB_URL, SB_KEY);
    // Test connection
    await sb.from('diario').select('id').limit(1);
    console.log('Supabase conectado');
  } catch(e) {
    console.warn('Supabase indisponivel:', e.message);
    sb = null;
  }

  // Load data
  await carregar('diario');
  await carregar('noir');

  // Migrate localStorage to Supabase if needed
  if (sb) {
    await migrarLocalParaSupabase('diario');
    await migrarLocalParaSupabase('noir');
  }
}

async function carregar(modo) {
  if (sb) {
    try {
      const tabela = modo === 'noir' ? 'diario_noir' : 'diario';
      const { data, error } = await sb.from(tabela)
        .select('*')
        .eq('user_id', UID)
        .order('data', { ascending: false });
      if (error) throw error;
      dados[modo] = data || [];
      // Keep localStorage in sync
      salvarLocal(modo);
    } catch(e) {
      console.warn('Carregar Supabase falhou:', e.message);
      dados[modo] = carregarLocalModo(modo);
    }
  } else {
    dados[modo] = carregarLocalModo(modo);
  }
  renderLista(modo);
  if (modo === 'diario') renderTimeline();
}

async function migrarLocalParaSupabase(modo) {
  const chave = 'zara_' + modo + '_migrado';
  if (localStorage.getItem(chave)) return; // já migrado

  const local = carregarLocalModo(modo);
  if (!local || local.length === 0) {
    localStorage.setItem(chave, '1');
    return;
  }

  try {
    const tabela = modo === 'noir' ? 'diario_noir' : 'diario';
    // Check if Supabase already has data
    const { data } = await sb.from(tabela).select('id').eq('user_id', UID);
    if (data && data.length > 0) {
      // Already has data in Supabase, don't overwrite
      localStorage.setItem(chave, '1');
      return;
    }
    // Migrate all local entries to Supabase
    const rows = local.map(e => ({
      id: e.id,
      user_id: UID,
      data: e.data,
      titulo: e.titulo || '',
      estado: e.estado || e.tema || '',
      texto: e.texto || '',
      tags: e.tags || [],
      humor: e.humor || 5,
      atualizado_em: e.atualizado_em || new Date().toISOString()
    }));
    const { error } = await sb.from(tabela).upsert(rows, { onConflict: 'id' });
    if (!error) {
      localStorage.setItem(chave, '1');
      await carregar(modo); // Reload from Supabase
      console.log(`Migrado ${rows.length} entradas do localStorage para Supabase (${modo})`);
    }
  } catch(e) {
    console.warn('Migracao falhou:', e.message);
  }
}

function carregarLocalModo(modo) {
  try { return JSON.parse(localStorage.getItem('zara_' + modo) || '[]'); } catch(e) { return []; }
}

function salvarLocal(modo) {
  localStorage.setItem('zara_' + modo, JSON.stringify(dados[modo]));
}

async function salvarSB(modo, entrada) {
  // Always save localStorage as backup
  salvarLocal(modo);

  if (!sb) return;
  try {
    const tabela = modo === 'noir' ? 'diario_noir' : 'diario';
    const { error } = await sb.from(tabela).upsert({
      id: entrada.id,
      user_id: UID,
      data: entrada.data,
      titulo: entrada.titulo || '',
      estado: entrada.estado || entrada.tema || '',
      texto: entrada.texto || '',
      tags: entrada.tags || [],
      humor: entrada.humor || 5,
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) throw error;
  } catch(e) {
    console.warn('Supabase save falhou, localStorage ok:', e.message);
  }
}

async function deletarSB(modo, id) {
  salvarLocal(modo);
  if (!sb) return;
  try {
    const tabela = modo === 'noir' ? 'diario_noir' : 'diario';
    await sb.from(tabela).delete().eq('id', id).eq('user_id', UID);
  } catch(e) {
    console.warn('Supabase delete falhou:', e.message);
  }
}

// ── TABS ──
function switchTab(tab) {
  modoAtual = tab;
  ['diario','noir'].forEach(m => {
    document.getElementById('tab-' + m).classList.toggle('on', m === tab);
    document.getElementById('panel-list-' + m).classList.toggle('on', m === tab);
    document.getElementById('panel-editor-' + m).classList.toggle('on', m === tab);
  });
  // Se tentou abrir o Livro Negro sem estar autenticado, mostrar/esconder overlay
  if (tab === 'noir' && !noirAutenticado()) {
    document.getElementById('noirLock').classList.remove('gone');
    document.getElementById('noirLockEditor').classList.remove('gone');
    document.getElementById('noirLockInp').focus();
  } else if (tab === 'noir') {
    document.getElementById('noirLock').classList.add('gone');
    document.getElementById('noirLockEditor').classList.add('gone');
  }
}

function noirAutenticado() {
  return sessionStorage.getItem('zara_noir_auth') === '1';
}

async function verificarSenhaNoir() {
  const inp = document.getElementById('noirLockInp');
  const err = document.getElementById('noirLockErr');
  const val = inp.value;
  if (!val) { err.textContent = 'Digite a senha.'; return; }
  err.textContent = '...';
  const h = await hashStr(val);
  if (h === PH_NOIR) {
    sessionStorage.setItem('zara_noir_auth', '1');
    document.getElementById('noirLock').classList.add('gone');
    document.getElementById('noirLockEditor').classList.add('gone');
    inp.value = '';
    err.textContent = '\u00a0';
    // Ativar os painéis do noir corretamente após autenticação
    switchTab('noir');
  } else {
    err.textContent = 'Senha incorreta.';
    inp.value = '';
    inp.focus();
    setTimeout(() => { err.textContent = '\u00a0'; }, 2500);
  }
}

// Mobile: volta da tela de editor para a tela de lista (sem perder dados,
// só troca qual painel fica visível — o salvamento automático via onInput
// continua intacto).
function voltarParaLista(modo) {
  document.getElementById('appLayout').classList.remove('mobile-view-editor');
}

// ── ENTRADAS ──
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function hoje() { return new Date().toISOString().split('T')[0]; }

function novaEntrada(modo) {
  atual[modo] = { id: uid(), data: hoje(), titulo: '', estado: '', tema: '', texto: '', tags: [], humor: 5 };
  tags[modo] = [];
  abrirEditor(modo, false);
  document.getElementById('appLayout').classList.add('mobile-view-editor');
}

function abrirEntrada(modo, id) {
  const e = dados[modo].find(x => x.id === id);
  if (!e) return;
  atual[modo] = { ...e };
  tags[modo] = [...(e.tags || [])];
  document.querySelectorAll(`#listDiario .entry-item, #listNoir .entry-item`).forEach(el => el.classList.remove('active','noir-active'));
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.classList.add(modo === 'noir' ? 'noir-active' : 'active');
  abrirEditor(modo, true);
  document.getElementById('appLayout').classList.add('mobile-view-editor');
}

function abrirEditor(modo, existente) {
  if (modo === 'diario') {
    document.getElementById('editorEmpty').style.display = 'none';
    document.getElementById('editorActive').style.display = 'flex';
    document.getElementById('dDate').value = atual[modo].data || hoje();
    document.getElementById('dEstado').value = atual[modo].estado || '';
    document.getElementById('dTitulo').value = atual[modo].titulo || '';
    document.getElementById('dTexto').innerHTML = atual[modo].texto || '';
    document.getElementById('dBtnDel').style.display = existente ? 'block' : 'none';
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.toggle('on', tags[modo].includes(b.dataset.tag)));
    resetSalvarBtn('d');
    document.getElementById('dTexto').focus();
  } else {
    document.getElementById('noirEmpty').style.display = 'none';
    document.getElementById('noirActive').style.display = 'flex';
    document.getElementById('nDate').value = atual[modo].data || hoje();
    document.getElementById('nTema').value = atual[modo].estado || atual[modo].tema || '';
    document.getElementById('nTitulo').value = atual[modo].titulo || '';
    document.getElementById('nTexto').innerHTML = atual[modo].texto || '';
    document.getElementById('nBtnDel').style.display = existente ? 'block' : 'none';
    // Restaurar categoria
    noirCatAtual = atual[modo].categoria || null;
    document.querySelectorAll('.noir-cat-btn').forEach(b => b.classList.toggle('on', b.dataset.cat === noirCatAtual));
    resetSalvarBtn('n');
    document.getElementById('nTexto').focus();
  }
}

function resetSalvarBtn(p) {
  const b = document.getElementById(p + 'BtnSalvar');
  b.textContent = 'Salvar'; b.classList.remove('saved');
}

function toggleTag(btn, modo) {
  const t = btn.dataset.tag;
  if (tags[modo].includes(t)) { tags[modo] = tags[modo].filter(x => x !== t); btn.classList.remove('on'); }
  else { tags[modo].push(t); btn.classList.add('on'); }
}

async function salvar(modo) {
  if (!atual[modo]) return;
  if (modo === 'diario') {
    atual[modo].data = document.getElementById('dDate').value || hoje();
    atual[modo].estado = document.getElementById('dEstado').value.trim();
    atual[modo].titulo = document.getElementById('dTitulo').value.trim();
    atual[modo].texto = document.getElementById('dTexto').innerHTML;
    atual[modo].tags = [...tags[modo]];
    atual[modo].humor = calcHumor(atual[modo].texto + ' ' + atual[modo].estado);
  } else {
    atual[modo].data = document.getElementById('nDate').value || hoje();
    atual[modo].estado = document.getElementById('nTema').value.trim();
    atual[modo].titulo = document.getElementById('nTitulo').value.trim();
    atual[modo].texto = document.getElementById('nTexto').innerHTML;
    atual[modo].tags = [];
    if (noirCatAtual) atual[modo].categoria = noirCatAtual;
  }
  const idx = dados[modo].findIndex(e => e.id === atual[modo].id);
  if (idx >= 0) dados[modo][idx] = { ...atual[modo] };
  else dados[modo].unshift({ ...atual[modo] });
  dados[modo].sort((a, b) => b.data.localeCompare(a.data));
  await salvarSB(modo, atual[modo]);
  salvarLocal(modo);
  renderLista(modo);
  if (modo === 'diario') renderTimeline();
  const p = modo === 'diario' ? 'd' : 'n';
  const b = document.getElementById(p + 'BtnSalvar');
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px;margin-right:3px"><polyline points="20 6 9 17 4 12"/></svg> Salvo'; b.classList.add('saved');
  mostrarAutoSave(p);
  setTimeout(() => resetSalvarBtn(p), 2200);
}

async function deletar(modo) {
  if (!atual[modo] || !confirm('Excluir este registro?')) return;
  dados[modo] = dados[modo].filter(e => e.id !== atual[modo].id);
  await deletarSB(modo, atual[modo].id);
  salvarLocal(modo);
  atual[modo] = null; tags[modo] = [];
  if (modo === 'diario') {
    document.getElementById('editorEmpty').style.display = 'flex';
    document.getElementById('editorActive').style.display = 'none';
  } else {
    document.getElementById('noirEmpty').style.display = 'flex';
    document.getElementById('noirActive').style.display = 'none';
  }
  renderLista(modo);
  if (modo === 'diario') renderTimeline();
  document.getElementById('appLayout').classList.remove('mobile-view-editor');
  showToast('Excluído.');
}

async function deletarDaLista(modo, id) {
  if (!confirm('Excluir esta entrada?')) return;
  dados[modo] = dados[modo].filter(e => String(e.id) !== String(id));
  await deletarSB(modo, id);
  salvarLocal(modo);
  // Se era a entrada aberta no editor, fechar o editor
  if (atual[modo] && String(atual[modo].id) === String(id)) {
    atual[modo] = null; tags[modo] = [];
    if (modo === 'diario') {
      document.getElementById('editorEmpty').style.display = 'flex';
      document.getElementById('editorActive').style.display = 'none';
    } else {
      document.getElementById('noirEmpty').style.display = 'flex';
      document.getElementById('noirActive').style.display = 'none';
    }
    document.getElementById('appLayout').classList.remove('mobile-view-editor');
  }
  renderLista(modo);
  if (modo === 'diario') renderTimeline();
  showToast('Excluído.');
}

function onInput(modo) {
  clearTimeout(aTimer);
  aTimer = setTimeout(() => { if (atual[modo]) salvar(modo); }, 3500);
}

// ── RENDER LISTA ──
function fmtData(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
}

function renderLista(modo) {
  const busca = (document.getElementById('search' + (modo === 'diario' ? 'Diario' : 'Noir'))?.value || '').toLowerCase();
  let lista = [...dados[modo]];
  if (busca) lista = lista.filter(e =>
    (e.texto || '').toLowerCase().includes(busca) ||
    (e.titulo || '').toLowerCase().includes(busca) ||
    (e.estado || '').toLowerCase().includes(busca) ||
    (e.data || '').includes(busca)
  );
  if (modo === 'diario' && filtroTag) {
    lista = lista.filter(e => (e.tags || []).includes(filtroTag));
  }
  // categoria noir
  if (modo === 'noir' && noirCatAtual) {
    lista = lista.filter(e => e.categoria === noirCatAtual);
  }
  const el = document.getElementById('list' + (modo === 'diario' ? 'Diario' : 'Noir'));
  const tot = document.getElementById('total' + (modo === 'diario' ? 'Diario' : 'Noir'));
  if (tot) tot.textContent = dados[modo].length + (modo === 'diario' ? ' entradas' : ' registros');
  if (!lista.length) {
    el.innerHTML = `<div class="empty-list">${busca || filtroTag ? 'Nenhum resultado.' : 'Nenhum registro ainda.'}</div>`;
    return;
  }
  const atId = atual[modo]?.id;
  el.innerHTML = lista.map(e => {
    const isA = atId === e.id;
    const tagHtml = (e.tags || []).map(t => `<span class="tag-chip${modo === 'noir' ? ' noir-tag' : ''}">${t}</span>`).join('');
    const prev = (e.texto || '').replace(/<[^>]+>/g, '').slice(0, 55);
    const catLabel = modo === 'noir' && e.categoria ? `<span class="tag-chip noir-tag">${e.categoria}</span>` : '';
    return `<div class="entry-item${isA ? (modo === 'noir' ? ' noir-active' : ' active') : ''}" data-id="${e.id}" onclick="abrirEntrada('${modo}','${e.id}')">
      <button class="entry-del-btn" onclick="event.stopPropagation();deletarDaLista('${modo}','${e.id}')" title="Excluir entrada">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
      <div class="entry-item-date">${fmtData(e.data)}</div>
      <div class="entry-item-title">${e.titulo || e.estado || 'Sem título'}</div>
      ${prev ? `<div class="entry-item-preview">${prev}</div>` : ''}
      ${(tagHtml || catLabel) ? `<div class="entry-item-tags">${tagHtml}${catLabel}</div>` : ''}
    </div>`;
  }).join('');
  if (modo === 'diario') { renderStreak(); }
}

function filtrar(modo) { renderLista(modo); }

// ── TIMELINE ──
function calcHumor(txt) {
  const t = txt.toLowerCase().replace(/<[^>]+>/g, '');
  const pos = ['bem','ótimo','feliz','confiante','vitória','consegui','foco','calmo','gratidão','conquista','progresso','disciplina','força'];
  const neg = ['mal','ruim','ansioso','ansiedade','raiva','recaída','falha','fraco','cansado','errei','perdi','medo','culpa','apostei'];
  let s = 5;
  pos.forEach(p => { if (t.includes(p)) s = Math.min(10, s + 1); });
  neg.forEach(n => { if (t.includes(n)) s = Math.max(1, s - 1); });
  return s;
}

function toggleTimeline() {
  document.getElementById('timelineChart').classList.toggle('open');
}

function renderTimeline() {
  const ult = [...dados.diario].slice(0, 14).reverse();
  const bars = document.getElementById('tlBars');
  const lbls = document.getElementById('tlLabels');
  if (!bars || !ult.length) return;
  bars.innerHTML = ult.map(e => {
    const h = Math.round(((e.humor || 5) / 10) * 50) + 4;
    const op = 0.3 + ((e.humor || 5) / 10) * 0.7;
    const d = new Date((e.data || '') + 'T12:00:00');
    return `<div class="tbar" style="height:${h}px;opacity:${op};background:linear-gradient(180deg,var(--gold-b),var(--gold))" data-tip="${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} · ${e.humor||5}/10"></div>`;
  }).join('');
  lbls.innerHTML = ult.map(e => {
    const d = new Date((e.data || '') + 'T12:00:00');
    return `<div class="tl-label">${d.getDate()}</div>`;
  }).join('');
  renderStreak();
}

// ── FORMATAÇÃO ──
function getActiveEditor() {
  const el = document.activeElement;
  if (el && el.contentEditable === 'true') return el;
  return null;
}

function fmt(cmd) {
  const ed = getActiveEditor();
  if (ed) ed.focus();
  document.execCommand(cmd, false, null);
  hideCtx(); hideFloat();
}

function fmtCor(cor) {
  const ed = getActiveEditor();
  if (ed) ed.focus();
  if (cor) { document.execCommand('styleWithCSS', false, true); document.execCommand('foreColor', false, cor); }
  else document.execCommand('removeFormat', false, null);
  hideCtx(); hideFloat();
}

function showCtx(e) {
  e.preventDefault();
  const m = document.getElementById('ctxMenu');
  m.style.display = 'block';
  let x = e.clientX, y = e.clientY;
  setTimeout(() => {
    const mw = m.offsetWidth, mh = m.offsetHeight;
    if (x + mw > window.innerWidth) x = window.innerWidth - mw - 8;
    if (y + mh > window.innerHeight) y = window.innerHeight - mh - 8;
    m.style.left = x + 'px'; m.style.top = y + 'px';
  }, 0);
}
function hideCtx() { document.getElementById('ctxMenu').style.display = 'none'; }

document.addEventListener('mouseup', () => {
  const sel = window.getSelection();
  const editors = [document.getElementById('dTexto'), document.getElementById('nTexto')];
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const node = sel.getRangeAt(0).commonAncestorContainer;
    if (editors.some(ed => ed && ed.contains(node))) {
      const tb = document.getElementById('floatTB');
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      tb.style.display = 'flex';
      let x = rect.left + rect.width / 2 - 100;
      let y = rect.top - 46;
      if (y < 8) y = rect.bottom + 8;
      if (x < 8) x = 8;
      if (x + 220 > window.innerWidth) x = window.innerWidth - 228;
      tb.style.left = x + 'px'; tb.style.top = y + 'px';
      return;
    }
  }
  hideFloat();
});
function hideFloat() { document.getElementById('floatTB').style.display = 'none'; }

document.addEventListener('click', e => {
  if (!e.target.closest('#ctxMenu')) hideCtx();
  if (!e.target.closest('#floatTB') && !e.target.closest('[contenteditable]')) hideFloat();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideCtx(); hideFloat(); if (focusMode) toggleFocus(); }
  if ((e.ctrlKey || e.metaKey)) {
    if (e.key === 'b') { e.preventDefault(); fmt('bold'); }
    if (e.key === 'i') { e.preventDefault(); fmt('italic'); }
    if (e.key === 'u') { e.preventDefault(); fmt('underline'); }
    if (e.key === 's') { e.preventDefault(); salvar(modoAtual); }
  }
  if (e.key === 'Enter' && document.getElementById('lockScreen') && !document.getElementById('lockScreen').classList.contains('gone')) {
    verificarSenha();
  }
});


// ── STREAK ──
function calcStreak() {
  const today = new Date().toISOString().split('T')[0];
  const datas = [...new Set(dados.diario.map(e => e.data))].sort((a,b) => b.localeCompare(a));
  if (!datas.length) return 0;
  let streak = 0, d = new Date(today + 'T12:00:00');
  for (let i = 0; i < datas.length; i++) {
    const expected = d.toISOString().split('T')[0];
    if (datas[i] === expected) { streak++; d.setDate(d.getDate() - 1); }
    else if (i === 0 && datas[0] !== today) break;
    else break;
  }
  return streak;
}
function renderStreak() {
  const s = calcStreak();
  const el = document.getElementById('streakNum');
  const wrap = document.getElementById('streakBar');
  if (el) el.textContent = s;
  if (wrap) wrap.style.display = s >= 1 ? 'flex' : 'none';
}

// ── CALENDÁRIO ──
let calMes = new Date().getMonth(), calAno = new Date().getFullYear();
function toggleCal() {
  const wrap = document.getElementById('calWrap');
  const btn = document.getElementById('calToggleBtn');
  const open = wrap.classList.toggle('open');
  btn.classList.toggle('open', open);
  if (open) renderCal();
}
function renderCal() {
  const hoje = new Date().toISOString().split('T')[0];
  const datasComEntrada = new Set(dados.diario.map(e => e.data));
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  document.getElementById('calLabel').textContent = meses[calMes] + ' ' + calAno;
  const firstDay = new Date(calAno, calMes, 1).getDay();
  const daysInMonth = new Date(calAno, calMes + 1, 0).getDate();
  const prevDays = new Date(calAno, calMes, 0).getDate();
  const dias = ['D','S','T','Q','Q','S','S'];
  let html = dias.map(d => '<div class="cal-day-label">' + d + '</div>').join('');
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-day other-month">' + (prevDays - firstDay + i + 1) + '</div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = calAno + '-' + String(calMes+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const has = datasComEntrada.has(iso);
    const isToday = iso === hoje;
    const cls = 'cal-day' + (has ? ' has-entry-dot' : '') + (isToday ? ' today' : '');
    const onclick = has ? ` onclick="filtrarPorData('${iso}')"` : '';
    html += '<div class="' + cls + '"' + onclick + '>' + d + '</div>';
  }
  const total = firstDay + daysInMonth;
  const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= rem; d++) html += '<div class="cal-day other-month">' + d + '</div>';
  document.getElementById('calGrid').innerHTML = html;
}
function calNav(dir) { calMes += dir; if (calMes > 11){calMes=0;calAno++;} else if (calMes < 0){calMes=11;calAno--;} renderCal(); }
function filtrarPorData(iso) { document.getElementById('searchDiario').value = iso; filtrar('diario'); toggleCal(); }

// ── MODO FOCO ──
let focusMode = false;
function toggleFocus() {
  focusMode = !focusMode;
  document.body.classList.toggle('focus-mode', focusMode);
}

// ── FILTRO TAG ──
let filtroTag = null;
function setFiltroTag(tag) {
  filtroTag = filtroTag === tag ? null : tag;
  document.querySelectorAll('.tf-btn').forEach(b => {
    const isAll = b.dataset.tf === 'all';
    b.classList.toggle('on', isAll ? !filtroTag : b.dataset.tf === filtroTag);
  });
  renderLista('diario');
}

// ── AUTO-SAVE INDICATOR ──
function mostrarAutoSave(prefixo) {
  const el = document.getElementById(prefixo + 'AutoSave');
  if (!el) return;
  el.classList.add('visible');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('visible'), 2400);
}

// ── SEPARADOR --- ──
function handleSeparador(e) {
  if (e.key !== 'Enter') return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const node = sel.getRangeAt(0).startContainer;
  const txt = (node.textContent || '').trim();
  if (txt !== '---') return;
  e.preventDefault();
  let bloco = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (bloco && !['DIV','P','SECTION'].includes(bloco.tagName) && bloco.parentElement) bloco = bloco.parentElement;
  if (bloco) {
    const hr = document.createElement('hr');
    const np = document.createElement('p'); np.innerHTML = '<br>';
    bloco.textContent = '';
    bloco.after(hr, np);
    const r = document.createRange();
    r.setStart(np, 0); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r);
  }
}

// ── CATEGORIAS NOIR ──
let noirCatAtual = null;
function setNoirCat(cat) {
  noirCatAtual = noirCatAtual === cat ? null : cat;
  document.querySelectorAll('.noir-cat-btn').forEach(b => b.classList.toggle('on', b.dataset.cat === noirCatAtual));
  if (atual.noir) atual.noir.categoria = noirCatAtual;
}

// ── BLOQUEAR NOIR ──
function bloquearNoir() {
  sessionStorage.removeItem('zara_noir_auth');
  document.getElementById('noirLock').classList.remove('gone');
  document.getElementById('noirLockEditor').classList.remove('gone');
  document.getElementById('noirLockInp').value = '';
  document.getElementById('noirLockErr').textContent = '\u00a0';
  document.getElementById('appLayout').classList.remove('mobile-view-editor');
}

// ── EXPORT MENSAL ──
function abrirExport() {
  const sel = document.getElementById('exportMesSel');
  const meses = [...new Set(dados.diario.map(e => e.data.substring(0,7)))].sort((a,b)=>b.localeCompare(a));
  const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  if (!meses.length) { showToast('Nenhuma entrada para exportar.'); return; }
  sel.innerHTML = meses.map(m => {
    const [a,mo] = m.split('-');
    return '<option value="' + m + '">' + nomes[parseInt(mo)-1] + ' ' + a + '</option>';
  }).join('');
  document.getElementById('exportModal').classList.add('open');
}
function fecharExport() { document.getElementById('exportModal').classList.remove('open'); }
function executarExport() {
  const mes = document.getElementById('exportMesSel').value;
  const [ano,mo] = mes.split('-');
  const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const entradas = dados.diario.filter(e => e.data.startsWith(mes)).sort((a,b) => a.data.localeCompare(b.data));
  if (!entradas.length) { showToast('Nenhuma entrada neste mês.'); fecharExport(); return; }
  let txt = 'DIÁRIO — ' + nomes[parseInt(mo)-1] + ' ' + ano + '\n' + '='.repeat(40) + '\n\n';
  entradas.forEach(e => {
    const d = new Date((e.data||'') + 'T12:00:00');
    txt += d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}) + '\n';
    if (e.titulo) txt += e.titulo + '\n';
    if (e.estado) txt += e.estado + '\n';
    if (e.tags && e.tags.length) txt += '[' + e.tags.join(', ') + ']\n';
    txt += '\n';
    const corpo = (e.texto||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').trim();
    if (corpo) txt += corpo + '\n';
    txt += '\n' + String.fromCharCode(8212).repeat(30) + '\n\n';
  });
  const blob = new Blob([txt],{type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'diario-' + mes + '.txt';
  a.click(); URL.revokeObjectURL(a.href);
  fecharExport();
  showToast(entradas.length + ' entradas exportadas.');
}

// ── PDF ──
function exportarPDF(modo) {
  window.print();
}

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200);
}

// ── INPUT HANDLERS (título/estado auto-save) ──
document.addEventListener('input', e => {
  if (['dTitulo','dEstado','nTitulo','nTema'].includes(e.target.id)) {
    clearTimeout(aTimer);
    aTimer = setTimeout(() => { if (atual[modoAtual]) salvar(modoAtual); }, 3500);
  }
});

// ── INIT ──
async function init() {
  await initSB();
}

// Se já autenticado nesta sessão, pula o lock
if (sessionStorage.getItem('zara_auth') === '1') {
  document.getElementById('lockScreen').classList.add('gone');
  document.getElementById('appLayout').style.display = 'flex';
  init();
} else {
  setTimeout(() => document.getElementById('lockInp')?.focus(), 200);
}
