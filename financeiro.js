/* ======

        // Cards mobile para avulsas
        const mobileAvulsas = document.getElementById('despesasAvulsasMobile');
        if (mobileAvulsas) {
            let htmlMobAvulsas = '<div class="desp-cards-wrap">';

            // ── Avulsas atrasadas de meses anteriores ──
            variaveisNaoPagasAtraso.forEach(d => {
                const icon = getCategIcon(d.categoria || 'Outros');
                const [ano, mes] = d.data.substring(0,7).split('-');
                const nomesMes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                const mesNome = nomesMes[parseInt(mes)-1] || mes;
                htmlMobAvulsas += `<div class="desp-card desp-card-vencida" style="border-left:3px solid var(--red)">
                    <div class="desp-card-top">
                        <div class="desp-card-icon">${icon}</div>
                        <div class="desp-card-info">
                            <div class="desp-card-nome">${d.descricao} <span class="desp-atraso-badge">${mesNome}/${ano}</span></div>
                            <div class="desp-card-meta">${d.categoria||'Outros'} · ${formatarData(d.data)}</div>
                        </div>
                        <div class="desp-card-right">
                            <div class="desp-card-valor" style="color:var(--red);">${formatarMoeda(d.valor)}</div>
                            <span class="desp-badge pendente">Atrasada</span>
                        </div>
                    </div>
                    <div class="desp-card-acoes">
                        <button onclick="marcarPagoAvulsa(${d.id})"
                            style="background:rgba(95,224,138,0.15);border:1px solid rgba(95,224,138,0.5);
                                   border-radius:8px;color:#5fe08a;font-size:0.72em;font-weight:800;
                                   padding:5px 14px;cursor:pointer;font-family:inherit;">
                            PAGAR
                        </button>
                        <button class="acc-delete-btn" onclick="deletarDespesaAvulsa(${d.id})" title="Excluir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>`;
            });

            avulsasMes.forEach(d => {
                const hj = new Date(); hj.setHours(0,0,0,0);
                const dv = d.data ? new Date(d.data+'T00:00:00') : null;
                const vencido = dv && dv < hj && !d.pago;
                const badge = getStatusBadge(d.pago, vencido);
                const cor = d.pago ? 'var(--green)' : vencido ? 'var(--red)' : 'var(--text-sub)';
                const bordaL = vencido ? '3px solid var(--red)' : d.pago ? '3px solid var(--green)' : '3px solid transparent';
                const icon = getCategIcon(d.categoria || 'Outros');
                htmlMobAvulsas += `<div class="desp-card${vencido?' desp-card-vencida':''}${d.pago?' desp-card-paga':''}" style="border-left:${bordaL}">
                    <div class="desp-card-top">
                        <div class="desp-card-icon">${icon}</div>
                        <div class="desp-card-info">
                            <div class="desp-card-nome">${d.descricao}</div>
                            <div class="desp-card-meta">${d.categoria||'Outros'} · ${formatarData(d.data)}</div>
                        </div>
                        <div class="desp-card-right">
                            <div class="desp-card-valor" style="color:${cor};">${formatarMoeda(d.valor)}</div>
                            ${badge}
                        </div>
                    </div>
                    <div class="desp-card-acoes">
                        <button onclick="marcarPagoAvulsa(${d.id})"
                            style="background:rgba(95,224,138,0.15);border:1px solid rgba(95,224,138,0.5);
                                   border-radius:8px;color:#5fe08a;font-size:0.72em;font-weight:800;
                                   padding:5px 14px;cursor:pointer;font-family:inherit;">
                            PAGAR
                        </button>
                        <button class="acc-delete-btn" onclick="deletarDespesaAvulsa(${d.id})" title="Excluir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>`;
            });
            htmlMobAvulsas += '</div>';
            mobileAvulsas.innerHTML = htmlMobAvulsas;
        }
====================================================
   FINANCEIRO.JS
   Logica extraida de financeiro.html (separacao de
   responsabilidades: HTML / CSS / JS)
   Depende do script do Supabase carregado antes deste arquivo.
   ========================================================== */

    // ==========================================
    // CONFIGURAÇÃO E INICIALIZAÇÃO
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
        console.log('Supabase indisponível, usando localStorage');
    }

    // ==========================================
    // ESTRUTURA DE DADOS
    // ==========================================
    
    const dadosVazios = {
        receitas: [],
        despesasFixas: [],           // Modelos de despesas recorrentes
        despesasFixasMes: {},        // Instâncias mensais: {"2025-01": [...]}
        despesasVariaveis: [],       // Despesas parceladas
        despesasAvulsas: [],         // Despesas variáveis (avulsas, não recorrentes)
        emprestimos: [],
        economias: [],
        receitasFixas: [], // Modelos de receitas recorrentes
        receitasMes: {}, // Instâncias de receitas fixas por mês
        receitasAvulsas: [], // Receitas variáveis (avulsas, manuais)
        arquivados: {
            receitas: [],
            despesasFixas: [],
            despesasVariaveis: [],
            despesasAvulsas: [],
            emprestimos: [],
            economias: []
        }
    };

    let financeiro = JSON.parse(localStorage.getItem('financeiro_v5')) || JSON.parse(JSON.stringify(dadosVazios));
    
    // Garantir estrutura completa
    if (!financeiro.arquivados) financeiro.arquivados = JSON.parse(JSON.stringify(dadosVazios.arquivados));
    if (!financeiro.despesasFixasMes) financeiro.despesasFixasMes = {};
    if (!financeiro.receitasFixas) financeiro.receitasFixas = [];
    if (!financeiro.receitasMes) financeiro.receitasMes = {};
    if (!financeiro.receitasAvulsas) financeiro.receitasAvulsas = [];
    if (!financeiro.despesasAvulsas) financeiro.despesasAvulsas = [];

    // Estado da aplicação
    let mesSelecionado = '';
    let anoSelecionado = new Date().getFullYear();
    let viewMode = 'ativos';
    let itemEditando = null;
    let emprestimoSelecionado = null;

    // ==========================================
    // UTILITÁRIOS
    // ==========================================
    
    function getMesAnoKey() {
        return `${anoSelecionado}-${mesSelecionado}`;
    }

    function getMesAnteriorKey() {
        let mes = parseInt(mesSelecionado);
        let ano = parseInt(anoSelecionado);

        mes--;
        if (mes < 1) {
            mes = 12;
            ano--;
        }

        const mesStr = String(mes).padStart(2, '0');
        return `${ano}-${mesStr}`;
    }

    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(valor || 0);
    }

    function formatarData(data) {
        if (!data) return '-';
        return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    }

    // Calcula a data da próxima parcela com base no "dia de vencimento" (1-31).
    // Se o dia já passou neste mês, usa o próximo mês. Ajusta meses curtos (ex: 31 -> 28/29/30).
    function calcularProximaParcelaData(dia) {
        const hoje = new Date();
        let ano = hoje.getFullYear();
        let mes = hoje.getMonth(); // 0-indexed
        if (hoje.getDate() > dia) {
            mes += 1;
            if (mes > 11) { mes = 0; ano += 1; }
        }
        const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate();
        const diaAjustado = Math.min(dia, ultimoDiaDoMes);
        return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(diaAjustado).padStart(2, '0')}`;
    }

    // Avança uma data (YYYY-MM-DD) em 1 mês, usando o "dia original" de vencimento
    // como referência — evita que a data fique "presa" no dia 28 para sempre
    // depois de passar por um fevereiro mais curto.
    function avancarUmMes(dataStr, diaOriginal) {
        const [ano, mes, diaAtual] = dataStr.split('-').map(Number);
        const dia = diaOriginal || diaAtual;
        let novoMes = mes + 1;
        let novoAno = ano;
        if (novoMes > 12) { novoMes = 1; novoAno += 1; }
        const ultimoDiaDoMes = new Date(novoAno, novoMes, 0).getDate();
        const diaAjustado = Math.min(dia, ultimoDiaDoMes);
        return `${novoAno}-${String(novoMes).padStart(2, '0')}-${String(diaAjustado).padStart(2, '0')}`;
    }

    // Soma o valor das parcelas de empréstimos/financiamentos parcelados cuja
    // próxima parcela é referente ao mês selecionado (ainda não paga).
    //
    // - Mês selecionado = mês real atual: também inclui parcelas ATRASADAS
    //   (proximaParcelaData de um mês anterior que ainda não foi paga), para
    //   que uma dívida em atraso não "desapareça" das Despesas Totais.
    // - Outros meses (navegação para passado/futuro): correspondência exata,
    //   evitando contar a mesma parcela em duas telas de meses diferentes.
    //
    // Por que normalmente "===" e não "<=": quando o usuário clica em
    // "Pagar Parcela", proximaParcelaData avança para o mês seguinte e o
    // valor pago passa a entrar pelo histórico de pagamentos
    // (totalEmpPagoMes) — então deixa de bater aqui, evitando contar a
    // mesma parcela duas vezes no mesmo mês.
    function getParcelasPendentesMes() {
        const mesAnoRef = getMesAnoKey();

        let total = 0;
        const detalhes = [];
        (financeiro.emprestimos || []).forEach(e => {
            if (e.arquivado) return;
            // Inclui se: marcado como parcelado OU tem valorParcela + proximaParcelaData
            // (cobre empréstimos cadastrados antes da feature parcelado:true existir)
            const temParcela = e.parcelado || (e.valorParcela > 0 && e.proximaParcelaData);
            if (!temParcela) return;
            if (e.totalParcelas > 0 && (e.parcelasPagas || 0) >= e.totalParcelas) return;
            if (!e.proximaParcelaData) return;
            const parcelaMes = e.proximaParcelaData.substring(0, 7);
            // A parcela conta no mês visualizado se a data dela for igual ou anterior
            // a esse mês (cobre parcelas em atraso, sem depender do relógio real do
            // dispositivo — só do mês que a pessoa está navegando na tela).
            const conta = parcelaMes <= mesAnoRef;
            if (conta) {
                total += (e.valorParcela || 0);
                detalhes.push({ id: e.id, descricao: e.descricao, valor: e.valorParcela || 0, atrasada: parcelaMes < mesAnoRef });
            }
        });
        return { total, detalhes };
    }

    // Diagnóstico: rode no console (F12) digitando diagnosticarParcelas()
    window.diagnosticarParcelas = function() {
        console.log('=== DIAGNÓSTICO DE PARCELAS DE EMPRÉSTIMOS ===');
        console.log('Mês/Ano selecionado:', getMesAnoKey(), '| Hoje (real):', new Date().toISOString().split('T')[0]);
        console.log('');
        (financeiro.emprestimos || []).forEach(e => {
            const temParcela = e.parcelado || (e.valorParcela > 0 && e.proximaParcelaData);
            const quitado = e.totalParcelas > 0 && (e.parcelasPagas || 0) >= e.totalParcelas;
            console.log(`📋 ${e.descricao}`);
            console.log(`   arquivado: ${e.arquivado} | parcelado: ${e.parcelado} | valorParcela: ${e.valorParcela} | proximaParcelaData: ${e.proximaParcelaData}`);
            console.log(`   parcelasPagas: ${e.parcelasPagas} / totalParcelas: ${e.totalParcelas} | quitado: ${quitado}`);
            let motivo = 'CONTANDO ✅';
            if (e.arquivado) motivo = 'NÃO CONTA: está arquivado';
            else if (!temParcela) motivo = 'NÃO CONTA: parcelado=false E não tem valorParcela+proximaParcelaData';
            else if (quitado) motivo = 'NÃO CONTA: todas as parcelas já foram marcadas como pagas';
            else if (!e.proximaParcelaData) motivo = 'NÃO CONTA: proximaParcelaData está vazio';
            console.log(`   >>> ${motivo}`);
            console.log('');
        });
        const r = getParcelasPendentesMes();
        console.log('TOTAL que está entrando em Despesas Totais agora:', formatarMoeda(r.total));
        console.log('Detalhes:', r.detalhes);
    };

    function getDataVencimento(dia) {
        const d = String(dia).padStart(2, '0');
        return `${anoSelecionado}-${mesSelecionado}-${d}`;
    }

    function filtrarPorMes(lista) {
        return (lista || []).filter(item => 
            item.data?.substring(0, 7) === getMesAnoKey()
        );
    }

    function getStatusVencimento(dataStr, pago) {
        if (pago) return { classe: '', badge: '' };
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const vencimento = new Date(dataStr + 'T00:00:00');
        const diffDias = Math.ceil((vencimento - hoje) / 86400000);
        
        if (diffDias < 0) {
            return { 
                classe: 'vencido', 
                badge: `<span class="badge vencido"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> ${Math.abs(diffDias)}d</span>` 
            };
        }
        if (diffDias <= 3) {
            return { 
                classe: 'proximo', 
                badge: `<span class="badge proximo"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${diffDias === 0 ? 'Hoje' : diffDias + 'd'}</span>` 
            };
        }
        return { classe: '', badge: '' };
    }

    function gerarId() {
        return Date.now() + Math.random();
    }

    // ==========================================
    // COMPROVANTES (Base64)
    // ==========================================
    
    async function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) { resolve(null); return; }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Criar objeto de comprovante com metadados
    async function criarComprovante(fileInput, tipo, valor, descricao) {
        const file = fileInput?.files?.[0];
        if (!file) return null;
        
        const base64 = await fileToBase64(file);
        return {
            arquivo: base64,
            nomeArquivo: file.name,
            tipoArquivo: file.type,
            dataPagamento: new Date().toISOString(),
            valorPago: valor,
            tipoPagamento: tipo, // 'despesa_fixa', 'despesa_variavel', 'juros', 'amortizacao'
            descricao: descricao
        };
    }

    // Visualizar comprovante com informações completas
    function verComprovante(comprovante) {
        const viewer = document.getElementById('modalComprovanteBody');
        
        // Se for string antiga (apenas base64), compatibilidade
        if (typeof comprovante === 'string') {
            if (comprovante.includes('application/pdf')) {
                viewer.innerHTML = `
                    <embed src="${comprovante}" type="application/pdf" width="100%" height="450px" style="border-radius:8px;">
                    <div class="form-buttons" style="margin-top:15px;">
                        <button class="btn-salvar" onclick="baixarComprovante('${comprovante}', 'comprovante')">⬇️ Baixar</button>
                    </div>
                `;
            } else {
                viewer.innerHTML = `
                    <img src="${comprovante}" style="max-width:100%; border-radius:8px;">
                    <div class="form-buttons" style="margin-top:15px;">
                        <button class="btn-salvar" onclick="baixarComprovante('${comprovante}', 'comprovante')">⬇️ Baixar</button>
                    </div>
                `;
            }
            abrirModal('modalComprovante');
            return;
        }

        // Comprovante com metadados completos
        const tiposLabel = {
            'despesa_fixa': 'Despesa Fixa',
            'despesa_variavel': 'Despesa Variável',
            'juros': 'Pagamento de Juros',
            'amortizacao': 'Amortização'
        };

        let previewHTML = '';
        if (comprovante.arquivo.includes('application/pdf')) {
            previewHTML = `<embed src="${comprovante.arquivo}" type="application/pdf" width="100%" height="350px" style="border-radius:8px;">`;
        } else {
            previewHTML = `<img src="${comprovante.arquivo}" style="max-width:100%; border-radius:8px; max-height:350px; object-fit:contain;">`;
        }

        viewer.innerHTML = `
            <div class="info-box" style="margin-bottom:15px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div><strong>Tipo:</strong> ${tiposLabel[comprovante.tipoPagamento] || comprovante.tipoPagamento}</div>
                    <div><strong>Valor:</strong> ${formatarMoeda(comprovante.valorPago)}</div>
                    <div><strong>Data:</strong> ${formatarData(comprovante.dataPagamento?.split('T')[0])}</div>
                    <div><strong>Arquivo:</strong> ${comprovante.nomeArquivo || 'comprovante'}</div>
                </div>
                ${comprovante.descricao ? `<div style="margin-top:8px;"><strong>Ref:</strong> ${comprovante.descricao}</div>` : ''}
            </div>
            ${previewHTML}
            <div class="form-buttons" style="margin-top:15px;">
                <button class="btn-salvar" onclick="baixarComprovanteObj(comprovanteAtual)">⬇️ Baixar Arquivo</button>
            </div>
        `;
        
        // Guardar referência para download
        window.comprovanteAtual = comprovante;
        abrirModal('modalComprovante');
    }

    // Baixar comprovante (base64 direto)
    function baixarComprovante(base64, nome) {
        const link = document.createElement('a');
        link.href = base64;
        link.download = nome + (base64.includes('application/pdf') ? '.pdf' : '.jpg');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Baixar comprovante (objeto com metadados)
    function baixarComprovanteObj(comprovante) {
        if (!comprovante?.arquivo) return;
        const link = document.createElement('a');
        link.href = comprovante.arquivo;
        
        // Determinar extensão
        let ext = '.jpg';
        if (comprovante.tipoArquivo?.includes('pdf')) ext = '.pdf';
        else if (comprovante.tipoArquivo?.includes('png')) ext = '.png';
        else if (comprovante.nomeArquivo) ext = '.' + comprovante.nomeArquivo.split('.').pop();
        
        link.download = (comprovante.nomeArquivo || 'comprovante_' + comprovante.tipoPagamento) ;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Funções auxiliares para visualizar comprovantes por tipo
    function verComprovanteFixa(id) {
        const key = getMesAnoKey();
        const item = financeiro.despesasFixasMes[key]?.find(d => String(d.id) === String(id));
        if (item?.comprovante) {
            verComprovante(item.comprovante);
        }
    }

    function verComprovanteVariavel(id) {
        const item = financeiro.despesasVariaveis.find(d => String(d.id) === String(id));
        if (item?.comprovante) {
            verComprovante(item.comprovante);
        }
    }

    function verComprovanteAvulsa(id) {
        const item = financeiro.despesasAvulsas.find(d => String(d.id) === String(id));
        if (item?.comprovante) {
            verComprovante(item.comprovante);
        }
    }

    function verComprovanteHistorico(emprestimoId, historicoIdx) {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(emprestimoId));
        if (emp?.historico?.[historicoIdx]?.comprovante) {
            verComprovante(emp.historico[historicoIdx].comprovante);
        }
    }

    function verComprovanteHistoricoArquivado(emprestimoId, historicoIdx) {
        // Busca tanto em ativos quanto em arquivados
        let emp = financeiro.emprestimos.find(e => String(e.id) === String(emprestimoId));
        if (!emp) {
            emp = financeiro.arquivados?.emprestimos?.find(e => String(e.id) === String(emprestimoId));
        }
        if (emp?.historico?.[historicoIdx]?.comprovante) {
            verComprovante(emp.historico[historicoIdx].comprovante);
        }
    }

    // ==========================================
    // MODAIS
    // ==========================================
    
    function abrirModal(id) {
        document.getElementById(id).classList.add('active');
    }

    function fecharModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    // ==========================================
    // MODAL DE CONFIRMAÇÃO (substitui confirm() nativo)
    // ==========================================
    let _confirmCallback = null;

    function confirmar(mensagem, callback, titulo = 'Confirmar exclusão', okLabel = 'Excluir', okColor = '#ff6b5b') {
        document.getElementById('modalConfirmMsg').textContent = mensagem;
        document.getElementById('modalConfirmTitle').textContent = titulo;
        const btn  = document.getElementById('modalConfirmOkBtn');
        const icon = document.getElementById('modalConfirmIcon');
        btn.textContent = okLabel;
        btn.style.background = okColor;
        // Ícone e cor conforme tipo
        if (okColor === '#5aa9f0') {
            icon.style.background = 'rgba(90,169,240,0.12)';
            icon.style.borderColor = 'rgba(90,169,240,0.25)';
            icon.style.color = '#5aa9f0';
            icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><polyline points="9 18 15 12 9 6"/><polyline points="15 18 21 12 15 6"/></svg>';
        } else if (okColor === '#e67e22') {
            icon.style.background = 'rgba(230,126,34,0.12)';
            icon.style.borderColor = 'rgba(230,126,34,0.25)';
            icon.style.color = '#e67e22';
            icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        } else if (okColor === '#4bc978' || okColor === '#5fe08a') {
            icon.style.background = 'rgba(95,224,138,0.12)';
            icon.style.borderColor = 'rgba(95,224,138,0.25)';
            icon.style.color = '#5fe08a';
            icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><polyline points="20 6 9 17 4 12"/></svg>';
        } else {
            icon.style.background = 'rgba(255,107,91,0.12)';
            icon.style.borderColor = 'rgba(255,107,91,0.25)';
            icon.style.color = '#ff6b5b';
            icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
        }
        _confirmCallback = callback;
        document.getElementById('modalConfirm').classList.add('active');
    }

    function confirmarResposta(ok) {
        document.getElementById('modalConfirm').classList.remove('active');
        if (_confirmCallback) {
            const cb = _confirmCallback;
            _confirmCallback = null;
            if (ok) cb();
        }
    }



    // Fechar modal ao clicar no X ou fora
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });
    });

    // ==========================================
    // RECOLHER SEÇÕES
    // ==========================================
    function toggleSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        section.classList.toggle('collapsed');
        // Persistir estado
        const colapsados = JSON.parse(localStorage.getItem('secoes_colapsadas') || '{}');
        colapsados[sectionId] = section.classList.contains('collapsed');
        localStorage.setItem('secoes_colapsadas', JSON.stringify(colapsados));
    }

    // Restaurar estado de seções recolhidas
    (function restaurarColapsados() {
        const colapsados = JSON.parse(localStorage.getItem('secoes_colapsadas') || '{}');
        Object.entries(colapsados).forEach(([id, collapsed]) => {
            if (collapsed) {
                const el = document.getElementById(id);
                if (el) el.classList.add('collapsed');
            }
        });
    })();

    // ==========================================
    // CATEGORIAS EDITÁVEIS
    // ==========================================
    const CATEGORIAS_DEFAULT = {
        receitaFixa: ['Salário', 'Pensão', 'Aluguel Recebido', 'Outros'],
        receitaVariavel: ['Freelance', 'Investimentos', 'Vendas', 'Bônus', 'Presente', 'Outros'],
        despesaFixa: ['Moradia', 'Internet', 'Energia', 'Água', 'Escola', 'Streaming', 'Plano de Saúde', 'Outros'],
        despesaVariavel: ['Alimentação', 'Transporte', 'Lazer', 'Compras', 'Saúde', 'Cartão', 'Outros'],
        emprestimo: ['Agiota', 'Banco', 'Financeira', 'Pessoa Física', 'Cartão', 'Outros'],
        despesaAvulsa: ['Alimentação', 'Transporte', 'Lazer', 'Compras', 'Saúde', 'Educação', 'Outros'],
        economia: ['Reserva', 'Poupança', 'Investimento', 'Objetivo', 'Viagem', 'Outros']
    };

    const CATEGORIAS_LABELS = {
        receitaFixa: 'Receitas Fixas',
        receitaVariavel: 'Receitas Variáveis',
        despesaFixa: 'Despesas Fixas',
        despesaVariavel: 'Despesas Parceladas',
        emprestimo: 'Empréstimos',
        despesaAvulsa: 'Despesas Variáveis',
        economia: 'Reservas / Economias'
    };

    function getCategorias(tipo) {
        const salvas = JSON.parse(localStorage.getItem('categorias_custom') || '{}');
        return salvas[tipo] || [...CATEGORIAS_DEFAULT[tipo]];
    }

    function setCategorias(tipo, lista) {
        const salvas = JSON.parse(localStorage.getItem('categorias_custom') || '{}');
        salvas[tipo] = lista;
        localStorage.setItem('categorias_custom', JSON.stringify(salvas));
    }

    let _categoriaModalTipo = null;
    let _categoriaModalLista = [];

    function abrirEditarCategorias(tipo) {
        _categoriaModalTipo = tipo;
        _categoriaModalLista = [...getCategorias(tipo)];
        document.getElementById('modalCategoriasTitle').textContent = 'Categorias — ' + (CATEGORIAS_LABELS[tipo] || tipo);
        renderCategoriasModal();
        document.getElementById('modalCategorias').classList.add('active');
    }

    function renderCategoriasModal() {
        const lista = document.getElementById('modalCategoriasLista');
        lista.innerHTML = _categoriaModalLista.map((cat, i) => `
            <span class="categoria-chip">
                ${cat}
                <button class="chip-remove" onclick="_categoriaModalLista.splice(${i},1);renderCategoriasModal();" title="Remover">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </span>
        `).join('');
    }

    function adicionarCategoriaModal() {
        const input = document.getElementById('novaCategoriaNome');
        const nome = input.value.trim();
        if (!nome) return;
        if (!_categoriaModalLista.includes(nome)) {
            _categoriaModalLista.push(nome);
            renderCategoriasModal();
        }
        input.value = '';
        input.focus();
    }

    function salvarCategoriasModal() {
        if (_categoriaModalTipo) {
            setCategorias(_categoriaModalTipo, _categoriaModalLista);
        }
        document.getElementById('modalCategorias').classList.remove('active');
        // Atualiza o formulário se aberto
        renderizarListas();
    }

    // ==========================================
    // FORMULÁRIOS DINÂMICOS
    // ==========================================
    
    function criarFormulario(tipo) {
        const configs = {
            receitaFixa: {
                campos: [
                    { id: 'receitaFixaDescricao', label: 'Descrição', type: 'text', placeholder: 'Ex: Salário' },
                    { id: 'receitaFixaValor', label: 'Valor', type: 'number', step: '0.01' },
                    { id: 'receitaFixaCategoria', label: 'Categoria', type: 'select', categoriaKey: 'receitaFixa' },
                    { id: 'receitaFixaDia', label: 'Dia Recebimento', type: 'number', min: 1, max: 31, placeholder: '5' }
                ]
            },
            receitaVariavel: {
                campos: [
                    { id: 'receitaVariavelDescricao', label: 'Descrição', type: 'text', placeholder: 'Ex: Freelance, Bônus' },
                    { id: 'receitaVariavelValor', label: 'Valor', type: 'number', step: '0.01' },
                    { id: 'receitaVariavelCategoria', label: 'Categoria', type: 'select', categoriaKey: 'receitaVariavel' },
                    { id: 'receitaVariavelData', label: 'Data', type: 'date' }
                ]
            },
            despesaFixa: {
                campos: [
                    { id: 'despesaFixaDescricao', label: 'Descrição', type: 'text', placeholder: 'Ex: Aluguel' },
                    { id: 'despesaFixaValor', label: 'Valor', type: 'number', step: '0.01' },
                    { id: 'despesaFixaCategoria', label: 'Categoria', type: 'select', categoriaKey: 'despesaFixa' },
                    { id: 'despesaFixaDia', label: 'Dia Vencimento', type: 'number', min: 1, max: 31, placeholder: '10' }
                ]
            },
            despesaVariavel: {
                campos: [
                    { id: 'despesaVariavelDescricao', label: 'Descrição', type: 'text', placeholder: 'Ex: Compra no cartão' },
                    { id: 'despesaVariavelValorTotal', label: 'Valor Total', type: 'number', step: '0.01', placeholder: 'Ex: 1800.00' },
                    { id: 'despesaVariavelCategoria', label: 'Categoria', type: 'select', categoriaKey: 'despesaVariavel' },
                    { id: 'despesaVariavelData', label: 'Data da 1ª Parcela', type: 'date' },
                    { id: 'despesaVariavelParcelado', label: 'Parcelado?', type: 'checkbox' },
                    { id: 'despesaVariavelTotalParcelas', label: 'Quantidade de Parcelas', type: 'number', min: '2', max: '48', placeholder: 'Ex: 12' }
                ]
            },
            emprestimo: {
                campos: [
                    { id: 'emprestimoDescricao', label: 'Credor / Descrição', type: 'text', placeholder: 'Ex: Banco X' },
                    { id: 'emprestimoPrincipal', label: 'Valor Principal (Saldo Devedor)', type: 'number', step: '0.01' },
                    { id: 'emprestimoJuros', label: 'Taxa Juros (% a.m.)', type: 'number', step: '0.1', placeholder: '10' },
                    { id: 'emprestimoCategoria', label: 'Categoria', type: 'select', categoriaKey: 'emprestimo' },
                    { id: 'emprestimoParcelado', label: 'Pagamento em Parcelas Fixas?', type: 'checkbox', toggleFn: 'toggleEmprestimoParcelasField' },
                    { id: 'emprestimoTotalParcelas', label: 'Total de Parcelas', type: 'number', min: '1', max: '600', placeholder: 'Ex: 48', togglesWith: 'emprestimoParcelado' },
                    { id: 'emprestimoParcelasPagas', label: 'Parcelas já Pagas', type: 'number', min: '0', placeholder: '0', togglesWith: 'emprestimoParcelado' },
                    { id: 'emprestimoValorParcela', label: 'Valor da Parcela', type: 'number', step: '0.01', placeholder: 'Ex: 500.00', togglesWith: 'emprestimoParcelado' },
                    { id: 'emprestimoDiaVencimento', label: 'Dia de Vencimento', type: 'number', min: '1', max: '31', placeholder: 'Ex: 10', togglesWith: 'emprestimoParcelado' }
                ]
            },
            despesaAvulsa: {
                campos: [
                    { id: 'despesaAvulsaDescricao', label: 'Descrição', type: 'text', placeholder: 'Ex: Farmácia, Uber, etc.' },
                    { id: 'despesaAvulsaValor', label: 'Valor', type: 'number', step: '0.01' },
                    { id: 'despesaAvulsaCategoria', label: 'Categoria', type: 'select', categoriaKey: 'despesaAvulsa' },
                    { id: 'despesaAvulsaData', label: 'Data', type: 'date' }
                ]
            },
            economia: {
                campos: [
                    { id: 'economiaDescricao', label: 'Nome da Reserva', type: 'text', placeholder: 'Ex: Reserva de emergência' },
                    { id: 'economiaValorInicial', label: 'Valor Inicial', type: 'number', step: '0.01', placeholder: '0.00' },
                    { id: 'economiaCategoria', label: 'Categoria', type: 'select', categoriaKey: 'economia' }
                ]
            }
        };

        const config = configs[tipo];
        if (!config) return '';

        let html = '<div class="form-row">';
        config.campos.forEach(campo => {
            if (campo.type === 'checkbox') {
                const toggleAttr = campo.toggleFn ? `${campo.toggleFn}('${campo.id}')` : 'toggleParcelasField()';
                html += `<div class="form-group form-group-checkbox">
                    <label class="checkbox-label">
                        <input type="checkbox" id="${campo.id}" onchange="${toggleAttr}">
                        <span>${campo.label}</span>
                    </label>
                </div>`;
            } else {
                const isParcelasField = campo.id.includes('TotalParcelas');
                const isValorTotal = campo.id.includes('ValorTotal');
                const togglesWithClass = campo.togglesWith ? ` toggle-${campo.togglesWith} hidden` : '';
                html += `<div class="form-group${isParcelasField ? ' parcelas-field hidden' : ''}${togglesWithClass}"><label style="display:flex;align-items:center;gap:4px;">${campo.label}`;
                if (campo.categoriaKey) {
                    html += `<button type="button" class="btn-edit-categorias" onclick="abrirEditarCategorias('${campo.categoriaKey}')" title="Editar categorias"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> editar</button>`;
                }
                html += `</label>`;
                if (campo.type === 'select' && campo.categoriaKey) {
                    const opts = getCategorias(campo.categoriaKey);
                    html += `<select id="${campo.id}"><option value="">Selecione...</option>`;
                    opts.forEach(opt => html += `<option value="${opt}">${opt}</option>`);
                    html += '</select>';
                } else if (campo.type === 'select' && campo.options) {
                    html += `<select id="${campo.id}"><option value="">Selecione...</option>`;
                    campo.options.forEach(opt => html += `<option value="${opt}">${opt}</option>`);
                    html += '</select>';
                } else {
                    const isDateField = campo.type === 'date';
                    const isParcelaData = campo.id === 'despesaVariavelData';
                    const isAvulsaData = campo.id === 'despesaAvulsaData';
                    const isReceitaVariavelData = campo.id === 'receitaVariavelData';

                    // Valor padrão para campos de data
                    let defaultValue = '';
                    if (isParcelaData) {
                        defaultValue = `${anoSelecionado}-${mesSelecionado}-01`;
                    } else if (isAvulsaData || isReceitaVariavelData) {
                        const hoje = new Date();
                        const diaHoje = String(hoje.getDate()).padStart(2, '0');
                        // Se o mês selecionado é o mês atual, usa dia de hoje; senão usa dia 1
                        const mesHoje = String(hoje.getMonth() + 1).padStart(2, '0');
                        const anoHoje = String(hoje.getFullYear());
                        if (mesSelecionado === mesHoje && String(anoSelecionado) === anoHoje) {
                            defaultValue = `${anoSelecionado}-${mesSelecionado}-${diaHoje}`;
                        } else {
                            defaultValue = `${anoSelecionado}-${mesSelecionado}-01`;
                        }
                    }

                    html += `<input type="${campo.type}" id="${campo.id}"`;
                    if (campo.step) html += ` step="${campo.step}"`;
                    if (campo.min) html += ` min="${campo.min}"`;
                    if (campo.max) html += ` max="${campo.max}"`;
                    if (campo.placeholder) html += ` placeholder="${campo.placeholder}"`;
                    if (defaultValue) html += ` value="${defaultValue}"`;
                    if (isParcelasField || isValorTotal) {
                        html += ` oninput="atualizarPreviewParcelas()"`;
                    }
                    html += '>';

                    // Hint para campos de data — pode ser qualquer mês
                    if (isParcelaData) {
                        html += `<span style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:4px;display:flex;align-items:center;gap:3px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Pode ser em qualquer mês — as parcelas serão distribuídas a partir desta data</span>`;
                    } else if (isAvulsaData) {
                        html += `<span style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:4px;display:flex;align-items:center;gap:3px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Pode ser em qualquer mês — aparecerá no mês correspondente</span>`;
                    }
                }
                html += '</div>';
            }
        });
        html += '</div>';

        // Para despesas parceladas, adicionar barra de resumo + botões no TOPO (sticky)
        if (tipo === 'despesaVariavel') {
            const salvarFn = `salvar${tipo.charAt(0).toUpperCase() + tipo.slice(1)}()`;
            const topBar = `
                <div class="form-top-summary" id="formTopSummary" style="display:none;">
                    <div class="form-top-summary-valores">
                        <div class="form-top-summary-item">
                            <span class="form-top-summary-label">Soma das parcelas:</span>
                            <span class="form-top-summary-valor" id="somaParcelasTop">R$ 0,00</span>
                        </div>
                        <div class="form-top-summary-item">
                            <span class="form-top-summary-label">Valor total:</span>
                            <span class="form-top-summary-valor" id="valorTotalTop">R$ 0,00</span>
                        </div>
                        <div class="form-top-summary-status" id="statusTop"></div>
                    </div>
                    <div class="form-top-summary-actions">
                        <button class="btn-cancelar" onclick="esconderForm('${tipo}')">Cancelar</button>
                        <button class="btn-salvar" onclick="${salvarFn}">Salvar</button>
                    </div>
                </div>
            `;
            // Inserir no início do html
            html = topBar + html;
        }

        html += `<div class="form-buttons">
            <button class="btn-cancelar" onclick="esconderForm('${tipo}')">Cancelar</button>
            <button class="btn-salvar" onclick="salvar${tipo.charAt(0).toUpperCase() + tipo.slice(1)}()">Salvar</button>
        </div>`;
        
        return html;
    }

    function toggleParcelasField() {
        const checkbox = document.getElementById('despesaVariavelParcelado');
        const parcelasField = document.querySelector('.parcelas-field');
        const previewContainer = document.getElementById('parcelasPreview');
        
        if (parcelasField) {
            if (checkbox && checkbox.checked) {
                parcelasField.classList.remove('hidden');
                // Adicionar preview se não existir
                if (!previewContainer) {
                    const formRow = parcelasField.closest('.form-row');
                    const previewDiv = document.createElement('div');
                    previewDiv.id = 'parcelasPreview';
                    previewDiv.className = 'parcelas-preview';
                    previewDiv.style.display = 'none';
                    formRow.after(previewDiv);
                }
                atualizarPreviewParcelas();
            } else {
                parcelasField.classList.add('hidden');
                const input = parcelasField.querySelector('input');
                if (input) input.value = '';
                if (previewContainer) previewContainer.style.display = 'none';
            }
        }
    }

    // Toggle genérico: mostra/esconde todos os elementos com a classe
    // "toggle-<checkboxId>" de acordo com o estado do checkbox.
    // Usado pelo "Pagamento em Parcelas Fixas?" do formulário de Empréstimo
    // (e pelo mesmo bloco no modal de edição de empréstimo).
    function toggleEmprestimoParcelasField(checkboxId) {
        const checkbox = document.getElementById(checkboxId);
        const mostrar = !!(checkbox && checkbox.checked);
        document.querySelectorAll('.toggle-' + checkboxId).forEach(el => {
            el.classList.toggle('hidden', !mostrar);
        });
    }

    // Atualizar preview das parcelas em tempo real
    function atualizarPreviewParcelas() {
        const valorTotalInput = document.getElementById('despesaVariavelValorTotal');
        const totalParcelasInput = document.getElementById('despesaVariavelTotalParcelas');
        const previewContainer = document.getElementById('parcelasPreview');
        
        if (!previewContainer) return;
        
        const valorTotal = parseFloat(valorTotalInput?.value) || 0;
        const totalParcelas = parseInt(totalParcelasInput?.value) || 0;
        
        if (valorTotal <= 0 || totalParcelas < 2) {
            previewContainer.style.display = 'none';
            return;
        }
        
        // Inicializar valores personalizados se necessário
        if (!window.parcelasPersonalizadas || window.parcelasPersonalizadas.length !== totalParcelas) {
            window.parcelasPersonalizadas = calcularParcelas(valorTotal, totalParcelas);
        }
        
        let html = '<div class="preview-header">Valores das parcelas (editável):</div>';
        html += '<div class="preview-list-editable">';
        window.parcelasPersonalizadas.forEach((valor, idx) => {
            html += `
                <div class="preview-item-editable">
                    <span class="parcela-num">${idx + 1}/${totalParcelas}</span>
                    <input type="number" 
                           class="parcela-valor-input-novo" 
                           value="${valor.toFixed(2)}" 
                           step="0.01" 
                           min="0"
                           onchange="atualizarValorParcelaNovo(${idx}, this.value)"
                           oninput="atualizarSomaParcelasNovo()">
                </div>
            `;
        });
        html += '</div>';
        
        const somaAtual = window.parcelasPersonalizadas.reduce((s, v) => s + v, 0);
        const diferenca = valorTotal - somaAtual;
        const statusClass = Math.abs(diferenca) < 0.01 ? 'ok' : 'erro';
        
        html += `
            <div class="preview-soma ${statusClass}">
                <div class="soma-linha">
                    <span>Soma das parcelas:</span>
                    <span id="somaParcelasNovo">${formatarMoeda(somaAtual)}</span>
                </div>
                <div class="soma-linha">
                    <span>Valor total:</span>
                    <span>${formatarMoeda(valorTotal)}</span>
                </div>
                ${Math.abs(diferenca) >= 0.01 ? `
                    <div class="soma-diferenca">
                        Diferença: ${formatarMoeda(diferenca)} 
                        <button type="button" class="btn-ajustar" onclick="ajustarUltimaParcelaNovo()">Ajustar última</button>
                    </div>
                ` : '<div class="soma-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:2px"><polyline points="20 6 9 12 4 12"/><polyline points="20 6 9 20 4 12"/></svg> Valores corretos</div>'}
            </div>
        `;
        
        previewContainer.innerHTML = html;
        previewContainer.style.display = 'block';

        // Atualizar barra de resumo no topo
        atualizarTopSummary(somaAtual, valorTotal, diferenca);
    }

    function atualizarTopSummary(soma, total, diferenca) {
        const topBar = document.getElementById('formTopSummary');
        const somaTopEl = document.getElementById('somaParcelasTop');
        const totalTopEl = document.getElementById('valorTotalTop');
        const statusEl = document.getElementById('statusTop');
        if (!topBar) return;
        topBar.style.display = 'flex';
        if (somaTopEl) somaTopEl.textContent = formatarMoeda(soma);
        if (totalTopEl) totalTopEl.textContent = formatarMoeda(total);
        if (statusEl) {
            if (Math.abs(diferenca) < 0.01) {
                statusEl.innerHTML = '<span class="soma-ok" style="font-size:12px;color:#5fe08a;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:2px"><polyline points="20 6 9 12 4 12"/><polyline points="20 6 9 20 4 12"/></svg> Valores corretos</span>';
                if (somaTopEl) { somaTopEl.style.color = '#5fe08a'; }
            } else {
                statusEl.innerHTML = `<span style="color:#ff6b5b;font-size:12px;">Diferença: ${formatarMoeda(diferenca)}</span>`;
                if (somaTopEl) { somaTopEl.style.color = '#ff6b5b'; }
            }
        }
    }
    
    // Funções para criação de novas parcelas
    function atualizarValorParcelaNovo(index, valor) {
        if (!window.parcelasPersonalizadas) return;
        window.parcelasPersonalizadas[index] = parseFloat(valor) || 0;
        atualizarSomaParcelasNovo();
    }
    
    function atualizarSomaParcelasNovo() {
        if (!window.parcelasPersonalizadas) return;
        
        const valorTotal = parseFloat(document.getElementById('despesaVariavelValorTotal')?.value) || 0;
        
        const inputs = document.querySelectorAll('.parcela-valor-input-novo');
        let somaAtual = 0;
        inputs.forEach((input, idx) => {
            const val = parseFloat(input.value) || 0;
            window.parcelasPersonalizadas[idx] = val;
            somaAtual += val;
        });
        
        const somaEl = document.getElementById('somaParcelasNovo');
        if (somaEl) somaEl.textContent = formatarMoeda(somaAtual);
        
        const diferenca = valorTotal - somaAtual;
        const previewSoma = document.querySelector('#parcelasPreview .preview-soma');
        if (previewSoma) {
            previewSoma.className = 'preview-soma ' + (Math.abs(diferenca) < 0.01 ? 'ok' : 'erro');
        }
        atualizarTopSummary(somaAtual, valorTotal, diferenca);
    }
    
    function ajustarUltimaParcelaNovo() {
        if (!window.parcelasPersonalizadas || window.parcelasPersonalizadas.length === 0) return;
        
        const valorTotal = parseFloat(document.getElementById('despesaVariavelValorTotal')?.value) || 0;
        const somaExcetoUltima = window.parcelasPersonalizadas.slice(0, -1).reduce((s, v) => s + v, 0);
        const ultimaParcela = Math.round((valorTotal - somaExcetoUltima) * 100) / 100;
        
        const ultimoIndex = window.parcelasPersonalizadas.length - 1;
        window.parcelasPersonalizadas[ultimoIndex] = ultimaParcela;
        
        const inputs = document.querySelectorAll('.parcela-valor-input-novo');
        if (inputs[ultimoIndex]) {
            inputs[ultimoIndex].value = ultimaParcela.toFixed(2);
        }
        
        atualizarSomaParcelasNovo();
        atualizarPreviewParcelas();
    }

    // Calcular distribuição das parcelas
    function calcularParcelas(valorTotal, totalParcelas) {
        if (totalParcelas <= 0) return [];
        if (totalParcelas === 1) return [valorTotal];
        
        // Calcula valor base (arredondado para 2 casas)
        const valorBase = Math.floor((valorTotal / totalParcelas) * 100) / 100;
        
        // Array de parcelas
        const parcelas = [];
        let somaAcumulada = 0;
        
        for (let i = 0; i < totalParcelas - 1; i++) {
            parcelas.push(valorBase);
            somaAcumulada += valorBase;
        }
        
        // Última parcela ajusta a diferença
        const ultimaParcela = Math.round((valorTotal - somaAcumulada) * 100) / 100;
        parcelas.push(ultimaParcela);
        
        return parcelas;
    }

    function mostrarForm(tipo) {
        const container = document.getElementById('form' + tipo.charAt(0).toUpperCase() + tipo.slice(1));
        if (!container.innerHTML.trim()) {
            container.innerHTML = criarFormulario(tipo);
        }
        container.classList.add('active');
        
        // Preencher data atual
        const dataInput = document.getElementById(tipo + 'Data');
        if (dataInput) dataInput.value = new Date().toISOString().split('T')[0];
    }

    function esconderForm(tipo) {
        const container = document.getElementById('form' + tipo.charAt(0).toUpperCase() + tipo.slice(1));
        container.classList.remove('active');
        container.querySelectorAll('input').forEach(i => i.value = '');
        container.querySelectorAll('select').forEach(s => s.value = '');
        
        // Limpar valores personalizados de parcelas
        if (tipo === 'despesaVariavel') {
            window.parcelasPersonalizadas = null;
            const preview = document.getElementById('parcelasPreview');
            if (preview) preview.style.display = 'none';
        }
    }

    // Event listeners dos botões
    document.getElementById('btnAddReceitaFixa').onclick = () => mostrarForm('receitaFixa');
    document.getElementById('btnAddReceitaVariavel').onclick = () => mostrarForm('receitaVariavel');
    document.getElementById('btnAddDespesaFixa').onclick = () => mostrarForm('despesaFixa');
    document.getElementById('btnAddDespesaVariavel').onclick = () => mostrarForm('despesaVariavel');
    document.getElementById('btnAddDespesaAvulsa').onclick = () => mostrarForm('despesaAvulsa');
    document.getElementById('btnAddEmprestimo').onclick = () => mostrarForm('emprestimo');
    document.getElementById('btnAddEconomia').onclick = () => mostrarForm('economia');

    // ==========================================
    // RECEITAS (com suporte a recorrentes)
    // ==========================================
    
    function salvarReceitaFixa() {
        const desc = document.getElementById('receitaFixaDescricao').value.trim();
        const valor = parseFloat(document.getElementById('receitaFixaValor').value) || 0;
        const cat = document.getElementById('receitaFixaCategoria').value || 'Outros';
        const dia = parseInt(document.getElementById('receitaFixaDia').value) || 5;
        
        if (!desc || !valor) { mostrarStatus('Preencha descrição e valor!', 'error'); return; };
        
        // Criar receita recorrente (modelo)
        // mesInicio = mês atual selecionado — só gera instâncias daqui em diante
        financeiro.receitasFixas.push({
            id: gerarId(),
            descricao: desc,
            valor: valor,
            categoria: cat,
            diaRecebimento: dia,
            ativa: true,
            mesInicio: getMesAnoKey(),
            criadoEm: new Date().toISOString()
        });
        gerarInstanciasReceitas();
        
        salvarDados();
        esconderForm('receitaFixa');
        renderizar();
    }

    function salvarReceitaVariavel() {
        const desc = document.getElementById('receitaVariavelDescricao').value.trim();
        const valor = parseFloat(document.getElementById('receitaVariavelValor').value) || 0;
        const cat = document.getElementById('receitaVariavelCategoria').value || 'Outros';
        let data = document.getElementById('receitaVariavelData').value;
        
        if (!desc || !valor) { mostrarStatus('Preencha descrição e valor!', 'error'); return; };
        
        if (!data) {
            const hoje = new Date();
            const mesHoje = String(hoje.getMonth() + 1).padStart(2, '0');
            const anoHoje = String(hoje.getFullYear());
            if (mesSelecionado === mesHoje && String(anoSelecionado) === anoHoje) {
                data = `${anoSelecionado}-${mesSelecionado}-${String(hoje.getDate()).padStart(2, '0')}`;
            } else {
                data = `${anoSelecionado}-${mesSelecionado}-01`;
            }
        }
        
        financeiro.receitasAvulsas.push({
            id: gerarId(),
            descricao: desc,
            valor: valor,
            categoria: cat,
            data: data,
            recebido: false
        });
        
        salvarDados();
        esconderForm('receitaVariavel');
        renderizar();
    }

    function getDataRecebimento(dia) {
        const ano = anoSelecionado;
        const mes = mesSelecionado;
        const ultimoDia = new Date(ano, parseInt(mes), 0).getDate();
        const diaReal = Math.min(dia, ultimoDia);
        return `${ano}-${mes}-${String(diaReal).padStart(2, '0')}`;
    }

    function gerarInstanciasReceitas() {
        const key = getMesAnoKey();
        if (!financeiro.receitasMes[key]) {
            financeiro.receitasMes[key] = [];
        }

        // DATA LIMITE: Só gerar receitas a partir de Janeiro/2026
        if (key < '2026-01') {
            return;
        }

        // Gerar instâncias para o mês atual
        financeiro.receitasFixas.filter(rf => rf.ativa).forEach(modelo => {
            // Só gerar se o mês atual é >= mesInicio do modelo
            const mesInicio = modelo.mesInicio || '2026-01';
            if (key < mesInicio) return;

            const jaExiste = financeiro.receitasMes[key].some(r => r.modeloId === modelo.id);
            if (!jaExiste) {
                financeiro.receitasMes[key].push({
                    id: gerarId(),
                    modeloId: modelo.id,
                    descricao: modelo.descricao,
                    valor: modelo.valor,
                    categoria: modelo.categoria,
                    data: getDataRecebimento(modelo.diaRecebimento),
                    recebido: false,
                    recorrente: true
                });
            }
        });

        salvarDados();
    }

    function getReceitasMes() {
        const key = getMesAnoKey();
        // Combina receitas antigas (do array receitas) + novas (do objeto receitasMes)
        const receitasAntigas = (financeiro.receitas || []).filter(r => r.data?.startsWith(key));
        const receitasNovas = financeiro.receitasMes[key] || [];
        return [...receitasAntigas, ...receitasNovas];
    }

    function getReceitasFixasMes() {
        const key = getMesAnoKey();
        return (financeiro.receitasMes[key] || []).filter(r => r.recorrente);
    }

    function getReceitasVariaveisMes() {
        return filtrarPorMes(financeiro.receitasAvulsas);
    }

    function toggleRecebido(id, btn) {
        id = Number(id);
        // Feedback instantâneo
        if (btn) {
            const vaiReceber = btn.textContent.trim() === 'RECEBER';
            btn.textContent = vaiReceber ? 'RECEBIDO' : 'RECEBER';
            btn.style.background = vaiReceber ? '#5fe08a' : 'transparent';
            btn.style.color = vaiReceber ? '#0a0a0a' : '#5fe08a';
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => { btn.style.transform = ''; }, 150);
        }
        let item = financeiro.receitas.find(r => Number(r.id) === id);
        if (item) { item.recebido = !item.recebido; salvarDados(); setTimeout(() => renderizar(), 300); return; }
        for (const key of Object.keys(financeiro.receitasMes || {})) {
            item = (financeiro.receitasMes[key] || []).find(r => Number(r.id) === id);
            if (item) { item.recebido = !item.recebido; salvarDados(); setTimeout(() => renderizar(), 300); return; }
        }
        item = financeiro.receitasAvulsas.find(r => Number(r.id) === id);
        if (item) { item.recebido = !item.recebido; salvarDados(); setTimeout(() => renderizar(), 300); }
    }

    function deletarReceita(id) {
        id = Number(id);

        // 1. Receitas legado (array antigo)
        let idx = financeiro.receitas.findIndex(r => Number(r.id) === id);
        if (idx !== -1) {
            confirmar('Excluir esta receita permanentemente?', () => {
                financeiro.receitas.splice(idx, 1);
                salvarDados(); renderizar();
            });
            return;
        }

        // 2. Buscar em receitasMes para achar o modeloId
        let modeloId = null;
        let receitaEncontrada = null;
        for (const key of Object.keys(financeiro.receitasMes || {})) {
            const encontrada = (financeiro.receitasMes[key] || []).find(r => Number(r.id) === id);
            if (encontrada) { receitaEncontrada = encontrada; modeloId = encontrada.modeloId; break; }
        }

        if (receitaEncontrada) {
            if (modeloId) {
                // É recorrente — apagar modelo + todas as instâncias futuras e passadas
                confirmar(
                    `Excluir a receita "${receitaEncontrada.descricao}" de TODOS os meses?`,
                    () => {
                        // Desativar modelo
                        const modelo = financeiro.receitasFixas.find(rf => Number(rf.id) === Number(modeloId));
                        if (modelo) modelo.ativa = false;
                        // Remover instâncias de TODOS os meses
                        Object.keys(financeiro.receitasMes || {}).forEach(k => {
                            financeiro.receitasMes[k] = (financeiro.receitasMes[k] || [])
                                .filter(r => Number(r.modeloId) !== Number(modeloId));
                        });
                        salvarDados(); renderizar();
                        mostrarStatus('Receita removida de todos os meses', 'success');
                    }
                );
            } else {
                // Receita avulsa dentro do receitasMes
                confirmar(`Excluir esta receita?`, () => {
                    Object.keys(financeiro.receitasMes || {}).forEach(k => {
                        financeiro.receitasMes[k] = (financeiro.receitasMes[k] || [])
                            .filter(r => Number(r.id) !== id);
                    });
                    salvarDados(); renderizar();
                });
            }
            return;
        }

        // 3. receitasAvulsas
        idx = financeiro.receitasAvulsas.findIndex(r => Number(r.id) === id);
        if (idx !== -1) {
            confirmar('Excluir esta receita variável?', () => {
                financeiro.receitasAvulsas.splice(idx, 1);
                salvarDados(); renderizar();
            });
            return;
        }

        console.warn('deletarReceita: id não encontrado:', id);
    }

    function encerrarReceitaRecorrente(modeloId) {
        const modelo = financeiro.receitasFixas.find(rf => String(rf.id) === String(modeloId));
        if (!modelo) return;
        confirmar(`Encerrar receita recorrente "${modelo.descricao}"? Ela deixará de aparecer nos próximos meses.`, () => {
            modelo.ativa = false;
            const keyAtual = getMesAnoKey();
            Object.keys(financeiro.receitasMes).forEach(key => {
                if (key > keyAtual)
                    financeiro.receitasMes[key] = (financeiro.receitasMes[key] || []).filter(r => r.modeloId !== modeloId);
            });
            salvarDados(); renderizar();
            mostrarStatus('Receita recorrente encerrada', 'success');
        }, 'Encerrar Receita', 'Encerrar', '#e67e22');
    }

    function arquivarReceita(id) {
        // Procurar nas receitas antigas
        let idx = financeiro.receitas.findIndex(r => String(r.id) === String(id));
        if (idx !== -1) {
            const item = financeiro.receitas.splice(idx, 1)[0];
            financeiro.arquivados.receitas.push(item);
            salvarDados();
            renderizar();
            return;
        }
        
        // Procurar nas receitas do mês
        const key = getMesAnoKey();
        idx = (financeiro.receitasMes[key] || []).findIndex(r => String(r.id) === String(id));
        if (idx !== -1) {
            const item = financeiro.receitasMes[key].splice(idx, 1)[0];
            financeiro.arquivados.receitas.push(item);
            salvarDados();
            renderizar();
        }
    }

    function editarReceita(id) {
        id = Number(id);
        let item = financeiro.receitas.find(r => Number(r.id) === id);
        let isNovoSistema = false;
        let isAvulsa = false;

        if (!item) {
            // Buscar em TODOS os meses
            for (const key of Object.keys(financeiro.receitasMes || {})) {
                item = (financeiro.receitasMes[key] || []).find(r => Number(r.id) === id);
                if (item) break;
            }
            isNovoSistema = true;
        }
        if (!item) {
            item = financeiro.receitasAvulsas.find(r => Number(r.id) === id);
            isAvulsa = true;
            isNovoSistema = false;
        }
        if (!item) { console.warn('editarReceita: id não encontrado:', id); return; }

        itemEditando = { tipo: 'receita', id: id, isNovoSistema: isNovoSistema, isAvulsa: isAvulsa };
        
        const body = document.getElementById('modalEditarBody');
        body.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Descrição</label>
                    <input type="text" id="editDescricao" value="${item.descricao}">
                </div>
                <div class="form-group">
                    <label>Valor</label>
                    <input type="number" id="editValor" step="0.01" value="${item.valor}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Categoria</label>
                    <input type="text" id="editCategoria" value="${item.categoria}">
                </div>
                <div class="form-group">
                    <label>Data</label>
                    <input type="date" id="editData" value="${item.data}">
                </div>
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                <button class="btn-salvar" onclick="salvarEdicaoReceita()">Salvar</button>
            </div>
        `;
        document.querySelector('#modalEditar .modal-header h3').textContent = 'Editar Receita';
        abrirModal('modalEditar');
    }

    function salvarEdicaoReceita() {
        let item = null;
        const eid = Number(itemEditando.id);

        if (itemEditando.isAvulsa) {
            item = financeiro.receitasAvulsas.find(r => Number(r.id) === eid);
        } else if (itemEditando.isNovoSistema) {
            // Buscar em todos os meses
            for (const key of Object.keys(financeiro.receitasMes || {})) {
                item = (financeiro.receitasMes[key] || []).find(r => Number(r.id) === eid);
                if (item) break;
            }
        } else {
            item = financeiro.receitas.find(r => Number(r.id) === eid);
        }
        
        if (item) {
            item.descricao = document.getElementById('editDescricao').value.trim();
            item.valor = parseFloat(document.getElementById('editValor').value) || item.valor;
            item.categoria = document.getElementById('editCategoria').value;
            item.data = document.getElementById('editData').value;
            salvarDados();
        }
        fecharModal('modalEditar');
        renderizar();
    }

    // ==========================================
    // DESPESAS FIXAS (RECORRÊNCIA REAL)
    // ==========================================
    
    function salvarDespesaFixa() {
        const desc = document.getElementById('despesaFixaDescricao').value.trim();
        const valor = parseFloat(document.getElementById('despesaFixaValor').value) || 0;
        const cat = document.getElementById('despesaFixaCategoria').value || 'Outros';
        const dia = parseInt(document.getElementById('despesaFixaDia').value) || 10;
        
        if (!desc || !valor) { mostrarStatus('Preencha todos os campos!', 'error'); return; };
        
        // Criar modelo de despesa recorrente
        financeiro.despesasFixas.push({
            id: gerarId(),
            descricao: desc,
            valor: valor,
            categoria: cat,
            diaVencimento: dia,
            ativa: true,
            criadaEm: new Date().toISOString()
        });
        
        salvarDados();
        gerarInstanciasDespesasFixas();
        esconderForm('despesaFixa');
        renderizar();
    }

    // Gera instâncias mensais das despesas fixas ativas
    function gerarInstanciasDespesasFixas() {
        const key = getMesAnoKey();
        
        // SÓ PROCESSAR MESES DE 2026 EM DIANTE
        if (key < '2026-01') {
            return;
        }
        
        if (!financeiro.despesasFixasMes[key]) {
            financeiro.despesasFixasMes[key] = [];
        }

        // Gerar instâncias NOVAS para o mês atual
        financeiro.despesasFixas.filter(df => df.ativa).forEach(modelo => {
            // Verificar se já existe qualquer instância para este modelo neste mês
            // (inclui atrasadas para evitar duplicação quando despesa foi adiada do mês anterior)
            const jaExiste = financeiro.despesasFixasMes[key].some(d => String(d.modeloId) === String(modelo.id));
            if (!jaExiste) {
                financeiro.despesasFixasMes[key].push({
                    id: gerarId(),
                    modeloId: modelo.id,
                    descricao: modelo.descricao,
                    valor: modelo.valor,
                    categoria: modelo.categoria,
                    data: getDataVencimento(modelo.diaVencimento),
                    pago: false,
                    dataPagamento: null,
                    comprovante: null,
                    atrasada: false
                });
            }
        });

        // LIMPAR instâncias atrasadas cujo original já foi pago
        financeiro.despesasFixasMes[key] = financeiro.despesasFixasMes[key].filter(d => {
            if (d.atrasada && d.idOriginal && d.mesOriginal) {
                const original = (financeiro.despesasFixasMes[d.mesOriginal] || []).find(o => String(o.id) === String(d.idOriginal));
                // Se o original foi pago, remover a instância atrasada (a menos que esta também já tenha sido paga)
                if (original && original.pago && !d.pago) {
                    return false;
                }
            }
            return true;
        });

        // OBS: despesas fixas não pagas NÃO são mais clonadas para o mês
        // seguinte como "instância atrasada". Uma conta de Maio não paga
        // continua existindo em despesasFixasMes['2026-05'] e, ao navegar
        // até lá, aparece com o badge "Vencido" (calculado por
        // getStatusVencimento a partir da própria data de vencimento).
        // Isso evita duplicar a mesma conta em dois meses ao mesmo tempo.
        // O código de leitura de instâncias "atrasada"/"mesOriginal" abaixo
        // é mantido apenas para compatibilidade com dados já salvos
        // anteriormente a esta mudança.

        salvarDados();
    }


    // ── Adiar despesa atrasada para o mês seguinte ──
    function adiarDespesaAtrasada(id, mesOrigem) {
        const arr = financeiro.despesasFixasMes[mesOrigem] || [];
        const idx = arr.findIndex(d => String(d.id) === String(id));
        if (idx === -1) return;

        const desp = arr[idx];
        if (desp.pago) { mostrarStatus('Despesa já paga.', 'error'); return; }

        const hoje = new Date();
        const proxMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
        const keyProx = proxMes.getFullYear() + '-' + String(proxMes.getMonth() + 1).padStart(2,'0');
        const nomeMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][proxMes.getMonth()];

        confirmar(
            `Adiar "${desp.descricao}" (${formatarMoeda(desp.valor)}) para ${nomeMes}/${proxMes.getFullYear()}?`,
            () => {
                arr.splice(idx, 1);
                financeiro.despesasFixasMes[mesOrigem] = arr;

                if (!financeiro.despesasFixasMes[keyProx]) financeiro.despesasFixasMes[keyProx] = [];

                const jaExiste = financeiro.despesasFixasMes[keyProx].some(
                    d => String(d.modeloId) === String(desp.modeloId) && !d.atrasada
                );

                if (jaExiste) {
                    mostrarStatus(`"${desp.descricao}" removida de ${mesOrigem} — já existe em ${keyProx}.`, 'success');
                } else {
                    const modelo = financeiro.despesasFixas.find(df => String(df.id) === String(desp.modeloId));
                    const diaVenc = modelo ? (modelo.diaVencimento || modelo.dia || 1) : 1;
                    financeiro.despesasFixasMes[keyProx].push({
                        ...desp,
                        id: gerarId(),
                        data: `${keyProx}-${String(diaVenc).padStart(2,'0')}`,
                        dia: diaVenc,
                        pago: false,
                        atrasada: false,
                        mesOrigem: mesOrigem,
                    });
                    mostrarStatus(`"${desp.descricao}" adiada para ${nomeMes}/${proxMes.getFullYear()}.`, 'success');
                }
                salvarDados();
                renderizar();
            },
            'Adiar Despesa', 'Adiar', '#5aa9f0'
        );
    }

    function getDespesasFixasMes() {
        const key = getMesAnoKey();
        if (key < '2026-01') return [];
        const despesas = financeiro.despesasFixasMes[key] || [];
        return despesas.filter(d => {
            const modelo = financeiro.despesasFixas.find(df => String(df.id) === String(d.modeloId));
            return modelo && modelo.ativa !== false;
        });
    }
    // Função para editar valor de uma instância de despesa fixa (ex: adicionar juros)
    function editarValorInstancia(id, tipo) {
        const key = getMesAnoKey();
        let item = null;
        
        if (tipo === 'fixa') {
            // Procurar em todas as chaves de mês
            for (const k of Object.keys(financeiro.despesasFixasMes)) {
                const found = financeiro.despesasFixasMes[k]?.find(d => String(d.id) === String(id));
                if (found) {
                    item = found;
                    break;
                }
            }
        }
        
        if (!item) return;

        const valorAtual = item.valor;
        const modelo = financeiro.despesasFixas.find(df => String(df.id) === String(item.modeloId));
        const valorOriginal = modelo ? modelo.valor : valorAtual;
        const diferenca = valorAtual - valorOriginal;

        const body = document.getElementById('modalEditarBody');
        body.innerHTML = `
            <div class="info-box" style="background:rgba(95,224,138,0.08);border-color:rgba(95,224,138,0.3)">
                Este valor vale <strong>só para este mês</strong>. Os outros meses (passados e futuros) não são alterados.
            </div>
            <div class="info-box">
                <strong>${item.descricao}</strong><br>
                <small>Valor padrão: ${formatarMoeda(valorOriginal)}</small>
                ${diferenca !== 0 ? `<br><small style="color: ${diferenca > 0 ? '#ff6b5b' : '#5fe08a'};">Diferença atual: ${diferenca > 0 ? '+' : ''}${formatarMoeda(diferenca)}</small>` : ''}
            </div>
            <div class="form-group">
                <label>Novo Valor (apenas para este mês)</label>
                <input type="number" id="novoValorInstancia" value="${valorAtual.toFixed(2)}" step="0.01" min="0">
            </div>
            <div class="form-group">
                <label>Motivo (opcional)</label>
                <input type="text" id="motivoAlteracao" placeholder="Ex: Conta de água/luz veio mais cara este mês" value="${item.motivoAlteracao || ''}">
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                <button class="btn-secondary" onclick="resetarValorInstancia(${id})">Resetar para o Padrão</button>
                <button class="btn-salvar" onclick="salvarValorInstancia(${id})">Salvar</button>
            </div>
        `;
        document.querySelector('#modalEditar .modal-header h3').textContent = 'Editar Valor (só este mês)';
        abrirModal('modalEditar');
    }

    function salvarValorInstancia(id) {
        const novoValor = parseFloat(document.getElementById('novoValorInstancia').value);
        const motivo = document.getElementById('motivoAlteracao').value;
        
        if (isNaN(novoValor) || novoValor < 0) {
            mostrarStatus('Valor inválido!', 'error');
            return;
        }

        // Procurar o item em todas as chaves de mês
        for (const k of Object.keys(financeiro.despesasFixasMes)) {
            const item = financeiro.despesasFixasMes[k]?.find(d => String(d.id) === String(id));
            if (item) {
                item.valor = novoValor;
                item.motivoAlteracao = motivo;
                item.valorAlterado = true;
                break;
            }
        }

        salvarDados();
        fecharModal('modalEditar');
        renderizar();
    }

    function resetarValorInstancia(id) {
        for (const k of Object.keys(financeiro.despesasFixasMes)) {
            const item = financeiro.despesasFixasMes[k]?.find(d => String(d.id) === String(id));
            if (item) {
                const modelo = financeiro.despesasFixas.find(df => String(df.id) === String(item.modeloId));
                if (modelo) {
                    item.valor = modelo.valor;
                    item.motivoAlteracao = null;
                    item.valorAlterado = false;
                }
                break;
            }
        }
        salvarDados();
        fecharModal('modalEditar');
        renderizar();
    }

    // Função para editar valor de uma parcela
    function editarValorParcela(id) {
        const item = financeiro.despesasVariaveis.find(d => String(d.id) === String(id));
        if (!item) return;

        const body = document.getElementById('modalEditarBody');
        body.innerHTML = `
            <div class="info-box">
                <strong>${item.descricao}</strong><br>
                <small>Parcela ${item.parcelaAtual}/${item.totalParcelas}</small>
            </div>
            <div class="form-group">
                <label>Novo Valor (apenas para esta parcela)</label>
                <input type="number" id="novoValorParcela" value="${item.valor.toFixed(2)}" step="0.01" min="0">
            </div>
            <div class="form-group">
                <label>Motivo (opcional)</label>
                <input type="text" id="motivoAlteracaoParcela" placeholder="Ex: Juros de atraso, multa, etc." value="${item.motivoAlteracao || ''}">
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                <button class="btn-salvar" onclick="salvarValorParcela(${id})">Salvar</button>
            </div>
        `;
        document.querySelector('#modalEditar .modal-header h3').textContent = 'Editar Valor da Parcela';
        abrirModal('modalEditar');
    }

    function salvarValorParcela(id) {
        const novoValor = parseFloat(document.getElementById('novoValorParcela').value);
        const motivo = document.getElementById('motivoAlteracaoParcela').value;
        
        if (isNaN(novoValor) || novoValor < 0) {
            mostrarStatus('Valor inválido!', 'error');
            return;
        }

        const item = financeiro.despesasVariaveis.find(d => String(d.id) === String(id));
        if (item) {
            item.valor = novoValor;
            item.motivoAlteracao = motivo;
        }

        salvarDados();
        fecharModal('modalEditar');
        renderizar();
    }

    function togglePagoFixa(id) {
        const key = getMesAnoKey();
        const item = financeiro.despesasFixasMes[key]?.find(d => String(d.id) === String(id));
        if (!item) return;

        if (!item.pago) {
            // Abrir modal para registrar pagamento com comprovante
            itemEditando = { tipo: 'despesaFixa', id: id, key: key };
            const body = document.getElementById('modalEditarBody');
            body.innerHTML = `
                <div class="info-box">
                    <strong>${item.descricao}</strong> - ${formatarMoeda(item.valor)}
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Data do Pagamento</label>
                        <input type="date" id="pagamentoData" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Comprovante (opcional)</label>
                        <input type="file" id="pagamentoComprovante" accept="image/*,.pdf">
                    </div>
                </div>
                <div class="form-buttons">
                    <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                    <button class="btn-salvar" onclick="confirmarPagamentoDespesa()">Confirmar</button>
                </div>
            `;
            document.querySelector('#modalEditar .modal-header h3').textContent = 'Registrar Pagamento';
            abrirModal('modalEditar');
        } else {
            // Desmarcar como pago
            item.pago = false;
            item.dataPagamento = null;
            item.comprovante = null;
            salvarDados();
            renderizar();
        }
    }

    async function confirmarPagamentoDespesa() {
        const data = document.getElementById('pagamentoData').value;
        const fileInput = document.getElementById('pagamentoComprovante');

        if (itemEditando.tipo === 'despesaFixa') {
            const item = financeiro.despesasFixasMes[itemEditando.key]?.find(d => String(d.id) === String(itemEditando.id));
            if (item) {
                // Criar comprovante com metadados completos
                const comprovante = await criarComprovante(
                    fileInput, 
                    'despesa_fixa', 
                    item.valor, 
                    item.descricao
                );
                
                item.pago = true;
                item.dataPagamento = data;
                item.comprovante = comprovante;

                // Se é uma despesa atrasada, marcar a original como paga também
                if (item.atrasada && item.idOriginal && item.mesOriginal) {
                    const original = financeiro.despesasFixasMes[item.mesOriginal]?.find(d => String(d.id) === String(item.idOriginal));
                    if (original) {
                        original.pago = true;
                        original.dataPagamento = data;
                        original.comprovante = comprovante;
                    }
                }

                // Remover outras instâncias atrasadas desta mesma despesa em outros meses
                if (item.atrasada && item.idOriginal) {
                    Object.keys(financeiro.despesasFixasMes).forEach(mesKey => {
                        if (mesKey !== itemEditando.key) {
                            financeiro.despesasFixasMes[mesKey] = (financeiro.despesasFixasMes[mesKey] || []).filter(d => {
                                // Remover se é atrasada e tem o mesmo idOriginal
                                return !(d.atrasada && d.idOriginal === item.idOriginal);
                            });
                        }
                    });
                }
            }
        } else if (itemEditando.tipo === 'despesaVariavel') {
            const item = financeiro.despesasVariaveis.find(d => String(d.id) === String(itemEditando.id));
            if (item) {
                // Criar comprovante com metadados completos
                const comprovante = await criarComprovante(
                    fileInput, 
                    'despesa_variavel', 
                    item.valor, 
                    item.descricao
                );
                
                item.pago = true;
                item.dataPagamento = data;
                item.comprovante = comprovante;
            }
        } else if (itemEditando.tipo === 'despesaAvulsa') {
            const item = financeiro.despesasAvulsas.find(d => String(d.id) === String(itemEditando.id));
            if (item) {
                const comprovante = await criarComprovante(
                    fileInput, 
                    'despesa_avulsa', 
                    item.valor, 
                    item.descricao
                );
                
                item.pago = true;
                item.dataPagamento = data;
                item.comprovante = comprovante;
            }
        }

        salvarDados();
        fecharModal('modalEditar');
        renderizar();
        mostrarStatus('Pagamento registrado', 'success');
    }

    // Editar modelo da despesa fixa (afeta próximos meses)
    function editarDespesaFixaModelo(modeloId) {
        modeloId = isNaN(modeloId) ? modeloId : Number(modeloId);
        const modelo = financeiro.despesasFixas.find(df => String(df.id) === String(modeloId));
        if (!modelo) return;

        itemEditando = { tipo: 'despesaFixaModelo', id: modeloId };
        const cats = getCategorias('despesaFixa');
        const body = document.getElementById('modalEditarBody');

        body.innerHTML = `
            <div class="edit-preview-card">
                <div class="edit-preview-icon">${getCategIcon(modelo.categoria || 'Outros')}</div>
                <div class="edit-preview-info">
                    <div class="edit-preview-nome">${modelo.descricao}</div>
                    <div class="edit-preview-meta">${modelo.categoria || 'Outros'} · Dia ${modelo.diaVencimento}</div>
                </div>
                <div class="edit-preview-valor">${formatarMoeda(modelo.valor)}</div>
            </div>
            <div class="edit-aviso">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Altera o <strong>valor padrão</strong> — afeta os próximos meses. Para mudar só o valor deste mês use o ícone verde na linha da despesa.
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Descrição</label>
                    <input type="text" id="editDescricao" value="${modelo.descricao}" placeholder="Nome da despesa">
                </div>
                <div class="form-group">
                    <label>Valor (R$)</label>
                    <input type="number" id="editValor" step="0.01" min="0" value="${modelo.valor}" placeholder="0,00">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="editCategoria">
                        ${cats.map(c => `<option value="${c}" ${c === modelo.categoria ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Dia do vencimento</label>
                    <input type="number" id="editDia" min="1" max="31" value="${modelo.diaVencimento}" placeholder="Ex: 10">
                </div>
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                <button class="btn-salvar" onclick="salvarEdicaoModelo()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px;vertical-align:-1px;margin-right:5px"><polyline points="20 6 9 17 4 12"/></svg>
                    Salvar alterações
                </button>
            </div>
        `;
        document.querySelector('#modalEditar .modal-header h3').textContent = 'Editar Despesa Fixa';
        abrirModal('modalEditar');
    }

    function salvarEdicaoModelo() {
        const modelo = financeiro.despesasFixas.find(df => String(df.id) === String(itemEditando.id));
        if (!modelo) { fecharModal('modalEditar'); return; }

        const novaDescricao  = document.getElementById('editDescricao').value.trim() || modelo.descricao;
        const novoValor      = parseFloat(document.getElementById('editValor').value);
        const novaCategoria  = document.getElementById('editCategoria').value;
        const novoDia        = parseInt(document.getElementById('editDia').value);

        if (!novaDescricao) { mostrarStatus('A descrição não pode ficar em branco.', 'error'); return; }

        // Atualizar o modelo (afeta meses futuros)
        modelo.descricao    = novaDescricao;
        if (!isNaN(novoValor) && novoValor > 0) modelo.valor = novoValor;
        modelo.categoria    = novaCategoria;
        if (!isNaN(novoDia) && novoDia >= 1 && novoDia <= 31) modelo.diaVencimento = novoDia;

        // ── Atualizar também a instância já gerada no mês atual ──
        const keyAtual = getMesAnoKey();
        const instancias = financeiro.despesasFixasMes[keyAtual] || [];
        instancias.forEach(inst => {
            if (String(inst.modeloId) === String(modelo.id) && !inst.pago) {
                inst.descricao = modelo.descricao;
                inst.categoria = modelo.categoria;
                if (!isNaN(novoValor) && novoValor > 0) inst.valor = novoValor;
                if (!isNaN(novoDia)   && novoDia >= 1)  {
                    inst.dia  = novoDia;
                    inst.data = `${keyAtual}-${String(novoDia).padStart(2,'0')}`;
                }
            }
        });

        salvarDados();
        fecharModal('modalEditar');
        renderizar();
        mostrarStatus('Despesa atualizada com sucesso.', 'success');
    }

    function encerrarDespesaFixa(modeloId) {
        confirmar('Encerrar esta despesa fixa? Ela não aparecerá nos próximos meses, mas o histórico é mantido.', () => {
            const modelo = financeiro.despesasFixas.find(df => String(df.id) === String(modeloId));
            if (modelo) {
                modelo.ativa = false;
                modelo.encerradaEm = new Date().toISOString();
                salvarDados(); renderizar();
                mostrarStatus('Despesa encerrada', 'success');
            }
        }, 'Encerrar Despesa', 'Encerrar', '#e67e22');
    }

    // ==========================================
    // DESPESAS VARIÁVEIS
    // ==========================================
    
    function salvarDespesaVariavel() {
        const desc = document.getElementById('despesaVariavelDescricao').value.trim();
        const valorTotal = parseFloat(document.getElementById('despesaVariavelValorTotal').value) || 0;
        const cat = document.getElementById('despesaVariavelCategoria').value || 'Outros';
        let data = document.getElementById('despesaVariavelData').value;
        const parcelado = document.getElementById('despesaVariavelParcelado')?.checked || false;
        const totalParcelas = parseInt(document.getElementById('despesaVariavelTotalParcelas')?.value) || 0;
        
        if (!desc || !valorTotal) { mostrarStatus('Preencha descrição e valor!', 'error'); return; };
        
        // Data obrigatória — campo já vem pré-preenchido
        if (!data) {
            data = `${anoSelecionado}-${mesSelecionado}-01`;
        }
        
        if (parcelado && totalParcelas >= 2) {
            // Usar valores personalizados ou calcular automaticamente
            const valoresParcelas = window.parcelasPersonalizadas && window.parcelasPersonalizadas.length === totalParcelas
                ? [...window.parcelasPersonalizadas]
                : calcularParcelas(valorTotal, totalParcelas);
            
            // Validar soma
            const soma = valoresParcelas.reduce((s, v) => s + v, 0);
            if (Math.abs(soma - valorTotal) >= 0.01) {
                mostrarStatus(`A soma das parcelas (${formatarMoeda(soma)}) não corresponde ao valor total (${formatarMoeda(valorTotal)}).\n\nAjuste os valores antes de salvar.`, 'error');
                return;
            }
            
            // Criar despesas parceladas
            const grupoId = gerarId(); // ID único para agrupar parcelas
            const [ano, mes, dia] = data.split('-').map(Number);
            
            for (let i = 0; i < totalParcelas; i++) {
                // Calcular data de cada parcela (suporta virada de ano)
                let novaMes = mes + i;
                let novoAno = ano;
                
                while (novaMes > 12) {
                    novaMes -= 12;
                    novoAno++;
                }
                
                const dataParcela = `${novoAno}-${String(novaMes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                
                financeiro.despesasVariaveis.push({
                    id: gerarId(),
                    descricao: desc,
                    valor: valoresParcelas[i], // Valor personalizado para esta parcela
                    valorTotalDivida: valorTotal, // Armazena valor total para referência
                    categoria: cat,
                    data: dataParcela,
                    pago: false,
                    dataPagamento: null,
                    comprovante: null,
                    // Campos de parcela
                    parcelado: true,
                    grupoParcelaId: grupoId,
                    parcelaAtual: i + 1,
                    totalParcelas: totalParcelas
                });
            }
            
            // Limpar valores personalizados
            window.parcelasPersonalizadas = null;
        } else {
            // Despesa única (não parcelada)
            financeiro.despesasVariaveis.push({
                id: gerarId(),
                descricao: desc,
                valor: valorTotal,
                categoria: cat,
                data: data,
                pago: false,
                dataPagamento: null,
                comprovante: null
            });
        }
        
        salvarDados();
        esconderForm('despesaVariavel');
        renderizar();
    }


    // ==========================================
    // EDITAR PARCELA INDIVIDUAL (valor, data, nota)
    // Atualiza o valor total da dívida automaticamente
    // ==========================================
    function editarParcelaIndividual(id) {
        id = isNaN(id) ? id : Number(id);
        const parcela = financeiro.despesasVariaveis.find(d => String(d.id) === String(id));
        if (!parcela) { console.warn('editarParcelaIndividual: parcela não encontrada', id); return; }

        // Todas as parcelas do mesmo grupo
        const grupo = financeiro.despesasVariaveis.filter(d =>
            String(d.grupoParcelaId) === String(parcela.grupoParcelaId)
        );
        const somaAtual = grupo.reduce((s, p) => s + (p.valor || 0), 0);

        itemEditando = { tipo: 'parcelaIndividual', id };

        const body = document.getElementById('modalEditarBody');
        body.innerHTML = `
            <div style="background:#f8f6f0;border:1px solid rgba(47,199,173,0.15);border-radius:10px;padding:14px;margin-bottom:18px;">
                <div style="font-size:0.78em;color:rgba(255,255,255,0.60);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Editando</div>
                <div style="font-weight:600;color:var(--text,#fff);font-size:0.95em;">${parcela.descricao} — Parcela ${parcela.parcelaAtual}/${parcela.totalParcelas}</div>
                <div style="font-size:0.8em;color:rgba(255,255,255,0.65);margin-top:3px;">
                    Valor atual: <strong>${formatarMoeda(parcela.valor)}</strong> &nbsp;·&nbsp;
                    Total do grupo: <strong>${formatarMoeda(somaAtual)}</strong>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Novo Valor da Parcela</label>
                    <input type="number" id="parcelaNovoValor" value="${parcela.valor}" step="0.01" min="0"
                        placeholder="Ex: 1050.00"
                        oninput="atualizarPreviewParcela(${parcela.id}, ${somaAtual})">
                </div>
                <div class="form-group">
                    <label>Data de Vencimento</label>
                    <input type="date" id="parcelaNovaData" value="${parcela.data || ''}">
                </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label>Nota (juros, mora, motivo do ajuste)</label>
                <input type="text" id="parcelaNota" value="${parcela.notaParcela || ''}"
                    placeholder="Ex: Acréscimo de R$50 por atraso, juros de 2%...">
            </div>

            <div id="previewParcela" style="background:#f0ede6;border:1px solid rgba(47,199,173,0.2);border-radius:10px;padding:12px;margin-bottom:16px;font-size:0.82em;color:rgba(26,26,26,0.7);display:none;">
                <div style="font-weight:600;color:var(--text,#fff);margin-bottom:4px;">Impacto no total</div>
                <div id="previewParcelaTexto"></div>
            </div>

            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                <button class="btn-salvar" onclick="salvarEdicaoParcelaIndividual(${id})">Salvar Parcela</button>
            </div>
        `;

        document.querySelector('#modalEditar .modal-header h3').textContent = 'Editar Parcela';
        abrirModal('modalEditar');
    }

    function atualizarPreviewParcela(id, somaOriginal) {
        const novoValor = parseFloat(document.getElementById('parcelaNovoValor')?.value) || 0;
        id = isNaN(id) ? id : Number(id);
        const parcela = financeiro.despesasVariaveis.find(d => String(d.id) === String(id));
        if (!parcela) return;

        const diferenca = novoValor - (parcela.valor || 0);
        const novoTotal = somaOriginal + diferenca;

        const preview = document.getElementById('previewParcela');
        const texto = document.getElementById('previewParcelaTexto');
        if (!preview || !texto) return;

        if (Math.abs(diferenca) < 0.01) {
            preview.style.display = 'none';
            return;
        }

        preview.style.display = 'block';
        const sinal = diferenca > 0 ? '+' : '';
        const cor = diferenca > 0 ? '#dc2626' : '#16a34a';
        texto.innerHTML = `
            Valor desta parcela: <strong>${formatarMoeda(parcela.valor)}</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin:0 2px"><polyline points="9 18 15 12 9 6"/></svg> <strong style="color:${cor};">${formatarMoeda(novoValor)}</strong><br>
            Ajuste: <strong style="color:${cor};">${sinal}${formatarMoeda(diferenca)}</strong><br>
            Novo total da dívida: <strong>${formatarMoeda(somaOriginal)}</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin:0 2px"><polyline points="9 18 15 12 9 6"/></svg> <strong>${formatarMoeda(novoTotal)}</strong>
        `;
    }

    function salvarEdicaoParcelaIndividual(id) {
        const novoValor = parseFloat(document.getElementById('parcelaNovoValor')?.value);
        const novaData  = document.getElementById('parcelaNovaData')?.value || '';
        const novaNota  = document.getElementById('parcelaNota')?.value.trim() || '';

        if (isNaN(novoValor) || novoValor < 0) {
            mostrarStatus('Valor inválido', 'error');
            return;
        }

        id = isNaN(id) ? id : Number(id);
        const parcela = financeiro.despesasVariaveis.find(d => String(d.id) === String(id));
        if (!parcela) return;

        const valorAntigo = parcela.valor || 0;
        const diferenca   = novoValor - valorAntigo;

        // Atualizar a parcela
        parcela.valor        = Math.round(novoValor * 100) / 100;
        parcela.data         = novaData;
        parcela.notaParcela  = novaNota;
        parcela.ajustadoEm   = new Date().toISOString();

        // Atualizar o valorTotalDivida em TODAS as parcelas do grupo
        // para refletir o novo total real
        if (Math.abs(diferenca) >= 0.01) {
            const grupo = financeiro.despesasVariaveis.filter(d =>
                String(d.grupoParcelaId) === String(parcela.grupoParcelaId)
            );
            const novoTotal = grupo.reduce((s, p) => s + (p.valor || 0), 0);
            grupo.forEach(p => {
                p.valorTotalDivida = Math.round(novoTotal * 100) / 100;
            });
        }

        fecharModal('modalEditar');
        salvarDados();
        renderizar();
        mostrarStatus(`Parcela ${parcela.parcelaAtual} atualizada${Math.abs(diferenca) >= 0.01 ? ' · Total da dívida recalculado' : ''}`, 'success');
    }

    // ==========================================
    // EDITAR DESPESA PARCELADA (descrição/categoria do GRUPO)
    // Atualiza todas as parcelas do mesmo grupoParcelaId de uma vez,
    // para que a Parcela 3/12 não fique com nome diferente da 4/12.
    // Para mudar valor/data/nota de UMA parcela específica, use o
    // lápis dentro do detalhamento de cada parcela (editarParcelaIndividual).
    // ==========================================
    function editarDespesaParcelada(grupoParcelaId) {
        const parcelas = financeiro.despesasVariaveis.filter(d =>
            String(d.grupoParcelaId) === String(grupoParcelaId)
        );
        if (parcelas.length === 0) return;

        const ref = parcelas[0];
        itemEditando = { tipo: 'despesaParcelada', grupoParcelaId };
        const cats = getCategorias('despesaVariavel');
        const pagas = parcelas.filter(p => p.pago).length;
        const total = parcelas.length;
        const valorTotal = parcelas.reduce((s,p) => s + (p.valor||0), 0);
        const valorPago = parcelas.filter(p=>p.pago).reduce((s,p) => s + (p.valor||0), 0);
        const pct = Math.round((pagas/total)*100);

        const body = document.getElementById('modalEditarBody');
        body.innerHTML = `
            <div class="edit-preview-card">
                <div class="edit-preview-icon">${getCategIcon(ref.categoria||'Outros')}</div>
                <div class="edit-preview-info">
                    <div class="edit-preview-nome">${ref.descricao}</div>
                    <div class="edit-preview-meta">${ref.categoria||'Outros'} · ${total}x de ${formatarMoeda(ref.valor)}</div>
                </div>
                <div class="edit-preview-valor">${formatarMoeda(valorTotal)}</div>
            </div>
            <div class="edit-progresso">
                <div class="edit-prog-header">
                    <span>${pagas} de ${total} parcelas pagas</span>
                    <span style="color:var(--green)">${pct}%</span>
                </div>
                <div class="edit-prog-track">
                    <div class="edit-prog-fill" style="width:${pct}%"></div>
                </div>
                <div class="edit-prog-valores">
                    <span>Pago: <strong style="color:var(--green)">${formatarMoeda(valorPago)}</strong></span>
                    <span>Restante: <strong style="color:var(--red)">${formatarMoeda(valorTotal-valorPago)}</strong></span>
                </div>
            </div>
            <div class="edit-aviso">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Edita <strong>todas as ${total} parcelas</strong>. Para mudar valor, data ou nota de uma parcela específica, abra o detalhamento e clique no lápis.
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Descrição</label>
                    <input type="text" id="editParcDescricao" value="${ref.descricao}" placeholder="Nome da compra">
                </div>
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="editParcCategoria">
                        ${cats.map(c => `<option value="${c}" ${c === ref.categoria ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                <button class="btn-salvar" onclick="salvarEdicaoDespesaParcelada('${grupoParcelaId}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px;vertical-align:-1px;margin-right:5px"><polyline points="20 6 9 17 4 12"/></svg>
                    Salvar alterações
                </button>
            </div>
        `;
        document.querySelector('#modalEditar .modal-header h3').textContent = 'Editar Compra Parcelada';
        abrirModal('modalEditar');
    }

    function salvarEdicaoDespesaParcelada(grupoParcelaId) {
        const novaDescricao = document.getElementById('editParcDescricao').value.trim();
        const novaCategoria = document.getElementById('editParcCategoria').value;

        if (!novaDescricao) { mostrarStatus('A descrição não pode ficar em branco!', 'error'); return; };

        const parcelas = financeiro.despesasVariaveis.filter(d =>
            String(d.grupoParcelaId) === String(grupoParcelaId)
        );
        if (parcelas.length === 0) return;

        parcelas.forEach(p => {
            p.descricao = novaDescricao;
            p.categoria = novaCategoria;
        });

        salvarDados();
        fecharModal('modalEditar');
        renderizar();
        mostrarStatus('Compra parcelada atualizada', 'success');
    }

    function togglePagoVariavel(id, btn) {
        id = isNaN(id) ? id : Number(id);
        const item = financeiro.despesasVariaveis.find(d => String(d.id) === String(id));
        if (!item) return;
        // Feedback instantâneo
        if (btn) {
            const viraPago = !item.pago;
            btn.textContent = viraPago ? 'PAGO' : 'PAGAR';
            btn.style.background = viraPago ? '#5fe08a' : 'transparent';
            btn.style.color = viraPago ? '#0a0a0a' : '#5fe08a';
            btn.style.borderColor = '#5fe08a';
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => { btn.style.transform = ''; }, 150);
        }

        if (!item.pago) {
            itemEditando = { tipo: 'despesaVariavel', id: id };
            const body = document.getElementById('modalEditarBody');
            body.innerHTML = `
                <div class="info-box">
                    <strong>${item.descricao}</strong> - ${formatarMoeda(item.valor)}
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Data do Pagamento</label>
                        <input type="date" id="pagamentoData" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Comprovante (opcional)</label>
                        <input type="file" id="pagamentoComprovante" accept="image/*,.pdf">
                    </div>
                </div>
                <div class="form-buttons">
                    <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                    <button class="btn-salvar" onclick="confirmarPagamentoDespesa()">Confirmar</button>
                </div>
            `;
            document.querySelector('#modalEditar .modal-header h3').textContent = 'Registrar Pagamento';
            abrirModal('modalEditar');
        } else {
            item.pago = false;
            item.dataPagamento = null;
            item.comprovante = null;
            salvarDados();
            renderizar();
        }
    }

    function deletarDespesaVariavel(id) {
        confirmar('Excluir esta despesa?', () => {
            financeiro.despesasVariaveis = financeiro.despesasVariaveis.filter(d => String(d.id) !== String(id));
            salvarDados(); renderizar();
        });
    }

    // ==========================================
    // PAUSAR/DESPAUSAR GRUPO PARCELADO
    // ==========================================
    function togglePauseGrupo(grupoId) {
        // Buscar todas as parcelas do grupo (comparação com conversão de tipo)
        const parcelas = financeiro.despesasVariaveis.filter(d => {
            return d.grupoParcelaId && String(d.grupoParcelaId) === String(grupoId);
        });
        
        if (parcelas.length === 0) {
            mostrarStatus('Grupo não encontrado: ' + grupoId, 'error');
            return;
        }
        
        // Verificar estado atual (baseado na primeira parcela)
        const estaPausado = parcelas[0].pausado === true;
        const desc = parcelas[0].descricao;
        
        if (estaPausado) {
            // DESPAUSAR: reativar e recalcular datas
            const hoje = new Date();
            const parcelasPendentes = parcelas
                .filter(p => !p.pago)
                .sort((a, b) => a.parcelaAtual - b.parcelaAtual);
            
            parcelasPendentes.forEach((p, idx) => {
                const diaOriginal = parseInt(p.data.split('-')[2]) || 15;
                const novaData = new Date(hoje.getFullYear(), hoje.getMonth() + idx, diaOriginal);
                p.data = novaData.toISOString().split('T')[0];
                p.pausado = false;
            });
            
            // Marcar pagas como não pausadas também
            parcelas.filter(p => p.pago).forEach(p => p.pausado = false);
            
            mostrarStatus(`"${desc}" foi REATIVADO!`, 'error');
        } else {
            // PAUSAR: marcar todas as parcelas como pausadas
            parcelas.forEach(p => {
                p.pausado = true;
            });
            
            mostrarStatus(`"${desc}" foi PAUSADO!`, 'error');
        }
        
        salvarDados();
        renderizar();
    }

    function deletarTodasParcelas(id) {
        const despesa = financeiro.despesasVariaveis.find(d => String(d.id) === String(id));
        if (!despesa || !despesa.grupoParcelaId) return;
        
        const gid = String(despesa.grupoParcelaId);
        const parcelasDoGrupo = financeiro.despesasVariaveis.filter(d => String(d.grupoParcelaId) === gid);
        const parcelasPagas = parcelasDoGrupo.filter(p => p.pago).length;
        const parcelasPendentes = parcelasDoGrupo.filter(p => !p.pago).length;
        const totalParcelas = parcelasDoGrupo.length;
        
        const opcao = prompt(
            `"${despesa.descricao}" - ${totalParcelas} parcelas\n\n` +
            `✅ ${parcelasPagas} pagas\n` +
            `⏳ ${parcelasPendentes} pendentes\n\n` +
            `Digite:\n` +
            `1 = Excluir APENAS pendentes\n` +
            `2 = Excluir TUDO (pagas + pendentes)\n` +
            `Cancelar = Manter tudo`
        );
        
        if (opcao === '1') {
            financeiro.despesasVariaveis = financeiro.despesasVariaveis.filter(
                d => String(d.grupoParcelaId) !== gid || d.pago
            );
            salvarDados();
            renderizar();
            mostrarStatus('Parcelas pendentes removidas', 'success');
        } else if (opcao === '2') {
            financeiro.despesasVariaveis = financeiro.despesasVariaveis.filter(
                d => String(d.grupoParcelaId) !== gid
            );
            salvarDados();
            renderizar();
            mostrarStatus(`"${despesa.descricao}" removida por completo`, 'success');
        }
    }

    function quitarDivida(grupoId) {
        const gid = String(grupoId);
        const parcelasDoGrupo = financeiro.despesasVariaveis.filter(
            d => String(d.grupoParcelaId) === gid && !d.pago
        );

        if (parcelasDoGrupo.length === 0) {
            mostrarStatus('Todas as parcelas já estão pagas!', 'error');
            return;
        }

        const nome = parcelasDoGrupo[0].descricao;
        const totalRestante = parcelasDoGrupo.reduce((s, p) => s + p.valor, 0);

        confirmar(
            `Quitar "${nome}"? ${parcelasDoGrupo.length} parcelas pendentes. Total: ${formatarMoeda(totalRestante)}. Todas serão marcadas como pagas.`,
            () => { _doQuitarParcelas(parcelasDoGrupo); },
            'Quitar Dívida', 'Quitar', '#4bc978'
        ); return;

        // (bloco movido para _doQuitarParcelas)
    }

    function _doQuitarParcelas(parcelasDoGrupo) {
        const hoje = new Date();
        const hojeStr = hoje.toISOString().split('T')[0];
        const mesHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
        const diaHoje = String(hoje.getDate()).padStart(2, '0');

        parcelasDoGrupo.forEach(p => {
            p.data = `${mesHoje}-${diaHoje}`;
            p.pago = true;
            p.dataPagamento = hojeStr;
        });

        salvarDados();
        renderizar();
        mostrarStatus(`"${nome}" quitada! ${formatarMoeda(totalRestante)} no mês atual.`, 'success');
    }

    function editarDespesaVariavel(id) {
        const item = financeiro.despesasVariaveis.find(d => String(d.id) === String(id));
        if (!item) return;

        itemEditando = { tipo: 'despesaVariavelEdit', id: id };
        const body = document.getElementById('modalEditarBody');
        
        // Se for parcelada, mostrar opções de edição de parcelas
        if (item.parcelado && item.grupoParcelaId) {
            const parcelasDoGrupo = financeiro.despesasVariaveis
                .filter(d => String(d.grupoParcelaId) === String(item.grupoParcelaId))
                .sort((a, b) => a.parcelaAtual - b.parcelaAtual);
            
            const parcelasPagas = parcelasDoGrupo.filter(p => p.pago);
            const parcelasPendentes = parcelasDoGrupo.filter(p => !p.pago);
            const totalAtual = parcelasDoGrupo.length;
            
            // Calcular valor total da dívida (soma de todas as parcelas)
            const valorTotalAtual = parcelasDoGrupo.reduce((sum, p) => sum + p.valor, 0);
            // Valor já pago
            const valorJaPago = parcelasPagas.reduce((sum, p) => sum + p.valor, 0);
            // Valor restante
            const valorRestante = parcelasPendentes.reduce((sum, p) => sum + p.valor, 0);
            
            body.innerHTML = `
                <div class="info-box" style="margin-bottom: 15px; padding: 15px; background: rgba(90,169,240, 0.1); border-radius: 10px; border-left: 3px solid #5aa9f0;">
                    <strong style="font-size: 1.1em;">${item.descricao}</strong>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px;">
                        <div style="text-align: center;">
                            <div style="color: rgba(26, 26, 26, 0.65); font-size: 0.75em; text-transform: uppercase;">Total</div>
                            <div style="color: #5aa9f0; font-weight: 600;">${formatarMoeda(valorTotalAtual)}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: rgba(26, 26, 26, 0.65); font-size: 0.75em; text-transform: uppercase;">Pago</div>
                            <div style="color: #4bc978; font-weight: 600;">${formatarMoeda(valorJaPago)}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: rgba(26, 26, 26, 0.65); font-size: 0.75em; text-transform: uppercase;">Restante</div>
                            <div style="color: #ff6b5b; font-weight: 600;">${formatarMoeda(valorRestante)}</div>
                        </div>
                    </div>
                    <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(26, 26, 26, 0.1);">
                        <small style="color: rgba(26, 26, 26, 0.65);">
                            ${parcelasPagas.length} de ${totalAtual} parcelas pagas
                        </small>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Descrição</label>
                        <input type="text" id="editDescricao" value="${item.descricao}">
                    </div>
                    <div class="form-group">
                        <label>Categoria</label>
                        <input type="text" id="editCategoria" value="${item.categoria}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Novo Valor Total da Dívida</label>
                        <input type="number" id="editValorTotal" step="0.01" value="${valorTotalAtual.toFixed(2)}" 
                               oninput="atualizarPreviewEdicaoParcelas()">
                        <small style="color: rgba(26, 26, 26, 0.4); font-size: 0.75em;">
                            Valor já pago (${formatarMoeda(valorJaPago)}) não será alterado
                        </small>
                    </div>
                    <div class="form-group">
                        <label>Quantidade de Parcelas</label>
                        <input type="number" id="editTotalParcelas" min="${parcelasPagas.length || 1}" value="${totalAtual}"
                               oninput="atualizarPreviewEdicaoParcelas()">
                        <small style="color: rgba(26, 26, 26, 0.4); font-size: 0.75em;">
                            Mínimo: ${parcelasPagas.length || 1} (já pagas)
                        </small>
                    </div>
                </div>
                
                <div id="previewEdicaoParcelas" class="parcelas-preview" style="display: none;"></div>
                
                <div class="form-buttons">
                    <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                    <button class="btn-salvar" onclick="salvarEdicaoParcelada()">Salvar Alterações</button>
                </div>
            `;
            
            // Armazenar dados para uso na edição
            itemEditando.parcelasPagas = parcelasPagas;
            itemEditando.parcelasPendentes = parcelasPendentes;
            itemEditando.valorJaPago = valorJaPago;
            // Inicializar valores personalizados com os valores atuais das parcelas pendentes
            itemEditando.valoresPersonalizados = parcelasPendentes.map(p => p.valor);
            
            document.querySelector('#modalEditar .modal-header h3').textContent = 'Editar Despesa Parcelada';
            
            // Atualizar preview inicial
            setTimeout(() => atualizarPreviewEdicaoParcelas(), 100);
        } else {
            // Despesa não parcelada - edição simples
            body.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Descrição</label>
                        <input type="text" id="editDescricao" value="${item.descricao}">
                    </div>
                    <div class="form-group">
                        <label>Valor</label>
                        <input type="number" id="editValor" step="0.01" value="${item.valor}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Categoria</label>
                        <input type="text" id="editCategoria" value="${item.categoria}">
                    </div>
                    <div class="form-group">
                        <label>Data</label>
                        <input type="date" id="editData" value="${item.data}">
                    </div>
                </div>
                <div class="form-buttons">
                    <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                    <button class="btn-salvar" onclick="salvarEdicaoDespesaVariavel()">Salvar</button>
                </div>
            `;
            document.querySelector('#modalEditar .modal-header h3').textContent = 'Editar Despesa';
        }
        abrirModal('modalEditar');
    }

    // Função para atualizar preview de edição de parcelas
    function atualizarPreviewEdicaoParcelas() {
        const previewContainer = document.getElementById('previewEdicaoParcelas');
        if (!previewContainer || !itemEditando) return;
        
        const novoValorTotal = parseFloat(document.getElementById('editValorTotal')?.value) || 0;
        const novoTotalParcelas = parseInt(document.getElementById('editTotalParcelas')?.value) || 0;
        const valorJaPago = itemEditando.valorJaPago || 0;
        const qtdPagas = itemEditando.parcelasPagas?.length || 0;
        
        if (novoValorTotal <= 0 || novoTotalParcelas < qtdPagas) {
            previewContainer.style.display = 'none';
            return;
        }
        
        // Calcular valor restante a distribuir
        const valorRestante = novoValorTotal - valorJaPago;
        const qtdPendentes = novoTotalParcelas - qtdPagas;
        
        if (valorRestante <= 0 || qtdPendentes <= 0) {
            previewContainer.innerHTML = '<div style="color: #4bc978; text-align: center; padding: 10px;">Dívida quitada!</div>';
            previewContainer.style.display = 'block';
            return;
        }
        
        // Calcular novas parcelas (distribuição automática)
        const novasParcelas = calcularParcelas(valorRestante, qtdPendentes);
        
        // Armazenar valores editáveis
        if (!itemEditando.valoresPersonalizados || itemEditando.valoresPersonalizados.length !== qtdPendentes) {
            itemEditando.valoresPersonalizados = [...novasParcelas];
        }
        
        let html = '<div class="preview-header">Valores das parcelas pendentes:</div>';
        html += '<div class="preview-list-editable">';
        itemEditando.valoresPersonalizados.forEach((valor, idx) => {
            const numParcela = qtdPagas + idx + 1;
            html += `
                <div class="preview-item-editable">
                    <span class="parcela-num">${numParcela}/${novoTotalParcelas}</span>
                    <input type="number" 
                           class="parcela-valor-input" 
                           value="${valor.toFixed(2)}" 
                           step="0.01" 
                           min="0"
                           onchange="atualizarValorParcela(${idx}, this.value)"
                           oninput="atualizarSomaParcelas()">
                </div>
            `;
        });
        html += '</div>';
        
        const somaAtual = itemEditando.valoresPersonalizados.reduce((s, v) => s + v, 0);
        const diferenca = valorRestante - somaAtual;
        const statusClass = Math.abs(diferenca) < 0.01 ? 'ok' : 'erro';
        
        html += `
            <div class="preview-soma ${statusClass}">
                <div class="soma-linha">
                    <span>Soma das parcelas:</span>
                    <span id="somaParcelas">${formatarMoeda(somaAtual)}</span>
                </div>
                <div class="soma-linha">
                    <span>Valor restante:</span>
                    <span>${formatarMoeda(valorRestante)}</span>
                </div>
                ${Math.abs(diferenca) >= 0.01 ? `
                    <div class="soma-diferenca">
                        Diferença: ${formatarMoeda(diferenca)} 
                        <button class="btn-ajustar" onclick="ajustarUltimaParcela()">Ajustar última</button>
                    </div>
                ` : '<div class="soma-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:2px"><polyline points="20 6 9 12 4 12"/><polyline points="20 6 9 20 4 12"/></svg> Valores corretos</div>'}
            </div>
        `;
        
        previewContainer.innerHTML = html;
        previewContainer.style.display = 'block';
    }
    
    // Atualizar valor de uma parcela específica
    function atualizarValorParcela(index, valor) {
        if (!itemEditando.valoresPersonalizados) return;
        itemEditando.valoresPersonalizados[index] = parseFloat(valor) || 0;
        atualizarSomaParcelas();
    }
    
    // Atualizar exibição da soma
    function atualizarSomaParcelas() {
        if (!itemEditando.valoresPersonalizados) return;
        
        const novoValorTotal = parseFloat(document.getElementById('editValorTotal')?.value) || 0;
        const valorJaPago = itemEditando.valorJaPago || 0;
        const valorRestante = novoValorTotal - valorJaPago;
        
        // Recalcular soma dos inputs
        const inputs = document.querySelectorAll('.parcela-valor-input');
        let somaAtual = 0;
        inputs.forEach((input, idx) => {
            const val = parseFloat(input.value) || 0;
            itemEditando.valoresPersonalizados[idx] = val;
            somaAtual += val;
        });
        
        const somaEl = document.getElementById('somaParcelas');
        if (somaEl) somaEl.textContent = formatarMoeda(somaAtual);
        
        const diferenca = valorRestante - somaAtual;
        const previewSoma = document.querySelector('.preview-soma');
        if (previewSoma) {
            previewSoma.className = 'preview-soma ' + (Math.abs(diferenca) < 0.01 ? 'ok' : 'erro');
        }
    }
    
    // Ajustar última parcela para fechar o valor
    function ajustarUltimaParcela() {
        if (!itemEditando.valoresPersonalizados || itemEditando.valoresPersonalizados.length === 0) return;
        
        const novoValorTotal = parseFloat(document.getElementById('editValorTotal')?.value) || 0;
        const valorJaPago = itemEditando.valorJaPago || 0;
        const valorRestante = novoValorTotal - valorJaPago;
        
        // Calcular soma de todas exceto a última
        const somaExcetoUltima = itemEditando.valoresPersonalizados.slice(0, -1).reduce((s, v) => s + v, 0);
        const ultimaParcela = Math.round((valorRestante - somaExcetoUltima) * 100) / 100;
        
        // Atualizar última parcela
        const ultimoIndex = itemEditando.valoresPersonalizados.length - 1;
        itemEditando.valoresPersonalizados[ultimoIndex] = ultimaParcela;
        
        // Atualizar input
        const inputs = document.querySelectorAll('.parcela-valor-input');
        if (inputs[ultimoIndex]) {
            inputs[ultimoIndex].value = ultimaParcela.toFixed(2);
        }
        
        atualizarSomaParcelas();
        atualizarPreviewEdicaoParcelas();
    }

    // Salvar edição de despesa parcelada
    function salvarEdicaoParcelada() {
        const item = financeiro.despesasVariaveis.find(d => String(d.id) === String(itemEditando.id));
        if (!item || !item.grupoParcelaId) return;

        const novaDescricao = document.getElementById('editDescricao').value.trim();
        const novaCategoria = document.getElementById('editCategoria').value;
        const novoValorTotal = parseFloat(document.getElementById('editValorTotal').value) || 0;
        const novoTotalParcelas = parseInt(document.getElementById('editTotalParcelas').value);

        // Pegar todas as parcelas do grupo ordenadas
        const parcelasDoGrupo = financeiro.despesasVariaveis
            .filter(d => String(d.grupoParcelaId) === String(item.grupoParcelaId))
            .sort((a, b) => a.parcelaAtual - b.parcelaAtual);
        
        const parcelasPagas = parcelasDoGrupo.filter(p => p.pago);
        const valorJaPago = parcelasPagas.reduce((sum, p) => sum + p.valor, 0);

        // Validar: não pode ter menos parcelas que as já pagas
        if (novoTotalParcelas < parcelasPagas.length) {
            mostrarStatus(`Não é possível reduzir para menos de ${parcelasPagas.length} parcelas (já pagas).`, 'error');
            return;
        }

        // Validar: novo valor total não pode ser menor que o já pago
        if (novoValorTotal < valorJaPago) {
            mostrarStatus(`O valor total não pode ser menor que ${formatarMoeda(valorJaPago)} (já pago).`, 'error');
            return;
        }

        // Calcular valor restante e quantidade de parcelas pendentes
        const valorRestante = novoValorTotal - valorJaPago;
        const qtdPendentes = novoTotalParcelas - parcelasPagas.length;

        // Validar soma dos valores personalizados
        const valoresPersonalizados = itemEditando.valoresPersonalizados || [];
        const somaPersonalizada = valoresPersonalizados.reduce((s, v) => s + v, 0);
        
        if (Math.abs(somaPersonalizada - valorRestante) >= 0.01) {
            mostrarStatus(`A soma das parcelas (${formatarMoeda(somaPersonalizada)}) não corresponde ao valor restante (${formatarMoeda(valorRestante)}).\n\nAjuste os valores ou clique em "Ajustar última".`, 'error');
            return;
        }

        // Atualizar descrição e categoria em todas as parcelas pagas
        parcelasPagas.forEach(p => {
            p.descricao = novaDescricao;
            p.categoria = novaCategoria;
            p.valorTotalDivida = novoValorTotal;
            p.totalParcelas = novoTotalParcelas;
        });

        // Excluir todas as parcelas pendentes atuais
        financeiro.despesasVariaveis = financeiro.despesasVariaveis.filter(
            d => String(d.grupoParcelaId) !== String(item.grupoParcelaId) || d.pago
        );

        // Criar novas parcelas pendentes com valores personalizados
        if (qtdPendentes > 0 && valorRestante > 0) {
            // Usar valores personalizados ou calcular automaticamente
            const valoresParcelas = valoresPersonalizados.length === qtdPendentes 
                ? valoresPersonalizados 
                : calcularParcelas(valorRestante, qtdPendentes);
            
            // Encontrar a data da próxima parcela
            const ultimaPaga = parcelasPagas.length > 0 
                ? parcelasPagas.sort((a, b) => new Date(b.data) - new Date(a.data))[0]
                : null;
            
            const parcelasPendentesAntigas = parcelasDoGrupo.filter(p => !p.pago);
            let [ano, mes, dia] = ultimaPaga 
                ? ultimaPaga.data.split('-').map(Number)
                : parcelasPendentesAntigas[0]?.data.split('-').map(Number) || [new Date().getFullYear(), new Date().getMonth() + 1, 1];
            
            for (let i = 0; i < qtdPendentes; i++) {
                // Calcular próximo mês
                if (ultimaPaga || i > 0) {
                    mes++;
                    if (mes > 12) {
                        mes = 1;
                        ano++;
                    }
                }
                
                const dataParcela = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                
                financeiro.despesasVariaveis.push({
                    id: gerarId(),
                    descricao: novaDescricao,
                    valor: valoresParcelas[i],
                    valorTotalDivida: novoValorTotal,
                    categoria: novaCategoria,
                    data: dataParcela,
                    pago: false,
                    dataPagamento: null,
                    comprovante: null,
                    parcelado: true,
                    grupoParcelaId: item.grupoParcelaId,
                    parcelaAtual: parcelasPagas.length + i + 1,
                    totalParcelas: novoTotalParcelas
                });
            }
        }

        // Renumerar parcelas pagas
        const todasParcelas = financeiro.despesasVariaveis
            .filter(d => String(d.grupoParcelaId) === String(item.grupoParcelaId))
            .sort((a, b) => new Date(a.data) - new Date(b.data));
        
        todasParcelas.forEach((p, idx) => {
            p.parcelaAtual = idx + 1;
        });

        salvarDados();
        fecharModal('modalEditar');
        renderizar();
        mostrarStatus('Parcelas atualizadas!', 'success');
    }

    function salvarEdicaoDespesaVariavel() {
        const item = financeiro.despesasVariaveis.find(d => String(d.id) === String(itemEditando.id));
        if (item) {
            item.descricao = document.getElementById('editDescricao').value.trim();
            item.valor = parseFloat(document.getElementById('editValor').value) || item.valor;
            item.categoria = document.getElementById('editCategoria').value;
            item.data = document.getElementById('editData').value;
            salvarDados();
        }
        fecharModal('modalEditar');
        renderizar();
    }

    // ==========================================
    // DESPESAS VARIÁVEIS (AVULSAS)
    // ==========================================

    function salvarDespesaAvulsa() {
        const desc = document.getElementById('despesaAvulsaDescricao').value.trim();
        const valor = parseFloat(document.getElementById('despesaAvulsaValor').value) || 0;
        const cat = document.getElementById('despesaAvulsaCategoria').value || 'Outros';
        let data = document.getElementById('despesaAvulsaData').value;

        if (!desc || !valor) { mostrarStatus('Preencha descrição e valor!', 'error'); return; };

        if (!data) {
            // Fallback: usa o mês/ano selecionado com dia 1
            data = `${anoSelecionado}-${mesSelecionado}-01`;
        }

        // A despesa aparecerá no mês da data cadastrada (não necessariamente o mês selecionado)

        financeiro.despesasAvulsas.push({
            id: gerarId(),
            descricao: desc,
            valor: valor,
            categoria: cat,
            data: data,
            pago: false,
            dataPagamento: null,
            comprovante: null
        });

        salvarDados();
        esconderForm('despesaAvulsa');
        renderizar();
    }

    function togglePagoAvulsa(id, btn) {
        const item = financeiro.despesasAvulsas.find(d => String(d.id) === String(id));
        if (!item) return;
        // Feedback instantâneo no botão
        if (btn) {
            const viraPago = !item.pago;
            btn.textContent = viraPago ? 'PAGO' : 'PAGAR';
            btn.style.background = viraPago ? '#5fe08a' : 'transparent';
            btn.style.color = viraPago ? '#0a0a0a' : '#5fe08a';
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => { btn.style.transform = ''; }, 150);
        }

        if (!item.pago) {
            itemEditando = { tipo: 'despesaAvulsa', id: id };
            const body = document.getElementById('modalEditarBody');
            body.innerHTML = `
                <div class="info-box">
                    <strong>${item.descricao}</strong> - ${formatarMoeda(item.valor)}
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Data do Pagamento</label>
                        <input type="date" id="pagamentoData" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Comprovante (opcional)</label>
                        <input type="file" id="pagamentoComprovante" accept="image/*,.pdf">
                    </div>
                </div>
                <div class="form-buttons">
                    <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                    <button class="btn-salvar" onclick="confirmarPagamentoDespesa()">Confirmar</button>
                </div>
            `;
            document.querySelector('#modalEditar .modal-header h3').textContent = 'Registrar Pagamento';
            abrirModal('modalEditar');
        } else {
            item.pago = false;
            item.dataPagamento = null;
            item.comprovante = null;
            salvarDados();
            renderizar();
        }
    }

    function editarDespesaAvulsa(id) {
        id = isNaN(id) ? id : Number(id);
        const item = financeiro.despesasAvulsas.find(d => String(d.id) === String(id));
        if (!item) return;

        itemEditando = { tipo: 'despesaAvulsa', id: id };

        const body = document.getElementById('modalEditarBody');
        body.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Descrição</label>
                    <input type="text" id="editDescricao" value="${item.descricao}">
                </div>
                <div class="form-group">
                    <label>Valor</label>
                    <input type="number" id="editValor" value="${item.valor.toFixed(2)}" step="0.01">
                </div>
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="editCategoria">
                        ${['Alimentação', 'Transporte', 'Lazer', 'Compras', 'Saúde', 'Educação', 'Outros'].map(c => `<option value="${c}" ${c === item.categoria ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Data</label>
                    <input type="date" id="editData" value="${item.data}">
                </div>
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                <button class="btn-salvar" onclick="salvarEdicaoAvulsa()">Salvar</button>
            </div>
        `;
        document.querySelector('#modalEditar .modal-header h3').textContent = 'Editar Despesa Variável';
        abrirModal('modalEditar');
    }

    function salvarEdicaoAvulsa() {
        const item = financeiro.despesasAvulsas.find(d => String(d.id) === String(itemEditando.id));
        if (!item) return;

        item.descricao = document.getElementById('editDescricao').value.trim();
        item.valor = parseFloat(document.getElementById('editValor').value) || item.valor;
        item.categoria = document.getElementById('editCategoria').value;
        item.data = document.getElementById('editData').value || item.data;

        salvarDados();
        fecharModal('modalEditar');
        renderizar();
    }

    function deletarDespesaAvulsa(id) {
        confirmar('Excluir esta despesa variável?', () => {
            financeiro.despesasAvulsas = financeiro.despesasAvulsas.filter(d => String(d.id) !== String(id));
            salvarDados(); renderizar();
        });
    }

    // ==========================================
    // EMPRÉSTIMOS / DÍVIDAS
    // ==========================================
    
    function salvarEmprestimo() {
        const desc = document.getElementById('emprestimoDescricao').value.trim();
        const principal = parseFloat(document.getElementById('emprestimoPrincipal').value) || 0;
        const juros = parseFloat(document.getElementById('emprestimoJuros').value) || 0;
        const cat = document.getElementById('emprestimoCategoria').value || 'Outros';
        
        if (!desc || !principal) { mostrarStatus('Preencha os campos obrigatórios!', 'error'); return; };

        // Parcelamento (opcional)
        const parcelado = document.getElementById('emprestimoParcelado')?.checked || false;
        let dadosParcelamento = { parcelado: false };

        if (parcelado) {
            const totalParcelas = parseInt(document.getElementById('emprestimoTotalParcelas')?.value) || 0;
            const parcelasPagas = parseInt(document.getElementById('emprestimoParcelasPagas')?.value) || 0;
            const valorParcela = parseFloat(document.getElementById('emprestimoValorParcela')?.value) || 0;
            const diaVencimento = parseInt(document.getElementById('emprestimoDiaVencimento')?.value) || 0;

            if (totalParcelas < 1 || valorParcela <= 0 || diaVencimento < 1 || diaVencimento > 31) {
                { mostrarStatus('Para empréstimo parcelado, informe total de parcelas, valor da parcela e dia de vencimento (1-31).', 'error'); return; }
            }
            if (parcelasPagas > totalParcelas) {
                { mostrarStatus('Parcelas já pagas não pode ser maior que o total de parcelas.', 'error'); return; }
            }

            dadosParcelamento = {
                parcelado: true,
                totalParcelas,
                parcelasPagas,
                valorParcela,
                diaVencimento,
                proximaParcelaData: calcularProximaParcelaData(diaVencimento)
            };
        }

        financeiro.emprestimos.push({
            id: gerarId(),
            descricao: desc,
            categoria: cat,
            principalOriginal: principal,
            principal: principal,
            taxaJuros: juros,
            jurosAcumulados: 0,
            totalJurosPagos: 0,
            totalAmortizado: 0,
            historico: [],
            arquivado: false,
            dataCriacao: new Date().toISOString(),
            ...dadosParcelamento
        });
        
        salvarDados();
        esconderForm('emprestimo');

        // Resetar checkbox/campos de parcelamento para a próxima vez que o formulário for aberto
        const chkParcelado = document.getElementById('emprestimoParcelado');
        if (chkParcelado) {
            chkParcelado.checked = false;
            toggleEmprestimoParcelasField('emprestimoParcelado');
        }

        renderizar();
    }

    // Cancelar juros acumulados
    function cancelarJuros(id) {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(id));
        if (!emp) return;
        const valor = emp.jurosAcumulados || 0;
        if (valor <= 0) return;
        confirmar(
            `Cancelar ${formatarMoeda(valor)} de juros acumulados do "${emp.descricao}"? Isso zerará os juros pendentes sem registrar pagamento.`,
            () => {
                emp.jurosAcumulados = 0;
                if (!emp.historicoPagamentos) emp.historicoPagamentos = [];
                emp.historicoPagamentos.push({
                    tipo: 'cancelamento',
                    valor: valor,
                    data: new Date().toISOString().split('T')[0],
                    saldoJurosApos: 0
                });
                salvarDados();
                renderizar();
                mostrarStatus(`Juros de ${formatarMoeda(valor)} cancelados.`, 'success');
            },
            'Cancelar Juros', 'Cancelar Juros', '#e67e22'
        );
    }

    function removerHistorico(empId, idx) {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(empId));
        if (!emp || !emp.historicoPagamentos) return;
        const h = emp.historicoPagamentos[idx];
        if (!h) return;

        const tipo = h.tipo;
        const valor = h.valor;
        const desc = tipo === 'juros_gerado' ? `juros gerados de ${formatarMoeda(valor)}`
                   : tipo === 'juros'        ? `pagamento de juros de ${formatarMoeda(valor)}`
                   : tipo === 'parcela'      ? `parcela ${h.numeroParcela || ''} de ${formatarMoeda(valor)}`
                   : `amortização de ${formatarMoeda(valor)}`;

        confirmar(
            `Remover ${desc}? Isso vai reverter o efeito desta operação nos saldos.`,
            () => {
                if (tipo === 'juros_gerado') {
                    emp.jurosAcumulados = Math.max(0, (emp.jurosAcumulados || 0) - valor);
                } else if (tipo === 'juros') {
                    emp.jurosAcumulados = (emp.jurosAcumulados || 0) + valor;
                } else if (tipo === 'amortizacao' || tipo === 'parcela') {
                    emp.principal = (emp.principal || 0) + valor;
                    emp.totalAmortizado = Math.max(0, (emp.totalAmortizado || 0) - valor);
                    if (tipo === 'parcela' && h.numeroParcela) {
                        emp.parcelasPagas = Math.max(0, (emp.parcelasPagas || 0) - 1);
                    }
                }
                emp.historicoPagamentos.splice(idx, 1);
                salvarDados();
                renderizar();
                mostrarStatus('Entrada removida e saldo revertido.', 'success');
            },
            'Remover Entrada', 'Remover', '#ff6b5b'
        );
    }

    function gerarJurosMes(id) {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(id));
        if (!emp || emp.principal <= 0) return;

        const valorJuros = (emp.principal * emp.taxaJuros) / 100;
        emp.jurosAcumulados = (emp.jurosAcumulados || 0) + valorJuros;
        
        emp.historico.push({
            tipo: 'juros_gerado',
            valor: valorJuros,
            data: new Date().toISOString(),
            mesRef: getMesAnoKey()
        });

        // Registrar no histórico de exibição como juros PENDENTES (não pagos)
        if (!emp.historicoPagamentos) emp.historicoPagamentos = [];
        emp.historicoPagamentos.push({
            tipo: 'juros_gerado',
            valor: valorJuros,
            data: new Date().toISOString().split('T')[0],
            pago: false,
            saldoJurosApos: emp.jurosAcumulados
        });

        salvarDados();
        renderizar();
        mostrarStatus(`Juros de ${formatarMoeda(valorJuros)} adicionados`, 'success');
    }

    // Pagar Juros (NÃO reduz principal)
    function abrirModalPagarJuros(id) {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(id));
        if (!emp) return;

        emprestimoSelecionado = id;
        const body = document.getElementById('modalPagarJurosBody');
        body.innerHTML = `
            <div class="info-box warning">
                Este pagamento <strong>NÃO</strong> reduz a dívida principal. Apenas quita os juros acumulados.
            </div>
            <div class="info-box" style="background:rgba(251,226,180,0.1);border-color:rgba(251,226,180,0.3)">
                <strong>Juros Acumulados:</strong> ${formatarMoeda(emp.jurosAcumulados || 0)}
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Valor a Pagar</label>
                    <input type="number" id="pagarJurosValor" step="0.01" value="${emp.jurosAcumulados || ''}">
                </div>
                <div class="form-group">
                    <label>Data</label>
                    <input type="date" id="pagarJurosData" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Comprovante (opcional)</label>
                    <input type="file" id="pagarJurosComprovante" accept="image/*,.pdf">
                </div>
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalPagarJuros')">Cancelar</button>
                <button class="btn-salvar" onclick="confirmarPagarJuros()">Confirmar</button>
            </div>
        `;
        abrirModal('modalPagarJuros');
    }

    async function confirmarPagarJuros() {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(emprestimoSelecionado));
        if (!emp) return;

        const valor = parseFloat(document.getElementById('pagarJurosValor').value) || 0;
        const data = document.getElementById('pagarJurosData').value;

        if (!valor || valor <= 0) { mostrarStatus('Informe o valor!', 'error'); return; };

        // Criar comprovante com metadados completos
        const fileInput = document.getElementById('pagarJurosComprovante');
        const comprovante = await criarComprovante(
            fileInput, 
            'juros', 
            valor, 
            emp.descricao + ' - Pagamento de Juros'
        );

        emp.jurosAcumulados = Math.max(0, (emp.jurosAcumulados || 0) - valor);
        emp.totalJurosPagos = (emp.totalJurosPagos || 0) + valor;

        emp.historico.push({
            tipo: 'pagamento_juros',
            valor: valor,
            data: data,
            comprovante: comprovante,
            jurosRestantes: emp.jurosAcumulados
        });

        // Adicionar ao histórico de pagamentos para exibição
        if (!emp.historicoPagamentos) emp.historicoPagamentos = [];
        emp.historicoPagamentos.push({
            tipo: 'juros',
            valor: valor,
            data: data,
            saldoApos: emp.principal
        });

        salvarDados();
        fecharModal('modalPagarJuros');
        renderizar();
        mostrarStatus('Juros pagos: ' + formatarMoeda(valor), 'success');
    }

    // Amortizar (REDUZ principal)
    function abrirModalAmortizar(id) {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(id));
        if (!emp) return;

        emprestimoSelecionado = id;
        const body = document.getElementById('modalAmortizarBody');
        body.innerHTML = `
            <div class="info-box info">
                Este pagamento <strong>REDUZ</strong> o valor da dívida principal.
            </div>
            <div class="info-box" style="background:rgba(90,169,240,0.1);border-color:rgba(90,169,240,0.3)">
                <strong>Saldo Devedor:</strong> ${formatarMoeda(emp.principal)}
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Valor a Amortizar</label>
                    <input type="number" id="amortizarValor" step="0.01" placeholder="0,00">
                </div>
                <div class="form-group">
                    <label>Data</label>
                    <input type="date" id="amortizarData" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Comprovante (opcional)</label>
                    <input type="file" id="amortizarComprovante" accept="image/*,.pdf">
                </div>
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalAmortizar')">Cancelar</button>
                <button class="btn-salvar" onclick="confirmarAmortizar()">Confirmar</button>
            </div>
        `;
        document.querySelector('#modalAmortizar .modal-header h3').textContent = 'Amortizar Dívida';
        abrirModal('modalAmortizar');
    }

    async function confirmarAmortizar() {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(emprestimoSelecionado));
        if (!emp) return;

        const valor = parseFloat(document.getElementById('amortizarValor').value) || 0;
        const data = document.getElementById('amortizarData').value;

        if (!valor || valor <= 0) { mostrarStatus('Informe o valor!', 'error'); return; };
        if (valor > emp.principal) { mostrarStatus('Valor maior que a dívida atual!', 'error'); return; };

        // Criar comprovante com metadados completos
        const fileInput = document.getElementById('amortizarComprovante');
        const comprovante = await criarComprovante(
            fileInput, 
            'amortizacao', 
            valor, 
            emp.descricao + ' - Amortização'
        );

        emp.principal = emp.principal - valor;
        emp.totalAmortizado = (emp.totalAmortizado || 0) + valor;

        emp.historico.push({
            tipo: 'amortizacao',
            valor: valor,
            data: data,
            comprovante: comprovante,
            saldoRestante: emp.principal
        });

        // Adicionar ao histórico de pagamentos para exibição
        if (!emp.historicoPagamentos) emp.historicoPagamentos = [];
        emp.historicoPagamentos.push({
            tipo: 'amortizacao',
            valor: valor,
            data: data,
            saldoApos: emp.principal
        });

        // Arquivar automaticamente se quitado
        if (emp.principal <= 0 && (emp.jurosAcumulados || 0) <= 0) {
            emp.arquivado = true;
            emp.arquivadoEm = new Date().toISOString();
            financeiro.arquivados.emprestimos.push(emp);
            mostrarStatus('Dívida quitada e arquivada!', 'success');
        } else {
            mostrarStatus('Amortização: ' + formatarMoeda(valor), 'success');
        }

        salvarDados();
        fecharModal('modalAmortizar');
        renderizar();
    }

    // ==========================================
    // EMPRÉSTIMOS PARCELADOS — pagar parcela
    // ==========================================

    // Abre o modal de Amortizar pré-configurado para "Pagar Parcela":
    // valor sugerido = valor da parcela, data sugerida = próximo vencimento.
    function abrirModalPagarParcela(id) {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(id));
        if (!emp || !emp.parcelado || emp.arquivado) return;

        emprestimoSelecionado = id;
        const numeroParcela = (emp.parcelasPagas || 0) + 1;
        const valorSugerido = Math.min(emp.valorParcela || 0, emp.principal || 0);

        const body = document.getElementById('modalAmortizarBody');
        body.innerHTML = `
            <div class="info-box info">
                Registra o pagamento da parcela <strong>${numeroParcela}/${emp.totalParcelas}</strong>.
                O valor é abatido do saldo devedor e a próxima parcela é avançada automaticamente.
            </div>
            <div class="info-box" style="background:rgba(90,169,240,0.1);border-color:rgba(90,169,240,0.3)">
                <strong>Saldo Devedor:</strong> ${formatarMoeda(emp.principal)}
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Valor da Parcela</label>
                    <input type="number" id="amortizarValor" step="0.01" value="${valorSugerido.toFixed(2)}">
                </div>
                <div class="form-group">
                    <label>Data do Pagamento</label>
                    <input type="date" id="amortizarData" value="${emp.proximaParcelaData || new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Comprovante (opcional)</label>
                    <input type="file" id="amortizarComprovante" accept="image/*,.pdf">
                </div>
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalAmortizar')">Cancelar</button>
                <button class="btn-salvar" onclick="confirmarPagarParcela()">Confirmar Pagamento</button>
            </div>
        `;
        document.querySelector('#modalAmortizar .modal-header h3').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-1px;margin-right:3px"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Pagar Parcela';
        abrirModal('modalAmortizar');
    }

    async function confirmarPagarParcela() {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(emprestimoSelecionado));
        if (!emp || !emp.parcelado) return;

        const valorInformado = parseFloat(document.getElementById('amortizarValor').value) || 0;
        const data = document.getElementById('amortizarData').value;

        if (!valorInformado || valorInformado <= 0) { mostrarStatus('Informe o valor!', 'error'); return; };

        // Não deixa o saldo ficar negativo: a última parcela "real" pode ser
        // menor que o valor cadastrado caso o saldo já esteja mais baixo
        // (por amortizações extras feitas separadamente).
        const valorAplicado = Math.min(valorInformado, emp.principal || 0);

        const numeroParcela = (emp.parcelasPagas || 0) + 1;

        // Criar comprovante com metadados completos
        const fileInput = document.getElementById('amortizarComprovante');
        const comprovante = await criarComprovante(
            fileInput,
            'amortizacao',
            valorAplicado,
            `${emp.descricao} - Parcela ${numeroParcela}/${emp.totalParcelas}`
        );

        emp.principal = Math.max(0, (emp.principal || 0) - valorAplicado);
        emp.totalAmortizado = (emp.totalAmortizado || 0) + valorAplicado;
        emp.parcelasPagas = numeroParcela;
        if (emp.diaVencimento) {
            emp.proximaParcelaData = avancarUmMes(emp.proximaParcelaData || calcularProximaParcelaData(emp.diaVencimento), emp.diaVencimento);
        }

        emp.historico.push({
            tipo: 'parcela_paga',
            valor: valorAplicado,
            data: data,
            comprovante: comprovante,
            saldoRestante: emp.principal,
            parcela: numeroParcela,
            totalParcelas: emp.totalParcelas
        });

        // Adicionar ao histórico de pagamentos para exibição
        if (!emp.historicoPagamentos) emp.historicoPagamentos = [];
        emp.historicoPagamentos.push({
            tipo: 'parcela',
            valor: valorAplicado,
            data: data,
            numeroParcela: numeroParcela,
            totalParcelas: emp.totalParcelas,
            saldoApos: emp.principal
        });

        let msg = `Parcela ${numeroParcela}/${emp.totalParcelas} paga: ${formatarMoeda(valorAplicado)}`;

        // Arquivar automaticamente se quitado (saldo zerado, juros zerados, ou todas as parcelas pagas)
        const quitado = (emp.principal <= 0 && (emp.jurosAcumulados || 0) <= 0) || emp.parcelasPagas >= emp.totalParcelas;
        if (quitado) {
            emp.principal = 0;
            emp.arquivado = true;
            emp.arquivadoEm = new Date().toISOString();
            financeiro.arquivados.emprestimos.push(emp);
            msg = '🎉 Última parcela paga! Dívida quitada e arquivada.';
        }

        salvarDados();
        fecharModal('modalAmortizar');
        renderizar();
        mostrarStatus(msg, 'success');
    }

    function toggleAccordion(detailId, rowEl) {
        const detail = document.getElementById(detailId);
        const chev = document.getElementById('chev-' + detailId);
        if (!detail) return;
        const isOpen = detail.style.display === 'table-row';
        detail.style.display = isOpen ? 'none' : 'table-row';
        if (chev) chev.classList.toggle('open', !isOpen);
    }

    function toggleHistoricoEmprestimo(id) {
        const lista = document.getElementById('historico-emp-' + id);
        if (lista) {
            lista.style.display = lista.style.display === 'none' ? 'block' : 'none';
        }
    }

    function editarEmprestimo(id) {
        id = isNaN(id) ? id : Number(id);
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(id));
        if (!emp) return;

        emprestimoSelecionado = id;
        const body = document.getElementById('modalEditarBody');
        body.innerHTML = `
            <div class="info-box warning">
                Alterações no principal não afetam o histórico de pagamentos.
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Credor / Descrição</label>
                    <input type="text" id="editEmpDescricao" value="${emp.descricao}">
                </div>
                <div class="form-group">
                    <label>Valor Principal</label>
                    <input type="number" id="editEmpPrincipal" step="0.01" value="${emp.principal}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Taxa de Juros (%)</label>
                    <input type="number" id="editEmpJuros" step="0.1" value="${emp.taxaJuros}">
                </div>
                <div class="form-group">
                    <label>Categoria</label>
                    <input type="text" id="editEmpCategoria" value="${emp.categoria}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group form-group-checkbox">
                    <label class="checkbox-label">
                        <input type="checkbox" id="editEmpParcelado" ${emp.parcelado ? 'checked' : ''} onchange="toggleEmprestimoParcelasField('editEmpParcelado')">
                        <span>Pagamento em Parcelas Fixas?</span>
                    </label>
                </div>
            </div>
            <div class="form-row toggle-editEmpParcelado${emp.parcelado ? '' : ' hidden'}">
                <div class="form-group">
                    <label>Total de Parcelas</label>
                    <input type="number" id="editEmpTotalParcelas" min="1" max="600" value="${emp.totalParcelas || ''}">
                </div>
                <div class="form-group">
                    <label>Parcelas já Pagas</label>
                    <input type="number" id="editEmpParcelasPagas" min="0" value="${emp.parcelasPagas || 0}">
                </div>
            </div>
            <div class="form-row toggle-editEmpParcelado${emp.parcelado ? '' : ' hidden'}">
                <div class="form-group">
                    <label>Valor da Parcela</label>
                    <input type="number" id="editEmpValorParcela" step="0.01" value="${emp.valorParcela || ''}">
                </div>
                <div class="form-group">
                    <label>Dia de Vencimento</label>
                    <input type="number" id="editEmpDiaVencimento" min="1" max="31" value="${emp.diaVencimento || ''}">
                </div>
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                <button class="btn-salvar" onclick="salvarEdicaoEmprestimo()">Salvar</button>
            </div>
        `;
        document.querySelector('#modalEditar .modal-header h3').textContent = 'Editar Empréstimo';
        abrirModal('modalEditar');
    }

    function salvarEdicaoEmprestimo() {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(emprestimoSelecionado));
        if (!emp) return;

        // 1) Ler todos os valores do formulário primeiro (sem mutar `emp` ainda)
        const novaDescricao = document.getElementById('editEmpDescricao').value.trim();
        const novoPrincipal = parseFloat(document.getElementById('editEmpPrincipal').value) || emp.principal;
        const novaTaxa = parseFloat(document.getElementById('editEmpJuros').value) || emp.taxaJuros;
        const novaCategoria = document.getElementById('editEmpCategoria').value;

        const parcelado = document.getElementById('editEmpParcelado')?.checked || false;
        let totalParcelas, parcelasPagas, valorParcela, novoDia;

        // 2) Validar ANTES de tocar em `emp` — se algo for inválido, nada é alterado
        if (parcelado) {
            totalParcelas = parseInt(document.getElementById('editEmpTotalParcelas')?.value) || 0;
            parcelasPagas = parseInt(document.getElementById('editEmpParcelasPagas')?.value) || 0;
            valorParcela = parseFloat(document.getElementById('editEmpValorParcela')?.value) || 0;
            novoDia = parseInt(document.getElementById('editEmpDiaVencimento')?.value) || 0;

            if (totalParcelas < 1 || valorParcela <= 0 || novoDia < 1 || novoDia > 31) {
                { mostrarStatus('Para empréstimo parcelado, informe total de parcelas, valor da parcela e dia de vencimento (1-31).', 'error'); return; }
            }
            if (parcelasPagas > totalParcelas) {
                { mostrarStatus('Parcelas já pagas não pode ser maior que o total de parcelas.', 'error'); return; }
            }
        }

        // 3) Validação passou (ou não é parcelado) — agora sim aplica as mudanças
        emp.descricao = novaDescricao;
        emp.principal = novoPrincipal;
        emp.taxaJuros = novaTaxa;
        emp.categoria = novaCategoria;
        emp.parcelado = parcelado;

        if (parcelado) {
            emp.totalParcelas = totalParcelas;
            emp.parcelasPagas = parcelasPagas;
            emp.valorParcela = valorParcela;

            // Se o dia de vencimento mudou (ou nunca foi definido), recalcula a próxima data
            if (novoDia !== emp.diaVencimento || !emp.proximaParcelaData) {
                emp.proximaParcelaData = calcularProximaParcelaData(novoDia);
            }
            emp.diaVencimento = novoDia;
        }
        // Se desativou o parcelamento, mantém os números antigos guardados (não exclui),
        // apenas deixa de exibir badge/progresso/ação "Pagar Parcela".

        emp.historico.push({
            tipo: 'edicao',
            data: new Date().toISOString(),
            descricao: 'Dados editados manualmente'
        });

        salvarDados();
        fecharModal('modalEditar');
        renderizar();
    }

    function deletarEmprestimo(id) {
        confirmar('Excluir este empréstimo e todo seu histórico?', () => {
            financeiro.emprestimos = financeiro.emprestimos.filter(e => String(e.id) !== String(id));
            salvarDados(); renderizar();
        });
    }

    // Toggle menu de ações
    function toggleMenuAcoes(id) {
        // Fechar todos os outros menus
        document.querySelectorAll('.menu-acoes-dropdown').forEach(menu => {
            if (menu.id !== `menuAcoes-${id}`) {
                menu.classList.remove('active');
            }
        });
        
        const menu = document.getElementById(`menuAcoes-${id}`);
        menu.classList.toggle('active');
    }

    function fecharMenuAcoes() {
        document.querySelectorAll('.menu-acoes-dropdown').forEach(menu => {
            menu.classList.remove('active');
        });
    }

    // Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.menu-acoes-container')) {
            fecharMenuAcoes();
        }
    });

    // Iniciar processo de exclusão com modal
    function iniciarExclusaoEmprestimo(id, teveMovimentacao) {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(id));
        if (!emp) return;

        itemEditando = { tipo: 'excluirEmprestimo', id: id };

        const body = document.getElementById('modalExcluirBody');
        
        // Texto de aviso baseado se teve movimentação
        const avisoTexto = teveMovimentacao 
            ? `Esta dívida possui histórico de movimentações (juros pagos e/ou amortizações). 
               Ao excluir, você perderá todo o registro financeiro, incluindo comprovantes anexados.`
            : `Esta dívida não possui movimentações registradas. 
               Ideal para remover cadastros duplicados ou erros de digitação.`;

        const avisoTipo = teveMovimentacao ? 'Atenção: Dívida com histórico' : 'Dívida sem movimentações';

        body.innerHTML = `
            <div class="exclusao-aviso">
                <div class="exclusao-aviso-icon">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    ${avisoTipo}
                </div>
                <p>${avisoTexto}</p>
            </div>

            <div class="exclusao-info">
                <div class="exclusao-info-item">
                    <label>Descrição</label>
                    <span>${emp.descricao}</span>
                </div>
                <div class="exclusao-info-item">
                    <label>Valor Original</label>
                    <span>${formatarMoeda(emp.principalOriginal)}</span>
                </div>
                <div class="exclusao-info-item">
                    <label>Total Juros Pagos</label>
                    <span>${formatarMoeda(emp.totalJurosPagos || 0)}</span>
                </div>
                <div class="exclusao-info-item">
                    <label>Total Amortizado</label>
                    <span>${formatarMoeda(emp.totalAmortizado || 0)}</span>
                </div>
                <div class="exclusao-info-item">
                    <label>Comprovantes</label>
                    <span>${(emp.historico || []).filter(h => h.comprovante).length} anexo(s)</span>
                </div>
            </div>

            <div class="exclusao-confirmacao">
                <label>
                    <input type="checkbox" id="checkConfirmaExclusao" onchange="habilitarBotaoExclusao()">
                    <span>Entendo que esta ação é <strong>irreversível</strong> e removerá permanentemente esta dívida, 
                    todo seu histórico e comprovantes do sistema.</span>
                </label>
            </div>

            <button class="btn-excluir-final" id="btnExcluirFinal" onclick="confirmarExclusaoEmprestimo()">
                Excluir Permanentemente
            </button>
        `;

        abrirModal('modalExcluir');
    }

    function habilitarBotaoExclusao() {
        const checkbox = document.getElementById('checkConfirmaExclusao');
        const btn = document.getElementById('btnExcluirFinal');
        
        if (!checkbox || !btn) return;
        
        if (checkbox.checked) {
            btn.classList.add('ativo');
        } else {
            btn.classList.remove('ativo');
        }
    }

    function confirmarExclusaoEmprestimo() {
        const checkbox = document.getElementById('checkConfirmaExclusao');
        if (!checkbox || !checkbox.checked) {
                        return;
        }

        if (!itemEditando || !itemEditando.id) {
                        return;
        }

        const idExcluir = itemEditando.id;
                
        financeiro.emprestimos = financeiro.emprestimos.filter(e => String(e.id) !== String(idExcluir));
        
        salvarDados();
        fecharModal('modalExcluir');
        renderizar();
        mostrarStatus('Dívida excluída permanentemente', 'success');
    }

    // Restaurar empréstimo arquivado (desfazer quitação)
    function restaurarEmprestimo(id) {
        const emp = financeiro.emprestimos.find(e => String(e.id) === String(id));
        if (!emp) return;
        confirmar(
            `Restaurar "${emp.descricao}"? A dívida voltará para a lista ativa. Saldo: ${formatarMoeda(emp.principal || 0)}`,
            () => {
                emp.arquivado = false;
                emp.arquivadoEm = null;
                salvarDados(); renderizar();
                mostrarStatus('Dívida restaurada para lista ativa', 'success');
            },
            'Restaurar Dívida', 'Restaurar', '#4bc978'
        );
    }

    // ==========================================
    // RESERVAS / ECONOMIAS
    // ==========================================
    
    function salvarEconomia() {
        const desc = document.getElementById('economiaDescricao').value.trim();
        const valorInicial = parseFloat(document.getElementById('economiaValorInicial').value) || 0;
        const cat = document.getElementById('economiaCategoria').value || 'Reserva';
        
        if (!desc) { mostrarStatus('Informe o nome da reserva!', 'error'); return; };
        
        const novaReserva = {
            id: gerarId(),
            descricao: desc,
            categoria: cat,
            saldo: valorInicial,
            criadaEm: new Date().toISOString(),
            movimentacoes: []
        };
        
        // Se tiver valor inicial, criar movimentação
        if (valorInicial > 0) {
            novaReserva.movimentacoes.push({
                id: gerarId(),
                tipo: 'entrada',
                valor: valorInicial,
                observacao: 'Depósito inicial',
                data: new Date().toISOString()
            });
        }
        
        financeiro.economias.push(novaReserva);
        
        salvarDados();
        esconderForm('economia');
        renderizar();
        mostrarStatus('Reserva criada!', 'success');
    }

    function deletarEconomia(id) {
        const reserva = financeiro.economias.find(e => String(e.id) === String(id));
        if (!reserva) return;
        
        // já tratado via confirmar()
        
        financeiro.economias = financeiro.economias.filter(e => String(e.id) !== String(id));
        salvarDados();
        renderizar();
        mostrarStatus('Reserva excluída', 'success');
    }

    function editarEconomia(id) {
        const item = financeiro.economias.find(e => String(e.id) === String(id));
        if (!item) return;

        itemEditando = { tipo: 'economia', id: id };
        const body = document.getElementById('modalEditarBody');
        body.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Nome da Reserva</label>
                    <input type="text" id="editDescricao" value="${item.descricao}">
                </div>
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="editCategoria">
                        <option value="Reserva" ${item.categoria === 'Reserva' ? 'selected' : ''}>Reserva</option>
                        <option value="Poupança" ${item.categoria === 'Poupança' ? 'selected' : ''}>Poupança</option>
                        <option value="Investimento" ${item.categoria === 'Investimento' ? 'selected' : ''}>Investimento</option>
                        <option value="Objetivo" ${item.categoria === 'Objetivo' ? 'selected' : ''}>Objetivo</option>
                        <option value="Viagem" ${item.categoria === 'Viagem' ? 'selected' : ''}>Viagem</option>
                        <option value="Outros" ${item.categoria === 'Outros' ? 'selected' : ''}>Outros</option>
                    </select>
                </div>
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                <button class="btn-salvar" onclick="salvarEdicaoEconomia()">Salvar</button>
            </div>
        `;
        document.querySelector('#modalEditar .modal-header h3').textContent = 'Editar Reserva';
        abrirModal('modalEditar');
    }

    function salvarEdicaoEconomia() {
        const item = financeiro.economias.find(e => String(e.id) === String(itemEditando.id));
        if (item) {
            item.descricao = document.getElementById('editDescricao').value.trim();
            item.categoria = document.getElementById('editCategoria').value;
            salvarDados();
        }
        fecharModal('modalEditar');
        renderizar();
    }

    // Depositar na reserva
    function depositarReserva(id) {
        const reserva = financeiro.economias.find(e => String(e.id) === String(id));
        if (!reserva) return;

        itemEditando = { tipo: 'depositarReserva', id: id };
        const body = document.getElementById('modalEditarBody');
        body.innerHTML = `
            <div class="info-box" style="margin-bottom: 15px; padding: 15px; background: rgba(95,224,138, 0.1); border-radius: 10px; text-align: center;">
                <div style="font-size: 0.8em; color: rgba(26, 26, 26, 0.65); text-transform: uppercase;">Saldo Atual</div>
                <div style="font-size: 1.8em; font-weight: 600; color: #5fe08a;">${formatarMoeda(reserva.saldo || 0)}</div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Valor do Depósito</label>
                    <input type="number" id="depositoValor" step="0.01" min="0.01" placeholder="0,00" autofocus>
                </div>
                <div class="form-group">
                    <label>Observação (opcional)</label>
                    <input type="text" id="depositoObs" placeholder="Ex: Sobra do mês">
                </div>
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                <button class="btn-salvar" style="background: linear-gradient(135deg, #4bc978 0%, #5fe08a 100%);" onclick="confirmarDeposito()">Depositar</button>
            </div>
        `;
        document.querySelector('#modalEditar .modal-header h3').textContent = 'Depositar em ' + reserva.descricao;
        abrirModal('modalEditar');
    }

    function confirmarDeposito() {
        const reserva = financeiro.economias.find(e => String(e.id) === String(itemEditando.id));
        if (!reserva) return;

        const valor = parseFloat(document.getElementById('depositoValor').value) || 0;
        const obs = document.getElementById('depositoObs').value.trim() || 'Depósito';

        if (valor <= 0) { mostrarStatus('Informe um valor válido!', 'error'); return; };

        // Garantir que movimentacoes existe
        if (!reserva.movimentacoes) reserva.movimentacoes = [];

        reserva.movimentacoes.push({
            id: gerarId(),
            tipo: 'entrada',
            valor: valor,
            observacao: obs,
            data: new Date().toISOString()
        });

        reserva.saldo = (reserva.saldo || 0) + valor;

        salvarDados();
        fecharModal('modalEditar');
        renderizar();
        mostrarStatus(`${formatarMoeda(valor)} depositado!`, 'success');
    }

    // Retirar da reserva
    function retirarReserva(id) {
        const reserva = financeiro.economias.find(e => String(e.id) === String(id));
        if (!reserva) return;

        itemEditando = { tipo: 'retirarReserva', id: id };
        const body = document.getElementById('modalEditarBody');
        body.innerHTML = `
            <div class="info-box" style="margin-bottom: 15px; padding: 15px; background: rgba(95,224,138, 0.1); border-radius: 10px; text-align: center;">
                <div style="font-size: 0.8em; color: rgba(26, 26, 26, 0.65); text-transform: uppercase;">Saldo Disponível</div>
                <div style="font-size: 1.8em; font-weight: 600; color: #5fe08a;">${formatarMoeda(reserva.saldo || 0)}</div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Valor da Retirada</label>
                    <input type="number" id="retiradaValor" step="0.01" min="0.01" max="${reserva.saldo || 0}" placeholder="0,00" autofocus>
                </div>
                <div class="form-group">
                    <label>Motivo (opcional)</label>
                    <input type="text" id="retiradaObs" placeholder="Ex: Emergência">
                </div>
            </div>
            <div class="form-buttons">
                <button class="btn-cancelar" onclick="fecharModal('modalEditar')">Cancelar</button>
                <button class="btn-salvar" style="background: linear-gradient(135deg, #e05244 0%, #ff6b5b 100%);" onclick="confirmarRetirada()">Retirar</button>
            </div>
        `;
        document.querySelector('#modalEditar .modal-header h3').textContent = 'Retirar de ' + reserva.descricao;
        abrirModal('modalEditar');
    }

    function confirmarRetirada() {
        const reserva = financeiro.economias.find(e => String(e.id) === String(itemEditando.id));
        if (!reserva) return;

        const valor = parseFloat(document.getElementById('retiradaValor').value) || 0;
        const obs = document.getElementById('retiradaObs').value.trim() || 'Retirada';

        if (valor <= 0) { mostrarStatus('Informe um valor válido!', 'error'); return; };
        if (valor > (reserva.saldo || 0)) { mostrarStatus('Saldo insuficiente!', 'error'); return; };

        // Garantir que movimentacoes existe
        if (!reserva.movimentacoes) reserva.movimentacoes = [];

        reserva.movimentacoes.push({
            id: gerarId(),
            tipo: 'saida',
            valor: valor,
            observacao: obs,
            data: new Date().toISOString()
        });

        reserva.saldo = (reserva.saldo || 0) - valor;

        salvarDados();
        fecharModal('modalEditar');
        renderizar();
        mostrarStatus(`${formatarMoeda(valor)} retirado`, 'success');
    }

    // Toggle histórico da reserva
    function toggleHistoricoReserva(id) {
        const header = document.querySelector(`#reserva-${id} .reserva-historico-header`);
        const lista = document.querySelector(`#reserva-${id} .reserva-historico-lista`);
        
        if (header && lista) {
            header.classList.toggle('expanded');
            lista.classList.toggle('expanded');
        }
    }

    // ==========================================
    // RENDERIZAÇÃO
    // ==========================================
    

    // ── HELPERS PREMIUM DE DESPESAS ──
    function getCategIcon(cat) {
        const icons = {
            'Moradia':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
            'Alimentação':   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
            'Transporte':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
            'Saúde':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
            'Plano de Saúde':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
            'Educação':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
            'Escola':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
            'Lazer':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-3.92-8.32-4.48-14.17-1.84"/></svg>',
            'Internet':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
            'Energia':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            'Água':          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
            'Streaming':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
            'Assinaturas':   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
            'Dívidas':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
            'Cartão':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
            'Compras':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
        };
        return icons[cat] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
    }

    function getStatusBadge(pago, vencido) {
        if (pago)    return '<span class="desp-badge pago"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px;vertical-align:-1px;margin-right:3px"><polyline points="20 6 9 17 4 12"/></svg>Pago</span>';
        if (vencido) return '<span class="desp-badge vencido"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px;vertical-align:-1px;margin-right:3px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Vencido</span>';
        return '<span class="desp-badge pendente">Pendente</span>';
    }


    /* Botão de comprovante — só renderiza se o lançamento tiver anexo */
    function btnComprovante(fn, id) {
        return `<button class="acc-delete-btn btn-comprovante" onclick="event.stopPropagation();${fn}('${id}')" title="Ver comprovante" style="color:rgba(70,240,210,0.75);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
        </button>`;
    }

    function buildDespCard(opts) {
        // Gera tanto a linha de tabela (desktop) quanto o card (mobile)
        // opts: { id, descricao, categoria, data, pago, vencido, valor, extra, acoes, detailId, detailBody, onclick, progresso }
        const badge   = getStatusBadge(opts.pago, opts.vencido);
        const icon    = getCategIcon(opts.categoria || 'Outros');
        const dataFmt = opts.data || '—';
        const cor     = opts.pago ? 'var(--green)' : opts.vencido ? 'var(--red)' : 'var(--text-sub)';
        const bordaL  = opts.vencido ? '3px solid var(--red)' : opts.pago ? '3px solid var(--green)' : '3px solid transparent';
        const progBar = opts.progresso !== undefined ? `
            <div class="desp-prog-wrap">
                <div class="desp-prog-bar" style="width:${opts.progresso}%;background:#5fe08a"></div>
            </div>` : '';

        // ── LINHA DESKTOP ──
        const tr = `
            <tr class="acc-row desp-tr${opts.vencido?' desp-vencida':''}${opts.pago?' desp-paga':''}" style="border-left:${bordaL}">
                <td style="cursor:pointer;padding-left:8px;" onclick="toggleAccordion('${opts.detailId}')">
                    <span class="acc-chevron" id="chev-${opts.detailId}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                </td>
                <td class="acc-descricao" style="cursor:pointer;" onclick="toggleAccordion('${opts.detailId}')">
                    <div style="display:flex;flex-direction:column;gap:2px;">
                        <span style="font-weight:600;">${opts.descricao}${opts.extra||''}</span>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="display:inline-flex;align-items:center;gap:4px;color:var(--text-dim);font-size:0.65em;font-weight:600;letter-spacing:.5px;text-transform:uppercase;">
                                ${icon}<span>${opts.categoria||'Outros'}</span>
                            </span>
                            ${progBar}
                        </div>
                    </div>
                </td>
                <td class="acc-mobile-meta" style="white-space:nowrap;font-size:0.78em;color:var(--text-sub);">${dataFmt}</td>
                <td class="acc-mobile-meta">${badge}</td>
                <td style="text-align:right;font-weight:700;color:${cor};white-space:nowrap;">${formatarMoeda(opts.valor)}</td>
                <td onclick="event.stopPropagation()"><div style="display:flex;gap:4px;">${opts.acoes||''}</div></td>
            </tr>
            <tr class="acc-detail-row" id="${opts.detailId}" style="display:none;">
                <td colspan="6" style="padding:0;">${opts.detailBody||'<div style="padding:12px 20px;color:var(--text-dim);font-size:.8em;">Sem detalhes.</div>'}</td>
            </tr>`;

        // ── CARD MOBILE ──
        const card = `
            <div class="desp-card${opts.vencido?' desp-card-vencida':''}${opts.pago?' desp-card-paga':''}" style="border-left:${bordaL}">
                <div class="desp-card-top" onclick="${opts.onclick||''}">
                    <div class="desp-card-icon">${icon}</div>
                    <div class="desp-card-info">
                        <div class="desp-card-nome">${opts.descricao}${opts.extra||''}</div>
                        <div class="desp-card-meta">${opts.categoria||'Outros'} · ${dataFmt}</div>
                        ${progBar}
                    </div>
                    <div class="desp-card-right">
                        <div class="desp-card-valor" style="color:${cor};">${formatarMoeda(opts.valor)}</div>
                        ${badge}
                    </div>
                </div>
                ${opts.detailBody ? `<div class="desp-card-detail" id="mob-${opts.detailId}" style="display:none;">${opts.detailBody}</div>` : ''}
                <div class="desp-card-acoes" onclick="event.stopPropagation()">${opts.acoes||''}</div>
            </div>`;

        return { tr, card };
    }



    // ══════════════════════════════════════════════
    //  SISTEMA DE LOG DE ERROS — ZARA DEBUG
    // ══════════════════════════════════════════════
    const _erros = [];
    const _erroOriginal = window.onerror;
    window.onerror = function(msg, url, linha, col, erro) {
        const entry = {
            ts: new Date().toLocaleTimeString('pt-BR'),
            msg: String(msg).replace(/.*Error:\s*/,''),
            local: (url||'').split('financeiro.js')[1] || url || '',
            linha,
            stack: erro?.stack?.split('\n').slice(0,3).join(' | ') || ''
        };
        _erros.unshift(entry);
        if (_erros.length > 30) _erros.pop();
        _atualizarBadgeErros();
        if (_erroOriginal) _erroOriginal.apply(this, arguments);
        return false;
    };
    window.addEventListener('unhandledrejection', (e) => {
        const entry = {
            ts: new Date().toLocaleTimeString('pt-BR'),
            msg: 'Promise: ' + String(e.reason?.message || e.reason || '').slice(0,120),
            local: 'async', linha: '-', stack: ''
        };
        _erros.unshift(entry);
        if (_erros.length > 30) _erros.pop();
        _atualizarBadgeErros();
    });

    function _atualizarBadgeErros() {
        const badge = document.getElementById('zara-err-badge');
        if (badge) {
            badge.textContent = _erros.length;
            badge.style.display = _erros.length > 0 ? 'flex' : 'none';
        }
    }

    function abrirLogErros() {
        let modal = document.getElementById('zara-log-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'zara-log-modal';
            modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:999999;padding:20px;overflow:auto;';
            modal.onclick = (e) => { if(e.target===modal) modal.style.display='none'; };
            document.body.appendChild(modal);
        }

        const rows = _erros.length === 0
            ? '<div style="color:rgba(255,255,255,0.4);padding:20px;text-align:center;">Nenhum erro registrado ✓</div>'
            : _erros.map((e,i) => `
                <div style="border-bottom:1px solid rgba(255,255,255,0.06);padding:12px 0;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="background:rgba(255,107,91,0.15);color:#ff6b6b;padding:2px 8px;border-radius:6px;font-size:0.7em;font-weight:700;">#${_erros.length - i}</span>
                        <span style="color:rgba(255,255,255,0.4);font-size:0.7em;">${e.ts} ${e.local ? '· ' + e.local : ''} ${e.linha ? 'L' + e.linha : ''}</span>
                    </div>
                    <div style="color:#ffffff;font-size:0.85em;font-weight:600;margin-bottom:4px;">${e.msg}</div>
                    ${e.stack ? `<div style="color:rgba(255,255,255,0.4);font-size:0.68em;font-family:monospace;white-space:pre-wrap;">${e.stack}</div>` : ''}
                </div>`).join('');

        modal.innerHTML = `
            <div style="background:#0e0e0e;border:1px solid rgba(255,107,91,0.3);border-radius:16px;max-width:720px;margin:0 auto;padding:24px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <div>
                        <h2 style="color:#ff6b5b;font-size:0.9em;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin:0;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:-2px;margin-right:6px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            Log de Erros ZARA
                        </h2>
                        <div style="color:rgba(255,255,255,0.4);font-size:0.72em;margin-top:4px;">${_erros.length} erro(s) desde o carregamento da página</div>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button onclick="_erros.length=0;_atualizarBadgeErros();abrirLogErros();" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);padding:6px 12px;border-radius:8px;font-size:0.75em;cursor:pointer;">Limpar</button>
                        <button onclick="document.getElementById('zara-log-modal').style.display='none'" style="background:rgba(255,107,91,0.1);border:1px solid rgba(255,107,91,0.3);color:#ff6b5b;padding:6px 12px;border-radius:8px;font-size:0.75em;cursor:pointer;">Fechar</button>
                    </div>
                </div>
                <div style="max-height:60vh;overflow-y:auto;">${rows}</div>
            </div>`;
        modal.style.display = 'block';
    }


    function renderizar() {
        if (viewMode === 'arquivados') {
            renderizarArquivados();
            return;
        }

        // ── Atualizar saldo líquido no header ──
        const _recTotal = getReceitasMes().filter(r => r.recebido).reduce((s, r) => s + (r.valor||0), 0);
        const _despTotal = [
            ...getDespesasFixasMes(),
            ...filtrarPorMes(financeiro.despesasVariaveis||[]),
            ...filtrarPorMes(financeiro.despesasAvulsas||[])
        ].reduce((s, d) => s + (d.valor||0), 0);
// header atualizado mais abaixo com previsaoFechamento

        // Restaurar exibição normal (caso venha do modo arquivados)
        const empTableWrapperNormal = document.querySelector('#sectionEmprestimos .table-container');
        const empArqContainerNormal = document.getElementById('emprestimosArquivadosContainer');
        if (empTableWrapperNormal) empTableWrapperNormal.style.display = '';
        if (empArqContainerNormal) { empArqContainerNormal.style.display = 'none'; empArqContainerNormal.innerHTML = ''; }

        // Gerar instâncias de receitas recorrentes
        gerarInstanciasReceitas();

        const receitasMes = getReceitasMes();
        const receitasFixasMesArr = getReceitasFixasMes();
        const receitasVariaveisMesArr = getReceitasVariaveisMes();
        const fixasMes = getDespesasFixasMes();

        // Despesas FIXAS não pagas de meses anteriores
        const keyAtualFixed = getMesAnoKey();
        const fixasAtrasadasAnteriores = Object.keys(financeiro.despesasFixasMes || {})
            .filter(k => k < keyAtualFixed)
            .flatMap(k => (financeiro.despesasFixasMes[k] || []).filter(d => !d.pago && !d.atrasada));
        const variaveisMes = filtrarPorMes(financeiro.despesasVariaveis);
        const avulsasMes = filtrarPorMes(financeiro.despesasAvulsas);
        const emprestimosAtivos = financeiro.emprestimos.filter(e => !e.arquivado);

        // Cálculos do mês (excluindo parcelas pausadas)
        const variaveisAtivas = variaveisMes.filter(d => d.pausado !== true);

        // Despesas variáveis + avulsas em atraso (meses anteriores, não pagas, não pausadas)
        // Aparecem na tabela mas NÃO entram nos cálculos do mês atual
        const keyAtual = getMesAnoKey();
        const todasVariaveisAtraso = [
            ...(financeiro.despesasVariaveis || []),
            ...(financeiro.despesasAvulsas   || [])
        ].filter(d => {
            if (!d.data || d.pago || d.pausado) return false;
            const mesDespesa = d.data.substring(0, 7);
            return mesDespesa < keyAtual;
        });
        // Separar: parceladas em atraso (accordion) e simples em atraso (linha simples)
        const parcelasEmAtraso        = todasVariaveisAtraso.filter(d => d.grupoParcelaId);
        const variaveisNaoPagasAtraso = todasVariaveisAtraso.filter(d => !d.grupoParcelaId);

        // === CÁLCULOS PARA OS KPIs ===
        
        // KPI 1: Receita Total (fixas + variáveis)
        const totalRecFixas = receitasMes.reduce((s, r) => s + r.valor, 0);
        const totalRecVariaveis = receitasVariaveisMesArr.reduce((s, r) => s + r.valor, 0);
        const receitaTotalMes = totalRecFixas + totalRecVariaveis;
        const receitaRecebida = receitasMes.filter(r => r.recebido).reduce((s, r) => s + r.valor, 0) + receitasVariaveisMesArr.filter(r => r.recebido).reduce((s, r) => s + r.valor, 0);
        const receitaPendente = receitaTotalMes - receitaRecebida;
        
        // KPI 2: Despesas Totais (fixas + parceladas + avulsas + empréstimos pagos no mês)
        const totalFixasMes = fixasMes.reduce((s, d) => s + d.valor, 0);
        const totalParceladasMes = variaveisAtivas.reduce((s, d) => s + d.valor, 0);
        // Atrasadas não pagas de meses anteriores entram no total
        const totalAtrasadasAtraso = variaveisNaoPagasAtraso.reduce((s, d) => s + (d.valor || 0), 0);
        // Atrasadas pagas neste mês via botão PAGAR também entram no total
        const _atrasadasPagasEsteMes = (financeiro.despesasAvulsas || [])
            .filter(d => d.pago && d.pagamentoAtrasadaMes === keyAtual
                      && d.data && d.data.substring(0,7) < keyAtual)
            .reduce((s, d) => s + d.valor, 0);
        const totalAvulsasMes = avulsasMes.reduce((s, d) => s + d.valor, 0) + totalAtrasadasAtraso + _atrasadasPagasEsteMes;
        
        // Empréstimos: somar juros pagos + amortizações feitas no mês atual
        const mesAnoAtual = getMesAnoKey();
        let empJurosPagosMes = 0;
        let empAmortizadoMes = 0;
        (financeiro.emprestimos || []).forEach(e => {
            (e.historicoPagamentos || []).forEach(p => {
                if (p.data && p.data.substring(0, 7) === mesAnoAtual) {
                    if (p.tipo === 'juros') {
                        empJurosPagosMes += (p.valor || 0);
                    } else if (p.tipo === 'amortizacao') {
                        empAmortizadoMes += (p.valor || 0);
                    } else {
                        empAmortizadoMes += (p.valor || 0);
                    }
                }
            });
        });
        const totalEmpPagoMes = empJurosPagosMes + empAmortizadoMes;

        // Juros acumulados (gerados mas não pagos) — conta como despesa pendente
        const jurosAcumuladosTotal = emprestimosAtivos.reduce((s, e) => s + (e.jurosAcumulados || 0), 0);

        // Parcelas de financiamentos com vencimento neste mês, ainda não pagas
        const parcelasPendentesInfo = getParcelasPendentesMes();
        const totalParcelasPendentesMes = parcelasPendentesInfo.total;
        const temParcelaAtrasada = parcelasPendentesInfo.detalhes.some(d => d.atrasada);

        // Despesas Totais = fixas + parceladas + avulsas + empréstimos (pagos + juros pendentes + parcelas a vencer)
        const totalEmprestimosMes = totalEmpPagoMes + jurosAcumuladosTotal + totalParcelasPendentesMes;
        const despesasTotaisMes = totalFixasMes + totalParceladasMes + totalAvulsasMes + totalEmprestimosMes;
        
        // Para detalhamento: pagas vs pendentes
        const fixasPagas = fixasMes.filter(d => d.pago).reduce((s, d) => s + d.valor, 0);
        const fixasPendentes = totalFixasMes - fixasPagas;
        const parceladasPagas = variaveisAtivas.filter(d => d.pago).reduce((s, d) => s + d.valor, 0);
        const parceladasPendentes = totalParceladasMes - parceladasPagas;
        // Avulsas pagas — apenas do mês atual (atrasadas não inflam totalPago)
        const avulsasPagas = avulsasMes.filter(d => d.pago).reduce((s, d) => s + d.valor, 0);
        const avulsasPendentes = totalAvulsasMes - avulsasPagas;
        const totalPago = fixasPagas + parceladasPagas + avulsasPagas + totalEmpPagoMes;
        
        // KPI 3: Saldo Disponível (receita recebida - tudo que foi pago incluindo empréstimos)
        const saldoDisponivel = receitaRecebida - totalPago;
        
        // KPI 4: % Comprometido — só mês atual (sem atrasadas de meses anteriores)
        const despesasMesAtual = totalFixasMes + totalParceladasMes +
            avulsasMes.reduce((s, d) => s + d.valor, 0) + totalEmprestimosMes;
        const percentComprometido = receitaTotalMes > 0
            ? Math.round((despesasMesAtual / receitaTotalMes) * 100)
            : 0;
        
        // KPI 5: Economizado (total em reservas)
        const totalEconomizado = (financeiro.economias || []).reduce((s, e) => s + (e.saldo !== undefined ? e.saldo : (e.valor || 0)), 0);
        
        // KPI 6: Previsão Fechamento (receita total - despesas totais)
        const previsaoFechamento = receitaTotalMes - despesasTotaisMes;

        // Header: Previsão de Fechamento = receita total − despesas totais
        const _elSaldoFinal = document.getElementById('headerSaldoLiquido');
        const _elSubFinal   = document.getElementById('headerSaldoSub');
        if (_elSaldoFinal) {
            _elSaldoFinal.textContent = formatarMoeda(Math.abs(previsaoFechamento));
            _elSaldoFinal.className   = 'header-saldo-valor ' + (previsaoFechamento >= 0 ? 'positivo' : 'negativo');
        }
        if (_elSubFinal) {
            _elSubFinal.textContent = previsaoFechamento >= 0
                ? `+ ${formatarMoeda(receitaTotalMes)} rec. − ${formatarMoeda(despesasTotaisMes)} desp. · Saldo atual: +${formatarMoeda(saldoDisponivel)}`
                : `${formatarMoeda(receitaTotalMes)} rec. − ${formatarMoeda(despesasTotaisMes)} desp. · Saldo atual: ${saldoDisponivel >= 0 ? '+' : ''}${formatarMoeda(saldoDisponivel)}`;
        }
        
        // === ATUALIZAR DASHBOARD KPIs ===
        
        // KPI 1: Receita Total — detalhes por fonte
        document.getElementById('kpiReceita').textContent = formatarMoeda(receitaTotalMes);
        const receitaDetalhe = document.getElementById('kpiReceitaDetalhe');
        const recFixasList = receitasMes.map(r =>
            `<span style="display:flex;justify-content:space-between;gap:8px;">
                <span style="color:${r.recebido?'#5fe08a':'inherit'}">${r.descricao || 'Receita'}</span>
                <span style="font-weight:600;">${formatarMoeda(r.valor)}</span>
            </span>`
        ).join('');
        const recVarList = receitasVariaveisMesArr.map(r =>
            `<span style="display:flex;justify-content:space-between;gap:8px;">
                <span style="color:${r.recebido?'#5fe08a':'inherit'}">${r.descricao || 'Variável'}</span>
                <span style="font-weight:600;">${formatarMoeda(r.valor)}</span>
            </span>`
        ).join('');
        receitaDetalhe.innerHTML =
            (recFixasList || recVarList
                ? (recFixasList + recVarList)
                : '<span>Sem receitas no mês</span>') +
            (receitaPendente > 0
                ? `<span style="color:#e67e22;margin-top:4px;display:block;">A receber: ${formatarMoeda(receitaPendente)}</span>`
                : `<span style="color:#5fe08a;margin-top:4px;display:block;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px;margin-right:3px"><polyline points="20 6 9 17 4 12"/></svg> Tudo recebido</span>`);

        // KPI 2: Despesas Totais — breakdown por tipo com pago/pendente
        document.getElementById('kpiDespesas').textContent = formatarMoeda(despesasTotaisMes);
        const pctFixas     = receitaTotalMes > 0 ? Math.round(totalFixasMes/receitaTotalMes*100) : 0;
        const pctParc      = receitaTotalMes > 0 ? Math.round(totalParceladasMes/receitaTotalMes*100) : 0;
        const pctAvulsas   = receitaTotalMes > 0 ? Math.round(totalAvulsasMes/receitaTotalMes*100) : 0;
        const pctEmp       = receitaTotalMes > 0 ? Math.round((totalEmpPagoMes+totalParcelasPendentesMes)/receitaTotalMes*100) : 0;
        document.getElementById('kpiDespesasDetalhe').innerHTML = `
            <span style="display:flex;justify-content:space-between;gap:8px;">
                <span>Fixas ${pctFixas>0?`<small>(${pctFixas}% renda)</small>`:''}</span>
                <span style="font-weight:600;">${formatarMoeda(totalFixasMes)}</span>
            </span>
            ${totalParceladasMes > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                <span>Parceladas ${pctParc>0?`<small>(${pctParc}%)</small>`:''}</span>
                <span style="font-weight:600;">${formatarMoeda(totalParceladasMes)}</span>
            </span>` : ''}
            ${totalAvulsasMes > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                <span>Variáveis ${pctAvulsas>0?`<small>(${pctAvulsas}%)</small>`:''}</span>
                <span style="font-weight:600;">${formatarMoeda(totalAvulsasMes)}</span>
            </span>` : ''}
            ${totalParcelasPendentesMes > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                <span>Empréstimos ${pctEmp>0?`<small>(${pctEmp}%)</small>`:''}</span>
                <span style="font-weight:600;">${formatarMoeda(totalParcelasPendentesMes)}</span>
            </span>` : ''}
            ${empAmortizadoMes > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;color:#5fe08a;">
                <span>Amortização</span>
                <span style="font-weight:600;">${formatarMoeda(empAmortizadoMes)}</span>
            </span>` : ''}
            ${empJurosPagosMes > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                <span>Juros pagos</span>
                <span style="font-weight:600;">${formatarMoeda(empJurosPagosMes)}</span>
            </span>` : ''}
            ${jurosAcumuladosTotal > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;color:#ff6b5b;">
                <span>Juros pendentes</span>
                <span style="font-weight:600;">${formatarMoeda(jurosAcumuladosTotal)}</span>
            </span>` : ''}
            <span style="display:flex;justify-content:space-between;gap:8px;margin-top:4px;padding-top:4px;border-top:1px solid rgba(0,0,0,.08);">
                <span style="color:#5fe08a;">Pago</span>
                <span style="color:#5fe08a;font-weight:600;">${formatarMoeda(fixasPagas+parceladasPagas+avulsasPagas+totalEmpPagoMes)}</span>
            </span>
            ${(fixasPendentes+parceladasPendentes+avulsasPendentes+totalParcelasPendentesMes) > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                <span style="color:#e67e22;">Pendente</span>
                <span style="color:#e67e22;font-weight:600;">${formatarMoeda(fixasPendentes+parceladasPendentes+avulsasPendentes+totalParcelasPendentesMes)}</span>
            </span>` : ''}
        `;
        
        // KPI 3: Saldo Disponível
        const saldoCard = document.getElementById('kpiSaldoCard');
        document.getElementById('kpiSaldo').textContent = formatarMoeda(saldoDisponivel);
        const saldoDetalhe = document.getElementById('kpiSaldoDetalhe');
        saldoCard.classList.toggle('negativo', saldoDisponivel < 0);
        if (saldoDisponivel >= 0) {
            saldoDetalhe.innerHTML = `
                <span style="display:flex;justify-content:space-between;gap:8px;">
                    <span>Receita recebida</span>
                    <span style="font-weight:600;color:#5fe08a;">${formatarMoeda(receitaRecebida)}</span>
                </span>
                <span style="display:flex;justify-content:space-between;gap:8px;">
                    <span>Total pago</span>
                    <span style="font-weight:600;color:#ff6b5b;">-${formatarMoeda(totalPago)}</span>
                </span>
                ${receitaPendente > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;margin-top:4px;padding-top:4px;border-top:1px solid rgba(0,0,0,.08);">
                    <span style="color:#e67e22;">A receber</span>
                    <span style="color:#e67e22;font-weight:600;">+${formatarMoeda(receitaPendente)}</span>
                </span>` : ''}
            `;
        } else {
            saldoDetalhe.innerHTML = `
                <span class="kpi-badge negativo">No vermelho</span>
                <span style="display:flex;justify-content:space-between;gap:8px;margin-top:6px;">
                    <span>Receita recebida</span>
                    <span style="font-weight:600;">${formatarMoeda(receitaRecebida)}</span>
                </span>
                <span style="display:flex;justify-content:space-between;gap:8px;">
                    <span>Total pago</span>
                    <span style="font-weight:600;">-${formatarMoeda(totalPago)}</span>
                </span>
            `;
        }
        
        // KPI 4: % Comprometido — breakdown do que compromete a renda
        const comprometidoCard = document.getElementById('kpiComprometidoCard');
        document.getElementById('kpiComprometido').textContent = `${percentComprometido}%`;
        const badgeComprometido = document.getElementById('kpiBadgeComprometido');
        comprometidoCard.classList.remove('atencao', 'critico');
        if (percentComprometido <= 60) {
            badgeComprometido.textContent = 'Saudável';
            badgeComprometido.className = 'kpi-badge saudavel';
        } else if (percentComprometido <= 80) {
            badgeComprometido.textContent = 'Atenção';
            badgeComprometido.className = 'kpi-badge atencao';
            comprometidoCard.classList.add('atencao');
        } else {
            badgeComprometido.textContent = 'Crítico';
            badgeComprometido.className = 'kpi-badge critico';
            comprometidoCard.classList.add('critico');
        }
        // Adicionar breakdown por tipo abaixo do badge
        const comprDetEl = document.getElementById('kpiComprometidoDetalhe');
        if (comprDetEl) {
            comprDetEl.innerHTML = `
                <span id="kpiBadgeComprometido" class="${badgeComprometido.className}">${badgeComprometido.textContent}</span>
                ${totalFixasMes > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;margin-top:6px;">
                    <span>Fixas</span><span>${pctFixas}% renda</span>
                </span>` : ''}
                ${totalParceladasMes > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                    <span>Parceladas</span><span>${pctParc}% renda</span>
                </span>` : ''}
                ${(totalEmpPagoMes+totalParcelasPendentesMes) > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                    <span>Empréstimos</span><span>${pctEmp}% renda</span>
                </span>` : ''}
            `;
        }
        
        // KPI 5: Economizado — cada reserva por nome e valor
        document.getElementById('kpiEconomia').textContent = formatarMoeda(totalEconomizado);
        const reservasList = (financeiro.economias || []).map(e =>
            `<span style="display:flex;justify-content:space-between;gap:8px;">
                <span>${e.descricao || 'Reserva'}</span>
                <span style="font-weight:600;">${formatarMoeda(e.saldo !== undefined ? e.saldo : (e.valor||0))}</span>
            </span>`
        ).join('');
        document.getElementById('kpiEconomiaDetalhe').innerHTML = reservasList ||
            '<span style="color:rgba(255,255,255,0.55);">Nenhuma reserva ativa</span>';
        
        // KPI 6: Previsão Fechamento — lista o que falta pagar por categoria
        const previsaoCard = document.getElementById('kpiPrevisaoCard');
        document.getElementById('kpiPrevisao').textContent = formatarMoeda(previsaoFechamento);
        const previsaoDetalhe = document.getElementById('kpiPrevisaoDetalhe');
        previsaoCard.classList.remove('negativo');
        const despesasPendentes = fixasPendentes + parceladasPendentes + avulsasPendentes + jurosAcumuladosTotal + totalParcelasPendentesMes;
        if (previsaoFechamento >= 0) {
            if (despesasPendentes > 0) {
                previsaoDetalhe.innerHTML = `
                    ${fixasPendentes > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                        <span style="color:#e67e22;">Fixas pendentes</span>
                        <span style="font-weight:600;">${formatarMoeda(fixasPendentes)}</span>
                    </span>` : ''}
                    ${parceladasPendentes > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                        <span style="color:#e67e22;">Parceladas pendentes</span>
                        <span style="font-weight:600;">${formatarMoeda(parceladasPendentes)}</span>
                    </span>` : ''}
                    ${totalParcelasPendentesMes > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                        <span style="color:${temParcelaAtrasada?'#ff6b5b':'#e67e22'};">Parcelas empréstimo${temParcelaAtrasada?' (atrasadas)':''}</span>
                        <span style="font-weight:600;">${formatarMoeda(totalParcelasPendentesMes)}</span>
                    </span>` : ''}
                    ${avulsasPendentes > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                        <span style="color:#e67e22;">Variáveis pendentes</span>
                        <span style="font-weight:600;">${formatarMoeda(avulsasPendentes)}</span>
                    </span>` : ''}
                    ${jurosAcumuladosTotal > 0 ? `<span style="display:flex;justify-content:space-between;gap:8px;">
                        <span style="color:#ff6b5b;">Juros pendentes</span>
                        <span style="font-weight:600;">${formatarMoeda(jurosAcumuladosTotal)}</span>
                    </span>` : ''}
                    <span style="display:flex;justify-content:space-between;gap:8px;margin-top:4px;padding-top:4px;border-top:1px solid rgba(0,0,0,.08);font-weight:600;">
                        <span>Total pendente</span>
                        <span style="color:#e67e22;">${formatarMoeda(despesasPendentes)}</span>
                    </span>
                `;
            } else {
                previsaoDetalhe.innerHTML = `<span class="kpi-badge positivo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px;margin-right:2px"><polyline points="20 6 9 17 4 12"/></svg> Mês fechado</span>`;
            }
        } else {
            previsaoCard.classList.add('negativo');
            previsaoDetalhe.innerHTML = `
                <span class="kpi-badge negativo">Déficit previsto</span>
                <span style="display:flex;justify-content:space-between;gap:8px;margin-top:6px;">
                    <span>Receita total</span>
                    <span style="font-weight:600;">${formatarMoeda(receitaTotalMes)}</span>
                </span>
                <span style="display:flex;justify-content:space-between;gap:8px;">
                    <span>Despesas totais</span>
                    <span style="font-weight:600;color:#ff6b5b;">${formatarMoeda(despesasTotaisMes)}</span>
                </span>
                <span style="display:flex;justify-content:space-between;gap:8px;">
                    <span>Déficit</span>
                    <span style="font-weight:600;color:#ff6b5b;">${formatarMoeda(previsaoFechamento)}</span>
                </span>
            `;
        }

        // Subtotais — formato: Pago | Total | Pendente
        const recFixasRecebidas = receitasMes.filter(r => r.recebido).reduce((s, r) => s + r.valor, 0);
        const recVarRecebidas = receitasVariaveisMesArr.filter(r => r.recebido).reduce((s, r) => s + r.valor, 0);
        const recFixasPendentes = totalRecFixas - recFixasRecebidas;
        const recVarPendentes = totalRecVariaveis - recVarRecebidas;

        document.getElementById('subtotalReceitasFixas').innerHTML =
            `<span class="sub-pago">Recebido: ${formatarMoeda(recFixasRecebidas)}</span>`+
            `<span class="sub-sep">·</span>`+
            `<span class="sub-total">Total: ${formatarMoeda(totalRecFixas)}</span>`+
            (recFixasPendentes > 0 ? `<span class="sub-sep">·</span><span class="sub-pendente">Pendente: ${formatarMoeda(recFixasPendentes)}</span>` : '');

        document.getElementById('subtotalReceitasVariaveis').innerHTML =
            `<span class="sub-pago">Recebido: ${formatarMoeda(recVarRecebidas)}</span>`+
            `<span class="sub-sep">·</span>`+
            `<span class="sub-total">Total: ${formatarMoeda(totalRecVariaveis)}</span>`+
            (recVarPendentes > 0 ? `<span class="sub-sep">·</span><span class="sub-pendente">Pendente: ${formatarMoeda(recVarPendentes)}</span>` : '');

        document.getElementById('subtotalFixas').innerHTML =
            `<span class="sub-pago">Pago: ${formatarMoeda(fixasPagas)}</span>`+
            `<span class="sub-sep">·</span>`+
            `<span class="sub-total">Total: ${formatarMoeda(totalFixasMes)}</span>`+
            (fixasPendentes > 0 ? `<span class="sub-sep">·</span><span class="sub-pendente">Pendente: ${formatarMoeda(fixasPendentes)}</span>` : '');

        document.getElementById('subtotalVariaveis').innerHTML =
            `<span class="sub-pago">Pago: ${formatarMoeda(parceladasPagas)}</span>`+
            `<span class="sub-sep">·</span>`+
            `<span class="sub-total">Total: ${formatarMoeda(totalParceladasMes)}</span>`+
            (parceladasPendentes > 0 ? `<span class="sub-sep">·</span><span class="sub-pendente">Pendente: ${formatarMoeda(parceladasPendentes)}</span>` : '');

        document.getElementById('subtotalAvulsas').innerHTML =
            `<span class="sub-pago">Pago: ${formatarMoeda(avulsasPagas)}</span>`+
            `<span class="sub-sep">·</span>`+
            `<span class="sub-total">Total: ${formatarMoeda(totalAvulsasMes)}</span>`+
            (avulsasPendentes > 0 ? `<span class="sub-sep">·</span><span class="sub-pendente">Pendente: ${formatarMoeda(avulsasPendentes)}</span>` : '');

        document.getElementById('subtotalEconomias').innerHTML =
            `<span class="sub-total">Total: ${formatarMoeda(totalEconomizado)}</span>`;

        // === TABELA RECEITAS FIXAS ===
        const recFixasTable = document.getElementById('receitasFixasTable');
        document.getElementById('emptyReceitasFixas').style.display = receitasMes.length ? 'none' : 'block';
        recFixasTable.innerHTML = receitasMes.map(r => {
            const recBadge = r.recebido
                ? `<span class="rec-badge rec-badge-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px;vertical-align:-1px;margin-right:2px"><polyline points="20 6 9 17 4 12"/></svg>Recebido</span>`
                : `<span class="rec-badge rec-badge-pend">Pendente</span>`;
            return `<tr class="rec-row${r.recebido?' rec-row-ok':''}">
                <td class="rec-check-td">
                    <button onclick="toggleRecebido(${r.id}, this)" title="${r.recebido ? 'Desmarcar' : 'Marcar recebido'}"
                        style="background:${r.recebido ? '#5fe08a' : 'transparent'};
                               border:1.5px solid #5fe08a;border-radius:6px;
                               padding:3px 8px;cursor:pointer;
                               color:${r.recebido ? '#0a0a0a' : '#5fe08a'};
                               font-size:0.62em;font-weight:800;
                               font-family:inherit;letter-spacing:0.5px;
                               white-space:nowrap;transition:all 0.15s ease;">
                        ${r.recebido ? 'RECEBIDO' : 'RECEBER'}
                    </button>
                </td>
                <td class="rec-nome">${r.descricao}</td>
                <td class="rec-cat-td"><span class="rec-cat">${r.categoria}</span></td>
                <td class="rec-data acc-mobile-meta">${formatarData(r.data)}</td>
                <td class="rec-valor ${r.recebido?'valor-positivo':'valor-pendente'}">${formatarMoeda(r.valor)}</td>
                <td class="rec-badge-td" onclick="event.stopPropagation()">${recBadge}</td>
                <td class="rec-acoes" onclick="event.stopPropagation()">
                    <button class="acc-delete-btn" onclick="editarReceita(${r.id})" title="Editar" style="color:rgba(70,240,210,0.7);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="acc-delete-btn" onclick="deletarReceita(${r.id},${r.modeloId||'null'},${!!r.recorrente})" title="Excluir">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </td>
            </tr>`;
        }).join('');

        // === TABELA RECEITAS VARIÁVEIS ===
        const recVarTable = document.getElementById('receitasVariaveisTable');
        document.getElementById('emptyReceitasVariaveis').style.display = receitasVariaveisMesArr.length ? 'none' : 'block';
        recVarTable.innerHTML = receitasVariaveisMesArr.map(r => {
            const recBadge = r.recebido
                ? `<span class="rec-badge rec-badge-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px;vertical-align:-1px;margin-right:2px"><polyline points="20 6 9 17 4 12"/></svg>Recebido</span>`
                : `<span class="rec-badge rec-badge-pend">Pendente</span>`;
            return `<tr class="rec-row${r.recebido?' rec-row-ok':''}">
                <td class="rec-check-td">
                    <button onclick="toggleRecebido(${r.id}, this)" title="${r.recebido ? 'Desmarcar' : 'Marcar recebido'}"
                        style="background:${r.recebido ? '#5fe08a' : 'transparent'};
                               border:1.5px solid #5fe08a;border-radius:6px;
                               padding:3px 8px;cursor:pointer;
                               color:${r.recebido ? '#0a0a0a' : '#5fe08a'};
                               font-size:0.62em;font-weight:800;
                               font-family:inherit;letter-spacing:0.5px;
                               white-space:nowrap;transition:all 0.15s ease;">
                        ${r.recebido ? 'RECEBIDO' : 'RECEBER'}
                    </button>
                </td>
                <td class="rec-nome">${r.descricao}</td>
                <td class="rec-cat-td"><span class="rec-cat">${r.categoria}</span></td>
                <td class="rec-data acc-mobile-meta">${formatarData(r.data)}</td>
                <td class="rec-valor ${r.recebido?'valor-positivo':'valor-pendente'}">${formatarMoeda(r.valor)}</td>
                <td class="rec-badge-td" onclick="event.stopPropagation()">${recBadge}</td>
                <td class="rec-acoes" onclick="event.stopPropagation()">
                    <button class="acc-delete-btn" onclick="editarReceita(${r.id})" title="Editar" style="color:rgba(70,240,210,0.7);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="acc-delete-btn" onclick="deletarReceita(${r.id})" title="Excluir">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </td>
            </tr>`;
        }).join('');

        // === TABELA DESPESAS FIXAS ===
        const fixasTable = document.getElementById('despesasFixasTable');
        document.getElementById('emptyDespesasFixas').style.display = fixasMes.length ? 'none' : 'block';

        // ── Agrupar por modeloId ──
        const despesasAgrupadas = {};
        fixasMes.forEach(d => {
            if (!despesasAgrupadas[d.modeloId]) despesasAgrupadas[d.modeloId] = { atual: null, atrasadas: [] };
            if (d.atrasada) despesasAgrupadas[d.modeloId].atrasadas.push(d);
            else despesasAgrupadas[d.modeloId].atual = d;
        });

        // ── Montar lista com info de status ──
        let despFixasList = Object.keys(despesasAgrupadas).map(modeloId => {
            const grupo = despesasAgrupadas[modeloId];
            const atual = grupo.atual;
            const atrasadas = grupo.atrasadas;
            if (!atual && atrasadas.length === 0) return null;
            const ref = atual || atrasadas[0];
            const todasPagas = (!atual || atual.pago) && atrasadas.every(a => a.pago);
            const totalPendente = (atual && !atual.pago ? atual.valor : 0) + atrasadas.filter(a => !a.pago).reduce((s,a)=>s+a.valor,0);
            const statusAtual = atual ? getStatusVencimento(atual.data, atual.pago) : { classe: '' };
            const vencido = atrasadas.length > 0 || statusAtual.classe === 'vencido';
            return { modeloId, atual, atrasadas, ref, todasPagas, totalPendente, vencido };
        }).filter(Boolean);

        // ── Ordenar: vencidas → pendentes → pagas ──
        despFixasList.sort((a, b) => {
            const ordemA = a.vencido && !a.todasPagas ? 0 : !a.todasPagas ? 1 : 2;
            const ordemB = b.vencido && !b.todasPagas ? 0 : !b.todasPagas ? 1 : 2;
            if (ordemA !== ordemB) return ordemA - ordemB;
            // dentro do mesmo grupo, ordenar por data de vencimento
            const dataA = a.ref.dia ? parseInt(a.ref.dia) : 99;
            const dataB = b.ref.dia ? parseInt(b.ref.dia) : 99;
            return dataA - dataB;
        });

        // ── Barra de progresso do mês ──
        const totalFixas = despFixasList.length;
        const pagasFixas = despFixasList.filter(d => d.todasPagas).length;
        const pctMes = totalFixas > 0 ? Math.round((pagasFixas / totalFixas) * 100) : 0;

        // ── Agrupar por categoria ──
        const catGrupos = {};
        despFixasList.forEach(d => {
            const cat = d.ref.categoria || 'Outros';
            if (!catGrupos[cat]) catGrupos[cat] = [];
            catGrupos[cat].push(d);
        });

        let htmlFixas = '';
        let htmlMobileFixas = '<div class="desp-cards-wrap">';

        // Barra de progresso global
        const barraHtml = `<tr class="desp-prog-row"><td colspan="6">
            <div class="desp-prog-header">
                <span>${pagasFixas} de ${totalFixas} pagas</span>
                <span>${pctMes}%</span>
            </div>
            <div class="desp-prog-track"><div class="desp-prog-fill" style="width:${pctMes}%;background:${pctMes===100?'var(--green)':'var(--gold)'}"></div></div>
        </td></tr>`;
        htmlFixas += barraHtml;

        Object.keys(catGrupos).forEach(cat => {
            // Cabeçalho de categoria
            const icon = getCategIcon(cat);
            htmlFixas += `<tr class="desp-cat-header"><td colspan="6">
                <span style="display:inline-flex;align-items:center;gap:6px;font-size:0.62em;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim);">
                    ${icon}${cat}
                </span>
            </td></tr>`;
            htmlMobileFixas += `<div class="desp-cat-label">${icon}<span>${cat}</span></div>`;

            catGrupos[cat].forEach(({ modeloId, atual, atrasadas, ref, todasPagas, totalPendente, vencido }) => {
                const detailId = 'detail-fixa-' + modeloId;
                const dataFmt = formatarData(ref.dia ? (getMesAnoKey() + '-' + String(ref.dia).padStart(2,'0')) : ref.data);
                const valor   = todasPagas ? (ref.valor || 0) : totalPendente;
                const extraBadge = atrasadas.length > 0
                    ? `<span class="desp-atraso-badge">${atrasadas.length} em atraso</span>`
                    : '';

                const acoes = `
                    ${atual ? `<button class="acc-delete-btn" onclick="editarValorInstancia(${atual.id},'fixa')" title="Editar valor deste mês" style="color:rgba(95,224,138,0.6);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:15px;height:15px;"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </button>` : ''}
                    <button class="acc-delete-btn" onclick="editarDespesaFixaModelo(${ref.modeloId})" title="Editar modelo" style="color:rgba(70,240,210,0.6);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:15px;height:15px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    ${atual && atual.comprovante ? btnComprovante('verComprovanteFixa', atual.id) : ''}
                    <button class="acc-delete-btn" onclick="encerrarDespesaFixa(${ref.modeloId})" title="Encerrar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>`;

                const detailBody = `<div class="parcelas-detail-box">
                    <div class="parcelas-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));">
                        ${atrasadas.map(d => {
                            const mesOrig = d.data ? d.data.substring(0,7) : d.mesOriginal || keyAtual;
                            return `<div class="parcela-item${d.pago?' pago':' vencida'}">
                                <div class="parcela-check${d.pago?' checked':''}" onclick="togglePagoFixa(${d.id})" style="cursor:pointer;"></div>
                                <div class="parcela-info-box" onclick="togglePagoFixa(${d.id})" style="cursor:pointer;flex:1;">
                                    <div class="parcela-nome" style="color:var(--red)">Em atraso</div>
                                    <div class="parcela-data-txt">${formatarData(d.data)}</div>
                                </div>
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <div class="parcela-valor-txt">${formatarMoeda(d.valor)}</div>
                                    ${!d.pago ? `<button onclick="event.stopPropagation();adiarDespesaAtrasada('${d.id}','${mesOrig}')" title="Adiar para o próximo mês"
                                        style="background:rgba(90,169,240,0.12);border:1px solid rgba(90,169,240,0.3);border-radius:6px;color:#5dade2;padding:3px 6px;cursor:pointer;font-size:0.7em;font-weight:700;display:flex;align-items:center;gap:3px;white-space:nowrap;">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px;"><polyline points="9 18 15 12 9 6"/><polyline points="15 18 21 12 15 6"/></svg>
                                        Adiar
                                    </button>` : ''}
                                </div>
                            </div>`;
                        }).join('')}
                        ${atual ? `
                            <div class="parcela-item${atual.pago?' pago':''}" onclick="togglePagoFixa(${atual.id})">
                                <div class="parcela-check${atual.pago?' checked':''}"></div>
                                <div class="parcela-info-box">
                                    <div class="parcela-nome">Mês atual</div>
                                    <div class="parcela-data-txt">${formatarData(atual.data)}</div>
                                </div>
                                <div class="parcela-valor-txt">${formatarMoeda(atual.valor)}</div>
                            </div>` : ''}
                    </div>
                </div>`;

                const built = buildDespCard({
                    id: modeloId, descricao: ref.descricao, categoria: ref.categoria || 'Outros',
                    data: dataFmt, pago: todasPagas, vencido, valor, extra: extraBadge,
                    acoes, detailId, detailBody,
                    onclick: `toggleAccordion('${detailId}');var mob=document.getElementById('mob-${detailId}');if(mob)mob.style.display=mob.style.display==='none'?'block':'none';`
                });

                htmlFixas += built.tr;
                htmlMobileFixas += built.card;
            });
        });

        htmlMobileFixas += '</div>';
        fixasTable.innerHTML = htmlFixas;

        // Adicionar fixas atrasadas de meses anteriores no mobile
        let htmlFixasAtraso = '';
        fixasAtrasadasAnteriores.forEach(d => {
            const modelo = financeiro.despesasFixas.find(df => String(df.id) === String(d.modeloId));
            if (!modelo || modelo.ativa === false) return;
            const icon = getCategIcon(d.categoria || 'Outros');
            const mesRef = d.data ? d.data.substring(0,7) : '?';
            const [ano,mes] = mesRef.split('-');
            const nomesMes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            const mesNome = nomesMes[parseInt(mes)-1] || mes;
            htmlFixasAtraso += `<div class="desp-card desp-card-vencida" style="border-left:3px solid var(--red)">
                <div class="desp-card-top">
                    <div class="desp-card-icon">${icon}</div>
                    <div class="desp-card-info">
                        <div class="desp-card-nome">${d.descricao} <span class="desp-atraso-badge">${mesNome}/${ano}</span></div>
                        <div class="desp-card-meta">${d.categoria||'Outros'} · Vencida em ${formatarData(d.data)}</div>
                    </div>
                    <div class="desp-card-right">
                        <div class="desp-card-valor" style="color:var(--red);">${formatarMoeda(d.valor)}</div>
                        <span class="desp-badge pendente">Atrasada</span>
                    </div>
                </div>
            </div>`;
        });

        // Injetar cards mobile
        const mobileWrap = document.getElementById('despesasFixasMobile');
        if (mobileWrap) mobileWrap.innerHTML = htmlFixasAtraso + htmlMobileFixas;

        // === TABELA DESPESAS VARIÁVEIS ===
        const variaveisTable = document.getElementById('despesasVariaveisTable');
        const temConteudoVariaveis = variaveisMes.length > 0 || parcelasEmAtraso.some(d => d.grupoParcelaId) || variaveisNaoPagasAtraso.length > 0;
        document.getElementById('emptyDespesasVariaveis').style.display = temConteudoVariaveis ? 'none' : 'block';

        // Separar despesas parceladas de não parceladas
        const naoParceladas = variaveisMes.filter(d => !d.parcelado);
        const parceladas = variaveisMes.filter(d => d.parcelado && d.grupoParcelaId);

        // Agrupar parceladas por grupoParcelaId
        const gruposParcelados = {};
        parceladas.forEach(p => {
            if (!gruposParcelados[p.grupoParcelaId]) {
                gruposParcelados[p.grupoParcelaId] = [];
            }
            gruposParcelados[p.grupoParcelaId].push(p);
        });

        // Incluir grupos com SÓ parcelas em atraso
        parcelasEmAtraso.filter(d => d.grupoParcelaId).forEach(d => {
            if (!gruposParcelados[d.grupoParcelaId]) {
                gruposParcelados[d.grupoParcelaId] = [];
            }
        });

        let htmlVariaveis = '';

        // Renderizar despesas não parceladas (linha simples, sem accordion)
        naoParceladas.forEach(d => {
            const status = getStatusVencimento(d.data, d.pago);
            const valorClass = d.pago ? 'valor-positivo' : 'valor-negativo';
            htmlVariaveis += `
                <tr class="acc-row">
                    <td></td>
                    <td class="acc-descricao">${d.descricao}</td>
                    <td class="acc-condicao acc-mobile-meta">${formatarData(d.data)}</td>
                    <td class="acc-mobile-meta">—</td>
                    <td class="${valorClass} acc-mobile-valor" style="text-align:right;">${formatarMoeda(d.valor)}</td>
                    <td>
                        <button class="acc-delete-btn" onclick="deletarDespesaVariavel(${d.id})" title="Excluir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        });

        // Renderizar grupos parcelados com accordion
        Object.keys(gruposParcelados).forEach(grupoId => {
            const parcelasDoMes = gruposParcelados[grupoId].sort((a, b) => a.parcelaAtual - b.parcelaAtual);
            const todasParcelas = financeiro.despesasVariaveis.filter(dv => String(dv.grupoParcelaId) === String(grupoId));
            if (todasParcelas.length === 0) return;

            const primeiraParcela = parcelasDoMes[0] || todasParcelas[0];
            // Soma real de todas as parcelas (atualizada quando parcelas individuais são editadas)
            const valorTotal = todasParcelas.reduce((s, p) => s + (p.valor || 0), 0);
            const parcelasPagasCount = todasParcelas.filter(p => p.pago).length;
            const totalParcelas = todasParcelas.length;
            const percentPago = totalParcelas > 0 ? Math.round((parcelasPagasCount / totalParcelas) * 100) : 0;
            const estaPausado = primeiraParcela.pausado === true;
            const atrasadasDoGrupo = parcelasEmAtraso.filter(d => String(d.grupoParcelaId) === String(grupoId));
            const detailId = 'detail-parcela-' + grupoId;

            const condicao = `${totalParcelas}x de ${formatarMoeda(primeiraParcela.valor)}`;

            htmlVariaveis += `
                <tr class="acc-row${estaPausado ? ' grupo-pausado' : ''}">
                    <td style="cursor:pointer;" onclick="toggleAccordion('${detailId}')">
                        <span class="acc-chevron" id="chev-${detailId}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </span>
                    </td>
                    <td class="acc-descricao" style="cursor:pointer;" onclick="toggleAccordion('${detailId}')">
                        ${primeiraParcela.descricao}
                        ${estaPausado ? '<span class="badge pausado" style="margin-left:6px;">⏸</span>' : ''}
                        ${atrasadasDoGrupo.length > 0 ? `<span style="margin-left:6px;background:rgba(255,107,91,0.15);color:#ff6b5b;padding:2px 7px;border-radius:8px;font-size:0.72em;font-weight:600;">${atrasadasDoGrupo.length} em atraso</span>` : ''}
                    </td>
                    <td class="acc-condicao acc-mobile-meta">${condicao}</td>
                    <td class="acc-mobile-meta">
                        <div class="acc-progress-wrap">
                            <div class="acc-bar"><div class="acc-bar-fill parcela" style="width:${percentPago}%"></div></div>
                            <span style="font-size:0.75em;color:rgba(255,255,255,0.55);white-space:nowrap;">${parcelasPagasCount}/${totalParcelas}</span>
                        </div>
                    </td>
                    <td class="acc-valor-total acc-mobile-valor" style="text-align:right;">${formatarMoeda(valorTotal)}</td>
                    <td>
                        <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
                            <button class="acc-delete-btn" onclick="editarDespesaParcelada(${primeiraParcela.grupoParcelaId || primeiraParcela.id})" title="Editar descrição/categoria (todas as parcelas)" style="color:rgba(47,199,173,0.6);">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="acc-delete-btn" onclick="deletarTodasParcelas(${primeiraParcela.id})" title="Excluir">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>
                <tr class="acc-detail-row" id="${detailId}" style="display:none;">
                    <td colspan="6">
                        <div class="parcelas-detail-box">
                            <div class="parcelas-detail-title">Detalhamento das Parcelas</div>
                            <div class="parcelas-grid">
                                ${todasParcelas.sort((a,b) => a.parcelaAtual - b.parcelaAtual).map(p => {
                                    const isPago = p.pago;
                                    const dataP = p.data ? new Date(p.data + 'T00:00:00') : null;
                                    const hoje2 = new Date(); hoje2.setHours(0,0,0,0);
                                    const isVencida = dataP && dataP < hoje2 && !isPago;
                                    return `
                                        <div class="parcela-item${isPago ? ' pago' : ''}${isVencida ? ' vencida' : ''}">
                                            <button onclick="event.stopPropagation();togglePagoVariavel(${p.id}, this)"
                                                style="background:${isPago ? '#5fe08a' : 'transparent'};
                                                       border:1.5px solid ${isVencida && !isPago ? '#ff6b5b' : '#5fe08a'};
                                                       border-radius:6px;padding:3px 8px;cursor:pointer;
                                                       color:${isPago ? '#0a0a0a' : isVencida ? '#ff6b5b' : '#5fe08a'};
                                                       font-size:0.60em;font-weight:800;font-family:inherit;
                                                       letter-spacing:0.5px;white-space:nowrap;flex-shrink:0;
                                                       transition:all 0.15s ease;">
                                                ${isPago ? 'PAGO' : 'PAGAR'}
                                            </button>
                                            <div class="parcela-info-box" style="flex:1;">
                                                <div class="parcela-nome">Parcela ${p.parcelaAtual}/${p.totalParcelas}</div>
                                                <div class="parcela-data-txt">${p.data ? p.data.split('-').reverse().join('/') : '—'}</div>
                                                ${p.notaParcela ? `<div class="parcela-nota-txt"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ${p.notaParcela}</div>` : ''}
                                            </div>
                                            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                                                <div class="parcela-valor-txt">${formatarMoeda(p.valor)}</div>
                                                <button class="parcela-edit-inline" onclick="event.stopPropagation();editarParcelaIndividual(${p.id})" title="Editar valor/data/nota desta parcela">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });

        variaveisTable.innerHTML = htmlVariaveis;

        // Cards mobile para variáveis
        const mobileVar = document.getElementById('despesasVariaveisMobile');
        if (mobileVar) {
            let htmlMobVar = '<div class="desp-cards-wrap">';


            // Não parceladas
            naoParceladas.forEach(d => {
                const status = getStatusVencimento(d.data, d.pago);
                const vencido = status.classe === 'vencido';
                const badge = getStatusBadge(d.pago, vencido);
                const cor = d.pago ? 'var(--green)' : vencido ? 'var(--red)' : 'var(--text-sub)';
                const bordaL = vencido ? '3px solid var(--red)' : d.pago ? '3px solid var(--green)' : '3px solid transparent';
                const icon = getCategIcon(d.categoria || 'Outros');
                htmlMobVar += `<div class="desp-card${vencido?' desp-card-vencida':''}${d.pago?' desp-card-paga':''}" style="border-left:${bordaL}">
                    <div class="desp-card-top">
                        <div class="desp-card-icon">${icon}</div>
                        <div class="desp-card-info">
                            <div class="desp-card-nome">${d.descricao}</div>
                            <div class="desp-card-meta">${d.categoria||'Outros'} · ${formatarData(d.data)}</div>
                        </div>
                        <div class="desp-card-right">
                            <div class="desp-card-valor" style="color:${cor};">${formatarMoeda(d.valor)}</div>
                            ${badge}
                        </div>
                    </div>
                    <div class="desp-card-acoes">
                        <button class="acc-delete-btn" onclick="deletarDespesaVariavel(${d.id})" title="Excluir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>`;
            });
            // Parceladas
            Object.keys(gruposParcelados).forEach(grupoId => {
                const parcelasDoMes = gruposParcelados[grupoId];
                const todasP = financeiro.despesasVariaveis.filter(dv => String(dv.grupoParcelaId) === String(grupoId));
                if (!todasP.length) return;
                const prim = parcelasDoMes[0] || todasP[0];
                const pagas = todasP.filter(p => p.pago).length;
                const total = todasP.length;
                const pct = total > 0 ? Math.round((pagas/total)*100) : 0;
                const atrasadas = parcelasEmAtraso.filter(d => String(d.grupoParcelaId) === String(grupoId));
                const vencido = atrasadas.length > 0;
                const bordaL = vencido ? '3px solid var(--red)' : pct===100 ? '3px solid var(--green)' : '3px solid transparent';
                const icon = getCategIcon(prim.categoria || 'Outros');
                const detailId = 'mob-parcela-' + grupoId;
                htmlMobVar += `<div class="desp-card${vencido?' desp-card-vencida':''}" style="border-left:${bordaL}">
                    <div class="desp-card-top" onclick="var el=document.getElementById('${detailId}');el.style.display=el.style.display==='none'?'block':'none'">
                        <div class="desp-card-icon">${icon}</div>
                        <div class="desp-card-info">
                            <div class="desp-card-nome">${prim.descricao}${atrasadas.length>0?`<span class="desp-atraso-badge">${atrasadas.length} em atraso</span>`:''}</div>
                            <div class="desp-card-meta">${total}x · ${pagas}/${total} pagas</div>
                            <div class="desp-prog-wrap" style="max-width:100%;margin-top:4px;">
                                <div class="desp-prog-bar" style="width:${pct}%;background:${pct===100?'var(--green)':'var(--gold)'}"></div>
                            </div>
                        </div>
                        <div class="desp-card-right">
                            <div class="desp-card-valor">${formatarMoeda(todasP.reduce((s,p)=>s+p.valor,0))}</div>
                            <span class="desp-badge ${pct===100?'pago':'pendente'}">${pct===100?'Pago':'Pendente'}</span>
                        </div>
                    </div>
                    <div id="${detailId}" style="display:none;padding:8px 12px;">
                        ${todasP.sort((a,b)=>a.parcelaAtual-b.parcelaAtual).map(p => {
                            const isPago=p.pago;
                            const dP=p.data?new Date(p.data+'T00:00:00'):null;
                            const hj=new Date();hj.setHours(0,0,0,0);
                            const isV=dP&&dP<hj&&!isPago;
                            return `<div class="parcela-item${isPago?' pago':''}${isV?' vencida':''}" style="display:flex;align-items:center;gap:10px;">
                                <button onclick="event.stopPropagation();togglePagoVariavel(${p.id}, this)"
                                    style="background:${isPago ? '#5fe08a' : 'transparent'};
                                           border:1.5px solid ${isV && !isPago ? '#ff6b5b' : '#5fe08a'};
                                           border-radius:6px;padding:3px 8px;cursor:pointer;
                                           color:${isPago ? '#0a0a0a' : isV ? '#ff6b5b' : '#5fe08a'};
                                           font-size:0.60em;font-weight:800;font-family:inherit;
                                           letter-spacing:0.5px;white-space:nowrap;flex-shrink:0;">
                                    ${isPago ? 'PAGO' : 'PAGAR'}
                                </button>
                                <div class="parcela-info-box" style="flex:1;"><div class="parcela-nome">Parcela ${p.parcelaAtual}/${p.totalParcelas}</div><div class="parcela-data-txt">${p.data?p.data.split('-').reverse().join('/'):'—'}</div></div>
                                <div class="parcela-valor-txt">${formatarMoeda(p.valor)}</div>
                            </div>`;
                        }).join('')}
                    </div>
                    <div class="desp-card-acoes">
                        <button class="acc-delete-btn" onclick="editarDespesaParcelada(${prim.grupoParcelaId||prim.id})" style="color:rgba(70,240,210,0.8);" title="Editar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:15px;height:15px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="acc-delete-btn" onclick="deletarTodasParcelas(${prim.id})" title="Excluir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>`;
            });
            htmlMobVar += '</div>';
            mobileVar.innerHTML = htmlMobVar;
        }

        // === TABELA DESPESAS AVULSAS ===
        const avulsasTable = document.getElementById('despesasAvulsasTable');
        const temAvulsasVisiveis2 = avulsasMes.length > 0 || variaveisNaoPagasAtraso.length > 0;
        document.getElementById('emptyDespesasAvulsas').style.display = temAvulsasVisiveis2 ? 'none' : 'block';

        // Linhas das ATRASADAS de meses anteriores
        // Incluir também atrasadas PAGAS no mês atual (para mostrar botão PAGO)
        const atrasadasPagasNoMes = (financeiro.despesasAvulsas || []).filter(d =>
            d.pago && d.data && d.data.substring(0,7) < keyAtual &&
            d.dataPagamento && d.dataPagamento.substring(0,7) === keyAtual
        );
        const todasAtrasadasVisiveis = [...variaveisNaoPagasAtraso, ...atrasadasPagasNoMes];

        const htmlAtrasadasRows = todasAtrasadasVisiveis.map(d => {
            const [ano, mes] = d.data.substring(0,7).split('-');
            const nomesMes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            const mesNome = nomesMes[parseInt(mes)-1] || mes;
            return `<tr style="background:rgba(255,107,91,0.06);border-left:3px solid #ff6b5b;">
                <td>
                    <button onclick="marcarPagoAvulsa(${d.id}, this)" title="${d.pago ? 'Desmarcar pagamento' : 'Marcar como pago'}"
                        style="background:${d.pago ? '#5fe08a' : 'transparent'};
                               border:1.5px solid #5fe08a;
                               border-radius:6px;padding:4px 10px;cursor:pointer;
                               color:${d.pago ? '#0a0a0a' : '#5fe08a'};
                               font-size:0.65em;font-weight:800;
                               font-family:inherit;letter-spacing:0.5px;">
                        ${d.pago ? 'PAGO' : 'PAGAR'}
                    </button>
                </td>
                <td class="acc-descricao">
                    ${d.descricao}
                    <span style="margin-left:6px;font-size:0.62em;font-weight:700;color:#ff6b5b;background:rgba(255,107,91,0.12);padding:1px 6px;border-radius:4px;">${mesNome}/${ano}</span>
                </td>
                <td>${d.categoria||'—'}</td>
                <td>${formatarData(d.data)}</td>
                <td><span style="color:#ff6b5b;font-size:0.78em;font-weight:600;">⚠ Atrasada</span></td>
                <td style="text-align:right;color:#ff6b5b;">${formatarMoeda(d.valor)}</td>
                <td>
                    <button class="acc-delete-btn" onclick="deletarDespesaAvulsa(${d.id})" title="Excluir">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </td>
            </tr>`;
        }).join('');

        avulsasTable.innerHTML = htmlAtrasadasRows + avulsasMes.map(d => {
            const hoje = new Date(); hoje.setHours(0,0,0,0);
            const dv = d.data ? new Date(d.data + 'T00:00:00') : null;
            const vencida = dv && dv < hoje && !d.pago;
            const badgeSt = d.pago
                ? '<span style="color:#5fe08a;font-size:0.78em;font-weight:500;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:2px"><polyline points="20 6 9 12 4 12"/><polyline points="20 6 9 20 4 12"/></svg> Pago</span>'
                : vencida
                    ? '<span style="color:#ff6b5b;font-size:0.78em;font-weight:600;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:2px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Vencido</span>'
                    : '<span style="background:rgba(26,26,26,0.07);color:#888;font-size:0.75em;padding:2px 8px;border-radius:8px;font-weight:500;">Pendente</span>';
            return `
                <tr>
                    <td>
                        <button onclick="togglePagoAvulsa(${d.id}, this)" title="${d.pago ? 'Desmarcar' : 'Marcar como pago'}"
                            style="background:${d.pago ? '#5fe08a' : 'transparent'};
                                   border:1.5px solid #5fe08a;border-radius:6px;
                                   padding:3px 8px;cursor:pointer;
                                   color:${d.pago ? '#0a0a0a' : '#5fe08a'};
                                   font-size:0.62em;font-weight:800;
                                   font-family:inherit;letter-spacing:0.5px;
                                   white-space:nowrap;">
                            ${d.pago ? 'PAGO' : 'PAGAR'}
                        </button>
                    </td>
                    <td class="acc-descricao">${d.descricao}</td>
                    <td class="acc-mobile-meta" style="text-align:center;"><span class="rec-cat">${d.categoria}</span></td>
                    <td class="acc-condicao acc-mobile-meta">${formatarData(d.data)}</td>
                    <td class="acc-mobile-meta">${badgeSt}</td>
                    <td style="text-align:right;" class="${d.pago ? 'valor-positivo' : 'valor-negativo'} acc-mobile-valor">${formatarMoeda(d.valor)}</td>
                    <td>
                        <div style="display:flex;gap:4px;">
                            ${d.comprovante ? btnComprovante('verComprovanteAvulsa', d.id) : ''}
                            <button class="acc-delete-btn" onclick="editarDespesaAvulsa(${d.id})" title="Editar" style="color:rgba(212,175,125,0.5);">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="acc-delete-btn" onclick="deletarDespesaAvulsa(${d.id})" title="Excluir">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        // === CARDS EMPRÉSTIMOS ===
        const empContainer = document.getElementById('emprestimosContainer');
        document.getElementById('emptyEmprestimos').style.display = emprestimosAtivos.length ? 'none' : 'block';

        // ── 1. RESUMO GERAL no topo da seção ──
        const totalDevido = emprestimosAtivos.reduce((s, e) => s + (e.principal || 0), 0);
        const custoJurosMensal = emprestimosAtivos.reduce((s, e) => s + (e.principal || 0) * ((e.taxaJuros || 0) / 100), 0);
        const maiorTaxa = emprestimosAtivos.reduce((m, e) => Math.max(m, e.taxaJuros || 0), 0);
        const totalJurosAcum = emprestimosAtivos.reduce((s, e) => s + (e.jurosAcumulados || 0), 0);
        const totalParcelasMes = emprestimosAtivos.filter(e => e.parcelado && e.valorParcela > 0).reduce((s, e) => s + (e.valorParcela || 0), 0);
        const resumoEl = document.getElementById('empResumoGeral');
        if (resumoEl) {
            if (emprestimosAtivos.length === 0) {
                resumoEl.style.display = 'none';
            } else {
                resumoEl.style.display = 'grid';
                resumoEl.innerHTML = `
                    <div class="emp-resumo-item">
                        <span class="emp-resumo-label">Total Devido</span>
                        <span class="emp-resumo-valor">${formatarMoeda(totalDevido)}</span>
                    </div>
                    <div class="emp-resumo-item">
                        <span class="emp-resumo-label">Custo de Juros/Mês</span>
                        <span class="emp-resumo-valor ${custoJurosMensal > 0 ? 'atencao' : ''}">${formatarMoeda(custoJurosMensal)}</span>
                    </div>
                    <div class="emp-resumo-item">
                        <span class="emp-resumo-label">Maior Taxa</span>
                        <span class="emp-resumo-valor ${maiorTaxa >= 10 ? 'negativo' : maiorTaxa >= 5 ? 'atencao' : ''}">${maiorTaxa}% a.m.</span>
                    </div>
                    <div class="emp-resumo-item">
                        <span class="emp-resumo-label">Juros Acumulados</span>
                        <span class="emp-resumo-valor ${totalJurosAcum > 0 ? 'atencao' : ''}">${formatarMoeda(totalJurosAcum)}</span>
                    </div>
                    ${totalParcelasMes > 0 ? `<div class="emp-resumo-item">
                        <span class="emp-resumo-label">Parcelas/Mês</span>
                        <span class="emp-resumo-valor">${formatarMoeda(totalParcelasMes)}</span>
                    </div>` : ''}
                    <div class="emp-resumo-item">
                        <span class="emp-resumo-label">Contratos Ativos</span>
                        <span class="emp-resumo-valor">${emprestimosAtivos.length}</span>
                    </div>
                `;
            }
        }

        // ── 2. ORDENAÇÃO POR PRIORIDADE ──
        // 1º) parcela atrasada, 2º) juros acumulados, 3º) maior taxa, 4º) maior saldo
        const hoje = new Date().toISOString().split('T')[0];
        const mesHoje = hoje.substring(0, 7);
        const ordenados = [...emprestimosAtivos].sort((a, b) => {
            const aAtrasada = a.proximaParcelaData && a.proximaParcelaData.substring(0,7) < mesHoje ? 1 : 0;
            const bAtrasada = b.proximaParcelaData && b.proximaParcelaData.substring(0,7) < mesHoje ? 1 : 0;
            if (bAtrasada !== aAtrasada) return bAtrasada - aAtrasada;
            const aJuros = (a.jurosAcumulados || 0) > 0 ? 1 : 0;
            const bJuros = (b.jurosAcumulados || 0) > 0 ? 1 : 0;
            if (bJuros !== aJuros) return bJuros - aJuros;
            if (b.taxaJuros !== a.taxaJuros) return (b.taxaJuros || 0) - (a.taxaJuros || 0);
            return (b.principal || 0) - (a.principal || 0);
        });

        empContainer.innerHTML = ordenados.map(e => {
            const percentQuitado = e.principalOriginal > 0 ? Math.round(((e.principalOriginal - e.principal) / e.principalOriginal) * 100) : 0;
            const temJurosPendentes = (e.jurosAcumulados || 0) > 0;
            const detailId = 'detail-emp-' + e.id;

            // Parcelamento
            const parcelasPagas = e.parcelasPagas || 0;
            const percentParcelas = (e.parcelado && e.totalParcelas > 0) ? Math.min(100, Math.round((parcelasPagas / e.totalParcelas) * 100)) : 0;
            const parcelasRestantes = e.parcelado ? Math.max(0, e.totalParcelas - parcelasPagas) : 0;

            // ── 3. ALERTAS VISUAIS ──
            const parcAtrasada = e.proximaParcelaData && e.proximaParcelaData.substring(0,7) < mesHoje;
            const parcProxima = e.proximaParcelaData && e.proximaParcelaData >= hoje && e.proximaParcelaData <= (() => { const d = new Date(); d.setDate(d.getDate()+7); return d.toISOString().split('T')[0]; })();
            const alertas = [];
            if (parcAtrasada) alertas.push(`<span class="emp-alert vencida"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px;margin-right:3px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Parcela atrasada</span>`);
            if (parcProxima && !parcAtrasada) alertas.push(`<span class="emp-alert proxima"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Vence em breve</span>`);
            if (temJurosPendentes) alertas.push(`<span class="emp-alert juros">$ Juros pendentes</span>`);
            if ((e.taxaJuros || 0) >= 10) alertas.push(`<span class="emp-alert taxa-alta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;vertical-align:-1px"><circle cx="12" cy="12" r="10" fill="rgba(255,107,91,0.8)" stroke="none"/></svg> Taxa alta</span>`);

            // ── 4. GRÁFICO SPARKLINE do histórico de saldo ──
            let sparklineHtml = '';
            const pagamentos = (e.historicoPagamentos || []).filter(h => h.tipo === 'amortizacao');
            if (pagamentos.length >= 2) {
                const saldos = [];
                let saldoSim = e.principalOriginal || e.principal;
                saldos.push(saldoSim);
                pagamentos.forEach(p => { saldoSim = Math.max(0, saldoSim - (p.valor || 0)); saldos.push(saldoSim); });
                const maxS = Math.max(...saldos), minS = Math.min(...saldos, 0);
                const range = maxS - minS || 1;
                const pts = saldos.map((s, i) => {
                    const x = Math.round(i / (saldos.length - 1) * 100);
                    const y = Math.round(40 - ((s - minS) / range) * 36);
                    return `${x},${y}`;
                }).join(' ');
                sparklineHtml = `<svg viewBox="0 0 100 44" class="emp-sparkline" preserveAspectRatio="none">
                    <polyline points="${pts}" fill="none" stroke="rgba(255,107,91,.6)" stroke-width="1.5" stroke-linejoin="round"/>
                    <polyline points="${pts} 100,44 0,44" fill="rgba(255,107,91,.08)" stroke="none"/>
                </svg>`;
            }

            // ── 5. HISTÓRICO (últimos 5) ──
            const historicoHtml = (e.historicoPagamentos && e.historicoPagamentos.length > 0)
                ? `<div class="emp-hist-lista">` + e.historicoPagamentos.slice().reverse().map((h, i) => {
                    const isJuros      = h.tipo === 'juros';
                    const isJurosGer   = h.tipo === 'juros_gerado';
                    const isParcela    = h.tipo === 'parcela';
                    const isAmort      = h.tipo === 'amortizacao';
                    const isCancelado  = h.tipo === 'cancelamento';

                    const badge = isCancelado
                        ? `<span class="emp-hist-badge cancelado">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            Juros cancelados
                          </span>`
                        : isJurosGer
                        ? `<span class="emp-hist-badge juros-pend">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            Juros gerados — NÃO PAGOS
                          </span>`
                        : isJuros
                        ? `<span class="emp-hist-badge juros">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            Juros pagos
                          </span>`
                        : isParcela
                        ? `<span class="emp-hist-badge parcela">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                            Parcela ${h.numeroParcela || ''} paga
                          </span>`
                        : `<span class="emp-hist-badge amort">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                            Amortização
                          </span>`;

                    const saldoApos = isJurosGer && h.saldoJurosApos !== undefined
                        ? `<span class="emp-hist-saldo">Juros acumulados: <strong style="color:#ff6b5b">${formatarMoeda(h.saldoJurosApos)}</strong></span>`
                        : h.saldoApos !== undefined
                        ? `<span class="emp-hist-saldo">Saldo após: <strong>${formatarMoeda(h.saldoApos)}</strong></span>`
                        : '';

                    return `<div class="emp-historico-item">
                        <div class="emp-hist-esq">
                            <span class="emp-hist-data">${formatarData(h.data)}</span>
                            ${badge}
                            ${saldoApos}
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                            <span class="emp-hist-valor ${isJurosGer ? 'emp-hist-valor-pend' : isJuros ? 'emp-hist-valor-juros' : 'emp-hist-valor-amort'}">${formatarMoeda(h.valor)}</span>
                            ${isJurosGer ? `
                            <button class="emp-hist-del" onclick="event.stopPropagation();editarDataJuros('${e.id}',${e.historicoPagamentos.length - 1 - i},'${h.data}')" title="Editar data" style="color:#46f0d2;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>` : ''}
                            <button class="emp-hist-del" onclick="event.stopPropagation();removerHistorico('${e.id}',${e.historicoPagamentos.length - 1 - i})" title="Remover esta entrada">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>`;
                }).join('') + `</div>`
                : '<div class="emp-historico-vazio">Nenhum histórico registrado.</div>';

            return `
                <tr class="acc-row ${parcAtrasada ? 'emp-row-atrasada' : ''}">
                    <td style="cursor:pointer;" onclick="toggleAccordion('${detailId}')">
                        <span class="acc-chevron" id="chev-${detailId}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </span>
                    </td>
                    <td class="acc-descricao" style="cursor:pointer;" onclick="toggleAccordion('${detailId}')">
                        <span style="display:block;font-weight:600;">${e.descricao}${e.parcelado ? `<span class="badge parcela">${parcelasPagas}/${e.totalParcelas}</span>` : ''}</span>
                        ${alertas.length ? `<span class="emp-alertas-row">${alertas.join('')}</span>` : ''}
                    </td>
                    <td class="acc-taxa-val acc-mobile-meta">${e.taxaJuros}% a.m.</td>
                    <td class="acc-original-val acc-mobile-meta">${formatarMoeda(e.principalOriginal)}</td>
                    <td class="acc-saldo-val acc-mobile-valor">
                        ${formatarMoeda(e.principal)}
                        ${sparklineHtml}
                    </td>
                    <td class="acc-juros-val acc-mobile-meta">${formatarMoeda(e.jurosAcumulados || 0)}</td>
                    <td class="acc-mobile-meta">
                        <div class="acc-progress-wrap acc-quitacao-wrap" title="${percentQuitado}% quitado">
                            <div class="acc-bar"><div class="acc-bar-fill emprestimo" style="width:${percentQuitado}%"></div></div>
                            <span style="font-size:0.7em;color:rgba(255,255,255,0.60);margin-top:2px;">${percentQuitado}%</span>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
                            <button class="acc-delete-btn" onclick="editarEmprestimo(${e.id})" title="Editar" style="color:rgba(47,199,173,0.6);">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="acc-delete-btn" onclick="deletarEmprestimo(${e.id})" title="Excluir">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                        <!-- Botões rápidos mobile — sempre visíveis -->
                        <div class="emp-quick-btns">
                            ${(e.taxaJuros || 0) > 0 && e.principal > 0 ? `
                            <button onclick="event.stopPropagation();gerarJurosMes('${e.id}')"
                                style="background:rgba(70,240,210,0.12);border:1px solid rgba(70,240,210,0.35);
                                       border-radius:8px;padding:6px 12px;cursor:pointer;
                                       color:#46f0d2;font-size:0.68em;font-weight:700;
                                       font-family:inherit;letter-spacing:0.5px;">
                                $ Gerar Juros
                            </button>` : ''}
                            ${(e.jurosAcumulados || 0) > 0 ? `
                            <button onclick="event.stopPropagation();abrirModalPagarJuros('${e.id}')"
                                style="background:rgba(255,107,91,0.12);border:1px solid rgba(255,107,91,0.35);
                                       border-radius:8px;padding:6px 12px;cursor:pointer;
                                       color:#ff6b5b;font-size:0.68em;font-weight:700;
                                       font-family:inherit;letter-spacing:0.5px;">
                                Pagar Juros (${formatarMoeda(e.jurosAcumulados)})
                            </button>` : ''}
                        </div>
                    </td>
                </tr>
                <tr class="acc-detail-row" id="${detailId}" style="display:none;">
                    <td colspan="8">
                        <div class="emp-detail-box">
                            <div class="emp-acoes-col">
                                ${e.parcelado ? `
                                <div class="emp-parcela-info">
                                    <div class="emp-parcela-header">
                                        <span>Parcela ${parcelasPagas}/${e.totalParcelas}</span>
                                        <span>${formatarMoeda(e.valorParcela)}/mês</span>
                                    </div>
                                    <div class="acc-bar"><div class="acc-bar-fill parcela" style="width:${percentParcelas}%"></div></div>
                                    <div class="emp-parcela-detalhes">
                                        ${parcelasRestantes > 0
                                            ? `Próxima: <strong>${formatarData(e.proximaParcelaData)}</strong> · Faltam ${parcelasRestantes} ${parcelasRestantes === 1 ? 'parcela' : 'parcelas'} (${formatarMoeda(parcelasRestantes * (e.valorParcela || 0))})`
                                            : 'Todas as parcelas registradas'}
                                    </div>
                                </div>
                                ` : ''}
                                ${(e.parcelado && parcelasPagas < e.totalParcelas) ? `
                                <button class="emp-btn-acao emp-btn-parcela" onclick="abrirModalPagarParcela(${e.id})">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 17"></polyline></svg>
                                    Pagar Parcela (${parcelasPagas + 1}/${e.totalParcelas})
                                </button>
                                ` : ''}
                                <button class="emp-btn-acao" onclick="gerarJurosMes(${e.id})">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                    Gerar Juros (Mensal)
                                </button>
                                ${(e.jurosAcumulados || 0) > 0 ? `
                                <button class="emp-btn-acao emp-btn-cancelar-juros" onclick="cancelarJuros('${e.id}')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                    Cancelar Juros (${formatarMoeda(e.jurosAcumulados)})
                                </button>` : ''}
                                <button class="emp-btn-acao" onclick="abrirModalPagarJuros(${e.id})">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                    Pagar Juros
                                </button>
                                <button class="emp-btn-acao" onclick="abrirModalAmortizar(${e.id})">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                                    Amortizar Principal
                                </button>
                            </div>
                            <div class="emp-historico-col">
                                <div class="emp-historico-titulo">Histórico de Movimentações</div>
                                ${historicoHtml}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // === CARDS DE RESERVAS ===
        const reservasContainer = document.getElementById('reservasContainer');
        const todasReservas = financeiro.economias || [];
        document.getElementById('emptyEconomias').style.display = todasReservas.length ? 'none' : 'block';
        
        reservasContainer.innerHTML = todasReservas.map(reserva => {
            // Garantir compatibilidade com dados antigos
            const saldo = reserva.saldo !== undefined ? reserva.saldo : (reserva.valor || 0);
            const movs = reserva.movimentacoes || [];
            
            // Renderizar histórico de movimentações (últimas 10)
            const ultimasMovs = [...movs].reverse().slice(0, 10);
            const historicoHtml = ultimasMovs.length > 0 ? ultimasMovs.map(m => `
                <div class="reserva-mov-item">
                    <div class="mov-info">
                        <span class="mov-data">${formatarData(m.data.split('T')[0])}</span>
                        <span class="mov-obs">${m.observacao || (m.tipo === 'entrada' ? 'Depósito' : 'Retirada')}</span>
                    </div>
                    <span class="mov-valor ${m.tipo === 'entrada' ? 'entrada' : 'saida'}">
                        ${m.tipo === 'entrada' ? '+' : '-'} ${formatarMoeda(m.valor)}
                    </span>
                </div>
            `).join('') : '<div style="text-align: center; color: rgba(26, 26, 26, 0.4); padding: 10px; font-size: 0.85em;">Nenhuma movimentação</div>';
            
            return `
                <div class="reserva-card" id="reserva-${reserva.id}">
                    <div class="reserva-card-header">
                        <div class="reserva-card-title">
                            ${reserva.descricao}
                            <small>${reserva.categoria || 'Reserva'}</small>
                        </div>
                        <div class="reserva-card-acoes">
                            <button class="action-btn btn-edit" onclick="editarEconomia(${reserva.id})" title="Editar">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="action-btn btn-delete" onclick="deletarEconomia(${reserva.id})" title="Excluir">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="reserva-saldo">
                        <label>Saldo Atual</label>
                        <div class="valor">${formatarMoeda(saldo)}</div>
                    </div>
                    
                    <div class="reserva-acoes-rapidas">
                        <button class="btn-depositar" onclick="depositarReserva(${reserva.id})">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Depositar
                        </button>
                        <button class="btn-retirar" onclick="retirarReserva(${reserva.id})" ${saldo <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Retirar
                        </button>
                    </div>
                    
                    <div class="reserva-historico">
                        <div class="reserva-historico-header" onclick="toggleHistoricoReserva(${reserva.id})">
                            <h4>Histórico de Movimentações (${movs.length})</h4>
                            <svg class="icon toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                        <div class="reserva-historico-lista">
                            ${historicoHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Renderizar itens arquivados
    function renderizarArquivados() {
        // Limpar tabelas ativas
        document.getElementById('receitasFixasTable').innerHTML = '';
        document.getElementById('receitasVariaveisTable').innerHTML = '';
        document.getElementById('despesasFixasTable').innerHTML = '';
        document.getElementById('despesasVariaveisTable').innerHTML = '';
        document.getElementById('despesasAvulsasTable').innerHTML = '';
        document.getElementById('reservasContainer').innerHTML = '';
        
        // Mostrar empréstimos arquivados
        const empArquivados = financeiro.emprestimos.filter(e => e.arquivado);
        // No modo arquivado, usar div separada (o tbody da tabela é para ativos)
        const empTableWrapper = document.querySelector('#sectionEmprestimos .table-container');
        const empArqContainer = document.getElementById('emprestimosArquivadosContainer');
        const empContainer = empArqContainer;
        if (empTableWrapper) empTableWrapper.style.display = 'none';
        if (empArqContainer) empArqContainer.style.display = 'block';
        
        if (empArquivados.length === 0) {
            empContainer.innerHTML = '<div class="empty-state">Nenhum item arquivado</div>';
            return;
        }

        empContainer.innerHTML = empArquivados.map(e => {
            // Renderizar histórico com comprovantes
            const historicoComComprovantes = (e.historico || [])
                .filter(h => h.comprovante)
                .map((h, idx) => {
                    const tipoLabel = h.tipo === 'pagamento_juros' ? 'Juros' : 
                                     h.tipo === 'amortizacao' ? 'Amortização' : h.tipo;
                    return `<button class="comprovante" onclick="verComprovanteHistoricoArquivado(${e.id}, ${e.historico.indexOf(h)})" 
                            title="${tipoLabel} - ${formatarMoeda(h.valor)}" style="margin:2px;">
                            Anexo: ${tipoLabel}
                    </button>`;
                }).join('');

            // Verificar se teve movimentações reais
            const teveMovimentacao = (e.totalJurosPagos || 0) > 0 || (e.totalAmortizado || 0) > 0;

            return `
                <div class="emprestimo-card arquivado">
                    <div class="emprestimo-card-header">
                        <div class="emprestimo-card-title">
                            ${e.descricao}
                            <span class="badge arquivado">Quitado</span>
                            <small>Arquivado em ${formatarData(e.arquivadoEm?.split('T')[0])}</small>
                        </div>
                        <div class="menu-acoes-container">
                            <button class="btn-menu-acoes" onclick="toggleMenuAcoes(${e.id})" title="Ações">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                            </button>
                            <div class="menu-acoes-dropdown" id="menuAcoes-${e.id}">
                                <button class="menu-acao-item" onclick="restaurarEmprestimo(${e.id}); fecharMenuAcoes();">
                                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="1 4 1 10 7 10"></polyline>
                                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                                    </svg>
                                    Restaurar dívida
                                </button>
                                <div class="menu-acao-divisor"></div>
                                <button class="menu-acao-item menu-acao-danger" onclick="iniciarExclusaoEmprestimo(${e.id}, ${teveMovimentacao}); fecharMenuAcoes();">
                                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Excluir permanentemente
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="emprestimo-valores">
                        <div class="emprestimo-valor-item">
                            <label>Valor Original</label>
                            <div class="valor">${formatarMoeda(e.principalOriginal)}</div>
                        </div>
                        <div class="emprestimo-valor-item">
                            <label>Total Juros Pagos</label>
                            <div class="valor">${formatarMoeda(e.totalJurosPagos || 0)}</div>
                        </div>
                        <div class="emprestimo-valor-item">
                            <label>Total Amortizado</label>
                            <div class="valor">${formatarMoeda(e.totalAmortizado || 0)}</div>
                        </div>
                    </div>
                    ${historicoComComprovantes ? `
                        <div style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(26, 26, 26, 0.1);">
                            <label style="font-size:0.8em;color:rgba(26, 26, 26, 0.5);display:block;margin-bottom:8px;">Anexo: Comprovantes Salvos:</label>
                            ${historicoComComprovantes}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Ocultar empty states
        document.querySelectorAll('.empty-state').forEach(el => el.style.display = 'none');
    }

    // ==========================================
    // PERSISTÊNCIA (localStorage + Supabase)
    // ==========================================

    // ==========================================
    // PERSISTÊNCIA (localStorage + Supabase)
    // ==========================================
    
    function salvarDados() {
        // Timestamp local para resolver conflito com Supabase
        financeiro._localUpdatedAt = new Date().toISOString();
        localStorage.setItem('financeiro_v5', JSON.stringify(financeiro));
        salvarSupabase();
    }

    async function salvarSupabase() {
        if (!useSupabase) return;
        try {
            const _ts = financeiro._localUpdatedAt || new Date().toISOString();
            const { error } = await supabaseClient.from('financeiro').upsert({
                id: USER_ID,
                user_id: USER_ID,
                dados: financeiro,
                updated_at: _ts
            });
            if (error) {
                console.error('Erro Supabase:', error);
                mostrarStatus('Erro ao sincronizar', 'error');
            } else {
                mostrarStatus('Sincronizado', 'success');
            }
        } catch (e) {
            console.error('Exceção Supabase:', e);
        }
    }

    async function carregarSupabase() {
        if (!useSupabase) return false;
        try {
            const { data, error } = await supabaseClient
                .from('financeiro')
                .select('*')
                .eq('user_id', USER_ID)
                .maybeSingle();

            if (error) {
                console.error('Erro ao carregar:', error);
                return false;
            }

            if (data?.dados) {
                // Comparar timestamps: só sobrescreve se Supabase for mais novo que local
                const localData = JSON.parse(localStorage.getItem('financeiro_v5') || '{}');
                const localTs   = localData._localUpdatedAt || '0';
                const remotoTs  = data.updated_at || data.dados._localUpdatedAt || '0';

                if (remotoTs >= localTs) {
                    // Supabase é mais novo ou igual — aceitar
                    financeiro = {
                        ...dadosVazios,
                        ...data.dados,
                        arquivados: { ...dadosVazios.arquivados, ...data.dados.arquivados }
                    };
                    localStorage.setItem('financeiro_v5', JSON.stringify(financeiro));
                    mostrarStatus('Dados carregados', 'success');
                } else {
                    // Local é mais novo — manter local e sincronizar para Supabase
                    mostrarStatus('Dados locais mais recentes — sincronizando...', 'info');
                    await salvarSupabase();
                }
                return true;
            }
            return false;
        } catch (e) {
            console.error('Exceção:', e);
            return false;
        }
    }

    // ==========================================
    // STATUS DE SINCRONIZAÇÃO
    // ==========================================
    
    function mostrarStatus(msg, tipo) {
        let status = document.getElementById('syncStatus');
        if (!status) {
            status = document.createElement('div');
            status.id = 'syncStatus';
            document.body.appendChild(status);
        }

        const icones = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>',
            error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
        };

        const cores = {
            success: 'rgba(30,130,70,0.96)',
            error:   'rgba(180,45,35,0.96)',
            info:    'rgba(30,60,100,0.96)',
        };

        const t = tipo || 'info';
        status.innerHTML = (icones[t] || icones.info) + `<span>${msg}</span>`;
        status.style.background = cores[t] || cores.info;
        status.style.opacity    = '1';
        status.style.transform  = 'translateY(0)';

        clearTimeout(status._timeout);
        status._timeout = setTimeout(() => {
            status.style.opacity   = '0';
            status.style.transform = 'translateY(8px)';
        }, 3500);
    }

    // ==========================================
    // CONTROLES DE MÊS/ANO E VISUALIZAÇÃO
    // ==========================================
    
    // Gerar opções de ano dinamicamente (10 anos atrás até 30 anos à frente)
    function gerarOpcoesAno() {
        const anoAtual = new Date().getFullYear();
        const select = document.getElementById('anoSelect');
        select.innerHTML = '';
        
        // Range ampliado para suportar planejamento de longo prazo
        for (let ano = anoAtual - 10; ano <= anoAtual + 30; ano++) {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            select.appendChild(option);
        }
        
        // Se o ano selecionado não está na lista, adiciona dinamicamente
        if (!select.querySelector(`option[value="${anoSelecionado}"]`)) {
            const option = document.createElement('option');
            option.value = anoSelecionado;
            option.textContent = anoSelecionado;
            select.appendChild(option);
        }
        
        select.value = anoSelecionado;
    }

    document.getElementById('mesSelect').addEventListener('change', function() {
        mesSelecionado = this.value;
        gerarInstanciasDespesasFixas();
        renderizar();
    });

    document.getElementById('anoSelect').addEventListener('change', function() {
        anoSelecionado = parseInt(this.value);
        gerarInstanciasDespesasFixas();
        renderizar();
    });

    // Navegar entre meses (suporta qualquer ano)
    function navegarPeriodo(direcao) {
        let mes = parseInt(mesSelecionado);
        let ano = anoSelecionado;
        
        mes += direcao;
        
        if (mes > 12) {
            mes = 1;
            ano++;
        } else if (mes < 1) {
            mes = 12;
            ano--;
        }
        
        mesSelecionado = String(mes).padStart(2, '0');
        anoSelecionado = ano;
        
        // Atualizar seletor de ano se necessário (para anos fora do range inicial)
        const selectAno = document.getElementById('anoSelect');
        if (!selectAno.querySelector(`option[value="${ano}"]`)) {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            selectAno.appendChild(option);
        }
        
        document.getElementById('mesSelect').value = mesSelecionado;
        document.getElementById('anoSelect').value = anoSelecionado;
        
        gerarInstanciasDespesasFixas();
        renderizar();
    }

    // Ir para mês atual
    function irParaHoje() {
        const hoje = new Date();
        mesSelecionado = String(hoje.getMonth() + 1).padStart(2, '0');
        anoSelecionado = hoje.getFullYear();
        
        document.getElementById('mesSelect').value = mesSelecionado;
        document.getElementById('anoSelect').value = anoSelecionado;
        
        gerarInstanciasDespesasFixas();
        renderizar();
    }

    // Botão "Ativos" removido — viewMode permanece 'ativos' por padrão.



    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================
    
    // Limpar dados antigos (2025) e despesas atrasadas antigas
    function limparDadosAntigos() {
        let modificado = false;
        
        // 1. Remover TODOS os meses de 2025 e anteriores do despesasFixasMes
        Object.keys(financeiro.despesasFixasMes || {}).forEach(key => {
            if (key < '2026-01') {
                delete financeiro.despesasFixasMes[key];
                modificado = true;
            }
        });
        
        // 2. Remover TODOS os meses de 2025 e anteriores do receitasMes
        Object.keys(financeiro.receitasMes || {}).forEach(key => {
            if (key < '2026-01') {
                delete financeiro.receitasMes[key];
                modificado = true;
            }
        });

        // 3. Para cada mês de 2026+, limpar instâncias atrasadas inválidas
        Object.keys(financeiro.despesasFixasMes || {}).forEach(key => {
            if (key >= '2026-01') {
                const antes = financeiro.despesasFixasMes[key].length;
                financeiro.despesasFixasMes[key] = (financeiro.despesasFixasMes[key] || []).filter(d => {
                    // Manter instâncias normais (não atrasadas)
                    if (!d.atrasada) return true;
                    
                    // Atrasada: verificar se o original existe e NÃO foi pago
                    if (d.idOriginal && d.mesOriginal) {
                        // Se o mês original é anterior a 2026, remover
                        if (d.mesOriginal < '2026-01') return false;
                        
                        const originais = financeiro.despesasFixasMes[d.mesOriginal] || [];
                        const original = originais.find(o => String(o.id) === String(d.idOriginal));
                        
                        // Se o original não existe mais, remover
                        if (!original) return false;
                        
                        // Se o original foi pago, remover (a menos que esta atrasada também já foi paga)
                        if (original.pago && !d.pago) return false;
                        
                        // Verificar que o mesOriginal é exatamente o mês anterior ao key
                        let [ano, mes] = key.split('-').map(Number);
                        mes--;
                        if (mes < 1) { mes = 12; ano--; }
                        const mesAnteriorDoKey = `${ano}-${String(mes).padStart(2, '0')}`;
                        
                        // Só manter atrasada se veio do mês imediatamente anterior
                        if (d.mesOriginal !== mesAnteriorDoKey) return false;
                        
                        return true;
                    }
                    
                    // Atrasada sem referência clara — remover
                    return false;
                });
                if (financeiro.despesasFixasMes[key].length !== antes) modificado = true;
            }
        });
        
        // 4. Remover instâncias duplicadas (mesmo modeloId e não-atrasada aparecendo mais de uma vez)
        Object.keys(financeiro.despesasFixasMes || {}).forEach(key => {
            const despesas = financeiro.despesasFixasMes[key] || [];
            // Ordenar: instâncias com mesOrigem (adiadas) têm prioridade sobre normais geradas
            despesas.sort((a, b) => (b.mesOrigem ? 1 : 0) - (a.mesOrigem ? 1 : 0));
            const vistos = new Set();
            const antes = despesas.length;
            financeiro.despesasFixasMes[key] = despesas.filter(d => {
                // Instâncias marcadas como adiada:true (no mês origem) — sempre manter
                if (d.adiada) return true;

                if (!d.atrasada) {
                    const chave = `normal_${d.modeloId}`;
                    if (vistos.has(chave)) return false;
                    vistos.add(chave);
                }
                if (d.atrasada) {
                    const chave = `atrasada_${d.idOriginal}`;
                    if (vistos.has(chave)) return false;
                    vistos.add(chave);
                }
                return true;
            });
            if (financeiro.despesasFixasMes[key].length !== antes) modificado = true;
        });
        
        if (modificado) {
            localStorage.setItem('financeiro_v5', JSON.stringify(financeiro));
            console.log('Dados limpos: removidas instâncias inválidas/duplicadas');
        }
    }
    
    async function init() {
        // Definir mês e ano atual
        const hoje = new Date();
        mesSelecionado = String(hoje.getMonth() + 1).padStart(2, '0');
        anoSelecionado = hoje.getFullYear();
        
        // Gerar opções de ano e selecionar atual
        gerarOpcoesAno();
        document.getElementById('mesSelect').value = mesSelecionado;
        document.getElementById('anoSelect').value = anoSelecionado;
        
        // Carregar dados do Supabase (prioridade)
        await carregarSupabase();
        
        // Limpar dados antigos de 2025 e atrasadas antigas
        limparDadosAntigos();
        
        // Gerar instâncias de despesas fixas para o mês
        gerarInstanciasDespesasFixas();
        
        // Renderizar interface
        renderizar();
    }

    // Conectar Plano de Quitação ao renderizar
    const originalRenderizar = renderizar;
    renderizar = function() {
        originalRenderizar();
        pa_renderizar();
        renderFinCal();
    };

    // ==========================================
    // CALENDÁRIO FINANCEIRO
    // ==========================================
    let finCalAberto = false;

    function toggleFinCal() {
        finCalAberto = !finCalAberto;
        const body   = document.getElementById('finCalBody');
        const toggle = document.getElementById('finCalToggle');
        body.style.display   = finCalAberto ? 'block' : 'none';
        toggle.classList.toggle('open', finCalAberto);
        if (finCalAberto) renderFinCal();
    }

    function renderFinCal() {
        if (!finCalAberto) return;
        const grid = document.getElementById('finCalGrid');
        if (!grid) return;

        const mesAno   = getMesAnoKey();           // 'YYYY-MM'
        const [ano, mes] = mesAno.split('-').map(Number);
        const hoje     = new Date().toISOString().split('T')[0];

        // ── Coletar todos os eventos do mês ──
        // Receitas (fixas + variáveis)
        const receitas = getReceitasMes();          // [{data, valor, recebido}]
        const despesas = [
            ...getDespesasFixasMes(),               // [{data/dia, valor, pago}]
            ...filtrarPorMes(financeiro.despesasVariaveis || []),
            ...filtrarPorMes(financeiro.despesasAvulsas || []),
        ];

        // Mapear por dia: dia -> {receitaValor, despesaValor, temReceita, temDespesa, temVencido}
        const dias = {};
        const pad  = n => String(n).padStart(2, '0');

        const getIso = d => {
            if (d.data) return d.data.substring(0, 10);
            if (d.dia)  return `${mesAno}-${pad(d.dia)}`;
            return null;
        };

        receitas.forEach(r => {
            const iso = getIso(r);
            if (!iso || !iso.startsWith(mesAno)) return;
            const dia = parseInt(iso.split('-')[2]);
            if (!dias[dia]) dias[dia] = { rec: 0, desp: 0, vencido: false };
            dias[dia].rec += r.valor || 0;
        });

        despesas.forEach(d => {
            const iso = getIso(d);
            if (!iso || !iso.startsWith(mesAno)) return;
            const dia = parseInt(iso.split('-')[2]);
            if (!dias[dia]) dias[dia] = { rec: 0, desp: 0, vencido: false };
            dias[dia].desp += d.valor || 0;
            if (!d.pago && iso < hoje) dias[dia].vencido = true;
        });

        // ── Calcular saldo acumulado dia a dia ──
        const daysInMonth = new Date(ano, mes, 0).getDate();
        let saldoAcum = 0;
        const saldoPorDia = {};
        for (let d = 1; d <= daysInMonth; d++) {
            const info = dias[d] || { rec: 0, desp: 0 };
            saldoAcum += info.rec - info.desp;
            saldoPorDia[d] = saldoAcum;
        }
        const maxAbsSaldo = Math.max(...Object.values(saldoPorDia).map(Math.abs), 1);

        // ── Montar grid ──
        const nomesDias = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
        let html = nomesDias.map(n => `<div class="fin-cal-dia-label">${n}</div>`).join('');

        const firstDay   = new Date(ano, mes - 1, 1).getDay();
        const prevDays   = new Date(ano, mes - 1, 0).getDate();

        // Dias do mês anterior
        for (let i = 0; i < firstDay; i++) {
            const d = prevDays - firstDay + i + 1;
            html += `<div class="fin-cal-dia outro-mes"><span class="fin-cal-num">${d}</span></div>`;
        }

        // Dias do mês
        for (let d = 1; d <= daysInMonth; d++) {
            const iso    = `${ano}-${pad(mes)}-${pad(d)}`;
            const isHoje = iso === hoje;
            const info   = dias[d];
            const saldo  = saldoPorDia[d] || 0;
            const pct    = Math.min(100, Math.round((Math.abs(saldo) / maxAbsSaldo) * 100));
            const barCls = saldo >= 0 ? 'positivo' : 'negativo';

            let dots = '';
            if (info) {
                if (info.rec > 0 && info.desp > 0) {
                    dots = `<div class="fin-cal-dot ambos"></div>`;
                } else {
                    if (info.rec  > 0) dots += `<div class="fin-cal-dot receita"></div>`;
                    if (info.desp > 0) dots += `<div class="fin-cal-dot ${info.vencido ? 'vencido' : 'despesa'}"></div>`;
                }
            }

            const saldoFmt = formatarMoeda(saldo);
            const tooltip  = info
                ? `Saldo: ${saldoFmt}${info.rec > 0 ? ' · Rec: ' + formatarMoeda(info.rec) : ''}${info.desp > 0 ? ' · Desp: ' + formatarMoeda(info.desp) : ''}`
                : `Saldo: ${saldoFmt}`;

            html += `
            <div class="fin-cal-dia${isHoje ? ' hoje' : ''}" onclick="filtrarPorDiaFinCal('${iso}')">
                <span class="fin-cal-num">${d}</span>
                <div class="fin-cal-dots">${dots}</div>
                <div class="fin-cal-barra-wrap">
                    <div class="fin-cal-barra ${barCls}" style="width:${pct}%"></div>
                </div>
                <div class="fin-cal-tooltip">${tooltip}</div>
            </div>`;
        }

        // Completar última semana
        const total = firstDay + daysInMonth;
        const rem   = total % 7 === 0 ? 0 : 7 - (total % 7);
        for (let d = 1; d <= rem; d++) {
            html += `<div class="fin-cal-dia outro-mes"><span class="fin-cal-num">${d}</span></div>`;
        }

        grid.innerHTML = html;

        // Saldo final do mês
        const saldoFinal    = saldoPorDia[daysInMonth] || 0;
        const saldoFinalEl  = document.getElementById('finCalSaldoFinal');
        if (saldoFinalEl) {
            saldoFinalEl.textContent  = formatarMoeda(saldoFinal);
            saldoFinalEl.className    = saldoFinal >= 0 ? 'positivo' : 'negativo';
        }
    }

    function filtrarPorDiaFinCal(iso) {
        // Navegar para o mês correto e mostrar lançamentos do dia no campo de busca (se houver)
        // Por ora, apenas faz scroll para as seções de despesas/receitas
        const secoes = document.querySelectorAll('.section');
        if (secoes.length) secoes[0].scrollIntoView({ behavior: 'smooth' });
    }

    // Iniciar aplicação
    init();

    // ==========================================
    // ALERTAS DE VENCIMENTO
    // ==========================================

    // ==========================================
    // PLANO DE QUITAÇÃO DE DÍVIDAS
    // Funções puras de simulação financeira
    // (métodos "Avalanche" e "Bola de Neve")
    // ==========================================

    // Lista as dívidas ativas em formato simplificado para os cálculos
    function pa_listarDividas() {
        return (financeiro.emprestimos || [])
            .filter(e => !e.arquivado && (e.principal || 0) > 0)
            .map(e => ({
                id: e.id,
                descricao: e.descricao || 'Dívida',
                saldo: e.principal || 0,
                taxaMensal: (e.taxaJuros || 0) / 100
            }));
    }

    // Juros gerados em um mês para uma dívida, dado seu saldo atual
    function pa_jurosMes(divida) {
        return divida.saldo * divida.taxaMensal;
    }

    // Resumo geral das dívidas ativas
    function pa_resumoDividas(dividas) {
        const totalDevido = dividas.reduce((s, d) => s + d.saldo, 0);
        const custoJurosMensal = dividas.reduce((s, d) => s + pa_jurosMes(d), 0);
        const taxaMediaPonderada = totalDevido > 0
            ? dividas.reduce((s, d) => s + d.saldo * d.taxaMensal, 0) / totalDevido
            : 0;
        return { quantidade: dividas.length, totalDevido, custoJurosMensal, taxaMediaPonderada };
    }

    // Ordenação "Avalanche": maior taxa de juros primeiro (minimiza juros totais pagos)
    function pa_ordenarAvalanche(dividas) {
        // Mayor taxa primeiro — minimiza juros totais
        return [...dividas].sort((a, b) => b.taxaMensal - a.taxaMensal || b.saldo - a.saldo);
    }

    // Ordenação "Bola de Neve": menor saldo primeiro — motivação psicológica
    function pa_ordenarBolaDeNeve(dividas) {
        return [...dividas].sort((a, b) => a.saldo - b.saldo || b.taxaMensal - a.taxaMensal);
    }

    // Ordenação "Híbrida Inteligente": pontuação composta considerando
    // taxa, prazo estimado de quitação e custo acumulado
    function pa_ordenarHibrida(dividas, extraMensal) {
        const totalMinimos = dividas.reduce((s, d) => s + d.saldo * d.taxaMensal, 0);
        const pagTotal = totalMinimos + (extraMensal || 0);
        
        return [...dividas].sort((a, b) => {
            // Custo mensal em juros
            const custoA = a.saldo * a.taxaMensal;
            const custoB = b.saldo * b.taxaMensal;
            
            // Meses estimados para quitar esta dívida isolada com o pagamento total
            const mesesA = pagTotal > custoA ? Math.log(pagTotal / (pagTotal - custoA)) / Math.log(1 + a.taxaMensal) : 9999;
            const mesesB = pagTotal > custoB ? Math.log(pagTotal / (pagTotal - custoB)) / Math.log(1 + b.taxaMensal) : 9999;
            
            // Juros acumulados estimados
            const jurosA = custoA * mesesA;
            const jurosB = custoB * mesesB;
            
            // Score: maior custo de juros acumulados = maior prioridade
            return jurosB - jurosA;
        });
    }

    /**
     * Simula a quitação das dívidas mês a mês.
     *
     * O "pagamento mensal total" é fixo = soma dos pagamentos mínimos
     * (mínimo de cada dívida = juros do saldo daquele mês, o suficiente para
     * o saldo não crescer) + o valor extra informado pelo usuário.
     * A cada mês, primeiro os juros incidem sobre os saldos; depois o
     * pagamento total é distribuído na ORDEM de prioridade: cada dívida
     * recebe o quanto for preciso para zerar (até o limite do que sobrou),
     * e o restante "rola" para a próxima da fila. Quando uma dívida é
     * quitada, o valor que ela consumia passa a engrossar o pagamento das
     * próximas (efeito bola de neve / avalanche).
     *
     * @param {Array}  dividas    [{id, descricao, saldo, taxaMensal}]
     * @param {Array}  ordemIds   ids das dívidas na ordem de prioridade
     * @param {number} extraMensal valor extra além dos mínimos (R$)
     * @param {number} [limiteMeses=600] trava de segurança (50 anos)
     */
    function pa_simularQuitacao(dividas, ordemIds, extraMensal, limiteMeses) {
        limiteMeses = limiteMeses || 600;
        extraMensal = Math.max(0, extraMensal || 0);

        const ordem = ordemIds
            .map(id => dividas.find(d => String(d.id) === String(id)))
            .filter(Boolean)
            .map(d => ({ id: d.id, descricao: d.descricao, saldo: d.saldo, taxaMensal: d.taxaMensal, quitadaNoMes: null }));

        const minimosIniciais = ordem.reduce((s, d) => s + d.saldo * d.taxaMensal, 0);
        const pagamentoMensalTotal = minimosIniciais + extraMensal;

        if (extraMensal <= 0) {
            return {
                convergiu: false, pagamentoMensalTotal, minimosIniciais, extraMensal,
                meses: null, totalJuros: null, totalPago: null, cronograma: [],
                ordemFinal: ordem.map(d => ({ id: d.id, descricao: d.descricao, mesQuitacao: null })),
                economiaVsMinimo: null
            };
        }

        let totalJuros = 0, totalPago = 0, mes = 0;
        const cronograma = [];

        while (ordem.some(d => d.saldo > 0.005) && mes < limiteMeses) {
            mes++;
            ordem.forEach(d => {
                if (d.saldo > 0.005) {
                    const juros = d.saldo * d.taxaMensal;
                    d.saldo += juros;
                    totalJuros += juros;
                }
            });

            let disponivel = pagamentoMensalTotal;
            const quitadasNoMes = [];
            for (const d of ordem) {
                if (disponivel <= 0) break;
                if (d.saldo <= 0.005) continue;
                const pagar = Math.min(d.saldo, disponivel);
                d.saldo -= pagar;
                disponivel -= pagar;
                totalPago += pagar;
                if (d.saldo <= 0.005 && d.quitadaNoMes === null) {
                    d.quitadaNoMes = mes;
                    quitadasNoMes.push({ id: d.id, descricao: d.descricao });
                }
            }
            if (quitadasNoMes.length > 0) cronograma.push({ mes, quitadas: quitadasNoMes });
        }

        return {
            convergiu: mes < limiteMeses, pagamentoMensalTotal, minimosIniciais, extraMensal,
            meses: mes, totalJuros, totalPago, cronograma,
            ordemFinal: ordem.map(d => ({ id: d.id, descricao: d.descricao, mesQuitacao: d.quitadaNoMes })),
            economiaVsMinimo: minimosIniciais * mes - totalJuros
        };
    }

    // Quanto sobra no mês corrente após despesas e após cobrir os juros
    // mínimos das dívidas atuais — vira a sugestão de "valor extra"
    function pa_capacidadeExtra() {
        const receitasFixasMes = getReceitasMes().reduce((s, r) => s + (r.valor || 0), 0);
        const receitasVarMes = getReceitasVariaveisMes().reduce((s, r) => s + (r.valor || 0), 0);
        const despesasFixasMes = getDespesasFixasMes().reduce((s, d) => s + (d.valor || 0), 0);
        const despesasVarMes = filtrarPorMes(financeiro.despesasVariaveis || []).filter(d => !d.pausado).reduce((s, d) => s + (d.valor || 0), 0);
        const despesasAvulsasMes = filtrarPorMes(financeiro.despesasAvulsas || []).reduce((s, d) => s + (d.valor || 0), 0);

        const dividas = pa_listarDividas();
        const minimosAtuais = dividas.reduce((s, d) => s + pa_jurosMes(d), 0);
        const parcelasPendentes = getParcelasPendentesMes().total;

        const receitaTotal = receitasFixasMes + receitasVarMes;
        const despesaTotal = despesasFixasMes + despesasVarMes + despesasAvulsasMes;
        const sobra = receitaTotal - despesaTotal - minimosAtuais - parcelasPendentes;

        return { receitaTotal, despesaTotal, minimosAtuais, parcelasPendentes, sobra, sugestaoExtra: Math.max(0, Math.round(sobra * 100) / 100) };
    }

    // Reserva de emergência: quanto falta para cobrir N meses de despesas fixas
    function pa_reservaEmergencia(mesesAlvo) {
        mesesAlvo = mesesAlvo || 6;
        const despesasFixasMensais = (financeiro.despesasFixas || []).filter(d => d.ativa).reduce((s, d) => s + (d.valor || 0), 0);
        const totalEconomias = (financeiro.economias || []).reduce((s, e) => s + (e.saldo || 0), 0);
        const alvo = despesasFixasMensais * mesesAlvo;
        return {
            despesasFixasMensais, totalEconomias, alvo,
            falta: Math.max(0, alvo - totalEconomias),
            mesesCobertos: despesasFixasMensais > 0 ? totalEconomias / despesasFixasMensais : (totalEconomias > 0 ? Infinity : 0),
            mesesAlvo
        };
    }

    // Monta o plano completo: resumo, comparação Avalanche x Bola de Neve,
    // ordem recomendada conforme a estratégia escolhida.
    function pa_gerarPlano(extraManual, estrategia) {
        const dividas = pa_listarDividas();
        const resumo = pa_resumoDividas(dividas);
        const capacidade = pa_capacidadeExtra();
        const reserva = pa_reservaEmergencia(6);

        const extra = (extraManual !== null && extraManual !== undefined && extraManual !== '')
            ? Math.max(0, parseFloat(extraManual) || 0)
            : capacidade.sugestaoExtra;

        const ordemAvalanche    = pa_ordenarAvalanche(dividas);
        const ordemBolaDeNeve   = pa_ordenarBolaDeNeve(dividas);
        const ordemHibrida      = pa_ordenarHibrida(dividas, extra);

        const simAvalanche  = pa_simularQuitacao(dividas, ordemAvalanche.map(d => d.id), extra);
        const simBolaDeNeve = pa_simularQuitacao(dividas, ordemBolaDeNeve.map(d => d.id), extra);

        // Validar estratégia
        const estrategiasValidas = ['avalanche', 'bolaDeNeve'];
        if (!estrategiasValidas.includes(estrategia)) estrategia = 'avalanche';

        const mapaEscolha = {
            avalanche:  { sim: simAvalanche,  ordem: ordemAvalanche  },
            bolaDeNeve: { sim: simBolaDeNeve, ordem: ordemBolaDeNeve },

        };
        const escolha = mapaEscolha[estrategia];

        return {
            dividas, resumo, capacidade, reserva, extra, estrategia,
            avalanche: simAvalanche, bolaDeNeve: simBolaDeNeve,
            ordem: escolha.ordem.map(d => ({ id: d.id, descricao: d.descricao, saldo: d.saldo, taxaMensal: d.taxaMensal })),
            plano: escolha.sim
        };
    }

    // "Mês/Ano" a partir do mês selecionado + um deslocamento em meses
    function pa_nomeMes(offsetMeses) {
        const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const d = new Date(parseInt(anoSelecionado), parseInt(mesSelecionado) - 1 + offsetMeses, 1);
        return `${nomes[d.getMonth()]}/${d.getFullYear()}`;
    }

    // ==========================================
    // PLANO DE QUITAÇÃO DE DÍVIDAS — RENDERIZAÇÃO
    // ==========================================

    // Simula mês a mês e retorna quanto pagar em cada dívida por mês
    function pa_simularDetalhado(dividas, ordemIds, extraMensal, limiteMeses) {
        limiteMeses = limiteMeses || 120;
        extraMensal = Math.max(0, extraMensal || 0);
        const ordem = ordemIds
            .map(id => dividas.find(d => String(d.id) === String(id)))
            .filter(Boolean)
            .map(d => ({ id: d.id, descricao: d.descricao, saldo: d.saldo, taxaMensal: d.taxaMensal }));
        const minimosIniciais = ordem.reduce((s, d) => s + d.saldo * d.taxaMensal, 0);
        const pagTotal = minimosIniciais + extraMensal;
        const planoMeses = [];
        let mes = 0;
        while (ordem.some(d => d.saldo > 0.005) && mes < limiteMeses) {
            mes++;
            const pagamentos = [];
            ordem.forEach(d => { if (d.saldo > 0.005) d.saldo += d.saldo * d.taxaMensal; });
            let disp = pagTotal;
            for (const d of ordem) {
                if (disp <= 0.005) break;
                if (d.saldo <= 0.005) continue;
                const pagar = Math.min(d.saldo, disp);
                d.saldo -= pagar; disp -= pagar;
                pagamentos.push({ id: d.id, descricao: d.descricao, valor: pagar, saldoRestante: Math.max(0, d.saldo), quitada: d.saldo <= 0.005 });
            }
            planoMeses.push({ mes, pagamentos, totalPago: pagTotal - disp });
        }
        return planoMeses;
    }

    function pa_renderizar() {
        const container = document.getElementById('planoQuitacaoContainer');
        if (!container) return;

        const dividas = pa_listarDividas();
        const reserva = pa_reservaEmergencia(6);
        const estrategiaInput = document.querySelector('input[name="pqEstrategia"]:checked');
        const estrategia = estrategiaInput ? estrategiaInput.value : 'avalanche';
        const extraInput  = document.getElementById('pqExtraMensal');
        const sliderInput = document.getElementById('pqSlider');
        const capacidade  = pa_capacidadeExtra();

        if (extraInput && extraInput.value === '')
            extraInput.value = capacidade.sugestaoExtra > 0 ? capacidade.sugestaoExtra.toFixed(2) : '0.00';
        if (sliderInput && !sliderInput.dataset.init) {
            sliderInput.max = Math.max(capacidade.sugestaoExtra * 3, 5000).toFixed(0);
            sliderInput.value = extraInput ? extraInput.value : '0';
            sliderInput.dataset.init = '1';
        }

        const extraManual = extraInput ? extraInput.value : null;

        // ── Reserva ──
        const pctRes = reserva.alvo > 0 ? Math.min(100, (reserva.totalEconomias / reserva.alvo) * 100) : 100;
        const reservaHtml = `<div class="pq-reserva">
            <div class="pq-reserva-header">
                <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:12px;height:12px;vertical-align:-1px;margin-right:3px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Reserva de Emergência</span>
                <span>${formatarMoeda(reserva.totalEconomias)} / ${formatarMoeda(reserva.alvo)}</span>
            </div>
            <div class="pq-reserva-bar"><div class="pq-reserva-fill" style="width:${pctRes.toFixed(0)}%"></div></div>
            ${reserva.falta > 0
                ? `<div class="pq-reserva-nota">Faltam <strong>${formatarMoeda(reserva.falta)}</strong> para ${reserva.mesesAlvo} meses de reserva.</div>`
                : `<div class="pq-reserva-nota pq-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px;vertical-align:-1px;margin-right:3px"><polyline points="20 6 9 17 4 12"/></svg> Reserva completa!</div>`}
        </div>`;

        if (dividas.length === 0) {
            container.innerHTML = `<div class="pq-vazio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;vertical-align:-1px;margin-right:3px"><polyline points="20 6 9 17 4 12"/></svg> Você não tem dívidas ativas!</div>${reservaHtml}`;
            return;
        }

        const plano = pa_gerarPlano(extraManual, estrategia);
        const r     = plano.resumo;
        const sim   = plano.plano;

        // ════════════════════════════════════════
        // 1. PAINEL DE SAÚDE (nota 0-100)
        // ════════════════════════════════════════
        const taxaMedia = r.taxaMediaPonderada * 100;
        const percRenda = r.totalDevido > 0 && capacidade.receitaTotal > 0
            ? (r.custoJurosMensal / capacidade.receitaTotal) * 100 : 0;
        const custoDiario = r.custoJurosMensal / 30;

        // Nota: 100 = sem dívidas, 0 = situação crítica
        let nota = 100;
        nota -= Math.min(40, taxaMedia * 4);           // até -40 pela taxa de juros
        nota -= Math.min(30, percRenda * 2);           // até -30 pelo comprometimento da renda
        nota -= plano.extra <= 0 ? 20 : 0;            // -20 se não tem extra para pagar
        nota = Math.max(0, Math.min(100, Math.round(nota)));

        const notaCor  = nota >= 70 ? '#5fe08a' : nota >= 40 ? '#fbe2b4' : '#ff6b5b';
        const notaLabel= nota >= 70 ? 'Controlado' : nota >= 40 ? 'Atenção' : 'Crítico';
        const notaFrase= nota >= 70
            ? 'Sua situação está sob controle. Continue pagando em dia e acelerando a quitação.'
            : nota >= 40
            ? 'Situação administrável, mas os juros estão pesando. Vale acelerar o pagamento.'
            : 'Os juros estão consumindo uma parte importante da sua renda. Priorize quitar dívidas.';

        const saudeDash = nota >= 70
            ? `stroke-dasharray: ${nota} ${100 - nota}; stroke: ${notaCor};`
            : nota >= 40
            ? `stroke-dasharray: ${nota} ${100 - nota}; stroke: ${notaCor};`
            : `stroke-dasharray: ${nota} ${100 - nota}; stroke: ${notaCor};`;

        const saudeHtml = `
        <div class="pq-saude">
            <div class="pq-saude-gauge-wrap">
                <svg viewBox="0 0 36 36" class="pq-saude-svg">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border-s)" stroke-width="3"/>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke-width="3"
                        stroke-linecap="round"
                        style="${saudeDash}"
                        transform="rotate(-90 18 18)"/>
                    <text x="18" y="20.5" class="pq-saude-num" fill="${notaCor}">${nota}</text>
                </svg>
                <div class="pq-saude-label" style="color:${notaCor};">${notaLabel}</div>
            </div>
            <div class="pq-saude-info">
                <div class="pq-saude-frase">${notaFrase}</div>
                <div class="pq-saude-metricas">
                    <div class="pq-saude-metrica">
                        <span class="pq-sm-label">Custo diário dos juros</span>
                        <span class="pq-sm-val" style="color:var(--red);">${formatarMoeda(custoDiario)}/dia</span>
                    </div>
                    <div class="pq-saude-metrica">
                        <span class="pq-sm-label">Juros por mês</span>
                        <span class="pq-sm-val" style="color:var(--red);">${formatarMoeda(r.custoJurosMensal)}/mês</span>
                    </div>
                    <div class="pq-saude-metrica">
                        <span class="pq-sm-label">Total em dívidas</span>
                        <span class="pq-sm-val">${formatarMoeda(r.totalDevido)}</span>
                    </div>
                    <div class="pq-saude-metrica">
                        <span class="pq-sm-label">Taxa média</span>
                        <span class="pq-sm-val">${taxaMedia.toFixed(1)}% a.m.</span>
                    </div>
                </div>
            </div>
        </div>`;

        if (plano.extra <= 0) {
            container.innerHTML = `${saudeHtml}
            <div class="pq-alerta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:-2px;margin-right:6px;flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <div>Pagando só os juros mínimos, suas dívidas custam <strong>${formatarMoeda(r.custoJurosMensal)}/mês para sempre</strong>.
                Use o campo acima para simular um valor extra mensal e ver o plano de quitação.</div>
            </div>${reservaHtml}`;
            return;
        }

        // ════════════════════════════════════════
        // 2. PRÓXIMOS 3 MESES — ações concretas
        // ════════════════════════════════════════
        const detalhado3 = pa_simularDetalhado(pa_listarDividas(), plano.ordem.map(d => d.id), plano.extra, 3);
        const meses3Html = detalhado3.map((m, idx) => `
            <div class="pq-mes-card${idx === 0 ? ' pq-mes-atual' : ''}">
                <div class="pq-mes-titulo">${idx === 0 ? '▶ ' : ''}${pa_nomeMes(idx)}${idx === 0 ? ' — AGORA' : ''}</div>
                <div class="pq-mes-total">Total: <strong>${formatarMoeda(sim.pagamentoMensalTotal)}</strong></div>
                ${m.pagamentos.map((p, i) => `
                    <div class="pq-mes-item${p.quitada ? ' pq-mes-quita' : ''}">
                        <span class="pq-mes-num">${i + 1}</span>
                        <span class="pq-mes-nome">${p.descricao}</span>
                        <span class="pq-mes-valor">${formatarMoeda(p.valor)}</span>
                        ${p.quitada ? '<span class="pq-mes-badge">QUITADA!</span>' : ''}
                    </div>`).join('')}
            </div>`).join('');

        const proxMesesHtml = `
        <div class="pq-3meses">
            <div class="pq-secao-titulo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:13px;height:13px;vertical-align:-1px;margin-right:5px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Próximos 3 meses — o que pagar
            </div>
            <div class="pq-3meses-grid">${meses3Html}</div>
        </div>`;

        // ════════════════════════════════════════
        // 3. CELEBRAÇÃO DE PROGRESSO
        // ════════════════════════════════════════
        const totalOriginal = plano.ordem.reduce((s, d) => s + (d.saldoOriginal || d.saldo), 0);
        const totalAtual    = r.totalDevido;
        const jaQuitou      = Math.max(0, totalOriginal - totalAtual);
        const pctQuitado    = totalOriginal > 0 ? Math.min(100, (jaQuitou / totalOriginal) * 100) : 0;
        const marcosHtml    = sim.convergiu ? sim.ordemFinal.filter(d => d.mesQuitacao).map(d => {
            const mesesRestantes = d.mesQuitacao;
            return `<div class="pq-marco">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px;flex-shrink:0;color:var(--gold)"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span><strong>${d.descricao}</strong> — quitada em ${pa_nomeMes(mesesRestantes)} (em ${mesesRestantes} meses)</span>
            </div>`;
        }).join('') : '';

        const celebracaoHtml = `
        <div class="pq-celebracao">
            <div class="pq-secao-titulo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:13px;height:13px;vertical-align:-1px;margin-right:5px"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Seu progresso e marcos
            </div>
            ${jaQuitou > 0 ? `
            <div class="pq-prog-total">
                <div class="pq-prog-header">
                    <span>Já quitou <strong>${formatarMoeda(jaQuitou)}</strong></span>
                    <span style="color:var(--green);">${pctQuitado.toFixed(0)}%</span>
                </div>
                <div class="pq-prog-track">
                    <div class="pq-prog-fill" style="width:${pctQuitado}%"></div>
                    <div class="pq-prog-fill-pending" style="width:${100-pctQuitado}%"></div>
                </div>
                <div class="pq-prog-legenda">
                    <span style="color:var(--green);">Quitado</span>
                    <span style="color:var(--text-dim);">Restante: ${formatarMoeda(totalAtual)}</span>
                </div>
            </div>` : `
            <div class="pq-prog-total">
                <div class="pq-prog-header">
                    <span>Progresso do plano</span>
                    <span style="color:var(--text-dim);">0%</span>
                </div>
                <div class="pq-prog-track">
                    <div class="pq-prog-fill" style="width:0%"></div>
                    <div class="pq-prog-fill-pending" style="width:100%"></div>
                </div>
                <div class="pq-prog-legenda">
                    <span style="color:var(--text-dim);">Nenhuma dívida quitada ainda — continue!</span>
                </div>
            </div>`}
            ${marcosHtml ? `<div class="pq-marcos">${marcosHtml}</div>` : ''}
        </div>`;

        // ════════════════════════════════════════
        // 4. SIMULADOR DE CENÁRIOS
        // ════════════════════════════════════════
        const sim200   = pa_simularQuitacao(pa_listarDividas(), plano.ordem.map(d => d.id), plano.extra + 200);
        const sim500   = pa_simularQuitacao(pa_listarDividas(), plano.ordem.map(d => d.id), plano.extra + 500);
        const cenarios = [
            { label: `+R$100/mês`, extra: 100 },
            { label: `+R$200/mês`, extra: 200 },
            { label: `+R$500/mês`, extra: 500 },
        ].map(c => {
            const simC = pa_simularQuitacao(pa_listarDividas(), plano.ordem.map(d => d.id), plano.extra + c.extra);
            const econJ = sim.convergiu && simC.convergiu ? sim.totalJuros - simC.totalJuros : 0;
            const econM = sim.convergiu && simC.convergiu ? sim.meses - simC.meses : 0;
            return `<div class="pq-cenario">
                <div class="pq-cenario-label">${c.label}</div>
                ${simC.convergiu ? `
                <div class="pq-cenario-dados">
                    <span class="pq-cenario-val" style="color:var(--green);">-${econM} meses</span>
                    <span class="pq-cenario-sub">economiza ${formatarMoeda(econJ)} em juros</span>
                </div>` : '<div class="pq-cenario-dados"><span class="pq-cenario-sub">Sem dados</span></div>'}
            </div>`;
        }).join('');

        const simuladorHtml = `
        <div class="pq-simulador">
            <div class="pq-secao-titulo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:13px;height:13px;vertical-align:-1px;margin-right:5px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                E se eu pagar mais?
            </div>
            <div class="pq-cenarios-grid">${cenarios}</div>
        </div>`;

        // ════════════════════════════════════════
        // 5. CUSTO DIÁRIO EM DESTAQUE
        // ════════════════════════════════════════
        const custoHtml = `
        <div class="pq-custo-dia">
            <div class="pq-custo-valor">${formatarMoeda(custoDiario)}</div>
            <div class="pq-custo-desc">por dia em juros — ou ${formatarMoeda(custoDiario * 7)}/semana</div>
            ${sim.convergiu ? `<div class="pq-custo-fim">Com seu plano atual, esse custo some em <strong>${pa_nomeMes(sim.meses)}</strong></div>` : ''}
        </div>`;

        // ── Ordem de prioridade ──
        const ordemHtml = `
        <div class="pq-ordem-explicada">
            <div class="pq-secao-titulo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:13px;height:13px;vertical-align:-1px;margin-right:5px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Ordem de prioridade
            </div>
            <div class="pq-ordem-desc">Toda sobra vai para a dívida nº 1. Quando ela acabar, tudo vai para a nº 2.</div>
            ${plano.ordem.map((d, i) => {
                const final = sim.ordemFinal.find(o => String(o.id) === String(d.id));
                return `<div class="pq-ordem-item">
                    <div class="pq-ordem-badge">${i === 0 ? 'FOCO' : i + 1}</div>
                    <div class="pq-ordem-dados">
                        <div class="pq-ordem-nome">${d.descricao}</div>
                        <div class="pq-ordem-meta">${formatarMoeda(d.saldo)} · ${(d.taxaMensal*100).toFixed(1)}% a.m.${final?.mesQuitacao ? ` · <span style="color:var(--gold);">Quitada em ${pa_nomeMes(final.mesQuitacao)}</span>` : ''}</div>
                    </div>
                </div>`;
            }).join('')}
        </div>`;

        // ── Timeline ──
        const cores = ['#46f0d2','#e8c96a','#a07828','#d4a843','#f0c040','#8b6914'];
        const totalM = sim.meses || 1;
        const timelineHtml = sim.convergiu && sim.meses <= 240 ? `
        <div class="pq-timeline">
            <div class="pq-secao-titulo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:13px;height:13px;vertical-align:-1px;margin-right:5px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                Linha do tempo
            </div>
            <div class="pq-timeline-bar">
                ${plano.ordem.map((d, i) => {
                    const final = sim.ordemFinal.find(o => String(o.id) === String(d.id));
                    const mesQ  = final?.mesQuitacao || totalM;
                    const prev  = i > 0 ? (sim.ordemFinal.find(o => String(o.id) === String(plano.ordem[i-1].id))?.mesQuitacao || 0) : 0;
                    const larg  = Math.max(2, ((mesQ - prev) / totalM) * 100);
                    return `<div class="pq-tl-bloco" style="width:${larg}%;background:${cores[i%cores.length]}" title="${d.descricao} — ${pa_nomeMes(mesQ)}">
                        <span class="pq-tl-label">${d.descricao.split(' ')[0]}</span>
                    </div>`;
                }).join('')}
            </div>
            <div class="pq-timeline-legenda">
                ${plano.ordem.map((d, i) => {
                    const final = sim.ordemFinal.find(o => String(o.id) === String(d.id));
                    return `<span class="pq-tl-leg-item"><span style="width:8px;height:8px;border-radius:2px;background:${cores[i%cores.length]};display:inline-block;margin-right:4px;flex-shrink:0"></span>${d.descricao}: <strong style="margin-left:3px;">${final?.mesQuitacao ? pa_nomeMes(final.mesQuitacao) : '—'}</strong></span>`;
                }).join('')}
            </div>
        </div>` : '';

        // ── Comparativo das 3 estratégias ──
        let comparacaoHtml = '';
        if (dividas.length >= 1) {
            const av = plano.avalanche, bn = plano.bolaDeNeve;

            const estrategias = [
                {
                    id: 'avalanche', nome: 'Avalanche', desc: 'Menor custo em juros', sim: av,
                    cor: 'var(--gold)',
                    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:11px;height:11px;vertical-align:-1px;margin-right:4px"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>`,
                    explicacao: 'Ataca a dívida com maior taxa primeiro. Matematicamente ótima para minimizar juros pagos no total.'
                },
                {
                    id: 'bolaDeNeve', nome: 'Bola de Neve', desc: 'Motivação e vitórias rápidas', sim: bn,
                    cor: '#5aa9f0',
                    icone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:11px;height:11px;vertical-align:-1px;margin-right:4px"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 7l-5-5-5 5"/><path d="M7 17l5 5 5-5"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`,
                    explicacao: 'Ataca a dívida com menor saldo primeiro. Cada dívida quitada libera dinheiro e gera motivação para continuar.'
                }
            ];

            const convergiram = estrategias.filter(e => e.sim?.convergiu);
            const melhorJuros = convergiram.length > 0 ? convergiram.reduce((a,b) => a.sim.totalJuros < b.sim.totalJuros ? a : b) : null;
            const melhorTempo = convergiram.length > 0 ? convergiram.reduce((a,b) => a.sim.meses < b.sim.meses ? a : b) : null;

            const cards = estrategias.map(e => {
                const isAtiva = plano.estrategia === e.id;
                const isMelhorJuros = melhorJuros?.id === e.id;
                const isMelhorTempo = melhorTempo?.id === e.id;
                const s = e.sim;
                return `<div class="pq-comp-card ${isAtiva ? 'pq-ativo' : ''}" style="${isAtiva ? `border-color:${e.cor};` : ''}" onclick="document.querySelector('input[name=pqEstrategia][value=${e.id}]').click()">
                    <div class="pq-comp-titulo" style="color:${e.cor};">${e.icone}${e.nome}</div>
                    <div class="pq-comp-subtitulo">${e.desc}</div>
                    ${s?.convergiu ? `
                    <div class="pq-comp-linha">Quita em <strong>${s.meses} meses</strong>${isMelhorTempo ? ' <span class="pq-comp-tag verde">mais rápido</span>' : ''}</div>
                    <div class="pq-comp-linha">Juros totais: <strong style="color:var(--red);">${formatarMoeda(s.totalJuros)}</strong>${isMelhorJuros ? ' <span class="pq-comp-tag">mais barato</span>' : ''}</div>
                    <div class="pq-comp-prim">1ª quitada: ${s.ordemFinal?.[0]?.descricao || '—'} em ${pa_nomeMes(s.ordemFinal?.[0]?.mesQuitacao || 0)}</div>
                    ` : '<div class="pq-comp-linha" style="color:var(--text-dim);">Sem dados</div>'}
                    <div class="pq-comp-explicacao">${e.explicacao}</div>
                    ${isAtiva ? '<div class="pq-comp-ativa-tag">✓ Ativa</div>' : '<div class="pq-comp-selecionar">Selecionar</div>'}
                </div>`;
            }).join('');

            // Recomendação de especialista
            let recomendacao = '';
            if (convergiram.length >= 2) {
                const economiaSobreBn = bn?.convergiu && av?.convergiu ? bn.totalJuros - av.totalJuros : 0;
                const mesesPrimAv = av?.ordemFinal?.[0]?.mesQuitacao || 999;
                const mesesPrimBn = bn?.ordemFinal?.[0]?.mesQuitacao || 999;
                const txMedia = dividas.reduce((s,d)=>s+d.taxaMensal,0)/dividas.length;

                if (txMedia > 0.08) {
                    recomendacao = `<strong>💡 Recomendação:</strong> Com taxas médias acima de ${(txMedia*100).toFixed(0)}% a.m., cada mês sem pagar é dinheiro perdido. A <strong>Avalanche</strong> é a escolha mais inteligente — economiza ${formatarMoeda(Math.max(0,economiaSobreBn))} em juros vs Bola de Neve.`;
                } else if (dividas.length >= 4 && mesesPrimBn < mesesPrimAv) {
                    recomendacao = `<strong>💡 Recomendação:</strong> Com várias dívidas, a <strong>Bola de Neve</strong> quita a primeira ${mesesPrimAv - mesesPrimBn} meses antes. Menos dívidas = menos estresse e mais foco.`;
                } else {
                    recomendacao = `<strong>💡 Recomendação:</strong> A diferença entre as estratégias é pequena para seu caso. Escolha pela <strong>motivação</strong>: prefere pagar menos juros (Avalanche) ou eliminar dívidas logo (Bola de Neve)?`;
                }
            }

            comparacaoHtml = `
                <div class="pq-comparacao">
                    <div class="pq-secao-titulo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:13px;height:13px;vertical-align:-1px;margin-right:5px"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        Compare e escolha sua estratégia
                    </div>
                    <div class="pq-comp-3">${cards}</div>
                    ${recomendacao ? `<div class="pq-comp-dica">${recomendacao}</div>` : ''}
                </div>`;
        }

        // ── Cronograma ──
        let cronogramaHtml = '';
        if (sim.cronograma?.length > 0) {
            cronogramaHtml = `<div class="pq-crono">
                <button class="pq-crono-toggle" onclick="this.classList.toggle('open');this.nextElementSibling.style.display=this.classList.contains('open')?'block':'none'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:12px;height:12px;vertical-align:-1px;margin-right:4px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>
                    Ver cronograma completo
                    <svg class="pq-crono-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;margin-left:auto;transition:transform .25s"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div class="pq-crono-body" style="display:none">
                    ${sim.cronograma.map(e => `<div class="pq-crono-linha">
                        <span class="pq-crono-mes">${pa_nomeMes(e.mes)}</span>
                        <span class="pq-crono-ev">${e.quitadas.map(q => `<strong>${q.descricao}</strong> quitada`).join(' · ')}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#5fe08a" stroke-width="2.5" style="width:11px;height:11px;flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>`).join('')}
                </div>
            </div>`;
        }

        container.innerHTML = `
            ${saudeHtml}
            ${custoHtml}
            ${proxMesesHtml}
            ${celebracaoHtml}
            ${simuladorHtml}
            ${ordemHtml}
            ${timelineHtml}
            ${comparacaoHtml}
            ${cronogramaHtml}
            ${reservaHtml}
        `;
    }
    // Estimativa grosseira de "anos" quando a simulação não converge dentro do limite de meses
    function limiteAnos(sim) {
        return Math.floor((sim.meses || 600) / 12);
    }

    // ==========================================
    // RELATÓRIO COMPLETO — funções auxiliares
    // ==========================================

    // Diagnóstico financeiro do mês (receita, despesas, sobra, % comprometido)
    function pa_diagnosticoFinanceiro() {
        const receitasFixasMes = getReceitasMes().reduce((s, r) => s + (r.valor || 0), 0);
        const receitasVarMes = getReceitasVariaveisMes().reduce((s, r) => s + (r.valor || 0), 0);
        const despesasEssenciais = getDespesasFixasMes().reduce((s, d) => s + (d.valor || 0), 0);
        const despesasVarMes = filtrarPorMes(financeiro.despesasVariaveis || []).filter(d => !d.pausado).reduce((s, d) => s + (d.valor || 0), 0);
        const despesasAvulsasMes = filtrarPorMes(financeiro.despesasAvulsas || []).reduce((s, d) => s + (d.valor || 0), 0);
        const despesasVariaveis = despesasVarMes + despesasAvulsasMes;

        const dividas = pa_listarDividas();
        const minimos = dividas.reduce((s, d) => s + pa_jurosMes(d), 0);
        const parcelasPendentes = getParcelasPendentesMes().total;
        const totalMinimos = minimos + parcelasPendentes;

        const receitaTotal = receitasFixasMes + receitasVarMes;
        const sobra = receitaTotal - despesasEssenciais - despesasVariaveis - totalMinimos;
        const percComprometido = receitaTotal > 0 ? (totalMinimos / receitaTotal) * 100 : 0;

        return { receitaTotal, despesasEssenciais, despesasVariaveis, minimos, parcelasPendentes, totalMinimos, sobra, percComprometido };
    }

    // Barra de progresso em caracteres (ex.: "████████░░░░░░░░░░░░")
    function pa_barraAscii(pct, tamanho) {
        tamanho = tamanho || 20;
        const p = Math.max(0, Math.min(100, pct || 0));
        const preenchido = Math.round((p / 100) * tamanho);
        return '█'.repeat(preenchido) + '░'.repeat(tamanho - preenchido);
    }

    // Texto de análise crítica do diagnóstico (seção 1)
    function pa_analiseDiagnostico(diag) {
        if (diag.percComprometido >= 50) {
            return `Mais da metade da sua renda líquida está comprometida com o pagamento mínimo das dívidas (${diag.percComprometido.toFixed(1)}%). Esse nível de comprometimento reduz drasticamente sua capacidade de poupar e investir, e qualquer imprevisto tende a gerar novas dívidas. Romper esse ciclo é a prioridade número um antes de qualquer outro objetivo financeiro.`;
        }
        if (diag.percComprometido >= 30) {
            return `Seu comprometimento com dívidas está em um nível de atenção (${diag.percComprometido.toFixed(1)}%). Ainda há espaço no orçamento, mas cada real destinado a juros é um real que deixa de compor seu patrimônio — vale acelerar a quitação.`;
        }
        if (diag.percComprometido > 0) {
            return `Seu comprometimento com dívidas está em um nível administrável (${diag.percComprometido.toFixed(1)}%). Este é um bom momento para acelerar a quitação com aportes extras, aproveitando que o orçamento ainda tem fôlego.`;
        }
        if (diag.sobra <= 0) {
            return 'Você não possui dívidas ativas, mas sua sobra mensal está zerada ou negativa. Antes de novos objetivos, vale revisar as despesas para recompor sua margem.';
        }
        return 'Você não possui dívidas ativas — ótimo ponto de partida. A partir daqui, o foco pode ir integralmente para a reserva de emergência e a construção de patrimônio.';
    }

    // Texto de análise da reserva de emergência (seção 6)
    function pa_analiseReserva(plano) {
        const r = plano.reserva;
        if (r.mesesCobertos >= r.mesesAlvo) {
            return `Sua reserva de emergência já cobre a meta de ${r.mesesAlvo} meses. A partir daqui, qualquer valor extra após a quitação das dívidas pode ser direcionado para investimentos de médio ou longo prazo.`;
        }
        if (r.mesesCobertos < 1) {
            return 'Sua reserva está praticamente zerada. Mesmo durante a quitação das dívidas, vale destinar uma pequena parte do valor extra (cerca de 10%) para começar a formar essa proteção — sem ela, qualquer imprevisto tende a se transformar em uma nova dívida.';
        }
        return `Você já tem o equivalente a ${r.mesesCobertos.toFixed(1)} ${r.mesesCobertos === 1 ? 'mês' : 'meses'} de despesas guardado. A prioridade segue sendo eliminar as dívidas com juros mais altos (acima de ~5% a.m.); à medida que forem quitadas, redirecione parte dos recursos liberados para completar a reserva antes de novos investimentos.`;
    }

    // Recomendação Avalanche x Bola de Neve (seção 5)
    function pa_recomendacaoEstrategia(plano) {
        const av = plano.avalanche, bn = plano.bolaDeNeve;
        if (!av.convergiu || !bn.convergiu) {
            return 'Defina, no campo acima, quanto você pode destinar a mais por mês para receber uma recomendação personalizada entre as duas estratégias.';
        }
        if (plano.dividas.length <= 1) {
            return 'Com apenas uma dívida ativa, as duas estratégias produzem o mesmo resultado — o que importa é manter o pagamento definido até a quitação total.';
        }
        const diffJuros = bn.totalJuros - av.totalJuros;
        const diffMesesPrimeira = av.ordemFinal[0].mesQuitacao - bn.ordemFinal[0].mesQuitacao;
        const diffPercentual = plano.resumo.totalDevido > 0 ? diffJuros / plano.resumo.totalDevido : 0;

        if (diffPercentual < 0.03) {
            return `A diferença de juros entre as estratégias é pequena (${formatarMoeda(Math.max(0, diffJuros))}). Neste caso, a Bola de Neve tende a ser mais indicada: ela elimina sua primeira dívida ${Math.max(0, diffMesesPrimeira)} ${Math.abs(diffMesesPrimeira) === 1 ? 'mês' : 'meses'} antes, o que ajuda a manter a motivação sem custo relevante.`;
        }
        return `A Avalanche economiza ${formatarMoeda(diffJuros)} em juros em relação à Bola de Neve — uma diferença relevante. Recomenda-se priorizar essa estratégia, especialmente se você se sente confiante em manter o plano sem depender de "vitórias rápidas" para se motivar.`;
    }

    // Plano de ação para os próximos 90 dias (seção 7)
    function pa_plano90Dias(plano, diag) {
        const d1 = [], d2 = [], d3 = [];
        const nomeEstrategia = plano.estrategia === 'bolaDeNeve' ? 'Bola de Neve' : 'Avalanche';

        // Dias 1-30
        if (plano.dividas.length > 0) {
            d1.push(`Liste e confirme saldo e taxa de juros de cada dívida ativa — você tem ${plano.resumo.quantidade} cadastrada(s), totalizando ${formatarMoeda(plano.resumo.totalDevido)}.`);
        }
        if (diag.percComprometido >= 50) {
            d1.push(`Seu comprometimento com dívidas está em ${diag.percComprometido.toFixed(0)}% da renda. Revise todas as despesas variáveis dos últimos 30 dias e corte o que não for essencial — o objetivo agora é liberar caixa, não "economizar um pouco".`);
        } else if (diag.percComprometido > 0) {
            d1.push('Revise suas despesas variáveis do último mês e identifique pelo menos uma categoria para reduzir — mesmo um corte pequeno acelera o cronograma.');
        } else {
            d1.push('Use este período para mapear seus gastos variáveis e identificar oportunidades de redirecionar valor para a reserva de emergência.');
        }
        if (plano.dividas.length > 0) {
            if (plano.extra > 0) {
                d1.push(`Separe ${formatarMoeda(plano.extra)}/mês — valor sugerido com base na sua sobra atual — exclusivamente para o plano (${nomeEstrategia}), e comece atacando: ${plano.ordem[0] ? plano.ordem[0].descricao : '—'}.`);
            } else {
                d1.push(`Sua sobra atual está em ${formatarMoeda(diag.sobra)}. Antes que o cronograma de quitação seja viável, o foco dos próximos 30 dias é trazer esse número para positivo através dos cortes acima.`);
            }
        }

        // Dias 31-60
        const dividaCara = plano.dividas.find(d => d.taxaMensal >= 0.08);
        if (dividaCara) {
            d2.push(`A dívida "${dividaCara.descricao}" está a ${(dividaCara.taxaMensal * 100).toFixed(1)}% ao mês — uma taxa muito alta. Pesquise renegociação, portabilidade ou linhas mais baratas (ex.: crédito consignado) para substituí-la.`);
        } else if (plano.dividas.length > 0) {
            d2.push('Suas taxas estão em níveis administráveis. Ainda assim, vale contatar os credores e perguntar sobre descontos para pagamento à vista ou antecipado.');
        }
        if (diag.sobra <= 0 && diag.totalMinimos > 0) {
            d2.push('Com a margem ainda apertada, avalie formas de aumentar a renda no curto prazo (venda de itens, freelances, serviços extras) — qualquer valor adicional acelera o plano.');
        } else if (plano.dividas.length > 0) {
            d2.push('Direcione qualquer renda extra (13º, bônus, freelances) diretamente para a dívida prioritária — isso pode antecipar a quitação em meses.');
        }
        if (plano.dividas.length > 0) {
            d2.push(`Confirme a estratégia escolhida (${nomeEstrategia}) e configure um lembrete mensal para o pagamento extra — consistência é o que faz o plano funcionar.`);
        } else {
            d2.push('Sem dívidas ativas, use este período para definir metas de médio prazo para sua reserva e próximos objetivos financeiros.');
        }

        // Dias 61-90
        if (plano.reserva.mesesCobertos < 1) {
            const sugestao = plano.extra > 0 ? ` (aproximadamente ${formatarMoeda(plano.extra * 0.1)}/mês)` : '';
            d3.push(`Mesmo durante a quitação, comece a reservar uma pequena parte (10%) do valor extra${sugestao} em uma conta separada: o início da sua reserva de emergência.`);
        } else if (plano.reserva.falta > 0) {
            d3.push(`Avalie redirecionar parte do valor extra para a reserva de emergência, atualmente em ${formatarMoeda(plano.reserva.totalEconomias)} de ${formatarMoeda(plano.reserva.alvo)} (faltam ${formatarMoeda(plano.reserva.falta)}).`);
        } else {
            d3.push('Sua reserva de emergência está completa. A partir daqui, qualquer novo aporte após a quitação das dívidas pode considerar investimentos de médio/longo prazo.');
        }
        d3.push('Reavalie o plano: confira se o saldo das dívidas está caindo conforme o cronograma e recalcule caso sua sobra mensal tenha mudado.');
        if (plano.dividas.length > 0) {
            d3.push('Evite contratar novas dívidas ou aumentar limites de cartão durante esse período — o objetivo é reduzir o número de credores, não mantê-lo.');
        }

        return { d1, d2, d3 };
    }

    // ==========================================
    // RELATÓRIO COMPLETO — renderização (8 seções)
    // ==========================================
    function pa_renderRelatorio() {
        const body = document.getElementById('relatorioBody');
        if (!body) return;

        const dividas = pa_listarDividas();
        const estrategiaInput = document.querySelector('input[name="pqEstrategia"]:checked');
        const estrategia = estrategiaInput ? estrategiaInput.value : 'avalanche';
        const extraInput = document.getElementById('pqExtraMensal');
        const extraManual = extraInput ? extraInput.value : null;

        const plano = pa_gerarPlano(extraManual, estrategia);
        const diag = pa_diagnosticoFinanceiro();

        // ---- helper local: renderiza as seções 3/4 (Avalanche / Bola de Neve) ----
        function renderEstrategia(numero, nome, icone, sim, ordem, comentario) {
            if (dividas.length === 0) {
                return `<div class="relatorio-secao"><h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-1px;margin-right:3px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${numero}. Estratégia ${nome}</h2><p class="relatorio-vazio">✅ Nenhuma dívida ativa — seção não aplicável.</p></div>`;
            }
            if (!sim.convergiu) {
                return `<div class="relatorio-secao"><h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-1px;margin-right:3px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${numero}. Estratégia ${nome}</h2><p class="relatorio-vazio">Defina, no campo acima, um valor extra mensal maior que zero para gerar o cronograma desta estratégia. Atualmente, pagando apenas os juros mínimos (${formatarMoeda(plano.resumo.custoJurosMensal)}/mês), o saldo das dívidas permanece constante indefinidamente.</p></div>`;
            }
            const cronograma = sim.ordemFinal.map(o => `<li>Mês ${o.mesQuitacao} (${pa_nomeMes(o.mesQuitacao)}): <strong>${o.descricao}</strong> quitada ✅</li>`).join('');
            return `
            <div class="relatorio-secao">
                <h2>${icone} ${numero}. Estratégia ${nome}</h2>
                <p class="relatorio-intro">${comentario(sim, ordem)}</p>
                <h4>Ordem de Quitação</h4>
                <ol class="relatorio-ordem">
                    ${ordem.map(d => `<li>${d.descricao} — ${formatarMoeda(d.saldo)} a ${(d.taxaMensal * 100).toFixed(1)}% a.m.</li>`).join('')}
                </ol>
                <h4>Cronograma de Quitação</h4>
                <ul class="relatorio-cronograma">
                    ${cronograma}
                    <li class="relatorio-final"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-1px;margin-right:3px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2"/><rect x="6" y="18" width="12" height="4"/></svg> Mês ${sim.meses} (${pa_nomeMes(sim.meses)}): todas as dívidas quitadas</li>
                </ul>
                <table class="relatorio-tabela relatorio-tabela-totais">
                    <tr><td>Pagamento mensal do plano</td><td>${formatarMoeda(sim.pagamentoMensalTotal)}</td></tr>
                    <tr><td>Tempo total até quitar tudo</td><td>${sim.meses} ${sim.meses === 1 ? 'mês' : 'meses'}</td></tr>
                    <tr><td>Total de juros pagos</td><td>${formatarMoeda(sim.totalJuros)}</td></tr>
                    <tr><td>Economia vs. pagar só o mínimo no período</td><td>${formatarMoeda(sim.economiaVsMinimo)}</td></tr>
                </table>
            </div>`;
        }

        const comentarioAvalanche = (sim, ordem) => {
            const p = ordem[0];
            return `A Avalanche ataca primeiro a dívida com a maior taxa de juros — "${p.descricao}", a ${(p.taxaMensal * 100).toFixed(1)}% a.m. Matematicamente, este é o caminho mais curto: cada real extra direcionado a ela deixa de gerar ${(p.taxaMensal * 100).toFixed(1)}% de juros por mês, taxa que dificilmente qualquer investimento conservador supera. À medida que cada dívida é eliminada, o valor que ela consumia passa a reforçar o ataque à próxima — o "efeito avalanche".`;
        };
        const comentarioBolaDeNeve = (sim, ordem) => {
            const p = ordem[0];
            return `A Bola de Neve ataca primeiro a menor dívida — "${p.descricao}", de ${formatarMoeda(p.saldo)}. A lógica aqui é comportamental, não apenas matemática: eliminar uma dívida por completo gera uma sensação concreta de progresso, o que aumenta a chance de manter a disciplina nos meses seguintes. Vitórias rápidas e visíveis tendem a sustentar mudanças de hábito melhor do que apenas a lógica do menor custo.`;
        };

        let html = '';

        // ===== 1. Diagnóstico Financeiro Atual =====
        html += `
        <div class="relatorio-secao">
            <h2>1. Diagnóstico Financeiro Atual</h2>
            <table class="relatorio-tabela relatorio-tabela-totais">
                <tr><td>Receita líquida mensal</td><td>${formatarMoeda(diag.receitaTotal)}</td></tr>
                <tr><td>Despesas essenciais</td><td>${formatarMoeda(diag.despesasEssenciais)}</td></tr>
                <tr><td>Despesas variáveis</td><td>${formatarMoeda(diag.despesasVariaveis)}</td></tr>
                <tr><td>Pagamentos mínimos das dívidas${diag.parcelasPendentes > 0 ? ' (inclui parcelas de financiamento)' : ''}</td><td>${formatarMoeda(diag.totalMinimos)}</td></tr>
                <tr><td>Sobra mensal disponível</td><td class="${diag.sobra >= 0 ? 'relatorio-positivo' : 'relatorio-negativo'}">${formatarMoeda(diag.sobra)}</td></tr>
                <tr><td>% da renda comprometida com dívidas</td><td>${diag.percComprometido.toFixed(1)}%</td></tr>
            </table>
            <p class="relatorio-analise">${pa_analiseDiagnostico(diag)}</p>
        </div>`;

        // ===== 2. Resumo das Dívidas =====
        if (dividas.length > 0) {
            html += `
            <div class="relatorio-secao">
                <h2>2. Resumo das Dívidas</h2>
                <table class="relatorio-tabela relatorio-tabela-dividas">
                    <thead><tr><th>Dívida</th><th>Saldo Atual</th><th>Taxa de Juros</th><th>Custo Mensal de Juros*</th></tr></thead>
                    <tbody>
                        ${dividas.map(d => `<tr><td>${d.descricao}</td><td>${formatarMoeda(d.saldo)}</td><td>${(d.taxaMensal * 100).toFixed(1)}% a.m.</td><td>${formatarMoeda(pa_jurosMes(d))}</td></tr>`).join('')}
                    </tbody>
                </table>
                <p class="relatorio-nota">* Pagamento mínimo considerado: o suficiente para os juros do mês, sem o qual o saldo cresceria.</p>
                <table class="relatorio-tabela relatorio-tabela-totais">
                    <tr><td>Valor total devido</td><td>${formatarMoeda(plano.resumo.totalDevido)}</td></tr>
                    <tr><td>Taxa média ponderada</td><td>${(plano.resumo.taxaMediaPonderada * 100).toFixed(1)}% a.m.</td></tr>
                    <tr><td>Custo mensal só de juros (sem pagamento extra)</td><td>${formatarMoeda(plano.resumo.custoJurosMensal)}</td></tr>
                </table>
            </div>`;
        } else {
            html += `<div class="relatorio-secao"><h2>2. Resumo das Dívidas</h2><p class="relatorio-vazio">✅ Nenhuma dívida ativa registrada.</p></div>`;
        }

        // ===== 3. Avalanche / 4. Bola de Neve =====
        html += renderEstrategia(3, 'Avalanche (Menor Custo Financeiro)', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>', plano.avalanche, pa_ordenarAvalanche(dividas), comentarioAvalanche);
        html += renderEstrategia(4, 'Bola de Neve (Maior Reforço Comportamental)', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 7l-5-5-5 5"/><path d="M7 17l5 5 5-5"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M7 7l-5 5 5 5"/><path d="M17 7l5 5-5 5"/></svg>', plano.bolaDeNeve, pa_ordenarBolaDeNeve(dividas), comentarioBolaDeNeve);

        // ===== 5. Comparativo =====
        if (dividas.length > 1 && plano.avalanche.convergiu && plano.bolaDeNeve.convergiu) {
            const av = plano.avalanche, bn = plano.bolaDeNeve;
            html += `
            <div class="relatorio-secao">
                <h2>5. Comparativo das Estratégias</h2>
                <table class="relatorio-tabela">
                    <thead><tr><th>Indicador</th><th>Avalanche</th><th>Bola de Neve</th></tr></thead>
                    <tbody>
                        <tr><td>Tempo total para quitar</td><td>${av.meses} meses</td><td>${bn.meses} meses</td></tr>
                        <tr><td>Data final estimada</td><td>${pa_nomeMes(av.meses)}</td><td>${pa_nomeMes(bn.meses)}</td></tr>
                        <tr><td>Total de juros pagos</td><td>${formatarMoeda(av.totalJuros)}</td><td>${formatarMoeda(bn.totalJuros)}</td></tr>
                        <tr><td>Economia gerada (vs. só mínimo)</td><td>${formatarMoeda(av.economiaVsMinimo)}</td><td>${formatarMoeda(bn.economiaVsMinimo)}</td></tr>
                        <tr><td>Primeira dívida eliminada</td><td>mês ${av.ordemFinal[0].mesQuitacao} (${av.ordemFinal[0].descricao})</td><td>mês ${bn.ordemFinal[0].mesQuitacao} (${bn.ordemFinal[0].descricao})</td></tr>
                    </tbody>
                </table>
                <p class="relatorio-recomendacao"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-1px;margin-right:3px"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg> ${pa_recomendacaoEstrategia(plano)}</p>
            </div>`;
        } else if (dividas.length > 0) {
            html += `<div class="relatorio-secao"><h2>5. Comparativo das Estratégias</h2><p class="relatorio-vazio">${pa_recomendacaoEstrategia(plano)}</p></div>`;
        }

        // ===== 6. Reserva de Emergência =====
        const pctReserva = plano.reserva.alvo > 0 ? Math.min(100, (plano.reserva.totalEconomias / plano.reserva.alvo) * 100) : 100;
        html += `
        <div class="relatorio-secao">
            <h2>6. Reserva de Emergência</h2>
            <table class="relatorio-tabela relatorio-tabela-totais">
                <tr><td>Meta (${plano.reserva.mesesAlvo} meses de despesas essenciais)</td><td>${formatarMoeda(plano.reserva.alvo)}</td></tr>
                <tr><td>Valor atual</td><td>${formatarMoeda(plano.reserva.totalEconomias)}</td></tr>
                <tr><td>Falta para a meta</td><td>${formatarMoeda(plano.reserva.falta)}</td></tr>
            </table>
            <pre class="relatorio-ascii-bar">Reserva de Emergência:
[${pa_barraAscii(pctReserva)}] ${pctReserva.toFixed(0)}%</pre>
            <p class="relatorio-analise">${pa_analiseReserva(plano)}</p>
        </div>`;

        // ===== 7. Plano de Ação (90 dias) =====
        const p90 = pa_plano90Dias(plano, diag);
        html += `
        <div class="relatorio-secao">
            <h2>7. Plano de Ação (Próximos 90 Dias)</h2>
            <h4>Dias 1–30 · Organização e Ajustes Imediatos</h4>
            <ul>${p90.d1.map(t => `<li>${t}</li>`).join('')}</ul>
            <h4>Dias 31–60 · Renegociação e Aumento de Receita</h4>
            <ul>${p90.d2.map(t => `<li>${t}</li>`).join('')}</ul>
            <h4>Dias 61–90 · Consolidação e Reserva</h4>
            <ul>${p90.d3.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>`;

        // ===== 8. Sugestões de Sabedoria Financeira =====
        const sabedoria = CITACOES.filter(c => c.livro === 'organizacao').map(c => c.texto);
        html += `
        <div class="relatorio-secao">
            <h2>8. Sugestões de Sabedoria Financeira</h2>
            <ul class="relatorio-sabedoria">${sabedoria.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>`;

        body.innerHTML = html;
        if (typeof abrirModal === 'function') abrirModal('modalRelatorio');
    }

    function imprimirRelatorio() {
        const corpo = document.getElementById('relatorioBody');
        if (!corpo || !corpo.innerHTML.trim()) {
            mostrarStatus('Gere o relatório primeiro.', 'warning');
            return;
        }
        const titulo = 'Relatório Financeiro ZARA — ' + new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const conteudo = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 32px; }
  h1 { font-size: 18px; font-weight: 700; color: #7a5c10; margin-bottom: 4px; }
  .sub { font-size: 11px; color: #888; margin-bottom: 28px; }
  .relatorio-secao { margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid #e5e5e5; }
  .relatorio-secao:last-child { border-bottom: none; }
  .relatorio-secao h2 { font-size: 13px; font-weight: 700; color: #7a5c10; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .relatorio-secao h4 { font-size: 11px; font-weight: 600; color: var(--text, #fff); margin: 12px 0 6px; }
  .relatorio-secao p, .relatorio-secao li { font-size: 11px; line-height: 1.6; color: #444; margin-bottom: 4px; }
  .relatorio-tabela { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px; }
  .relatorio-tabela th { background: #f5f0e8; color: #7a5c10; font-weight: 700; padding: 6px 8px; text-align: left; border-bottom: 2px solid #d4a84340; }
  .relatorio-tabela td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
  .relatorio-tabela td:last-child, .relatorio-tabela th:last-child { text-align: right; }
  .relatorio-intro, .relatorio-analise, .relatorio-recomendacao { background: #fdf8ef; border-left: 3px solid #2fc7ad; padding: 8px 10px; font-size: 11px; color: #555; margin: 6px 0; }
  .relatorio-ascii-bar { font-family: monospace; font-size: 12px; background: #fdf8ef; padding: 8px 10px; color: #2fc7ad; white-space: pre; }
  .relatorio-positivo { color: #4bc978 !important; }
  .relatorio-negativo { color: #ff6b5b !important; }
  .relatorio-vazio { color: #999; font-style: italic; font-size: 11px; }
  .relatorio-sabedoria li { margin-bottom: 6px; color: #444; font-size: 11px; }
  .relatorio-cronograma li { margin-bottom: 3px; }
  .relatorio-final { color: #4bc978; font-weight: 700; }
  ul, ol { padding-left: 18px; }
  @media print {
    body { padding: 20px; }
    @page { margin: 15mm; }
  }
</style>
</head>
<body>
<h1><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-1px;margin-right:4px"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> ${titulo}</h1>
<p class="sub">Gerado em ${new Date().toLocaleString('pt-BR')} · ZARA — Sistema Operacional Pessoal</p>
${corpo.innerHTML}
</body>
</html>`;

        const win = window.open('', '_blank');
        win.document.write(conteudo);
        win.document.close();
        win.onload = () => { win.focus(); win.print(); };
    }

    // ==========================================
    // SUGESTÕES DE SABEDORIA FINANCEIRA
    // ==========================================

    // Citações dos Livros
    const CITACOES = [
        // Princípios de Organização Financeira (Como Organizar Sua Vida Financeira - Gustavo Cerbasi)
        { texto: "Anote tudo o que entra e tudo o que sai: o controle financeiro começa no papel, não na memória.", fonte: "Como Organizar Sua Vida Financeira", livro: "organizacao" },
        { texto: "Toda dívida com juros altos é prioridade: quitar uma dívida de 10% ao mês equivale a um investimento de 10% ao mês garantido.", fonte: "Como Organizar Sua Vida Financeira", livro: "organizacao" },
        { texto: "Antes de pensar em investir, elimine as dívidas que cobram mais juros do que qualquer investimento poderia te pagar.", fonte: "Como Organizar Sua Vida Financeira", livro: "organizacao" },
        { texto: "Construa uma reserva de emergência de alguns meses de despesas fixas antes de assumir novos compromissos.", fonte: "Como Organizar Sua Vida Financeira", livro: "organizacao" },
        { texto: "Separe seu orçamento em partes: o necessário para viver, o necessário para quitar dívidas e o necessário para guardar.", fonte: "Como Organizar Sua Vida Financeira", livro: "organizacao" },
        { texto: "Pequenos gastos recorrentes, somados ao longo do mês, costumam pesar mais do que parecem.", fonte: "Como Organizar Sua Vida Financeira", livro: "organizacao" },
        { texto: "Renegociar uma dívida cara por outra mais barata é um dos jeitos mais rápidos de aliviar o orçamento.", fonte: "Como Organizar Sua Vida Financeira", livro: "organizacao" },
        { texto: "Organizar a vida financeira não é sobre ganhar mais, é sobre saber para onde o dinheiro está indo.", fonte: "Como Organizar Sua Vida Financeira", livro: "organizacao" },
        // Provérbios de Salomão
        { texto: "Os planos bem elaborados levam à fartura; já o apressado sempre acaba na miséria.", fonte: "Provérbios 21:5", livro: "salomao" },
        { texto: "Quem ama o prazer acabará na pobreza; quem ama o vinho e o luxo jamais será rico.", fonte: "Provérbios 21:17", livro: "salomao" },
        { texto: "Na casa do sábio há provisões e azeite; mas o tolo devora tudo que possui.", fonte: "Provérbios 21:20", livro: "salomao" },
        { texto: "O rico domina sobre os pobres; quem toma emprestado é servo de quem empresta.", fonte: "Provérbios 22:7", livro: "salomao" },
        { texto: "Quem observa o vento não plantará, e quem olha para as nuvens não colherá.", fonte: "Eclesiastes 11:4", livro: "salomao" },
        { texto: "Ensina a criança no caminho em que deve andar, e ainda quando for velho não se desviará dele.", fonte: "Provérbios 22:6", livro: "salomao" },
        { texto: "O preguiçoso deseja e nada consegue, mas os desejos do diligente são plenamente satisfeitos.", fonte: "Provérbios 13:4", livro: "salomao" },
        { texto: "Riquezas obtidas com língua mentirosa são vapor fugaz, armadilha mortal.", fonte: "Provérbios 21:6", livro: "salomao" }
    ];

// Marcar/desmarcar avulsa atrasada como paga (toggle)
function marcarPagoAvulsa(id) {
    const d = (financeiro.despesasAvulsas || []).find(x => x.id == id);
    if (!d) return;
    if (d.pago) {
        // Desmarcar
        d.pago = false;
        d.dataPagamento = null;
        salvarDados();
        renderFinanceiro();
        mostrarStatus('Pagamento desmarcado.', 'info');
    } else {
        // Marcar como pago
        d.pago = true;
        d.dataPagamento = new Date().toISOString().split('T')[0];
        salvarDados();
        renderFinanceiro();
        mostrarStatus('Despesa marcada como paga!', 'success');
    }
}
// cache-ts:178676345
// Editar data de um registro de juros gerado no histórico
function editarDataJuros(empId, histIdx, dataAtual) {
    const emp = financeiro.emprestimos.find(e => String(e.id) === String(empId));
    if (!emp || !emp.historicoPagamentos) return;

    const novaData = prompt('Editar data do registro de juros:\n(formato: AAAA-MM-DD)', dataAtual || '');
    if (!novaData) return;

    // Validar formato
    if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
        alert('Formato inválido. Use: AAAA-MM-DD\nExemplo: 2026-08-01');
        return;
    }

    emp.historicoPagamentos[histIdx].data = novaData;
    // Atualizar também no histórico geral se existir
    if (emp.historico) {
        const hGeral = emp.historico.find((h, i) =>
            h.tipo === 'juros_gerado' && h.data &&
            h.data.startsWith(dataAtual)
        );
        if (hGeral) hGeral.data = novaData + 'T00:00:00.000Z';
    }

    salvarDados();
    renderizar();
    mostrarStatus('Data atualizada!', 'success');
}
