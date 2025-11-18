// Arquivo: js/dashboard_modelo.js

document.addEventListener('DOMContentLoaded', () => {

    // Selecionando os novos elementos
    const headerUserInfoEl = document.getElementById('header_user_info');
    const kpiContainer = document.getElementById('kpi_container');
    const listaAlertasContainer = document.getElementById('lista_alertas_container');
    const listaParametrosContainer = document.getElementById('lista_parametros_container');

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
        carregarAlertasAtivos();
        carregarParametros();
    }

    // --- FUNÇÃO PARA CARREGAR OS KPIS ---
    function carregarKPIs() {

        const kpiData = { alertasAtivos: 7, dispositivosOffline: 3, alertasCriticos: 3 };
        const kpiPercent = { alertasAtivos: 15, dispositivosOffline: 10, alertasCriticos: -5 };

        const kpiCard = kpiContainer.getElementsByClassName("kpi-card");
        const kpiValue = kpiContainer.getElementsByClassName("kpi-value");
        const kpiDescription = kpiContainer.querySelectorAll(".kpi-description span");

        kpiValue[0].innerText = kpiData.dispositivosOffline;
        kpiValue[1].innerText = kpiData.alertasAtivos;
        kpiValue[2].innerText = kpiData.alertasCriticos;

        kpiDescription[0].innerText = (kpiPercent.dispositivosOffline > 0 ? "+" : "") + kpiPercent.dispositivosOffline + "%";
        kpiDescription[1].innerText = (kpiPercent.alertasAtivos > 0 ? "+" : "") + kpiPercent.alertasAtivos + "%";
        kpiDescription[2].innerText = (kpiPercent.alertasCriticos > 0 ? "+" : "") + kpiPercent.alertasCriticos + "%";

        if (kpiPercent.dispositivosOffline > 0) {
            kpiDescription[0].style.color = "#e74c3c";
        } else if (kpiPercent.dispositivosOffline == 0) {
            kpiDescription[0].style.color = "#f1c40f";
        } else {
            kpiDescription[0].style.color = "#10982bff";
        }

        if (kpiPercent.alertasAtivos > 0) {
            kpiDescription[1].style.color = "#e74c3c";
        } else if (kpiPercent.alertasAtivos == 0) {
            kpiDescription[1].style.color = "#f1c40f";
        } else {
            kpiDescription[1].style.color = "#10982bff";
        }

        if (kpiPercent.alertasCriticos > 0) {
            kpiDescription[2].style.color = "#e74c3c";
        } else if (kpiPercent.alertasCriticos == 0) {
            kpiDescription[2].style.color = "#f1c40f";
        } else {
            kpiDescription[2].style.color = "#10982bff";
        }


        if (kpiData.dispositivosOffline >= 3) {
            kpiCard[0].style.borderLeftColor = "#e74c3c";
            kpiValue[0].style.color = "#e74c3c";
        } else if (kpiData.dispositivosOffline > 0) {
            kpiCard[0].style.borderLeftColor = "#f1c40f";
            kpiValue[0].style.color = "#f1c40f";
        } else {
            kpiCard[0].style.borderLeftColor = "#10982bff";
            kpiValue[0].style.color = "#10982bff";
        }

        if (kpiData.alertasAtivos >= 3) {
            kpiCard[1].style.borderLeftColor = "#e74c3c";
            kpiValue[1].style.color = "#e74c3c";
        } else if (kpiData.alertasAtivos > 0) {
            kpiCard[1].style.borderLeftColor = "#f1c40f";
            kpiValue[1].style.color = "#f1c40f";
        } else {
            kpiCard[1].style.borderLeftColor = "#10982bff";
            kpiValue[1].style.color = "#10982bff";
        }

        if (kpiData.alertasCriticos >= 3) {
            kpiCard[2].style.borderLeftColor = "#e74c3c";
            kpiValue[2].style.color = "#e74c3c";
        } else if (kpiData.alertasCriticos > 0) {
            kpiCard[2].style.borderLeftColor = "#f1c40f";
            kpiValue[2].style.color = "#f1c40f";
        } else {
            kpiCard[2].style.borderLeftColor = "#10982bff";
            kpiValue[2].style.color = "#10982bff";
        }
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
                        backgroundColor: 'rgba(158, 174, 39, 0.2)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: 'origin',
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(174, 172, 39, 1)',
                    },
                    {
                        label: 'Alertas Previstos',
                        data: dadosHistoricoAlertas.valoresPrevistos,
                        borderColor: 'rgba(9, 105, 168, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        borderDash: [5, 5],
                        pointRadius: 2,
                        pointBackgroundColor: 'rgba(39, 93, 174, 1)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            cornerRadius: 4,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                display: true,
                                drawBorder: false,
                                color: 'rgba(0, 0, 0, 0.08)'
                            },
                            ticks: {
                                color: '#555'
                            }
                        },
                        x: {
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: {
                                color: '#555'
                            }
                        }
                    }
                }
            });
        const ctxTipos = document.getElementById('graficoTiposAlertas').getContext('2d');

        new Chart(ctxTipos, {
            type: 'doughnut',
            data: {
                labels: dadosTiposAlertas.labels,
                datasets: [{
                    label: 'Tipos de Alertas',
                    data: dadosTiposAlertas.valores,
                    backgroundColor: ['#e74c3c', '#f1c40f', '#3498db', '#95a5a6'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        labels: {
                            generateLabels(chart) {
                                const d = chart.data.datasets[0].data;
                                const total = d.reduce((a, b) => a + b, 0);

                                return chart.data.labels.map((lbl, i) => {
                                    const pct = ((d[i] / total) * 100).toFixed(2) + "%";
                                    return {
                                        text: `${lbl} ${pct}`,
                                        fillStyle: chart.data.datasets[0].backgroundColor[i],
                                        index: i
                                    };
                                });
                            }
                        }
                    },

                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((ctx.raw / total) * 100).toFixed(2);
                                return `${ctx.label}: ${pct}%`;
                            }
                        }
                    }
                }
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

    function carregarAlertasAtivos() {
        const tbodyTabelaAlertas = listaAlertasContainer.querySelector("tbody");
        
        const alertaData = {
            uuid: ["123MP1287512312",
                   "b864c1b81f7e4ec",
                   "c1b8121123mp128",
                   "f1b81f703942315",
                   "151f1b81f728sjd",
                   "b87467775d8261s",
                   "7467775d8261s2s"
                ],
            componente: [
                "CPU",
                "RAM",
                "Bateria",
                "CPU",
                "CPU",
                "Bateria",
                "CPU",
            ],
            severidade: [
                "Atenção",
                "Atenção",
                "Crítico",
                "Crítico",
                "Atenção",
                "Crítico",
                "Atenção",
            ]
        }

        tbodyFinal = "";
        for (i = 0; i < alertaData.uuid.length; i++) {
            if (alertaData.severidade[i] == "Crítico") {
                tbodyFinal += '<tr class="critico">';
            } else {
                tbodyFinal += "<tr>";
            }

            tbodyFinal += `<td>${alertaData.uuid[i]}</td>`;
            tbodyFinal += `<td>${alertaData.componente[i]}</td>`;
            tbodyFinal += `<td>${alertaData.severidade[i]}</td>`;
            tbodyFinal += `<td class="acoes"><button class="btn-acao btn-editar">Ver Situação</button></td>`;
            tbodyFinal += "</tr>";
        }

        tbodyTabelaAlertas.innerHTML = tbodyFinal;
    }

    function carregarParametros() {
        const tbodyTabelaParametros = listaParametrosContainer.querySelector("tbody");
        
        const parametroData = {
            componente: [
                "CPU",
                "RAM",
                "Bateria",
                "Disco"
            ],
            minimo: [
                10,
                20,
                30,
                40
            ],
            maximo: [
                60,
                70,
                90,
                80
            ],
            tempo: [
                2,
                3,
                5,
                3
            ]
            
        }

        tbodyFinal = "";
        for (i = 0; i < parametroData.componente.length; i++) {
            tbodyFinal += "<tr>";
            tbodyFinal += `<td>${parametroData.componente[i]}</td>`;
            tbodyFinal += `<td>${parametroData.minimo[i]}</td>`;
            tbodyFinal += `<td>${parametroData.maximo[i]}</td>`;
            tbodyFinal += `<td>${parametroData.tempo[i]}</td>`;
            tbodyFinal += "</tr>";
        }

        tbodyTabelaParametros.innerHTML = tbodyFinal;
    }

    // --- EXECUÇÃO ---
    iniciarDashboard();
});