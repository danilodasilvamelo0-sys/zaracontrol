(function (g) {
  'use strict';
  const R2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const pad = n => String(n).padStart(2, '0');

  /* ---------- datas (sempre locais, sem UTC) ---------- */
  function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
    return d;
  }
  function addDays(s, n) { const d = parseISO(s); d.setDate(d.getDate() + n); return toISO(d); }
  function weekStart(s) { const d = parseISO(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toISO(d); }
  function monthKey(s) { return s.slice(0, 7); }
  function addMonths(key, n) { const p = key.split('-').map(Number); const d = new Date(p[0], p[1] - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function daysInMonth(key) { const p = key.split('-').map(Number); return new Date(p[0], p[1], 0).getDate(); }
  function today() { return toISO(new Date()); }

  /* ---------- números ---------- */
  function parseMoney(v) {
    if (typeof v === 'number') return isFinite(v) && v >= 0 ? R2(v) : NaN;
    let s = String(v == null ? '' : v).replace(/R\$/gi, '').replace(/\s/g, '');
    if (s === '') return 0;
    if (s.includes(',')) {
      if (!/^(\d{1,3}(\.\d{3})+|\d+),\d{1,2}$/.test(s)) return NaN;
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');
    } else if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
    const n = parseFloat(s);
    return isFinite(n) ? R2(n) : NaN;
  }
  function parseQty(v) {
    if (typeof v === 'number') return Number.isInteger(v) && v >= 0 && v <= 9999 ? v : NaN;
    const s = String(v == null ? '' : v).trim();
    if (s === '') return 0;
    if (!/^\d+$/.test(s)) return NaN;
    const n = parseInt(s, 10);
    return n <= 9999 ? n : NaN;
  }

  /* ---------- cálculo de um dia ---------- */
  // Entregas: se há valor unitário, ganho = qtd × valor (o total manual é ignorado,
  // evitando duplicação). Sem valor unitário, vale o total manual informado.
  function calc(r) {
    const full = R2(r.fullQty * r.fullRate);
    const half = R2(r.halfQty * r.halfRate);
    const del = r.delRate > 0 ? R2(r.delQty * r.delRate) : R2(r.delManual || 0);
    const extra = R2(r.extra || 0);
    return { full: full, half: half, del: del, extra: extra, total: R2(full + half + del + extra) };
  }
  /* ---------- pagamento: diárias (+meias+extras) e entregas, cada um pago ou a receber ---------- */
  function pay(r) {
    const c = calc(r), wk = R2(c.full + c.half + c.extra), dl = c.del;
    const wkDue = wk > 0, dlDue = dl > 0, wkPaid = wkDue && !!r.paidWork, dlPaid = dlDue && !!r.paidDel;
    const recWk = wkPaid ? wk : 0, recDl = dlPaid ? dl : 0, pendWk = wkDue && !wkPaid ? wk : 0, pendDl = dlDue && !dlPaid ? dl : 0;
    return { wk: wk, dl: dl, wkDue: wkDue, dlDue: dlDue, wkPaid: wkPaid, dlPaid: dlPaid,
      recWk: recWk, recDl: recDl, pendWk: pendWk, pendDl: pendDl, received: R2(recWk + recDl), pending: R2(pendWk + pendDl) };
  }
  function normalizePayment(p) {
    if (!p || typeof p !== 'object' || !p.id) return null;
    return { id: String(p.id), date: parseISO(p.date) ? p.date : today(), kind: ['work', 'del', 'both'].indexOf(p.kind) >= 0 ? p.kind : 'both',
      total: R2(+p.total || 0), note: String(p.note || '').slice(0, 200),
      items: (Array.isArray(p.items) ? p.items : []).filter(function (i) { return i && i.id && (i.k === 'work' || i.k === 'del'); })
        .map(function (i) { return { id: String(i.id), k: i.k }; }) };
  }
  function isWorked(r) { return r.fullQty + r.halfQty + r.delQty > 0 || calc(r).total > 0; }

  /* ---------- validação ---------- */
  function validate(input) {
    const errors = {};
    const date = String(input.date || '');
    if (!parseISO(date)) errors.date = 'Selecione uma data válida.';
    const rec = { date: date, notes: String(input.notes || '').trim().slice(0, 500) };
    [['fullQty', parseQty], ['halfQty', parseQty], ['delQty', parseQty],
     ['fullRate', parseMoney], ['halfRate', parseMoney], ['delRate', parseMoney],
     ['delManual', parseMoney], ['extra', parseMoney]].forEach(function (p) {
      const val = p[1](input[p[0]]);
      if (Number.isNaN(val)) errors[p[0]] = p[1] === parseQty ? 'Use um número inteiro (0 ou mais).' : 'Valor inválido. Exemplo: 120,50';
      else rec[p[0]] = val;
    });
    if (Object.keys(errors).length) return { ok: false, errors: errors };
    const tb = function (v) { return v === true || v === '1' || v === 1 || v === 'true'; };
    rec.paidWork = tb(input.paidWork); rec.paidDel = tb(input.paidDel);
    rec.paidWorkAt = rec.paidWork && parseISO(String(input.paidWorkAt || '')) ? String(input.paidWorkAt) : '';
    rec.paidDelAt = rec.paidDel && parseISO(String(input.paidDelAt || '')) ? String(input.paidDelAt) : '';
    if (rec.delRate > 0) rec.delManual = 0; // evita duplicar valor de entregas
    if (rec.fullQty + rec.halfQty + rec.delQty === 0 && calc(rec).total === 0)
      return { ok: false, errors: { _: 'Informe ao menos uma diária, entrega ou valor.' } };
    return { ok: true, errors: {}, record: rec };
  }
  function normalizeRecord(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const v = validate({
      date: raw.date, fullQty: raw.fullQty, halfQty: raw.halfQty, delQty: raw.delQty,
      fullRate: raw.fullRate, halfRate: raw.halfRate, delRate: raw.delRate,
      delManual: raw.delManual, extra: raw.extra, notes: raw.notes,
      paidWork: raw.paidWork, paidDel: raw.paidDel, paidWorkAt: raw.paidWorkAt, paidDelAt: raw.paidDelAt
    });
    if (!v.ok) return null;
    v.record.id = typeof raw.id === 'string' && raw.id ? raw.id : newId();
    return v.record;
  }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function findByDate(records, date, exceptId) {
    return records.find(function (r) { return r.date === date && r.id !== exceptId; }) || null;
  }

  /* ---------- totais ---------- */
  function summarize(list) {
    const s = { full: 0, half: 0, del: 0, extra: 0, total: 0, fullQty: 0, halfQty: 0, delQty: 0, days: 0, avg: 0,
      received: 0, pending: 0, recWk: 0, recDl: 0, pendWk: 0, pendDl: 0, pendWkDays: 0, pendDlDays: 0 };
    list.forEach(function (r) {
      const c = calc(r), pp = pay(r);
      s.received += pp.received; s.pending += pp.pending; s.recWk += pp.recWk; s.recDl += pp.recDl; s.pendWk += pp.pendWk; s.pendDl += pp.pendDl;
      if (pp.pendWk > 0) s.pendWkDays++; if (pp.pendDl > 0) s.pendDlDays++;
      s.full += c.full; s.half += c.half; s.del += c.del; s.extra += c.extra; s.total += c.total;
      s.fullQty += r.fullQty; s.halfQty += r.halfQty; s.delQty += r.delQty;
      if (isWorked(r)) s.days++;
    });
    ['full', 'half', 'del', 'extra', 'total', 'received', 'pending', 'recWk', 'recDl', 'pendWk', 'pendDl'].forEach(function (k) { s[k] = R2(s[k]); });
    s.avg = s.days ? R2(s.total / s.days) : 0;
    return s;
  }
  function inRange(records, from, to) { return records.filter(function (r) { return r.date >= from && r.date <= to; }); }
  function weekRecords(records, anchor) { const a = weekStart(anchor); return inRange(records, a, addDays(a, 6)); }
  function monthRecords(records, key) { return records.filter(function (r) { return monthKey(r.date) === key; }); }
  function weekDays(records, anchor) {
    const a = weekStart(anchor), out = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(a, i);
      const rec = records.find(function (r) { return r.date === d; }) || null;
      out.push({ date: d, rec: rec, calc: rec ? calc(rec) : null });
    }
    return out;
  }
  function monthCompare(records, key) {
    const cur = summarize(monthRecords(records, key)).total;
    const prev = summarize(monthRecords(records, addMonths(key, -1))).total;
    return { cur: cur, prev: prev, diff: R2(cur - prev), pct: prev > 0 ? R2((cur - prev) / prev * 100) : null };
  }
  function dailySeries(records, endISO, n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = addDays(endISO, -i);
      const rec = records.find(function (r) { return r.date === d; });
      out.push({ date: d, value: rec ? calc(rec).total : 0 });
    }
    return out;
  }
  function monthDaySeries(records, key) {
    const out = [], n = daysInMonth(key);
    for (let i = 1; i <= n; i++) {
      const d = key + '-' + pad(i);
      const rec = records.find(function (r) { return r.date === d; });
      out.push({ date: d, value: rec ? calc(rec).total : 0 });
    }
    return out;
  }
  function monthlySeries(records, endKey, n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const k = addMonths(endKey, -i);
      out.push({ key: k, value: summarize(monthRecords(records, k)).total });
    }
    return out;
  }

  /* ---------- CSV e backup ---------- */
  const num = n => String(R2(n).toFixed(2)).replace('.', ',');
  const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""').replace(/[\r\n]+/g, ' ') + '"';
  function toCSV(records) {
    const head = ['Data', 'Diárias', 'Meias-diárias', 'Valor da diária', 'Valor da meia-diária', 'Entregas',
      'Valor por entrega', 'Ganho com diárias', 'Ganho com meias-diárias', 'Ganho com entregas', 'Extras',
      'Total do dia', 'Diárias pagas', 'Data pgto diárias', 'Entregas pagas', 'Data pgto entregas', 'Observações'];
    const rows = records.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (r) {
      const c = calc(r), p = r.date.split('-'), pp = pay(r), bd = function (x) { return x ? x.slice(8) + '/' + x.slice(5, 7) + '/' + x.slice(0, 4) : ''; };
      return [p[2] + '/' + p[1] + '/' + p[0], r.fullQty, r.halfQty, num(r.fullRate), num(r.halfRate), r.delQty,
        num(r.delRate), num(c.full), num(c.half), num(c.del), num(c.extra), num(c.total),
        pp.wkDue ? (pp.wkPaid ? 'Sim' : 'Não') : '—', pp.wkPaid ? bd(r.paidWorkAt) : '', pp.dlDue ? (pp.dlPaid ? 'Sim' : 'Não') : '—', pp.dlPaid ? bd(r.paidDelAt) : '', q(r.notes)].join(';');
    });
    return '\uFEFF' + [head.join(';')].concat(rows).join('\r\n');
  }
  function buildBackup(state) {
    return JSON.stringify({ app: 'controle-diarias', version: 1, exportedAt: new Date().toISOString(),
      settings: state.settings, records: state.records, payments: state.payments || [] }, null, 2);
  }
  function parseBackup(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { return { ok: false, error: 'O arquivo não é um backup válido (JSON ilegível).' }; }
    if (!data || data.app !== 'controle-diarias' || !Array.isArray(data.records))
      return { ok: false, error: 'Este arquivo não parece ser um backup do Controle de Diárias.' };
    const byDate = {}; let skipped = 0;
    data.records.forEach(function (raw) {
      const r = normalizeRecord(raw);
      if (r) byDate[r.date] = r; else skipped++;
    });
    return { ok: true, records: Object.keys(byDate).map(function (k) { return byDate[k]; }), settings: data.settings || {}, skipped: skipped,
      payments: (Array.isArray(data.payments) ? data.payments : []).map(normalizePayment).filter(Boolean) };
  }

  g.Core = {
    R2: R2, toISO: toISO, parseISO: parseISO, addDays: addDays, weekStart: weekStart, monthKey: monthKey,
    addMonths: addMonths, daysInMonth: daysInMonth, today: today, parseMoney: parseMoney, parseQty: parseQty,
    calc: calc, pay: pay, normalizePayment: normalizePayment, isWorked: isWorked, validate: validate, normalizeRecord: normalizeRecord, newId: newId,
    findByDate: findByDate, summarize: summarize, inRange: inRange, weekRecords: weekRecords,
    monthRecords: monthRecords, weekDays: weekDays, monthCompare: monthCompare, dailySeries: dailySeries,
    monthDaySeries: monthDaySeries, monthlySeries: monthlySeries, toCSV: toCSV, buildBackup: buildBackup,
    parseBackup: parseBackup
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.Core;
})(typeof window !== 'undefined' ? window : globalThis);

