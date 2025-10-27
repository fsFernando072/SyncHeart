// Arquivo: js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {

    // Selecionando os novos elementos
    const headerUserInfoEl = document.getElementById('header_user_info');
    const breadcrumbPathEl = document.getElementById('breadcrumb_path');
    const kpiContainer = document.getElementById('kpi_container');
    const acoesRapidasContainer = document.getElementById('acoes_rapidas_container');
    const modelosDestaqueContainer = document.getElementById('modelos_destaque_container');
    const atividadeRecenteContainer = document.getElementById('atividade_recente_container'); 
     

    const mobileSection = document.querySelector('.mobile-section');
    const phoneToggleBtn = document.getElementById('phone_toggle_btn'); 
    const phoneToggleIcon = document.getElementById('phone_toggle_icon'); 

    // --- FUNÇÃO DE INICIALIZAÇÃO DA PÁGINA ---
    function iniciarDashboard() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        if (!dadosUsuarioLogado) {
            window.location.href = "login.html";
            return;
        }

        const nomeUsuario = dadosUsuarioLogado.usuario.nome;
        const emailUsuario = dadosUsuarioLogado.usuario.email;
        headerUserInfoEl.innerHTML = `<div class="user-info"><span class="user-name">${nomeUsuario}</span><span class="user-email">${emailUsuario}</span></div>`;

        if (dadosUsuarioLogado.clinica) {
            breadcrumbPathEl.textContent = dadosUsuarioLogado.clinica.nome;
        } else {
            breadcrumbPathEl.textContent = "Visão Geral do Sistema";
        }

        carregarKPIs();
        carregarGraficos();
        configurarAcoesRapidas();
        carregarModelosDestaque(); 
        carregarGraficoBateria();
        carregarAtividadeRecente();
        configurarToggleAcoesRapidas(); 
        configurarBotaoCadastrar();
    }

    // --- FUNÇÃO PARA CARREGAR OS KPIS ---
    function carregarKPIs() {

        const kpiData = { alertasAtivos: 7, dispositivosMonitorados: 352, bateriaBaixa: 14 };
        kpiContainer.innerHTML = '';
        kpiContainer.innerHTML += `<div class="kpi-card alert"><h3>Alertas Ativos</h3><span class="kpi-value">${kpiData.alertasAtivos}</span><span class="kpi-description">Alertas que requerem atenção</span></div>`;
        kpiContainer.innerHTML += `<div class="kpi-card devices"><h3>Dispositivos Monitorados</h3><span class="kpi-value">${kpiData.dispositivosMonitorados}</span><span class="kpi-description">Total de dispositivos online</span></div>`;
        kpiContainer.innerHTML += `<div class="kpi-card battery"><h3>Bateria Baixa</h3><span class="kpi-value">${kpiData.bateriaBaixa}</span><span class="kpi-description">Dispositivos com bateria < 20%</span></div>`;
    }

    // --- FUNÇÃO PARA CARREGAR OS GRÁFICOS ---
    function carregarGraficos() {
 
        const dadosHistoricoAlertas = { labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], valores: [3, 5, 2, 8, 4, 6, 3] };
        const dadosTiposAlertas = { labels: ['CPU', 'Bateria', 'RAM', 'Disco'], valores: [4, 2, 1, 0] };
        const ctxHistorico = document.getElementById('graficoHistoricoAlertas').getContext('2d');
        new Chart(ctxHistorico, { type: 'bar', data: { labels: dadosHistoricoAlertas.labels, datasets: [{ label: 'Novos Alertas', data: dadosHistoricoAlertas.valores, backgroundColor: '#D6166F', borderColor: '#4A154B', borderWidth: 1, borderRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } } });
        const ctxTipos = document.getElementById('graficoTiposAlertas').getContext('2d');
        new Chart(ctxTipos, { type: 'doughnut', data: { labels: dadosTiposAlertas.labels, datasets: [{ label: 'Tipos de Alertas', data: dadosTiposAlertas.valores, backgroundColor: ['#e74c3c', '#f1c40f', '#3498db', '#95a5a6'], hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false } });
    }

    function carregarModelosDestaque() {
    // Dados fictícios (mockados)
    const dadosModelos = {
        topAlertas: [
            { nome: 'Precision R80', alertas: 12 },
            { nome: 'Azure XT DR', alertas: 8 },
            { nome: 'Vitalio LDR', alertas: 5 }
        ],
        maisRecentes: [
            { uuid: 'a1b2-c3d4-e5f6', data: '11/10/2025' },
            { uuid: 'f7g8-h9i0-j1k2', data: '10/10/2025' },
            { uuid: 'l3m4-n5o6-p7q8', data: '09/10/2025' }
        ]
    };

    modelosDestaqueContainer.innerHTML = `
        <div class="destaque-grid">
            <div class="destaque-coluna">
                <h4>Top 3 com Mais Alertas</h4>
                <ul class="destaque-lista">
                    ${dadosModelos.topAlertas.map(modelo => `
                        <li>
                            <span class="modelo-nome">${modelo.nome}</span>
                            <span class="modelo-valor">${modelo.alertas} alertas</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="destaque-coluna">
                <h4>Dispositivos Recentes</h4>
                <ul class="destaque-lista">
                    ${dadosModelos.maisRecentes.map(disp => `
                        <li>
                            <span class="modelo-nome">ID: ...${disp.uuid.slice(-12)}</span>
                            <span class="modelo-valor">Adicionado em ${disp.data}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
}
    // --- FUNÇÃO PARA CONFIGURAR AS AÇÕES RÁPIDAS ---
    function configurarAcoesRapidas() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        const cargoId = dadosUsuarioLogado.usuario.cargoId;

        // Limpa o container antes de adicionar os botões
        acoesRapidasContainer.innerHTML = '';
        
        let htmlBotoes = '';

        // 'switch' para decidir quais botões mostrar com base no cargoId
        switch (cargoId) {
            case 2: // Admin da Clínica
                htmlBotoes = `
                    <a href="crud_funcionario.html" class="action-btn">
                        (Admin)<br>
                        Gerenciar Funcionários
                    </a>
                `;
                break;
            case 3: // Eletrofisiologista
                htmlBotoes = `
                    <a href="provisionar_dispositivo..html" class="action-btn">
                        (Eletrofisiologista)<br>
                        Provisionar Marcapasso
                    </a>
                `;
                break;
            case 4: // Engenharia Clínica
                htmlBotoes = `
                    <a href="crud_modelo.html" class="action-btn">
                        (Eng. Clínica)<br>
                        Cadastrar Modelo de MP
                    </a>
                `;
                break;
            default:
                // Para o Admin SyncHeart ou outros cargos, sem ações rápidas
                htmlBotoes = `<p class="no-actions">Nenhuma ação rápida disponível para este perfil.</p>`;
                break;
        }

        acoesRapidasContainer.innerHTML = htmlBotoes;
    }

    function carregarGraficoBateria() {
        // Dados fictícios (mockados)
        const dadosBateria = {
            saudavel: 75,  // 75% dos dispositivos com bateria > 50%
            atencao: 15,   // 15% com bateria entre 20% e 50%
            critico: 10    // 10% com bateria < 20%
        };

        const ctxBateria = document.getElementById('graficoSaudeBateria').getContext('2d');
        new Chart(ctxBateria, {
            type: 'bar',
            data: {
                labels: ['Bateria da Frota'], // Apenas um rótulo para a barra única
                datasets: [
                    {
                        label: 'Saudável (> 50%)',
                        data: [dadosBateria.saudavel],
                        backgroundColor: '#2ecc71', // Verde
                    },
                    {
                        label: 'Atenção (20-50%)',
                        data: [dadosBateria.atencao],
                        backgroundColor: '#f1c40f', // Amarelo
                    },
                    {
                        label: 'Crítico (< 20%)',
                        data: [dadosBateria.critico],
                        backgroundColor: '#e74c3c', // Vermelho
                    }
                ]
            },
            options: {
                indexAxis: 'y', // Isso torna o gráfico de barras HORIZONTAL
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true, // Empilha as barras no eixo X
                        ticks: {
                            callback: function(value) { return value + "%" } // Adiciona '%' aos números
                        }
                    },
                    y: {
                        stacked: true // Empilha as barras no eixo Y
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    function carregarAtividadeRecente() {
        // Dados fictícios (mockados)
        const dadosAtividade = [
            { tipo: 'alerta_critico', texto: 'Novo alerta CRÍTICO de CPU gerado para o dispositivo ...a1b2-c3d4', tempo: 'há 2 minutos' },
            { tipo: 'alerta_resolvido', texto: 'Dr. Carlos Silva resolveu o Alerta #589.', tempo: 'há 5 minutos' },
            { tipo: 'novo_usuario', texto: 'Novo funcionário "Maria Souza" foi adicionado à equipe.', tempo: 'há 15 minutos' },
            { tipo: 'novo_dispositivo', texto: 'Novo dispositivo foi provisionado pela Equipe J.', tempo: 'há 1 hora' },
            { tipo: 'alerta_atencao', texto: 'Alerta de ATENÇÃO de Bateria gerado para o dispositivo ...f7g8-h9i0', tempo: 'há 2 horas' }
        ];

        atividadeRecenteContainer.innerHTML = `
            <ul class="lista-atividade">
                ${dadosAtividade.map(item => `
                    <li class="item-atividade tipo-${item.tipo}">
                        <div class="icone-atividade"></div>
                        <div class="texto-atividade">
                            <p>${item.texto}</p>
                            <span class="tempo-atividade">${item.tempo}</span>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
    }


      function configurarToggleAcoesRapidas() {
        if (phoneToggleBtn && mobileSection && phoneToggleIcon) {
            phoneToggleBtn.addEventListener('click', () => {
                // A lógica principal de adicionar/remover a classe 'hidden' continua a mesma
                mobileSection.classList.toggle('hidden');

                // ATUALIZAÇÃO: Agora mudamos o ícone dentro do span
                if (mobileSection.classList.contains('hidden')) {
                    phoneToggleIcon.innerHTML = '▲'; // Mostra seta para cima
                } else {
                    phoneToggleIcon.innerHTML = '▼'; // Mostra seta para baixo
                }
            });
        }
    }

    function configurarBotaoCadastrar() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        const cargoId = dadosUsuarioLogado.usuario.cargoId;

        const botaoCadastrar = document.getElementById('nav_cadastrar');
        const labelCadastrar = document.getElementById('nav_cadastrar_label');

        // Garante que os elementos existem antes de tentar alterar
        if (!botaoCadastrar || !labelCadastrar) {
            return;
        }

        // Esconde o botão por padrão. Ele só será exibido se o cargo tiver uma função de cadastro.
        botaoCadastrar.style.display = 'none';

        switch (cargoId) {
            case 2: // Admin da Clínica
                labelCadastrar.textContent = 'Funcionários';
                botaoCadastrar.href = 'crud_funcionario.html';
                botaoCadastrar.title = 'Gerenciar Funcionários';
                botaoCadastrar.style.display = 'flex'; // Torna o botão visível
                break;
            case 4: // Engenharia Clínica
                labelCadastrar.textContent = 'Modelos';
                botaoCadastrar.href = 'crud_modelo.html';
                botaoCadastrar.title = 'Gerenciar Modelos de MP';
                botaoCadastrar.style.display = 'flex';
                break;
            case 3: // Eletrofisiologista
                labelCadastrar.textContent = 'Marcapassos';
                botaoCadastrar.href = 'provisionar_dispositivo.html'; 
                botaoCadastrar.title = 'Provisionar Marcapassos';
                botaoCadastrar.style.display = 'flex';
                break;
        }
    }
    // --- EXECUÇÃO ---
    iniciarDashboard();
});