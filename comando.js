/* ============================================================
   COMANDO.JS
   Lógica extraída de comando.html
   ============================================================ */

// ========= CONSTANTS =========
const DEFAULT_TOJI_TASKS=[
  {id:'acordar',label:'Acordar até 08:00',sub:'Eu não precisava de alarme. Você precisa de desculpa.',cat:'FÍSICO',fixed:true},
  {id:'treino',label:'Treino',sub:'Sem treino, você é só um homem comum tentando ser diferente.',cat:'FÍSICO',fixed:true},
  {id:'cardio',label:'Cardio',sub:'Cardio é o que separa quem sobrevive de quem desiste.',cat:'FÍSICO',fixed:true},
  {id:'agua',label:'3L de água',sub:'Corpo desidratado é corpo que falha quando importa.',cat:'FÍSICO',fixed:true},
  {id:'alim',label:'Alimentação limpa',sub:'Você coloca lixo no corpo e espera resultado de elite.',cat:'FÍSICO',fixed:true},
  {id:'dormir',label:'Dormir antes de 00:00',sub:'Dormir tarde é sabotagem. Simples assim.',cat:'FÍSICO',fixed:true},
  {id:'scelular',label:'30min sem celular ao acordar',sub:'Primeiro pensamento do dia é seu. Não entregue pro celular.',cat:'MENTAL',fixed:true},
];
const TOJI_POS=['acordar','treino','cardio','agua','alim','dormir','scelular'];
const THOMAS_POS=['estudo','gastos','presenca','plano','emocao'];
const ROTATING=[
  "Homens fracos negociam consigo mesmos.",
  "Controle primeiro. Expansão depois.",
  "Disciplina constrói impérios silenciosos.",
  "O caos começa no impulso.",
  "Você não está cansado. Está desorganizado.",
  "Repetição cria identidade.",
  "Quem domina o corpo suporta pressão.",
  "Sem controle interno não existe poder.",
  "Quem controla impulsos controla decisões.",
  "Poder sem controle interno destrói o próprio homem.",
];
const LICOES=[
  "Quem controla impulsos controla decisões.",
  "Dinheiro exige disciplina antes de inteligência.",
  "Poder sem controle interno destrói o próprio homem.",
  "Estratégia sem execução é fantasia.",
  "A mente fria vence onde a emoção falha.",
  "Controle é a base de toda autoridade.",
  "Impulso é caro. Disciplina é gratuita.",
];
const QUOTES_PORNO=[
  "Isso não é fraqueza de um dia. É um padrão. E você sabe disso.",
  "Eu lutei contra curadores especiais sem hesitar. Você não consegue resistir a uma tela.",
  "Cada vez que cede, você está treinando seu cérebro a fugir da dificuldade.",
  "Predador não se distrai com ilusão. Você acabou de provar que ainda não é um.",
  "A energia que você desperdiçou agora era para construção. Foi embora.",
];
const QUOTES_APOSTA=[
  "Você não perdeu dinheiro. Perdeu controle.",
  "Todo apostador acredita que a próxima vai recuperar. Essa é a armadilha.",
  "Thomas Shelby construiu um império com controle, não com sorte.",
  "A compulsão mente para você todos os dias.",
];
const WAR_MSGS=[
  "Controle foi perdido.",
  "Disciplina acima da emoção.",
  "Reassuma o comando.",
  "Impulso detectado.",
  "Falha operacional registrada.",
];
const FASES=[
  {nome:"FASE 1 — SOBREVIVÊNCIA",desc:"Cortar apostas · Estabilizar mente · Acordar cedo"},
  {nome:"FASE 2 — CONTROLE",desc:"Rotina sólida · Treino constante · Estudo diário"},
  {nome:"FASE 3 — EXPANSÃO",desc:"Renda · OAB · Networking · Projetos"},
];

const COFRE_DEFAULT=[
  "Nunca aposte tentando recuperar.",
  "Impulso é caro.",
  "Disciplina elimina caos.",
  "Emoção destrói estratégia.",
];

// ========= STATE =========
let S={};
let currentFail=null, selTrigger=null;

