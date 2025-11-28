// Arquivo: js/dashboard_modelo.js

document.addEventListener('DOMContentLoaded', () => {
    let modelos;

    let ordens = {
        "nome_fabricante": "asc",
        "nome_modelo": "asc",
        "dispositivosOffline": "desc",
        "alertasAtivos": "asc",
        "alertasCriticos": "asc",
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
        testarJira();
    }

    async function carregarModelosExistentes() {
        const token = sessionStorage.getItem('authToken');
        try {
            const resposta = await fetch('/modelos/listar', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!resposta.ok) throw new Error('Falha ao carregar modelos.');
            modelos = await resposta.json();
            if (modelos.length === 0) {
                listaModelosContainer.innerHTML = '<p>Nenhum modelo cadastrado ainda.</p>';
                return;
            }
            let tabelaHTML = `
                ${modelos.map(modelo => `<tr><td>${modelo.nome_fabricante}</td><td>${modelo.nome_modelo}</td><td>3</td><td>2</td><td>2</td><td class="acoes"><button class="btn-acao btn-editar" data-id="${modelo.modelo_id}">Ver Situação</button></td></tr>`).join('')}`;

            listaModelosContainer.querySelector("tbody").innerHTML = tabelaHTML;
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

        let tabelaHTML = `
                ${modelos.map(modelo => `<tr><td>${modelo.nome_fabricante}</td><td>${modelo.nome_modelo}</td><td>3</td><td>2</td><td>2</td><td class="acoes"><button class="btn-acao btn-editar" data-id="${modelo.modelo_id}">Ver Situação</button></td></tr>`).join('')}`;
        listaModelosContainer.querySelector("tbody").innerHTML = tabelaHTML;
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

        let tabelaHTML = `
                ${modelos.map(modelo => `<tr><td>${modelo.nome_fabricante}</td><td>${modelo.nome_modelo}</td><td>3</td><td>2</td><td>2</td><td class="acoes"><button class="btn-acao btn-editar" data-id="${modelo.modelo_id}">Ver Situação</button></td></tr>`).join('')}`;
        listaModelosContainer.querySelector("tbody").innerHTML = tabelaHTML;
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
                window.location = "dashboard_modelo.html";
            }
        });
    }

    async function testarJira() {
        const token = sessionStorage.getItem('authToken');
        const nomeClinica = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO")).clinica.nome;
        const idModelo = 2;

        try {
            const listaBody = { nomeClinica: nomeClinica, idModelo: idModelo};
            const resposta = await fetch(`/jira/listar/modelo`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(listaBody)
                });
            if (!resposta.ok) throw new Error('Falha ao carregar alertas.');
            alertas = await resposta.json();
            if (alertas.length === 0) {
                console.log('Nenhum alerta cadastrado ainda.');
                return;
            }
            console.log(alertas);

        } catch (erro) {
            console.error(erro);
        }
    }


    // --- EXECUÇÃO ---
    iniciarLista();
}); 