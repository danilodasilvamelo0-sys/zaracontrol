// ══════════════════════════════════════════════
//  OPERAÇÕES — ZARA | Centro de Comando
// ══════════════════════════════════════════════

const OP_KEY = 'zara_operacoes_v1';

function dadosVazios() {
    return {
        poder: {
            nivel: 5,
            tendencia: 'parado',
            inicioTendencia: hoje(),
            metasAtingidas: 0,
        },
        operacoes: [],
        aliados: [],
        favores: [],
    };
}

let dados = (() => {
    try { return JSON.parse(localStorage.getItem(OP_KEY)) || dadosVazios(); }
    catch { return dadosVazios(); }
})();

function salvar() { localStorage.setItem(OP_KEY, JSON.stringify(dados)); }
function gerarId() { return Date.now() + Math.random().toString(36).slice(2,6); }
function hoje() { return new Date().toISOString().slice(0,10); }
function diasDesde(data) {
    if (!data) return 0;
    return Math.floor((new Date() - new Date(data)) / 86400000);
}
function formatarData(d) {
    if (!d) return '';
    const [y,m,dia] = d.split('-');
    return `${dia}/${m}/${y}`;
}

// ── TOAST ──
function toast(msg, tipo) {
    const el = document.getElementById('opStatus');
    const ic = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
        error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    };
    const cor = { success:'rgba(30,132,73,0.96)', error:'rgba(180,45,35,0.96)', info:'rgba(30,60,100,0.96)' };
    el.innerHTML = (ic[tipo||'info']||ic.info) + `<span>${msg}</span>`;
    el.style.background = cor[tipo||'info'];
    el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(8px)'; }, 3000);
}

// ── MODAIS ──
function abrirModal(id) { document.getElementById(id).classList.add('active'); }
function fecharModal(id) { document.getElementById(id).classList.remove('active'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
});