(function () {
'use strict';
const C = Core;
const KEY = 'controle-diarias:v1';
const DEFAULTS = { fullRate: 0, halfRate: 0, delRate: 0, chartDays: 14, hideValues: false, showNotes: true };
const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const WD = ['dom','seg','ter','qua','qui','sex','sáb'];
const P = {
  grid: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  week: '<rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4M7.5 13.5h2M11 13.5h2M14.5 13.5h2"/>',
  month: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  down: '<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>',
  up: '<path d="M12 16V5M7 9l5-5 5 5M4 20h16"/>'
};
const ic = n => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + P[n] + '</svg>';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- estado e persistência ---------- */
let storageOk = true;
function load() {
  const st = { records: [], payments: [], settings: Object.assign({}, DEFAULTS) };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      st.settings = Object.assign({}, DEFAULTS, d.settings || {});
      if (d._localUpdatedAt) st._localUpdatedAt = d._localUpdatedAt;
      const by = {};
      (d.records || []).forEach(r => { const n = C.normalizeRecord(r); if (n) by[n.date] = n; });
      st.records = Object.keys(by).map(k => by[k]);
      st.payments = (d.payments || []).map(C.normalizePayment).filter(Boolean);
    }
  } catch (e) { storageOk = false; }
  return st;
}
function save() {
  state._localUpdatedAt = new Date().toISOString();
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; }
  catch (e) { storageOk = false; toast('Não foi possível salvar neste navegador. Exporte um backup!'); }
  syncSave();
}
let state = load();
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

/* ---------- sincronização com Supabase (PC + celular) ---------- */
const SB_URL = 'https://ltwamldgdwqzyssoukzl.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0d2FtbGRnZHdxenlzc291a3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzEzMDUsImV4cCI6MjA4MjQ0NzMwNX0.UVyo0c0BHslB7mCU74Qx8rdo42HA0WPAyDQ6J-FIakE';
const SB_TABLE = 'diarias', SB_USER = 'default_user';
let sb = null;
try { sb = window.supabase.createClient(SB_URL, SB_KEY); } catch (e) { sb = null; }
const sync = { busy: false, pending: false, failed: false, timer: null, status: 'off', msg: '', detail: '', last: '' };

