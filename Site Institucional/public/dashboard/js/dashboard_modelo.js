// Arquivo: js/dashboard_modelo.js

document.addEventListener('DOMContentLoaded', () => {
    let dispositivoData;

    let ordens = [
        {
            "uuid": "asc",
            "componente": "asc",
            "severidade": "asc"
        },
        {
            "componente": "asc",
            "minimo": "asc",
            "maximo": "asc",
            "tempo": "asc"
        },
        {
            "uuid": "asc",
            "alertasAtivos": "asc",
            "alertasCriticos": "asc",
            "status": "desc"
        }
    ]
    // Selecionando os novos elementos
    const headerUserInfoEl = document.getElementById('header_user_info');
    const kpiContainer = document.getElementById('kpi_container');
    const listaAlertasContainer = document.getElementById('lista_alertas_container');
    const listaParametrosContainer = document.getElementById('lista_parametros_container');
    const listaDispositivosContainer = document.getElementById('lista_dispositivos_container');

    // --- FUNÇÃO DE INICIALIZAÇÃO DA PÁGINA ---
    function iniciarDashboard() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        if (!dadosUsuarioLogado) {
            window.location.href = "../login.html";
            return;
        }

        const nomeUsuario = dadosUsuarioLogado.usuario.nome;
        const emailUsuario = dadosUsuarioLogado.usuario.email;
        headerUserInfoEl.innerHTML = `<div class="user-info"><span class="user-name">${nomeUsuario}</span><span class="user-email">${emailUsuario}</span></div>`;

        carregarKPIs();
        carregarGraficos();
        carregarAlertasAtivos();
        carregarParametros();
        carregarDispositivos();
        subirScroll();
        adicionarOrdenacoes();
    }

    // --- FUNÇÃO PARA CARREGAR OS KPIS ---
    function carregarKPIs() {

        const kpiData = { alertasAtivos: 7, dispositivosOffline: 3, alertasCriticos: 3 };
        const kpiPercent = { alertasAtivos: 15, dispositivosOffline: 10, alertasCriticos: -5 };

        const kpiCards = kpiContainer.querySelectorAll(".kpi-card");

        kpiCards.forEach(kpi => {
            if (kpi.classList.contains("devices")) {
                kpi.addEventListener("click", () => window.location = "#lista_dispositivos_container");
            } else {
                kpi.addEventListener("click", () => window.location = "#lista_alertas_container");
            }
        });

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

        const dadosHistoricoAlertas = { labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex (Hoje)', 'Sáb'], valoresReais: [3, 5, 2, 8, 4, 7], valoresPrevistos: [4, 8, 2, 5, 8, 2, 3] };
        const dadosTiposAlertas = { labels: ['CPU', 'Bateria', 'RAM', 'Disco'], valores: [4, 2, 1, 0] };
        const ctxHistorico = document.getElementById('graficoHistoricoAlertas').getContext('2d');
        new Chart(ctxHistorico,
            {
                type: 'line',
                data: {
                    labels: dadosHistoricoAlertas.labels,
                    datasets: [{
                        label: 'Alertas Emitidos',
                        data: dadosHistoricoAlertas.valoresReais,
                        backgroundColor: 'rgba(190, 17, 17, 0.2)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: 'origin',
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(196, 17, 17, 1)',
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
                    backgroundColor: ['#0a63d1ff', '#9a5018ff', '#93058fff', '#118b62ff'],
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


    function carregarAlertasAtivos(data) {

        const tbodyTabelaAlertas = listaAlertasContainer.querySelector("tbody");

        if (data == null) {
            alertaData = [
                {
                    "uuid": "123MP1287512312",
                    "componente": "CPU",
                    "severidade": "Atenção"
                },
                {
                    "uuid": "b864c1b81f7e4ec",
                    "componente": "RAM",
                    "severidade": "Atenção"
                },
                {
                    "uuid": "c1b8121123mp128",
                    "componente": "Bateria",
                    "severidade": "Crítico"
                },
                {
                    "uuid": "f1b81f703942315",
                    "componente": "CPU",
                    "severidade": "Crítico"
                },
                {
                    "uuid": "151f1b81f728sjd",
                    "componente": "CPU",
                    "severidade": "Atenção"
                },
                {
                    "uuid": "b87467775d8261s",
                    "componente": "Bateria",
                    "severidade": "Crítico"
                },
                {
                    "uuid": "7467775d8261s2s",
                    "componente": "CPU",
                    "severidade": "Atenção"
                }
            ]

            data = alertaData;
        }

        tbodyFinal = "";
        for (let i = 0; i < data.length; i++) {
            if (data[i].severidade == "Crítico") {
                tbodyFinal += '<tr class="critico">';
            } else {
                tbodyFinal += "<tr>";
            }

            tbodyFinal += `<td>${data[i].uuid}</td>`;
            tbodyFinal += `<td>${data[i].componente}</td>`;
            tbodyFinal += `<td>${data[i].severidade}</td>`;
            tbodyFinal += `<td class="acoes"><button class="btn-acao btn-editar">Ver Situação</button></td>`;
            tbodyFinal += "</tr>";
        }

        tbodyTabelaAlertas.innerHTML = tbodyFinal;

        const tr = tbodyTabelaAlertas.querySelectorAll("tr");

        let cores = ['#0a63d1ff', '#9a5018ff', '#93058fff', '#118b62ff'];

        tr.forEach(tr => {
            let td = tr.querySelectorAll("td")[1];
            
            if (td.textContent.toLowerCase().includes("cpu")) {
                td.style.color = cores[0];
            } else if (td.textContent.toLowerCase().includes("bateria")) {
                td.style.color = cores[1];
            } else if (td.textContent.toLowerCase().includes("ram")) {
                td.style.color = cores[2];
            } else if (td.textContent.toLowerCase().includes("disco")) {
                td.style.color = cores[3];
            } 
        })
    }

    function carregarParametros(data) {
        const tbodyTabelaParametros = listaParametrosContainer.querySelector("tbody");

        if (data == null) {
            parametroData = [
                {
                    "componente": "CPU",
                    "minimo": 10,
                    "maximo": 60,
                    "tempo": 2
                },
                {
                    "componente": "RAM",
                    "minimo": 20,
                    "maximo": 70,
                    "tempo": 3
                },
                {
                    "componente": "Bateria",
                    "minimo": 30,
                    "maximo": 90,
                    "tempo": 5
                },
                {
                    "componente": "Disco",
                    "minimo": 40,
                    "maximo": 80,
                    "tempo": 3
                }
            ]

            data = parametroData;
        }

        tbodyFinal = "";
        for (let i = 0; i < data.length; i++) {
            tbodyFinal += "<tr>";
            tbodyFinal += `<td>${data[i].componente}</td>`;
            tbodyFinal += `<td>${data[i].minimo}</td>`;
            tbodyFinal += `<td>${data[i].maximo}</td>`;
            tbodyFinal += `<td>${data[i].tempo}</td>`;
            tbodyFinal += "</tr>";
        }

        tbodyTabelaParametros.innerHTML = tbodyFinal;

        const tr = tbodyTabelaParametros.querySelectorAll("tr");

        let cores = ['#0a63d1ff', '#9a5018ff', '#93058fff', '#118b62ff'];
        tr.forEach(tr => {
            let td = tr.querySelectorAll("td")[0];
            
            if (td.textContent.toLowerCase().includes("cpu")) {
                td.style.color = cores[0];
            } else if (td.textContent.toLowerCase().includes("bateria")) {
                td.style.color = cores[1];
            } else if (td.textContent.toLowerCase().includes("ram")) {
                td.style.color = cores[2];
            } else if (td.textContent.toLowerCase().includes("disco")) {
                td.style.color = cores[3];
            } 
        });
    }

    function carregarDispositivos(data) {
        const tbodyTabelaDispositivos = listaDispositivosContainer.querySelector("tbody");

        if (data == null) {
            dispositivoData = [
                {
                    "uuid": "123MP1287512312",
                    "alertasAtivos": 1,
                    "alertasCriticos": 0,
                    "status": "Online"
                },
                {
                    "uuid": "b864c1b81f7e4ec",
                    "alertasAtivos": 1,
                    "alertasCriticos": 0,
                    "status": "Online"
                },
                {
                    "uuid": "c1b8121123mp128",
                    "alertasAtivos": 1,
                    "alertasCriticos": 1,
                    "status": "Offline"
                },
                {
                    "uuid": "f1b81f703942315",
                    "alertasAtivos": 1,
                    "alertasCriticos": 1,
                    "status": "Offline"
                },
                {
                    "uuid": "151f1b81f728sjd",
                    "alertasAtivos": 1,
                    "alertasCriticos": 0,
                    "status": "Online"
                },
                {
                    "uuid": "b87467775d8261s",
                    "alertasAtivos": 1,
                    "alertasCriticos": 1,
                    "status": "Offline"
                },
                {
                    "uuid": "7467775d8261s2s",
                    "alertasAtivos": 1,
                    "alertasCriticos": 0,
                    "status": "Online"
                }
            ]

            data = dispositivoData;
        }

        tbodyFinal = "";
        for (let i = 0; i < data.length; i++) {
            if (data[i].status == "Offline") {
                tbodyFinal += '<tr class="critico">';
            } else {
                tbodyFinal += "<tr>";
            }

            tbodyFinal += `<td>${data[i].uuid}</td>`;
            tbodyFinal += `<td>${data[i].alertasAtivos}</td>`;
            tbodyFinal += `<td>${data[i].alertasCriticos}</td>`;
            tbodyFinal += `<td>${data[i].status}</td>`;
            tbodyFinal += `<td class="acoes"><button class="btn-acao btn-editar">Ver Situação</button></td>`;
            tbodyFinal += "</tr>";
        }

        tbodyTabelaDispositivos.innerHTML = tbodyFinal;
    }

    function subirScroll() {
        const subir = document.querySelector('.subir');

        const limiteScroll = 200;
        const mainContent = document.querySelector(".main-content");
        mainContent.addEventListener('scroll', () => {
            if (mainContent.scrollTop > limiteScroll) {
                subir.style.marginRight = 0;
            } else {
                subir.style.marginRight = "-20%";
            }
        });

        subir.addEventListener('click', () => {
            mainContent.scrollTop = 0;
        })
    }

    function selectionSortNumerico(data, coluna, nomeLista) {
        if (data.length == 0) {
            return;
        }

        let ordem;

        if (nomeLista == "alertas") {
            ordem = (ordens[0][coluna] == "asc") ? "desc" : "asc"; 
            ordens[0][coluna] = ordem;
        } else if (nomeLista == "parametros") {
            ordem = (ordens[1][coluna] == "asc") ? "desc" : "asc";
            ordens[1][coluna] = ordem; 
        } else {
            ordem = (ordens[2][coluna] == "asc") ? "desc" : "asc";
            ordens[2][coluna] = ordem; 
        }

        if (ordem == "asc") {
            for (let i = 0; i < data.length - 1; i++) {
                let indiceMenor = i;
                for (let j = i + 1; j < data.length; j++) {
                    if (data[j][coluna] < data[indiceMenor][coluna]) {
                        indiceMenor = j;
                    }
                }

                if (i != indiceMenor) {
                    let copia = data[i];
                    data[i] = data[indiceMenor];
                    data[indiceMenor] = copia;
                }
            }
        } else {
            for (let i = 0; i < data.length - 1; i++) {
                let indiceMaior = i;
                for (let j = i + 1; j < data.length; j++) {
                    if (data[j][coluna] > data[indiceMaior][coluna]) {
                        indiceMaior = j;
                    }
                }

                if (i != indiceMaior) {
                    let copia = data[i];
                    data[i] = data[indiceMaior];
                    data[indiceMaior] = copia;
                }
            }
        }

        if (nomeLista == "alertas") {
            alertaData = data;
            carregarAlertasAtivos(alertaData);
        } else if (nomeLista == "parametros") {
            parametroData = data;
            carregarParametros(parametroData);
        } else {
            dispositivoData = data;
            carregarDispositivos(dispositivoData);
        }
    }

    function selectionSortString(data, coluna, nomeLista) {
        if (data.length == 0) {
            return;
        }

        let ordem;

        if (nomeLista == "alertas") {
            ordem = (ordens[0][coluna] == "asc") ? "desc" : "asc";
            ordens[0][coluna] = ordem; 
        } else if (nomeLista == "parametros") {
            ordem = (ordens[1][coluna] == "asc") ? "desc" : "asc"; 
            ordens[1][coluna] = ordem;
        } else {
            ordem = (ordens[2][coluna] == "asc") ? "desc" : "asc"; 
            ordens[2][coluna] = ordem;
        }

        if (ordem == "asc") {
            for (let i = 0; i < data.length - 1; i++) {
                let indiceMenor = i;
                for (let j = i + 1; j < data.length; j++) {
                    if (data[j][coluna].localeCompare(data[indiceMenor][coluna]) == -1) {
                        indiceMenor = j;
                    }
                }

                if (i != indiceMenor) {
                    let copia = data[i];
                    data[i] = data[indiceMenor];
                    data[indiceMenor] = copia;
                }
            }
        } else {
            for (let i = 0; i < data.length - 1; i++) {
                let indiceMaior = i;
                for (let j = i + 1; j < data.length; j++) {
                    if (data[j][coluna].localeCompare(data[indiceMaior][coluna]) == 1) {
                        indiceMaior = j;
                    }
                }

                if (i != indiceMaior) {
                    let copia = data[i];
                    data[i] = data[indiceMaior];
                    data[indiceMaior] = copia;
                }
            }
        }

        if (nomeLista == "alertas") {
            alertaData = data;
            carregarAlertasAtivos(alertaData);
        } else if (nomeLista == "parametros") {
            parametroData = data;
            carregarParametros(parametroData);
        } else {
            dispositivoData = data;
            carregarDispositivos(dispositivoData);
        }
    }

    function adicionarOrdenacoes() {
        const thAlertas = listaAlertasContainer.querySelectorAll("th");
        const thParametros = listaParametrosContainer.querySelectorAll("th");
        const thDispositivos = listaDispositivosContainer.querySelectorAll("th");

        selectionSortString(alertaData, "severidade", "alertas");
        thAlertas.forEach(th => {
            if (th.textContent.toLowerCase().includes("uuid")) {
                th.addEventListener("click", () => selectionSortString(alertaData, "uuid", "alertas"));
            } else if (th.textContent.toLowerCase().includes("componente")) {
                th.addEventListener("click", () => selectionSortString(alertaData, "componente", "alertas"));
            } else if (th.textContent.toLowerCase().includes("severidade")) {
                th.addEventListener("click", () => selectionSortString(alertaData, "severidade", "alertas"));
            }
        });

        thParametros.forEach(th => {
            if (th.textContent.toLowerCase().includes("componente")) {
                th.addEventListener("click", () => selectionSortString(parametroData, "componente", "parametros"));
            } else if (th.textContent.toLowerCase().includes("mínimo")) {
                th.addEventListener("click", () => selectionSortNumerico(parametroData, "minimo", "parametros"));
            } else if (th.textContent.toLowerCase().includes("máximo")) {
                th.addEventListener("click", () => selectionSortNumerico(parametroData, "maximo", "parametros"));
            } else if (th.textContent.toLowerCase().includes("tempo")) {
                th.addEventListener("click", () => selectionSortNumerico(parametroData, "tempo", "parametros"));
            }
        });

        selectionSortString(dispositivoData, "status", "dispositivos");
        thDispositivos.forEach(th => {
            if (th.textContent.toLowerCase().includes("uuid")) {
                th.addEventListener("click", () => selectionSortString(dispositivoData, "uuid", "dispositivos"));
            } else if (th.textContent.toLowerCase().includes("alertas ativos")) {
                th.addEventListener("click", () => selectionSortNumerico(dispositivoData, "alertasAtivos", "dispositivos"));
            } else if (th.textContent.toLowerCase().includes("alertas críticos")) {
                th.addEventListener("click", () => selectionSortNumerico(dispositivoData, "alertasCriticos", "dispositivos"));
            } else if (th.textContent.toLowerCase().includes("status")) {
                th.addEventListener("click", () => selectionSortString(dispositivoData, "status", "dispositivos"));
            }
        });
    }


    // --- EXECUÇÃO ---
    iniciarDashboard();
}); 