function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function yesterdayKey(){const d=new Date();d.setDate(d.getDate()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

function defState(){return{
  toji:{checks:{},alvo:'',diary:'',streak:0,history:{}},
  thomas:{checks:{},alvo:'',diary:'',streak:0,history:{},
    cofre:[...COFRE_DEFAULT]
  },
  fase:1,lastDate:todayKey(),lastWeekReset:''
};}

function loadState(){
  try{const r=localStorage.getItem('cmd_v5');S=r?JSON.parse(r):defState();}
  catch(e){S=defState();}
  if(!S.toji)S.toji=defState().toji;
  if(!S.thomas)S.thomas=defState().thomas;
  if(!S.thomas.cofre)S.thomas.cofre=[...COFRE_DEFAULT];
  checkReset();
}
function saveState(){localStorage.setItem('cmd_v5',JSON.stringify(S));}

function checkReset(){
  const today=todayKey();
  if(S.lastDate&&S.lastDate!==today){
    archiveDay(S.lastDate);
    S.toji.checks={};S.thomas.checks={};
    S.toji.alvo='';S.thomas.alvo='';
    S.lastDate=today;saveState();
  }
}
function archiveDay(k){
  S.toji.history[k]={checks:{...S.toji.checks},score:tojiScore(),ts:Date.now()};
  S.thomas.history[k]={checks:{...S.thomas.checks},score:thomasScore(),ts:Date.now()};
  updateStreaks(k);
}
function updateStreaks(k){
  const th=S.toji.history[k]||{};
  const allT=TOJI_POS.every(x=>th.checks&&th.checks[x]);
  const noFT=!th.checks?.porno;
  S.toji.streak=allT&&noFT?(S.toji.streak||0)+1:0;
  const thm=S.thomas.history[k]||{};
  const allTH=THOMAS_POS.every(x=>thm.checks&&thm.checks[x]);
  const noFTH=!thm.checks?.aposta;
  S.thomas.streak=allTH&&noFTH?(S.thomas.streak||0)+1:0;
}
function tojiScore(){return TOJI_POS.filter(k=>S.toji.checks[k]).length;}
function thomasScore(){return THOMAS_POS.filter(k=>S.thomas.checks[k]).length;}

// ========= HANDLERS =========
function handleCheck(key,mode,isFail){
  const el=document.getElementById(`ch-${key}`);
  const v=el.checked;
  if(mode==='toji')S.toji.checks[key]=v;
  else S.thomas.checks[key]=v;
  if(isFail){
    if(v){activateWar(key);showAlert(key);openTrigModal(key);}
    else{clearWarIfClean();hideAlert(key);}
  }
  updateUI();saveState();
}

function activateWar(key){
  flash();
  document.body.classList.add('war-mode');
  document.getElementById('wbMsg').textContent=WAR_MSGS[Math.floor(Math.random()*WAR_MSGS.length)];
  if(key==='porno')S.toji.streak=Math.max(0,(S.toji.streak||0)-1);
  if(key==='aposta')S.thomas.streak=Math.max(0,(S.thomas.streak||0)-1);
  showToast('⬛ Modo Guerra ativado',true);
}
function clearWarIfClean(){
  if(!S.toji.checks.porno&&!S.thomas.checks.aposta)document.body.classList.remove('war-mode');
}
function showAlert(key){
  const q=key==='porno'?QUOTES_PORNO:QUOTES_APOSTA;
  const el=document.getElementById(`alert-${key}`);
  const qel=document.getElementById(`q-${key}`);
  if(el&&qel){qel.textContent=`"${q[Math.floor(Math.random()*q.length)]}"`; el.classList.add('show');}
}
function hideAlert(key){const el=document.getElementById(`alert-${key}`);if(el)el.classList.remove('show');}
function flash(){const f=document.getElementById('impactFlash');f.classList.remove('go');void f.offsetWidth;f.classList.add('go');}

function openTrigModal(key){currentFail=key;selTrigger=null;document.querySelectorAll('.trig-opt').forEach(b=>b.classList.remove('sel'));document.getElementById('triggerModal').classList.add('show');}
function closeTrigModal(){document.getElementById('triggerModal').classList.remove('show');currentFail=null;}
function selTrig(btn){document.querySelectorAll('.trig-opt').forEach(b=>b.classList.remove('sel'));btn.classList.add('sel');selTrigger=btn.textContent;}
function confirmTrig(){
  if(selTrigger&&currentFail){
    const t=todayKey();
    if(!S.toji.history[t])S.toji.history[t]={};
    if(!S.toji.history[t].triggers)S.toji.history[t].triggers=[];
    S.toji.history[t].triggers.push({fail:currentFail,trigger:selTrigger,ts:Date.now()});
    saveState();showToast(`Gatilho: ${selTrigger}`,false);
  }
  closeTrigModal();
}

function saveAlvo(mode){
  const inp=document.getElementById(`alvo-${mode}`);
  const btn=document.getElementById(`alvo-${mode}-btn`);
  if(!inp||!inp.value.trim())return;
  S[mode].alvo=inp.value.trim();
  btn.classList.add('done');btn.textContent='✓ REGISTRADO';
  saveState();showToast('Alvo registrado.',false);
}

// Cofre Mental
function renderCofre(){
  const c=document.getElementById('cofreList');if(!c)return;
  const items=S.thomas.cofre||[];
  if(items.length===0){c.innerHTML='<div style="padding:16px 20px;font-family:Cormorant Garamond,serif;font-style:italic;color:var(--tf);font-size:.85em">O cofre está vazio. Adicione seu primeiro princípio.</div>';return;}
  c.innerHTML=items.map((txt,i)=>`<div class="cofre-item"><div class="cofre-dot"></div><div class="cofre-text">"${txt}"</div><button class="cofre-del" onclick="delCofre(${i})">✕</button></div>`).join('');
}
function addCofre(){
  const inp=document.getElementById('cofreInp');if(!inp||!inp.value.trim())return;
  S.thomas.cofre.push(inp.value.trim());inp.value='';
  saveState();renderCofre();showToast('Guardado no cofre.',false);
}
function delCofre(i){S.thomas.cofre.splice(i,1);saveState();renderCofre();}

// Tabs
function switchTab(t){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
  document.getElementById(`tab-${t}`).classList.add('on');
  document.getElementById(`panel-${t}`).classList.add('on');
}

// Estado Operacional Toji
function calcEstado(){
  const streak=S.toji.streak||0;
  const score=tojiScore();
  const hasPorno=S.toji.checks.porno;
  const acordou=S.toji.checks.acordar;
  const treinou=S.toji.checks.treino;

  const voices={
    fraco_porno:"Recaída. Eu esperava mais de você. Mas talvez esse seja o seu nível.",
    fraco_zero:"Você não fez nada ainda. Isso não é descanso. É evitação.",
    fraco_pouco:"Começou. Mas começar sem terminar é pior do que não começar.",
    instavel:"Você está se movendo. Mas instabilidade não constrói nada sólido.",
    operacional:"Funcionando. É o mínimo. Mantenha.",
    implacavel:`${streak} dias consecutivos. Agora você começa a parecer alguém que leva isso a sério.`,
  };

  if(hasPorno) return{cls:'estado-fraco',name:'FRACO',sub:'recaída registrada',voice:voices.fraco_porno};
  if(score===0) return{cls:'estado-fraco',name:'FRACO',sub:'nenhuma tarefa executada',voice:voices.fraco_zero};
  if(score<=2) return{cls:'estado-fraco',name:'FRACO',sub:'execução insuficiente',voice:voices.fraco_pouco};
  if(score<=4||streak<3) return{cls:'estado-instavel',name:'INSTÁVEL',sub:'consistência insuficiente',voice:voices.instavel};
  if(score>=6&&streak>=7&&acordou&&treinou) return{cls:'estado-implacavel',name:'IMPLACÁVEL',sub:`${streak} dias consecutivos`,voice:voices.implacavel};
  return{cls:'estado-operacional',name:'OPERACIONAL',sub:`sequência: ${streak} dias`,voice:voices.operacional};
}

// UI Update
function updateUI(){
  const ts=tojiScoreDynamic(),thms=thomasScore();
  const yk=yesterdayKey();
  const ty=S.toji.history[yk],thy=S.thomas.history[yk];

  setText('t-streak',S.toji.streak||0);
  setText('t-score',`${ts}/7`);
  renderDynamicChecklist();
  setText('t-yest',ty?`${ty.score}/7`:'—');
  setText('t-fase',S.fase||1);

  setText('th-streak',S.thomas.streak||0);
  setText('th-score',`${thms}/5`);
  setText('th-count',`${thms}/5`);
  setText('th-yest',thy?`${thy.score}/5`:'—');
  setText('th-fase',S.fase||1);

  // Sync checkboxes - Thomas only (Toji uses dynamic render)
  [...THOMAS_POS,'aposta'].forEach(k=>{
    const el=document.getElementById(`ch-${k}`);if(el)el.checked=!!S.thomas.checks[k];
    const row=document.getElementById(`row-${k}`);if(row){if(S.thomas.checks[k])row.classList.add('done');else row.classList.remove('done');}
  });

  // Alvo
  setVal('alvo-toji',S.toji.alvo||'');setVal('alvo-thomas',S.thomas.alvo||'');
  if(S.toji.alvo){const b=document.getElementById('alvo-toji-btn');if(b){b.classList.add('done');b.textContent='✓ REGISTRADO';}}
  if(S.thomas.alvo){const b=document.getElementById('alvo-thomas-btn');if(b){b.classList.add('done');b.textContent='✓ REGISTRADO';}}

  // Fase
  updateFase('t',ts,7);updateFase('th',thms,6);

  // Estado
  const est=calcEstado();
  const eb=document.getElementById('estadoBlock');
  if(eb){eb.className='estado-block '+est.cls;}
  setText('estadoName',est.name);setText('estadoSub',est.sub);
  setText('tojiVoice',est.voice||'—');

  // War
  const anyFail=S.toji.checks.porno||S.thomas.checks.aposta;
  if(anyFail)document.body.classList.add('war-mode');else document.body.classList.remove('war-mode');
  if(S.toji.checks.porno){const el=document.getElementById('alert-porno');const qel=document.getElementById('q-porno');if(el&&qel&&!qel.textContent){qel.textContent=`"${QUOTES_PORNO[0]}"`;} if(el)el.classList.add('show');}
  if(S.thomas.checks.aposta){const el=document.getElementById('alert-aposta');const qel=document.getElementById('q-aposta');if(el&&qel&&!qel.textContent){qel.textContent=`"${QUOTES_APOSTA[0]}"`;} if(el)el.classList.add('show');}

  // Weekly counters
  buildWeeklyCounters();
  renderCofre();
}

function buildWeeklyCounters(){
  const days=last7();
  let tr=0,cd=0,ac=0,po=0;
  days.forEach(d=>{
    const h=d===todayKey()?S.toji.checks:(S.toji.history[d]||{}).checks||{};
    if(h.treino)tr++;if(h.cardio)cd++;if(h.acordar)ac++;if(h.porno)po++;
  });
  setText('cnt-treinos',tr);setText('cnt-cardio',cd);setText('cnt-acordar',ac);setText('cnt-porno',po);
}

function updateFase(p,score,max){
  const noFail=p==='t'?!S.toji.checks.porno:!S.thomas.checks.aposta;
  const streak=p==='t'?S.toji.streak:S.thomas.streak;
  const pct=Math.round((score/max)*100);
  let fi=0;
  if(streak>=14&&noFail)fi=1;
  if(streak>=30&&noFail&&score>=max-1)fi=2;
  S.fase=Math.max(S.fase||1,fi+1);
  const f=FASES[fi];
  setText(`${p}-fase-nome`,f.nome);setText(`${p}-fase-desc`,f.desc);
  setText(`${p}-fase-pct`,`${pct}%`);setText(`${p}-fase-meta`,`${score} de ${max} tarefas`);
  const fill=document.getElementById(`${p}-fase-fill`);if(fill)fill.style.width=`${pct}%`;
}

// Report
function buildReport(){
  const days=last7();let tr=0,es=0,ap=0,po=0;
  const el=document.getElementById('rptDays');if(el)el.innerHTML='';
  const dns=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  days.forEach(day=>{
    const today=day===todayKey();
    const tc=today?S.toji.checks:((S.toji.history[day]||{}).checks||{});
    const thc=today?S.thomas.checks:((S.thomas.history[day]||{}).checks||{});
    const ts2=today?tojiScore():((S.toji.history[day]||{}).score||0);
    const ths2=today?thomasScore():((S.thomas.history[day]||{}).score||0);
    if(tc.treino)tr++;if(thc.estudo)es++;if(thc.aposta)ap++;if(tc.porno)po++;
    const tot=ts2+ths2,hf=tc.porno||thc.aposta;
    let cls='';if(tot>=10&&!hf)cls='full';else if(tot>0&&!hf)cls='partial';else if(hf)cls='bad';
    const d2=new Date(day+'T12:00:00');
    if(el)el.innerHTML+=`<div class="rday ${cls}"><span class="rday-n">${d2.getDate()}</span><span class="rday-l">${dns[d2.getDay()]}</span></div>`;
  });
  setText('rpt-treinos',tr);setText('rpt-estudo',`${es}h`);setText('rpt-apostas',ap);setText('rpt-porno',po);
  setText('rpt-st',S.toji.streak||0);setText('rpt-sth',S.thomas.streak||0);
}

function last7(){const d=[];for(let i=6;i>=0;i--){const x=new Date();x.setDate(x.getDate()-i);d.push(`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`);}return d;}

function exportTXT(){
  const l=['RELATÓRIO — CENTRO DE COMANDO',`Data: ${new Date().toLocaleDateString('pt-BR')}`,'',
    '=== TOJI ===',`Sequência: ${S.toji.streak||0} dias`,`Score hoje: ${tojiScore()}/7`,
    `Alvo: ${S.toji.alvo||'—'}`,`Diário: ${S.toji.diary||'—'}`,'',
    '=== SEM LIMITES ===',`Sequência: ${S.thomas.streak||0} dias`,`Score hoje: ${thomasScore()}/6`,
    `Alvo: ${S.thomas.alvo||'—'}`,`Diário: ${S.thomas.diary||'—'}`,'',
    '=== COFRE MENTAL ===',
    ...(S.thomas.cofre||[]).map(c=>`· ${c}`)
  ];
  dl('relatorio.txt',l.join('\n'),'text/plain');showToast('TXT exportado.',false);
}
function exportJSON(){dl('relatorio.json',JSON.stringify({...S,exportedAt:new Date().toISOString()},null,2),'application/json');showToast('JSON exportado.',false);}
function dl(name,content,type){const b=new Blob([content],{type});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);}

function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
function setVal(id,v){const e=document.getElementById(id);if(e)e.value=v;}

function showToast(msg,isWar){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className=`toast show${isWar?' war':''}`;
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3000);
}