function setSync(kind, msg) {
  sync.status = kind; sync.msg = msg;
  if (kind === 'ok') {
    sync.detail = ''; sync.last = new Date().toLocaleTimeString('pt-BR');
    if (!state._synced) { state._synced = true; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  }
  const el = document.getElementById('syncDot');
  if (el) { el.dataset.s = kind; el.querySelector('span').textContent = msg; }
  const info = document.getElementById('syncInfo');
  if (info) info.innerHTML = syncInfoHTML();
}
function syncInfoHTML() {
  const cor = { ok: 'var(--good)', syncing: 'var(--warn)', off: 'var(--bad)', err: 'var(--bad)' }[sync.status] || 'var(--mut)';
  return '<div class="kv"><span>Estado</span><b style="color:' + cor + '">' + esc(sync.msg || '—') + '</b></div>' +
    (sync.last ? '<div class="kv"><span>Última sincronização</span><b>' + esc(sync.last) + '</b></div>' : '') +
    (sync.detail ? '<div class="warn" style="word-break:break-word">Detalhe técnico: ' + esc(sync.detail) + '</div>' : '') +
    '<div class="kv"><span>Neste aparelho</span><b>' + state.records.length + ' dia(s)</b></div>';
}
const isNetErr = e => /load failed|failed to fetch|networkerror|network request failed|network connection|timed? ?out|aborted|schema cache|retrying|service unavailable|bad gateway|gateway time/i.test(String((e && (e.message || e.details)) || e || '')) || (!!e && (e.code === 'PGRST002' || e.status === 503));
const isSchemaLoading = e => !!e && (e.code === 'PGRST002' || /schema cache/i.test(String(e.message || '')));
const isMissingTable = e => !!e && (e.code === 'PGRST205' || e.code === '42P01' || /could not find the table|does not exist/i.test(String(e.message || '')));
const ts = v => { const n = Date.parse(v || ''); return isNaN(n) ? 0 : n; };

function syncError(e) {
  console.error('Sincronização:', e);
  sync.failed = true;
  sync.detail = [e && e.code, e && e.message, e && e.hint, e && e.details].filter(Boolean).join(' · ') || String(e);
  if (isMissingTable(e)) { setSync('err', 'Tabela “diarias” não existe no Supabase'); return; }
  if (isNetErr(e)) {
    setSync('off', isSchemaLoading(e) ? 'Supabase ainda carregando a tabela — tentando de novo' : 'Sem conexão — salvo neste aparelho');
    clearTimeout(sync.timer); sync.timer = setTimeout(() => { if (sync.failed) syncLoad(); }, isSchemaLoading(e) ? 15000 : 30000);
    return;
  }
  setSync('err', 'Erro ao sincronizar: ' + ((e && (e.message || e.code)) || 'desconhecido'));
}

async function syncSave() {
  if (!sb) return;
  if (sync.busy) { sync.pending = true; return; }
  sync.busy = true;
  try {
    do {
      sync.pending = false;
      setSync('syncing', 'Sincronizando…');
      const waits = [0, 1500, 4000, 8000]; let last = null, done = false;
      for (let i = 0; i < waits.length && !done; i++) {
        if (waits[i]) await new Promise(r => setTimeout(r, waits[i]));
        try {
          const r = await sb.from(SB_TABLE).upsert({ id: SB_USER, user_id: SB_USER, dados: state, updated_at: state._localUpdatedAt || new Date().toISOString() });
          if (!r.error) { done = true; break; }
          last = r.error; if (!isNetErr(last)) break;
        } catch (e) { last = e; if (!isNetErr(e)) break; }
      }
      if (done) { sync.failed = false; clearTimeout(sync.timer); setSync('ok', 'Sincronizado'); }
      else { syncError(last); break; }
    } while (sync.pending);
  } finally { sync.busy = false; }
}

async function syncLoad(mode) {
  // mode: undefined = normal | 'pull' = baixar da nuvem (sobrescreve) | 'merge' = juntar os dois
  if (!sb || (sync.busy && !mode)) return;
  try {
    setSync('syncing', 'Sincronizando…');
    const r = await sb.from(SB_TABLE).select('dados,updated_at').eq('user_id', SB_USER).maybeSingle();
    if (r.error) return syncError(r.error);
    const d = r.data && r.data.dados;
    if (!d) {
      if (state.records.length || state._localUpdatedAt) return syncSave();
      sync.failed = false; return setSync('ok', 'Sincronizado');
    }
    const remote = ts(r.data.updated_at || d._localUpdatedAt), local = ts(state._localUpdatedAt);
    const primeiraVez = !state._synced && state.records.length && (d.records || []).length;
    if (mode === 'merge' || primeiraVez) {
      const by = {};
      (d.records || []).forEach(x => { const n = C.normalizeRecord(x); if (n) by[n.date] = n; });
      state.records.forEach(x => { by[x.date] = x; }); // no mesmo dia vale o deste aparelho
      state.records = Object.keys(by).map(k => by[k]);
      const pm = {}; (d.payments || []).map(C.normalizePayment).filter(Boolean).concat(state.payments || []).forEach(x => { pm[x.id] = x; });
      state.payments = Object.keys(pm).map(k => pm[k]);
      state.settings = Object.assign({}, DEFAULTS, d.settings || {}, state.settings);
      save(); render(); toast((primeiraVez && !mode ? 'Dados deste aparelho e da nuvem foram juntados: ' : 'Dados juntados: ') + state.records.length + ' dia(s)');
      return;
    }
    if (remote > local || mode === 'pull') {
      const by = {};
      (d.records || []).forEach(x => { const n = C.normalizeRecord(x); if (n) by[n.date] = n; });
      state = { records: Object.keys(by).map(k => by[k]), payments: (d.payments || []).map(C.normalizePayment).filter(Boolean), settings: Object.assign({}, DEFAULTS, d.settings || {}), _localUpdatedAt: new Date(remote).toISOString(), _synced: true };
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
      sync.failed = false; setSync('ok', 'Sincronizado');
      if (!document.querySelector('#modal .modal')) render();
      if (mode === 'pull') toast('Baixado da nuvem: ' + state.records.length + ' dia(s)');
    } else if (local > remote) {
      return syncSave();
    } else { sync.failed = false; setSync('ok', 'Sincronizado'); }
  } catch (e) { syncError(e); }
}

function syncStart() {
  if (!sb) { setSync('off', 'Sem sincronização (biblioteca não carregou)'); return; }
  syncLoad();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') (sync.failed ? syncSave() : syncLoad()); });
  window.addEventListener('online', () => { sync.failed ? syncSave() : syncLoad(); });
  setInterval(() => { if (document.visibilityState === 'visible' && !sync.busy && !document.querySelector('#modal .modal')) syncLoad(); }, 60000);
  const dot = document.getElementById('syncDot');
  if (dot) dot.addEventListener('click', () => { toast(sync.msg || 'Sincronização'); (sync.failed ? syncSave() : syncLoad()); });
}

const ui = { view: 'painel', week: C.today(), month: C.monthKey(C.today()), cal: C.monthKey(C.today()), f: { from: '', to: '', q: '', pay: '' } };

/* ---------- formatadores ---------- */
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const money = n => state.settings.hideValues ? 'R$ ••••' : BRL.format(n || 0);
const brDate = s => s.slice(8) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4);
const shortDate = s => s.slice(8) + '/' + s.slice(5, 7);
const wdName = s => WD[C.parseISO(s).getDay()];
const inp = n => n ? String(n).replace('.', ',') : '';
const pct = n => (n > 0 ? '+' : '') + n.toFixed(1).replace('.', ',') + '%';
const sgn = n => (n > 0 ? '+ ' : n < 0 ? '− ' : '') + money(Math.abs(n));
const monthLabel = k => { const p = k.split('-'); return MONTHS[+p[1] - 1] + ' de ' + p[0]; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- gráfico SVG ---------- */
let cid = 0;
function barChart(items, hl) {
  const W = 640, H = 210, pt = 22, pb = 28, n = items.length, id = 'g' + (++cid);
  const max = Math.max.apply(null, items.map(i => i.value).concat([1]));
  const bw = (W - 16) / n, w = Math.min(bw * 0.68, 46), step = Math.ceil(n / 10);
  let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46f0d2"/><stop offset="1" stop-color="#2fc7ad" stop-opacity=".55"/></linearGradient></defs>';
  s += '<line x1="8" x2="' + (W - 8) + '" y1="' + (H - pb) + '" y2="' + (H - pb) + '" stroke="rgba(255,255,255,.12)"/>';
  items.forEach((it, i) => {
    const h = it.value > 0 ? Math.max(3, it.value / max * (H - pt - pb)) : 0, x = 8 + i * bw + (bw - w) / 2, y = H - pb - h;
    const on = it.hl;
    s += '<g><title>' + esc(it.title + ': ' + money(it.value)) + '</title>';
    if (h) s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="4" fill="url(#' + id + ')" ' + (on ? '' : 'opacity=".78"') + '/>';
    else s += '<rect x="' + x.toFixed(1) + '" y="' + (H - pb - 2) + '" width="' + w.toFixed(1) + '" height="2" rx="1" fill="rgba(255,255,255,.14)"/>';
    if (n <= 10 && it.value > 0 && !state.settings.hideValues) s += '<text class="vl" x="' + (x + w / 2).toFixed(1) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="middle">' + Math.round(it.value) + '</text>';
    if (i % step === 0 || i === n - 1 && step === 1) s += '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" ' + (on ? 'style="fill:#46f0d2;font-weight:700"' : '') + '>' + esc(it.label) + '</text>';
    s += '</g>';
  });
  return s + '</svg>';
}
const dayItems = (series, hlDate) => series.map(x => ({ label: x.date.slice(8), title: brDate(x.date), value: x.value, hl: x.date === hlDate }));

/* ---------- pagamento (chips, lista, janelas) ---------- */
function payChips(r) {
  const p = C.pay(r), o = [];
  if (p.wkDue) o.push('<button type="button" class="pb ' + (p.wkPaid ? 'ok' : 'pend') + '" data-act="togglepay" data-id="' + r.id + '" data-k="work" title="Toque para alternar">' + (p.wkPaid ? 'Diária paga' : 'Diária a receber') + '</button>');
  if (p.dlDue) o.push('<button type="button" class="pb ' + (p.dlPaid ? 'ok' : 'pend') + '" data-act="togglepay" data-id="' + r.id + '" data-k="del" title="Toque para alternar">' + (p.dlPaid ? 'Entrega paga' : 'Entrega a receber') + '</button>');
  return o.length ? '<div class="pbs">' + o.join('') + '</div>' : '';
}
const payKindLabel = k => k === 'work' ? 'Diárias' : k === 'del' ? 'Entregas' : 'Diárias e entregas';
function payHistory() {
  const list = (state.payments || []).slice().sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  return '<div class="card mt"><div class="row"><h2 class="sp" style="margin:0">Pagamentos lançados</h2><button class="btn sm pri" data-act="payopen">Lançar pagamento</button></div>' +
    (list.length ? '<div class="mt">' + list.map(p => '<div class="day"><div class="d"><b>' + shortDate(p.date) + '</b><span>' + p.date.slice(0, 4) + '</span></div><div class="m">' + payKindLabel(p.kind) + ' · ' + p.items.length + ' item(ns)' + (p.note ? '<br>' + esc(p.note) : '') + '</div><div class="t pos">' + money(p.total) + '</div><button class="btn sm icon-btn dng" title="Desfazer pagamento" data-act="payundo" data-id="' + p.id + '">' + ic('trash') + '</button></div>').join('') + '</div>'
      : '<div class="empty">Nenhum pagamento lançado ainda. Use “Lançar pagamento” quando receber, ou toque nos botões de cada dia.</div>') + '</div>';
}
function pendingItems() {
  const items = [];
  state.records.slice().sort((a, b) => a.date < b.date ? -1 : 1).forEach(r => {
    const p = C.pay(r);
    if (p.wkDue && !p.wkPaid) items.push({ id: r.id, k: 'work', date: r.date, amt: p.wk });
    if (p.dlDue && !p.dlPaid) items.push({ id: r.id, k: 'del', date: r.date, amt: p.dl });
  });
  return items;
}
function openPay() {
  const items = pendingItems();
  if (!items.length) { toast('Nada a receber: tudo está pago'); return; }
  const hasW = items.some(i => i.k === 'work'), hasD = items.some(i => i.k === 'del');
  dialog('<form id="pf" novalidate><div class="row" style="margin-bottom:12px"><h2 class="sp">Lançar pagamento</h2><button type="button" class="btn sm icon-btn" data-act="close" aria-label="Fechar">' + ic('x') + '</button></div>' +
    '<div class="g2"><div class="fld"><label class="f">Data do pagamento</label><input type="date" name="payDate" value="' + C.today() + '"></div>' +
    '<div class="fld"><label class="f">O que foi pago</label><select name="payKind"><option value="all">Diárias e entregas</option>' + (hasW ? '<option value="work">Só diárias</option>' : '') + (hasD ? '<option value="del">Só entregas</option>' : '') + '</select></div></div>' +
    '<div class="row" style="margin-bottom:6px"><span class="note sp">Marque o que você recebeu:</span><button type="button" class="btn sm ghost" id="paySel">Marcar / desmarcar tudo</button></div>' +
    '<div id="payList" style="max-height:38vh;overflow:auto"></div>' +
    '<div class="prev mt"><div class="ln"><span id="payN"></span></div><div class="tot" id="payTot">R$ 0,00</div></div>' +
    '<div class="fld"><label class="f">Observação (opcional)</label><input name="payNote" maxlength="200" placeholder="Ex.: pago em dinheiro pelo Seu João"></div>' +
    '<div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="close">Cancelar</button><button type="submit" class="btn pri">Confirmar pagamento</button></div></form>',
    root => {
      const f = root.querySelector('#pf'), listEl = root.querySelector('#payList');
      const sum = () => { let t = 0, n = 0; listEl.querySelectorAll('[data-pi]:checked').forEach(c => { t += items[+c.dataset.pi].amt; n++; });
        root.querySelector('#payTot').textContent = money(C.R2(t)); root.querySelector('#payN').textContent = n + ' item(ns) selecionado(s)'; };
      const draw = () => {
        const kind = f.elements.payKind.value, vis = items.map((it, i) => ({ it: it, i: i })).filter(x => kind === 'all' || x.it.k === kind);
        listEl.innerHTML = vis.length ? vis.map(x => '<label class="sw"><span>' + shortDate(x.it.date) + ' · ' + (x.it.k === 'work' ? 'Diárias' : 'Entregas') + ' <span class="note">' + wdName(x.it.date) + '</span></span><b>' + money(x.it.amt) + '</b><input type="checkbox" data-pi="' + x.i + '" checked></label>').join('') : '<div class="empty">Nada pendente nesta categoria.</div>';
        sum();
      };
      f.elements.payKind.addEventListener('change', draw);
      listEl.addEventListener('change', sum);
      root.querySelector('#paySel').onclick = () => { const all = Array.prototype.slice.call(listEl.querySelectorAll('[data-pi]')), on = all.every(c => c.checked); all.forEach(c => c.checked = !on); sum(); };
      f.addEventListener('submit', e => {
        e.preventDefault();
        const chosen = Array.prototype.slice.call(listEl.querySelectorAll('[data-pi]:checked')).map(c => items[+c.dataset.pi]);
        if (!chosen.length) { toast('Selecione ao menos um item'); return; }
        const date = f.elements.payDate.value; if (!C.parseISO(date)) { toast('Escolha a data do pagamento'); return; }
        chosen.forEach(it => { const r = state.records.find(x => x.id === it.id); if (!r) return; if (it.k === 'work') { r.paidWork = true; r.paidWorkAt = date; } else { r.paidDel = true; r.paidDelAt = date; } });
        const kinds = {}; chosen.forEach(i => kinds[i.k] = 1); const ks = Object.keys(kinds), total = C.R2(chosen.reduce((a, i) => a + i.amt, 0));
        (state.payments = state.payments || []).push({ id: C.newId(), date: date, kind: ks.length > 1 ? 'both' : ks[0], total: total, note: f.elements.payNote.value.trim().slice(0, 200), items: chosen.map(i => ({ id: i.id, k: i.k })) });
        save(); closeModal(); toast('Pagamento lançado: ' + money(total)); render();
      });
      draw();
    });
}
async function payUndo(id) {
  const p = (state.payments || []).find(x => x.id === id); if (!p) return;
  const a = await choice({ title: 'Desfazer pagamento?', text: 'O pagamento de ' + money(p.total) + ' (' + brDate(p.date) + ') será removido e os ' + p.items.length + ' item(ns) voltam para “a receber”.' }, [{ v: 'y', l: 'Desfazer', cls: 'dng' }]);
  if (a !== 'y') return;
  p.items.forEach(it => { const r = state.records.find(x => x.id === it.id); if (!r) return; if (it.k === 'work') { r.paidWork = false; r.paidWorkAt = ''; } else { r.paidDel = false; r.paidDelAt = ''; } });
  state.payments = state.payments.filter(x => x.id !== id); save(); toast('Pagamento desfeito'); render();
}

/* ---------- blocos de visão ---------- */
const stat = (l, v, s, cls) => '<div class="card stat ' + (cls || '') + '"><div class="l">' + l + '</div><div class="v">' + v + '</div>' + (s ? '<div class="s">' + s + '</div>' : '') + '</div>';
const head = (t, sub, extra) => '<div class="row"><div class="sp"><h1>' + t + '</h1><p class="sub">' + sub + '</p></div>' + (extra || '') + '</div>';

function sumCards(s) {
  return '<div class="grid cards" style="margin-bottom:12px">' +
    stat('Recebido', money(s.received), 'diárias ' + money(s.recWk) + ' · entregas ' + money(s.recDl), 'hero') +
    stat('A receber', money(s.pending), 'diárias ' + money(s.pendWk) + ' · entregas ' + money(s.pendDl), 'hero pend') + '</div>' +
    '<div class="grid cards">' +
    stat('Diárias completas', money(s.full), s.fullQty + (s.fullQty === 1 ? ' diária' : ' diárias')) +
    stat('Meias-diárias', money(s.half), s.halfQty + (s.halfQty === 1 ? ' meia' : ' meias')) +
    stat('Entregas', money(s.del), s.delQty + (s.delQty === 1 ? ' entrega' : ' entregas')) +
    stat('Ganhos extras', money(s.extra), '') +
    stat('Diárias + meias', s.fullQty + ' + ' + s.halfQty, 'quantidade no período') +
    stat('Total de entregas', String(s.delQty), 'quantidade no período') +
    stat('Dias trabalhados', String(s.days), 'média ' + money(s.avg) + '/dia') +
    stat('Total geral', money(s.total), '', 'accent') + '</div>';
}

function viewPainel() {
  const t = C.today(), recs = state.records;
  const day = C.summarize(C.inRange(recs, t, t)), wk = C.summarize(C.weekRecords(recs, t)), mo = C.summarize(C.monthRecords(recs, C.monthKey(t)));
  const setup = !recs.length && !state.settings.fullRate && !state.settings.halfRate && !state.settings.delRate;
  const nd = state.settings.chartDays;
  const last = recs.slice().sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 5);
  return head('Painel', cap(wdFull(t)) + ', ' + brDate(t)) +
    (setup ? '<div class="warn" style="margin:0 0 14px">Comece definindo seus valores padrão de diária, meia-diária e entrega. <button class="btn sm" data-act="nav" data-v="config">Abrir configurações</button></div>' : '') +
    (function () { const all = C.summarize(recs); return '<div class="card" style="margin-bottom:12px"><div class="row"><h2 class="sp" style="margin:0">A receber</h2><button class="btn sm pri" data-act="payopen">Lançar pagamento</button></div>' +
      '<div class="grid cards mt" style="grid-template-columns:repeat(2,1fr)">' + stat('Diárias a receber', money(all.pendWk), all.pendWkDays + ' dia(s) pendente(s)', 'pend') + stat('Entregas a receber', money(all.pendDl), all.pendDlDays + ' dia(s) pendente(s)', 'pend') + '</div>' +
      '<div class="kv"><span>Total já recebido</span><b class="pos">' + money(all.received) + '</b></div></div>'; })() +
    '<div class="grid cards">' +
    '<div class="card stat hero"><div class="l">Ganhos de hoje</div><div class="v">' + money(day.total) + '</div><div class="s">' +
      (C.findByDate(recs, t) ? 'Lançamento de hoje registrado' : 'Nenhum lançamento hoje · <a href="#" data-act="new" data-d="' + t + '" style="color:var(--acc)">lançar agora</a>') + '</div></div>' +
    stat('Semana atual', money(wk.total), wk.days + ' dia(s) trabalhado(s)') +
    stat('Mês atual', money(mo.total), mo.days + ' dia(s) trabalhado(s)') +
    stat('Diárias no mês', String(mo.fullQty), 'completas') +
    stat('Meias-diárias no mês', String(mo.halfQty), 'meias') +
    stat('Entregas no mês', String(mo.delQty), 'no total') +
    stat('Média por dia trabalhado', money(mo.avg), 'no mês atual') + '</div>' +
    '<div class="card mt"><div class="row"><h2 class="sp" style="margin:0">Ganhos por dia</h2><div class="seg">' +
    [7, 14, 30].map(n => '<button data-act="cdays" data-n="' + n + '" class="' + (nd === n ? 'on' : '') + '">' + n + ' dias</button>').join('') + '</div></div>' +
    '<div class="mt">' + barChart(dayItems(C.dailySeries(recs, t, nd), t)) + '</div></div>' +
    '<div class="card mt"><h2>Últimos lançamentos</h2>' + (last.length ? last.map(dayRow).join('') : '<div class="empty">Nenhum lançamento ainda. Toque em “Novo dia”.</div>') + '</div>';
}
const wdFull = s => ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'][C.parseISO(s).getDay()];
function dayRow(r) {
  const c = C.calc(r), bits = [];
  if (r.fullQty) bits.push(r.fullQty + ' diária' + (r.fullQty > 1 ? 's' : ''));
  if (r.halfQty) bits.push(r.halfQty + ' meia' + (r.halfQty > 1 ? 's' : ''));
  if (r.delQty) bits.push(r.delQty + ' entrega' + (r.delQty > 1 ? 's' : ''));
  if (c.extra) bits.push('extra');
  return '<div class="day" data-act="detail" data-id="' + r.id + '" style="cursor:pointer"><div class="d"><b>' + shortDate(r.date) + '</b><span>' + wdName(r.date) + '</span></div><div class="m">' + (bits.join(' · ') || '—') + payChips(r) + '</div><div class="t">' + money(c.total) + '</div></div>';
}

