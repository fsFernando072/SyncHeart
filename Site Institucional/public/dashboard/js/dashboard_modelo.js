// Arquivo: js/dashboard_modelo.js

document.addEventListener('DOMContentLoaded', () => {
    let dispositivoData;
    let alertaData;
    let parametroData;

    const alertaKpi = {
        alertas_ativos: 0,
        alertas_criticos: 0,
        dispositivos_offline: 0
    };

    const dadosHistoricoAlertas = { labels: [], alertas_ativos: [], alertas_previstos: [] };

    const dadosTiposAlertas = { labels: ['CPU', 'Bateria', 'RAM', 'Disco'], valores: [0, 0, 0, 0] };

    const token = sessionStorage.getItem('authToken');
    const idModelo = sessionStorage.getItem("idModelo");
    const nomeClinica = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO")).clinica.nome;

    let ordens = [
        {
            "dispositivo_uuid": "asc",
            "tipo_alerta": "asc",
            "severidade": "asc"
        },
        {
            "metrica": "asc",
            "limiar_valor": "asc",
            "duracao_minutos": "asc",
            "criticidade": "asc",
        },
        {
            "dispositivo_uuid": "asc",
            "alertas_ativos": "asc",
            "alertas_criticos": "desc",
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
    async function iniciarDashboard() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        if (!dadosUsuarioLogado) {
            window.location.href = "../login.html";
            return;
        }

        const nomeUsuario = dadosUsuarioLogado.usuario.nome;
        const emailUsuario = dadosUsuarioLogado.usuario.email;
        headerUserInfoEl.innerHTML = `<div class="user-info"><span class="user-name">${nomeUsuario}</span><span class="user-email">${emailUsuario}</span></div>`;

        await carregarModelo();
        let alertas = await buscarTicketsPorModelo(nomeClinica, idModelo, token);
        let alertasUltSemana = await buscarTicketsPorModeloUltimaSemana(nomeClinica, idModelo, token);
        alertaData = alertas;
        await carregarAlertasAtivos(alertas);
        await carregarParametros();
        await carregarDispositivos(dispositivoData, alertas);
        carregarKPIs(alertasUltSemana);
        await carregarAlertasPorDia();
        carregarGraficos();
        subirScroll();
        adicionarOrdenacoes();
    }

    // --- FUNÇÃO PARA CARREGAR OS KPIS ---
    function carregarKPIs(alertasUltSemana) {

        const kpiData = {
            alertas_ativos: alertaKpi.alertas_ativos,
            dispositivos_offline: alertaKpi.dispositivos_offline,
            alertas_criticos: alertaKpi.alertas_criticos
        };

        let ativosPercent = 0;
        let offlinePercent = 0;
        let criticoPercent = 0;

        if (alertasUltSemana.alertas_ativos == 0) {
            ativosPercent = alertaKpi.alertas_ativos * 100;
        } else {
            ativosPercent = (1 - alertaKpi.alertas_ativos / alertasUltSemana.alertas_ativos) * 100;
        }

        if (alertasUltSemana.dispositivos_offline == 0) {
            offlinePercent = alertaKpi.dispositivos_offline * 100;
        } else {
            offlinePercent = (1 - alertaKpi.dispositivos_offline / alertasUltSemana.dispositivos_offline) * 100;
        }

        if (alertasUltSemana.alertas_criticos == 0) {
            criticoPercent = alertaKpi.alertas_criticos * 100;
        } else {
            criticoPercent = (1 - alertaKpi.alertas_criticos / alertasUltSemana.alertas_criticos) * 100;
        }

        const kpiPercent = {
            alertas_ativos: ativosPercent,
            dispositivos_offline: offlinePercent,
            alertas_criticos: criticoPercent
        };

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

        kpiValue[0].innerText = kpiData.dispositivos_offline;
        kpiValue[1].innerText = kpiData.alertas_ativos;
        kpiValue[2].innerText = kpiData.alertas_criticos;

        kpiDescription[0].innerText = (kpiPercent.dispositivos_offline > 0 ? "+" : "") + kpiPercent.dispositivos_offline + "%";
        kpiDescription[1].innerText = (kpiPercent.alertas_ativos > 0 ? "+" : "") + kpiPercent.alertas_ativos + "%";
        kpiDescription[2].innerText = (kpiPercent.alertas_criticos > 0 ? "+" : "") + kpiPercent.alertas_criticos + "%";

        if (kpiPercent.dispositivos_offline > 0) {
            kpiDescription[0].style.color = "#e74c3c";
        } else if (kpiPercent.dispositivos_offline == 0) {
            kpiDescription[0].style.color = "#f1c40f";
        } else {
            kpiDescription[0].style.color = "#10982bff";
        }

        if (kpiPercent.alertas_ativos > 0) {
            kpiDescription[1].style.color = "#e74c3c";
        } else if (kpiPercent.alertas_ativos == 0) {
            kpiDescription[1].style.color = "#f1c40f";
        } else {
            kpiDescription[1].style.color = "#10982bff";
        }

        if (kpiPercent.alertas_criticos > 0) {
            kpiDescription[2].style.color = "#e74c3c";
        } else if (kpiPercent.alertas_criticos == 0) {
            kpiDescription[2].style.color = "#f1c40f";
        } else {
            kpiDescription[2].style.color = "#10982bff";
        }


        if (kpiData.dispositivos_offline >= 3) {
            kpiCard[0].style.borderLeftColor = "#e74c3c";
            kpiValue[0].style.color = "#e74c3c";
        } else if (kpiData.dispositivos_offline > 0) {
            kpiCard[0].style.borderLeftColor = "#f1c40f";
            kpiValue[0].style.color = "#f1c40f";
        } else {
            kpiCard[0].style.borderLeftColor = "#10982bff";
            kpiValue[0].style.color = "#10982bff";
        }

        if (kpiData.alertas_ativos >= 3) {
            kpiCard[1].style.borderLeftColor = "#e74c3c";
            kpiValue[1].style.color = "#e74c3c";
        } else if (kpiData.alertas_ativos > 0) {
            kpiCard[1].style.borderLeftColor = "#f1c40f";
            kpiValue[1].style.color = "#f1c40f";
        } else {
            kpiCard[1].style.borderLeftColor = "#10982bff";
            kpiValue[1].style.color = "#10982bff";
        }

        if (kpiData.alertas_criticos >= 3) {
            kpiCard[2].style.borderLeftColor = "#e74c3c";
            kpiValue[2].style.color = "#e74c3c";
        } else if (kpiData.alertas_criticos > 0) {
            kpiCard[2].style.borderLeftColor = "#f1c40f";
            kpiValue[2].style.color = "#f1c40f";
        } else {
            kpiCard[2].style.borderLeftColor = "#10982bff";
            kpiValue[2].style.color = "#10982bff";
        }
    }

    // --- FUNÇÃO PARA CARREGAR OS GRÁFICOS ---
    function carregarGraficos() {

        document.querySelector("#module_historico_alertas span").style.display = "none";
        document.querySelector("#module_tipos_alertas span").style.display = "none";
        
        const ctxHistorico = document.getElementById('graficoHistoricoAlertas').getContext('2d');
        new Chart(ctxHistorico,
            {
                type: 'line',
                data: {
                    labels: dadosHistoricoAlertas.labels,
                    datasets: [{
                        label: 'Alertas Ativos',
                        data: dadosHistoricoAlertas.alertas_ativos,
                        backgroundColor: 'rgba(190, 17, 17, 0.2)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: 'origin',
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(196, 17, 17, 1)',
                    },
                    {
                        label: 'Alertas Previstos',
                        data: dadosHistoricoAlertas.alertas_previstos,
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

        if (dadosTiposAlertas.valores[0] == 0 &&
            dadosTiposAlertas.valores[1] == 0 &&
            dadosTiposAlertas.valores[2] == 0 &&
            dadosTiposAlertas.valores[3] == 0
        ) {
            document.getElementById('graficoTiposAlertas').parentElement.innerHTML = '<p>Nenhum alerta ativo ainda.</p>';
            return;
        }
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

    async function carregarModelo() {
        const resposta = await fetch(`/modelos/${idModelo}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!resposta.ok) throw new Error('Falha ao carregar modelo.');
        let infoModelo = await resposta.json();

        document.querySelector("#header_title").innerHTML += `${infoModelo.nome_fabricante} ${infoModelo.nome_modelo}`;
        let caminho = document.querySelector("#breadcrumb_path").querySelectorAll("a")[1];
        caminho.innerHTML += `${infoModelo.nome_fabricante} ${infoModelo.nome_modelo}`;
    }


    async function carregarAlertasAtivos(data) {

        const tbodyTabelaAlertas = listaAlertasContainer.querySelector("tbody");

        tbodyFinal = "";
        if (data == null || data.length == 0) {
            tbodyTabelaAlertas.parentElement.innerHTML = '<p>Nenhum alerta ativo ainda.</p>';
            return;
        }

        for (let i = 0; i < data.length; i++) {
            if (data[i].severidade == "CRÍTICO") {
                tbodyFinal += '<tr class="critico">';
            } else {
                tbodyFinal += "<tr>";
            }

            if (data[i].tipo_alerta == "CPU") {
                dadosTiposAlertas.valores[0] += 1;
            } else if (data[i].tipo_alerta == "BATERIA") {
                dadosTiposAlertas.valores[1] += 1;
            } else if (data[i].tipo_alerta == "RAM") {
                dadosTiposAlertas.valores[2] += 1;
            } else {
                dadosTiposAlertas.valores[3] += 1;
            }

            tbodyFinal += `<td>${data[i].dispositivo_uuid}</td>`;
            tbodyFinal += `<td>${data[i].tipo_alerta}</td>`;
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

    async function carregarParametros(data) {
        const tbodyTabelaParametros = listaParametrosContainer.querySelector("tbody");

        tbodyFinal = "";
        if (data == null) {
            try {
                const resposta = await fetch(`/modelos/${idModelo}/parametros/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!resposta.ok) throw new Error('Falha ao carregar alertas do modelo.');
                parametroData = await resposta.json();

                if (parametroData.length === 0) {
                    tbodyTabelaParametros.innerHTML = '<p>Nenhum parametro encontrado.</p>';
                    return;
                }

                data = parametroData;

            } catch (erro) {
                console.error(erro);
                tbodyTabelaAlertas.innerHTML = `<p style="color: red;">${erro.message}</p>`;
                return;
            }
        }

        for (let i = 0; i < data.length; i++) {
            if (data[i].severidade == "CRÍTICO") {
                tbodyFinal += '<tr class="critico_texto">';
            } else {
                tbodyFinal += "<tr>";
            }

            tbodyFinal += `<td>${data[i].metrica}</td>`;
            tbodyFinal += `<td>${data[i].limiar_valor}</td>`;
            tbodyFinal += `<td>${data[i].duracao_minutos}</td>`;
            tbodyFinal += `<td>${data[i].criticidade}</td>`;
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

    async function carregarDispositivos(data, tickets) {
        const tbodyTabelaDispositivos = listaDispositivosContainer.querySelector("tbody");

        tbodyFinal = "";
        if (data == null) {
            try {
                const resposta = await fetch(`/modelos/listar/${idModelo}/dispositivos`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!resposta.ok) throw new Error('Falha ao carregar dispositivos do modelo.');
                dispositivoData = await resposta.json();

                if (dispositivoData.length === 0) {
                    tbodyTabelaDispositivos.innerHTML = '<p>Nenhum dispositivo encontrado.</p>';
                    return;
                }

                for (let i = 0; i < dispositivoData.length; i++) {
                    dispositivoData[i].status = "Online";
                    dispositivoData[i].alertas_ativos = 0;
                    dispositivoData[i].alertas_criticos = 0;

                    for (let j = tickets.length - 1; j >= 0; j--) {
                        let ticket = tickets[j];

                        if (ticket.dispositivo_uuid == dispositivoData[i].dispositivo_uuid) {
                            dispositivoData[i].alertas_ativos += 1;
                            alertaKpi.alertas_ativos += 1;

                            if (ticket.severidade == "CRÍTICO") {
                                dispositivoData[i].alertas_criticos += 1;
                                alertaKpi.alertas_criticos += 1;
                            }

                            if (ticket.tipo_alerta == "Offline") {
                                dispositivoData[i].status += "Offline";
                                alertaKpi.dispositivos_offline += 1;
                            }

                            tickets.splice(j, 1);
                        }
                    };
                }

                data = dispositivoData;
            } catch (erro) {
                console.error(erro);
                tbodyTabelaDispositivos.innerHTML = `<p style="color: red;">${erro.message}</p>`;
                return;
            }
        }

        for (let i = 0; i < data.length; i++) {
            if (data[i].status == "Offline") {
                tbodyFinal += '<tr class="critico">';
            } else {
                tbodyFinal += "<tr>";
            }

            let cor_ativos;
            let cor_criticos;
            if (data[i].alertas_ativos >= 3) {
                cor_ativos = "alto";
            } else if (data[i].alertas_ativos > 0) {
                cor_ativos = "moderado";
            } else {
                cor_ativos = "baixo";
            }

            if (data[i].alertas_criticos >= 3) {
                cor_criticos = "alto";
            } else if (data[i].alertas_criticos > 0) {
                cor_criticos = "moderado";
            } else {
                cor_criticos = "baixo";
            }

            tbodyFinal += `<td>${data[i].dispositivo_uuid}</td>`;
            tbodyFinal += `<td class="${cor_ativos}">${data[i].alertas_ativos}</td>`;
            tbodyFinal += `<td class="${cor_criticos}">${data[i].alertas_criticos}</td>`;
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
                th.addEventListener("click", () => selectionSortString(alertaData, "dispositivo_uuid", "alertas"));
            } else if (th.textContent.toLowerCase().includes("componente")) {
                th.addEventListener("click", () => selectionSortString(alertaData, "tipo_alerta", "alertas"));
            } else if (th.textContent.toLowerCase().includes("severidade")) {
                th.addEventListener("click", () => selectionSortString(alertaData, "severidade", "alertas"));
            }
        });

        thParametros.forEach(th => {
            if (th.textContent.toLowerCase().includes("componente")) {
                th.addEventListener("click", () => selectionSortString(parametroData, "metrica", "parametros"));
            } else if (th.textContent.toLowerCase().includes("valor")) {
                th.addEventListener("click", () => selectionSortString(parametroData, "limiar_valor", "parametros"));
            } else if (th.textContent.toLowerCase().includes("severidade")) {
                th.addEventListener("click", () => selectionSortString(parametroData, "criticidade", "parametros"));
            } else if (th.textContent.toLowerCase().includes("tempo")) {
                th.addEventListener("click", () => selectionSortNumerico(parametroData, "duracao_minutos", "parametros"));
            }
        });

        selectionSortNumerico(dispositivoData, "alertas_ativos", "dispositivos");
        selectionSortString(dispositivoData, "status", "dispositivos");
        thDispositivos.forEach(th => {
            if (th.textContent.toLowerCase().includes("uuid")) {
                th.addEventListener("click", () => selectionSortString(dispositivoData, "dispositivo_uuid", "dispositivos"));
            } else if (th.textContent.toLowerCase().includes("alertas ativos")) {
                th.addEventListener("click", () => selectionSortNumerico(dispositivoData, "alertas_ativos", "dispositivos"));
            } else if (th.textContent.toLowerCase().includes("alertas críticos")) {
                th.addEventListener("click", () => selectionSortNumerico(dispositivoData, "alertas_criticos", "dispositivos"));
            } else if (th.textContent.toLowerCase().includes("status")) {
                th.addEventListener("click", () => selectionSortString(dispositivoData, "status", "dispositivos"));
            }
        });
    }

    async function carregarAlertasPorDia() {
        const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dataAtual = new Date();

        const promessas = [];
        const labels = [];

        for (let i = 6; i >= 0; i--) {
            let dataInicio = new Date(dataAtual);
            dataInicio.setDate(dataAtual.getDate() - i);

            const ano = dataInicio.getFullYear();
            const mes = (dataInicio.getMonth() + 1).toString().padStart(2, '0');
            const dia = dataInicio.getDate().toString().padStart(2, '0');

            const dataFormatada = `${ano}-${mes}-${dia}`;

            promessas.push(
                buscarTicketsPorModeloPorDia(nomeClinica, idModelo, token, dataFormatada)
            );

            labels.push(diasDaSemana[dataInicio.getDay()]);
        }

        labels[6] = `${labels[6]} (Hoje)`;
        labels[7] = labels[0];

        const totais = await Promise.all(promessas);
        const alertas_previstos = await preverAlertas(totais, 0.3);

        labels.splice(0, 1);
        totais.splice(0, 1);
        alertas_previstos.splice(0, 1);

        dadosHistoricoAlertas.labels = labels;
        dadosHistoricoAlertas.alertas_ativos = totais;
        dadosHistoricoAlertas.alertas_previstos = alertas_previstos;
    }

    async function buscarTicketsPorModelo(nomeClinica, idModelo, token) {
        try {
            const listaBody = { nomeClinica: nomeClinica, idModelo: idModelo };
            const resposta = await fetch(`/jira/listar/modelo`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(listaBody)
                });

            if (!resposta.ok) throw new Error('Falha ao carregar tickets.');

            let tickets = await resposta.json();

            let alertas = [];

            tickets.forEach(ticket => {
                let description = ticket.description.content[0].content[0].text.trim().split('\n');
                let severidade = ticket.priority.name;
                severidade = severidade == "High" ? "CRÍTICO" : "ATENÇÃO";
                let dispositivo_uuid = description[0].split(":")[1].trim();
                let tipo_alerta = description[2].split(":")[1].trim();
                dispositivo_uuid = dispositivo_uuid.substring(0, 15)

                let alerta = {
                    "dispositivo_uuid": dispositivo_uuid.substring(0, 15),
                    "tipo_alerta": tipo_alerta,
                    "severidade": severidade
                }

                alertas.push(alerta);
            });

            return alertas;
        } catch (erro) {
            console.error(erro);

            return [];
        }
    }

    async function buscarTicketsPorModeloUltimaSemana(nomeClinica, idModelo, token) {
        try {
            const listaBody = { nomeClinica: nomeClinica, idModelo: idModelo };
            const resposta = await fetch(`/jira/listar/modelo/ultsemana`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(listaBody)
                });

            if (!resposta.ok) throw new Error('Falha ao carregar tickets.');

            let alertas = await resposta.json();

            let criticos = 0;
            let offline = 0;
            alertas.forEach(alerta => {
                let description = alerta.description.content[0].content[0].text.trim().split('\n');
                let tipo_alerta = description[2].split(":")[1].trim();

                if (alerta.priority.name == "High") {
                    criticos += 1;
                }

                if (tipo_alerta == "Offline") {
                    offline += 1;
                }
            });

            return { alertas_ativos: alertas.length, alertas_criticos: criticos, dispositivos_offline: offline };
        } catch (erro) {
            console.error(erro);

            return [];
        }
    }

    async function buscarTicketsPorModeloPorDia(nomeClinica, idModelo, token, dataDoDia) {
        try {
            const listaBody = { nomeClinica: nomeClinica, idModelo: idModelo, dataDoDia: dataDoDia };
            const resposta = await fetch(`/jira/listar/modelo/dia`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(listaBody)
                });

            if (!resposta.ok) throw new Error('Falha ao carregar tickets.');

            let alertas = await resposta.json();

            return alertas.length;
        } catch (erro) {
            console.error(erro);

            return 0;
        }
    }

    async function preverAlertas(alertas, alpha) {
        let alertas_previstos = [];
        alertas_previstos[0] = alertas[0];

        for (i = 1; i < alertas.length; i++) {
            alertas_previstos[i] = alpha * alertas[i] + (1 - alpha) * alertas_previstos[i - 1];
            alertas_previstos[i] = Math.round(alertas_previstos[i]);
        }
        alertas_previstos[7] = alpha * alertas_previstos[6] + (1 - alpha) * alertas_previstos[6];

        return alertas_previstos;
    }


    // --- EXECUÇÃO ---
    iniciarDashboard();
}); 