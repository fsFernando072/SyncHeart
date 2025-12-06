document.addEventListener('DOMContentLoaded', () => {
    let dispositivoData;

    const token = sessionStorage.getItem('authToken');
    const idDispositivo = sessionStorage.getItem('idDispositivo');
    const idModelo = sessionStorage.getItem('idModelo');
    const nomeClinica = JSON.parse(sessionStorage.getItem('USUARIO_LOGADO')).clinica.nome;

    const cardContainer = document.getElementById('card_container');
    const listaAlertasContainer = document.getElementById('lista_alertas_container');

    async function iniciarDashboard() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        if (!dadosUsuarioLogado) {
            window.location.href = "../login.html";
            return;
        }

        const nomeUsuario = dadosUsuarioLogado.usuario.nome;
        const emailUsuario = dadosUsuarioLogado.usuario.email;
        const headerUserInfoEl = document.getElementById('header_user_info');
        headerUserInfoEl.innerHTML = `<div class="user-info"><span class="user-name">${nomeUsuario}</span><span class="user-email">${emailUsuario}</span></div>`;

        await carregarDispositivo();
        let alertas = await buscarTicketsPorModelo(nomeClinica, idModelo, token);
        await carregarAlertasAtivos(alertas);
        await carregarDispositivos(dispositivoData, alertas);
        carregarGraficos();
        configurarEventListeners();
    }

    async function carregarGraficos() {
          const ctx = document.getElementById('myChart');
          const ctx2 = document.getElementById('myChart2');
          const ctx3 = document.getElementById('myChart3');
          const ctx4 = document.getElementById('myChart4');

        const respostaModelo = await fetch(`/modelos/${idModelo}`, { headers: { 'Authorization': `Bearer ${token}`}});
        let infoModelo = await respostaModelo.json();

        const respostaDispositivo = await fetch(`/dispositivosEng/${idDispositivo}`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (!respostaDispositivo.ok) throw new Error('Falha ao carregar dispositivo.');
        let infoDispositivo = await respostaDispositivo.json();
        

        const resposta = await fetch(`/s3Route/dados/${infoModelo.nome_modelo}/5a83fe84-3d16-44ed-9dd0-9c21b35a2271/atividade-lambda5.json`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (!resposta.ok) throw new Error('Falha ao carregar dispositivo.');
        let infoArquivo = await resposta.json();

        console.log(infoArquivo);
        

        console.log(infoArquivo);
        


            new Chart(ctx, {
                type: 'line',
                data: {
                labels: ['14:00', '14:10', '14:20', '14:30', '14:40', '14:50'],
                datasets: [{
                    label: 'Bateria (%)',
                    data: [100, 100, 100, 99, 99, 98],
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(17, 196, 121, 1)',
                    borderColor: 'rgba(17, 196, 121, 1)',
                    tension: 0.4,
                    pointRadius: 4
                },
                {
                    label: 'Previsão',
                    data: [99, 99, 99, 98, 98, 97],
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(111, 8, 245, 1)',
                    borderColor: 'rgba(111, 8, 245, 1)',
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointRadius: 4
                }]
                },
                options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Consumo e Previsão de Bateria',
                        font: {
                            size: 20
                        }
                    },
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

            new Chart(ctx2, {
                type: 'line',
                data: {
                labels: ['14:00', '14:10', '14:20', '14:30', '14:40', '14:50'],
                datasets: [{
                    label: 'CPU (%)',
                    data: [30, 33, 38, 44, 36, 30],
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(2, 133, 255, 1)',
                    borderColor: 'rgba(2, 133, 255, 1)',
                    tension: 0.4,
                    pointRadius: 4
                },
                {
                   label: 'RAM (%)',
                    data: [40, 39, 36, 40, 49, 42],
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 2, 213, 1)',
                    borderColor: 'rgba(255, 2, 213, 1)',
                    tension: 0.4,
                    pointRadius: 4
                }]
                },
                options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Consumo de CPU e Memória RAM',
                        font: {
                            size: 20
                        }
                    },
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
                    max: 100,
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

                new Chart(ctx3, {
                type: 'line',
                data: {
                labels: ['14:00', '14:10', '14:20', '14:30', '14:40', '14:50'],
                datasets: [{
                    label: 'Disco (%)',
                    data: [30, 30, 31, 31, 32, 29],
                    borderWidth: 2,
                    fill: 'origin',
                    pointBackgroundColor: 'rgba(2, 255, 242, 0.84)',
                    borderColor: 'rgba(2, 255, 242, 0.84)',
                    backgroundColor: 'rgba(2, 255, 242, 0.16)',
                    tension: 0.4,
                    pointRadius: 4
                }]
                },
                options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Consumo de Disco',
                        font: {
                            size: 20
                        }
                    },
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
                    max: 100,
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

                new Chart(ctx4, {
                type: 'bar',
                data: {
                labels: ['Crítico', 'Atenção'],
                datasets: [{
                    label: 'Frequência',
                    data: [3, 7],
                    borderRadius: 5,
                    borderSkipped: false,
                    borderWidth: 3
                }]
                },
                options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Frequência de Alertas',
                        font: {
                            size: 20
                        }
                    },
                    legend: { display: false },
                },
                scales: {
                    y: {
                        grid: { display: false },
                    },
                    x: {
                        grid: { display: false }
                    }
                }
                }
            });
    }

    async function carregarDispositivo() {
        const resposta = await fetch(`/dispositivosEng/${idDispositivo}`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (!resposta.ok) throw new Error('Falha ao carregar dispositivo.');
        let infoDispositivo = await resposta.json();

        const respostaModelo = await fetch(`/modelos/${idModelo}`, { headers: { 'Authorization': `Bearer ${token}`}});
        let infoModelo = await respostaModelo.json();
        console.log(infoDispositivo);
        

        document.querySelector("#id_dispositivo").innerHTML += `${infoDispositivo[0].dispositivo_id}`;
        document.querySelector("#uuid_dispositivo").innerHTML += `${infoDispositivo[0].dispositivo_uuid}`;
        document.querySelector("#id_paciente").innerHTML += `${infoDispositivo[0].idp}`
        let primeiroCaminho = document.querySelector("#breadcrumb_path").querySelectorAll("a")[1];
        let segundoCaminho = document.querySelector("#breadcrumb_path").querySelectorAll("a")[2];
        primeiroCaminho.innerHTML += `${infoModelo.nome_fabricante} ${infoModelo.nome_modelo}`;
        segundoCaminho.innerHTML += `${infoDispositivo[0].dispositivo_uuid}`;

    }

    async function carregarDispositivos(data, tickets) {
        const listaDispositivos = document.querySelector("#lista_dispositivos");
        const kpiAlertas = document.querySelector("#info_alertas_ativos");
        const kpiStatus = document.querySelector("#info_status_dispositivo");
        const kpiUltimaAtt = document.querySelector("#info_ultima_atualizacao");


        card = "";
        if (data == null) {
            try {
                const resposta = await fetch(`/modelos/listar/${idModelo}/dispositivos`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!resposta.ok) throw new Error('Falha ao carregar dispositivos do modelo.');
                dispositivoData = await resposta.json();

                if (dispositivoData.length === 0) {
                    cardContainer.innerHTML = '<p>Nenhum dispositivo encontrado.</p>';
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

                            if (ticket.tipo_alerta == "Offline") {
                                dispositivoData[i].status = "Offline";
                            }

                            tickets.splice(j, 1);
                        }
                    };

                    if (dispositivoData[i].dispositivo_id == idDispositivo) {
                        const dataAtualizacao = new Date(dispositivoData[i].ultima_atualizacao);
                        const dataFormatada = dataAtualizacao.toLocaleString().replace(",", " ");
                        

                        kpiAlertas.innerHTML += `<span class="valor-info alertas-ativos">${dispositivoData[i].alertas_ativos}</span>`;
                        kpiUltimaAtt.innerHTML += `<span class="valor-info" id="ultima_atualizacao_dispositivo">${dataFormatada}</span`;

                        if (dispositivoData[i].status == "Offline") {
                            kpiStatus.innerHTML += `<span class="valor-info status-off">${dispositivoData[i].status}</span>`;
                        }
                        else {
                            kpiStatus.innerHTML += `<span class="valor-info status-on"">${dispositivoData[i].status}</span>`;
                        }

                        
                    }
                }

                data = dispositivoData;
            } catch (erro) {
                console.error(erro);
                cardContainer.innerHTML = `<p style="color: red;">${erro.message}</p>`;
                return;
            }

        }

        for (let i = 0; i < data.length; i++) {

            if (data[i].dispositivo_id == idDispositivo) {
                continue;
            }

            const dataFormatada = new Date(data[i].ultima_atualizacao);

            card += `<div class="dispositivo-card" id="dispositivo_card_${data[i].dispositivo_id}">`;
            card += `<div class="card-container" id="card_container">`;
            card += `<div class="card-cima">`;
            card += `<div class="titulo-card">`;
            card += `<h3 id="dispositivo_card_id">Dispositivo ${data[i].dispositivo_id}</h3> `;

            if (data[i].status == "Offline") {
                card += `<span class="status-dispositivo offline" id="dispositivo_card_status">${data[i].status}</span>`;
            }
            else {
                card += `<span class="status-dispositivo online" id="dispositivo_card_status">${data[i].status}</span>`;
            }

            card += `</div>`;
            card += `<h4 id="dispositivo_card_uuid">${data[i].dispositivo_uuid}</h4>`;
            card += `</div>`;
            card += `<div class="card-baixo">`;
            card += `<h4>Alertas ativos: <span id="dispositivo_card_alertas_ativos">${data[i].alertas_ativos}</span></h4>`;
            card += `<h5 id="dispositivo_card_ultima_att">${dataFormatada.toLocaleString().replace(",", " ")}</h5>`;
            card += `</div>`;
            card += `</div>`;
            card += `</div>`;     
        }

        listaDispositivos.innerHTML = card;


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
                dispositivo_uuid = dispositivo_uuid.substring(0, 15)
                let tipo_alerta = description[2].split(":")[1].trim();

                let alerta = {
                    "dispositivo_uuid": dispositivo_uuid.substring(0, 15),
                    "tipo_alerta": tipo_alerta
                }

                alertas.push(alerta);
            });
            

            return alertas;
        } catch (erro) {
            console.error(erro);

            return [];
        }
    }

    async function carregarAlertasAtivos(data) {

        const tbodyTabelaAlertas = listaAlertasContainer.querySelector("tbody");

        tbodyFinal = "";
        if (data == null || data.length == 0) {
            tbodyTabelaAlertas.parentElement.innerHTML = '<p>Nenhum alerta ativo ainda.</p>';
            return;
        }

        for (let i = 0; i < data.length; i++) {
            if (data[i].dispositivo_id = idDispositivo) {
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
            } else if (data[i].tipo_alerta == "DISCO") {
                dadosTiposAlertas.valores[3] += 1;
            } else {
                dadosTiposAlertas.valores[4] += 1;
            }

            tbodyFinal += `<td>${data[i].dispositivo_uuid}</td>`;
            tbodyFinal += `<td>${data[i].tipo_alerta}</td>`;
            tbodyFinal += `<td>${data[i].severidade}</td>`;
            tbodyFinal += `<td class="acoes"><button class="btn-acao btn-editar">Ver Situação</button></td>`;
            tbodyFinal += "</tr>";
            }
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

    async function configurarEventListeners() {
        const resposta = await fetch(`/modelos/listar/${idModelo}/dispositivos`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!resposta.ok) throw new Error('Falha ao carregar dispositivos do modelo.');
        dispositivoData = await resposta.json();

        for (let i = 0; i < dispositivoData.length; i++) {
            if (dispositivoData[i].dispositivo_id == idDispositivo) {
                continue
            }

            const cardDispositivo = document.querySelector(`#dispositivo_card_${dispositivoData[i].dispositivo_id}`);

            cardDispositivo.addEventListener('click', () => {
                const id_dispositivo = dispositivoData[i].dispositivo_id;
                sessionStorage.setItem("idDispositivo", id_dispositivo);

                window.location = "dashboard_dispositivo_eng.html";
            });
        }

    }


    iniciarDashboard();
});