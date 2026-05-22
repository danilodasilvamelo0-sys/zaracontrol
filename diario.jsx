import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "diario_confessionario_v1";

const EMOCOES = ["Controle","Raiva","Foco","Culpa","Ambição","Vazio","Clareza","Tensão","Poder","Ansiedade","Frieza","Impulso"];
const TAGS_PESSOAS = ["Família","Mãe","Pai","Rosa","Trabalho","Inimigo","Aliado","Ninguém"];

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatarData(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function calcularIndice(entradas) {
  if (!entradas.length) return 0;
  const media = entradas.reduce((s, e) => s + (e.nota || 5), 0) / entradas.length;
  return Math.round(media * 10);
}

export default function DiarioConfessionario() {
  const [entradas, setEntradas] = useState([]);
  const [aba, setAba] = useState("escrever");
  const [busca, setBusca] = useState("");
  const [filtroEmocao, setFiltroEmocao] = useState("");
  const [form, setForm] = useState({
    estadoMental: "",
    nota: 7,
    emocao: "",
    tags: [],
    texto: "",
    vitoria: "",
    falha: "",
    data: new Date().toISOString().split("T")[0],
  });
  const [editandoId, setEditandoId] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) setEntradas(JSON.parse(salvo));
    } catch {}
  }, []);

  function salvar(lista) {
    setEntradas(lista);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lista)); } catch {}
  }

  function salvarEntrada() {
    if (!form.texto.trim() && !form.vitoria.trim() && !form.falha.trim()) return;
    const nova = { id: gerarId(), ...form, criadoEm: new Date().toISOString() };
    if (editandoId) {
      salvar(entradas.map(e => e.id === editandoId ? { ...nova, id: editandoId } : e));
      setEditandoId(null);
    } else {
      salvar([nova, ...entradas]);
    }
    setForm({ estadoMental: "", nota: 7, emocao: "", tags: [], texto: "", vitoria: "", falha: "", data: new Date().toISOString().split("T")[0] });
    setAba("linha-do-tempo");
  }

  function editarEntrada(e) {
    setForm({ estadoMental: e.estadoMental, nota: e.nota, emocao: e.emocao, tags: e.tags || [], texto: e.texto, vitoria: e.vitoria, falha: e.falha, data: e.data });
    setEditandoId(e.id);
    setAba("escrever");
  }

  function deletarEntrada(id) {
    salvar(entradas.filter(e => e.id !== id));
  }

  function toggleTag(tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
    }));
  }

  const entradasFiltradas = entradas.filter(e => {
    const matchBusca = !busca || e.texto?.toLowerCase().includes(busca.toLowerCase()) || e.vitoria?.toLowerCase().includes(busca.toLowerCase()) || e.falha?.toLowerCase().includes(busca.toLowerCase()) || e.estadoMental?.toLowerCase().includes(busca.toLowerCase());
    const matchEmocao = !filtroEmocao || e.emocao === filtroEmocao;
    return matchBusca && matchEmocao;
  });

  const totalVitorias = entradas.filter(e => e.vitoria?.trim()).length;
  const totalFalhas = entradas.filter(e => e.falha?.trim()).length;
  const indiceDisciplina = calcularIndice(entradas);
  const estadoAtual = entradas[0]?.estadoMental || "—";

  const notaMedia = entradas.length
    ? (entradas.reduce((s, e) => s + (e.nota || 5), 0) / entradas.length).toFixed(1)
    : "—";

  const emocaoFrequente = (() => {
    if (!entradas.length) return "—";
    const freq = {};
    entradas.forEach(e => { if (e.emocao) freq[e.emocao] = (freq[e.emocao] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  })();

  const corNota = (n) => {
    if (n >= 8) return "#4ade80";
    if (n >= 5) return "#facc15";
    return "#f87171";
  };

  const gsMini = entradas.slice(0, 14).reverse().map(e => e.nota || 5);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e8e6e0", fontFamily: "'Courier New', monospace", display: "flex" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: "#0d0d0d", borderRight: "1px solid #1a1a1a", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#555", textTransform: "uppercase", marginBottom: 6 }}>Sistema</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, color: "#e8e6e0" }}>CONFESSIONÁRIO</div>
          <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 4, letterSpacing: 1 }}>v1.0 — local</div>
        </div>

        {[
          { id: "escrever", label: "▸  Escrever" },
          { id: "linha-do-tempo", label: "▸  Linha do Tempo" },
          { id: "padroes", label: "▸  Padrões" },
          { id: "busca", label: "▸  Busca" },
        ].map(item => (
          <button key={item.id} onClick={() => setAba(item.id)} style={{ background: aba === item.id ? "#1a1a1a" : "transparent", border: "none", borderLeft: aba === item.id ? "2px solid #e8e6e0" : "2px solid transparent", color: aba === item.id ? "#e8e6e0" : "#555", padding: "10px 14px", textAlign: "left", fontSize: 12, letterSpacing: 1, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}>
            {item.label}
          </button>
        ))}

        <div style={{ marginTop: "auto", borderTop: "1px solid #1a1a1a", paddingTop: 20 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "#333", textTransform: "uppercase", marginBottom: 10 }}>Estado Atual</div>
          <div style={{ fontSize: 12, color: "#e8e6e0", marginBottom: 4, fontWeight: 700 }}>{estadoAtual}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <div style={{ fontSize: 9, color: "#333", letterSpacing: 2 }}>ÍNDICE</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: corNota(Math.round(indiceDisciplina / 10)) }}>{indiceDisciplina}</div>
            <div style={{ fontSize: 9, color: "#333" }}>/100</div>
          </div>

          {/* Mini gráfico */}
          {gsMini.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginTop: 12, height: 28 }}>
              {gsMini.map((n, i) => (
                <div key={i} style={{ flex: 1, background: corNota(n), height: `${(n / 10) * 28}px`, minHeight: 2, borderRadius: 1, opacity: 0.8 }} />
              ))}
            </div>
          )}
          <div style={{ fontSize: 9, color: "#2a2a2a", marginTop: 4, letterSpacing: 1 }}>últimas notas</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 900, overflowY: "auto" }}>

        {/* ===== ABA ESCREVER ===== */}
        {aba === "escrever" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: "#333", textTransform: "uppercase", marginBottom: 8 }}>{editandoId ? "editando registro" : "novo registro"}</div>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: "#e8e6e0", margin: 0 }}>
                {editandoId ? "Corrigindo o passado." : "O que aconteceu hoje."}
              </h1>
              <p style={{ fontSize: 12, color: "#3a3a3a", marginTop: 8 }}>Sem filtro. Sem performance. Só a verdade.</p>
            </div>

            {/* Linha 1 — metadados */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Estado Mental</label>
                <input value={form.estadoMental} onChange={e => setForm(f => ({ ...f, estadoMental: e.target.value }))} placeholder="Ex: frio, acelerado, perdido..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Data</label>
                <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Nota do Dia — {form.nota}/10</label>
                <input type="range" min={1} max={10} value={form.nota} onChange={e => setForm(f => ({ ...f, nota: Number(e.target.value) }))} style={{ width: "100%", marginTop: 8, accentColor: corNota(form.nota) }} />
              </div>
            </div>

            {/* Emoção */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Emoção Dominante</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {EMOCOES.map(em => (
                  <button key={em} onClick={() => setForm(f => ({ ...f, emocao: f.emocao === em ? "" : em }))} style={{ ...chipStyle, background: form.emocao === em ? "#e8e6e0" : "#0d0d0d", color: form.emocao === em ? "#080808" : "#555", border: `1px solid ${form.emocao === em ? "#e8e6e0" : "#1f1f1f"}` }}>
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags de pessoas */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Pessoas Envolvidas</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {TAGS_PESSOAS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{ ...chipStyle, background: form.tags.includes(tag) ? "#1f1a0d" : "#0d0d0d", color: form.tags.includes(tag) ? "#c4a44a" : "#444", border: `1px solid ${form.tags.includes(tag) ? "#4a3a10" : "#1f1f1f"}` }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Texto principal */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Descarga — escreva tudo</label>
              <textarea ref={textareaRef} value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))} placeholder="O papel digital não julga. Pressão, raiva, culpa, ambição, o que não pode ficar dentro..." style={{ ...textareaStyle, height: 160 }} />
            </div>

            {/* Vitória e Falha */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ ...labelStyle, color: "#4ade80" }}>▲ Vitória do Dia</label>
                <textarea value={form.vitoria} onChange={e => setForm(f => ({ ...f, vitoria: e.target.value }))} placeholder="O que funcionou." style={{ ...textareaStyle, height: 100, borderColor: "#14291a" }} />
              </div>
              <div>
                <label style={{ ...labelStyle, color: "#f87171" }}>▼ Falha do Dia</label>
                <textarea value={form.falha} onChange={e => setForm(f => ({ ...f, falha: e.target.value }))} placeholder="O que cedeu." style={{ ...textareaStyle, height: 100, borderColor: "#291414" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button onClick={salvarEntrada} style={btnPrimario}>
                {editandoId ? "Atualizar Registro" : "Selar Registro"}
              </button>
              {editandoId && (
                <button onClick={() => { setEditandoId(null); setForm({ estadoMental: "", nota: 7, emocao: "", tags: [], texto: "", vitoria: "", falha: "", data: new Date().toISOString().split("T")[0] }); }} style={btnSecundario}>
                  Cancelar
                </button>
              )}
              <span style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: 1 }}>armazenado localmente · privado</span>
            </div>
          </div>
        )}

        {/* ===== ABA LINHA DO TEMPO ===== */}
        {aba === "linha-do-tempo" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 4, color: "#333", textTransform: "uppercase", marginBottom: 8 }}>arquivo pessoal</div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "#e8e6e0", margin: 0 }}>Linha do Tempo</h1>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                <span style={{ color: "#4ade80" }}>▲ {totalVitorias}</span>
                <span style={{ color: "#f87171" }}>▼ {totalFalhas}</span>
                <span style={{ color: "#555" }}>{entradas.length} registros</span>
              </div>
            </div>

            {entradasFiltradas.length === 0 ? (
              <div style={{ color: "#2a2a2a", fontSize: 13, padding: "40px 0" }}>Nenhum registro ainda.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {entradasFiltradas.map(e => (
                  <div key={e.id}>
                    <div onClick={() => setExpandido(expandido === e.id ? null : e.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", background: expandido === e.id ? "#111" : "transparent", border: "1px solid", borderColor: expandido === e.id ? "#222" : "transparent", borderRadius: 6, cursor: "pointer", transition: "all 0.15s" }}>
                      <div style={{ fontSize: 10, color: "#333", width: 120, flexShrink: 0 }}>{formatarData(e.data)}</div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, color: "#e8e6e0" }}>{e.estadoMental || <span style={{ color: "#2a2a2a" }}>sem estado</span>}</span>
                        {e.emocao && <span style={{ fontSize: 10, color: "#555", marginLeft: 10 }}>{e.emocao}</span>}
                        {e.tags?.length > 0 && e.tags.map(t => <span key={t} style={{ fontSize: 9, color: "#4a3a10", background: "#1a1500", padding: "1px 6px", borderRadius: 3, marginLeft: 6 }}>{t}</span>)}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: corNota(e.nota), width: 28, textAlign: "right" }}>{e.nota}</div>
                      <div style={{ fontSize: 10, color: "#2a2a2a" }}>{expandido === e.id ? "▲" : "▼"}</div>
                    </div>

                    {expandido === e.id && (
                      <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderTop: "none", borderRadius: "0 0 6px 6px", padding: "20px 20px 16px" }}>
                        {e.texto && (
                          <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.7, marginBottom: 16, whiteSpace: "pre-wrap", borderLeft: "2px solid #1f1f1f", paddingLeft: 14 }}>{e.texto}</p>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                          {e.vitoria && (
                            <div style={{ padding: 12, borderLeft: "2px solid #14291a", paddingLeft: 12 }}>
                              <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: 2, marginBottom: 6 }}>VITÓRIA</div>
                              <div style={{ fontSize: 12, color: "#aaa" }}>{e.vitoria}</div>
                            </div>
                          )}
                          {e.falha && (
                            <div style={{ padding: 12, borderLeft: "2px solid #291414", paddingLeft: 12 }}>
                              <div style={{ fontSize: 9, color: "#f87171", letterSpacing: 2, marginBottom: 6 }}>FALHA</div>
                              <div style={{ fontSize: 12, color: "#aaa" }}>{e.falha}</div>
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={() => editarEntrada(e)} style={{ ...btnSecundario, fontSize: 10, padding: "6px 14px" }}>editar</button>
                          <button onClick={() => deletarEntrada(e.id)} style={{ ...btnSecundario, fontSize: 10, padding: "6px 14px", color: "#f87171", borderColor: "#291414" }}>deletar</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ABA PADRÕES ===== */}
        {aba === "padroes" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: "#333", textTransform: "uppercase", marginBottom: 8 }}>análise</div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#e8e6e0", margin: 0 }}>Padrões Mentais</h1>
              <p style={{ fontSize: 12, color: "#3a3a3a", marginTop: 8 }}>O que se repete, você não vê. Aqui você vê.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
              {[
                { label: "Nota Média", valor: notaMedia, cor: corNota(parseFloat(notaMedia) || 5) },
                { label: "Emoção Frequente", valor: emocaoFrequente, cor: "#c4a44a" },
                { label: "Índice Disciplina", valor: indiceDisciplina + "/100", cor: corNota(Math.round(indiceDisciplina / 10)) },
                { label: "Total Registros", valor: entradas.length, cor: "#e8e6e0" },
                { label: "Vitórias Registradas", valor: totalVitorias, cor: "#4ade80" },
                { label: "Falhas Registradas", valor: totalFalhas, cor: "#f87171" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 6, padding: "16px 18px" }}>
                  <div style={{ fontSize: 9, color: "#333", letterSpacing: 2, marginBottom: 8 }}>{stat.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: stat.cor }}>{stat.valor}</div>
                </div>
              ))}
            </div>

            {/* Distribuição de emoções */}
            <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 6, padding: "20px 24px", marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: "#333", letterSpacing: 2, marginBottom: 16 }}>DISTRIBUIÇÃO DE EMOÇÕES</div>
              {(() => {
                const freq = {};
                entradas.forEach(e => { if (e.emocao) freq[e.emocao] = (freq[e.emocao] || 0) + 1; });
                const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
                const max = sorted[0]?.[1] || 1;
                return sorted.length ? sorted.map(([em, n]) => (
                  <div key={em} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "#555", width: 80, flexShrink: 0 }}>{em}</div>
                    <div style={{ flex: 1, height: 4, background: "#1a1a1a", borderRadius: 2 }}>
                      <div style={{ width: `${(n / max) * 100}%`, height: "100%", background: "#c4a44a", borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#333", width: 16 }}>{n}</div>
                  </div>
                )) : <div style={{ fontSize: 12, color: "#2a2a2a" }}>Nenhuma emoção registrada ainda.</div>;
              })()}
            </div>

            {/* Gráfico de notas ao longo do tempo */}
            <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 6, padding: "20px 24px" }}>
              <div style={{ fontSize: 9, color: "#333", letterSpacing: 2, marginBottom: 16 }}>NOTAS — ÚLTIMOS 30 REGISTROS</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
                {entradas.slice(0, 30).reverse().map((e, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: "100%", background: corNota(e.nota), height: `${(e.nota / 10) * 54}px`, minHeight: 2, borderRadius: 2, transition: "height 0.3s" }} title={`${formatarData(e.data)}: ${e.nota}`} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: "#2a2a2a" }}>
                <span>mais antigo</span><span>mais recente</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== ABA BUSCA ===== */}
        {aba === "busca" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: "#333", textTransform: "uppercase", marginBottom: 8 }}>arquivo</div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#e8e6e0", margin: 0 }}>Busca</h1>
            </div>

            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nos registros..." style={{ ...inputStyle, marginBottom: 16, fontSize: 14 }} />

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
              <button onClick={() => setFiltroEmocao("")} style={{ ...chipStyle, background: !filtroEmocao ? "#e8e6e0" : "#0d0d0d", color: !filtroEmocao ? "#080808" : "#555" }}>Todos</button>
              {EMOCOES.map(em => (
                <button key={em} onClick={() => setFiltroEmocao(filtroEmocao === em ? "" : em)} style={{ ...chipStyle, background: filtroEmocao === em ? "#e8e6e0" : "#0d0d0d", color: filtroEmocao === em ? "#080808" : "#555", border: `1px solid ${filtroEmocao === em ? "#e8e6e0" : "#1f1f1f"}` }}>
                  {em}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 10, color: "#2a2a2a", marginBottom: 16 }}>{entradasFiltradas.length} resultado{entradasFiltradas.length !== 1 ? "s" : ""}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {entradasFiltradas.map(e => (
                <div key={e.id} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 6, padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, color: "#555" }}>{formatarData(e.data)}</span>
                      {e.emocao && <span style={{ fontSize: 10, color: "#c4a44a", marginLeft: 12 }}>{e.emocao}</span>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: corNota(e.nota) }}>{e.nota}</span>
                  </div>
                  {e.estadoMental && <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{e.estadoMental}</div>}
                  {e.texto && <p style={{ fontSize: 11, color: "#555", lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{e.texto}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 9,
  letterSpacing: 3,
  color: "#3a3a3a",
  textTransform: "uppercase",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  background: "#0d0d0d",
  border: "1px solid #1a1a1a",
  borderRadius: 4,
  padding: "10px 12px",
  color: "#e8e6e0",
  fontSize: 13,
  fontFamily: "'Courier New', monospace",
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  background: "#0d0d0d",
  border: "1px solid #1a1a1a",
  borderRadius: 4,
  padding: "12px 14px",
  color: "#e8e6e0",
  fontSize: 13,
  fontFamily: "'Courier New', monospace",
  outline: "none",
  resize: "none",
  lineHeight: 1.7,
  boxSizing: "border-box",
};

const chipStyle = {
  border: "1px solid #1f1f1f",
  borderRadius: 3,
  padding: "5px 10px",
  fontSize: 10,
  letterSpacing: 1,
  cursor: "pointer",
  fontFamily: "'Courier New', monospace",
  transition: "all 0.15s",
};

const btnPrimario = {
  background: "#e8e6e0",
  color: "#080808",
  border: "none",
  borderRadius: 4,
  padding: "12px 24px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 2,
  cursor: "pointer",
  fontFamily: "'Courier New', monospace",
  textTransform: "uppercase",
};

const btnSecundario = {
  background: "transparent",
  color: "#555",
  border: "1px solid #1a1a1a",
  borderRadius: 4,
  padding: "12px 20px",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "'Courier New', monospace",
  letterSpacing: 1,
};
