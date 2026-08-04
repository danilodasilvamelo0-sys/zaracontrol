// ══════════════════════════════════════════
//  ZARA GYM — Data Layer
// ══════════════════════════════════════════

const GYM_KEY = 'zara_gym_v1';
let gym = carregarDados();

function carregarDados() {
    try {
        return JSON.parse(localStorage.getItem(GYM_KEY)) || dadosVazios();
    } catch { return dadosVazios(); }
}
function dadosVazios() {
    return {
        treinos: [],
        refeicoes: [],
        meds: [],
        metas: { kcal: 2000, prot: 150, carb: 250, gord: 70 }
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
        await _sb.from('gym').upsert({
            id: USER_ID, user_id: USER_ID,
            dados: db, updated_at: new Date().toISOString()
        });
    } catch(e) { console.error('syncSave:', e); }
}

async function syncLoad() {
    if (!_useSync) return false;
    try {
        const { data, error } = await _sb.from('gym')
            .select('dados').eq('user_id', USER_ID).maybeSingle();
        if (error || !data?.dados) return false;
        db = Object.assign(dadosVazios()(), data.dados);
        localStorage.setItem('zara_gym_v1', JSON.stringify(db));
    syncSave();
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





function salvarDados() {
    localStorage.setItem(GYM_KEY, JSON.stringify(gym));
}
function gerarId() { return Date.now() + Math.random().toString(36).slice(2,7); }

// ── TOAST ──
function toast(msg, tipo) {
    const el = document.getElementById('gymStatus');
    const icones = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
        error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    };
    const cores = { success:'rgba(30,130,70,0.96)', error:'rgba(180,45,35,0.96)', info:'rgba(30,60,100,0.96)' };
    el.innerHTML = (icones[tipo||'info']||icones.info) + `<span>${msg}</span>`;
    el.style.background = cores[tipo||'info'];
    el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(8px)'; }, 3200);
}

// ── MODAIS ──
function abrirModal(id) { document.getElementById(id).classList.add('active'); }
function fecharModal(id) { document.getElementById(id).classList.remove('active'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if(e.target===m) m.classList.remove('active'); });
});

// ── TABS ──
function showTab(tab, btn) {
    ['treino','dieta','meds'].forEach(t => {
        const el = document.getElementById('tab'+t.charAt(0).toUpperCase()+t.slice(1)) ||
                   document.getElementById('tabMeds');
        if(el) el.style.display = 'none';
    });
    document.getElementById('tabTreino').style.display = tab==='treino' ? '' : 'none';
    document.getElementById('tabDieta').style.display  = tab==='dieta'  ? '' : 'none';
    document.getElementById('tabMeds').style.display   = tab==='meds'   ? '' : 'none';
    document.querySelectorAll('.gym-tab').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
}

// ── ÍCONES DE REFEIÇÃO SVG ──
function getRefIcon(tipo) {
    const icons = {
        cafe:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
        almoco:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
        jantar:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>',
        lanche:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
        pretreino: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        postrei:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
        ceia:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    };
    return icons[tipo] || icons.jantar;
}

// ══════════════════════════════════════════
//  TREINOS
// ══════════════════════════════════════════
let _treinoEditandoId = null;
let _exTreinoId = null;
let _exEditandoId = null;

function abrirModalTreino(treinoId) {
    _treinoEditandoId = treinoId || null;
    if(treinoId) {
        const t = gym.treinos.find(x=>x.id===treinoId);
        if(!t) return;
        document.getElementById('treinoNome').value  = t.nome;
        document.getElementById('treinoGrupo').value = t.grupo;
        document.getElementById('treinoDia').value   = t.dia||'';
        document.getElementById('treinoObs').value   = t.obs||'';
    } else {
        document.getElementById('treinoNome').value  = '';
        document.getElementById('treinoDia').value   = '';
        document.getElementById('treinoObs').value   = '';
    }
    abrirModal('modalTreino');
    setTimeout(()=>document.getElementById('treinoNome').focus(),100);
}

