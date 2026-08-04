// ══════════════════════════════════════════════
//  OPERAÇÕES — ZARA | Centro de Comando
//  Reescrito do zero — save robusto e simples
// ══════════════════════════════════════════════

const CHAVE = 'zara_op_v2'; // nova chave para evitar dados corrompidos antigos

// ── LOAD ──
function carregarDados() {
    try {
        const raw = localStorage.getItem(CHAVE);
        if (!raw) return estruturaVazia();
        const d = JSON.parse(raw);
        if (!d || typeof d !== 'object') return estruturaVazia();
        // Garantir todos os campos
        d.poder     = d.poder     || { nivel:1, tendencia:'parado', inicio: dataHoje(), metas:0 };
        d.ops       = Array.isArray(d.ops)    ? d.ops    : [];
        d.aliados   = Array.isArray(d.aliados) ? d.aliados: [];
        d.favores   = Array.isArray(d.favores) ? d.favores: [];
        d.estrelas  = Array.isArray(d.estrelas)? d.estrelas:[];
        return d;
    } catch(e) {
        console.error('ZARA load error:', e);
        return estruturaVazia();
    }
}

function estruturaVazia() {
    return {
        poder:   { nivel:1, tendencia:'parado', inicio: dataHoje(), metas:0 },
        ops:     [],
        aliados: [],
        favores: [],
        estrelas:[]
    };
}
// ── SYNC SUPABASE ──────────────────────────
const SUPABASE_URL = 'https://ltwamldgdwqzyssoukzl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0d2FtbGRnZHdxenlzc291a3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzEzMDUsImV4cCI6MjA4MjQ0NzMwNX0.UVyo0c0BHslB7mCU74Qx8rdo42HA0WPAyDQ6J-FIakE';
const USER_ID = 'default_user';
let _sb = null, _useSync = false;
try {
    _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    _useSync = true;
} catch(e) { console.warn('Supabase offline:', e); }

async function syncSave() {
    if (!_useSync || !db) return;
    try {
        await _sb.from('operacoes').upsert({
            id: USER_ID, user_id: USER_ID,
            dados: db, updated_at: new Date().toISOString()
        });
    } catch(e) { console.error('syncSave:', e); }
}

async function syncLoad() {
    if (!_useSync) return false;
    try {
        const { data, error } = await _sb.from('operacoes')
            .select('dados').eq('user_id', USER_ID).maybeSingle();
        if (error || !data?.dados) return false;
        db = Object.assign(estruturaVazia(), data.dados);
        localStorage.setItem('zara_op_v2', JSON.stringify(db));
        return true;
    } catch(e) { console.error('syncLoad:', e); return false; }
}
// ───────────────────────────────────────────



// ══════════════════════════════════════════════
//  SYNC SUPABASE
// ══════════════════════════════════════════════

try {
    _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    _useSync = true;
} catch(e) { console.warn('Supabase offline:', e); }

async function syncSave() {
    if (!_useSync) return;
    try {
        const { error } = await _sb.from('operacoes').upsert({
            id: USER_ID, user_id: USER_ID,
            dados: db,
            updated_at: new Date().toISOString()
        });
        if (error) console.error('syncSave:', error);
    } catch(e) { console.error('syncSave:', e); }
}

async function syncLoad() {
    if (!_useSync) return;
    try {
        const { data, error } = await _sb.from('operacoes')
            .select('*').eq('user_id', USER_ID).maybeSingle();
        if (error || !data?.dados) return;
        db = Object.assign(estruturaVazia(), data.dados);
        localStorage.setItem('zara_op_v2', JSON.stringify(db));
        syncSave();
        toast('Dados carregados', 'success');
        renderStatus(); renderOps(); renderRede(); renderFavores(); renderCalendario();
    } catch(e) { console.error('syncLoad:', e); }
}


// ── SAVE — único ponto de escrita ──
let db = carregarDados();