/* Lançamentos */
function filtered() {
  const f = ui.f, q = f.q.trim().toLowerCase();
  return state.records.filter(r => (!f.from || r.date >= f.from) && (!f.to || r.date <= f.to) &&
    (!f.pay || (f.pay === 'pend' ? C.pay(r).pending > 0 : C.pay(r).pending === 0)) && (!q || brDate(r.date).includes(q) || r.date.includes(q) || (r.notes || '').toLowerCase().includes(q)))
    .sort((a, b) => a.date < b.date ? 1 : -1);
}
function histTable() {
  const list = filtered();
  if (!list.length) return '<div class="empty">' + (state.records.length ? 'Nenhum registro encontrado com esses filtros.' : 'Nenhum lançamento ainda. Toque em “Novo dia” para começar.') + '</div>';
  const s = C.summarize(list), showN = state.settings.showNotes;
  const rows = list.map(r => {
    const c = C.calc(r);
    return '<tr><td data-l="Data">' + brDate(r.date) + ' <span class="note">' + wdName(r.date) + '</span>' + (showN && r.notes ? '<span class="n">' + esc(r.notes) + '</span>' : '') + '</td>' +
      '<td data-l="Diárias">' + r.fullQty + '</td><td data-l="Meias-diárias">' + r.halfQty + '</td><td data-l="Entregas">' + r.delQty + '</td>' +
      '<td data-l="Ganho com diárias">' + money(c.full + c.half) + '</td><td data-l="Ganho com entregas">' + money(c.del) + '</td><td data-l="Extras">' + money(c.extra) + '</td>' +
      '<td class="tt" data-l="Total do dia">' + money(c.total) + '</td>' +
      '<td data-l="Pagamento">' + (payChips(r) || '<span class="note">—</span>') + '</td>' +
      '<td class="acts-c"><div class="acts"><button class="btn sm icon-btn" title="Detalhes" data-act="detail" data-id="' + r.id + '">' + ic('eye') + '</button><button class="btn sm icon-btn" title="Editar" data-act="edit" data-id="' + r.id + '">' + ic('edit') + '</button><button class="btn sm icon-btn dng" title="Excluir" data-act="del" data-id="' + r.id + '">' + ic('trash') + '</button></div></td></tr>';
  }).join('');
  return '<table><thead><tr><th>Data</th><th>Diárias</th><th>Meias-diárias</th><th>Entregas</th><th>Ganho com diárias</th><th>Ganho com entregas</th><th>Extras</th><th>Total do dia</th><th>Pagamento</th><th>Ações</th></tr></thead><tbody>' + rows + '</tbody>' +
    '<tfoot><tr><td data-l="Totais (' + list.length + ' dias)">Totais</td><td data-l="Diárias">' + s.fullQty + '</td><td data-l="Meias-diárias">' + s.halfQty + '</td><td data-l="Entregas">' + s.delQty + '</td><td data-l="Ganho com diárias">' + money(s.full + s.half) + '</td><td data-l="Ganho com entregas">' + money(s.del) + '</td><td data-l="Extras">' + money(s.extra) + '</td><td class="tt" data-l="Total">' + money(s.total) + '</td><td data-l="Recebido / A receber"><span class="pos">' + money(s.received) + '</span> · <span class="pendtxt">' + money(s.pending) + '</span></td><td></td></tr></tfoot></table>';
}
function calendar() {
  const k = ui.cal, first = C.parseISO(k + '-01'), off = (first.getDay() + 6) % 7, n = C.daysInMonth(k), t = C.today();
  let h = '<div class="row" style="margin-bottom:10px"><button class="btn sm icon-btn" data-act="calnav" data-n="-1" aria-label="Mês anterior">' + ic('left') + '</button><div class="sp" style="text-align:center;font-weight:600">' + cap(monthLabel(k)) + '</div><button class="btn sm icon-btn" data-act="calnav" data-n="1" aria-label="Próximo mês">' + ic('right') + '</button></div><div class="cal">';
  ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].forEach(d => h += '<div class="h">' + d + '</div>');
  for (let i = 0; i < off; i++) h += '<button class="mt0" tabindex="-1"></button>';
  for (let d = 1; d <= n; d++) {
    const iso = k + '-' + String(d).padStart(2, '0'), r = C.findByDate(state.records, iso);
    h += '<button class="' + (r ? 'has ' : '') + (iso === t ? 'td' : '') + '" data-act="' + (r ? 'detail" data-id="' + r.id : 'new" data-d="' + iso) + '" aria-label="' + brDate(iso) + '">' + d + '</button>';
  }
  return h + '</div><p class="note" style="margin:10px 0 0">Dias destacados já têm lançamento. Toque em um dia vazio para registrar.</p>';
}
function viewLanc() {
  const f = ui.f;
  return head('Lançamentos', 'Histórico de todos os dias registrados.') +
    '<div class="card"><div class="g3"><div><label class="f">De</label><input type="date" data-filter="from" value="' + f.from + '"></div><div><label class="f">Até</label><input type="date" data-filter="to" value="' + f.to + '"></div><div style="grid-column:span 3"><label class="f">Pagamento</label><select data-filter="pay"><option value="">Todos</option><option value="pend"' + (f.pay === 'pend' ? ' selected' : '') + '>A receber</option><option value="paid"' + (f.pay === 'paid' ? ' selected' : '') + '>Pagos</option></select></div><div style="grid-column:span 3"><label class="f">Pesquisar por data ou observação</label><input type="search" data-filter="q" placeholder="Ex.: 15/10 ou 2026-10" value="' + esc(f.q) + '"></div></div>' +
    '<div class="row mt"><button class="btn sm" data-act="clearf">Limpar filtros</button><button class="btn sm pri" data-act="payopen">Lançar pagamento</button></div></div>' +
    '<div class="grid mt" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))"><div class="card" id="calWrap">' + calendar() + '</div></div>' +
    '<div class="mt" id="histWrap">' + histTable() + '</div>' + payHistory();
}

