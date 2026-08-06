// ══════════════════════════════════════════
//  NOTAS — ZARA | com Sync Supabase
// ══════════════════════════════════════════

const NOTAS_KEY = 'zara_notas_v1';

const CORES = ['#c9a84c','#3498db','#9b59b6','#2ecc71','#e74c3c','#e67e22','#1abc9c','#e91e63','#f39c12','#16a085'];

function dadosVazios() {
    return {
        cats: [
            { id:'geral',    nome:'Geral',    cor:'#c9a84c' },
            { id:'trabalho', nome:'Trabalho', cor:'#3498db' },
            { id:'ideias',   nome:'Ideias',   cor:'#9b59b6' },
        ],
        notas: [],
    };
}

// ── SYNC SUPABASE ──
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
        await _sb.from('notas').upsert({
            id: USER_ID, user_id: USER_ID,
            dados: db, updated_at: new Date().toISOString()
        });
    } catch(e) { console.error('syncSave:', e); }
}

async function syncLoad() {
    if (!_useSync) return false;
    try {
        const { data, error } = await _sb.from('notas')
            .select('dados').eq('user_id', USER_ID).maybeSingle();
        if (error || !data?.dados) return false;
        db = Object.assign(dadosVazios(), data.dados);
        localStorage.setItem(NOTAS_KEY, JSON.stringify(db));
        return true;
    } catch(e) { console.error('syncLoad:', e); return false; }
}
// ──────────────────

let db = (() => {
    try {
        const raw = localStorage.getItem(NOTAS_KEY);
        if (!raw) return dadosVazios();
        const p = JSON.parse(raw);
        return (p && typeof p === 'object') ? p : dadosVazios();
    } catch { return dadosVazios(); }
})();
if (!db.cats)  db.cats  = dadosVazios().cats;
if (!db.notas) db.notas = [];

function save() {
    localStorage.setItem(NOTAS_KEY, JSON.stringify(db));
    syncSave();
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,5); }

function dataRelativa(iso) {
    if (!iso) return '';
    const d = new Date(iso), h = new Date();
    const diff = Math.floor((h-d)/86400000);
    if (diff===0) return 'Hoje '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    if (diff===1) return 'Ontem';
    if (diff<7)   return diff+'d atrás';
    return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
}

// Toast
function toast(msg, tipo) {
    const el = document.getElementById('notasToast');
    if (!el) return;
    const cores = {success:'rgba(30,130,70,0.96)',error:'rgba(180,45,35,0.96)',info:'rgba(30,60,100,0.96)'};
    el.textContent = msg;
    el.style.background = cores[tipo||'info'];
    el.style.opacity='1'; el.style.transform='translateY(0)';
    clearTimeout(el._t);
    el._t = setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(8px)'; }, 2500);
}

// Modais
function abrirModal(id)  { const el=document.getElementById(id); if(el) el.classList.add('active'); }
function fecharModal(id) { const el=document.getElementById(id); if(el) el.classList.remove('active'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if(e.target===m) m.classList.remove('active'); });
});

// Estado
let _catAtiva  = null;
let _notaAtiva = null;
let _busca     = '';
let _corSel    = CORES[0];
let _timer     = null;

// ── CATEGORIAS ──
function abrirModalCat() {
    document.getElementById('catNome').value = '';
    _corSel = CORES[db.cats.length % CORES.length];
    renderCoresGrid();
    abrirModal('modalCat');
    setTimeout(()=>document.getElementById('catNome').focus(),100);
}

function renderCoresGrid() {
    document.getElementById('coresGrid').innerHTML = CORES.map(c=>
        `<div class="cor-opt${_corSel===c?' selecionada':''}" style="background:${c}" onclick="_corSel='${c}';renderCoresGrid()"></div>`
    ).join('');
}

function salvarCat() {
    const nome = document.getElementById('catNome').value.trim();
    if (!nome) { toast('Informe o nome.','error'); return; }
    db.cats.push({ id:uid(), nome, cor:_corSel });
    save(); fecharModal('modalCat'); renderCats(); renderCatSel();
    toast('Categoria criada!','success');
}

