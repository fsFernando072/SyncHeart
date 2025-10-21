// js/provisionar_dispositivo.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELEÇÃO DE ELEMENTOS ---
    const form = document.getElementById('form_provisionamento');
    const selectModelo = document.getElementById('select_modelo');
    const selectEquipe = document.getElementById('select_equipe');
    const resultadoContainer = document.getElementById('resultado_provisionamento');
    const linkDownload = document.getElementById('link_download_script');
    const divFeedback = document.getElementById('div_feedback');
    let feedbackTimeout;

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
        const CARGO_ELETROFISIOLOGISTA = 3;

        if (!dadosUsuarioLogado || dadosUsuarioLogado.usuario.cargoId !== CARGO_ELETROFISIOLOGISTA) {
            document.body.innerHTML = `<div style="text-align: center; padding: 50px;"><h2>Acesso Negado</h2><p>Apenas um Eletrofisiologista pode provisionar novos dispositivos.</p><a href="dashboard.html">← Voltar</a></div>`;
            return;
        }
        
        // Preenche o cabeçalho
        document.getElementById('header_user_info').innerHTML = `<div class="user-info"><span class="user-name">${dadosUsuarioLogado.usuario.nome}</span><span class="user-email">${dadosUsuarioLogado.usuario.email}</span></div>`;
        document.getElementById('breadcrumb_path').textContent = dadosUsuarioLogado.clinica.nome;

        // Carrega os dados reais da API para os dropdowns
        carregarModelos();
        carregarEquipes(dadosUsuarioLogado.clinica.id);

        // Configura o evento do formulário
        configurarEventListeners();
    }

    // --- 4. CONFIGURAÇÃO DE EVENTOS ---
    function configurarEventListeners() {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            provisionarDispositivo();
        });
    }

    // --- 5. FUNÇÕES DE CARREGAMENTO (CONECTADAS AO BACKEND) ---
    async function carregarModelos() {
        const token = sessionStorage.getItem('authToken');
        try {
            const resposta = await fetch(`/modelos/listar`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resposta.ok) throw new Error('Falha ao carregar modelos.');
            
            const modelos = await resposta.json();
            
            selectModelo.innerHTML = '<option value="">Selecione um modelo...</option>';
            modelos.forEach(modelo => {
                selectModelo.innerHTML += `<option value="${modelo.modelo_id}">${modelo.nome_fabricante} - ${modelo.nome_modelo}</option>`;
            });

        } catch (erro) {
            console.error("Erro ao carregar modelos:", erro);
            selectModelo.innerHTML = '<option value="">Erro ao carregar</option>';
            mostrarFeedback(erro.message, 'error');
        }
    }

    async function carregarEquipes(idClinica) {
        const token = sessionStorage.getItem('authToken');
        try {
            const resposta = await fetch(`/equipes/por-clinica/${idClinica}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resposta.ok) throw new Error('Falha ao carregar equipes.');

            const equipes = await resposta.json();

            selectEquipe.innerHTML = '<option value="">Selecione uma equipe...</option>';
            equipes.forEach(equipe => {
                selectEquipe.innerHTML += `<option value="${equipe.equipe_id}">${equipe.nome_equipe}</option>`;
            });

        } catch (erro) {
            console.error("Erro ao carregar equipes:", erro);
            selectEquipe.innerHTML = '<option value="">Erro ao carregar</option>';
            mostrarFeedback(erro.message, 'error');
        }
    }

    // --- 6. FUNÇÃO PRINCIPAL DE PROVISIONAMENTO ---
    async function provisionarDispositivo() {
        const token = sessionStorage.getItem('authToken');
        const dados = {
            idPacienteNaClinica: document.getElementById('input_id_paciente').value,
            modeloId: selectModelo.value,
            equipeId: selectEquipe.value
        };

        if (!dados.idPacienteNaClinica || !dados.modeloId || !dados.equipeId) {
            mostrarFeedback("Todos os campos são obrigatórios!", "error");
            return;
        }

        try {
            const resposta = await fetch('/dispositivos/provisionar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.erro);

            mostrarFeedback("Dispositivo provisionado com sucesso!", "success");
            
            // Simula a geração e o download do script
            // #BE-ALTERACOES Falta adicionar o script python de captura
            const scriptConteudo = `
# Script de Instalação SyncHeart
# 
# UUID do Dispositivo: ${resultado.dispositivoUuid}
# Token de Registro: ${resultado.tokenRegistro}
# 
# (Aqui entraria o resto do código do script Python)
print("Script de provisionamento gerado com sucesso.")
            `;
            const blob = new Blob([scriptConteudo], { type: 'text/plain' });
            linkDownload.href = URL.createObjectURL(blob);
            linkDownload.download = `install_script_${dados.idPacienteNaClinica}.py`;

            resultadoContainer.style.display = 'block';
            form.reset();

        } catch (erro) {
            console.error("Erro ao provisionar:", erro);
            mostrarFeedback(`Erro: ${erro.message}`, "error");
        }
    }

    // --- 7. EXECUÇÃO ---
    iniciarPagina();
});