function salvarTreino() {
    const nome  = document.getElementById('treinoNome').value.trim();
    const grupo = document.getElementById('treinoGrupo').value;
    const dia   = document.getElementById('treinoDia').value;
    const obs   = document.getElementById('treinoObs').value.trim();
    if(!nome) { toast('Informe o nome do treino.','error'); return; }

    if(_treinoEditandoId) {
        const t = gym.treinos.find(x=>x.id===_treinoEditandoId);
        if(t) { t.nome=nome; t.grupo=grupo; t.dia=dia; t.obs=obs; }
        toast('Treino atualizado.','success');
    } else {
        gym.treinos.push({ id:gerarId(), nome, grupo, dia, obs, exercicios:[], collapsed:false });
        toast('Treino criado!','success');
    }
    salvarDados(); fecharModal('modalTreino'); renderTreinos();
}

function excluirTreino(id) {
    if(!confirm('Excluir este treino e todos os exercícios?')) return;
    gym.treinos = gym.treinos.filter(t=>t.id!==id);
    salvarDados(); renderTreinos(); toast('Treino excluído.','info');
}

function toggleTreino(id) {
    const t = gym.treinos.find(x=>x.id===id);
    if(t) { t.collapsed=!t.collapsed; salvarDados(); renderTreinos(); }
}

// Exercícios
function abrirModalExercicio(treinoId, exId) {
    _exTreinoId = treinoId; _exEditandoId = exId||null;
    document.getElementById('modalExTitulo').textContent = exId ? 'Editar Exercício' : 'Adicionar Exercício';
    if(exId) {
        const t = gym.treinos.find(x=>x.id===treinoId);
        const ex = t?.exercicios.find(x=>x.id===exId);
        if(ex) {
            document.getElementById('exNome').value     = ex.nome;
            document.getElementById('exSeries').value   = ex.series;
            document.getElementById('exReps').value     = ex.reps;
            document.getElementById('exMetodo').value   = ex.metodo||'';
            document.getElementById('exDescanso').value = ex.descanso;
            document.getElementById('exObs').value      = ex.obs||'';
        }
    } else {
        ['exNome','exObs'].forEach(id=>document.getElementById(id).value='');
        document.getElementById('exSeries').value=4;
        document.getElementById('exReps').value='10-12';
        document.getElementById('exMetodo').value='';
        document.getElementById('exDescanso').value=1;
    }
    abrirModal('modalExercicio');
    setTimeout(()=>document.getElementById('exNome').focus(),100);
}

function salvarExercicio() {
    const nome     = document.getElementById('exNome').value.trim();
    const series   = document.getElementById('exSeries').value;
    const reps     = document.getElementById('exReps').value;
    const metodo   = document.getElementById('exMetodo').value;
    const descanso = document.getElementById('exDescanso').value;
    const obs      = document.getElementById('exObs').value.trim();
    if(!nome) { toast('Informe o nome do exercício.','error'); return; }

    const t = gym.treinos.find(x=>x.id===_exTreinoId);
    if(!t) return;
    if(_exEditandoId) {
        const ex = t.exercicios.find(x=>x.id===_exEditandoId);
        if(ex) Object.assign(ex, {nome,series,reps,metodo,descanso,obs});
        toast('Exercício atualizado.','success');
    } else {
        t.exercicios.push({ id:gerarId(), nome, series, reps, metodo, descanso, obs, feito:false });
        toast('Exercício adicionado!','success');
    }
    salvarDados(); fecharModal('modalExercicio'); renderTreinos();
}

function excluirExercicio(treinoId, exId) {
    const t = gym.treinos.find(x=>x.id===treinoId);
    if(!t) return;
    t.exercicios = t.exercicios.filter(x=>x.id!==exId);
    salvarDados(); renderTreinos(); toast('Exercício removido.','info');
}

function toggleExercicio(treinoId, exId) {
    const t = gym.treinos.find(x=>x.id===treinoId);
    const ex = t?.exercicios.find(x=>x.id===exId);
    if(ex) { ex.feito=!ex.feito; salvarDados(); renderTreinos(); }
}

