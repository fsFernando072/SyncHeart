// Arquivo: js/dashboard_modelo.js

document.addEventListener('DOMContentLoaded', () => {
    let modelos;

    let ordens = {
        "nome_fabricante": "asc",
        "nome_modelo": "asc",
        "dispositivos_offline": "desc",
        "alertas_ativos": "asc",
        "alertas_criticos": "asc",
    }

    // Selecionando os novos elementos
    const headerUserInfoEl = document.getElementById('header_user_info');
    const listaModelosContainer = document.getElementById('lista_modelos_container');

    // --- FUNÇÃO DE INICIALIZAÇÃO DA PÁGINA ---
    function iniciarLista() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        if (!dadosUsuarioLogado) {
            window.location.href = "../login.html";
            return;
        }

        const nomeUsuario = dadosUsuarioLogado.usuario.nome;
        const emailUsuario = dadosUsuarioLogado.usuario.email;
        headerUserInfoEl.innerHTML = `<div class="user-info"><span class="user-name">${nomeUsuario}</span><span class="user-email">${emailUsuario}</span></div>`;

        carregarModelosExistentes();
        subirScroll();
        configurarEventListeners();
    }

    async function carregarModelosExistentes() {
        const token = sessionStorage.getItem('authToken');
        const nomeClinica = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO")).clinica.nome;
        try {
            const resposta = await fetch('/modelos/listar', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!resposta.ok) throw new Error('Falha ao carregar modelos.');
            modelos = await resposta.json();
            if (modelos.length === 0) {
                listaModelosContainer.innerHTML = '<p>Nenhum modelo cadastrado ainda.</p>';
                return;
            }

            const promisesDeTickets = modelos.map(async modelo => {
                const resultado = await buscarTicketsPorModelo(nomeClinica, modelo.modelo_id, token);
                modelo.alertas_ativos = resultado.alertas_ativos;
                modelo.alertas_criticos = resultado.alertas_criticos;
                modelo.dispositivos_offline = resultado.dispositivos_offline;
            });

            await Promise.all(promisesDeTickets);

            tbodyFinal = "";
            for (let i = 0; i < modelos.length; i++) {
                let cor_offline;
                let cor_ativos;
                let cor_criticos;
                if (modelos[i].dispositivos_offline >= 3) {
                    cor_offline = "alto";
                } else if (modelos[i].dispositivos_offline > 0) {
                    cor_offline = "moderado";
                } else {
                    cor_offline = "baixo";
                }

                if (modelos[i].alertas_ativos >= 3) {
                    cor_ativos = "alto";
                } else if (modelos[i].alertas_ativos > 0) {
                    cor_ativos = "moderado";
                } else {
                    cor_ativos = "baixo";
                }

                if (modelos[i].alertas_criticos >= 3) {
                    cor_criticos = "alto";
                } else if (modelos[i].alertas_criticos > 0) {
                    cor_criticos = "moderado";
                } else {
                    cor_criticos = "baixo";
                }

                tbodyFinal += "<tr>";
                tbodyFinal += `<td>${modelos[i].nome_fabricante}</td>`;
                tbodyFinal += `<td>${modelos[i].nome_modelo}</td>`;
                tbodyFinal += `<td class="${cor_offline}">${modelos[i].dispositivos_offline}</td>`;
                tbodyFinal += `<td class="${cor_ativos}">${modelos[i].alertas_ativos}</td>`;
                tbodyFinal += `<td class="${cor_criticos}">${modelos[i].alertas_criticos}</td>`;
                tbodyFinal += `<td class="acoes">
                                    <button class="btn-acao btn-editar" data-id="${modelos[i].modelo_id}">Ver Situação</button>
                                </td>`;
                tbodyFinal += "</tr>";
            }

            listaModelosContainer.querySelector("tbody").innerHTML = tbodyFinal;
            adicionarOrdenacoes();
        } catch (erro) {
            console.error(erro);
            listaModelosContainer.innerHTML = `<p style="color: red;">${erro.message}</p>`;
        }
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

    function selectionSortNumerico(data, coluna) {
        if (data.length == 0) {
            return;
        }

        let ordem = (ordens[coluna] == "asc") ? "desc" : "asc";
        ordens[coluna] = ordem;

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

        modelos = data;

        tbodyFinal = "";
        for (let i = 0; i < modelos.length; i++) {
            let cor_offline;
            let cor_ativos;
            let cor_criticos;
            if (modelos[i].dispositivos_offline >= 3) {
                cor_offline = "alto";
            } else if (modelos[i].dispositivos_offline > 0) {
                cor_offline = "moderado";
            } else {
                cor_offline = "baixo";
            }

            if (modelos[i].alertas_ativos >= 3) {
                cor_ativos = "alto";
            } else if (modelos[i].alertas_ativos > 0) {
                cor_ativos = "moderado";
            } else {
                cor_ativos = "baixo";
            }

            if (modelos[i].alertas_criticos >= 3) {
                cor_criticos = "alto";
            } else if (modelos[i].alertas_criticos > 0) {
                cor_criticos = "moderado";
            } else {
                cor_criticos = "baixo";
            }

            tbodyFinal += "<tr>";
            tbodyFinal += `<td>${modelos[i].nome_fabricante}</td>`;
            tbodyFinal += `<td>${modelos[i].nome_modelo}</td>`;
            tbodyFinal += `<td class="${cor_offline}">${modelos[i].dispositivos_offline}</td>`;
            tbodyFinal += `<td class="${cor_ativos}">${modelos[i].alertas_ativos}</td>`;
            tbodyFinal += `<td class="${cor_criticos}">${modelos[i].alertas_criticos}</td>`;
            tbodyFinal += `<td class="acoes">
                                    <button class="btn-acao btn-editar" data-id="${modelos[i].modelo_id}">Ver Situação</button>
                                </td>`;
            tbodyFinal += "</tr>";
        }

        listaModelosContainer.querySelector("tbody").innerHTML = tbodyFinal;
    }

    function selectionSortString(data, coluna) {
        if (data.length == 0) {
            return;
        }

        let ordem = (ordens[coluna] == "asc") ? "desc" : "asc";
        ordens[coluna] = ordem;

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

        tbodyFinal = "";
        for (let i = 0; i < modelos.length; i++) {
            let cor_offline;
            let cor_ativos;
            let cor_criticos;
            if (modelos[i].dispositivos_offline >= 3) {
                cor_offline = "alto";
            } else if (modelos[i].dispositivos_offline > 0) {
                cor_offline = "moderado";
            } else {
                cor_offline = "baixo";
            }

            if (modelos[i].alertas_ativos >= 3) {
                cor_ativos = "alto";
            } else if (modelos[i].alertas_ativos > 0) {
                cor_ativos = "moderado";
            } else {
                cor_ativos = "baixo";
            }

            if (modelos[i].alertas_criticos >= 3) {
                cor_criticos = "alto";
            } else if (modelos[i].alertas_criticos > 0) {
                cor_criticos = "moderado";
            } else {
                cor_criticos = "baixo";
            }

            tbodyFinal += "<tr>";
            tbodyFinal += `<td>${modelos[i].nome_fabricante}</td>`;
            tbodyFinal += `<td>${modelos[i].nome_modelo}</td>`;
            tbodyFinal += `<td class="${cor_offline}">${modelos[i].dispositivos_offline}</td>`;
            tbodyFinal += `<td class="${cor_ativos}">${modelos[i].alertas_ativos}</td>`;
            tbodyFinal += `<td class="${cor_criticos}">${modelos[i].alertas_criticos}</td>`;
            tbodyFinal += `<td class="acoes">
                                    <button class="btn-acao btn-editar" data-id="${modelos[i].modelo_id}">Ver Situação</button>
                                </td>`;
            tbodyFinal += "</tr>";
        }

        listaModelosContainer.querySelector("tbody").innerHTML = tbodyFinal;
    }

    function adicionarOrdenacoes() {
        const thModelos = listaModelosContainer.querySelectorAll("th");

        thModelos.forEach(th => {
            if (th.textContent.toLowerCase().includes("fabricante")) {
                th.addEventListener("click", () => selectionSortString(modelos, "nome_fabricante"));
            } else if (th.textContent.toLowerCase().includes("nome do modelo")) {
                th.addEventListener("click", () => selectionSortString(modelos, "nome_modelo"));
            } else if (th.textContent.toLowerCase().includes("dispositivos offline")) {
                th.addEventListener("click", () => selectionSortNumerico(modelos, "dispositivos_offline"));
            } else if (th.textContent.toLowerCase().includes("alertas ativos")) {
                th.addEventListener("click", () => selectionSortNumerico(modelos, "alertas_ativos"));
            } else if (th.textContent.toLowerCase().includes("alertas críticos")) {
                th.addEventListener("click", () => selectionSortNumerico(modelos, "alertas_criticos"));
            }
        });
    }

    function configurarEventListeners() {
        listaModelosContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('btn-editar')) {
                const idModelo = event.target.dataset.id;

                sessionStorage.setItem("idModelo", idModelo);

                window.location = "dashboard_modelo.html";
            }
        });
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

            return { alertas_ativos: 0, alertas_criticos: 0, dispositivos_offline: 0 };
        }
    }


    // --- EXECUÇÃO ---
    iniciarLista();
}); 