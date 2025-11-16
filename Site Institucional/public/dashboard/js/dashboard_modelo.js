// Arquivo: js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {

    // Selecionando os novos elementos
    const headerUserInfoEl = document.getElementById('header_user_info');
    const kpiContainer = document.getElementById('kpi_container');

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

        carregarKPIs();
        carregarGraficos();
        configurarBotaoCadastrar();
    }

    // --- FUNÇÃO PARA CARREGAR OS KPIS ---
    function carregarKPIs() {

        const kpiData = { alertasAtivos: 7, dispositivosOffline: 15, bateriaBaixa: 14 };
        kpiContainer.innerHTML = '';
        kpiContainer.innerHTML += `<div class="kpi-card alert"><h3>Alertas Ativos</h3><span class="kpi-value">${kpiData.alertasAtivos}</span><span class="kpi-description">+20% Vs. semana anterior</span></div>`;
        kpiContainer.innerHTML += `<div class="kpi-card devices"><h3>Dispositivos Offline</h3><span class="kpi-value">${kpiData.dispositivosOffline}</span><span class="kpi-description">+10% Vs. semana anterior</span></div>`;
        kpiContainer.innerHTML += `<div class="kpi-card battery"><h3>Bateria Baixa</h3><span class="kpi-value">${kpiData.bateriaBaixa}</span><span class="kpi-description">Dispositivos com bateria < 20%</span></div>`;
    }

    // --- FUNÇÃO PARA CARREGAR OS GRÁFICOS ---
    function carregarGraficos() {

        const dadosHistoricoAlertas = { labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], valoresReais: [3, 5, 2, 8, 4, 7], valoresPrevistos: [4, 8, 2, 5, 8, 2, 3] };
        const dadosTiposAlertas = { labels: ['CPU', 'Bateria', 'RAM', 'Disco'], valores: [4, 2, 1, 0] };
        const ctxHistorico = document.getElementById('graficoHistoricoAlertas').getContext('2d');
        new Chart(ctxHistorico,
            {
                type: 'line',
                data: {
                    labels: dadosHistoricoAlertas.labels,
                    datasets: [{
                        label: 'Alertas Ativos',
                        data: dadosHistoricoAlertas.valoresReais,
                        backgroundColor: '#D6166F',
                        borderColor: '#4A154B',
                        borderWidth: 1,
                        borderRadius: 5
                    },
                    {
                        label: 'Alertas Previstos',
                        data: dadosHistoricoAlertas.valoresPrevistos,
                        backgroundColor: '#4016d6ff',
                        borderColor: '#151f4bff',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { display: true } }
                }
            });
        const ctxTipos = document.getElementById('graficoTiposAlertas').getContext('2d');
        new Chart(ctxTipos,
            {
                type: 'doughnut',
                data: {
                    labels: dadosTiposAlertas.labels,
                    datasets: [
                        {
                            label: 'Tipos de Alertas',
                            data: dadosTiposAlertas.valores,
                            backgroundColor: ['#e74c3c', '#f1c40f', '#3498db', '#95a5a6'],
                            hoverOffset: 4
                        }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

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