/* Semanal */
function viewSemana() {
  const a = C.weekStart(ui.week), e = C.addDays(a, 6), recs = state.records, days = C.weekDays(recs, a), s = C.summarize(C.weekRecords(recs, a)), t = C.today();
  return head('Resumo semanal', 'Segunda a domingo: ' + brDate(a) + ' – ' + brDate(e)) +
    '<div class="row" style="margin-bottom:14px"><button class="btn icon-btn" data-act="wk" data-n="-1" aria-label="Semana anterior">' + ic('left') + '</button><button class="btn icon-btn" data-act="wk" data-n="1" aria-label="Próxima semana">' + ic('right') + '</button><button class="btn" data-act="wk0">Esta semana</button><div style="max-width:170px"><input type="date" data-wkdate value="' + a + '" aria-label="Ir para a semana de"></div></div>' +
    sumCards(s) +
    '<div class="card mt"><h2>Ganhos por dia da semana</h2>' + barChart(days.map(d => ({ label: wdName(d.date) + ' ' + d.date.slice(8), title: brDate(d.date), value: d.calc ? d.calc.total : 0, hl: d.date === t }))) + '</div>' +
    '<div class="card mt"><h2>Dia a dia</h2>' + days.map(d => d.rec ? dayRow(d.rec) :
      '<div class="day"><div class="d"><b>' + shortDate(d.date) + '</b><span>' + wdName(d.date) + '</span></div><div class="m">Sem lançamento</div><button class="btn sm" data-act="new" data-d="' + d.date + '">' + ic('plus') + 'Lançar</button></div>').join('') + '</div>';
}

