// ══════════════════════════════════════════
//  NOTAS — ZARA | Bloco de Anotações
// ══════════════════════════════════════════

const NOTAS_KEY = 'zara_notas_v1';

function dadosVazios() {
    return {
        categorias: [
            { id: 'geral',    nome: 'Geral',    cor: '#c9a84c' },
            { id: 'trabalho', nome: 'Trabalho', cor: '#3498db' },
            { id: 'ideias',   nome: 'Ideias',   cor: '#9b59b6' },
        ],
        notas: [],
    };
}

let db = (() => {
    try { return JSON.parse(localStorage.getItem(NOTAS_KEY)) || dadosVazios(); }
    catch { return dadosVazios(); }
})();

function salvarDB() { localStorage.setItem(NOTAS_KEY, JSON.stringify(db)); }
function gerarId()  { return Date.now() + Math.random().toString(36).slice(2,6); }

function formatarData(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const hoje = new Date();
    const diff = Math.floor((hoje - d) / 86400000);
    if (diff === 0) return 'Hoje ' + d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    if (diff === 1) return 'Ontem';
    if (diff < 7)  return diff + ' dias atrás';
    return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
}

// ── TOAST ──
function toast(msg, tipo) {
    const el = document.getElementById('notasStatus');
    const cor = { success:'rgba(30,130,70,0.96)', error:'rgba(180,45,35,0.96)', info:'rgba(30,60,100,0.96)' };
    el.textContent = msg;
    el.style.background = cor[tipo||'info'];
    el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; }, 2500);
}

// ── MODAIS ──
function abrirModal(id) { document.getElementById(id).classList.add('active'); }
function fecharModal(id) { document.getElementById(id).classList.remove('active'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
});

// ══════════════════════════════════════════
//  ESTADO
// ══════════════════════════════════════════
let _catAtiva  = null; // null = todas
let _notaAtiva = null; // id da nota aberta
let _busca     = '';
let _autoSaveTimer = null;

// ══════════════════════════════════════════
//  CATEGORIAS
// ══════════════════════════════════════════
const CORES_CAT = ['#c9a84c','#3498db','#9b59b6','#2ecc71','#e74c3c','#e67e22','#1abc9c','#e91e63'];

function abrirModalCat() {
    document.getElementById('catNome').value = '';
    document.getElementById('catCor').value  = CORES_CAT[db.categorias.length % CORES_CAT.length];
    abrirModal('modalCat');
    setTimeout(() => document.getElementById('catNome').focus(), 100);
}

function salvarCat() {
    const nome = document.getElementById('catNome').value.trim();
    if (!nome) { toast('Informe o nome.', 'error'); return; }
    const cor = document.getElementById('catCor').value || '#c9a84c';
    db.categorias.push({ id: gerarId(), nome, cor });
    salvarDB(); fecharModal('modalCat');
    renderCats(); renderEditorCatSel();
    toast('Categoria criada!', 'success');
}

function excluirCat(id) {
    if (!confirm('Excluir categoria? As notas serão movidas para Geral.')) return;
    db.notas.forEach(n => { if (n.categoriaId === id) n.categoriaId = 'geral'; });
    db.categorias = db.categorias.filter(c => c.id !== id);
    if (_catAtiva === id) _catAtiva = null;
    salvarDB(); renderCats(); renderNotas(); renderEditorCatSel();
}

function selecionarCat(id) {
    _catAtiva = id;
    renderCats();
    renderNotas();
}

