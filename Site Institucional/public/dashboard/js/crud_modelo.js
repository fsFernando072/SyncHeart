document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELEÇÃO DE ELEMENTOS GLOBAIS ---
    const formPrincipal = document.getElementById('form_cadastro');
    const listaModelosContainer = document.getElementById('lista_modelos_container');
    const selectFabricante = document.getElementById('select_fabricante');
    const divFeedback = document.getElementById('div_feedback');
    const formSubmitButton = formPrincipal.querySelector('.btn-submit');
    const regrasCriadasContainer = document.getElementById('regras_criadas_container');
    const btnAdicionarRegra = document.getElementById('btn_adicionar_regra');
    let feedbackTimeout;

    // Variáveis para controlar o estado do formulário
    let modoEdicao = false;
    let idModeloEmEdicao = null;
    let parametrosCriados = [];

    function adicionarRegraPadrao() {
        const metrica = document.getElementById('param_metrica').value;
        const condicao = document.getElementById('param_condicao').value;
        const valor = document.getElementById('param_valor').value;
        const duracao = document.getElementById('param_duracao').value;



        let novaRegra = {
            id: Date.now() + 1,
            metrica: "CPU",
            condicao: "MAIOR_QUE",
            limiar_valor: 18,
            duracao_minutos: 3,
            criticidade: 'ATENCAO'
        };

        parametrosCriados.push(novaRegra);

        novaRegra = {
            id: Date.now() + 2,
            metrica: "RAM",
            condicao: "MAIOR_QUE",
            limiar_valor: 70,
            duracao_minutos: 3,
            criticidade: 'ATENCAO'
        };

        parametrosCriados.push(novaRegra);


        novaRegra = {
            id: Date.now() + 3,
            metrica: "CPU",
            condicao: "MAIOR_QUE",
            limiar_valor: 20,
            duracao_minutos: 3,
            criticidade: 'CRITICO'
        };

        parametrosCriados.push(novaRegra);

        novaRegra = {
            id: Date.now() + 4,
            metrica: "RAM",
            condicao: "MAIOR_QUE",
            limiar_valor: 80,
            duracao_minutos: 3,
            criticidade: 'CRITICO'
        };

        parametrosCriados.push(novaRegra);

        renderizarRegras();
        console.log("Parametros padrão" + parametrosCriados)
    }
    adicionarRegraPadrao()



    // --- 2. FUNÇÃO DE FEEDBACK ---
    function mostrarFeedback(mensagem, tipo = 'error') {
        clearTimeout(feedbackTimeout);
        divFeedback.textContent = mensagem;
        divFeedback.className = '';
        divFeedback.classList.add(tipo, 'show');
        feedbackTimeout = setTimeout(() => {
            divFeedback.classList.remove('show');
        }, 5000);
    }

    // --- 3. LÓGICA DE INICIALIZAÇÃO E PERMISSÃO ---
    function iniciarPagina() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        const CARGO_ENG_CLINICA = 4;

        if (!dadosUsuarioLogado || dadosUsuarioLogado.usuario.cargoId !== CARGO_ENG_CLINICA) {
            document.body.innerHTML = `<div style="text-align: center; padding: 50px;"><h2>Acesso Negado</h2><p>Apenas um Engenheiro Clínico pode gerenciar os modelos de dispositivos.</p><a href="dashboard.html">← Voltar</a></div>`;
            return;
        }


        document.getElementById('header_user_info').innerHTML = `<div class="user-info"><span class="user-name">${dadosUsuarioLogado.usuario.nome}</span><span class="user-email">${dadosUsuarioLogado.usuario.email}</span></div>`;
        document.getElementById('breadcrumb_path').textContent = dadosUsuarioLogado.clinica.nome;

        carregarFabricantes();
        carregarModelosExistentes();
        configurarEventListeners();
        renderizarRegras();
    }

    // --- 4. CONFIGURAÇÃO DE EVENTOS ---
    function configurarEventListeners() {
        formPrincipal.addEventListener('submit', (event) => {
            event.preventDefault();
            if (modoEdicao) {
                salvarAlteracoes();
            } else {
                salvarNovoModelo();
            }
        });

        btnAdicionarRegra.addEventListener('click', adicionarRegraLocalmente);

        // Listener na tabela para capturar cliques nos botões de ação
        listaModelosContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('btn-editar')) {
                const idModelo = event.target.dataset.id;
                entrarModoEdicao(idModelo);
            }
        });
    }

    // --- 5. FUNÇÕES DO "MODO EDIÇÃO" ---
    async function entrarModoEdicao(idModelo) {
        const token = sessionStorage.getItem('authToken');
        try {
            // Busca os dados completos do modelo e seus parâmetros 
            const [respostaModelo, respostaParams] = await Promise.all([
                fetch(`/modelos/${idModelo}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/modelos/${idModelo}/parametros`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!respostaModelo.ok || !respostaParams.ok) {
                throw new Error("Modelo ou seus parâmetros não foram encontrados.");
            }

            const modelo = await respostaModelo.json();
            const parametros = await respostaParams.json();

            // Preenche o formulário principal com os dados do modelo
            selectFabricante.value = modelo.fabricante_id;
            document.getElementById('input_nome_modelo').value = modelo.nome_modelo;
            document.getElementById('input_vida_util').value = modelo.vida_util_projetada_anos;
            document.getElementById('input_dimensoes').value = modelo.dimensoes;
            document.getElementById('input_frequencia').value = modelo.frequencia_basica;
            document.getElementById('input_garantia').value = modelo.prazo_garantia;
            document.getElementById('input_bateria').value = modelo.tipo_bateria;

            // Preenche a lista de regras com os parâmetros existentes do modelo
            parametrosCriados = parametros.map(p => ({ ...p, id: p.parametro_id }));
            renderizarRegras();

            // Altera a UI para o modo de edição
            formSubmitButton.textContent = "Salvar Alterações";
            modoEdicao = true;
            idModeloEmEdicao = idModelo;
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (erro) {
            mostrarFeedback(`Erro ao carregar dados para edição: ${erro.message}`, 'error');
        }
    }

    function sairModoEdicao() {
        formPrincipal.reset();
        parametrosCriados = [];
        renderizarRegras();
        formSubmitButton.textContent = "Cadastrar Modelo e Regras";
        modoEdicao = false;
        idModeloEmEdicao = null;
    }

    // --- 6. FUNÇÕES DO CONSTRUTOR DE PARAMETROS ---
    function adicionarRegraLocalmente() {
        const metrica = document.getElementById('param_metrica').value;
        const condicao = document.getElementById('param_condicao').value;
        const valor = document.getElementById('param_valor').value;
        const duracao = document.getElementById('param_duracao').value;
        const criticidade = document.getElementById('param_criticidade').value;

        if (!valor || !duracao) {
            mostrarFeedback("Preencha o valor e a duração para adicionar uma regra.", "error");
            return;
        }

        const novaRegra = {
            id: Date.now(),
            metrica: metrica,
            condicao: condicao,
            limiar_valor: valor,
            duracao_minutos: duracao,
            criticidade: criticidade
        };

        parametrosCriados.push(novaRegra);
        renderizarRegras();
    }

    function renderizarRegras() {
        if (parametrosCriados.length === 0) {
            regrasCriadasContainer.innerHTML = '<p class="placeholder-text">Nenhuma regra adicionada.</p>';
            return;
        }
        regrasCriadasContainer.innerHTML = `<ul class="lista-regras">
            ${parametrosCriados.map(regra => `
                <li>
                   <span>SE ${regra.metrica} for ${regra.condicao === 'MAIOR_QUE' ? '>' : '<'} ${regra.limiar_valor}% por ${regra.duracao_minutos} min, emitir alerta: ${regra.criticidade}</span>
                    <button type="button" class="btn-remover-regra" data-id="${regra.id}">X</button>
                </li>
            `).join('')}
        </ul>`;

        document.querySelectorAll('.btn-remover-regra').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const idParaRemover = Number(event.target.dataset.id);
                parametrosCriados = parametrosCriados.filter(r => r.id !== idParaRemover);
                renderizarRegras();
            });
        });
    }

    // --- 7. FUNÇÕES DO BACKEND ---
    async function carregarFabricantes() {
        const token = sessionStorage.getItem('authToken');
        try {
            const resposta = await fetch('/modelos/fabricantes', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!resposta.ok) throw new Error('Falha ao carregar fabricantes.');
            const fabricantes = await resposta.json();
            selectFabricante.innerHTML = '<option value="">Selecione um fabricante...</option>';
            fabricantes.forEach(fab => { selectFabricante.innerHTML += `<option value="${fab.fabricante_id}">${fab.nome_fabricante}</option>`; });
        } catch (erro) {
            console.error(erro);
            selectFabricante.innerHTML = '<option value="">Erro ao carregar</option>';
            mostrarFeedback(erro.message, 'error');
        }
    }

    let modelos;
    async function carregarModelosExistentes() {
        const token = sessionStorage.getItem('authToken');
        listaModelosContainer.innerHTML = '<p>Carregando modelos...</p>';
        try {
            const resposta = await fetch('/modelos/listar', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!resposta.ok) throw new Error('Falha ao carregar modelos.');
            modelos = await resposta.json();
            if (modelos.length === 0) {
                listaModelosContainer.innerHTML = '<p>Nenhum modelo cadastrado ainda.</p>';
                return;
            }
            let tabelaHTML = `<table class="tabela-dados"><thead><tr><th>Fabricante &#709;</th><th>Nome do Modelo &#709;</th><th>Vida Útil (Anos) &#709;</th><th>Ações</th></tr></thead><tbody>
                ${modelos.map(modelo => `<tr><td>${modelo.nome_fabricante}</td><td>${modelo.nome_modelo}</td><td>${modelo.vida_util_projetada_anos}</td><td class="acoes"><button class="btn-acao btn-editar" data-id="${modelo.modelo_id}">Editar</button></td></tr>`).join('')}
            </tbody></table>`;
            listaModelosContainer.innerHTML = tabelaHTML;
            adicionarOrdenacoes();
        } catch (erro) {
            console.error(erro);
            listaModelosContainer.innerHTML = `<p style="color: red;">${erro.message}</p>`;
        }
    }

    async function salvarNovoModelo() {
        const token = sessionStorage.getItem('authToken');
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        const idClinica = dadosUsuarioLogado.clinica.id;
        const dadosModelo = {
            clinica_id: idClinica,
            fabricante_id: document.getElementById('select_fabricante').value,
            nome_modelo: document.getElementById('input_nome_modelo').value,
            vida_util: document.getElementById('input_vida_util').value,
            dimensoes: document.getElementById('input_dimensoes').value,
            frequencia_basica: document.getElementById('input_frequencia').value,
            prazo_garantia: document.getElementById('input_garantia').value,
            tipo_bateria: document.getElementById('input_bateria').value
        };
        const payloadCompleto = { ...dadosModelo, parametros: parametrosCriados };
        if (!payloadCompleto.fabricante_id || !payloadCompleto.nome_modelo || !payloadCompleto.vida_util) {
            mostrarFeedback("Fabricante, nome do modelo e vida útil são obrigatórios.", "error");
            return;
        }
        if (payloadCompleto.parametros.length === 0) {
            mostrarFeedback("Adicione pelo menos uma regra de alerta antes de salvar.", "error");
            return;
        }
        try {
            const resposta = await fetch('/modelos/criar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payloadCompleto)
            });
            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.erro);
            mostrarFeedback("Modelo e parâmetros cadastrados com sucesso!", "success");
            sairModoEdicao();
            carregarModelosExistentes();
        } catch (erro) {
            mostrarFeedback(`Erro ao salvar: ${erro.message}`, "error");
        }
    }

    async function salvarAlteracoes() {
        const token = sessionStorage.getItem('authToken');
        const dadosModelo = {
            nome_modelo: document.getElementById('input_nome_modelo').value,
            vida_util: document.getElementById('input_vida_util').value,
            dimensoes: document.getElementById('input_dimensoes').value,
            frequencia_basica: document.getElementById('input_frequencia').value,
            prazo_garantia: document.getElementById('input_garantia').value,
            tipo_bateria: document.getElementById('input_bateria').value,
            parametros: parametrosCriados
        };
        if (!dadosModelo.nome_modelo || !dadosModelo.vida_util) {
            mostrarFeedback("Nome do modelo e vida útil são obrigatórios.", "error");
            return;
        }
        try {
            // #BE-ALTERACOES ATENÇÃO: A rota PUT /modelos/:idModelo precisará ser atualizada para lidar com parâmetros
            const resposta = await fetch(`/modelos/${idModeloEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosModelo)
            });
            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.erro);
            mostrarFeedback("Modelo atualizado com sucesso!", "success");
            sairModoEdicao();
            carregarModelosExistentes();
        } catch (erro) {
            mostrarFeedback(`Erro ao salvar alterações: ${erro.message}`, "error");
        }
    }

    let ordens = {
        "fabricante": "asc",
        "nome_modelo": "asc",
        "vida_util": "asc"
    };

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
                ${modelos.map(modelo => `<tr><td>${modelo.nome_fabricante}</td><td>${modelo.nome_modelo}</td><td>${modelo.vida_util_projetada_anos}</td><td class="acoes"><button class="btn-acao btn-editar" data-id="${modelo.modelo_id}">Editar</button></td></tr>`).join('')}`;
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

        modelos = data;

        let tabelaHTML = `
                ${modelos.map(modelo => `<tr><td>${modelo.nome_fabricante}</td><td>${modelo.nome_modelo}</td><td>${modelo.vida_util_projetada_anos}</td><td class="acoes"><button class="btn-acao btn-editar" data-id="${modelo.modelo_id}">Editar</button></td></tr>`).join('')}`;
        listaModelosContainer.querySelector("tbody").innerHTML = tabelaHTML;
    }

    function adicionarOrdenacoes() {
        const thModelos = listaModelosContainer.querySelectorAll("th");
        
        thModelos.forEach(th => {
            if (th.textContent.toLowerCase().includes("fabricante")) {
                th.addEventListener("click", () => selectionSortString(modelos, "nome_fabricante"));
            } else if (th.textContent.toLowerCase().includes("nome do modelo")) {
                th.addEventListener("click", () => selectionSortString(modelos, "nome_modelo"));
            } else if (th.textContent.toLowerCase().includes("vida útil")) {
                th.addEventListener("click", () => selectionSortNumerico(modelos, "vida_util_projetada_anos"));
            }
        });
    }

    // --- 8. EXECUÇÃO INICIAL ---
    iniciarPagina();
});