/* Mensal */
function viewMes() {
  const k = ui.month, recs = state.records, s = C.summarize(C.monthRecords(recs, k)), cmp = C.monthCompare(recs, k), y = +k.slice(0, 4), m = +k.slice(5);
  const years = {}; years[y] = 1; years[new Date().getFullYear()] = 1; recs.forEach(r => years[+r.date.slice(0, 4)] = 1);
  const ys = Object.keys(years).map(Number).sort((a, b) => b - a);
  const prevK = C.addMonths(k, -1);
  const cls = cmp.diff > 0 ? 'pos' : cmp.diff < 0 ? 'neg' : '';
  return head('Resumo mensal', cap(monthLabel(k))) +
    '<div class="row" style="margin-bottom:14px"><button class="btn icon-btn" data-act="mo" data-n="-1" aria-label="Mês anterior">' + ic('left') + '</button><button class="btn icon-btn" data-act="mo" data-n="1" aria-label="Próximo mês">' + ic('right') + '</button>' +
    '<select data-sel="month" style="width:auto" aria-label="Mês">' + MONTHS.map((n, i) => '<option value="' + (i + 1) + '"' + (i + 1 === m ? ' selected' : '') + '>' + cap(n) + '</option>').join('') + '</select>' +
    '<select data-sel="year" style="width:auto" aria-label="Ano">' + ys.map(v => '<option' + (v === y ? ' selected' : '') + '>' + v + '</option>').join('') + '</select><button class="btn" data-act="mo0">Este mês</button></div>' +
    sumCards(s) +
    '<div class="card mt"><h2>Comparação com o mês anterior</h2><div class="kv"><span>' + cap(monthLabel(prevK)) + '</span><b>' + money(cmp.prev) + '</b></div><div class="kv"><span>' + cap(monthLabel(k)) + '</span><b>' + money(cmp.cur) + '</b></div>' +
    '<div class="kv"><span>Diferença</span><b class="' + cls + '">' + sgn(cmp.diff) + (cmp.pct === null ? '' : ' (' + pct(cmp.pct) + ')') + '</b></div>' +
    (cmp.pct === null ? '<p class="note" style="margin:8px 0 0">Sem valores no mês anterior, então o percentual não se aplica.</p>' : '') + '</div>' +
    '<div class="card mt"><h2>Ganhos por dia do mês</h2>' + barChart(dayItems(C.monthDaySeries(recs, k), C.today())) + '</div>' +
    '<div class="card mt"><h2>Últimos 6 meses</h2>' + barChart(C.monthlySeries(recs, k, 6).map(x => ({ label: x.key.slice(5) + '/' + x.key.slice(2, 4), title: cap(monthLabel(x.key)), value: x.value, hl: x.key === k }))) + '</div>';
}

/* Configurações */
function viewConfig() {
  const s = state.settings;
  return head('Configurações', 'Valores padrão e preferências.') +
    '<div class="card"><h2>Valores padrão (em reais)</h2><p class="note" style="margin-top:-6px">Preenchem os novos lançamentos. Alterar aqui não muda registros já salvos.</p>' +
    '<form id="cfgForm" novalidate><div class="g3"><div class="fld"><label class="f">Diária completa</label><input name="fullRate" inputmode="decimal" placeholder="0,00" value="' + inp(s.fullRate) + '"></div><div class="fld"><label class="f">Meia-diária</label><input name="halfRate" inputmode="decimal" placeholder="0,00" value="' + inp(s.halfRate) + '"></div><div class="fld"><label class="f">Por entrega</label><input name="delRate" inputmode="decimal" placeholder="0,00" value="' + inp(s.delRate) + '"></div></div>' +
    '<div class="emsg" id="cfgErr"></div><p class="note">Deixe “por entrega” em branco se as entregas não são pagas individualmente: você informa o total no lançamento.</p>' +
    '<div class="kv"><span>Moeda</span><b>Real brasileiro (R$)</b></div><button class="btn pri mt" type="submit">Salvar valores</button></form></div>' +
    '<div class="card mt"><h2>Preferências de visualização</h2>' +
    '<label class="sw"><span>Ocultar valores na tela<br><span class="note">Mostra R$ •••• (privacidade)</span></span><input type="checkbox" data-pref="hideValues"' + (s.hideValues ? ' checked' : '') + '></label>' +
    '<label class="sw"><span>Mostrar observações na tabela</span><input type="checkbox" data-pref="showNotes"' + (s.showNotes ? ' checked' : '') + '></label>' +
    '<div class="sw"><span>Período do gráfico do painel</span><div class="seg">' + [7, 14, 30].map(n => '<button data-act="cdays" data-n="' + n + '" class="' + (s.chartDays === n ? 'on' : '') + '">' + n + '</button>').join('') + '</div></div></div>' +
    '<div class="card mt"><h2>Sincronização</h2><div id="syncInfo">' + syncInfoHTML() + '</div>' +
    '<div class="row mt"><button class="btn" data-act="syncnow">Sincronizar agora</button><button class="btn" data-act="syncmerge">Juntar com a nuvem</button></div>' +
    '<div class="row mt"><button class="btn sm ghost" data-act="syncpull">Baixar da nuvem (substitui este aparelho)</button><button class="btn sm ghost" data-act="syncpush">Enviar este aparelho (substitui a nuvem)</button></div>' +
    '<p class="note">Se o PC e o celular têm dias diferentes, use “Juntar com a nuvem” em um deles: os dias dos dois aparelhos ficam, e depois o outro aparelho recebe tudo.</p></div>' +
    '<div class="card mt"><h2>Dados e backup</h2><p class="note" style="margin-top:-6px">' + state.records.length + ' registro(s) salvo(s) e sincronizado(s) entre seus aparelhos.</p>' +
    '<div class="row"><button class="btn" data-act="csv">' + ic('down') + 'Exportar CSV</button><button class="btn" data-act="backup">' + ic('down') + 'Baixar backup</button><button class="btn" data-act="restore">' + ic('up') + 'Restaurar backup</button></div>' +
    '<div class="row mt"><button class="btn sm ghost" data-act="copycsv">Copiar CSV como texto</button><button class="btn sm ghost" data-act="copybackup">Copiar backup como texto</button><button class="btn sm ghost" data-act="pastebackup">Restaurar de texto</button></div>' +
    '<p class="note">Se o download de arquivos não funcionar no seu navegador, use as opções de texto.</p>' +
    '<input type="file" id="restoreFile" accept=".json,application/json" class="hidden">' +
    '<div class="warn">Seus dados são salvos neste aparelho e sincronizados automaticamente com o Supabase, então aparecem no PC e no celular. Ainda assim, baixe um backup de tempos em tempos.' + (storageOk ? '' : ' <b>Atenção: o armazenamento deste navegador não está disponível agora.</b>') + '</div>' +
    '<div class="row mt"><button class="btn dng sm" data-act="wipe">' + ic('trash') + 'Apagar todos os dados</button></div></div>';
}

/* ---------- render ---------- */
const NAV = [['painel', 'Painel', 'grid'], ['lanc', 'Lançamentos', 'list'], ['semana', 'Semanal', 'week'], ['mes', 'Mensal', 'month'], ['config', 'Ajustes', 'gear']];
const VIEWS = { painel: viewPainel, lanc: viewLanc, semana: viewSemana, mes: viewMes, config: viewConfig };
function render() {
  document.getElementById('app').innerHTML = '<div class="shell"><nav class="nav"><div class="brand"><i>' + ic('month') + '</i>Controle de Diárias</div>' +
    NAV.map(n => '<button data-act="nav" data-v="' + n[0] + '" class="' + (ui.view === n[0] ? 'on' : '') + '">' + ic(n[2]) + '<span>' + n[1] + '</span></button>').join('') + '</nav>' +
    '<main>' + VIEWS[ui.view]() + '</main></div><button class="btn pri fab" data-act="new">' + ic('plus') + 'Novo dia</button>';
}
function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