function renderCats() {
    const el = document.getElementById('catsList');

    // "Todas" primeiro
    const totalNotas = db.notas.length;
    let html = `<div class="cat-item${_catAtiva === null ? ' active' : ''}" onclick="selecionarCat(null)">
        <div class="cat-dot" style="background:var(--gold)"></div>
        <div class="cat-nome">Todas</div>
        <div class="cat-count">${totalNotas}</div>
    </div>`;

    db.categorias.forEach(c => {
        const count = db.notas.filter(n => n.categoriaId === c.id).length;
        html += `<div class="cat-item${_catAtiva === c.id ? ' active' : ''}" onclick="selecionarCat('${c.id}')">
            <div class="cat-dot" style="background:${c.cor}"></div>
            <div class="cat-nome">${c.nome}</div>
            <div class="cat-count">${count}</div>
            ${c.id !== 'geral' ? `<button class="cat-del" onclick="event.stopPropagation();excluirCat('${c.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>` : ''}
        </div>`;
    });

    el.innerHTML = html;
}

function renderEditorCatSel() {
    const sel = document.getElementById('editorCatSel');
    if (!sel) return;
    sel.innerHTML = db.categorias.map(c =>
        `<option value="${c.id}">${c.nome}</option>`
    ).join('');
    // Setar categoria da nota ativa
    if (_notaAtiva) {
        const nota = db.notas.find(n => n.id === _notaAtiva);
        if (nota) sel.value = nota.categoriaId || 'geral';
    }
}

// ══════════════════════════════════════════
//  NOTAS
// ══════════════════════════════════════════
function notasFiltradas() {
    let lista = [...db.notas];
    // Filtrar por categoria
    if (_catAtiva !== null) lista = lista.filter(n => n.categoriaId === _catAtiva);
    // Filtrar por busca
    if (_busca.trim()) {
        const q = _busca.trim().toLowerCase();
        lista = lista.filter(n =>
            n.titulo.toLowerCase().includes(q) ||
            n.conteudo.toLowerCase().includes(q)
        );
    }
    // Pinadas primeiro, depois por data
    lista.sort((a, b) => {
        if (a.fixada && !b.fixada) return -1;
        if (!a.fixada && b.fixada) return 1;
        return new Date(b.atualizadaEm) - new Date(a.atualizadaEm);
    });
    return lista;
}

function novaNota() {
    const catId = _catAtiva || 'geral';
    const nota = {
        id:          gerarId(),
        titulo:      '',
        conteudo:    '',
        categoriaId: catId,
        fixada:      false,
        criadaEm:    new Date().toISOString(),
        atualizadaEm:new Date().toISOString(),
    };
    db.notas.unshift(nota);
    salvarDB();
    renderNotas();
    abrirNota(nota.id);
    setTimeout(() => document.getElementById('editorTitulo').focus(), 100);
}

function abrirNota(id) {
    _notaAtiva = id;
    renderNotas(); // atualizar selected
    const nota = db.notas.find(n => n.id === id);
    if (!nota) { mostrarEditorVazio(); return; }

    document.getElementById('editorVazio').style.display = 'none';
    document.getElementById('editorConteudo').style.display = 'flex';

    document.getElementById('editorTitulo').value   = nota.titulo;
    document.getElementById('editorTexto').value    = nota.conteudo;
    document.getElementById('editorCatSel').value   = nota.categoriaId || 'geral';
    document.getElementById('btnPin').classList.toggle('active', !!nota.fixada);
}

function mostrarEditorVazio() {
    document.getElementById('editorVazio').style.display = 'flex';
    document.getElementById('editorConteudo').style.display = 'none';
}

function excluirNota(id) {
    if (!confirm('Excluir esta nota?')) return;
    db.notas = db.notas.filter(n => n.id !== id);
    salvarDB();
    if (_notaAtiva === id) { _notaAtiva = null; mostrarEditorVazio(); }
    renderNotas(); renderCats();
}

function togglePin() {
    if (!_notaAtiva) return;
    const nota = db.notas.find(n => n.id === _notaAtiva);
    if (!nota) return;
    nota.fixada = !nota.fixada;
    salvarDB();
    document.getElementById('btnPin').classList.toggle('active', nota.fixada);
    renderNotas();
}

function onCatChange(sel) {
    if (!_notaAtiva) return;
    const nota = db.notas.find(n => n.id === _notaAtiva);
    if (!nota) return;
    nota.categoriaId = sel.value;
    nota.atualizadaEm = new Date().toISOString();
    salvarDB();
    renderNotas(); renderCats();
}

// Auto-save enquanto digita
function onEditorInput() {
    if (!_notaAtiva) return;
    clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(() => {
        const nota = db.notas.find(n => n.id === _notaAtiva);
        if (!nota) return;
        nota.titulo      = document.getElementById('editorTitulo').value;
        nota.conteudo    = document.getElementById('editorTexto').value;
        nota.atualizadaEm= new Date().toISOString();
        salvarDB();
        renderNotas(); renderCats();
        // Mostrar "Salvo"
        const salvoEl = document.getElementById('editorSalvo');
        salvoEl.classList.add('show');
        setTimeout(() => salvoEl.classList.remove('show'), 1500);
    }, 600);
}

function renderNotas() {
    const lista = notasFiltradas();
    const el    = document.getElementById('notasLista');
    const titulo = document.getElementById('colNotasTitulo');

    // Título da coluna
    if (_catAtiva === null) {
        titulo.textContent = 'Todas as Notas';
    } else {
        const cat = db.categorias.find(c => c.id === _catAtiva);
        titulo.textContent = cat ? cat.nome : 'Notas';
    }

    if (!lista.length) {
        el.innerHTML = `<div class="notas-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <p>${_busca ? 'Nenhuma nota encontrada.' : 'Nenhuma nota aqui.<br>Clique em + para começar.'}</p>
        </div>`;
        return;
    }

    el.innerHTML = lista.map(n => {
        const cat = db.categorias.find(c => c.id === n.categoriaId);
        const cor = cat ? cat.cor : '#c9a84c';
        const preview = n.conteudo.replace(/\n/g, ' ').trim();
        return `<div class="nota-item${_notaAtiva === n.id ? ' active' : ''}" onclick="abrirNota('${n.id}')">
            <div class="nota-item-topo">
                ${n.fixada ? '<span class="nota-item-pin"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0" style="width:10px;height:10px;"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg></span>' : ''}
                <div class="nota-item-titulo">${n.titulo || 'Sem título'}</div>
            </div>
            <div class="nota-item-data">${formatarData(n.atualizadaEm)}</div>
            ${preview ? `<div class="nota-item-preview">${preview}</div>` : ''}
            <div class="nota-item-cat-dot" style="background:${cor}"></div>
        </div>`;
    }).join('');
}

// ══════════════════════════════════════════
//  BUSCA
// ══════════════════════════════════════════
document.getElementById('buscaInput').addEventListener('input', function() {
    _busca = this.value;
    renderNotas();
});

// ══════════════════════════════════════════
//  EDITOR — eventos
// ══════════════════════════════════════════
document.getElementById('editorTitulo').addEventListener('input', onEditorInput);
document.getElementById('editorTexto').addEventListener('input', onEditorInput);

// Tab no textarea — inserir espaços em vez de mudar foco
document.getElementById('editorTexto').addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const s = this.selectionStart;
        const v = this.value;
        this.value = v.slice(0,s) + '    ' + v.slice(this.selectionEnd);
        this.selectionStart = this.selectionEnd = s + 4;
    }
});

// ══════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════
if (!db.categorias) db.categorias = dadosVazios().categorias;
if (!db.notas)      db.notas      = [];

renderCats();
renderNotas();
renderEditorCatSel();
mostrarEditorVazio();