// ── TABS ──
let _tabAtual = 'operacoes';
function showTab(tab, btn) {
    _tabAtual = tab;
    ['operacoes','status','rede','favores','estrela'].forEach(t => {
        const el = document.getElementById('tab_'+t);
        if (el) el.style.display = t === tab ? '' : 'none';
    });
    document.querySelectorAll('.op-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (tab === 'estrela') renderCalendario();
    atualizarContadores();
}

function atualizarContadores() {
    const ativas = dados.operacoes.filter(o => o.status === 'ativa').length;
    const el = document.getElementById('count_operacoes');
    if (el) el.textContent = ativas;
}

// ══════════════════════════════════════════════
//  STATUS DE PODER
// ══════════════════════════════════════════════
function setTendencia(t) {
    dados.poder.tendencia = t;
    dados.poder.inicioTendencia = hoje();
    salvar();
    renderStatus();
    toast(`Tendência atualizada: ${t}`, 'success');
}

function setNivel(n) {
    dados.poder.nivel = Math.min(10, Math.max(1, parseInt(n)));
    salvar();
    renderStatus();
}

function addMetaAtingida() {
    dados.poder.metasAtingidas = (dados.poder.metasAtingidas || 0) + 1;
    salvar();
    renderStatus();
    toast('Meta registrada!', 'success');
}

// Calcula metas: operações executadas + metas manuais
function calcMetasAtingidas() {
    const opExecutadas = dados.operacoes.filter(o => o.status === 'executada').length;
    return opExecutadas + (dados.poder.metasAtingidas || 0);
}

const TEND_ICONS = {
    subindo:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    parado:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    recuando: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
};

function renderStatus() {
    const p = dados.poder;
    const dias = diasDesde(p.inicioTendencia || hoje());
    const nivel = p.nivel || 5;
    const metas = calcMetasAtingidas();

    // Atualizar número, barra E o slider
    document.getElementById('statusNivel').textContent = nivel;
    document.getElementById('statusNivelBar').style.width = (nivel * 10) + '%';
    document.getElementById('statusNivelSub').textContent = `${nivel} / 10 — ${nivel >= 8 ? 'Alto impacto' : nivel >= 5 ? 'Em crescimento' : 'Construindo base'}`;
    const slider = document.getElementById('nivelSlider');
    if (slider) slider.value = nivel; // ← corrige o bug do slider sempre em 5

    const tEl = document.getElementById('statusTendencia');
    tEl.innerHTML = `
        <div class="poder-tendencia">
            <div class="poder-tendencia-icon ${p.tendencia}">${TEND_ICONS[p.tendencia]||TEND_ICONS.parado}</div>
            <div class="poder-tendencia-txt">
                <div class="poder-tendencia-nome ${p.tendencia}">${{subindo:'Subindo',parado:'Parado',recuando:'Recuando'}[p.tendencia]||'—'}</div>
                <div class="poder-tendencia-sub">Há ${dias} dia${dias!==1?'s':''}</div>
            </div>
        </div>`;

    document.getElementById('statusDias').innerHTML = `<div class="poder-tempo-val">${dias}d</div><div class="poder-tempo-sub">${p.tendencia === 'parado' ? 'sem se mover' : p.tendencia === 'subindo' ? 'em movimento' : 'recuando'}</div>`;
    document.getElementById('statusMetas').innerHTML = `<div class="poder-metas-atingidas"><div class="poder-metas-num">${metas}</div></div><div class="poder-kpi-label" style="font-size:0.62em;color:var(--text-dim);margin-top:4px;">metas atingidas</div>`;

    // Hero stats
    document.getElementById('heroNivel').textContent = nivel;
    document.getElementById('heroTendencia').textContent = {subindo:'↑ Subindo',parado:'→ Parado',recuando:'↓ Recuando'}[p.tendencia]||'—';
    document.getElementById('heroTendencia').className = 'op-kpi-val ' + p.tendencia;
    document.getElementById('heroDias').textContent = dias + 'd';
    document.getElementById('heroMetas').textContent = metas;
}

// ══════════════════════════════════════════════
//  OPERAÇÕES
// ══════════════════════════════════════════════
let _opEditId = null;
let _etapasModal = [];

function abrirModalOp(id) {
    _opEditId = id || null;
    _etapasModal = [];

    if (id) {
        const op = dados.operacoes.find(x => x.id === id);
        if (!op) return;
        document.getElementById('opNome').value   = op.nome;
        document.getElementById('opTipo').value   = op.tipo;
        document.getElementById('opPrio').value   = op.prio;
        document.getElementById('opAlvo').value   = op.alvo || '';
        document.getElementById('opNotas').value  = op.notas || '';
        _etapasModal = (op.etapas || []).map(e => ({...e}));
    } else {
        ['opNome','opAlvo','opNotas'].forEach(i => document.getElementById(i).value = '');
        document.getElementById('opTipo').value = 'jogada';
        document.getElementById('opPrio').value = 'media';
        _etapasModal = [];
    }
    renderEtapasModal();
    abrirModal('modalOp');
    setTimeout(() => document.getElementById('opNome').focus(), 100);
}

function renderEtapasModal() {
    const el = document.getElementById('etapasInputList');
    el.innerHTML = _etapasModal.map((e, i) => `
        <div class="etapa-input-row">
            <input type="text" value="${e.texto}" oninput="_etapasModal[${i}].texto=this.value" placeholder="Etapa ${i+1}...">
            <button class="etapa-rem" onclick="_etapasModal.splice(${i},1);renderEtapasModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>`).join('');
}

function addEtapaModal() {
    _etapasModal.push({ id: gerarId(), texto: '', feita: false });
    renderEtapasModal();
    const inputs = document.querySelectorAll('#etapasInputList input');
    if (inputs.length) inputs[inputs.length-1].focus();
}

function salvarOp() {
    const nome = document.getElementById('opNome').value.trim();
    if (!nome) { toast('Informe o nome da operação.', 'error'); return; }
    const etapas = _etapasModal.filter(e => e.texto.trim());
    const obj = {
        nome,
        tipo:   document.getElementById('opTipo').value,
        prio:   document.getElementById('opPrio').value,
        alvo:   document.getElementById('opAlvo').value.trim(),
        notas:  document.getElementById('opNotas').value.trim(),
        etapas,
    };
    if (_opEditId) {
        Object.assign(dados.operacoes.find(x => x.id === _opEditId) || {}, obj);
        toast('Operação atualizada.', 'success');
    } else {
        dados.operacoes.push({ id: gerarId(), ...obj, status: 'ativa', criadaEm: hoje() });
        toast('Operação criada!', 'success');
    }
    salvar(); fecharModal('modalOp'); renderOperacoes();
}

function mudarStatusOp(id, novoStatus) {
    const op = dados.operacoes.find(x => x.id === id);
    if (!op) return;
    op.status = novoStatus;
    op.atualizadaEm = hoje();
    salvar(); renderOperacoes(); renderStatus();
    const label = {executada:'Operação executada! Meta contabilizada.',suspensa:'Operação suspensa.',descartada:'Operação descartada.',ativa:'Operação reativada.'};
    toast(label[novoStatus]||'Status atualizado.', novoStatus === 'executada' ? 'success' : 'info');
}

function excluirOp(id) {
    if (!confirm('Excluir esta operação permanentemente?')) return;
    dados.operacoes = dados.operacoes.filter(x => x.id !== id);
    salvar(); renderOperacoes(); renderStatus(); toast('Operação removida.', 'info');
}

function toggleEtapa(opId, etapaId) {
    const op = dados.operacoes.find(x => x.id === opId);
    if (!op) return;
    const et = op.etapas.find(e => e.id === etapaId);
    if (et) { et.feita = !et.feita; salvar(); renderOperacoes(); }
}

const BTN_STATUS = {
    ativa:     `<button class="op-btn executar" onclick="mudarStatusOp('ID','executada')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Executar</button>
                <button class="op-btn suspender" onclick="mudarStatusOp('ID','suspensa')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Suspender</button>
                <button class="op-btn descartar" onclick="mudarStatusOp('ID','descartada')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>Descartar</button>`,
    suspensa:  `<button class="op-btn reativar" onclick="mudarStatusOp('ID','ativa')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>Reativar</button>
                <button class="op-btn descartar" onclick="mudarStatusOp('ID','descartada')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>Descartar</button>`,
    executada: `<button class="op-btn reativar" onclick="mudarStatusOp('ID','ativa')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>Reabrir</button>`,
    descartada:`<button class="op-btn reativar" onclick="mudarStatusOp('ID','ativa')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>Reativar</button>`,
};

let _filtroStatus = 'ativa';
function setFiltroStatus(s, btn) {
    _filtroStatus = s;
    document.querySelectorAll('.filtro-status-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderOperacoes();
}

function renderOperacoes() {
    const el = document.getElementById('opList');
    const filtradas = dados.operacoes.filter(o => _filtroStatus === 'todas' ? true : o.status === _filtroStatus);

    if (!filtradas.length) {
        el.innerHTML = `<div class="op-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            ${_filtroStatus === 'ativa' ? 'Nenhuma operação ativa.<br>Crie sua primeira jogada.' : 'Nenhuma operação aqui.'}
        </div>`;
        atualizarContadores();
        return;
    }

    el.innerHTML = filtradas.map(op => {
        const etapasTotal = (op.etapas||[]).length;
        const etapasFeit  = (op.etapas||[]).filter(e=>e.feita).length;
        const pctEtapas   = etapasTotal > 0 ? Math.round((etapasFeit/etapasTotal)*100) : null;

        const etapasHtml = (op.etapas||[]).length ? `
            <div class="op-etapas">
                ${op.etapas.map(e => `
                    <div class="op-etapa${e.feita?' feita':''}" onclick="toggleEtapa('${op.id}','${e.id}')">
                        <div class="op-etapa-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                        <span class="op-etapa-txt">${e.texto}</span>
                    </div>`).join('')}
            </div>` : '';

        const notasHtml = op.notas ? `<div class="op-card-notas">${op.notas}</div>` : '';

        const btns = (BTN_STATUS[op.status]||'').replace(/ID/g, op.id);

        return `<div class="op-card" data-status="${op.status}">
            <div class="op-card-inner">
                <div class="op-card-stripe"></div>
                <div class="op-card-body">
                    <div class="op-card-top">
                        <div class="op-card-nome">${op.nome}</div>
                        <div class="op-card-badges">
                            <span class="op-badge ${op.status}">${{ativa:'Ativa',suspensa:'Suspensa',executada:'Executada',descartada:'Descartada'}[op.status]||op.status}</span>
                            <span class="op-badge ${op.tipo}">${op.tipo==='missao'?'Missão':'Jogada'}</span>
                            <span class="op-badge ${op.prio}">${{alta:'Alta',media:'Média',baixa:'Baixa'}[op.prio]||op.prio}</span>
                        </div>
                    </div>
                    <div class="op-card-meta">
                        ${op.alvo ? `<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${op.alvo}</span>` : ''}
                        ${pctEtapas !== null ? `<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>${etapasFeit}/${etapasTotal} etapas (${pctEtapas}%)</span>` : ''}
                        ${op.criadaEm ? `<span>Criada ${formatarData(op.criadaEm)}</span>` : ''}
                    </div>
                    ${etapasHtml}
                    ${notasHtml}
                    <div class="op-card-acoes">
                        ${btns}
                        <button class="op-btn" onclick="abrirModalOp('${op.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Editar
                        </button>
                        <button class="op-btn descartar" onclick="excluirOp('${op.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                        </button>
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
let _aliadoEditId = null;

function abrirModalAliado(id) {
    _aliadoEditId = id || null;
    if (id) {
        const a = dados.aliados.find(x => x.id === id);
        if (!a) return;
        document.getElementById('alNome').value     = a.nome;
        document.getElementById('alCargo').value    = a.cargo || '';
        document.getElementById('alConf').value     = a.confianca || 3;
        document.getElementById('alUtil').value     = a.utilidade || '';
        document.getElementById('alNotes').value    = a.notas || '';
    } else {
        ['alNome','alCargo','alUtil','alNotes'].forEach(i => document.getElementById(i).value = '');
        document.getElementById('alConf').value = 3;
    }
    abrirModal('modalAliado');
    setTimeout(() => document.getElementById('alNome').focus(), 100);
}

function salvarAliado() {
    const nome = document.getElementById('alNome').value.trim();
    if (!nome) { toast('Informe o nome.', 'error'); return; }
    const obj = {
        nome,
        cargo:     document.getElementById('alCargo').value.trim(),
        confianca: parseInt(document.getElementById('alConf').value) || 3,
        utilidade: document.getElementById('alUtil').value.trim(),
        notas:     document.getElementById('alNotes').value.trim(),
    };
    // Garantir que o array existe antes de salvar
    if (!Array.isArray(dados.aliados)) dados.aliados = [];

    if (_aliadoEditId) {
        const idx = dados.aliados.findIndex(x => x.id === _aliadoEditId);
        if (idx >= 0) dados.aliados[idx] = { ...dados.aliados[idx], ...obj };
        toast('Aliado atualizado.', 'success');
    } else {
        const novo = { id: gerarId(), ...obj };
        dados.aliados.push(novo);
        toast('Aliado adicionado!', 'success');
    }

    // Salvar e verificar
    const chave = JSON.stringify(dados);
    localStorage.setItem(OP_KEY, chave);

    // Confirmar que salvou
    const verificar = JSON.parse(localStorage.getItem(OP_KEY) || '{}');
    if (!verificar.aliados || verificar.aliados.length !== dados.aliados.length) {
        toast('Erro ao salvar. Tente novamente.', 'error');
        return;
    }

    fecharModal('modalAliado');
    renderRede();
}

function excluirAliado(id) {
    dados.aliados = dados.aliados.filter(x => x.id !== id);
    salvar(); renderRede(); toast('Removido da rede.', 'info');
}

function renderRede() {
    const el = document.getElementById('redeList');
    const sub = document.getElementById('redeSubtitle');
    sub.textContent = `${dados.aliados.length} pessoa${dados.aliados.length!==1?'s':''} na rede`;

    if (!dados.aliados.length) {
        el.innerHTML = `<div class="op-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Sua rede está vazia.<br>Adicione aliados e pessoas de interesse.
        </div>`; return;
    }

    const sorted = [...dados.aliados].sort((a,b) => (b.confianca||0) - (a.confianca||0));
    el.innerHTML = sorted.map(a => {
        const iniciais = a.nome.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase();
        const estrelas = [1,2,3,4,5].map(i =>
            `<span class="confianca-star${i <= (a.confianca||0) ? ' ativa':''}">★</span>`
        ).join('');
        return `<div class="aliado-card">
            <div class="aliado-avatar">${iniciais}</div>
            <div class="aliado-info">
                <div class="aliado-nome">${a.nome}</div>
                ${a.cargo ? `<div class="aliado-cargo">${a.cargo}</div>` : ''}
                ${a.utilidade ? `<div class="aliado-notas">${a.utilidade}</div>` : ''}
                ${a.notas ? `<div class="aliado-notas" style="margin-top:2px;color:rgba(240,236,228,0.3)">${a.notas}</div>` : ''}
            </div>
            <div class="aliado-confianca">${estrelas}</div>
            <div class="aliado-acoes">
                <button class="aliado-btn" onclick="abrirModalAliado('${a.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="aliado-btn del" onclick="excluirAliado('${a.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
            </div>
        </div>`;
    }).join('');
}

// ══════════════════════════════════════════════
//  LIVRO DE FAVORES
// ══════════════════════════════════════════════
let _favorEditId = null;
let _favTab = 'receber';

function showFavTab(t, btn) {
    _favTab = t;
    document.querySelectorAll('.fav-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderFavores();
}

function abrirModalFavor(id) {
    _favorEditId = id || null;
    if (id) {
        const f = dados.favores.find(x => x.id === id);
        if (!f) return;
        document.getElementById('favPessoa').value  = f.pessoa;
        document.getElementById('favTipo').value    = f.tipo;
        document.getElementById('favDesc').value    = f.descricao || '';
        document.getElementById('favPeso').value    = f.peso || 'medio';
    } else {
        ['favPessoa','favDesc'].forEach(i => document.getElementById(i).value = '');
        document.getElementById('favTipo').value = _favTab;
        document.getElementById('favPeso').value = 'medio';
    }
    abrirModal('modalFavor');
    setTimeout(() => document.getElementById('favPessoa').focus(), 100);
}

function salvarFavor() {
    const pessoa = document.getElementById('favPessoa').value.trim();
    if (!pessoa) { toast('Informe o nome da pessoa.', 'error'); return; }
    const obj = {
        pessoa,
        tipo:      document.getElementById('favTipo').value,
        descricao: document.getElementById('favDesc').value.trim(),
        peso:      document.getElementById('favPeso').value,
        resolvido: false,
    };
    if (_favorEditId) {
        Object.assign(dados.favores.find(x => x.id === _favorEditId)||{}, obj);
        toast('Favor atualizado.', 'success');
    } else {
        dados.favores.push({ id: gerarId(), ...obj, data: hoje() });
        toast('Favor registrado!', 'success');
    }
    salvar(); fecharModal('modalFavor'); renderFavores();
}

function resolverFavor(id) {
    const f = dados.favores.find(x => x.id === id);
    if (f) { f.resolvido = !f.resolvido; salvar(); renderFavores(); }
}

function excluirFavor(id) {
    dados.favores = dados.favores.filter(x => x.id !== id);
    salvar(); renderFavores(); toast('Favor removido.', 'info');
}

const PESO_ICONS = {
    leve:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg>',
    medio:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    pesado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
};

function renderFavores() {
    const el = document.getElementById('favoresList');
    const sub = document.getElementById('favoresSubtitle');

    const filtrados = dados.favores.filter(f => f.tipo === _favTab);
    const pendentes = filtrados.filter(f => !f.resolvido).length;
    sub.textContent = `${pendentes} pendente${pendentes!==1?'s':''} · ${filtrados.length} total`;

    if (!filtrados.length) {
        el.innerHTML = `<div class="op-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            ${_favTab === 'receber' ? 'Ninguém te deve nada — ou você ainda não registrou.' : 'Nenhum favor a pagar registrado.'}
        </div>`; return;
    }

    const sorted = [...filtrados].sort((a,b) => {
        if (a.resolvido !== b.resolvido) return a.resolvido ? 1 : -1;
        const pesoOrd = { pesado:0, medio:1, leve:2 };
        return (pesoOrd[a.peso]||1) - (pesoOrd[b.peso]||1);
    });

    el.innerHTML = sorted.map(f => {
        const icon = f.tipo === 'receber'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';
        return `<div class="favor-item${f.resolvido?' resolvido':''}">
            <div class="favor-tipo-icon ${f.tipo}">${icon}</div>
            <div class="favor-info">
                <div class="favor-pessoa">${f.pessoa}</div>
                ${f.descricao ? `<div class="favor-desc">${f.descricao}</div>` : ''}
                <div class="favor-meta">
                    <span class="favor-peso ${f.peso}">${PESO_ICONS[f.peso]||''}${{leve:'Leve',medio:'Médio',pesado:'Pesado'}[f.peso]||f.peso}</span>
                    ${f.data ? `<span style="font-size:0.62em;color:var(--text-dim)">${formatarData(f.data)}</span>` : ''}
                    ${f.resolvido ? '<span style="font-size:0.62em;color:var(--green-b);font-weight:700">✓ Resolvido</span>' : ''}
                </div>
            </div>
            <div class="favor-acoes">
                <button class="favor-btn resolver" onclick="resolverFavor('${f.id}')" title="${f.resolvido?'Reabrir':'Marcar como resolvido'}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <button class="favor-btn" onclick="abrirModalFavor('${f.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="favor-btn del" onclick="excluirFavor('${f.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
            </div>
        </div>`;
    }).join('');
}

// ══════════════════════════════════════════════
//  ESTRELA NEGRA — Calendário de Execuções
// ══════════════════════════════════════════════
let _calAno  = new Date().getFullYear();
let _calMes  = new Date().getMonth(); // 0-11
let _estrelaEditId = null;

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function navMes(delta) {
    _calMes += delta;
    if (_calMes > 11) { _calMes = 0;  _calAno++; }
    if (_calMes <  0) { _calMes = 11; _calAno--; }
    renderCalendario();
}

function abrirModalEstrela(id, dataPresel) {
    _estrelaEditId = id || null;
    if (id) {
        const e = (dados.estrelas||[]).find(x => x.id === id);
        if (!e) return;
        document.getElementById('estrelaData').value  = e.data;
        document.getElementById('estrelaNome').value  = e.nome;
        document.getElementById('estrelaNotas').value = e.notas || '';
    } else {
        document.getElementById('estrelaData').value  = dataPresel || hoje();
        document.getElementById('estrelaNome').value  = '';
        document.getElementById('estrelaNotas').value = '';
    }
    abrirModal('modalEstrela');
    setTimeout(() => document.getElementById('estrelaNome').focus(), 100);
}

function salvarEstrela() {
    const data = document.getElementById('estrelaData').value;
    const nome = document.getElementById('estrelaNome').value.trim();
    if (!data) { toast('Escolha uma data.', 'error'); return; }
    if (!nome) { toast('Informe o alvo ou meta.', 'error'); return; }
    const obj = { data, nome, notas: document.getElementById('estrelaNotas').value.trim() };
    if (!dados.estrelas) dados.estrelas = [];
    if (_estrelaEditId) {
        Object.assign(dados.estrelas.find(x => x.id === _estrelaEditId)||{}, obj);
        toast('Atualizado.', 'success');
    } else {
        dados.estrelas.push({ id: gerarId(), ...obj, criadaEm: hoje() });
        toast('Data marcada com Estrela Negra.', 'success');
    }
    salvar(); fecharModal('modalEstrela'); renderCalendario();
}

function excluirEstrela(id) {
    dados.estrelas = (dados.estrelas||[]).filter(x => x.id !== id);
    salvar(); renderCalendario();
}

function renderCalendario() {
    if (!dados.estrelas) dados.estrelas = [];

    // Título do mês
    document.getElementById('calMesTitulo').textContent =
        `${MESES_PT[_calMes]} ${_calAno}`;

    // Primeiro dia da semana e total de dias
    const primeiroDia = new Date(_calAno, _calMes, 1).getDay(); // 0=Dom
    const totalDias   = new Date(_calAno, _calMes + 1, 0).getDate();
    const hojeStr     = hoje();

    // Mapear estrelas do mês por dia
    const estrelasDia = {};
    dados.estrelas.forEach(e => {
        const [y,m,d] = e.data.split('-').map(Number);
        if (y === _calAno && m-1 === _calMes) {
            if (!estrelasDia[d]) estrelasDia[d] = [];
            estrelasDia[d].push(e);
        }
    });

    const grid = document.getElementById('calGrid');
    let html = '';

    // Células vazias antes do primeiro dia
    for (let i = 0; i < primeiroDia; i++) {
        html += `<div style="aspect-ratio:1;"></div>`;
    }

    // Dias do mês
    for (let dia = 1; dia <= totalDias; dia++) {
        const dataStr = `${_calAno}-${String(_calMes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
        const estrelasAqui = estrelasDia[dia] || [];
        const isHoje = dataStr === hojeStr;
        const temEstrela = estrelasAqui.length > 0;
        const isPast = dataStr < hojeStr;

        const bgColor = isHoje
            ? 'background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.4);'
            : temEstrela
                ? 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);'
                : 'background:transparent;border:1px solid transparent;';

        const estrelaHtml = temEstrela
            ? `<div style="font-size:0.9em;line-height:1;margin-top:2px;color:${isPast?'rgba(255,255,255,0.3)':'#ffffff'}" title="${estrelasAqui.map(e=>e.nome).join(', ')}">★</div>`
            : '';

        const badgeCount = estrelasAqui.length > 1
            ? `<div style="position:absolute;top:2px;right:2px;background:var(--gold);color:#000;border-radius:50%;width:12px;height:12px;font-size:0.45em;font-weight:800;display:flex;align-items:center;justify-content:center;">${estrelasAqui.length}</div>`
            : '';

        html += `<div onclick="abrirModalEstrela(null,'${dataStr}')"
            style="aspect-ratio:1;border-radius:8px;${bgColor}
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            cursor:pointer;transition:all 0.15s;position:relative;
            opacity:${isPast&&!temEstrela?'0.3':'1'};"
            onmouseover="this.style.background='rgba(201,168,76,0.08)'"
            onmouseout="this.style.background='${temEstrela?'rgba(255,255,255,0.04)':isHoje?'rgba(201,168,76,0.15)':'transparent'}'">
            <div style="font-size:0.72em;font-weight:${isHoje?'800':temEstrela?'700':'500'};color:${isHoje?'var(--gold)':temEstrela?'var(--text)':'var(--text-dim)'};">${dia}</div>
            ${estrelaHtml}
            ${badgeCount}
        </div>`;
    }

    grid.innerHTML = html;

    // Lista de estrelas do mês
    const lista = document.getElementById('estrelasLista');
    const todasEstrelas = (dados.estrelas||[])
        .filter(e => { const [y,m] = e.data.split('-').map(Number); return y===_calAno && m-1===_calMes; })
        .sort((a,b) => a.data.localeCompare(b.data));

    if (!todasEstrelas.length) {
        lista.innerHTML = `<div style="font-size:0.75em;color:var(--text-dim);padding:8px 0;">Nenhuma data marcada neste mês.</div>`;
        return;
    }

    lista.innerHTML = todasEstrelas.map(e => {
        const [y,m,d] = e.data.split('-').map(Number);
        const isPast = e.data < hojeStr;
        return `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;
            background:var(--s3);border:1px solid var(--border-s);border-radius:10px;
            opacity:${isPast?'0.5':'1'};">
            <div style="font-size:1.2em;color:${isPast?'rgba(255,255,255,0.3)':'#ffffff'};flex-shrink:0;">★</div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:0.82em;font-weight:700;color:var(--text);${isPast?'text-decoration:line-through;':''}">${e.nome}</div>
                <div style="font-size:0.65em;color:var(--text-dim);margin-top:2px;">
                    ${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}
                    ${isPast ? '<span style="color:rgba(255,255,255,0.25);margin-left:8px;">Passado</span>' : ''}
                    ${e.notas ? `<span style="margin-left:8px;font-style:italic;">${e.notas}</span>` : ''}
                </div>
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0;">
                <button class="op-btn" onclick="abrirModalEstrela('${e.id}')" style="font-size:0.60em;padding:4px 7px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="op-btn descartar" onclick="excluirEstrela('${e.id}')" style="font-size:0.60em;padding:4px 7px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
            </div>
        </div>`;
    }).join('');
}

// ══════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════
// Garantir estrutura completa mesmo com dados parciais do localStorage
if (!dados.poder    || typeof dados.poder !== 'object') dados.poder    = dadosVazios().poder;
if (!Array.isArray(dados.operacoes)) dados.operacoes = [];
if (!Array.isArray(dados.aliados))   dados.aliados   = [];
if (!Array.isArray(dados.favores))   dados.favores   = [];
if (!Array.isArray(dados.estrelas))  dados.estrelas  = [];
if (typeof dados.poder.nivel !== 'number') dados.poder.nivel = 5;

renderStatus();
renderOperacoes();
renderRede();
renderFavores();
atualizarContadores();