/* ---------- modais ---------- */
const mroot = () => document.getElementById('modal');
const closeModal = () => { mroot().innerHTML = ''; };
function dialog(html, onOpen) {
  mroot().innerHTML = '<div class="back" data-act="backdrop"><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>';
  if (onOpen) onOpen(mroot());
}
function choice(msg, opts) {
  return new Promise(res => {
    dialog('<h2>' + esc(msg.title) + '</h2><p class="note">' + esc(msg.text) + '</p><div class="row mt" style="justify-content:flex-end">' +
      '<button class="btn" data-c="">Cancelar</button>' + opts.map(o => '<button class="btn ' + (o.cls || '') + '" data-c="' + o.v + '">' + esc(o.l) + '</button>').join('') + '</div>',
      el => el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { closeModal(); res(b.dataset.c || null); }));
  });
}

function detail(id) {
  const r = state.records.find(x => x.id === id); if (!r) return;
  const c = C.calc(r);
  const delLine = r.delRate > 0 ? r.delQty + ' × ' + money(r.delRate) : r.delQty + ' (total informado manualmente)';
  dialog('<div class="row"><h2 class="sp">' + cap(wdFull(r.date)) + ', ' + brDate(r.date) + '</h2><button class="btn sm icon-btn" data-act="close" aria-label="Fechar">' + ic('x') + '</button></div>' +
    '<div class="prev mt"><div class="tot">' + money(c.total) + '</div><div class="ln"><span>Total do dia</span></div></div>' +
    '<div class="kv"><span>Diárias completas (' + r.fullQty + ' × ' + money(r.fullRate) + ')</span><b>' + money(c.full) + '</b></div>' +
    '<div class="kv"><span>Meias-diárias (' + r.halfQty + ' × ' + money(r.halfRate) + ')</span><b>' + money(c.half) + '</b></div>' +
    '<div class="kv"><span>Entregas (' + delLine + ')</span><b>' + money(c.del) + '</b></div>' +
    '<div class="kv"><span>Extras</span><b>' + money(c.extra) + '</b></div>' +
    (payChips(r) ? '<div class="kv"><span>Pagamento <span class="note">(toque para alternar)</span></span><span>' + payChips(r) + '</span></div>' : '') +
    (r.notes ? '<div class="kv"><span>Observações</span><b style="text-align:right;max-width:60%;font-weight:500">' + esc(r.notes) + '</b></div>' : '') +
    '<div class="row mt" style="justify-content:flex-end"><button class="btn dng" data-act="del" data-id="' + r.id + '">' + ic('trash') + 'Excluir</button><button class="btn pri" data-act="edit" data-id="' + r.id + '">' + ic('edit') + 'Editar</button></div>');
}

function openForm(opt) {
  opt = opt || {};
  const ex = opt.id ? state.records.find(r => r.id === opt.id) : null, s = state.settings;
  const v = ex || { date: opt.date || C.today(), fullQty: 0, halfQty: 0, delQty: 0, fullRate: s.fullRate, halfRate: s.halfRate, delRate: s.delRate, delManual: 0, extra: 0, notes: '' };
  const stepper = (n, label) => '<div><label class="f">' + label + '</label><div class="step"><button type="button" data-step="' + n + ':-1" aria-label="Diminuir">−</button><input name="' + n + '" inputmode="numeric" value="' + v[n] + '"><button type="button" data-step="' + n + ':1" aria-label="Aumentar">+</button></div><div class="emsg" data-e="' + n + '"></div></div>';
  const money_f = (n, label, ph) => '<div class="fld"><label class="f">' + label + '</label><input name="' + n + '" inputmode="decimal" placeholder="' + (ph || '0,00') + '" value="' + inp(v[n]) + '"><div class="emsg" data-e="' + n + '"></div></div>';
  const openRates = !ex && !(s.fullRate || s.halfRate || s.delRate);
  dialog('<form id="f" novalidate><div class="row" style="margin-bottom:12px"><h2 class="sp">' + (ex ? 'Editar dia' : 'Novo dia') + '</h2><button type="button" class="btn sm icon-btn" data-act="close" aria-label="Fechar">' + ic('x') + '</button></div>' +
    '<div class="fld"><label class="f">Data</label><input type="date" name="date" value="' + v.date + '"><div class="emsg" data-e="date"></div><div class="warn hidden" id="dup"></div></div>' +
    '<div class="g3" style="margin-bottom:12px">' + stepper('fullQty', 'Diárias') + stepper('halfQty', 'Meias') + stepper('delQty', 'Entregas') + '</div>' +
    '<div id="manualWrap" class="hidden">' + money_f('delManual', 'Total ganho com as entregas (R$)') + '</div>' +
    money_f('extra', 'Valor extra (opcional)') +
    '<details' + (openRates ? ' open' : '') + '><summary>Valores deste dia (alterar só aqui)</summary><div class="g3">' + money_f('fullRate', 'Diária') + money_f('halfRate', 'Meia') + money_f('delRate', 'Por entrega') + '</div><p class="note" style="margin:0 0 10px">Deixe “por entrega” zerado se as entregas não são pagas individualmente.</p></details>' +
    '<div id="payBox" style="margin-bottom:12px"><label class="f">Pagamento</label>' +
    '<label class="sw" id="rowW"><span>Diárias / meias / extras já pagas</span><input type="checkbox" name="paidWork" value="1"' + (v.paidWork ? ' checked' : '') + '></label>' +
    '<label class="sw" id="rowD"><span>Entregas já pagas</span><input type="checkbox" name="paidDel" value="1"' + (v.paidDel ? ' checked' : '') + '></label></div>' +
    '<div class="fld"><label class="f">Observações (opcional)</label><textarea name="notes" rows="2" maxlength="500">' + esc(v.notes) + '</textarea></div>' +
    '<div class="prev"><div class="ln"><span>Total do dia</span></div><div class="tot" id="pTot">R$ 0,00</div><div id="pLn"></div></div>' +
    '<div class="emsg" data-e="_" style="margin-bottom:8px"></div>' +
    '<div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="close">Cancelar</button><button type="submit" class="btn pri">' + (ex ? 'Salvar alterações' : 'Salvar dia') + '</button></div></form>',
    root => {
      const f = root.querySelector('#f');
      const raw = () => { const o = {}; Array.prototype.forEach.call(f.elements, e => { if (e.name) o[e.name] = e.type === 'checkbox' ? (e.checked ? '1' : '') : e.value; }); return o; };
      const soft = o => ({ date: o.date, notes: '', fullQty: C.parseQty(o.fullQty) || 0, halfQty: C.parseQty(o.halfQty) || 0, delQty: C.parseQty(o.delQty) || 0,
        fullRate: C.parseMoney(o.fullRate) || 0, halfRate: C.parseMoney(o.halfRate) || 0, delRate: C.parseMoney(o.delRate) || 0, delManual: C.parseMoney(o.delManual) || 0, extra: C.parseMoney(o.extra) || 0 });
      const dupCheck = () => {
        const d = C.findByDate(state.records, f.elements.date.value, ex && ex.id), box = root.querySelector('#dup');
        if (d) { box.innerHTML = 'Já existe um lançamento em ' + brDate(d.date) + ' (' + money(C.calc(d).total) + '). <button type="button" class="btn sm" data-act="swap" data-id="' + d.id + '">Editar o registro existente</button>'; box.classList.remove('hidden'); }
        else box.classList.add('hidden');
        return d;
      };
      const refresh = () => {
        const o = soft(raw()), c = C.calc(o);
        root.querySelector('#manualWrap').classList.toggle('hidden', !(o.delRate === 0 && o.delQty > 0));
        root.querySelector('#rowW').classList.toggle('hidden', !((c.full + c.half + c.extra) > 0));
        root.querySelector('#rowD').classList.toggle('hidden', !(c.del > 0));
        root.querySelector('#pTot').textContent = money(c.total);
        root.querySelector('#pLn').innerHTML = [['Diárias', c.full], ['Meias-diárias', c.half], ['Entregas', c.del], ['Extras', c.extra]].map(x => '<div class="ln"><span>' + x[0] + '</span><span>' + money(x[1]) + '</span></div>').join('');
      };
      f.addEventListener('input', () => { refresh(); });
      f.elements.date.addEventListener('change', dupCheck);
      f.addEventListener('click', e => {
        const b = e.target.closest('[data-step]'); if (!b) return;
        const p = b.dataset.step.split(':'), el = f.elements[p[0]], cur = C.parseQty(el.value);
        el.value = Math.max(0, (Number.isNaN(cur) ? 0 : cur) + +p[1]); refresh();
      });
      f.addEventListener('submit', e => {
        e.preventDefault();
        root.querySelectorAll('.emsg').forEach(x => x.textContent = ''); root.querySelectorAll('.err').forEach(x => x.classList.remove('err'));
        const res = C.validate(raw());
        if (!res.ok) {
          Object.keys(res.errors).forEach(k => { const m = root.querySelector('[data-e="' + k + '"]'); if (m) m.textContent = res.errors[k]; if (f.elements[k]) f.elements[k].classList.add('err'); });
          return;
        }
        if (dupCheck()) { root.querySelector('#dup').scrollIntoView({ block: 'center' }); return; }
        const rec = res.record, hoje = C.today();
        rec.paidWorkAt = rec.paidWork ? ((ex && ex.paidWork && ex.paidWorkAt) || hoje) : '';
        rec.paidDelAt = rec.paidDel ? ((ex && ex.paidDel && ex.paidDelAt) || hoje) : '';
        if (ex) { rec.id = ex.id; state.records = state.records.map(r => r.id === ex.id ? rec : r); }
        else { rec.id = C.newId(); state.records.push(rec); }
        save(); closeModal(); toast(ex ? 'Registro atualizado' : 'Dia salvo: ' + money(C.calc(rec).total));
        ui.cal = C.monthKey(rec.date); render();
      });
      refresh(); dupCheck();
    });
}

