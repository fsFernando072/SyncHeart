// Arquivo: js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELEÇÃO DE ELEMENTOS GLOBAIS ---
    const headerUserInfoEl = document.getElementById('header_user_info');
    const breadcrumbPathEl = document.getElementById('breadcrumb_path');
    const divFeedback = document.getElementById('div_feedback');
    
    // Módulos da Dashboard
    const funilValorTotal = document.getElementById('funil_valor_total');
    const funilValorAtencao = document.getElementById('funil_valor_atencao');
    const funilValorCritico = document.getElementById('funil_valor_critico');
    const canvasHotspot = document.getElementById('grafico_hotspot');
    const canvasHistorico = document.getElementById('grafico_historico');
    const canvasTiposAlerta = document.getElementById('grafico_tipos_alerta');
    const canvasSaudeBateria = document.getElementById('grafico_saude_bateria');
    const listaModelosDestaque = document.getElementById('lista_modelos_destaque');
    const listaFilaTriagem = document.getElementById('lista_fila_triagem');
    
    // Módulo de Ações Rápidas
    const acoesRapidasContainer = document.getElementById('acoes_rapidas_container');
    const mobileSection = document.querySelector('.mobile-section');
    const phoneToggleBtn = document.getElementById('phone_toggle_btn');
    const phoneToggleIcon = document.getElementById('phone_toggle_icon');

    // Módulo do Modal de Triagem
    const modalTriagemOverlay = document.getElementById('modal_triagem_overlay');
    const modalTriagemCloseBtn = document.getElementById('modal_triagem_close_btn');
    const modalTriagemBody = document.getElementById('modal_triagem_body');
    const modalBtnAssumir = document.getElementById('modal_btn_assumir');
    
    // Botão de Filtro
    const btnLimparFiltro = document.getElementById('btn_limpar_filtro');
    
    let feedbackTimeout;

    // --- 2. DADOS FICTÍCIOS GLOBAIS (NOSSA "BASE DE DADOS" MOCKADA) ---
    const dadosMockadosGlobais = {
        funil: { total: 352, atencao: 14, critico: 7 },
        hotspot: [
            { id: 1, label: 'Precision R80 (CPU)', data: { x: 20, y: 30, r: 25 }, cor: 'rgba(231, 76, 60, 0.7)' },
            { id: 2, label: 'Azure XT DR (Bateria)', data: { x: 40, y: 50, r: 15 }, cor: 'rgba(241, 196, 15, 0.7)' },
            { id: 3, label: 'Vitalio LDR (RAM)', data: { x: 60, y: 20, r: 10 }, cor: 'rgba(52, 152, 219, 0.7)' }
        ],
        historico: { labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], valores: [3, 5, 2, 8, 4, 6, 3] },
        tiposAlerta: { labels: ['CPU', 'Bateria', 'RAM', 'Disco'], valores: [4, 2, 1, 0] },
        saudeBateria: { saudavel: 75, atencao: 15, critico: 10 },
        modelosDestaque: {
            topAlertas: [{ nome: 'Precision R80', alertas: 12 }, { nome: 'Azure XT DR', alertas: 8 }, { nome: 'Vitalio LDR', alertas: 5 }],
            maisRecentes: [{ uuid: '...a1b2-c3d4', data: '11/10' }, { uuid: '...f7g8-h9i0', data: '10/10' }]
        },
        filaTriagem: [
            { id: 1, idModelo: 1, idDispositivo: '...a1b2', tipo: 'critico', texto: 'Alerta CRÍTICO de CPU no dispositivo ...a1b2', tempo: 'há 2 min', metrica: 'CPU', valor: '85%' },
            { id: 2, idModelo: 2, idDispositivo: '...c3d4', tipo: 'critico', texto: 'Alerta CRÍTICO de Bateria no dispositivo ...c3d4', tempo: 'há 15 min', metrica: 'Bateria', valor: '18%' },
            { id: 3, idModelo: 3, idDispositivo: '...f7g8', tipo: 'atencao', texto: 'Alerta de ATENÇÃO de RAM no dispositivo ...f7g8', tempo: 'há 45 min', metrica: 'RAM', valor: '42%' },
            { id: 4, idModelo: 1, idDispositivo: '...e5f6', tipo: 'critico', texto: 'Alerta CRÍTICO de CPU no dispositivo ...e5f6', tempo: 'há 1 hora', metrica: 'CPU', valor: '90%' },
        ]
    };
    
    // Variáveis para guardar as instâncias dos gráficos e poder atualizá-las
    let graficoHotspot, graficoHistorico, graficoTiposAlerta, graficoSaudeBateria;

    // --- 3. FUNÇÃO DE FEEDBACK ---
    function mostrarFeedback(mensagem, tipo = 'error') {
        clearTimeout(feedbackTimeout);
        divFeedback.textContent = mensagem;
        divFeedback.className = '';
        divFeedback.classList.add(tipo, 'show');
        feedbackTimeout = setTimeout(() => {
            divFeedback.classList.remove('show');
        }, 5000);
    }

    // --- 4. LÓGICA DE INICIALIZAÇÃO ---
    function iniciarDashboard() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        if (!dadosUsuarioLogado) {
            window.location.href = "login.html";
            return;
        }

        preencherCabecalho(dadosUsuarioLogado);
        
        configurarAcoesRapidas(dadosUsuarioLogado.usuario.cargoId);
        configurarToggleAcoesRapidas();
        configurarBotaoCadastrar(dadosUsuarioLogado.usuario.cargoId);
        configurarModalTriagem();
        
        btnLimparFiltro.addEventListener('click', () => {
            atualizarTodosOsModulos(null); 
            btnLimparFiltro.style.display = 'none'; 
        });

        atualizarTodosOsModulos(null); // Carrega tudo pela primeira vez
    }
    
    // --- 5. FUNÇÃO "MESTRA" DE ATUALIZAÇÃO (CROSS-FILTERING) ---
    function atualizarTodosOsModulos(filtroModeloId) {
        const dados = filtrarDadosMockados(filtroModeloId);
        carregarFunilRisco(dados.funil);
        carregarGraficoHotspot(dados.hotspot);
        carregarGraficoHistorico(dados.historico);
        carregarGraficoTiposAlerta(dados.tiposAlerta);
        carregarGraficoSaudeBateria(dados.saudeBateria);
        carregarModelosDestaque(dados.modelosDestaque);
        carregarFilaTriagem(dados.filaTriagem);
    }
    
    // --- 6. FUNÇÕES DE PREENCHIMENTO DOS MÓDULOS (Atualizadas) ---
    function preencherCabecalho(dadosUsuarioLogado) {
        const nomeUsuario = dadosUsuarioLogado.usuario.nome;
        const emailUsuario = dadosUsuarioLogado.usuario.email;
        headerUserInfoEl.innerHTML = `
            <div class="user-info">
                <span class="user-name">${nomeUsuario}</span>
                <span class="user-email">${emailUsuario}</span>
            </div>
        `;
        if (dadosUsuarioLogado.clinica) {
            breadcrumbPathEl.textContent = dadosUsuarioLogado.clinica.nome;
        } else {
            breadcrumbPathEl.textContent = "Visão Geral do Sistema";
        }
    }

    function carregarFunilRisco(dados) {
        funilValorTotal.textContent = dados.total;
        funilValorAtencao.textContent = dados.atencao;
        funilValorCritico.textContent = dados.critico;
    }

    function carregarGraficoHotspot(dados) {
        const datasets = dados.map(d => ({
            label: d.label,
            data: [d.data],
            backgroundColor: d.cor,
            filtroId: d.id
        }));
        
        if (graficoHotspot) {
            graficoHotspot.data.datasets = datasets;
            graficoHotspot.update();
            return;
        }
        
        graficoHotspot = new Chart(canvasHotspot.getContext('2d'), {
            type: 'bubble',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { ticks: { display: false }, grid: { display: false } }, y: { ticks: { display: false }, grid: { display: false } } },
                plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function(context) { return ` ${context.dataset.label}: ${context.raw.r} alertas`; } } } },
                onClick: (evt, elements) => {
                    if (elements.length === 0) return; 
                    const datasetIndex = elements[0].datasetIndex;
                    const filtroId = graficoHotspot.data.datasets[datasetIndex].filtroId;
                    btnLimparFiltro.style.display = 'block';
                    atualizarTodosOsModulos(filtroId);
                }
            }
        });
    }
    
    function carregarGraficoHistorico(dados) {
        if (graficoHistorico) graficoHistorico.destroy();
        graficoHistorico = new Chart(canvasHistorico.getContext('2d'), {
            type: 'bar', data: { labels: dados.labels, datasets: [{ label: 'Novos Alertas', data: dados.valores, backgroundColor: '#D6166F', borderRadius: 5 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
        });
    }
    
    function carregarGraficoTiposAlerta(dados) {
        if (graficoTiposAlerta) graficoTiposAlerta.destroy();
        graficoTiposAlerta = new Chart(canvasTiposAlerta.getContext('2d'), {
            type: 'doughnut', data: { labels: dados.labels, datasets: [{ label: 'Tipos de Alertas', data: dados.valores, backgroundColor: ['#e74c3c', '#f1c40f', '#3498db', '#95a5a6'], hoverOffset: 4 }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function carregarGraficoSaudeBateria(dados) {
        if (graficoSaudeBateria) graficoSaudeBateria.destroy();
        graficoSaudeBateria = new Chart(canvasSaudeBateria.getContext('2d'), {
            type: 'bar', data: { labels: ['Bateria da Frota'], datasets: [
                { label: 'Saudável (> 50%)', data: [dados.saudavel], backgroundColor: '#2ecc71' },
                { label: 'Atenção (20-50%)', data: [dados.atencao], backgroundColor: '#f1c40f' },
                { label: 'Crítico (< 20%)', data: [dados.critico], backgroundColor: '#e74c3c' }
            ]},
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, ticks: { callback: (v) => v + "%" } }, y: { stacked: true } }, plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw}%` } } } }
        });
    }
    
    function carregarModelosDestaque(dados) {
        listaModelosDestaque.innerHTML = `<div class="destaque-grid"><div class="destaque-coluna"><h4>Top 3 com Mais Alertas</h4><ul class="destaque-lista">${dados.topAlertas.map(m => `<li><span class="modelo-nome">${m.nome}</span><span class="modelo-valor">${m.alertas} alertas</span></li>`).join('')}</ul></div><div class="destaque-coluna"><h4>Dispositivos Recentes</h4><ul class="destaque-lista">${dados.maisRecentes.map(d => `<li><span class="modelo-nome">ID: ${d.uuid}</span><span class="modelo-valor">Adic. em ${d.data}</span></li>`).join('')}</ul></div></div>`;
    }

    function carregarFilaTriagem(dados) {
        listaFilaTriagem.innerHTML = '';
        if (dados.length === 0) {
            listaFilaTriagem.innerHTML = '<p class="placeholder-text">Nenhum alerta novo.</p>';
            return;
        }
        let listaHTML = '<ul class="lista-fila-triagem">';
        dados.forEach(item => {
            listaHTML += `
                <li class="fila-item tipo-${item.tipo}" 
                    data-id="${item.id}" 
                    data-dispositivo-id="${item.idDispositivo}" 
                    data-texto="${item.texto}" 
                    data-metrica="${item.metrica}" 
                    data-valor="${item.valor}"
                    style="cursor: pointer;">
                    <div class="icone-tipo"></div>
                    <div class="texto-alerta">${item.texto}</div>
                    <div class="tempo-alerta">${item.tempo}</div>
                </li>
            `;
        });
        listaHTML += '</ul>';
        listaFilaTriagem.innerHTML = listaHTML;
    }
    
    function configurarAcoesRapidas(cargoId) {
        acoesRapidasContainer.innerHTML = '';
        let htmlBotoes = '';
        switch (cargoId) {
            case 2: htmlBotoes = `<a href="gerenciar_equipe.html" class="action-btn">(Admin)<br>Gerenciar Funcionários</a>`; break;
            case 3: htmlBotoes = `<a href="provisionar_dispositivo.html" class="action-btn">(Eletrofisiologista)<br>Provisionar Marcapasso</a>`; break;
            case 4: htmlBotoes = `<a href="crud_modelo.html" class="action-btn">(Eng. Clínica)<br>Cadastrar Modelo de MP</a>`; break;
            case 1: htmlBotoes = `<a href="solicitacoes.html" class="action-btn">(Admin SyncHeart)<br>Aprovar Clínicas</a>`; break;
            default: htmlBotoes = `<p class="no-actions">Nenhuma ação rápida disponível.</p>`; break;
        }
        acoesRapidasContainer.innerHTML = htmlBotoes;
    }
    
    function configurarToggleAcoesRapidas() {
        if (phoneToggleBtn && mobileSection && phoneToggleIcon) {
            phoneToggleBtn.addEventListener('click', () => {
                mobileSection.classList.toggle('hidden');
                phoneToggleIcon.innerHTML = mobileSection.classList.contains('hidden') ? '▲' : '▼';
            });
        }
    }

    function configurarBotaoCadastrar(cargoId) {
        const botaoCadastrar = document.getElementById('nav_cadastrar');
        const labelCadastrar = document.getElementById('nav_cadastrar_label');
        if (!botaoCadastrar || !labelCadastrar) return;
        botaoCadastrar.style.display = 'none';
        switch (cargoId) {
            case 2: labelCadastrar.textContent = 'Funcionários'; botaoCadastrar.href = 'gerenciar_equipe.html'; botaoCadastrar.title = 'Gerenciar Funcionários'; botaoCadastrar.style.display = 'flex'; break;
            case 4: labelCadastrar.textContent = 'Modelos'; botaoCadastrar.href = 'crud_modelo.html'; botaoCadastrar.title = 'Gerenciar Modelos de MP'; botaoCadastrar.style.display = 'flex'; break;
            case 3: labelCadastrar.textContent = 'Provisionar'; botaoCadastrar.href = 'provisionar_dispositivo.html'; botaoCadastrar.title = 'Provisionar Marcapassos'; botaoCadastrar.style.display = 'flex'; break;
        }
    }

    // --- 7. LÓGICA DO MODAL DE TRIAGEM ---
    function configurarModalTriagem() {
        modalTriagemCloseBtn.addEventListener('click', fecharModalTriagem);
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) fecharModalTriagem();
        });
        modalBtnAssumir.addEventListener('click', () => {
            const alertaId = modalBtnAssumir.dataset.alertaId;
            mostrarFeedback(`Sucesso! Alerta #${alertaId} assumido (simulado).`, 'success');
            fecharModalTriagem();
        });
        listaFilaTriagem.addEventListener('click', (event) => {
            const itemClicado = event.target.closest('.fila-item'); 
            if (itemClicado) {
                abrirModalTriagem(
                    itemClicado.dataset.id, 
                    itemClicado.dataset.dispositivoId, 
                    itemClicado.dataset.texto, 
                    itemClicado.dataset.metrica, 
                    itemClicado.dataset.valor
                );
            }
        });
    }

    function abrirModalTriagem(alertaId, dispositivoId, textoAlerta, metrica, valor) {
        modalTriagemBody.innerHTML = `
            <p>${textoAlerta}</p>
            <hr>
            <p><strong>Dispositivo:</strong> ${dispositivoId}</p>
            <p><strong>Métrica Afetada:</strong> ${metrica}</p>
            <p><strong>Valor Detetado:</strong> ${valor}</p>
        `;
        modalBtnAssumir.dataset.alertaId = alertaId;
        modalTriagemOverlay.style.display = 'flex';
        setTimeout(() => modalTriagemOverlay.classList.add('show'), 10);
    }

    function fecharModalTriagem() {
        modalTriagemOverlay.classList.remove('show');
        setTimeout(() => modalTriagemOverlay.style.display = 'none', 300);
    }
    
    // --- 8. SIMULAÇÃO DE FILTRAGEM ---
    function filtrarDadosMockados(filtroId) {
        if (!filtroId) {
            return dadosMockadosGlobais;
        }
        // Simula o filtro para o Modelo 1 (Precision R80)
        if (filtroId === 1) {
            return {
                funil: { total: 150, atencao: 5, critico: 5 },
                hotspot: dadosMockadosGlobais.hotspot,
                historico: { labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], valores: [1, 2, 0, 4, 1, 3, 2] },
                tiposAlerta: { labels: ['CPU', 'Bateria', 'RAM', 'Disco'], valores: [4, 0, 0, 0] },
                saudeBateria: { saudavel: 90, atencao: 5, critico: 5 },
                modelosDestaque: dadosMockadosGlobais.modelosDestaque,
                filaTriagem: dadosMockadosGlobais.filaTriagem.filter(f => f.idModelo === 1)
            };
        }
        // Simula o filtro para os outros modelos
        else {
             return {
                funil: { total: 202, atencao: 9, critico: 2 },
                hotspot: dadosMockadosGlobais.hotspot,
                historico: { labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], valores: [2, 3, 2, 4, 3, 3, 1] },
                tiposAlerta: { labels: ['CPU', 'Bateria', 'RAM', 'Disco'], valores: [0, 2, 1, 0] },
                saudeBateria: { saudavel: 60, atencao: 30, critico: 10 },
                modelosDestaque: dadosMockadosGlobais.modelosDestaque,
                filaTriagem: dadosMockadosGlobais.filaTriagem.filter(f => f.idModelo !== 1)
            };
        }
    }

    // --- 9. EXECUÇÃO ---
    iniciarDashboard();
});