// Render
function renderTreinos() {
    const el = document.getElementById('treinosList');
    const sub = document.getElementById('treinoSubtitle');
    sub.textContent = `${gym.treinos.length} treino${gym.treinos.length!==1?'s':''} cadastrado${gym.treinos.length!==1?'s':''}`;

    if(!gym.treinos.length) {
        el.innerHTML = `<div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4M6 12h12"/></svg>
            Nenhum treino cadastrado.<br>Clique em <strong>Novo Treino</strong> para começar.
        </div>`; return;
    }

    el.innerHTML = gym.treinos.map(t => {
        const total = t.exercicios.length;
        const feitos = t.exercicios.filter(e=>e.feito).length;
        const pct = total > 0 ? Math.round((feitos/total)*100) : 0;
        const series = t.exercicios.reduce((s,e)=>s+(parseInt(e.series)||0),0);
        const vol = t.exercicios.reduce((s,e)=>s+(parseInt(e.series)||0)*(parseInt(e.reps)||0),0);

        const exRows = t.exercicios.map(ex => `
            <tr class="${ex.feito?'exercicio-feito':''}">
                <td><input type="checkbox" class="ex-check" ${ex.feito?'checked':''} onchange="toggleExercicio('${t.id}','${ex.id}')"></td>
                <td>
                    <div class="ex-nome-txt">${ex.nome}</div>
                    ${ex.obs?`<div class="ex-obs">${ex.obs}</div>`:''}
                </td>
                <td>${ex.series}</td>
                <td>${ex.reps}</td>
                <td>${ex.metodo||'-'}</td>
                <td>${ex.descanso}min</td>
                <td>
                    <div class="ex-acoes">
                        <button class="ex-btn" onclick="abrirModalExercicio('${t.id}','${ex.id}')" title="Editar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="ex-btn del" onclick="excluirExercicio('${t.id}','${ex.id}')" title="Excluir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>`).join('');

        return `<div class="treino-card${t.collapsed?' collapsed':''}">
            <div class="treino-card-header ${t.grupo}" onclick="toggleTreino('${t.id}')">
                <div class="treino-card-info">
                    <div class="treino-card-nome">${t.nome}</div>
                    <div class="treino-card-meta">${t.grupo.charAt(0).toUpperCase()+t.grupo.slice(1)}${t.dia?' · '+t.dia:''} · ${total} exercício${total!==1?'s':''} · ${feitos}/${total} feitos</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                    <button class="btn-sec" style="background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:#fff;padding:5px 10px;font-size:0.70em;" onclick="event.stopPropagation();abrirModalTreino('${t.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-sec" style="background:rgba(231,76,60,0.15);border-color:rgba(231,76,60,0.3);color:#e74c3c;padding:5px 10px;font-size:0.70em;" onclick="event.stopPropagation();excluirTreino('${t.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                    </button>
                    <button class="treino-card-toggle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                </div>
            </div>
            <div class="treino-prog-wrap"><div class="treino-prog-fill" style="width:${pct}%"></div></div>
            <div class="treino-card-body">
                ${total > 0 ? `
                <table class="exercicio-table">
                    <thead><tr>
                        <th style="width:36px"></th>
                        <th>Exercício</th>
                        <th>S</th><th>R</th><th>Método</th><th>Desc</th><th></th>
                    </tr></thead>
                    <tbody>${exRows}</tbody>
                </table>` : `<div class="empty-state" style="padding:20px">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px;height:28px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Nenhum exercício. Adicione abaixo.
                </div>`}
                <button class="btn-add-ex" onclick="abrirModalExercicio('${t.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Adicionar Exercício
                </button>
                ${series > 0 ? `<div class="treino-volume"><span>Séries: <strong>${series}</strong></span><span>Volume: <strong>${vol} reps</strong></span><span>Progresso: <strong>${pct}%</strong></span></div>` : ''}
            </div>
        </div>`;
    }).join('');
}

