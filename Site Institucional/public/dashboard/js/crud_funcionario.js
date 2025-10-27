document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELEÇÃO DE ELEMENTOS GLOBAIS ---
    const tabelaCorpo = document.getElementById('tabela_funcionarios_corpo');
    const form = document.getElementById('form_cadastro');
    const moduleCadastro = document.getElementById('module_cadastro');
    const moduleCadastroHeader = moduleCadastro.querySelector('.module-header h2');
    const formSubmitButton = form.querySelector('.btn-submit');
    const btnCancelarEdicao = document.getElementById('btn_cancelar_edicao');
    const btnAbrirModalEquipes = document.getElementById('btn_abrir_modal_equipes');
    const modalOverlay = document.getElementById('modal_equipes_overlay');
    const modalCloseBtn = document.getElementById('modal_close_btn');
    const formNovaEquipe = document.getElementById('form_nova_equipe');
    const listaEquipesUl = document.getElementById('lista_equipes_ul');
    const divFeedback = document.getElementById('div_feedback');
    let feedbackTimeout;
    
    // Variáveis para controlar o modo do formulário
    let modoEdicao = false;
    let idUsuarioEmEdicao = null;

    // --- 2. FUNÇÃO DE FEEDBACK PADRONIZADA ---
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
        const CARGO_ADMIN_CLINICA = 2;
        
        if (!dadosUsuarioLogado || dadosUsuarioLogado.usuario.cargoId !== CARGO_ADMIN_CLINICA) {
            document.body.innerHTML = `<div style="text-align: center; padding: 50px;"><h2>Acesso Negado</h2><p>Apenas um Administrador da Clínica pode gerenciar a equipe.</p><a href="dashboard.html">← Voltar</a></div>`;
            return;
        }
        
        
        document.getElementById('header_user_info').innerHTML = `<div class="user-info"><span class="user-name">${dadosUsuarioLogado.usuario.nome}</span><span class="user-email">${dadosUsuarioLogado.usuario.email}</span></div>`;
        document.getElementById('breadcrumb_path').textContent = dadosUsuarioLogado.clinica.nome;

        carregarFuncionarios(dadosUsuarioLogado.clinica.id);
        carregarEquipes(dadosUsuarioLogado.clinica.id);
        configurarEventListeners(dadosUsuarioLogado);
    }

    // --- 4. CONFIGURAÇÃO DE EVENTOS ---
    function configurarEventListeners(dadosUsuarioLogado) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (modoEdicao) {
                salvarAlteracoes(idUsuarioEmEdicao);
            } else {
                cadastrarNovoFuncionario(dadosUsuarioLogado);
            }
        });

        tabelaCorpo.addEventListener('click', (event) => {
            const target = event.target;
            const idUsuario = target.dataset.id;

            if (target.classList.contains('btn-editar')) {
                entrarModoEdicao(idUsuario);
            } else if (target.classList.contains('btn-inativar')) {
                if (confirm(`Tem certeza que deseja INATIVAR este funcionário? Ele não poderá mais acessar o sistema.`)) {
                    inativarFuncionario(idUsuario);
                }
            }
        });

        btnCancelarEdicao.addEventListener('click', sairModoEdicao);
        btnAbrirModalEquipes.addEventListener('click', abrirModal);
        modalCloseBtn.addEventListener('click', fecharModal);
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) fecharModal();
        });
        formNovaEquipe.addEventListener('submit', adicionarNovaEquipe);
    }

    // --- 5. FUNÇÕES DE MODO DE EDIÇÃO ---
    async function entrarModoEdicao(idUsuario) {
        const token = sessionStorage.getItem('authToken');
        try {
            const resposta = await fetch(`/usuarios/${idUsuario}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!resposta.ok) throw new Error("Funcionário não encontrado.");
            const usuario = await resposta.json();

            document.getElementById('ipt_nome').value = usuario.nome_completo;
            document.getElementById('ipt_email').value = usuario.email;
            document.getElementById('sel_cargo').value = usuario.cargo_id;
            document.getElementById('sel_equipe').value = usuario.equipe_id;
            document.getElementById('ipt_senha').placeholder = "Deixe em branco para não alterar";
            document.getElementById('ipt_senha').value = "";
            document.getElementById('ipt_email').disabled = true;

            moduleCadastro.classList.add('edit-mode');
            btnCancelarEdicao.style.display = 'inline-block';
            moduleCadastroHeader.textContent = `Editando: ${usuario.nome_completo}`;
            formSubmitButton.textContent = "Salvar Alterações";
            modoEdicao = true;
            idUsuarioEmEdicao = idUsuario;

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (erro) {
            mostrarFeedback(`Erro ao carregar dados para edição: ${erro.message}`, 'error');
        }
    }

    function sairModoEdicao() {
        form.reset();
        moduleCadastro.classList.remove('edit-mode');
        btnCancelarEdicao.style.display = 'none';
        moduleCadastroHeader.textContent = "Cadastrar Novo Funcionário";
        formSubmitButton.textContent = "Adicionar Funcionário";
        document.getElementById('ipt_senha').placeholder = "******";
        document.getElementById('ipt_email').disabled = false;
        modoEdicao = false;
        idUsuarioEmEdicao = null;
    }

    // --- 6. FUNÇÕES DO BACKEND E RENDERIZAÇÃO ---
    async function carregarEquipes(idClinica) {
        const token = sessionStorage.getItem('authToken');
        const selectEquipe = document.getElementById('sel_equipe');
        try {
            const resposta = await fetch(`/equipes/por-clinica/${idClinica}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!resposta.ok) throw new Error("Falha ao buscar equipes.");
            const equipes = await resposta.json();
            selectEquipe.innerHTML = '<option value="">Selecione uma equipe...</option>';
            equipes.forEach(equipe => { selectEquipe.innerHTML += `<option value="${equipe.equipe_id}">${equipe.nome_equipe}</option>`; });
        } catch (erro) {
            console.error("Erro ao carregar equipes:", erro);
            selectEquipe.innerHTML = '<option value="">Não foi possível carregar</option>';
            selectEquipe.disabled = true;
        }
    }

    async function carregarFuncionarios(idClinica) {
        const token = sessionStorage.getItem('authToken');
        tabelaCorpo.innerHTML = `<tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>`;
        try {
            const resposta = await fetch(`/usuarios/por-clinica/${idClinica}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!resposta.ok) throw new Error("Falha ao buscar funcionários.");
            const funcionarios = await resposta.json();
            renderizarTabela(funcionarios);
        } catch (erro) {
            console.error("Erro ao carregar funcionários:", erro);
            tabelaCorpo.innerHTML = `<tr><td colspan="5" style="text-align: center;">${erro.message}</td></tr>`;
        }
    }

    function renderizarTabela(funcionarios) {
        tabelaCorpo.innerHTML = '';
        if (funcionarios.length === 0) {
            tabelaCorpo.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum funcionário cadastrado.</td></tr>`;
            return;
        }
        funcionarios.forEach(func => {
            const isAtivo = func.ativo === 1;
            const linhaClass = isAtivo ? '' : 'class="inativo"';
            const linha = `
                <tr ${linhaClass}>
                    <td>${func.nome_completo}</td>
                    <td>${func.email}</td>
                    <td>${func.nome_cargo}</td>
                    <td>${func.nome_equipe || 'Nenhuma'}</td>
                    <td class="acoes">
                        <button class="btn-acao btn-editar" data-id="${func.usuario_id}" ${!isAtivo ? 'disabled' : ''}>Editar</button>
                        <button class="btn-acao btn-inativar" data-id="${func.usuario_id}" ${!isAtivo ? 'disabled' : ''}>Inativar</button>
                    </td>
                </tr>`;
            tabelaCorpo.innerHTML += linha;
        });
    }

    async function cadastrarNovoFuncionario(dadosUsuarioLogado) {
        const token = sessionStorage.getItem('authToken');
        const idClinica = dadosUsuarioLogado.clinica.id;
        const dados = {
            clinicaId: idClinica,
            nome_completo: document.getElementById('ipt_nome').value,
            email: document.getElementById('ipt_email').value,
            senha: document.getElementById('ipt_senha').value,
            cargoId: document.getElementById('sel_cargo').value,
            equipeId: document.getElementById('sel_equipe').value
        };
        if (!dados.nome_completo || !dados.email || !dados.senha || !dados.cargoId || !dados.equipeId) {
            mostrarFeedback("Todos os campos do formulário são obrigatórios!", "error");
            return;
        }
        try {
            const resposta = await fetch('/usuarios/adicionar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dados)
            });
            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.erro);
            mostrarFeedback("Funcionário cadastrado com sucesso!", "success");
            form.reset();
            carregarFuncionarios(idClinica);
        } catch (erro) {
            mostrarFeedback(`Erro ao cadastrar: ${erro.message}`, "error");
        }
    }

    async function salvarAlteracoes(idUsuario) {
        const token = sessionStorage.getItem('authToken');
        const dados = {
            nome_completo: document.getElementById('ipt_nome').value,
            cargoId: document.getElementById('sel_cargo').value,
            equipeId: document.getElementById('sel_equipe').value
        };
        if (!dados.nome_completo || !dados.cargoId || !dados.equipeId) {
            mostrarFeedback("Nome, cargo e equipe são obrigatórios.", "error");
            return;
        }
        try {
            const resposta = await fetch(`/usuarios/${idUsuario}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dados)
            });
            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.erro);
            mostrarFeedback("Funcionário atualizado com sucesso!", "success");
            sairModoEdicao();
            const idClinica = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO")).clinica.id;
            carregarFuncionarios(idClinica);
        } catch (erro) {
            mostrarFeedback(`Erro ao salvar alterações: ${erro.message}`, "error");
        }
    }

    async function inativarFuncionario(idUsuario) {
        const token = sessionStorage.getItem('authToken');
        try {
            const resposta = await fetch(`/usuarios/${idUsuario}/inativar`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.erro);
            mostrarFeedback("Funcionário inativado com sucesso!", "success");
            const idClinica = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO")).clinica.id;
            carregarFuncionarios(idClinica);
        } catch (erro) {
            mostrarFeedback(`Erro ao inativar funcionário: ${erro.message}`, "error");
        }
    }

    // Funções do Modal de Equipes
    function abrirModal() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        renderizarListaEquipes(dadosUsuarioLogado.clinica.id);
        modalOverlay.style.display = 'flex';
    }
    function fecharModal() { modalOverlay.style.display = 'none'; }
    async function renderizarListaEquipes(idClinica) {
        const token = sessionStorage.getItem('authToken');
        listaEquipesUl.innerHTML = '<li>Carregando...</li>';
        try {
            const resposta = await fetch(`/equipes/por-clinica/${idClinica}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!resposta.ok) throw new Error("Falha ao buscar equipes.");
            const equipes = await resposta.json();
            listaEquipesUl.innerHTML = '';
            equipes.forEach(equipe => { listaEquipesUl.innerHTML += `<li><span>${equipe.nome_equipe}</span> <div><button class="btn-acao">Editar</button></div></li>`; });
        } catch (erro) {
            listaEquipesUl.innerHTML = `<li>${erro.message}</li>`;
        }
    }
    async function adicionarNovaEquipe(event) {
        event.preventDefault();
        const inputNomeEquipe = document.getElementById('input_nome_equipe');
        const nomeNovaEquipe = inputNomeEquipe.value.trim();
        const token = sessionStorage.getItem('authToken');
        if (nomeNovaEquipe) {
            try {
                const resposta = await fetch('/equipes/criar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ nome_equipe: nomeNovaEquipe })
                });
                const resultado = await resposta.json();
                if (!resposta.ok) throw new Error(resultado.erro);
                mostrarFeedback("Equipe criada com sucesso!", "success");
                inputNomeEquipe.value = '';
                const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
                renderizarListaEquipes(dadosUsuarioLogado.clinica.id);
                carregarEquipes(dadosUsuarioLogado.clinica.id);
            } catch (erro) {
                mostrarFeedback(`Erro ao criar equipe: ${erro.message}`, 'error');
            }
        }
    }

    // --- EXECUÇÃO INICIAL ---
    iniciarPagina();
});