async function del(id) {
  const r = state.records.find(x => x.id === id); if (!r) return;
  const a = await choice({ title: 'Excluir lançamento?', text: 'O dia ' + brDate(r.date) + ' (' + money(C.calc(r).total) + ') será removido. Isso não pode ser desfeito.' }, [{ v: 'y', l: 'Excluir', cls: 'dng' }]);
  if (a !== 'y') return;
  state.records = state.records.filter(x => x.id !== id); save(); toast('Registro excluído'); render();
}

/* ---------- download ---------- */
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: type }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
}
const stamp = () => C.today();

/* ---------- eventos ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, d = el.dataset;
  if (a === 'backdrop') { if (e.target === el) closeModal(); return; }
  if (a !== 'detail' && el.tagName === 'A') e.preventDefault();
  switch (a) {
    case 'nav': ui.view = d.v; render(); window.scrollTo(0, 0); break;
    case 'new': closeModal(); openForm({ date: d.d }); break;
    case 'edit': closeModal(); openForm({ id: d.id }); break;
    case 'swap': closeModal(); openForm({ id: d.id }); break;
    case 'detail': detail(d.id); break;
    case 'close': closeModal(); break;
    case 'del': closeModal(); del(d.id); break;
    case 'cdays': state.settings.chartDays = +d.n; save(); render(); break;
    case 'wk': ui.week = C.addDays(ui.week, 7 * +d.n); render(); break;
    case 'wk0': ui.week = C.today(); render(); break;
    case 'mo': ui.month = C.addMonths(ui.month, +d.n); render(); break;
    case 'mo0': ui.month = C.monthKey(C.today()); render(); break;
    case 'calnav': ui.cal = C.addMonths(ui.cal, +d.n); document.getElementById('calWrap').innerHTML = calendar(); break;
    case 'clearf': ui.f = { from: '', to: '', q: '', pay: '' }; render(); break;
    case 'csv': if (!state.records.length) return toast('Não há registros para exportar'); download('diarias-' + stamp() + '.csv', C.toCSV(state.records), 'text/csv;charset=utf-8'); break;
    case 'backup': download('backup-diarias-' + stamp() + '.json', C.buildBackup(state), 'application/json'); toast('Backup baixado'); break;
    case 'restore': document.getElementById('restoreFile').click(); break;
    case 'copybackup': copyText(C.buildBackup(state), 'Backup (texto)'); break;
    case 'copycsv': if (!state.records.length) return toast('Não há registros para exportar'); copyText(C.toCSV(state.records).replace(/^\uFEFF/, ''), 'CSV (texto)'); break;
    case 'pastebackup': pasteDialog(); break;
    case 'dopaste': { const v = document.getElementById('pasteArea').value; closeModal(); restoreText(v); break; }
    case 'togglepay': {
      const r = state.records.find(x => x.id === d.id); if (!r) break;
      const hoje = C.today(), inModal = !!el.closest('#modal');
      if (d.k === 'work') { r.paidWork = !r.paidWork; r.paidWorkAt = r.paidWork ? hoje : ''; } else { r.paidDel = !r.paidDel; r.paidDelAt = r.paidDel ? hoje : ''; }
      save(); render(); if (inModal) detail(r.id);
      toast((d.k === 'work' ? 'Diária ' : 'Entrega ') + ((d.k === 'work' ? r.paidWork : r.paidDel) ? 'marcada como paga' : 'voltou para a receber'));
      break;
    }
    case 'payopen': closeModal(); openPay(); break;
    case 'payundo': payUndo(d.id); break;
    case 'syncnow': if (!sb) { toast('Biblioteca de sincronização não carregou. Recarregue a página.'); break; } toast('Sincronizando…'); if (sync.failed) await syncSave(); else await syncLoad(); break;
    case 'syncmerge': if (!sb) { toast('Biblioteca de sincronização não carregou.'); break; } await syncLoad('merge'); break;
    case 'syncpull': if (!sb) { toast('Biblioteca de sincronização não carregou.'); break; } await syncLoad('pull'); break;
    case 'syncpush': if (!sb) { toast('Biblioteca de sincronização não carregou.'); break; } save(); toast('Enviando este aparelho…'); break;
    case 'wipe': {
      const x = await choice({ title: 'Apagar todos os dados?', text: 'Todos os ' + state.records.length + ' registros serão removidos deste aparelho. Baixe um backup antes se tiver dúvida.' }, [{ v: 'y', l: 'Apagar tudo', cls: 'dng' }]);
      if (x === 'y') { state.records = []; state.payments = []; save(); toast('Dados apagados'); render(); }
      break;
    }
  }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.filter) { ui.f[t.dataset.filter] = t.value; document.getElementById('histWrap').innerHTML = histTable(); }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.dataset.wkdate !== undefined) { if (C.parseISO(t.value)) { ui.week = t.value; render(); } }
  else if (t.dataset.sel) {
    const sel = n => document.querySelector('[data-sel="' + n + '"]').value;
    ui.month = sel('year') + '-' + String(sel('month')).padStart(2, '0'); render();
  } else if (t.dataset.pref) { state.settings[t.dataset.pref] = t.checked; save(); render(); }
  else if (t.id === 'restoreFile') {
    const file = t.files[0]; if (!file) return;
    const text = await file.text(); t.value = '';
    restoreText(text);
  }
});
async function restoreText(text) {
  const res = C.parseBackup(text);
  if (!res.ok) return toast(res.error);
  const how = await choice({ title: 'Restaurar backup', text: res.records.length + ' registro(s) no backup' + (res.skipped ? ' (' + res.skipped + ' inválido(s) ignorado(s))' : '') + '. Mesclar mantém seus dados atuais e sobrescreve só os dias repetidos; substituir apaga tudo e usa o backup.' },
    [{ v: 'merge', l: 'Mesclar', cls: 'pri' }, { v: 'replace', l: 'Substituir tudo', cls: 'dng' }]);
  if (!how) return;
  if (how === 'replace') state.records = res.records;
  else { const by = {}; state.records.concat(res.records).forEach(r => by[r.date] = r); state.records = Object.keys(by).map(k => by[k]); }
  state.settings = Object.assign({}, DEFAULTS, state.settings, how === 'replace' ? res.settings : {});
  save(); toast('Backup restaurado'); render();
}
function copyText(text, label) {
  const fallback = () => dialog('<div class="row"><h2 class="sp">' + label + '</h2><button class="btn sm icon-btn" data-act="close" aria-label="Fechar">' + ic('x') + '</button></div><p class="note">Selecione tudo, copie e guarde em um lugar seguro.</p><textarea id="copyArea" rows="10" readonly></textarea>',
    r => { const a = r.querySelector('#copyArea'); a.value = text; a.focus(); a.select(); });
  try { navigator.clipboard.writeText(text).then(() => toast('Copiado'), fallback); } catch (e) { fallback(); }
}
function pasteDialog() {
  dialog('<div class="row"><h2 class="sp">Restaurar de texto</h2><button class="btn sm icon-btn" data-act="close" aria-label="Fechar">' + ic('x') + '</button></div><p class="note">Cole aqui o texto do backup copiado antes.</p><textarea id="pasteArea" rows="8"></textarea><div class="row mt" style="justify-content:flex-end"><button class="btn pri" data-act="dopaste">Restaurar</button></div>');
}
document.addEventListener('submit', e => {
  if (e.target.id !== 'cfgForm') return;
  e.preventDefault();
  const f = e.target, v = ['fullRate', 'halfRate', 'delRate'].map(n => C.parseMoney(f.elements[n].value));
  if (v.some(Number.isNaN)) { document.getElementById('cfgErr').textContent = 'Use valores válidos, por exemplo 120,50.'; return; }
  state.settings.fullRate = v[0]; state.settings.halfRate = v[1]; state.settings.delRate = v[2];
  save(); toast('Valores padrão salvos'); render();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
render();
if (!storageOk) toast('Armazenamento indisponível: faça backups.');
syncStart();
window.__app = { state: () => state, ui: ui };
})();