// ══════════════════════════════════════════
//  DIETA
// ══════════════════════════════════════════
let _refEditandoId = null;
let _alRefId = null;

function abrirModalRefeicao(refId) {
    _refEditandoId = refId || null;
    if(refId) {
        const r = gym.refeicoes.find(x=>x.id===refId);
        if(r) {
            document.getElementById('refNome').value  = r.nome;
            document.getElementById('refHora').value  = r.hora||'';
            document.getElementById('refIcone').value = r.icone||'jantar';
        }
    } else {
        document.getElementById('refNome').value  = '';
        document.getElementById('refHora').value  = '';
        document.getElementById('refIcone').value = 'cafe';
    }
    abrirModal('modalRefeicao');
    setTimeout(()=>document.getElementById('refNome').focus(),100);
}

function salvarRefeicao() {
    const nome  = document.getElementById('refNome').value.trim();
    const hora  = document.getElementById('refHora').value;
    const icone = document.getElementById('refIcone').value;
    if(!nome) { toast('Informe o nome da refeição.','error'); return; }
    if(_refEditandoId) {
        const r = gym.refeicoes.find(x=>x.id===_refEditandoId);
        if(r) { r.nome=nome; r.hora=hora; r.icone=icone; }
        toast('Refeição atualizada.','success');
    } else {
        gym.refeicoes.push({ id:gerarId(), nome, hora, icone, alimentos:[] });
        toast('Refeição criada!','success');
    }
    salvarDados(); fecharModal('modalRefeicao'); renderDieta();
}

function excluirRefeicao(id) {
    if(!confirm('Excluir esta refeição e todos os alimentos?')) return;
    gym.refeicoes = gym.refeicoes.filter(r=>r.id!==id);
    salvarDados(); renderDieta(); toast('Refeição excluída.','info');
}

function abrirModalAlimento(refId) {
    _alRefId = refId;
    ['alNome'].forEach(id=>document.getElementById(id).value='');
    ['alKcal','alProt','alCarb','alGord'].forEach(id=>document.getElementById(id).value=0);
    document.getElementById('alQtd').value = 100;
    abrirModal('modalAlimento');
    setTimeout(()=>document.getElementById('alNome').focus(),100);
}

function salvarAlimento() {
    const nome = document.getElementById('alNome').value.trim();
    if(!nome) { toast('Informe o nome do alimento.','error'); return; }
    const r = gym.refeicoes.find(x=>x.id===_alRefId);
    if(!r) return;
    r.alimentos.push({
        id:gerarId(), nome,
        qtd:  parseFloat(document.getElementById('alQtd').value)||100,
        kcal: parseFloat(document.getElementById('alKcal').value)||0,
        prot: parseFloat(document.getElementById('alProt').value)||0,
        carb: parseFloat(document.getElementById('alCarb').value)||0,
        gord: parseFloat(document.getElementById('alGord').value)||0,
    });
    salvarDados(); fecharModal('modalAlimento'); renderDieta();
    toast('Alimento adicionado!','success');
}

function excluirAlimento(refId, alId) {
    const r = gym.refeicoes.find(x=>x.id===refId);
    if(!r) return;
    r.alimentos = r.alimentos.filter(a=>a.id!==alId);
    salvarDados(); renderDieta();
}

function abrirModalMetas() {
    document.getElementById('metaKcal').value = gym.metas.kcal;
    document.getElementById('metaProt').value = gym.metas.prot;
    document.getElementById('metaCarb').value = gym.metas.carb;
    document.getElementById('metaGord').value = gym.metas.gord;
    abrirModal('modalMetas');
}
function salvarMetas() {
    gym.metas = {
        kcal: parseFloat(document.getElementById('metaKcal').value)||2000,
        prot: parseFloat(document.getElementById('metaProt').value)||150,
        carb: parseFloat(document.getElementById('metaCarb').value)||250,
        gord: parseFloat(document.getElementById('metaGord').value)||70,
    };
    salvarDados(); fecharModal('modalMetas'); renderDieta(); toast('Metas salvas!','success');
}