// Rotating phrases
let rpIdx=0;
function rotatePhrase(){
  const el=document.getElementById('rpText');if(!el)return;
  el.style.opacity='0';
  setTimeout(()=>{el.textContent=ROTATING[rpIdx%ROTATING.length];el.style.opacity='1';rpIdx++;},800);
}

// Date
function updateDate(){
  const el=document.getElementById('hdrDate');if(!el)return;
  const n=new Date();const dn=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];const mn=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  el.textContent=`${dn[n.getDay()]}, ${n.getDate()} ${mn[n.getMonth()]}`;
}

// Lição do dia
function setLicao(){
  const d=new Date();const idx=(d.getDate()+d.getMonth())%LICOES.length;
  setText('licaoText',`"${LICOES[idx]}"`);
}

// ===== DYNAMIC TASKS =====
let editingTaskId=null;
let selectedCat='FÍSICO';

function getTasks(){
  if(!S.toji.customTasks) S.toji.customTasks=[];
  return [...DEFAULT_TOJI_TASKS,...S.toji.customTasks];
}

function tojiScoreDynamic(){
  const tasks=getTasks();
  return tasks.filter(t=>S.toji.checks[t.id]).length;
}

function renderDynamicChecklist(){
  const tasks=getTasks();
  const total=tasks.length;
  const done=tasks.filter(t=>S.toji.checks[t.id]).length;
  setText('t-count',`${done}/${total}`);

  const catColors={
    'FÍSICO':'b-phys',
    'MENTAL':'b-mind',
    'HÁBITO':'b-habit',
  };

  const c=document.getElementById('toji-dynamic-checklist');
  if(!c)return;
  c.innerHTML=tasks.map(task=>{
    const checked=!!S.toji.checks[task.id];
    const isCustom=!task.fixed;
    return `<div class="check-row${checked?' done':''}" id="row-${task.id}" style="display:flex;align-items:center;gap:14px;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.025);transition:background .2s;position:relative">
      <div class="cbx" onclick="toggleDynTask('${task.id}')">
        <input type="checkbox" ${checked?'checked':''} style="position:absolute;opacity:0;width:0;height:0">
        <div class="cbx-box" style="${checked?'background:#a8822a;border-color:var(--gold);box-shadow:0 0 10px rgba(201,165,90,.25)':''}">
          ${checked?'<div style="position:absolute;width:4px;height:8px;border:1.5px solid #080808;border-width:0 1.5px 1.5px 0;top:47%;left:50%;transform:translate(-50%,-60%) rotate(45deg)"></div>':''}
        </div>
      </div>
      <div class="ch-info" style="flex:1;min-width:0;cursor:pointer" onclick="toggleDynTask('${task.id}')">
        <div class="ch-label" style="${checked?'color:rgba(255,255,255,.3);text-decoration:line-through':'color:#ffffff'}">${task.label}</div>
        ${task.sub?`<div class="ch-sub" style="${checked?'opacity:.3':''}color:rgba(255,255,255,.5)">${task.sub}</div>`:''}
      </div>
      <span class="ch-badge ${catColors[task.cat]||'b-phys'}">${task.cat}</span>
      <div class="dyn-task-actions">
        <button class="task-act-btn" onclick="openEditTask('${task.id}')" title="Editar">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        ${isCustom?`<button class="task-act-btn del" onclick="deleteTask('${task.id}')" title="Excluir">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>`:''}
      </div>
    </div>`;
  }).join('');
}