function excluirCat(id) {
    if (!confirm('Excluir categoria? As notas irão para Geral.')) return;
    db.notas.forEach(n=>{ if(n.catId===id) n.catId='geral'; });
    db.cats = db.cats.filter(c=>c.id!==id);
    if (_catAtiva===id) _catAtiva=null;
    save(); renderCats(); renderNotas(); renderCatSel();
}

function selecionarCat(id) {
    _catAtiva = id;
    renderCats(); renderNotas();
}

function renderCats() {
    const el = document.getElementById('catsList');
    if (!el) return;
    let html = `<div class="cat-item${_catAtiva===null?' active':''}" onclick="selecionarCat(null)">
        <div class="cat-dot" style="background:#c9a84c"></div>
        <div class="cat-nome">Todas</div>
        <div class="cat-count">${db.notas.length}</div>
    </div>`;
    db.cats.forEach(c => {
        const n = db.notas.filter(x=>x.catId===c.id).length;
        html += `<div class="cat-item${_catAtiva===c.id?' active':''}" onclick="selecionarCat('${c.id}')">
            <div class="cat-dot" style="background:${c.cor}"></div>
            <div class="cat-nome">${c.nome}</div>
            <div class="cat-count">${n}</div>
            ${c.id!=='geral'?`<button class="cat-del" onclick="event.stopPropagation();excluirCat('${c.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>`:''}
        </div>`;
    });
    el.innerHTML = html;
}

function renderCatSel() {
    const sel = document.getElementById('editorCatSel');
    if (!sel) return;
    sel.innerHTML = db.cats.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
    if (_notaAtiva) {
        const n = db.notas.find(x=>x.id===_notaAtiva);
        if (n) sel.value = n.catId||'geral';
    }
}

// ── NOTAS ──
function notasFiltradas() {
    let lista = [...db.notas];
    if (_catAtiva!==null) lista=lista.filter(n=>n.catId===_catAtiva);
    if (_busca.trim()) {
        const q=_busca.toLowerCase();
        lista=lista.filter(n=>n.titulo.toLowerCase().includes(q)||n.texto.toLowerCase().includes(q));
    }
    lista.sort((a,b)=>{
        if(a.fixada&&!b.fixada) return -1;
        if(!a.fixada&&b.fixada) return 1;
        return new Date(b.updatedAt)-new Date(a.updatedAt);
    });
    return lista;
}

function novaNota() {
    const nota = {
        id:uid(), titulo:'', texto:'',
        catId:_catAtiva||'geral', fixada:false,
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString(),
    };
    db.notas.unshift(nota);
    save(); renderNotas(); renderCats();
    abrirNota(nota.id);
    setTimeout(()=>document.getElementById('editorTitulo').focus(),100);
    atualizarSub();
}

function abrirNota(id) {
    // TOGGLE: se clicar na nota já ativa → recolhe
    if (_notaAtiva === id) {
        _notaAtiva = null;
        renderNotas();
        mostrarVazio();
        return;
    }
    _notaAtiva=id; renderNotas();
    const nota=db.notas.find(n=>n.id===id);
    if (!nota) { mostrarVazio(); return; }
    document.getElementById('editorVazio').style.display='none';
    document.getElementById('editorAtivo').style.display='flex';
    document.getElementById('editorTitulo').value=nota.titulo;
    document.getElementById('editorTexto').value=nota.texto;
    renderCatSel();
    document.getElementById('editorCatSel').value=nota.catId||'geral';
    document.getElementById('btnPin').classList.toggle('active',!!nota.fixada);
}

function mostrarVazio() {
    document.getElementById('editorVazio').style.display='flex';
    document.getElementById('editorAtivo').style.display='none';
}

function excluirNotaAtiva() {
    if (!_notaAtiva||!confirm('Excluir esta nota?')) return;
    db.notas=db.notas.filter(n=>n.id!==_notaAtiva);
    _notaAtiva=null;
    save(); renderNotas(); renderCats(); mostrarVazio();
    atualizarSub();
    toast('Nota excluída.','info');
}

function togglePin() {
    if (!_notaAtiva) return;
    const nota=db.notas.find(n=>n.id===_notaAtiva);
    if (!nota) return;
    nota.fixada=!nota.fixada;
    save(); renderNotas();
    document.getElementById('btnPin').classList.toggle('active',nota.fixada);
}

function onCatChange(sel) {
    if (!_notaAtiva) return;
    const nota=db.notas.find(n=>n.id===_notaAtiva);
    if (!nota) return;
    nota.catId=sel.value;
    nota.updatedAt=new Date().toISOString();
    save(); renderNotas(); renderCats();
}

function onEditorInput() {
    if (!_notaAtiva) return;
    clearTimeout(_timer);
    _timer=setTimeout(()=>{
        const nota=db.notas.find(n=>n.id===_notaAtiva);
        if (!nota) return;
        nota.titulo=document.getElementById('editorTitulo').value;
        nota.texto=document.getElementById('editorTexto').value;
        nota.updatedAt=new Date().toISOString();
        save(); renderNotas(); renderCats(); atualizarSub();
        const s=document.getElementById('editorSalvo');
        s.classList.add('show');
        setTimeout(()=>s.classList.remove('show'),1800);
    },600);
}

document.getElementById('editorTitulo').addEventListener('input',onEditorInput);
document.getElementById('editorTexto').addEventListener('input',onEditorInput);
document.getElementById('editorTexto').addEventListener('keydown',function(e){
    if(e.key==='Tab'){
        e.preventDefault();
        const s=this.selectionStart,v=this.value;
        this.value=v.slice(0,s)+'    '+v.slice(this.selectionEnd);
        this.selectionStart=this.selectionEnd=s+4;
    }
});
document.getElementById('buscaInput').addEventListener('input',function(){
    _busca=this.value; renderNotas();
});

const SVG_PIN='<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style="width:10px;height:10px;"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>';

function renderNotas() {
    const lista=notasFiltradas();
    const el=document.getElementById('notasLista');
    const tit=document.getElementById('colListaTitulo');
    if(!el) return;
    if(_catAtiva===null) { tit.textContent='Todas'; }
    else { const c=db.cats.find(x=>x.id===_catAtiva); tit.textContent=c?c.nome:'Notas'; }
    if (!lista.length) {
        el.innerHTML=`<div class="lista-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><p>${_busca?'Nenhuma nota encontrada.':'Nenhuma nota.<br>Clique em <strong>Nova Nota</strong>.'}</p></div>`;
        return;
    }
    el.innerHTML=lista.map(n=>{
        const cat=db.cats.find(c=>c.id===n.catId);
        const cor=cat?cat.cor:'#c9a84c';
        const prev=n.texto.replace(/\n/g,' ').trim();
        return `<div class="nota-item${_notaAtiva===n.id?' active':''}" onclick="abrirNota('${n.id}')">
            <div class="nota-item-topo">
                ${n.fixada?`<span class="nota-pin">${SVG_PIN}</span>`:''}
                <div class="nota-titulo">${n.titulo||'Sem título'}</div>
            </div>
            <div class="nota-data">${dataRelativa(n.updatedAt)}</div>
            ${prev?`<div class="nota-preview">${prev}</div>`:''}
            <div class="nota-cat-dot" style="background:${cor}"></div>
        </div>`;
    }).join('');
}

function atualizarSub() {
    const el=document.getElementById('notasSub');
    if(el) el.textContent=db.notas.length+' nota'+(db.notas.length!==1?'s':'');
}

// ── BOOT ──
(async () => {
    // Tentar carregar do Supabase
    const ok = await syncLoad();
    if (ok) {
        toast('Dados carregados', 'success');
    } else if (db.notas.length > 0 || db.cats.length > 3) {
        // Tem dados locais que nunca foram para o Supabase — enviar agora
        await syncSave();
    }
    renderCats();
    renderNotas();
    renderCatSel();
    mostrarVazio();
    atualizarSub();
})();