function renderDieta() {
    // Totais
    let totKcal=0, totProt=0, totCarb=0, totGord=0;
    gym.refeicoes.forEach(r => r.alimentos.forEach(a => {
        totKcal+=a.kcal||0; totProt+=a.prot||0; totCarb+=a.carb||0; totGord+=a.gord||0;
    }));

    const pct = (val,meta) => Math.min(100, meta>0 ? Math.round((val/meta)*100) : 0);
    const m = gym.metas;

    document.getElementById('macroKcalVal').textContent = Math.round(totKcal);
    document.getElementById('macroProtVal').textContent = totProt.toFixed(0);
    document.getElementById('macroCarbVal').textContent = totCarb.toFixed(0);
    document.getElementById('macroGordVal').textContent = totGord.toFixed(0);
    document.getElementById('macroKcalMeta').textContent = m.kcal;
    document.getElementById('macroProtMeta').textContent = m.prot;
    document.getElementById('macroCarbMeta').textContent = m.carb;
    document.getElementById('macroGordMeta').textContent = m.gord;
    document.getElementById('macroKcalBar').style.width = pct(totKcal,m.kcal)+'%';
    document.getElementById('macroProtBar').style.width = pct(totProt,m.prot)+'%';
    document.getElementById('macroCarbBar').style.width = pct(totCarb,m.carb)+'%';
    document.getElementById('macroGordBar').style.width = pct(totGord,m.gord)+'%';

    // Refeições
    const el = document.getElementById('refeicoesListEl');
    document.getElementById('refeicoesSubtitle').textContent =
        `${gym.refeicoes.length} refeição${gym.refeicoes.length!==1?'ões':''}`;

    if(!gym.refeicoes.length) {
        el.innerHTML = `<div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
            Nenhuma refeição. Clique em <strong>Nova Refeição</strong>.
        </div>`; return;
    }

    el.innerHTML = gym.refeicoes.map(r => {
        const rKcal = r.alimentos.reduce((s,a)=>s+(a.kcal||0),0);
        const alRows = r.alimentos.map(a => `
            <div class="alimento-item">
                <div>
                    <div class="alimento-nome">${a.nome} <span style="color:var(--text-dim);font-weight:400">${a.qtd}g</span></div>
                    <div class="alimento-macros">
                        <span>${Math.round(a.kcal)} kcal</span>
                        <span>P:<span>${a.prot.toFixed(0)}g</span></span>
                        <span>C:<span>${a.carb.toFixed(0)}g</span></span>
                        <span>G:<span>${a.gord.toFixed(0)}g</span></span>
                    </div>
                </div>
                <button class="alimento-del" onclick="excluirAlimento('${r.id}','${a.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
            </div>`).join('');

        return `<div class="refeicao-card">
            <div class="refeicao-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
                <div class="refeicao-header-left">
                    <div class="refeicao-icon">${getRefIcon(r.icone||'jantar')}</div>
                    <div>
                        <div class="refeicao-nome">${r.nome}</div>
                        <div class="refeicao-hora">${r.hora||'--:--'} · ${r.alimentos.length} alimento${r.alimentos.length!==1?'s':''}</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div class="refeicao-kcal">${Math.round(rKcal)} kcal</div>
                    <button class="ex-btn" onclick="event.stopPropagation();abrirModalRefeicao('${r.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--text-dim)"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="ex-btn del" onclick="event.stopPropagation();excluirRefeicao('${r.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                    </button>
                </div>
            </div>
            <div class="alimentos-list">
                ${alRows}
                <button class="btn-add-alimento" onclick="abrirModalAlimento('${r.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Adicionar alimento
                </button>
            </div>
        </div>`;
    }).join('');
}

// ══════════════════════════════════════════
//  MEDICAMENTOS
// ══════════════════════════════════════════
let _medEditandoId = null;
let _appMedId = null;
const hojeKey = () => new Date().toISOString().slice(0,10);