function toggleDynTask(id){
  S.toji.checks[id]=!S.toji.checks[id];
  updateUI();saveState();
}

function openAddTask(){
  editingTaskId=null;
  selectedCat='FÍSICO';
  document.getElementById('taskModalTitle').textContent='Nova Tarefa';
  document.getElementById('taskLabelInp').value='';
  document.getElementById('taskSubInp').value='';
  document.querySelectorAll('.cat-opt').forEach(b=>{b.classList.toggle('active',b.dataset.cat==='FÍSICO');});
  document.getElementById('taskModal').style.display='flex';
  setTimeout(()=>document.getElementById('taskLabelInp').focus(),100);
}

function openEditTask(id){
  const tasks=getTasks();
  const task=tasks.find(t=>t.id===id);
  if(!task)return;
  editingTaskId=id;
  selectedCat=task.cat||'FÍSICO';
  document.getElementById('taskModalTitle').textContent='Editar Tarefa';
  document.getElementById('taskLabelInp').value=task.label;
  document.getElementById('taskSubInp').value=task.sub||'';
  document.querySelectorAll('.cat-opt').forEach(b=>{b.classList.toggle('active',b.dataset.cat===selectedCat);});
  document.getElementById('taskModal').style.display='flex';
  setTimeout(()=>document.getElementById('taskLabelInp').focus(),100);
}

