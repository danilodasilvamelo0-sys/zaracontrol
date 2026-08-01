/* ============================================================
   SAUDE.JS — lógica da página Saúde
   ============================================================ */

// ==========================================
        // CONFIGURAÇÃO SUPABASE
        // ==========================================
        const SUPABASE_URL = 'https://ltwamldgdwqzyssoukzl.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0d2FtbGRnZHdxenlzc291a3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzEzMDUsImV4cCI6MjA4MjQ0NzMwNX0.UVyo0c0BHslB7mCU74Qx8rdo42HA0WPAyDQ6J-FIakE';
        const USER_ID = 'default_user';
        
        let supabaseClient = null;
        let useSupabase = false;
        
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            useSupabase = true;
        } catch (e) {
            console.log('Supabase indisponivel, usando localStorage');
        }

        // ==========================================
        // ESTRUTURA DE DADOS
        // ==========================================
        const dadosVazios = {
            planoSemanal: { segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [] },
            statusHoje: {},
            treinos: [],
            alertasTreino: [],
            refeicoes: [],
            telegram: { botToken: '', chatId: '', ativo: false },
            notificacoesEnviadas: {}
        };

        let saude = JSON.parse(localStorage.getItem('saude_v1')) || JSON.parse(JSON.stringify(dadosVazios));
        if (!saude.planoSemanal) saude.planoSemanal = JSON.parse(JSON.stringify(dadosVazios.planoSemanal));
        if (!saude.statusHoje) saude.statusHoje = {};
        if (!saude.treinos) saude.treinos = [];
        if (!saude.alertasTreino) saude.alertasTreino = [];
        if (!saude.refeicoes) saude.refeicoes = [];
        if (!saude.telegram) saude.telegram = { botToken: '', chatId: '', ativo: false };
        if (!saude.notificacoesEnviadas) saude.notificacoesEnviadas = {};

        let planoTemp = [];

        // ==========================================
        // FUNÇÕES DE SINCRONIZAÇÃO
        // ==========================================
        function salvarDados() {
            localStorage.setItem('saude_v1', JSON.stringify(saude));
            
            if (navigator.onLine && useSupabase) {
                salvarSupabase();
            }
        }

        async function salvarSupabase() {
            if (!useSupabase) return;
            
            try {
                // Primeiro tenta criar/atualizar na tabela saude_dados
                const { error } = await supabaseClient.from('saude_dados').upsert({
                    id: USER_ID,
                    user_id: USER_ID,
                    dados: saude,
                    updated_at: new Date().toISOString()
                });
                
                if (error) {
                    // Se a tabela não existe, tenta criar via insert
                    if (error.code === '42P01') {
                        console.log('Tabela saude_dados nao existe, salvando apenas local');
                        return;
                    }
                    console.error('Erro Supabase:', error);
                    return;
                }
                
                mostrarStatus('Sincronizado', 'success');
            } catch (e) {
                console.error('Exceção Supabase:', e);
            }
        }

        async function carregarSupabase() {
            if (!useSupabase) return false;
            
            try {
                const { data, error } = await supabaseClient
                    .from('saude_dados')
                    .select('*')
                    .eq('user_id', USER_ID)
                    .maybeSingle();

                if (error) {
                    // Se tabela não existe, ignora silenciosamente
                    if (error.code === '42P01') {
                        console.log('Tabela saude_dados nao existe ainda');
                        return false;
                    }
                    console.error('Erro ao carregar:', error);
                    return false;
                }

                if (data?.dados) {
                    saude = {
                        ...dadosVazios,
                        ...data.dados
                    };
                    localStorage.setItem('saude_v1', JSON.stringify(saude));
                    mostrarStatus('Dados carregados', 'success');
                    return true;
                }
                return false;
            } catch (e) {
                console.error('Exceção:', e);
                return false;
            }
        }

        function mostrarStatus(msg, tipo) {
            let status = document.getElementById('syncStatus');
            if (!status) {
                status = document.createElement('div');
                status.id = 'syncStatus';
                document.body.appendChild(status);
            }
            
            status.textContent = msg;
            status.style.background = tipo === 'success' ? 'rgba(39, 174, 96, 0.95)' : 'rgba(231, 76, 60, 0.95)';
            status.style.opacity = '1';
            
            setTimeout(() => { status.style.opacity = '0'; }, 3000);
        }

        // ==========================================
        // NAVEGAÇÃO
        // ==========================================
        function navigateTo(section, element) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            if (element) element.classList.add('active');
            document.querySelectorAll('.page-section').forEach(page => page.classList.remove('active'));
            document.getElementById('page-' + section).classList.add('active');
        }

        function mudarSubAba(aba, btn) {
            if (aba === 'calendario') { setTimeout(renderCalMed, 50); }
            document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.sub-content').forEach(c => c.classList.remove('active'));
            document.getElementById('sub-' + aba).classList.add('active');
            if (aba === 'hoje') renderizarHoje();
            else if (aba === 'historico') renderizarHistorico(7);
            else if (aba === 'semana') renderizarSemana();
            else if (aba === 'editar') renderizarPlanoLista();
        }

        // ==========================================
        // UTILIDADES
        // ==========================================
        function getDiaAtual() { 
            const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']; 
            return dias[new Date().getDay()]; 
        }
        function getDataHoje() { return new Date().toISOString().split('T')[0]; }
        function getDiaNome(dia) { 
            const nomes = { 'segunda': 'Segunda-feira', 'terca': 'Terca-feira', 'quarta': 'Quarta-feira', 'quinta': 'Quinta-feira', 'sexta': 'Sexta-feira', 'sabado': 'Sabado', 'domingo': 'Domingo' }; 
            return nomes[dia] || dia; 
        }
        function getEstoqueClass(estoque) { 
            if (estoque <= 0) return 'estoque-critico'; 
            if (estoque <= 5) return 'estoque-baixo'; 
            return 'estoque-ok'; 
        }
        function getTipoAbrev(tipo) {
            const abrev = { 'comprimidos': 'comp', 'capsulas': 'caps', 'ml': 'ml', 'gotas': 'gotas' };
            return abrev[tipo] || 'comp';
        }

        // ==========================================
        // RENDERIZAR DASHBOARD E ALERTAS
        // ==========================================
        function atualizarDashboard() {
            const diaAtual = getDiaAtual();
            const dataHoje = getDataHoje();
            const medsHoje = saude.planoSemanal[diaAtual] || [];
            const statusHoje = saude.statusHoje?.data === dataHoje ? saude.statusHoje.tomados || {} : {};
            
            // KPI: Tomados hoje
            const totalHoje = medsHoje.length;
            const tomadosHoje = medsHoje.filter(m => statusHoje[m.id]).length;
            document.getElementById('kpiTomados').textContent = `${tomadosHoje}/${totalHoje}`;
            
            // KPI: Próximo medicamento
            const agora = new Date();
            const horaAtual = agora.getHours().toString().padStart(2, '0') + ':' + agora.getMinutes().toString().padStart(2, '0');
            const medsOrdenados = [...medsHoje].sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));
            const proximoMed = medsOrdenados.find(m => !statusHoje[m.id] && (m.hora || '00:00') >= horaAtual);
            
            if (proximoMed) {
                document.getElementById('kpiProximo').textContent = proximoMed.hora || '--:--';
                document.getElementById('kpiProximoNome').textContent = proximoMed.nome;
            } else {
                document.getElementById('kpiProximo').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px;margin-right:3px"><polyline points="20 6 9 17 4 12"/></svg>';
                document.getElementById('kpiProximoNome').textContent = 'Concluído';
            }
            
            // KPI: Estoque baixo
            const medsEstoqueBaixo = [];
            const medsVistos = new Set();
            Object.keys(saude.planoSemanal).forEach(dia => {
                saude.planoSemanal[dia].forEach(med => {
                    if (!medsVistos.has(med.id) && med.estoque <= 7) {
                        medsEstoqueBaixo.push(med);
                        medsVistos.add(med.id);
                    }
                });
            });
            document.getElementById('kpiEstoqueBaixo').textContent = medsEstoqueBaixo.length;
            
            // Alertas de estoque
            const alertasContainer = document.getElementById('medAlertas');
            const alertasLista = document.getElementById('medAlertaLista');
            if (medsEstoqueBaixo.length > 0) {
                alertasContainer.style.display = 'block';
                alertasLista.innerHTML = medsEstoqueBaixo.map(med => `
                    <div class="med-alerta-item">
                        <span class="med-alerta-nome">${med.nome}</span>
                        <span class="med-alerta-qtd">${med.estoque} ${getTipoAbrev(med.tipo)} restantes</span>
                    </div>
                `).join('');
            } else {
                alertasContainer.style.display = 'none';
            }
            
            // KPI: Aderência 7 dias
            const aderencia = calcularAderencia(7);
            document.getElementById('kpiAderencia').textContent = aderencia + '%';
        }
        
        function calcularAderencia(dias) {
            if (!saude.historicoMeds) return 0;
            
            let totalDoses = 0;
            let dosesTomadas = 0;
            
            for (let i = 0; i < dias; i++) {
                const data = new Date();
                data.setDate(data.getDate() - i);
                const dataStr = data.toISOString().split('T')[0];
                const hist = saude.historicoMeds[dataStr];
                
                if (hist) {
                    totalDoses += hist.total || 0;
                    dosesTomadas += hist.tomados || 0;
                }
            }
            
            if (totalDoses === 0) return 0;
            return Math.round((dosesTomadas / totalDoses) * 100);
        }

        // ==========================================
        // RENDERIZAR HOJE (TIMELINE)
        // ==========================================
        function renderizarHoje() {
            const diaAtual = getDiaAtual();
            const dataHoje = getDataHoje();
            const medsHoje = saude.planoSemanal[diaAtual] || [];
            
            if (!saude.statusHoje || saude.statusHoje.data !== dataHoje) { 
                // Salvar histórico do dia anterior
                salvarHistoricoDia();
                saude.statusHoje = { data: dataHoje, tomados: {}, horasTomadas: {} }; 
                salvarDados();
            }
            
            atualizarDashboard();
            
            const container = document.getElementById('medTimeline');
            const mensagem = document.getElementById('mensagemHoje');
            
            if (medsHoje.length === 0) { 
                container.innerHTML = ''; 
                container.style.display = 'none'; 
                mensagem.style.display = 'block'; 
                return; 
            }
            
            container.style.display = 'block'; 
            mensagem.style.display = 'none';
            
            const agora = new Date();
            const horaAtual = agora.getHours().toString().padStart(2, '0') + ':' + agora.getMinutes().toString().padStart(2, '0');
            
            // Ordenar por horário
            const medsOrdenados = [...medsHoje].sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));
            
            container.innerHTML = medsOrdenados.map(med => {
                const tomado = saude.statusHoje.tomados && saude.statusHoje.tomados[med.id];
                const horaMed = med.hora || '00:00';
                const tolerancia = med.tolerancia || 30;
                
                // Calcular status
                let statusClass = 'pendente';
                let statusTexto = 'Pendente';
                
                if (tomado) {
                    const horaTomada = saude.statusHoje.horasTomadas?.[med.id] || horaMed;
                    statusClass = 'tomado';
                    statusTexto = `Tomado ${horaTomada}`;
                } else if (horaAtual > horaMed) {
                    // Verificar tolerância
                    const [h, m] = horaMed.split(':').map(Number);
                    const horaLimite = new Date();
                    horaLimite.setHours(h, m + tolerancia, 0);
                    const limiteStr = horaLimite.getHours().toString().padStart(2, '0') + ':' + horaLimite.getMinutes().toString().padStart(2, '0');
                    
                    if (horaAtual <= limiteStr) {
                        statusClass = 'atrasado';
                        statusTexto = 'Atrasado';
                    } else {
                        statusClass = 'perdido';
                        statusTexto = 'Perdido';
                    }
                }
                
                // Categoria badge
                const catClass = med.categoria === 'sos' ? 'sos' : (med.categoria === 'antibiotico' ? 'antibiotico' : '');
                const catNome = { 'continuo': 'Contínuo', 'temporario': 'Temporário', 'sos': 'SOS', 'antibiotico': 'Antibiótico' };
                
                return `
                <div class="med-timeline-item ${tomado ? 'tomado' : ''}">
                    <div class="med-col med-col-hora">
                        <span class="med-col-label">HORÁRIO</span>
                        <span class="med-col-valor">${horaMed}</span>
                        <span class="med-col-status ${statusClass}">${statusTexto}</span>
                    </div>
                    <div class="med-col med-col-nome">
                        <span class="med-col-label">MEDICAMENTO</span>
                        <span class="med-col-valor">${med.nome}</span>
                        ${med.categoria ? `<span class="med-timeline-categoria ${catClass}">${catNome[med.categoria] || ''}</span>` : ''}
                    </div>
                    <div class="med-col med-col-dose">
                        <span class="med-col-label">DOSE</span>
                        <span class="med-col-valor">${med.dose}</span>
                    </div>
                    <div class="med-col med-col-estoque">
                        <span class="med-col-label">ESTOQUE</span>
                        <span class="med-col-valor ${getEstoqueClass(med.estoque)}">${med.estoque} ${getTipoAbrev(med.tipo)}</span>
                        ${(() => { const dr = calcularDiasRestantes(med); if (dr < 999) { const {txt,cls} = textoDiasRestantes(dr); return `<span class="med-dias-restantes ${cls}">${txt}</span>`; } return ''; })()}
                        ${(saude.statusHoje?.notas?.[med.id]) ? `<span class="med-nota-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ${saude.statusHoje.notas[med.id]}</span>` : ''}
                    </div>
                    <div class="med-col med-col-actions">
                        <button class="btn-notify ${med.notificar ? 'active' : ''}" onclick="toggleNotificar('${med.id}')" title="Notificação Telegram">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        </button>
                        <button class="med-check-btn ${tomado ? 'checked' : ''}" onclick="${tomado ? 'toggleTomadoComNota' : 'abrirModalNota'}('${med.id}', ${!tomado})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                    </div>
                </div>`;
            }).join('');
        }

        function salvarHistoricoDia() {
            if (!saude.statusHoje || !saude.statusHoje.data) return;
            
            const data = saude.statusHoje.data;
            const diaAnterior = new Date(data);
            const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
            const diaSemana = diasSemana[diaAnterior.getDay()];
            const medsdia = saude.planoSemanal[diaSemana] || [];
            
            if (!saude.historicoMeds) saude.historicoMeds = {};
            
            const tomados = saude.statusHoje.tomados || {};
            const total = medsdia.length;
            const qtdTomados = medsdia.filter(m => tomados[m.id]).length;
            
            saude.historicoMeds[data] = {
                total: total,
                tomados: qtdTomados,
                detalhes: medsdia.map(m => ({
                    id: m.id,
                    nome: m.nome,
                    hora: m.hora,
                    tomado: !!tomados[m.id],
                    horaTomada: saude.statusHoje.horasTomadas?.[m.id] || null
                }))
            };
        }

        function toggleTomado(medId, tomado) {
            const dataHoje = getDataHoje();
            if (!saude.statusHoje || saude.statusHoje.data !== dataHoje) {
                saude.statusHoje = { data: dataHoje, tomados: {}, horasTomadas: {} };
            }
            if (!saude.statusHoje.tomados) saude.statusHoje.tomados = {};
            if (!saude.statusHoje.horasTomadas) saude.statusHoje.horasTomadas = {};
            
            saude.statusHoje.tomados[medId] = tomado;
            
            if (tomado) {
                // Registrar hora que tomou
                const agora = new Date();
                saude.statusHoje.horasTomadas[medId] = agora.getHours().toString().padStart(2, '0') + ':' + agora.getMinutes().toString().padStart(2, '0');
                
                // Descontar estoque de TODOS os dias (é o mesmo medicamento)
                Object.keys(saude.planoSemanal).forEach(dia => { 
                    saude.planoSemanal[dia].forEach(med => { 
                        if (med.id === medId && med.estoque > 0) med.estoque--; 
                    }); 
                });
            } else {
                // Se desmarcou, devolver ao estoque
                delete saude.statusHoje.horasTomadas[medId];
                Object.keys(saude.planoSemanal).forEach(dia => { 
                    saude.planoSemanal[dia].forEach(med => { 
                        if (med.id === medId) med.estoque++; 
                    }); 
                });
            }
            
            salvarDados();
            renderizarHoje();
        }
        
        // ==========================================
        // HISTÓRICO
        // ==========================================
        function renderizarHistorico(dias) {
            const container = document.getElementById('historicoLista');
            if (!saude.historicoMeds) {
                container.innerHTML = '<div class="empty-message">Nenhum histórico disponível ainda.</div>';
                return;
            }
            
            let html = '';
            
            for (let i = 1; i <= dias; i++) {
                const data = new Date();
                data.setDate(data.getDate() - i);
                const dataStr = data.toISOString().split('T')[0];
                const hist = saude.historicoMeds[dataStr];
                
                if (!hist) continue;
                
                const dataPtBr = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
                const aderencia = hist.total > 0 ? Math.round((hist.tomados / hist.total) * 100) : 0;
                const aderenciaClass = aderencia >= 80 ? 'bom' : (aderencia >= 50 ? 'medio' : 'ruim');
                
                html += `
                <div class="historico-dia">
                    <div class="historico-dia-header">
                        <span>${dataPtBr}</span>
                        <span class="historico-dia-aderencia ${aderenciaClass}">${aderencia}% (${hist.tomados}/${hist.total})</span>
                    </div>
                    ${(hist.detalhes || []).map(med => `
                        <div class="historico-item">
                            <div class="historico-item-status ${med.tomado ? 'tomado' : 'perdido'}">
                                ${med.tomado ? 
                                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : 
                                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}
                            </div>
                            <div class="historico-item-info">
                                <div class="historico-item-nome">${med.nome}</div>
                                <div class="historico-item-hora">${med.hora || '--:--'} ${med.horaTomada ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px;margin:0 2px"><polyline points="9 18 15 12 9 6"/></svg> tomado ${med.horaTomada}` : ''}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
            }
            
            container.innerHTML = html || '<div class="empty-message">Nenhum histórico para este período.</div>';
        }
        
        function filtrarHistorico(dias, btn) {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderizarHistorico(dias);
        }

        // ==========================================
        // RENDERIZAR SEMANA
        // ==========================================
        function renderizarSemana() {
            const container = document.getElementById('visaoSemana');
            const diasOrdem = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
            let html = '';
            
            diasOrdem.forEach(dia => {
                const meds = saude.planoSemanal[dia] || [];
                html += `<div class="dia-header"><h3>${getDiaNome(dia)}</h3></div>`;
                
                if (meds.length === 0) { 
                    html += `<div class="dia-lista"><p style="color: rgba(255,255,255,0.4); font-size: 0.9em;">Nenhum medicamento</p></div>`; 
                } else {
                    const medsOrdenados = [...meds].sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));
                    html += '<div class="dia-lista">';
                    medsOrdenados.forEach(med => { 
                        html += `<div class="dia-item">
                            <div class="dia-item-info">
                                <span class="dia-item-hora">${med.hora || '--:--'}</span>
                                <span class="dia-item-nome">${med.nome}</span>
                                <span class="dia-item-dose">${med.dose}</span>
                            </div>
                            <span class="${getEstoqueClass(med.estoque)}">${med.estoque} ${getTipoAbrev(med.tipo)}</span>
                        </div>`; 
                    });
                    html += '</div>';
                }
            });
            
            container.innerHTML = html;
        }

        // ==========================================
        // EDITAR SEMANA
        // ==========================================
        function toggleDiasSelector() { 
            document.getElementById('diasSelectorContainer').style.display = 
                document.getElementById('novoMedFrequencia').value === 'selecionar' ? 'block' : 'none'; 
        }

        function adicionarMedicamentoPlano() {
            const nome = document.getElementById('novoMedNome').value.trim();
            const dose = document.getElementById('novoMedDose').value.trim();
            const hora = document.getElementById('novoMedHora').value;
            const tolerancia = parseInt(document.getElementById('novoMedTolerancia').value) || 30;
            const estoque = parseInt(document.getElementById('novoMedEstoque').value) || 0;
            const tipo = document.getElementById('novoMedTipo').value;
            const categoria = document.getElementById('novoMedCategoria').value;
            const horasExtraStr = document.getElementById('novoMedHorasExtra')?.value || '';
            const horasExtra = horasExtraStr.split(',').map(h => h.trim()).filter(h => /^\d{2}:\d{2}$/.test(h));
            const ciclo = parseInt(document.getElementById('novoMedCiclo')?.value) || 0;
            const pausa = parseInt(document.getElementById('novoMedPausa')?.value) || 0;
            const obs = document.getElementById('novoMedObs').value.trim();
            const frequencia = document.getElementById('novoMedFrequencia').value;
            
            if (!nome || !dose) { mostrarStatus('Preencha o nome e a dose.', 'error'); return; }
            
            let dias = [];
            if (frequencia === 'todos') {
                dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
            } else {
                const diasIds = ['diaSeg', 'diaTer', 'diaQua', 'diaQui', 'diaSex', 'diaSab', 'diaDom'];
                const diasNomes = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
                diasIds.forEach((id, i) => {
                    if (document.getElementById(id).checked) dias.push(diasNomes[i]);
                });
            }
            
            if (dias.length === 0) { mostrarStatus('Selecione pelo menos um dia.', 'error'); return; }
            
            const novoMed = { 
                id: Date.now().toString(), 
                nome, 
                dose, 
                hora, 
                tolerancia,
                estoque, 
                tipo, 
                categoria,
                obs
            };
            
            // Adicionar diretamente ao plano
            dias.forEach(dia => {
                saude.planoSemanal[dia].push({...novoMed});
            });
            
            // Limpar form
            document.getElementById('novoMedNome').value = '';
            document.getElementById('novoMedDose').value = '';
            document.getElementById('novoMedHora').value = '';
            document.getElementById('novoMedTolerancia').value = '30';
            document.getElementById('novoMedEstoque').value = '';
            document.getElementById('novoMedTipo').value = 'comprimidos';
            document.getElementById('novoMedCategoria').value = 'continuo';
            document.getElementById('novoMedObs').value = '';
            document.getElementById('novoMedFrequencia').value = 'todos';
            toggleDiasSelector();
            ['diaSeg', 'diaTer', 'diaQua', 'diaQui', 'diaSex', 'diaSab', 'diaDom'].forEach(id => document.getElementById(id).checked = false);
            
            salvarDados();
            renderizarPlanoLista();
            renderizarHoje();
        }
        
        function duplicarMedicamento(medId) {
            let medOriginal = null;
            let diasMed = [];
            
            Object.keys(saude.planoSemanal).forEach(dia => {
                const med = saude.planoSemanal[dia].find(m => m.id === medId);
                if (med && !medOriginal) medOriginal = {...med};
                if (saude.planoSemanal[dia].find(m => m.id === medId)) diasMed.push(dia);
            });
            
            if (!medOriginal) return;
            
            const novaHora = prompt('Horário da nova dose:', medOriginal.hora || '08:00');
            if (!novaHora) return;
            
            const novoId = Date.now().toString();
            const novoMed = {
                ...medOriginal,
                id: novoId,
                hora: novaHora
            };
            
            // Adicionar nos mesmos dias
            diasMed.forEach(dia => {
                saude.planoSemanal[dia].push({...novoMed});
            });
            
            salvarDados();
            renderizarPlanoLista();
            renderizarHoje();
            renderizarSemana();
        }

        function removerMedicamentoTemp(idx) { 
            planoTemp.splice(idx, 1); 
            renderizarPlanoLista(); 
        }
        
        function removerMedicamentoPlano(medId) { 
            Object.keys(saude.planoSemanal).forEach(dia => { 
                saude.planoSemanal[dia] = saude.planoSemanal[dia].filter(m => m.id !== medId); 
            }); 
            salvarDados();
            renderizarPlanoLista(); 
        }

        function renderizarPlanoLista() {
            const container = document.getElementById('listaPlano');
            const medsExistentes = []; 
            const idsVistos = new Set();
            
            Object.keys(saude.planoSemanal).forEach(dia => {
                saude.planoSemanal[dia].forEach(med => {
                    if (!idsVistos.has(med.id)) {
                        idsVistos.add(med.id);
                        const diasMed = [];
                        Object.keys(saude.planoSemanal).forEach(d => { 
                            if (saude.planoSemanal[d].find(m => m.id === med.id)) diasMed.push(d); 
                        });
                        medsExistentes.push({ ...med, dias: diasMed });
                    }
                });
            });
            
            // Ordenar por horário
            medsExistentes.sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));
            
            let html = '';
            
            medsExistentes.forEach(med => {
                const diasTexto = med.dias.length === 7 ? 'Todos os dias' : med.dias.map(d => d.substring(0, 3)).join(', ');
                const notifyActive = med.notificar ? 'active' : '';
                const catNome = { 'continuo': 'Contínuo', 'temporario': 'Temporário', 'sos': 'SOS', 'antibiotico': 'Antibiótico' };
                
                // Estoque status
                let estoqueClass = 'ok';
                if (med.estoque <= 3) estoqueClass = 'critico';
                else if (med.estoque <= 7) estoqueClass = 'baixo';
                
                html += `<div class="plano-item">
                    <div class="plano-item-info">
                        <div class="plano-item-nome">
                            ${med.nome} - ${med.dose}
                            ${med.categoria ? `<span class="med-timeline-categoria">${catNome[med.categoria] || ''}</span>` : ''}
                            <span class="plano-item-estoque ${estoqueClass}">${med.estoque} ${getTipoAbrev(med.tipo)}</span>
                        </div>
                        <div class="plano-item-detalhes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${med.hora || '--:--'} | <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${diasTexto}${med.tolerancia && med.tolerancia !== 30 ? ` | ⏱️ ±${med.tolerancia}min` : ''}</div>
                        ${med.obs ? `<div class="plano-item-obs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ${med.obs}</div>` : ''}
                    </div>
                    <div class="plano-item-actions">
                        <button class="btn-notify ${notifyActive}" onclick="toggleNotificacao('${med.id}')" title="${med.notificar ? 'Desativar notificação' : 'Ativar notificação'}">
                            <svg viewBox="0 0 24 24" fill="${med.notificar ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        </button>
                        <button class="btn-duplicate" onclick="duplicarMedicamento('${med.id}')" title="Duplicar (outro horário)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                        <button class="btn-edit-small" onclick="abrirModalEdit('${med.id}')" title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn-delete-small" onclick="removerMedicamentoPlano('${med.id}')" title="Excluir">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>`;
            });
            
            container.innerHTML = html || '<p class="empty-message">Nenhum medicamento cadastrado. Adicione acima.</p>';
        }

        function salvarPlanoSemanal() {
            planoTemp.forEach(med => { 
                med.dias.forEach(dia => { 
                    saude.planoSemanal[dia].push({ 
                        id: med.id, 
                        nome: med.nome, 
                        dose: med.dose, 
                        hora: med.hora, 
                        estoque: med.estoque, 
                        tipo: med.tipo 
                    }); 
                }); 
            });
            planoTemp = [];
            salvarDados();
            renderizarPlanoLista();
        }

        // ==========================================
        // MODAL EDIÇÃO
        // ==========================================
        function abrirModalEdit(medId) {
            let medEncontrado = null;
            let diasMed = [];
            
            Object.keys(saude.planoSemanal).forEach(dia => {
                const med = saude.planoSemanal[dia].find(m => m.id === medId);
                if (med && !medEncontrado) medEncontrado = med;
                if (saude.planoSemanal[dia].find(m => m.id === medId)) diasMed.push(dia);
            });
            
            if (!medEncontrado) return;
            
            document.getElementById('editMedId').value = medId;
            document.getElementById('editMedNome').value = medEncontrado.nome;
            document.getElementById('editMedDose').value = medEncontrado.dose;
            document.getElementById('editMedHora').value = medEncontrado.hora || '';
            document.getElementById('editMedEstoque').value = medEncontrado.estoque || 0;
            document.getElementById('editMedTipo').value = medEncontrado.tipo || 'comprimidos';
            
            const todosDias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
            if (diasMed.length === 7) {
                document.getElementById('editMedFrequencia').value = 'todos';
                document.getElementById('editDiasSelectorContainer').style.display = 'none';
            } else {
                document.getElementById('editMedFrequencia').value = 'selecionar';
                document.getElementById('editDiasSelectorContainer').style.display = 'block';
            }
            
            ['editDiaSeg', 'editDiaTer', 'editDiaQua', 'editDiaQui', 'editDiaSex', 'editDiaSab', 'editDiaDom'].forEach((id, i) => {
                document.getElementById(id).checked = diasMed.includes(todosDias[i]);
            });
            
            document.getElementById('modalEditMed').classList.add('active');
        }

        function fecharModalEdit() { 
            document.getElementById('modalEditMed').classList.remove('active'); 
        }
        
        function toggleEditDiasSelector() {
            document.getElementById('editDiasSelectorContainer').style.display = 
                document.getElementById('editMedFrequencia').value === 'selecionar' ? 'block' : 'none';
        }
        
        function toggleNotificar(medId) {
            Object.keys(saude.planoSemanal).forEach(dia => {
                saude.planoSemanal[dia].forEach(med => {
                    if (med.id === medId) {
                        med.notificar = !med.notificar;
                    }
                });
            });
            salvarDados();
            renderizarHoje();
        }

        function salvarEdicaoMed() {
            const medId = document.getElementById('editMedId').value;
            const nome = document.getElementById('editMedNome').value.trim();
            const dose = document.getElementById('editMedDose').value.trim();
            const hora = document.getElementById('editMedHora').value;
            const estoque = parseInt(document.getElementById('editMedEstoque').value) || 0;
            const tipo = document.getElementById('editMedTipo').value;
            const frequencia = document.getElementById('editMedFrequencia').value;
            
            if (!nome || !dose) { mostrarStatus('Preencha o nome e a dose.', 'error'); return; }
            
            let novosDias = [];
            if (frequencia === 'todos') {
                novosDias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
            } else {
                const diasIds = ['editDiaSeg', 'editDiaTer', 'editDiaQua', 'editDiaQui', 'editDiaSex', 'editDiaSab', 'editDiaDom'];
                const diasNomes = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
                diasIds.forEach((id, i) => {
                    if (document.getElementById(id).checked) novosDias.push(diasNomes[i]);
                });
            }
            
            if (novosDias.length === 0) { mostrarStatus('Selecione pelo menos um dia.', 'error'); return; }
            
            // Remover de todos os dias
            Object.keys(saude.planoSemanal).forEach(dia => {
                saude.planoSemanal[dia] = saude.planoSemanal[dia].filter(m => m.id !== medId);
            });
            
            // Adicionar nos novos dias
            novosDias.forEach(dia => {
                saude.planoSemanal[dia].push({ id: medId, nome, dose, hora, estoque, tipo });
            });
            
            salvarDados();
            fecharModalEdit();
            renderizarPlanoLista();
            renderizarSemana();
            renderizarHoje();
        }


        // ==========================================
        // 1. CALENDÁRIO DE ADERÊNCIA
        // ==========================================
        let calMedAno = new Date().getFullYear();
        let calMedMes = new Date().getMonth();

        function calMedNav(dir) {
            calMedMes += dir;
            if (calMedMes > 11) { calMedMes = 0; calMedAno++; }
            if (calMedMes < 0)  { calMedMes = 11; calMedAno--; }
            renderCalMed();
        }

        function renderCalMed() {
            const hoje = new Date().toISOString().split('T')[0];
            const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                           'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
            document.getElementById('calMedTitulo').textContent = meses[calMedMes] + ' ' + calMedAno;

            const grid = document.getElementById('medCalGrid');
            if (!grid) return;

            const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
            let html = dias.map(d => `<div class="med-cal-dia-label">${d}</div>`).join('');

            const primeiro = new Date(calMedAno, calMedMes, 1);
            const ultimo   = new Date(calMedAno, calMedMes + 1, 0);
            const offset   = primeiro.getDay();

            // Dias do mês anterior
            for (let i = 0; i < offset; i++) {
                const d = new Date(calMedAno, calMedMes, -(offset - i - 1));
                html += `<div class="med-cal-dia outro-mes">${d.getDate()}</div>`;
            }

            // Dias do mês atual
            for (let d = 1; d <= ultimo.getDate(); d++) {
                const iso = calMedAno + '-' + String(calMedMes+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
                const hist = saude.historicoMeds && saude.historicoMeds[iso];
                let cls = 'sem-dados';
                let pct = 0;
                if (hist && hist.total > 0) {
                    pct = Math.round((hist.tomados / hist.total) * 100);
                    cls = pct >= 80 ? 'tomado' : pct >= 40 ? 'parcial' : 'perdido';
                }
                const isHoje = iso === hoje ? ' hoje' : '';
                const title = hist ? `${hist.tomados}/${hist.total} (${pct}%)` : 'Sem dados';
                html += `<div class="med-cal-dia ${cls}${isHoje}" title="${title}">${d}</div>`;
            }

            // Completar última semana
            const rem = (offset + ultimo.getDate()) % 7;
            if (rem > 0) {
                for (let i = 1; i <= 7 - rem; i++) {
                    html += `<div class="med-cal-dia outro-mes">${i}</div>`;
                }
            }
            grid.innerHTML = html;
        }

        // ==========================================
        // 2. DIAS RESTANTES DE ESTOQUE
        // ==========================================
        function calcularDiasRestantes(med) {
            if (!med.estoque || med.estoque <= 0) return 0;
            // Contar quantas vezes por semana toma
            let vezesSemanais = 0;
            Object.keys(saude.planoSemanal).forEach(dia => {
                saude.planoSemanal[dia].forEach(m => {
                    if (m.id === med.id) {
                        const extras = (m.horasExtra || []).length;
                        vezesSemanais += 1 + extras;
                    }
                });
            });
            if (vezesSemanais === 0) return 999;
            const tomasPorDia = vezesSemanais / 7;
            return Math.floor(med.estoque / tomasPorDia);
        }

        function textoDiasRestantes(dias) {
            if (dias === 0) return { txt: 'Acabou!', cls: 'critico' };
            if (dias <= 7)  return { txt: `Acaba em ${dias} dias`, cls: 'critico' };
            if (dias <= 15) return { txt: `Acaba em ${dias} dias`, cls: 'atencao' };
            return { txt: `${dias} dias restantes`, cls: 'ok' };
        }

        // ==========================================
        // 3. NOTA POR TOMADA
        // ==========================================
        let _notaMedId = null;
        let _notaMedTomado = null;

        function abrirModalNota(medId, tomado) {
            _notaMedId = medId;
            _notaMedTomado = tomado;
            const med = Object.values(saude.planoSemanal).flat().find(m => m.id === medId);
            const modal = document.getElementById('modalNota');
            if (modal) {
                document.getElementById('modalNotaNome').textContent = (med ? med.nome : 'Medicamento') + ' — registrar tomada';
                document.getElementById('modalNotaTexto').value = '';
                modal.style.display = 'flex';
                setTimeout(() => document.getElementById('modalNotaTexto').focus(), 100);
            } else {
                // Fallback: sem modal, executa direto
                toggleTomadoComNota(medId, tomado, '');
            }
        }

        function cancelarNota() {
            document.getElementById('modalNota').style.display = 'none';
            _notaMedId = null;
        }

        function confirmarNota() {
            const nota = document.getElementById('modalNotaTexto').value.trim();
            toggleTomadoComNota(_notaMedId, _notaMedTomado, nota);
            document.getElementById('modalNota').style.display = 'none';
        }

        function toggleTomadoComNota(medId, tomado, nota) {
            const dataHoje = getDataHoje();
            if (!saude.statusHoje || saude.statusHoje.data !== dataHoje) {
                saude.statusHoje = { data: dataHoje, tomados: {}, horasTomadas: {}, notas: {} };
            }
            if (!saude.statusHoje.notas) saude.statusHoje.notas = {};
            saude.statusHoje.tomados[medId] = tomado;

            if (tomado) {
                const agora = new Date();
                saude.statusHoje.horasTomadas[medId] = agora.getHours().toString().padStart(2,'0') + ':' + agora.getMinutes().toString().padStart(2,'0');
                if (nota) saude.statusHoje.notas[medId] = nota;
                Object.keys(saude.planoSemanal).forEach(dia => {
                    saude.planoSemanal[dia].forEach(med => {
                        if (med.id === medId && med.estoque > 0) med.estoque--;
                    });
                });
            } else {
                delete saude.statusHoje.horasTomadas[medId];
                delete saude.statusHoje.notas[medId];
                Object.keys(saude.planoSemanal).forEach(dia => {
                    saude.planoSemanal[dia].forEach(med => {
                        if (med.id === medId) med.estoque++;
                    });
                });
            }

            salvarDados();
            renderizarHoje();
            atualizarDashboard();
        }

        // ==========================================
        // 4. MÚLTIPLOS HORÁRIOS — expandir plano
        // ==========================================
        function expandirHorariosExtras(med, diasAlvo) {
            // Para cada horário extra, criar uma entrada virtual com id composto
            const extras = med.horasExtra || [];
            const resultado = [med];
            extras.forEach((hora, i) => {
                resultado.push({ ...med, hora, id: med.id + '_extra_' + i });
            });
            return resultado;
        }

        // ==========================================
        // 5. CICLO/PAUSA — verificar se hoje é dia de tomar
        // ==========================================
        function isMedAtivoCiclo(med) {
            if (!med.ciclo || med.ciclo <= 0) return true; // sem ciclo
            if (!med.inicioCiclo) return true;
            const inicio = new Date(med.inicioCiclo);
            const hoje = new Date();
            const diasPassados = Math.floor((hoje - inicio) / 86400000);
            const cicloPausa = med.ciclo + (med.pausa || 0);
            const posNoCiclo = diasPassados % cicloPausa;
            return posNoCiclo < med.ciclo;
        }

        // ==========================================
        // FUNÇÕES DE TREINO
        // ==========================================
        let gruposSelecionados = [];
        let ultimoExercicio = null;


        // ==========================================
        // TIMER DE DESCANSO
        // ==========================================
        let timerInterval = null;
        let timerSegundos = 0;

        function iniciarTimer(segundos, nomeExercicio) {
            pularTimer();
            timerSegundos = segundos;
            document.getElementById('timerExNome').textContent = nomeExercicio || '';
            document.getElementById('timerDescanso').classList.add('ativo');
            atualizarTimerDisplay();
            timerInterval = setInterval(() => {
                timerSegundos--;
                atualizarTimerDisplay();
                if (timerSegundos <= 0) pularTimer();
            }, 1000);
        }

        function atualizarTimerDisplay() {
            const min = Math.floor(Math.abs(timerSegundos) / 60);
            const seg = Math.abs(timerSegundos) % 60;
            const txt = String(min).padStart(2,'0') + ':' + String(seg).padStart(2,'0');
            const el = document.getElementById('timerNumero');
            el.textContent = txt;
            el.classList.toggle('urgente', timerSegundos <= 10 && timerSegundos > 0);
        }

        function pularTimer() {
            clearInterval(timerInterval);
            timerInterval = null;
            document.getElementById('timerDescanso').classList.remove('ativo');
        }

        // ==========================================
        // HISTÓRICO DE TREINOS
        // ==========================================
        function registrarConclusaoTreino(treinoId) {
            const treino = saude.treinos.find(t => t.id === treinoId);
            if (!treino) return;
            if (!treino.historico) treino.historico = [];
            treino.historico.push({ data: new Date().toISOString(), exercicios: (treino.exercicios||[]).length });
            if (treino.historico.length > 30) treino.historico = treino.historico.slice(-30);
            salvarDados();
        }

        function getUltimoTreino(treino) {
            if (!treino.historico || !treino.historico.length) return null;
            const ult = treino.historico[treino.historico.length - 1];
            return Math.floor((Date.now() - new Date(ult.data)) / 86400000);
        }

        function textoUltimoTreino(dias) {
            if (dias === null) return 'Nunca realizado';
            if (dias === 0) return 'Realizado hoje';
            if (dias === 1) return 'Ontem';
            return `Há ${dias} dias`;
        }

        // ==========================================
        // MODO FOCO
        // ==========================================
        let focoTreino = null;
        let focoIdx = 0;
        let focoExercicios = [];

        function iniciarModoFoco(treinoId) {
            focoTreino = saude.treinos.find(t => t.id === treinoId);
            if (!focoTreino) return;
            focoExercicios = (focoTreino.exercicios || []).filter(e => !e.conjugado);
            focoIdx = 0;
            const primNaoFeito = focoExercicios.findIndex(e => !e.feito);
            if (primNaoFeito >= 0) focoIdx = primNaoFeito;
            document.getElementById('focoNomeTreino').textContent = focoTreino.nome.toUpperCase();
            document.getElementById('modoFocoOverlay').classList.add('ativo');
            renderFoco();
        }

        function fecharModoFoco() {
            document.getElementById('modoFocoOverlay').classList.remove('ativo');
            focoTreino = null;
        }

        function renderFoco() {
            if (!focoExercicios.length) {
                fecharModoFoco();
                return;
            }
            const ex = focoExercicios[focoIdx];
            document.getElementById('focoProg').textContent = `Exercício ${focoIdx+1} de ${focoExercicios.length}`;
            document.getElementById('focoExNome').textContent = ex.nome;
            document.getElementById('focoExObs').textContent = ex.obs || '';
            document.getElementById('focoExDetalhes').innerHTML = `
                <div class="foco-ex-det-item"><span class="foco-ex-det-label">Séries</span><span class="foco-ex-det-val">${ex.series}</span></div>
                <div class="foco-ex-det-item"><span class="foco-ex-det-label">Reps</span><span class="foco-ex-det-val">${ex.reps}</span></div>
                ${ex.metodo ? `<div class="foco-ex-det-item"><span class="foco-ex-det-label">Método</span><span class="foco-ex-det-val">${ex.metodo}</span></div>` : ''}
                <div class="foco-ex-det-item"><span class="foco-ex-det-label">Descanso</span><span class="foco-ex-det-val">${ex.descanso}</span></div>
            `;
            const checkBtn = document.getElementById('focoCheckBtn');
            checkBtn.classList.toggle('feito', !!ex.feito);
            const nav = document.getElementById('focoNav');
            const isUltimo = focoIdx >= focoExercicios.length - 1;
            nav.innerHTML =
                (focoIdx > 0 ? `<button class="foco-nav-btn" onclick="focoNavegar(-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px;margin:0 2px"><polyline points="15 18 9 12 15 6"/></svg> Anterior</button>` : '') +
                (!isUltimo ? `<button class="foco-nav-btn proximo" onclick="focoNavegar(1)">Próximo <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px;margin:0 2px"><polyline points="9 18 15 12 9 6"/></svg></button>`
                           : `<button class="foco-concluir-btn" onclick="focoConcluir()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px;margin-right:2px"><polyline points="20 6 9 17 4 12"/></svg> Concluir Treino</button>`);
        }

        function focoMarcarFeito() {
            if (!focoExercicios.length) return;
            const ex = focoExercicios[focoIdx];
            ex.feito = !ex.feito;
            const exReal = focoTreino.exercicios.find(e => e.id === ex.id);
            if (exReal) exReal.feito = ex.feito;
            salvarDados();
            renderFoco();
            renderTreinos();
            if (ex.feito && ex.descanso) {
                const match = ex.descanso.match(/(\d+)/);
                if (match) {
                    const seg = parseInt(match[1]) * (ex.descanso.toLowerCase().includes('min') ? 60 : 1);
                    if (seg > 0) iniciarTimer(seg, ex.nome);
                }
            }
        }

        function focoNavegar(dir) {
            focoIdx = Math.max(0, Math.min(focoExercicios.length-1, focoIdx+dir));
            renderFoco();
        }

        function focoConcluir() {
            registrarConclusaoTreino(focoTreino.id);
            fecharModoFoco();
            renderTreinos();
            const t = document.createElement('div');
            t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px;margin-right:2px"><polyline points="20 6 9 17 4 12"/></svg> Treino concluído e registrado!';
            t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#2ecc71;color:#fff;padding:12px 24px;border-radius:8px;font-weight:700;z-index:9999;font-size:.85em';
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 3000);
        }

        // ==========================================
        // DRAG AND DROP
        // ==========================================
        let dragSrcEl = null;

        function initDragDrop(treinoId) {
            const tbody = document.querySelector(`#treino-${treinoId} .exercicio-table tbody`);
            if (!tbody) return;
            tbody.querySelectorAll('tr[draggable]').forEach(row => {
                row.addEventListener('dragstart', e => {
                    dragSrcEl = row;
                    e.dataTransfer.effectAllowed = 'move';
                    setTimeout(() => { row.style.opacity = '.4'; }, 0);
                });
                row.addEventListener('dragend', () => { row.style.opacity = '1'; });
                row.addEventListener('dragover', e => {
                    e.preventDefault();
                    tbody.querySelectorAll('tr').forEach(r => r.classList.remove('drag-over'));
                    row.classList.add('drag-over');
                });
                row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
                row.addEventListener('drop', e => {
                    e.preventDefault();
                    row.classList.remove('drag-over');
                    if (dragSrcEl === row) return;
                    const treino = saude.treinos.find(t => t.id === treinoId);
                    if (!treino) return;
                    const srcId = dragSrcEl.dataset.exId;
                    const dstId = row.dataset.exId;
                    const arr = treino.exercicios;
                    const si = arr.findIndex(e => e.id === srcId);
                    const di = arr.findIndex(e => e.id === dstId);
                    if (si < 0 || di < 0) return;
                    const [item] = arr.splice(si, 1);
                    arr.splice(di, 0, item);
                    salvarDados();
                    renderTreinos();
                });
            });
        }

        function renderTreinos() {
            const container = document.getElementById('listaTreinos');
            if (!saude.treinos || !saude.treinos.length) {
                container.innerHTML = '<div class="treino-empty"><div class="treino-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:32px;height:32px;opacity:0.3"><line x1="3" y1="12" x2="21" y2="12"/><rect x="1" y="8" width="4" height="8" rx="1"/><rect x="19" y="8" width="4" height="8" rx="1"/><rect x="7" y="5" width="4" height="14" rx="1"/><rect x="13" y="5" width="4" height="14" rx="1"/></svg></div><p>Nenhum treino cadastrado</p><button class="btn-primary" onclick="abrirModalTreino()">Criar Primeiro Treino</button></div>';
                return;
            }

            container.innerHTML = saude.treinos.map((treino, idx) => {
                const exercicios = treino.exercicios || [];
                const grupos = Array.isArray(treino.grupo) ? treino.grupo : [treino.grupo];
                const primeiroGrupo = grupos[0] || '';
                const gruposTexto = grupos.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(' + ');
                
                // Agrupar exercícios conjugados
                const exerciciosProcessados = [];
                const conjugadosUsados = new Set();
                
                exercicios.forEach(ex => {
                    if (conjugadosUsados.has(ex.id)) return;
                    
                    // Encontrar todos os exercícios conjugados a este
                    const conjugados = exercicios.filter(e => e.conjugado === ex.id);
                    
                    if (conjugados.length > 0) {
                        // Este exercício tem conjugados
                        exerciciosProcessados.push({
                            ...ex,
                            conjugadosCom: conjugados
                        });
                        conjugados.forEach(c => conjugadosUsados.add(c.id));
                    } else if (!ex.conjugado) {
                        // Exercício isolado
                        exerciciosProcessados.push(ex);
                    }
                    // Se ex.conjugado existe, ele será processado junto com seu "pai"
                });
                
                return `
                <div class="treino-card" id="treino-${treino.id}">
                    <div class="treino-card-header ${primeiroGrupo}" onclick="toggleTreino('${treino.id}')">
                        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
                            <svg class="treino-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                            <div>
                                <div class="treino-card-titulo">TREINO ${idx + 1} | ${treino.nome.toUpperCase()}</div>
                                <div class="treino-card-subtitulo">${gruposTexto} • ${exercicios.length} exercício${exercicios.length !== 1 ? 's' : ''}</div>
                                ${(() => { const dias = getUltimoTreino(treino); const cls = dias === null ? '' : dias <= 2 ? 'recente' : dias > 7 ? 'antigo' : ''; return `<div class="treino-ultimo ${cls}">${textoUltimoTreino(dias)}</div>`; })()}
                            </div>
                        </div>
                        <div class="treino-card-actions" onclick="event.stopPropagation()">
                            <button class="btn-iniciar-treino" onclick="iniciarModoFoco('${treino.id}')" title="Iniciar treino em modo foco">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>Iniciar
                            </button>
                            <button class="treino-card-btn" onclick="editarTreino('${treino.id}')" title="Editar">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="treino-card-btn delete" onclick="excluirTreino('${treino.id}')" title="Excluir">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                    ${(() => {
                        const total = exercicios.length;
                        const feitos = exercicios.filter(e => e.feito).length;
                        const pct = total > 0 ? Math.round(feitos/total*100) : 0;
                        const volTotal = exercicios.reduce((s,e) => s + (parseInt(e.series)||0)*(parseInt(e.reps)||0), 0);
                        const serTotal = exercicios.reduce((s,e) => s + (parseInt(e.series)||0), 0);
                        return `
                        <div class="treino-prog-wrap">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                                <span class="treino-prog-txt">${feitos}/${total} exercícios</span>
                                <span class="treino-prog-txt">${pct}%</span>
                            </div>
                            <div class="treino-prog-bar-wrap"><div class="treino-prog-bar" style="width:${pct}%"></div></div>
                        </div>
                        `;
                    })()}
                    <div class="treino-card-body">
                        ${exercicios.length ? `
                        <table class="exercicio-table">
                            <thead>
                                <tr>
                                    <th style="width:40px"></th>
                                    <th>Exercício</th>
                                    <th>Séries</th>
                                    <th>Repetições</th>
                                    <th>Método</th>
                                    <th>Descanso</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${exerciciosProcessados.map(ex => {
                                    const temConjugados = ex.conjugadosCom && ex.conjugadosCom.length > 0;
                                    const todosExercicios = temConjugados ? [ex, ...ex.conjugadosCom] : [ex];
                                    const todosFeitos = todosExercicios.every(e => e.feito);
                                    // Nome como texto único: "Supino + Remada"
                                    const nomeCompleto = temConjugados 
                                        ? `${ex.nome}<span class="conjugado-plus">+</span>${ex.conjugadosCom.map(c => c.nome).join('<span class="conjugado-plus">+</span>')}`
                                        : ex.nome;
                                    // Observação única para o conjunto
                                    const obsConjunto = ex.obs || '';
                                    
                                    return `
                                <tr class="${todosFeitos ? 'exercicio-feito' : ''}">
                                    <td class="ex-check-td">
                                        <input type="checkbox" class="exercicio-check" ${todosFeitos ? 'checked' : ''} onchange="marcarExercicio('${treino.id}','${ex.id}',this.checked,${temConjugados ? `'${ex.conjugadosCom.map(c=>c.id).join(',')}'` : 'null'})">
                                    </td>
                                    <td>
                                        <div class="exercicio-nome">
                                            <span class="exercicio-drag-handle" title="Arrastar para reordenar"><svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="7" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="17" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="1.5" fill="currentColor" stroke="none"/></svg></span>
                                            <div style="flex:1">
                                                <span class="exercicio-nome-texto">${nomeCompleto}</span>
                                                ${obsConjunto ? `<div class="exercicio-obs">${obsConjunto}</div>` : ''}
                                            </div>
                                            <div class="exercicio-acoes">
                                                <button class="exercicio-btn duplicate" onclick="duplicarExercicio('${treino.id}','${ex.id}')" title="Duplicar">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                                </button>
                                                <button class="exercicio-btn" onclick="editarExercicio('${treino.id}','${ex.id}')" title="Editar">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button class="exercicio-btn delete" onclick="excluirExercicio('${treino.id}','${ex.id}')" title="Excluir">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    <td>${ex.series}</td>
                                    <td>${ex.reps}</td>
                                    <td>${ex.metodo || '-'}</td>
                                    <td>${ex.descanso}</td>
                                </tr>
                                `}).join('')}
                            </tbody>
                        </table>
                        ` : '<div style="padding:30px;text-align:center;color:rgba(255,255,255,0.3)">Nenhum exercício adicionado</div>'}
                    </div>
                    ${(() => {
                        const volTotal = exercicios.reduce((s,e) => s + (parseInt(e.series)||0)*(parseInt(e.reps)||0), 0);
                        const serTotal = exercicios.reduce((s,e) => s + (parseInt(e.series)||0), 0);
                        return exercicios.length ? `<div class="treino-volume">
                            <span class="treino-vol-item">Séries totais:<strong>${serTotal}</strong></span>
                            <span class="treino-vol-item">Volume total:<strong>${volTotal} reps</strong></span>
                        </div>` : '';
                    })()}
                    <div class="treino-card-footer">
                        <button class="add-exercicio-btn" onclick="abrirModalExercicio('${treino.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Adicionar Exercício
                        </button>
                    </div>
                </div>
                `;
            }).join('');
            
            // Restaurar estados colapsados
            restaurarEstadoColapsado();
            // Inicializar drag and drop em cada treino
            (saude.treinos || []).forEach(t => { try { initDragDrop(t.id); } catch(e) {} });
        }
        
        function marcarExercicio(treinoId, exId, feito, conjugadosIds) {
            const treino = saude.treinos.find(t => t.id === treinoId);
            if (!treino) return;
            
            const ex = treino.exercicios.find(e => e.id === exId);
            if (ex) ex.feito = feito;
            
            // Marcar conjugados também
            if (conjugadosIds) {
                conjugadosIds.split(',').forEach(id => {
                    const conj = treino.exercicios.find(e => e.id === id);
                    if (conj) conj.feito = feito;
                });
            }
            
            salvarDados();
            renderTreinos();
            // Timer de descanso automático ao marcar como feito
            if (feito) {
                const treino = saude.treinos.find(t => t.id === treinoId);
                const ex = treino && treino.exercicios.find(e => e.id === exId);
                if (ex && ex.descanso) {
                    const match = ex.descanso.match(/(\d+)/);
                    if (match) {
                        const seg = parseInt(match[1]) * (ex.descanso.toLowerCase().includes('min') ? 60 : 1);
                        if (seg > 0) iniciarTimer(seg, ex.nome);
                    }
                }
            }
        }

        // ==========================================
        // FUNÇÕES DE ALERTAS
        // ==========================================
        let alertaTipoSelecionado = '';
        const alertaSvgs = {
            alerta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            meta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
            lembrete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
            sucesso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        };

        function renderAlertas() {
            const container = document.getElementById('listaAlertas');
            if (!saude.alertasTreino || !saude.alertasTreino.length) {
                container.innerHTML = '<div class="treino-alertas-empty">Nenhum alerta ou meta cadastrado</div>';
                return;
            }

            container.innerHTML = saude.alertasTreino.map(alerta => `
                <div class="treino-alerta-item ${alerta.tipo}">
                    <div class="treino-alerta-icon">${alertaSvgs[alerta.tipo] || alertaSvgs.lembrete}</div>
                    <div class="treino-alerta-content">
                        <div class="treino-alerta-texto">${alerta.texto}</div>
                    </div>
                    <div class="treino-alerta-acoes">
                        <button class="treino-alerta-btn-sm" onclick="excluirAlerta('${alerta.id}')" title="Excluir">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function selectAlertaTipo(el) {
            document.querySelectorAll('.alerta-tipo-opt').forEach(opt => opt.classList.remove('selected'));
            el.classList.add('selected');
            alertaTipoSelecionado = el.dataset.tipo;
        }

        function abrirModalAlerta() {
            document.getElementById('alertaId').value = '';
            document.getElementById('alertaTexto').value = '';
            document.querySelectorAll('.alerta-tipo-opt').forEach(opt => opt.classList.remove('selected'));
            alertaTipoSelecionado = '';
            document.getElementById('modalAlerta').classList.add('active');
        }

        function fecharModalAlerta() {
            document.getElementById('modalAlerta').classList.remove('active');
        }

        function salvarAlerta() {
            const texto = document.getElementById('alertaTexto').value.trim();
            if (!texto) { mostrarStatus('Informe o texto do alerta', 'error'); return; };
            if (!alertaTipoSelecionado) { mostrarStatus('Selecione um tipo', 'error'); return; };

            saude.alertasTreino.push({
                id: Date.now().toString(),
                tipo: alertaTipoSelecionado,
                texto
            });
            salvarDados();
            renderAlertas();
            fecharModalAlerta();
        }

        function excluirAlerta(id) {
            if (!confirm('Excluir este alerta?')) return;
            saude.alertasTreino = saude.alertasTreino.filter(a => a.id !== id);
            salvarDados();
            renderAlertas();
        }

        function selectGrupo(el) {
            const grupo = el.dataset.grupo;
            if (el.classList.contains('selected')) {
                el.classList.remove('selected');
                gruposSelecionados = gruposSelecionados.filter(g => g !== grupo);
            } else {
                el.classList.add('selected');
                gruposSelecionados.push(grupo);
            }
        }

        function abrirModalTreino() {
            document.getElementById('treinoId').value = '';
            document.getElementById('treinoNome').value = '';
            document.querySelectorAll('.grupo-muscular-opt').forEach(opt => opt.classList.remove('selected'));
            gruposSelecionados = [];
            document.getElementById('modalTreino').classList.add('active');
        }

        function fecharModalTreino() {
            document.getElementById('modalTreino').classList.remove('active');
        }

        function salvarTreino() {
            const id = document.getElementById('treinoId').value;
            const nome = document.getElementById('treinoNome').value.trim();
            if (!nome) { mostrarStatus('Informe o nome do treino', 'error'); return; };
            if (!gruposSelecionados.length) { mostrarStatus('Selecione pelo menos um grupo muscular', 'error'); return; };

            if (id) {
                const treino = saude.treinos.find(t => t.id === id);
                if (treino) {
                    treino.nome = nome;
                    treino.grupo = [...gruposSelecionados];
                }
            } else {
                saude.treinos.push({
                    id: Date.now().toString(),
                    nome,
                    grupo: [...gruposSelecionados],
                    exercicios: []
                });
            }
            salvarDados();
            renderTreinos();
            fecharModalTreino();
        }

        function editarTreino(id) {
            const treino = saude.treinos.find(t => t.id === id);
            if (!treino) return;
            document.getElementById('treinoId').value = id;
            document.getElementById('treinoNome').value = treino.nome;
            
            const grupos = Array.isArray(treino.grupo) ? treino.grupo : [treino.grupo];
            gruposSelecionados = [...grupos];
            
            document.querySelectorAll('.grupo-muscular-opt').forEach(opt => {
                opt.classList.toggle('selected', grupos.includes(opt.dataset.grupo));
            });
            document.getElementById('modalTreino').classList.add('active');
        }

        function excluirTreino(id) {
            if (!confirm('Excluir este treino e todos os exercícios?')) return;
            saude.treinos = saude.treinos.filter(t => t.id !== id);
            salvarDados();
            renderTreinos();
        }

        function abrirModalExercicio(treinoId) {
            document.getElementById('exercicioId').value = '';
            document.getElementById('exercicioTreinoId').value = treinoId;
            document.getElementById('exercicioNome').value = '';
            document.getElementById('exercicioSeries').value = '';
            document.getElementById('exercicioReps').value = '';
            document.getElementById('exercicioMetodo').value = '-';
            document.getElementById('exercicioDescanso').value = '';
            document.getElementById('exercicioObs').value = '';
            document.getElementById('duplicarConfig').checked = false;

            // Preencher select de exercícios para conjugar
            const treino = saude.treinos.find(t => t.id === treinoId);
            const selectConjugado = document.getElementById('exercicioConjugado');
            selectConjugado.innerHTML = '<option value="">Nenhum (exercício isolado)</option>';
            
            if (treino && treino.exercicios && treino.exercicios.length > 0) {
                treino.exercicios.forEach(ex => {
                    selectConjugado.innerHTML += `<option value="${ex.id}">${ex.nome}</option>`;
                });
                
                ultimoExercicio = treino.exercicios[treino.exercicios.length - 1];
                document.getElementById('duplicarInfo').textContent = 
                    `Será copiado: ${ultimoExercicio.series} séries, ${ultimoExercicio.reps} reps, ${ultimoExercicio.descanso}`;
            } else {
                ultimoExercicio = null;
                document.getElementById('duplicarInfo').textContent = 'Nenhum exercício anterior para copiar';
            }

            document.getElementById('modalExercicio').classList.add('active');
        }

        function fecharModalExercicio() {
            document.getElementById('modalExercicio').classList.remove('active');
        }

        function toggleDuplicar() {
            const checked = document.getElementById('duplicarConfig').checked;
            if (checked && ultimoExercicio) {
                document.getElementById('exercicioSeries').value = ultimoExercicio.series;
                document.getElementById('exercicioReps').value = ultimoExercicio.reps;
                document.getElementById('exercicioMetodo').value = ultimoExercicio.metodo || '-';
                document.getElementById('exercicioDescanso').value = ultimoExercicio.descanso;
            }
        }

        function salvarExercicio() {
            const id = document.getElementById('exercicioId').value;
            const treinoId = document.getElementById('exercicioTreinoId').value;
            const nome = document.getElementById('exercicioNome').value.trim();
            const series = document.getElementById('exercicioSeries').value.trim();
            const reps = document.getElementById('exercicioReps').value.trim();
            const metodo = document.getElementById('exercicioMetodo').value;
            const descanso = document.getElementById('exercicioDescanso').value.trim();
            const obs = document.getElementById('exercicioObs').value.trim();
            const conjugado = document.getElementById('exercicioConjugado').value;

            if (!nome) { mostrarStatus('Informe o nome do exercício', 'error'); return; };
            if (!series) { mostrarStatus('Informe as séries', 'error'); return; };
            if (!reps) { mostrarStatus('Informe as repetições', 'error'); return; };
            if (!descanso) { mostrarStatus('Informe o descanso', 'error'); return; };

            const treino = saude.treinos.find(t => t.id === treinoId);
            if (!treino) return;
            if (!treino.exercicios) treino.exercicios = [];

            if (id) {
                const ex = treino.exercicios.find(e => e.id === id);
                if (ex) {
                    ex.nome = nome;
                    ex.series = series;
                    ex.reps = reps;
                    ex.metodo = metodo;
                    ex.descanso = descanso;
                    ex.obs = obs;
                    ex.conjugado = conjugado || null;
                }
            } else {
                treino.exercicios.push({
                    id: Date.now().toString(),
                    nome,
                    series,
                    reps,
                    metodo,
                    descanso,
                    obs,
                    conjugado: conjugado || null
                });
            }
            salvarDados();
            renderTreinos();
            fecharModalExercicio();
        }

        function editarExercicio(treinoId, exId) {
            const treino = saude.treinos.find(t => t.id === treinoId);
            if (!treino) return;
            const ex = treino.exercicios.find(e => e.id === exId);
            if (!ex) return;

            document.getElementById('exercicioId').value = exId;
            document.getElementById('exercicioTreinoId').value = treinoId;
            document.getElementById('exercicioNome').value = ex.nome;
            document.getElementById('exercicioSeries').value = ex.series;
            document.getElementById('exercicioReps').value = ex.reps;
            document.getElementById('exercicioMetodo').value = ex.metodo || '-';
            document.getElementById('exercicioDescanso').value = ex.descanso;
            document.getElementById('exercicioObs').value = ex.obs || '';
            document.getElementById('duplicarConfig').checked = false;
            
            // Preencher select de exercícios para conjugar (exceto o próprio)
            const selectConjugado = document.getElementById('exercicioConjugado');
            selectConjugado.innerHTML = '<option value="">Nenhum (exercício isolado)</option>';
            treino.exercicios.forEach(e => {
                if (e.id !== exId) {
                    selectConjugado.innerHTML += `<option value="${e.id}" ${ex.conjugado === e.id ? 'selected' : ''}>${e.nome}</option>`;
                }
            });

            document.getElementById('modalExercicio').classList.add('active');
        }

        function excluirExercicio(treinoId, exId) {
            if (!confirm('Excluir este exercício?')) return;
            const treino = saude.treinos.find(t => t.id === treinoId);
            if (treino) {
                // Remover referências de conjugado
                treino.exercicios.forEach(e => {
                    if (e.conjugado === exId) e.conjugado = null;
                });
                treino.exercicios = treino.exercicios.filter(e => e.id !== exId);
                salvarDados();
                renderTreinos();
            }
        }

        function duplicarExercicio(treinoId, exId) {
            const treino = saude.treinos.find(t => t.id === treinoId);
            if (!treino) return;
            const ex = treino.exercicios.find(e => e.id === exId);
            if (!ex) return;

            treino.exercicios.push({
                id: Date.now().toString(),
                nome: ex.nome + ' (cópia)',
                series: ex.series,
                reps: ex.reps,
                metodo: ex.metodo,
                descanso: ex.descanso,
                obs: ex.obs || '',
                conjugado: null
            });
            salvarDados();
            renderTreinos();
        }

        // ==========================================
        // FUNÇÕES DE TOGGLE E LIMPAR TREINO
        // ==========================================
        function toggleTreino(treinoId) {
            const card = document.getElementById('treino-' + treinoId);
            if (card) {
                card.classList.toggle('collapsed');
                // Salvar estado no localStorage
                const collapsed = JSON.parse(localStorage.getItem('treinos_collapsed') || '{}');
                collapsed[treinoId] = card.classList.contains('collapsed');
                localStorage.setItem('treinos_collapsed', JSON.stringify(collapsed));
            }
        }
        
        function limparCheckboxes() {
            if (!confirm('Limpar todas as marcações de exercícios feitos?')) return;
            saude.treinos.forEach(treino => {
                if (treino.exercicios) {
                    treino.exercicios.forEach(ex => ex.feito = false);
                }
            });
            salvarDados();
            renderTreinos();
        }
        
        function restaurarEstadoColapsado() {
            const collapsed = JSON.parse(localStorage.getItem('treinos_collapsed') || '{}');
            Object.keys(collapsed).forEach(treinoId => {
                if (collapsed[treinoId]) {
                    const card = document.getElementById('treino-' + treinoId);
                    if (card) card.classList.add('collapsed');
                }
            });
        }

        // ==========================================
        // EVOLUÇÃO / PESO
        // ==========================================
        let pesoChart = null;
        let periodoFiltro = 0; // 0 = todos
        
        function renderPesoCompleto() {
            if (!saude.pesos) saude.pesos = [];
            
            const pesos = filtrarPesosPorPeriodo(saude.pesos, periodoFiltro);
            const pesosOrdenados = [...pesos].sort((a, b) => new Date(a.data) - new Date(b.data));
            
            // Atualizar card principal
            if (pesosOrdenados.length > 0) {
                const ultimo = pesosOrdenados[pesosOrdenados.length - 1];
                const primeiro = pesosOrdenados[0];
                const penultimo = pesosOrdenados.length > 1 ? pesosOrdenados[pesosOrdenados.length - 2] : null;
                
                // Peso atual
                document.getElementById('pesoAtual').textContent = ultimo.peso + 'kg';
                
                // Variação desde último
                if (penultimo) {
                    const diff = (ultimo.peso - penultimo.peso).toFixed(1);
                    const sinal = diff > 0 ? '+' : '';
                    document.getElementById('pesoVariacao').textContent = sinal + diff + 'kg';
                    document.getElementById('pesoVariacao').className = 'peso-variacao ' + (diff > 0 ? 'positivo' : diff < 0 ? 'negativo' : '');
                } else {
                    document.getElementById('pesoVariacao').textContent = '';
                }
                
                // Tendência
                const tendencia = document.getElementById('pesoTendencia');
                const tendenciaTexto = document.getElementById('pesoTendenciaTexto');
                if (penultimo) {
                    const diff = ultimo.peso - penultimo.peso;
                    if (diff > 0.3) {
                        tendencia.className = 'peso-card-tendencia subindo';
                        tendenciaTexto.textContent = 'Subindo';
                    } else if (diff < -0.3) {
                        tendencia.className = 'peso-card-tendencia descendo';
                        tendenciaTexto.textContent = 'Descendo';
                    } else {
                        tendencia.className = 'peso-card-tendencia estavel';
                        tendenciaTexto.textContent = 'Estável';
                    }
                } else {
                    tendencia.className = 'peso-card-tendencia';
                    tendenciaTexto.textContent = '--';
                }
                
                // Stats
                document.getElementById('pesoInicial').textContent = primeiro.peso + 'kg';
                const variacaoTotal = (ultimo.peso - primeiro.peso).toFixed(1);
                const sinalTotal = variacaoTotal > 0 ? '+' : '';
                document.getElementById('pesoVariacaoTotal').textContent = sinalTotal + variacaoTotal + 'kg';
                document.getElementById('pesoVariacaoTotal').className = 'peso-stat-valor ' + (variacaoTotal > 0 ? 'positivo' : variacaoTotal < 0 ? 'negativo' : '');
                document.getElementById('pesoRegistros').textContent = saude.pesos.length;
                
                // Data desde
                const dataInicio = new Date(primeiro.data);
                document.getElementById('pesoDesde').innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>Acompanhando desde: ${dataInicio.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                `;
            } else {
                document.getElementById('pesoAtual').textContent = '--';
                document.getElementById('pesoVariacao').textContent = '';
                document.getElementById('pesoInicial').textContent = '--';
                document.getElementById('pesoVariacaoTotal').textContent = '--';
                document.getElementById('pesoRegistros').textContent = '0';
                document.getElementById('pesoTendenciaTexto').textContent = '--';
            }
            
            // Renderizar gráfico
            renderPesoGrafico(pesosOrdenados);
            
            // Renderizar histórico
            renderPesoHistorico();
        }
        
        function filtrarPesosPorPeriodo(pesos, dias) {
            if (dias === 0) return pesos;
            
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - dias);
            
            return pesos.filter(p => new Date(p.data) >= dataLimite);
        }
        
        function filtrarPeriodo(dias, btn) {
            document.querySelectorAll('.filtro-periodo').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            periodoFiltro = dias;
            renderPesoCompleto();
        }
        
        function renderPesoGrafico(pesos) {
            const ctx = document.getElementById('pesoGrafico');
            if (!ctx) return;
            
            if (pesoChart) {
                pesoChart.destroy();
            }
            
            if (pesos.length === 0) {
                return;
            }
            
            const labels = pesos.map(p => {
                const d = new Date(p.data);
                return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
            });
            
            const valores = pesos.map(p => p.peso);
            const min = Math.min(...valores) - 2;
            const max = Math.max(...valores) + 2;
            
            pesoChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        data: valores,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#3498db',
                        pointBorderColor: '#3498db',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1a1a1a',
                            titleColor: '#fff',
                            bodyColor: '#3498db',
                            borderColor: 'rgba(52, 152, 219, 0.3)',
                            borderWidth: 1,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    return context.raw + 'kg';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }
                        },
                        y: {
                            min: min,
                            max: max,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { 
                                color: 'rgba(255,255,255,0.5)', 
                                font: { size: 10 },
                                callback: function(value) { return value + 'kg'; }
                            }
                        }
                    }
                }
            });
        }
        
        function renderPesoHistorico() {
            const container = document.getElementById('pesoHistoricoLista');
            if (!container) return;
            
            if (!saude.pesos || saude.pesos.length === 0) {
                container.innerHTML = '<div class="peso-historico-vazio">Nenhum registro de peso ainda</div>';
                return;
            }
            
            // Ordenar do mais recente para o mais antigo
            const pesosOrdenados = [...saude.pesos].sort((a, b) => new Date(b.data) - new Date(a.data));
            
            container.innerHTML = pesosOrdenados.map((p, idx) => {
                const data = new Date(p.data);
                const dataFormatada = data.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                
                return `
                <div class="peso-historico-item">
                    <div class="peso-historico-info">
                        <span class="peso-historico-valor">${p.peso}kg</span>
                        <span class="peso-historico-data">${dataFormatada}</span>
                        ${p.obs ? `<span class="peso-historico-obs">${p.obs}</span>` : ''}
                    </div>
                    <div class="peso-historico-acoes">
                        <button onclick="editarPeso('${p.id}')" title="Editar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="delete" onclick="excluirPeso('${p.id}')" title="Excluir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>`;
            }).join('');
        }
        
        function abrirModalPeso() {
            document.getElementById('pesoEditId').value = '';
            document.getElementById('pesoInput').value = '';
            document.getElementById('pesoData').value = new Date().toISOString().split('T')[0];
            document.getElementById('pesoObs').value = '';
            document.getElementById('modalPeso').classList.add('active');
        }
        
        function fecharModalPeso() {
            document.getElementById('modalPeso').classList.remove('active');
        }
        
        function salvarPeso() {
            const id = document.getElementById('pesoEditId').value;
            const peso = parseFloat(document.getElementById('pesoInput').value);
            const data = document.getElementById('pesoData').value;
            const obs = document.getElementById('pesoObs').value.trim();
            
            if (!peso || peso < 20 || peso > 300) {
                mostrarStatus('Digite um peso válido (entre 20 e 300 kg)', 'error');
                return;
            }
            
            if (!data) {
                mostrarStatus('Selecione uma data', 'error');
                return;
            }
            
            if (!saude.pesos) saude.pesos = [];
            
            if (id) {
                // Editar
                const idx = saude.pesos.findIndex(p => p.id === id);
                if (idx !== -1) {
                    saude.pesos[idx] = { id, peso, data, obs };
                }
            } else {
                // Novo
                saude.pesos.push({
                    id: Date.now().toString(),
                    peso,
                    data,
                    obs
                });
            }
            
            salvarDados();
            fecharModalPeso();
            renderPesoCompleto();
        }
        
        function editarPeso(id) {
            const p = saude.pesos.find(p => p.id === id);
            if (!p) return;
            
            document.getElementById('pesoEditId').value = p.id;
            document.getElementById('pesoInput').value = p.peso;
            document.getElementById('pesoData').value = p.data;
            document.getElementById('pesoObs').value = p.obs || '';
            document.getElementById('modalPeso').classList.add('active');
        }
        
        function excluirPeso(id) {
            if (!confirm('Excluir este registro de peso?')) return;
            saude.pesos = saude.pesos.filter(p => p.id !== id);
            salvarDados();
            renderPesoCompleto();
        }

        // ==========================================
        // TELEGRAM - NOTIFICAÇÕES
        // ==========================================
        function toggleTelegramConfig() {
            const body = document.getElementById('telegramConfigBody');
            body.classList.toggle('active');
        }
        
        function carregarTelegramConfig() {
            if (saude.telegram) {
                document.getElementById('telegramBotToken').value = saude.telegram.botToken || '';
                document.getElementById('telegramChatId').value = saude.telegram.chatId || '';
                atualizarStatusTelegram();
            }
        }
        
        function salvarTelegramConfig() {
            saude.telegram.botToken = document.getElementById('telegramBotToken').value.trim();
            saude.telegram.chatId = document.getElementById('telegramChatId').value.trim();
            saude.telegram.ativo = !!(saude.telegram.botToken && saude.telegram.chatId);
            salvarDados();
            atualizarStatusTelegram();
            
            // Salvar também no Supabase para a Edge Function usar
            if (useSupabase && saude.telegram.botToken && saude.telegram.chatId) {
                salvarTelegramSupabase();
            }
        }
        
        async function salvarTelegramSupabase() {
            if (!useSupabase) return;
            try {
                const { error } = await supabaseClient.from('telegram_config').upsert({
                    id: USER_ID,
                    user_id: USER_ID,
                    bot_token: saude.telegram.botToken,
                    chat_id: saude.telegram.chatId,
                    ativo: saude.telegram.ativo,
                    updated_at: new Date().toISOString()
                });
                if (error) {
                    console.error('Erro ao salvar Telegram no Supabase:', error);
                } else {
                    console.log('Telegram config salva no Supabase');
                }
            } catch (e) {
                console.error('Exceção ao salvar Telegram:', e);
            }
        }
        
        function atualizarStatusTelegram() {
            const status = document.getElementById('telegramStatus');
            if (saude.telegram.botToken && saude.telegram.chatId) {
                status.className = 'telegram-status connected';
                status.innerHTML = '<span class="telegram-status-dot"></span><span>Conectado</span>';
            } else {
                status.className = 'telegram-status disconnected';
                status.innerHTML = '<span class="telegram-status-dot"></span><span>Desconectado</span>';
            }
        }
        
        async function testarTelegram() {
            const token = document.getElementById('telegramBotToken').value.trim();
            const chatId = document.getElementById('telegramChatId').value.trim();
            
            if (!token || !chatId) {
                mostrarStatus('Preencha o Bot Token e o Chat ID.', 'error');
                return;
            }
            
            try {
                const msg = '✅ *ZARA Saúde*\n\nConexão testada com sucesso!\nAs notificações de medicamentos estão ativas 24/7.';
                const url = `https://api.telegram.org/bot${token}/sendMessage`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
                });
                
                const data = await response.json();
                if (data.ok) {
                    mostrarStatus('✅ Conexão bem-sucedida! Verifique o Telegram.\n\nAs notificações funcionarão 24/7, mesmo com o computador desligado.', 'error');
                    salvarTelegramConfig();
                } else {
                    mostrarStatus('Erro: ' + (data.description || 'Falha na conexão'), 'error');
                }
            } catch (e) {
                mostrarStatus('❌ Erro de conexão: ' + e.message, 'error');
            }
        }
        
        async function obterChatId() {
            const token = document.getElementById('telegramBotToken').value.trim();
            if (!token) {
                mostrarStatus('Preencha o Bot Token primeiro.', 'error');
                return;
            }
            
            try {
                const url = `https://api.telegram.org/bot${token}/getUpdates`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.ok && data.result.length > 0) {
                    const chatId = data.result[data.result.length - 1].message?.chat?.id;
                    if (chatId) {
                        document.getElementById('telegramChatId').value = chatId;
                        salvarTelegramConfig();
                        mostrarStatus('✅ Chat ID obtido: ' + chatId, 'error');
                    } else {
                        mostrarStatus('❌ Envie uma mensagem para o bot primeiro e tente novamente.', 'error');
                    }
                } else {
                    mostrarStatus('❌ Nenhuma mensagem encontrada. Envie qualquer mensagem para o seu bot no Telegram e clique novamente.', 'error');
                }
            } catch (e) {
                mostrarStatus('❌ Erro: ' + e.message, 'error');
            }
        }
        
        function toggleNotificacao(medId) {
            // Atualizar em todos os dias
            Object.keys(saude.planoSemanal).forEach(dia => {
                saude.planoSemanal[dia].forEach(med => {
                    if (med.id === medId) {
                        med.notificar = !med.notificar;
                    }
                });
            });
            salvarDados();
            renderizarPlanoLista();
            
            // Feedback
            const medNome = Object.values(saude.planoSemanal).flat().find(m => m.id === medId)?.nome || 'Medicamento';
            const ativo = Object.values(saude.planoSemanal).flat().find(m => m.id === medId)?.notificar;
            mostrarStatus(`Notificação ${ativo ? 'ativada' : 'desativada'} para ${medNome}`, 'success');
        }
        
        async function enviarNotificacaoTelegram(medicamento) {
            if (!saude.telegram.ativo) return;
            
            const msg = `💊 *Hora do Medicamento!*\n\n*${medicamento.nome}*\nDose: ${medicamento.dose}\nHorário: ${medicamento.hora}`;
            
            try {
                const url = `https://api.telegram.org/bot${saude.telegram.botToken}/sendMessage`;
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        chat_id: saude.telegram.chatId, 
                        text: msg, 
                        parse_mode: 'Markdown' 
                    })
                });
            } catch (e) {
                console.error('Erro ao enviar notificação:', e);
            }
        }
        
        function verificarHorariosMedicamentos() {
            const agora = new Date();
            const horaAtual = agora.getHours().toString().padStart(2, '0') + ':' + agora.getMinutes().toString().padStart(2, '0');
            const diaAtual = getDiaAtual();
            const dataHoje = getDataHoje();
            
            // Limpar notificações de dias anteriores
            Object.keys(saude.notificacoesEnviadas).forEach(key => {
                if (!key.startsWith(dataHoje)) {
                    delete saude.notificacoesEnviadas[key];
                }
            });
            
            const medsHoje = saude.planoSemanal[diaAtual] || [];
            medsHoje.forEach(med => {
                if (med.notificar && med.hora) {
                    const chaveNotif = `${dataHoje}_${med.id}_${med.hora}`;
                    
                    // Verificar se está no horário (com margem de 1 minuto)
                    if (med.hora === horaAtual && !saude.notificacoesEnviadas[chaveNotif]) {
                        enviarNotificacaoTelegram(med);
                        saude.notificacoesEnviadas[chaveNotif] = true;
                        salvarDados();
                    }
                }
            });
        }
        
        // Verificar horários a cada 30 segundos
        setInterval(verificarHorariosMedicamentos, 30000);

        // ==========================================
        // DIETA - METAS NUTRICIONAIS
        // ==========================================
        function renderNutriResumo() {
            const grid = document.getElementById('nutriResumoGrid');
            if (!grid) return;
            
            if (!saude.nutricao) saude.nutricao = { calorias: '', cho: '', ptn: '', lip: '' };
            
            const items = [
                { label: 'Calorias', valor: saude.nutricao.calorias },
                { label: 'CHO', valor: saude.nutricao.cho },
                { label: 'PTN', valor: saude.nutricao.ptn },
                { label: 'LIP', valor: saude.nutricao.lip }
            ];
            
            grid.innerHTML = items.map(item => `
                <div class="nutri-item">
                    <div class="nutri-item-label">${item.label}</div>
                    <div class="nutri-item-valor">${item.valor || '<span class="nutri-item-vazio">--</span>'}</div>
                </div>
            `).join('');
        }
        
        function abrirModalNutri() {
            if (!saude.nutricao) saude.nutricao = { calorias: '', cho: '', ptn: '', lip: '' };
            document.getElementById('nutriCalorias').value = saude.nutricao.calorias || '';
            document.getElementById('nutriCHO').value = saude.nutricao.cho || '';
            document.getElementById('nutriPTN').value = saude.nutricao.ptn || '';
            document.getElementById('nutriLIP').value = saude.nutricao.lip || '';
            document.getElementById('modalNutri').classList.add('active');
        }
        
        function fecharModalNutri() {
            document.getElementById('modalNutri').classList.remove('active');
        }
        
        function salvarNutri() {
            saude.nutricao = {
                calorias: document.getElementById('nutriCalorias').value.trim(),
                cho: document.getElementById('nutriCHO').value.trim(),
                ptn: document.getElementById('nutriPTN').value.trim(),
                lip: document.getElementById('nutriLIP').value.trim()
            };
            salvarDados();
            fecharModalNutri();
            renderNutriResumo();
        }
        
        // ==========================================
        // DIETA - ÁGUA TRACKER
        // ==========================================
        function renderAguaTracker() {
            if (!saude.agua) saude.agua = { meta: 4, atual: 0, data: getDataHoje() };
            
            // Reset diário
            if (saude.agua.data !== getDataHoje()) {
                saude.agua.atual = 0;
                saude.agua.data = getDataHoje();
                salvarDados();
            }
            
            const atual = saude.agua.atual || 0;
            const meta = saude.agua.meta || 4;
            const pct = Math.min((atual / meta) * 100, 100);
            
            document.getElementById('aguaAtualDisplay').textContent = atual;
            document.getElementById('aguaMetaDisplay').textContent = meta;
            document.getElementById('aguaProgressBar').style.width = pct + '%';
        }
        
        function ajustarAgua(delta) {
            if (!saude.agua) saude.agua = { meta: 4, atual: 0, data: getDataHoje() };
            if (saude.agua.data !== getDataHoje()) {
                saude.agua.atual = 0;
                saude.agua.data = getDataHoje();
            }
            
            saude.agua.atual = Math.max(0, (saude.agua.atual || 0) + delta);
            salvarDados();
            renderAguaTracker();
        }
        
        function editarMetaAgua() {
            const novaMeta = prompt('Meta diária de água (litros):', saude.agua?.meta || 4);
            if (novaMeta !== null && !isNaN(parseFloat(novaMeta))) {
                if (!saude.agua) saude.agua = { meta: 4, atual: 0, data: getDataHoje() };
                saude.agua.meta = parseFloat(novaMeta);
                salvarDados();
                renderAguaTracker();
            }
        }
        
        // ==========================================
        // DIETA - INFORMAÇÕES ADICIONAIS
        // ==========================================
        function renderInfoLista() {
            const container = document.getElementById('infoLista');
            if (!container) return;
            
            if (!saude.informacoes) saude.informacoes = [];
            
            if (saude.informacoes.length === 0) {
                container.innerHTML = '<div class="info-vazia">Nenhuma informação adicionada</div>';
                return;
            }
            
            container.innerHTML = saude.informacoes.map(info => `
                <div class="info-item-card">
                    <div class="info-item-texto">
                        <strong>${info.titulo}:</strong> ${info.conteudo}
                    </div>
                    <div class="info-item-acoes">
                        <button onclick="editarInfo('${info.id}')" title="Editar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="delete" onclick="excluirInfo('${info.id}')" title="Excluir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        function abrirModalInfo() {
            document.getElementById('infoEditId').value = '';
            document.getElementById('infoTitulo').value = '';
            document.getElementById('infoConteudo').value = '';
            document.getElementById('modalInfo').classList.add('active');
        }
        
        function fecharModalInfo() {
            document.getElementById('modalInfo').classList.remove('active');
        }
        
        function salvarInfo() {
            const id = document.getElementById('infoEditId').value;
            const titulo = document.getElementById('infoTitulo').value.trim();
            const conteudo = document.getElementById('infoConteudo').value.trim();
            
            if (!titulo || !conteudo) {
                mostrarStatus('Preencha o título e o conteúdo.', 'error');
                return;
            }
            
            if (!saude.informacoes) saude.informacoes = [];
            
            if (id) {
                // Editar
                const idx = saude.informacoes.findIndex(i => i.id === id);
                if (idx !== -1) {
                    saude.informacoes[idx] = { id, titulo, conteudo };
                }
            } else {
                // Novo
                saude.informacoes.push({
                    id: Date.now().toString(),
                    titulo,
                    conteudo
                });
            }
            
            salvarDados();
            fecharModalInfo();
            renderInfoLista();
        }
        
        function editarInfo(id) {
            const info = saude.informacoes.find(i => i.id === id);
            if (!info) return;
            
            document.getElementById('infoEditId').value = info.id;
            document.getElementById('infoTitulo').value = info.titulo;
            document.getElementById('infoConteudo').value = info.conteudo;
            document.getElementById('modalInfo').classList.add('active');
        }
        
        function excluirInfo(id) {
            if (!confirm('Excluir esta informação?')) return;
            saude.informacoes = saude.informacoes.filter(i => i.id !== id);
            salvarDados();
            renderInfoLista();
        }

        // ==========================================
        // REFEIÇÕES / DIETA
        // ==========================================
        let alimentosTemp = [];
        
        function renderRefeicoes() {
            const container = document.getElementById('listaRefeicoes');
            if (!container) return;
            
            if (!saude.refeicoes || saude.refeicoes.length === 0) {
                container.innerHTML = `
                    <div class="refeicoes-empty">
                        <div class="refeicoes-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:32px;height:32px;opacity:0.3"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg></div>
                        <p>Nenhuma refeição cadastrada</p>
                        <p style="font-size:0.85em;margin-top:5px">Clique em "+ Adicionar Refeição" para começar</p>
                    </div>
                `;
                return;
            }
            
            // Ordenar por horário
            const refeicoes = [...saude.refeicoes].sort((a, b) => {
                if (!a.horario) return 1;
                if (!b.horario) return -1;
                return a.horario.localeCompare(b.horario);
            });
            
            // Verificar status de hoje
            const dataHoje = getDataHoje();
            if (!saude.refeicoesStatus || saude.refeicoesStatus.data !== dataHoje) {
                saude.refeicoesStatus = { data: dataHoje, feitas: {} };
            }
            
            container.innerHTML = refeicoes.map(ref => {
                const feita = saude.refeicoesStatus.feitas[ref.id];
                return `
                <div class="refeicao-card ${feita ? 'feita' : ''}" id="refeicaoCard${ref.id}">
                    <div class="refeicao-card-header" onclick="toggleRefeicaoCard(${ref.id})">
                        <div class="refeicao-header-left">
                            <svg class="refeicao-expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                            <div>
                                <div class="refeicao-nome">${ref.nome}</div>
                                <div class="refeicao-subtitulo">${(ref.alimentos || []).length} alimentos</div>
                            </div>
                        </div>
                        <div class="refeicao-header-right">
                            ${ref.horario ? `
                                <div class="refeicao-horario">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    ${ref.horario}
                                </div>
                            ` : ''}
                            <div class="refeicao-card-actions" onclick="event.stopPropagation()">
                                <button class="refeicao-card-btn done ${feita ? 'checked' : ''}" onclick="toggleRefeicaoFeita(${ref.id})" title="${feita ? 'Desmarcar' : 'Marcar como feita'}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                                </button>
                                <button class="refeicao-card-btn" onclick="editarRefeicao(${ref.id})" title="Editar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button class="refeicao-card-btn duplicate" onclick="duplicarRefeicao(${ref.id})" title="Duplicar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                </button>
                                <button class="refeicao-card-btn delete" onclick="excluirRefeicao(${ref.id})" title="Excluir">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="refeicao-card-body">
                        <!-- Alimentos primeiro -->
                        <div class="refeicao-alimentos">
                            <table class="refeicao-alimentos-table">
                                <thead>
                                    <tr>
                                        <th>Alimento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(ref.alimentos || []).map(alimento => `
                                        <tr>
                                            <td>
                                                <div class="refeicao-alimento-nome">
                                                    <div class="refeicao-check-icon">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                                    </div>
                                                    <span>${alimento}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Observações depois -->
                        ${ref.observacoes ? `
                            <div class="refeicao-observacoes">
                                <div class="refeicao-obs-titulo">Observações</div>
                                <div class="refeicao-obs-texto">${ref.observacoes}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `}).join('');
        }
        
        function toggleRefeicaoCard(id) {
            const card = document.getElementById('refeicaoCard' + id);
            if (card) {
                card.classList.toggle('expanded');
            }
        }
        
        function toggleRefeicaoFeita(id) {
            const dataHoje = getDataHoje();
            if (!saude.refeicoesStatus || saude.refeicoesStatus.data !== dataHoje) {
                saude.refeicoesStatus = { data: dataHoje, feitas: {} };
            }
            
            saude.refeicoesStatus.feitas[id] = !saude.refeicoesStatus.feitas[id];
            salvarDados();
            renderRefeicoes();
        }
        
        function duplicarRefeicao(id) {
            const original = saude.refeicoes.find(r => r.id === id);
            if (!original) return;
            
            const novaRef = {
                id: Date.now(),
                nome: original.nome + ' (cópia)',
                horario: original.horario,
                observacoes: original.observacoes,
                alimentos: [...(original.alimentos || [])]
            };
            
            saude.refeicoes.push(novaRef);
            salvarDados();
            renderRefeicoes();
            mostrarStatus('Refeição duplicada!', 'success');
        }
        
        function abrirModalRefeicao(id = null) {
            const modal = document.getElementById('modalRefeicao');
            const titulo = modal.querySelector('.modal-treino-title');
            
            document.getElementById('refeicaoId').value = '';
            document.getElementById('refeicaoNome').value = '';
            document.getElementById('refeicaoHorario').value = '';
            document.getElementById('refeicaoObservacoes').value = '';
            alimentosTemp = [];
            
            if (id) {
                const ref = saude.refeicoes.find(r => r.id === id);
                if (ref) {
                    titulo.textContent = 'Editar Refeição';
                    document.getElementById('refeicaoId').value = ref.id;
                    document.getElementById('refeicaoNome').value = ref.nome;
                    document.getElementById('refeicaoHorario').value = ref.horario || '';
                    document.getElementById('refeicaoObservacoes').value = ref.observacoes || '';
                    alimentosTemp = [...(ref.alimentos || [])];
                }
            } else {
                titulo.textContent = 'Nova Refeição';
                // Adicionar 3 campos de alimento vazios por padrão
                alimentosTemp = ['', '', ''];
            }
            
            renderAlimentosInputs();
            modal.classList.add('active');
        }
        
        function fecharModalRefeicao() {
            document.getElementById('modalRefeicao').classList.remove('active');
        }
        
        function renderAlimentosInputs() {
            const container = document.getElementById('alimentosContainer');
            container.innerHTML = alimentosTemp.map((alimento, idx) => `
                <div class="alimento-input-row">
                    <input type="text" 
                           value="${alimento}" 
                           placeholder="Ex: 130 gramas Frango, peito, sem pele, cozido"
                           onchange="alimentosTemp[${idx}] = this.value"
                           style="width:100%;padding:12px;background:#141414;border:1px solid rgba(212,175,125,0.2);border-radius:8px;color:#fff;font-size:0.95em">
                    <button type="button" class="btn-remove-alimento" onclick="removerCampoAlimento(${idx})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            `).join('');
        }
        
        function adicionarCampoAlimento() {
            // Salvar valores atuais dos inputs
            const inputs = document.querySelectorAll('#alimentosContainer input');
            alimentosTemp = Array.from(inputs).map(input => input.value);
            
            alimentosTemp.push('');
            renderAlimentosInputs();
            
            // Focar no novo input
            const novosInputs = document.querySelectorAll('#alimentosContainer input');
            if (novosInputs.length > 0) {
                novosInputs[novosInputs.length - 1].focus();
            }
        }
        
        function removerCampoAlimento(idx) {
            // Salvar valores atuais dos inputs
            const inputs = document.querySelectorAll('#alimentosContainer input');
            alimentosTemp = Array.from(inputs).map(input => input.value);
            
            alimentosTemp.splice(idx, 1);
            renderAlimentosInputs();
        }
        
        function salvarRefeicao() {
            const id = document.getElementById('refeicaoId').value;
            const nome = document.getElementById('refeicaoNome').value.trim();
            const horario = document.getElementById('refeicaoHorario').value;
            const observacoes = document.getElementById('refeicaoObservacoes').value.trim();
            
            // Pegar valores atuais dos inputs
            const inputs = document.querySelectorAll('#alimentosContainer input');
            const alimentos = Array.from(inputs)
                .map(input => input.value.trim())
                .filter(v => v !== '');
            
            if (!nome) {
                mostrarStatus('Digite o nome da refeição', 'error');
                return;
            }
            
            if (alimentos.length === 0) {
                mostrarStatus('Adicione pelo menos um alimento', 'error');
                return;
            }
            
            if (id) {
                // Editar
                const idx = saude.refeicoes.findIndex(r => r.id === parseInt(id));
                if (idx !== -1) {
                    saude.refeicoes[idx] = {
                        ...saude.refeicoes[idx],
                        nome,
                        horario,
                        observacoes,
                        alimentos
                    };
                }
            } else {
                // Novo
                saude.refeicoes.push({
                    id: Date.now(),
                    nome,
                    horario,
                    observacoes,
                    alimentos
                });
            }
            
            salvarDados();
            renderRefeicoes();
            fecharModalRefeicao();
            mostrarStatus('Refeição salva!', 'success');
        }
        
        function editarRefeicao(id) {
            abrirModalRefeicao(id);
        }
        
        function excluirRefeicao(id) {
            if (confirm('Excluir esta refeição?')) {
                saude.refeicoes = saude.refeicoes.filter(r => r.id !== id);
                salvarDados();
                renderRefeicoes();
                mostrarStatus('Refeição excluída', 'success');
            }
        }
        
        // ==========================================
        // CARDS DA DIETA
        // ==========================================
        function toggleCardExpand(cardId) {
            event.stopPropagation();
            const card = document.getElementById(cardId);
            if (card) {
                card.parentElement.classList.toggle('expanded');
            }
        }
        
        function salvarDietaCards() {
            if (!saude.dietaCards) saude.dietaCards = {};
            
            const prescricao = document.getElementById('prescricaoTexto');
            const aguaMeta = document.getElementById('aguaMeta');
            const infoCalorias = document.getElementById('infoCalorias');
            const infoCHO = document.getElementById('infoCHO');
            const infoPTN = document.getElementById('infoPTN');
            const infoLIP = document.getElementById('infoLIP');
            const refeicaoLivre = document.getElementById('refeicaoLivreTexto');
            
            if (prescricao) saude.dietaCards.prescricao = prescricao.value;
            if (aguaMeta) saude.dietaCards.aguaMeta = aguaMeta.value;
            if (infoCalorias) saude.dietaCards.calorias = infoCalorias.value;
            if (infoCHO) saude.dietaCards.cho = infoCHO.value;
            if (infoPTN) saude.dietaCards.ptn = infoPTN.value;
            if (infoLIP) saude.dietaCards.lip = infoLIP.value;
            if (refeicaoLivre) saude.dietaCards.refeicaoLivre = refeicaoLivre.value;
            
            // Atualizar display de água
            const aguaDisplay = document.getElementById('aguaValorDisplay');
            if (aguaDisplay && aguaMeta) {
                aguaDisplay.textContent = aguaMeta.value + 'L';
            }
            
            salvarDados();
        }
        
        function carregarDietaCards() {
            if (!saude.dietaCards) return;
            
            const prescricao = document.getElementById('prescricaoTexto');
            const aguaMeta = document.getElementById('aguaMeta');
            const infoCalorias = document.getElementById('infoCalorias');
            const infoCHO = document.getElementById('infoCHO');
            const infoPTN = document.getElementById('infoPTN');
            const infoLIP = document.getElementById('infoLIP');
            const refeicaoLivre = document.getElementById('refeicaoLivreTexto');
            const aguaDisplay = document.getElementById('aguaValorDisplay');
            
            if (prescricao && saude.dietaCards.prescricao) prescricao.value = saude.dietaCards.prescricao;
            if (aguaMeta && saude.dietaCards.aguaMeta) aguaMeta.value = saude.dietaCards.aguaMeta;
            if (infoCalorias && saude.dietaCards.calorias) infoCalorias.value = saude.dietaCards.calorias;
            if (infoCHO && saude.dietaCards.cho) infoCHO.value = saude.dietaCards.cho;
            if (infoPTN && saude.dietaCards.ptn) infoPTN.value = saude.dietaCards.ptn;
            if (infoLIP && saude.dietaCards.lip) infoLIP.value = saude.dietaCards.lip;
            if (refeicaoLivre && saude.dietaCards.refeicaoLivre) refeicaoLivre.value = saude.dietaCards.refeicaoLivre;
            if (aguaDisplay && saude.dietaCards.aguaMeta) aguaDisplay.textContent = saude.dietaCards.aguaMeta + 'L';
        }

        // ==========================================
        // INICIALIZAÇÃO
        // ==========================================
        async function inicializar() {
            await carregarSupabase();
            renderizarHoje();
            renderizarPlanoLista();
            renderTreinos();
            renderAlertas();
            renderRefeicoes();
            renderNutriResumo();
            renderAguaTracker();
            renderInfoLista();
            renderPesoCompleto();
            carregarTelegramConfig();
            verificarHorariosMedicamentos();
        }
        
        inicializar();

// ── Swipe entre abas no mobile ──
document.addEventListener('touchstart', function(e){ window._sx=e.touches[0].clientX; window._sy=e.touches[0].clientY; }, {passive:true});
document.addEventListener('touchend', function(e){
    var dx=e.changedTouches[0].clientX-(window._sx||0);
    var dy=e.changedTouches[0].clientY-(window._sy||0);
    if(Math.abs(dx)<60||Math.abs(dy)>Math.abs(dx)) return;
    var a=document.querySelector('.tab-btn.active');
    if(!a) return;
    var tabs=['medicamentos','dieta','treino','fotos'];
    var i=tabs.indexOf(a.getAttribute('data-tab')||'');
    if(dx<0&&i<tabs.length-1&&typeof showTab==='function') showTab(tabs[i+1]);
    if(dx>0&&i>0&&typeof showTab==='function') showTab(tabs[i-1]);
}, {passive:true});

// ── Modal de confirmação premium (saude) ──
function confirmarAcao(msg, callback, titulo, okLabel, okColor) {
    titulo   = titulo   || 'Confirmar';
    okLabel  = okLabel  || 'Confirmar';
    okColor  = okColor  || '#e74c3c';
    var el = document.getElementById('saude-confirm-modal');
    if (!el) {
        el = document.createElement('div');
        el.id = 'saude-confirm-modal';
        el.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:99999;align-items:center;justify-content:center;padding:20px;';
        el.innerHTML = '<div style="background:#141414;border:1px solid rgba(201,168,76,0.25);border-radius:16px;padding:28px 24px;max-width:350px;width:100%;text-align:center;">'
            + '<div style="width:50px;height:50px;border-radius:50%;background:rgba(231,76,60,0.12);border:1px solid rgba(231,76,60,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">'
            + '<svg viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" style="width:22px;height:22px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
            + '</div>'
            + '<h3 id="saudeConfirmT" style="color:#e8c160;font-size:.82em;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;"></h3>'
            + '<p id="saudeConfirmM" style="color:rgba(255,255,255,0.82);font-size:.84em;line-height:1.6;margin-bottom:20px;"></p>'
            + '<div style="display:flex;gap:10px;justify-content:center;">'
            + '<button id="saudeConfirmN" style="flex:1;max-width:120px;padding:10px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:rgba(255,255,255,0.7);font-size:.78em;font-weight:600;cursor:pointer;">Cancelar</button>'
            + '<button id="saudeConfirmS" style="flex:1;max-width:140px;padding:10px;border:none;border-radius:10px;color:#fff;font-size:.78em;font-weight:700;text-transform:uppercase;letter-spacing:1px;cursor:pointer;"></button>'
            + '</div></div>';
        document.body.appendChild(el);
        document.getElementById('saudeConfirmN').onclick = function(){ el.style.display='none'; };
        el.onclick = function(e){ if(e.target===el) el.style.display='none'; };
    }
    document.getElementById('saudeConfirmT').textContent = titulo;
    document.getElementById('saudeConfirmM').textContent = msg;
    var ok = document.getElementById('saudeConfirmS');
    ok.textContent = okLabel;
    ok.style.background = okColor;
    ok.onclick = function(){ el.style.display='none'; callback(); };
    el.style.display = 'flex';
}