function abrirModalMed(medId) {
    _medEditandoId = medId || null;
    document.getElementById('modalMedTitulo').textContent = medId ? 'Editar Medicamento' : 'Novo Medicamento';
    if(medId) {
        const m = gym.meds.find(x=>x.id===medId);
        if(m) {
            document.getElementById('medNome').value  = m.nome;
            document.getElementById('medDose').value  = m.dose;
            document.getElementById('medFreq').value  = m.freq;
            document.getElementById('medHora').value  = m.hora||'08:00';
            document.getElementById('medVia').value   = m.via||'oral';
            document.getElementById('medObs').value   = m.obs||'';
        }
    } else {
        ['medNome','medDose','medObs'].forEach(id=>document.getElementById(id).value='');
        document.getElementById('medFreq').value='diario';
        document.getElementById('medHora').value='08:00';
        document.getElementById('medVia').value='oral';
    }
    abrirModal('modalMed');
    setTimeout(()=>document.getElementById('medNome').focus(),100);
}

function salvarMed() {
    const nome = document.getElementById('medNome').value.trim();
    const dose = document.getElementById('medDose').value.trim();
    if(!nome) { toast('Informe o nome do medicamento.','error'); return; }
    const obj = {
        nome, dose,
        freq: document.getElementById('medFreq').value,
        hora: document.getElementById('medHora').value,
        via:  document.getElementById('medVia').value,
        obs:  document.getElementById('medObs').value.trim(),
    };
    if(_medEditandoId) {
        const m = gym.meds.find(x=>x.id===_medEditandoId);
        if(m) Object.assign(m, obj);
        toast('Medicamento atualizado.','success');
    } else {
        gym.meds.push({ id:gerarId(), ...obj, apps:[] });
        toast('Medicamento adicionado!','success');
    }
    salvarDados(); fecharModal('modalMed'); renderMeds();
}

function excluirMed(id) {
    if(!confirm('Excluir este medicamento?')) return;
    gym.meds = gym.meds.filter(m=>m.id!==id);
    salvarDados(); renderMeds(); toast('Medicamento removido.','info');
}

function abrirRegistrarApp(medId) {
    _appMedId = medId;
    const m = gym.meds.find(x=>x.id===medId);
    if(!m) return;
    document.getElementById('modalAppMedNome').textContent = m.nome + (m.dose ? ' — ' + m.dose : '');
    const agora = new Date();
    document.getElementById('appHora').value = agora.getHours().toString().padStart(2,'0') + ':' + agora.getMinutes().toString().padStart(2,'0');
    document.getElementById('appDose').value  = m.dose||'';
    document.getElementById('appObs').value   = '';
    abrirModal('modalApp');
}

function salvarApp() {
    const m = gym.meds.find(x=>x.id===_appMedId);
    if(!m) return;
    if(!m.apps) m.apps = [];
    m.apps.push({
        id:   gerarId(),
        data: hojeKey(),
        hora: document.getElementById('appHora').value,
        dose: document.getElementById('appDose').value.trim(),
        obs:  document.getElementById('appObs').value.trim(),
    });
    salvarDados(); fecharModal('modalApp'); renderMeds();
    toast('Aplicação registrada!','success');
}

function excluirApp(medId, appId) {
    const m = gym.meds.find(x=>x.id===medId);
    if(m) { m.apps = (m.apps||[]).filter(a=>a.id!==appId); salvarDados(); renderMeds(); }
}

function limparAplicacoes() {
    if(!confirm('Limpar todas as aplicações de hoje?')) return;
    const hoje = hojeKey();
    gym.meds.forEach(m => { m.apps = (m.apps||[]).filter(a=>a.data!==hoje); });
    salvarDados(); renderMeds(); toast('Aplicações limpas.','info');
}

const FREQ_LABEL = { diario:'Diário', '2x':'2x/dia', '3x':'3x/dia', semanal:'Semanal', conforme:'Conforme necessário' };
const VIA_LABEL  = { oral:'Oral', sublingual:'Sublingual', injetavel:'Injetável', topico:'Tópico', gotas:'Gotas' };
const VIA_SVG = {
    oral:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px;"><rect x="7" y="2" width="10" height="18" rx="5"/></svg>',
    sublingual: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px;"><path d="M12 20V4m-5 8h10"/></svg>',
    injetavel:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px;"><path d="m18 2 4 4-14 14H4v-4L18 2zM10.5 6.5l7 7"/></svg>',
    topico:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px;"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/></svg>',
    gotas:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px;"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
};