function salvar() {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(db));
        syncSave();
    } catch(e) {
        console.error('ZARA save error:', e);
        toast('Erro ao salvar. Verifique o armazenamento.', 'error');
    }
}

// ── UTILS ──
function uid()       { return Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
function dataHoje()  { return new Date().toISOString().slice(0,10); }
function diasDesde(d){ return d ? Math.floor((new Date()-new Date(d))/86400000) : 0; }
function fmtData(d)  {
    if (!d) return '';
    const [y,m,dia] = d.split('-');
    return `${dia}/${m}/${y}`;
}

// ── TOAST ──
function toast(msg, tipo) {
    const el = document.getElementById('opStatus');
    if (!el) return;
    const cores = { success:'rgba(30,130,70,0.96)', error:'rgba(180,45,35,0.96)', info:'rgba(30,60,100,0.96)' };
    el.textContent = msg;
    el.style.background = cores[tipo||'info'];
    el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(8px)'; }, 3000);
}

// ── MODAIS ──
function abrirModal(id)  { const el=document.getElementById(id); if(el) el.classList.add('active'); }
function fecharModal(id) { const el=document.getElementById(id); if(el) el.classList.remove('active'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if(e.target===m) m.classList.remove('active'); });
});

// ── TABS ──
let _tab = 'operacoes';
function showTab(tab, btn) {
    _tab = tab;
    ['operacoes','status','rede','favores','estrela'].forEach(t => {
        const el = document.getElementById('tab_'+t);
        if (el) el.style.display = t===tab ? '' : 'none';
    });
    document.querySelectorAll('.op-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (tab === 'estrela') renderCalendario();
    atualizarContadores();
}

function atualizarContadores() {
    const el = document.getElementById('count_operacoes');
    if (el) el.textContent = db.ops.filter(o=>o.status==='ativa').length;
}

// ══════════════════════════════════════════════
//  STATUS DE PODER
// ══════════════════════════════════════════════
const TEND_ICONS = {
    subindo:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px;height:20px"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    parado:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px;height:20px"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    recuando: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px;height:20px"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
};
const TEND_NOME = { subindo:'Subindo', parado:'Parado', recuando:'Recuando' };

function getLevelLabel(n) {
    if (n >= 9) return 'Autoridade máxima';
    if (n >= 7) return 'Alto impacto';
    if (n >= 5) return 'Em crescimento';
    if (n >= 3) return 'Construindo base';
    return 'Ponto de partida';
}

function setTendencia(t) {
    db.poder.tendencia = t;
    db.poder.inicio    = dataHoje();
    salvar(); renderStatus();
    toast('Tendência: ' + TEND_NOME[t], 'success');
}

function subirNivel() {
    const n = (db.poder.nivel||1);
    if (n >= 10) { toast('Nível máximo!','info'); return; }
    db.poder.nivel = n + 1;
    salvar(); renderStatus();
    toast('Nível ' + db.poder.nivel + ' — ' + getLevelLabel(db.poder.nivel), 'success');
}

function descerNivel() {
    const n = (db.poder.nivel||1);
    if (n <= 1) { toast('Nível mínimo.','info'); return; }
    db.poder.nivel = n - 1;
    salvar(); renderStatus();
}

function addMetaAtingida() {
    db.poder.metas = (db.poder.metas||0) + 1;
    salvar(); renderStatus();
    toast('Meta registrada!','success');
}

function calcMetas() {
    const executadas = db.ops.filter(o=>o.status==='executada').length;
    return executadas + (db.poder.metas||0);
}

function renderStatus() {
    const p = db.poder;
    const nivel = p.nivel || 1;
    const dias  = diasDesde(p.inicio);
    const metas = calcMetas();
    const tend  = p.tendencia || 'parado';

    const elNivel = document.getElementById('statusNivel');
    if (elNivel) elNivel.textContent = nivel;
    const elBar = document.getElementById('statusNivelBar');
    if (elBar) elBar.style.width = (nivel*10)+'%';
    const elSub = document.getElementById('statusNivelSub');
    if (elSub) elSub.textContent = nivel+' / 10 — '+getLevelLabel(nivel);
    const elNum = document.getElementById('nivelNumGrande');
    if (elNum) elNum.textContent = nivel;

    const elTend = document.getElementById('statusTendencia');
    if (elTend) elTend.innerHTML = `
        <div class="poder-tendencia">
            <div class="poder-tendencia-icon ${tend}">${TEND_ICONS[tend]||''}</div>
            <div class="poder-tendencia-txt">
                <div class="poder-tendencia-nome ${tend}">${TEND_NOME[tend]||'—'}</div>
                <div class="poder-tendencia-sub">Há ${dias} dia${dias!==1?'s':''}</div>
            </div>
        </div>`;

    const elDias = document.getElementById('statusDias');
    if (elDias) elDias.innerHTML = `<div class="poder-tempo-val">${dias}d</div><div class="poder-tempo-sub">${tend==='subindo'?'em movimento':tend==='parado'?'sem se mover':'recuando'}</div>`;

    const elMetas = document.getElementById('statusMetas');
    if (elMetas) elMetas.innerHTML = `<div class="poder-metas-atingidas"><div class="poder-metas-num">${metas}</div></div><div style="font-size:0.62em;color:var(--text-dim);margin-top:4px;">metas atingidas</div>`;

    document.getElementById('heroNivel').textContent    = nivel;
    document.getElementById('heroTendencia').textContent= (tend==='subindo'?'↑ ':tend==='recuando'?'↓ ':'→ ')+TEND_NOME[tend];
    document.getElementById('heroTendencia').className  = 'op-kpi-val '+tend;
    document.getElementById('heroDias').textContent     = dias+'d';
    document.getElementById('heroMetas').textContent    = metas;
}

// ══════════════════════════════════════════════
//  OPERAÇÕES
// ══════════════════════════════════════════════
let _opEdit = null;
let _etapas = [];

function abrirModalOp(id) {
    _opEdit = id || null;
    _etapas = [];
    if (id) {
        const op = db.ops.find(x=>x.id===id);
        if (!op) return;
        document.getElementById('opNome').value  = op.nome;
        document.getElementById('opTipo').value  = op.tipo||'jogada';
        document.getElementById('opPrio').value  = op.prio||'media';
        document.getElementById('opAlvo').value  = op.alvo||'';
        document.getElementById('opNotas').value = op.notas||'';
        _etapas = (op.etapas||[]).map(e=>({...e}));
    } else {
        ['opNome','opAlvo','opNotas'].forEach(i=>document.getElementById(i).value='');
        document.getElementById('opTipo').value='jogada';
        document.getElementById('opPrio').value='media';
    }
    renderEtapasModal();
    abrirModal('modalOp');
    setTimeout(()=>document.getElementById('opNome').focus(),100);
}

function renderEtapasModal() {
    document.getElementById('etapasInputList').innerHTML = _etapas.map((e,i)=>`
        <div class="etapa-input-row">
            <input type="text" value="${e.texto||''}" oninput="_etapas[${i}].texto=this.value" placeholder="Etapa ${i+1}...">
            <button class="etapa-rem" onclick="_etapas.splice(${i},1);renderEtapasModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>`).join('');
}

function addEtapaModal() {
    _etapas.push({ id:uid(), texto:'', feita:false });
    renderEtapasModal();
    const ins = document.querySelectorAll('#etapasInputList input');
    if (ins.length) ins[ins.length-1].focus();
}

function salvarOp() {
    const nome = document.getElementById('opNome').value.trim();
    if (!nome) { toast('Informe o nome da operação.','error'); return; }
    const obj = {
        nome,
        tipo:   document.getElementById('opTipo').value,
        prio:   document.getElementById('opPrio').value,
        alvo:   document.getElementById('opAlvo').value.trim(),
        notas:  document.getElementById('opNotas').value.trim(),
        etapas: _etapas.filter(e=>e.texto.trim()),
    };
    if (_opEdit) {
        const idx = db.ops.findIndex(x=>x.id===_opEdit);
        if (idx>=0) db.ops[idx] = { ...db.ops[idx], ...obj };
        toast('Operação atualizada.','success');
    } else {
        db.ops.push({ id:uid(), ...obj, status:'ativa', criadaEm:dataHoje() });
        toast('Operação criada!','success');
    }
    salvar(); fecharModal('modalOp'); renderOps();
}

function mudarStatus(id, novo) {
    const op = db.ops.find(x=>x.id===id);
    if (!op) return;
    op.status = novo;
    salvar(); renderOps(); renderStatus();
    const msgs = { executada:'Executada!', suspensa:'Suspensa.', descartada:'Descartada.', ativa:'Reativada.' };
    toast(msgs[novo]||'Atualizado.', novo==='executada'?'success':'info');
}

function excluirOp(id) {
    if (!confirm('Excluir esta operação?')) return;
    db.ops = db.ops.filter(x=>x.id!==id);
    salvar(); renderOps(); renderStatus();
    toast('Operação removida.','info');
}

function toggleEtapa(opId, etId) {
    const op = db.ops.find(x=>x.id===opId);
    if (!op) return;
    const et = op.etapas && op.etapas.find(e=>e.id===etId);
    if (et) { et.feita=!et.feita; salvar(); renderOps(); }
}

let _filtro = 'ativa';
function setFiltro(s, btn) {
    _filtro = s;
    document.querySelectorAll('.filtro-status-btn').forEach(b=>b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderOps();
}

const BTNS = {
    ativa:     (id)=>`<button class="op-btn executar" onclick="mudarStatus('${id}','executada')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><polyline points="20 6 9 17 4 12"/></svg>Executar</button><button class="op-btn suspender" onclick="mudarStatus('${id}','suspensa')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Suspender</button><button class="op-btn descartar" onclick="mudarStatus('${id}','descartada')">Descartar</button>`,
    suspensa:  (id)=>`<button class="op-btn reativar" onclick="mudarStatus('${id}','ativa')">Reativar</button><button class="op-btn descartar" onclick="mudarStatus('${id}','descartada')">Descartar</button>`,
    executada: (id)=>`<button class="op-btn reativar" onclick="mudarStatus('${id}','ativa')">Reabrir</button>`,
    descartada:(id)=>`<button class="op-btn reativar" onclick="mudarStatus('${id}','ativa')">Reativar</button>`,
};

function renderOps() {
    const el  = document.getElementById('opList');
    if (!el) return;
    const lista = db.ops.filter(o => _filtro==='todas' ? true : o.status===_filtro);
    if (!lista.length) {
        el.innerHTML = `<div class="op-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>${_filtro==='ativa'?'Nenhuma operação ativa.':'Nenhuma operação aqui.'}</div>`;
        atualizarContadores(); return;
    }
    el.innerHTML = lista.map(op => {
        const et = op.etapas||[];
        const feat = et.filter(e=>e.feita).length;
        const pct  = et.length ? Math.round((feat/et.length)*100) : null;
        return `<div class="op-card" data-status="${op.status}">
            <div class="op-card-inner">
                <div class="op-card-stripe"></div>
                <div class="op-card-body">
                    <div class="op-card-top">
                        <div class="op-card-nome">${op.nome}</div>
                        <div class="op-card-badges">
                            <span class="op-badge ${op.status}">${{ativa:'Ativa',suspensa:'Suspensa',executada:'Executada',descartada:'Descartada'}[op.status]}</span>
                            <span class="op-badge ${op.tipo}">${op.tipo==='missao'?'Missão':'Jogada'}</span>
                            <span class="op-badge ${op.prio}">${{alta:'Alta',media:'Média',baixa:'Baixa'}[op.prio]}</span>
                        </div>
                    </div>
                    <div class="op-card-meta">
                        ${op.alvo?`<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${op.alvo}</span>`:''}
                        ${pct!==null?`<span>${feat}/${et.length} etapas (${pct}%)</span>`:''}
                        ${op.criadaEm?`<span>${fmtData(op.criadaEm)}</span>`:''}
                    </div>
                    ${et.length?`<div class="op-etapas">${et.map(e=>`
                        <div class="op-etapa${e.feita?' feita':''}" onclick="toggleEtapa('${op.id}','${e.id}')">
                            <div class="op-etapa-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                            <span class="op-etapa-txt">${e.texto}</span>
                        </div>`).join('')}</div>`:''}
                    ${op.notas?`<div class="op-card-notas">${op.notas}</div>`:''}
                    <div class="op-card-acoes">
                        ${(BTNS[op.status]||BTNS.ativa)(op.id)}
                        <button class="op-btn" onclick="abrirModalOp('${op.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Editar</button>
                        <button class="op-btn descartar" onclick="excluirOp('${op.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
    atualizarContadores();
}

// ══════════════════════════════════════════════
//  REDE DE INFLUÊNCIA
// ══════════════════════════════════════════════
let _alEdit = null;

function abrirModalAliado(id) {
    _alEdit = id || null;
    if (id) {
        const a = db.aliados.find(x=>x.id===id);
        if (!a) return;
        document.getElementById('alNome').value  = a.nome||'';
        document.getElementById('alCargo').value = a.cargo||'';
        document.getElementById('alConf').value  = a.confianca||3;
        document.getElementById('alUtil').value  = a.utilidade||'';
        document.getElementById('alNotes').value = a.notas||'';
    } else {
        ['alNome','alCargo','alUtil','alNotes'].forEach(i=>document.getElementById(i).value='');
        document.getElementById('alConf').value = 3;
    }
    abrirModal('modalAliado');
    setTimeout(()=>document.getElementById('alNome').focus(),100);
}

function salvarAliado() {
    const nome = document.getElementById('alNome').value.trim();
    if (!nome) { toast('Informe o nome.','error'); return; }
    const obj = {
        nome,
        cargo:     document.getElementById('alCargo').value.trim(),
        confianca: parseInt(document.getElementById('alConf').value)||3,
        utilidade: document.getElementById('alUtil').value.trim(),
        notas:     document.getElementById('alNotes').value.trim(),
    };
    if (_alEdit) {
        const idx = db.aliados.findIndex(x=>x.id===_alEdit);
        if (idx>=0) db.aliados[idx] = { ...db.aliados[idx], ...obj };
        toast('Aliado atualizado.','success');
    } else {
        db.aliados.push({ id:uid(), ...obj });
        toast('Aliado adicionado!','success');
    }
    salvar(); fecharModal('modalAliado'); renderRede();
}

function excluirAliado(id) {
    db.aliados = db.aliados.filter(x=>x.id!==id);
    salvar(); renderRede(); toast('Removido da rede.','info');
}

const VIA_SVG = {
    oral:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:18px;height:18px;"><rect x="7" y="2" width="10" height="18" rx="5"/></svg>',
    injetavel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:18px;height:18px;"><path d="m18 2 4 4-14 14H4v-4L18 2zM10.5 6.5l7 7"/></svg>',
};

function renderRede() {
    const el  = document.getElementById('redeList');
    const sub = document.getElementById('redeSubtitle');
    if (!el) return;
    sub.textContent = `${db.aliados.length} pessoa${db.aliados.length!==1?'s':''} na rede`;
    if (!db.aliados.length) {
        el.innerHTML = `<div class="op-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Rede vazia.<br>Adicione aliados.</div>`; return;
    }
    const sorted = [...db.aliados].sort((a,b)=>(b.confianca||0)-(a.confianca||0));
    el.innerHTML = sorted.map(a => {
        const ini = a.nome.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase();
        const estrelas = [1,2,3,4,5].map(i=>`<span style="color:${i<=(a.confianca||0)?'var(--gold)':'var(--border-s)'}">★</span>`).join('');
        return `<div class="aliado-card">
            <div class="aliado-avatar">${ini}</div>
            <div class="aliado-info">
                <div class="aliado-nome">${a.nome}</div>
                ${a.cargo?`<div class="aliado-cargo">${a.cargo}</div>`:''}
                ${a.utilidade?`<div class="aliado-notas">${a.utilidade}</div>`:''}
            </div>
            <div class="aliado-confianca">${estrelas}</div>
            <div class="aliado-acoes">
                <button class="aliado-btn" onclick="abrirModalAliado('${a.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="aliado-btn del" onclick="excluirAliado('${a.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
            </div>
        </div>`;
    }).join('');
}

// ══════════════════════════════════════════════
//  LIVRO DE FAVORES
// ══════════════════════════════════════════════
let _favEdit = null;
let _favTab  = 'receber';

function showFavTab(t, btn) {
    _favTab = t;
    document.querySelectorAll('.fav-tab').forEach(b=>b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderFavores();
}

function abrirModalFavor(id) {
    _favEdit = id||null;
    if (id) {
        const f = db.favores.find(x=>x.id===id);
        if (!f) return;
        document.getElementById('favPessoa').value = f.pessoa||'';
        document.getElementById('favTipo').value   = f.tipo||'receber';
        document.getElementById('favDesc').value   = f.descricao||'';
        document.getElementById('favPeso').value   = f.peso||'medio';
    } else {
        ['favPessoa','favDesc'].forEach(i=>document.getElementById(i).value='');
        document.getElementById('favTipo').value = _favTab;
        document.getElementById('favPeso').value = 'medio';
    }
    abrirModal('modalFavor');
    setTimeout(()=>document.getElementById('favPessoa').focus(),100);
}

function salvarFavor() {
    const pessoa = document.getElementById('favPessoa').value.trim();
    if (!pessoa) { toast('Informe o nome.','error'); return; }
    const obj = {
        pessoa,
        tipo:      document.getElementById('favTipo').value,
        descricao: document.getElementById('favDesc').value.trim(),
        peso:      document.getElementById('favPeso').value,
        resolvido: false,
    };
    if (_favEdit) {
        const idx = db.favores.findIndex(x=>x.id===_favEdit);
        if (idx>=0) db.favores[idx] = { ...db.favores[idx], ...obj };
        toast('Favor atualizado.','success');
    } else {
        db.favores.push({ id:uid(), ...obj, data:dataHoje() });
        toast('Favor registrado!','success');
    }
    salvar(); fecharModal('modalFavor'); renderFavores();
}

function resolverFavor(id) {
    const f = db.favores.find(x=>x.id===id);
    if (f) { f.resolvido=!f.resolvido; salvar(); renderFavores(); }
}

function excluirFavor(id) {
    db.favores = db.favores.filter(x=>x.id!==id);
    salvar(); renderFavores(); toast('Removido.','info');
}

const PESO_ICONS = { leve:'●', medio:'★', pesado:'▲' };

function renderFavores() {
    const el  = document.getElementById('favoresList');
    const sub = document.getElementById('favoresSubtitle');
    if (!el) return;
    const lista = db.favores.filter(f=>f.tipo===_favTab);
    const pend  = lista.filter(f=>!f.resolvido).length;
    sub.textContent = `${pend} pendente${pend!==1?'s':''} · ${lista.length} total`;
    if (!lista.length) {
        el.innerHTML = `<div class="op-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>${_favTab==='receber'?'Ninguém te deve nada registrado.':'Nenhum favor a pagar.'}</div>`; return;
    }
    const sorted = [...lista].sort((a,b)=>a.resolvido-b.resolvido || (b.peso==='pesado'?1:0)-(a.peso==='pesado'?1:0));
    el.innerHTML = sorted.map(f=>`
        <div class="favor-item${f.resolvido?' resolvido':''}">
            <div class="favor-tipo-icon ${f.tipo}">
                ${f.tipo==='receber'
                    ?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'
                    :'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>'}
            </div>
            <div class="favor-info">
                <div class="favor-pessoa">${f.pessoa}</div>
                ${f.descricao?`<div class="favor-desc">${f.descricao}</div>`:''}
                <div class="favor-meta">
                    <span class="favor-peso ${f.peso}">${PESO_ICONS[f.peso]||''} ${{leve:'Leve',medio:'Médio',pesado:'Pesado'}[f.peso]}</span>
                    ${f.data?`<span style="font-size:0.62em;color:var(--text-dim)">${fmtData(f.data)}</span>`:''}
                    ${f.resolvido?'<span style="font-size:0.62em;color:var(--green-b);font-weight:700">✓ Resolvido</span>':''}
                </div>
            </div>
            <div class="favor-acoes">
                <button class="favor-btn resolver" onclick="resolverFavor('${f.id}')" title="Resolver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></button>
                <button class="favor-btn" onclick="abrirModalFavor('${f.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="favor-btn del" onclick="excluirFavor('${f.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
            </div>
        </div>`).join('');
}

// ══════════════════════════════════════════════
//  ESTRELA NEGRA
// ══════════════════════════════════════════════
let _calAno = new Date().getFullYear();
let _calMes = new Date().getMonth();
let _estrelaEdit = null;
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function navMes(d) {
    _calMes += d;
    if (_calMes>11){_calMes=0;_calAno++;}
    if (_calMes<0) {_calMes=11;_calAno--;}
    renderCalendario();
}

function abrirModalEstrela(id, dataPre) {
    _estrelaEdit = id||null;
    if (id) {
        const e = db.estrelas.find(x=>x.id===id);
        if (!e) return;
        document.getElementById('estrelaData').value  = e.data;
        document.getElementById('estrelaNome').value  = e.nome;
        document.getElementById('estrelaNotas').value = e.notas||'';
    } else {
        document.getElementById('estrelaData').value  = dataPre||dataHoje();
        document.getElementById('estrelaNome').value  = '';
        document.getElementById('estrelaNotas').value = '';
    }
    abrirModal('modalEstrela');
    setTimeout(()=>document.getElementById('estrelaNome').focus(),100);
}

function salvarEstrela() {
    const data = document.getElementById('estrelaData').value;
    const nome = document.getElementById('estrelaNome').value.trim();
    if (!data||!nome) { toast('Preencha data e alvo.','error'); return; }
    const obj = { data, nome, notas:document.getElementById('estrelaNotas').value.trim() };
    if (_estrelaEdit) {
        const idx = db.estrelas.findIndex(x=>x.id===_estrelaEdit);
        if (idx>=0) db.estrelas[idx] = { ...db.estrelas[idx], ...obj };
        toast('Atualizado.','success');
    } else {
        db.estrelas.push({ id:uid(), ...obj });
        toast('Data marcada!','success');
    }
    salvar(); fecharModal('modalEstrela'); renderCalendario();
}

function excluirEstrela(id) {
    db.estrelas = db.estrelas.filter(x=>x.id!==id);
    salvar(); renderCalendario();
}

function renderCalendario() {
    const elTit  = document.getElementById('calMesTitulo');
    const elGrid = document.getElementById('calGrid');
    const elList = document.getElementById('estrelasLista');
    if (!elTit||!elGrid) return;

    elTit.textContent = `${MESES[_calMes]} ${_calAno}`;
    const hoje = dataHoje();
    const prim = new Date(_calAno, _calMes, 1).getDay();
    const total= new Date(_calAno, _calMes+1, 0).getDate();

    // Mapa de estrelas do mês
    const mapa = {};
    db.estrelas.forEach(e => {
        const [y,m] = e.data.split('-').map(Number);
        if (y===_calAno && m-1===_calMes) {
            if (!mapa[parseInt(e.data.split('-')[2])]) mapa[parseInt(e.data.split('-')[2])]=[];
            mapa[parseInt(e.data.split('-')[2])].push(e);
        }
    });

    let html = '';
    for (let i=0;i<prim;i++) html += '<div></div>';
    for (let d=1;d<=total;d++) {
        const ds = `${_calAno}-${String(_calMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const es = mapa[d]||[];
        const isHoje = ds===hoje;
        const isPast = ds<hoje;
        html += `<div onclick="abrirModalEstrela(null,'${ds}')" style="
            aspect-ratio:1;border-radius:8px;cursor:pointer;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            position:relative;transition:all 0.15s;
            background:${isHoje?'rgba(201,168,76,0.15)':es.length?'rgba(255,255,255,0.04)':'transparent'};
            border:1px solid ${isHoje?'rgba(201,168,76,0.4)':es.length?'rgba(255,255,255,0.12)':'transparent'};
            opacity:${isPast&&!es.length?0.3:1};"
            onmouseover="this.style.background='rgba(201,168,76,0.08)'"
            onmouseout="this.style.background='${isHoje?'rgba(201,168,76,0.15)':es.length?'rgba(255,255,255,0.04)':'transparent'}'">
            <div style="font-size:0.72em;font-weight:${isHoje?800:es.length?700:500};color:${isHoje?'var(--gold)':es.length?'#fff':'var(--text-dim)'};">${d}</div>
            ${es.length?`<div style="font-size:0.9em;color:${isPast?'rgba(255,255,255,0.3)':'#fff'}">★</div>`:''}
            ${es.length>1?`<div style="position:absolute;top:2px;right:2px;background:var(--gold);color:#000;border-radius:50%;width:12px;height:12px;font-size:0.45em;font-weight:800;display:flex;align-items:center;justify-content:center;">${es.length}</div>`:''}
        </div>`;
    }
    elGrid.innerHTML = html;

    // Lista do mês
    const lista = db.estrelas.filter(e=>{
        const [y,m]=e.data.split('-').map(Number); return y===_calAno&&m-1===_calMes;
    }).sort((a,b)=>a.data.localeCompare(b.data));

    if (!lista.length) {
        elList.innerHTML = `<div style="font-size:0.75em;color:var(--text-dim);">Nenhuma data marcada neste mês.</div>`;
        return;
    }
    elList.innerHTML = lista.map(e=>`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--s3);border:1px solid var(--border-s);border-radius:10px;opacity:${e.data<hoje?0.5:1};">
            <div style="font-size:1.2em;color:${e.data<hoje?'rgba(255,255,255,0.3)':'#fff'};">★</div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:0.82em;font-weight:700;color:var(--text);${e.data<hoje?'text-decoration:line-through;':''}">${e.nome}</div>
                <div style="font-size:0.65em;color:var(--text-dim);margin-top:2px;">${fmtData(e.data)}${e.notas?` · ${e.notas}`:''}</div>
            </div>
            <div style="display:flex;gap:4px;">
                <button class="op-btn" onclick="abrirModalEstrela('${e.id}')" style="padding:4px 7px;font-size:0.60em;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="op-btn descartar" onclick="excluirEstrela('${e.id}')" style="padding:4px 7px;font-size:0.60em;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
            </div>
        </div>`).join('');
}

// ══════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════

(async () => {
    const ok = await syncLoad();
    renderStatus(); renderOps(); renderRede(); renderFavores(); atualizarContadores();
    
    if (ok) toast('Dados carregados', 'success');
})();