function selectCat(btn){
  document.querySelectorAll('.cat-opt').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  selectedCat=btn.dataset.cat;
}

function saveTask(){
  const label=document.getElementById('taskLabelInp').value.trim();
  if(!label)return;
  const sub=document.getElementById('taskSubInp').value.trim();
  if(!S.toji.customTasks)S.toji.customTasks=[];

  if(editingTaskId){
    // Check if it's a custom task
    const idx=S.toji.customTasks.findIndex(t=>t.id===editingTaskId);
    if(idx>=0){
      S.toji.customTasks[idx]={...S.toji.customTasks[idx],label,sub,cat:selectedCat};
    } else {
      // It's a fixed task being "relabeled" — store override
      if(!S.toji.taskOverrides)S.toji.taskOverrides={};
      S.toji.taskOverrides[editingTaskId]={label,sub,cat:selectedCat};
    }
  } else {
    const newId='task_'+Date.now();
    S.toji.customTasks.push({id:newId,label,sub,cat:selectedCat,fixed:false});
  }

  saveState();
  closeTaskModal();
  renderDynamicChecklist();
  updateUI();
  showToast(editingTaskId?'Tarefa atualizada.':'Tarefa adicionada.',false);
}

function deleteTask(id){
  if(!S.toji.customTasks)return;
  S.toji.customTasks=S.toji.customTasks.filter(t=>t.id!==id);
  delete S.toji.checks[id];
  saveState();
  renderDynamicChecklist();
  updateUI();
  showToast('Tarefa removida.',false);
}

function closeTaskModal(){
  document.getElementById('taskModal').style.display='none';
  editingTaskId=null;
}

// Handle enter key in task modal
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeTaskModal();
  if(e.key==='Enter'&&document.getElementById('taskModal').style.display==='flex'){
    e.preventDefault();saveTask();
  }
});

function init(){
  loadState();updateDate();setLicao();renderDynamicChecklist();updateUI();
  rotatePhrase();setInterval(rotatePhrase,6000);
  // Auto-show app after 3.5s if user doesn't click
  
}
init();