function renderMeds() {
    const hoje = hojeKey();
    const appsHoje = [];
    gym.meds.forEach(m => {
        (m.apps||[]).filter(a=>a.data===hoje).forEach(a => appsHoje.push({...a, medNome:m.nome}));
    });
    appsHoje.sort((a,b)=>a.hora.localeCompare(b.hora));

    document.getElementById('medsSubtitle').textContent =
        `${gym.meds.length} medicamento${gym.meds.length!==1?'s':''}`;
    document.getElementById('appsSubtitle').textContent =
        `${appsHoje.length} aplicação${appsHoje.length!==1?'ões':''} hoje`;

    // Lista de medicamentos
    const el = document.getElementById('medsList');
    if(!gym.meds.length) {
        el.innerHTML = `<div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            Nenhum medicamento. Clique em <strong>Adicionar</strong>.
        </div>`;
    } else {
        el.innerHTML = gym.meds.map(m => {
            const appsHojeM = (m.apps||[]).filter(a=>a.data===hoje);
            const chips = appsHojeM.map(a =>
                `<span class="med-app-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px;"><polyline points="20 6 9 17 4 12"/></svg>
                    ${a.hora}
                </span>`
            ).join('');
            return `<div class="med-card">
                <div class="med-card-body">
                    <div class="med-icon">${VIA_SVG[m.via]||VIA_SVG.oral}</div>
                    <div class="med-info">
                        <div class="med-nome">${m.nome}</div>
                        <div class="med-meta">
                            ${m.dose ? `<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><rect x="7" y="2" width="10" height="18" rx="5"/></svg>${m.dose}</span>` : ''}
                            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${m.hora||'--:--'}</span>
                            <span>${FREQ_LABEL[m.freq]||m.freq}</span>
                            ${m.obs ? `<span style="color:var(--text-dim)">${m.obs}</span>` : ''}
                        </div>
                    </div>
                    <div class="med-acoes">
                        <button class="med-btn-aplicar" onclick="abrirRegistrarApp('${m.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            Aplicar
                        </button>
                        <button class="ex-btn" onclick="abrirModalMed('${m.id}')" style="border:1px solid var(--border-s);padding:6px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="ex-btn del" onclick="excluirMed('${m.id}')" style="border:1px solid rgba(231,76,60,0.2);padding:6px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                        </button>
                    </div>
                </div>
                ${chips ? `<div class="med-apps-hoje">${chips}</div>` : ''}
            </div>`;
        }).join('');
    }

    // Histórico de aplicações hoje
    const apEl = document.getElementById('appsList');
    if(!appsHoje.length) {
        apEl.innerHTML = `<div class="empty-state" style="padding:20px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px;height:28px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Nenhuma aplicação registrada hoje.
        </div>`;
    } else {
        apEl.innerHTML = appsHoje.map(a => `
            <div class="app-item">
                <div class="app-hora">${a.hora}</div>
                <div class="app-info">
                    <div class="app-nome">${a.medNome}</div>
                    ${a.dose||a.obs ? `<div class="app-dose">${[a.dose,a.obs].filter(Boolean).join(' · ')}</div>` : ''}
                </div>
                <button class="app-del" onclick="excluirApp('${a.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
            </div>`).join('');
    }
}

// Render inicial
if(!gym.meds) gym.meds = [];
renderTreinos();
renderDieta();
renderMeds();

(async () => {
    const ok = await syncLoad();
    if(typeof renderTreinos==="function") renderTreinos(); if(typeof renderDieta==="function") renderDieta(); if(typeof renderMeds==="function") renderMeds();
    
    if (ok) toast('Dados carregados', 'success');
})();
