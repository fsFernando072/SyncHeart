document.addEventListener('DOMContentLoaded', () => {

    // 1. SELEÇÃO DOS ELEMENTOS
    const form = document.getElementById('form_cadastro');
    const nomeInput = document.getElementById('ipt_nome');
    const emailInput = document.getElementById('ipt_email');
    const senhaInput = document.getElementById('ipt_senha');
    const cargoSelect = document.getElementById('sel_cargo');
    const btnCadastrar = document.getElementById('btn_cadastrar');
    const divFeedback = document.getElementById('div_feedback');
    const containerDireito = document.querySelector('.right');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let feedbackTimeout;

    // --- FUNÇÃO DE VERIFICAÇÃO DE PERMISSÃO ---
    function verificarPermissao() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        const CARGO_ADMIN_CLINICA = 2; // ID do cargo 'Admin da Clínica'

        // Se não há usuário logado ou se o cargo não for o de Admin da Clínica...
        if (!dadosUsuarioLogado || dadosUsuarioLogado.usuario.cargoId !== CARGO_ADMIN_CLINICA) {
            // Mostra a mensagem de acesso negado e esconde o formulário.
            containerDireito.innerHTML = `
                <div class="aviso-permissao">
                    <h2>Acesso Negado</h2>
                    <p>Apenas um Administrador da Clínica pode cadastrar novos funcionários.</p>
                    <a href="dashboard_final.html" class="btn-voltar">← Voltar para o dashboard</a>
                </div>
            `;
            return false; 
        }
        return true; 
    }

    // --- FUNÇÃO DE FEEDBACK ---
    function mostrarFeedback(mensagem, tipo = 'error') {
        clearTimeout(feedbackTimeout);
        divFeedback.textContent = mensagem;
        divFeedback.className = '';
        divFeedback.classList.add(tipo, 'show');
        feedbackTimeout = setTimeout(() => {
            divFeedback.classList.remove('show');
        }, 4000);
    }

    // --- FUNÇÃO DE VALIDAÇÃO DO FORMULÁRIO ---
    function validarFormulario() {
        document.querySelectorAll('.erro').forEach(e => e.remove());
        let erros = 0;
        
        function gerenciarErro(input, condicao, mensagem) {
            if (condicao) {
                const spanErro = document.createElement('span');
                spanErro.className = 'erro';
                spanErro.textContent = mensagem;
                input.insertAdjacentElement('afterend', spanErro);
                erros++;
            }
        }

        gerenciarErro(nomeInput, nomeInput.value.trim().length < 2, "Nome inválido.");
        gerenciarErro(emailInput, !emailRegex.test(emailInput.value), "E-mail inválido.");
        gerenciarErro(senhaInput, senhaInput.value.length < 6, "A senha deve ter no mínimo 6 caracteres.");
        gerenciarErro(cargoSelect, cargoSelect.value === "", "Selecione um cargo.");
        
        return erros === 0;
    }

    // --- FUNÇÃO PRINCIPAL DE CADASTRO DE USUÁRIO ---
    async function cadastrarUsuario(event) {
        event.preventDefault(); 

        if (!validarFormulario()) {
            mostrarFeedback("Por favor, corrija os erros no formulário.", "error");
            return;
        }

        btnCadastrar.disabled = true;
        btnCadastrar.textContent = 'Aguarde...';

        try {
            const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
            const idClinica = dadosUsuarioLogado.clinica.id;
            const token = sessionStorage.getItem('authToken');

            if (!token) {
                throw new Error("Token de autenticação não encontrado. Faça o login novamente.");
            }

            const dados = {
                clinicaId: idClinica,
                nome_completo: nomeInput.value,
                email: emailInput.value,
                senha: senhaInput.value,
                cargoId: cargoSelect.value
            };

            const resposta = await fetch("/usuarios/adicionar", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(dados),
            });
            
            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.erro || "Falha ao cadastrar.");
            }
            
            mostrarFeedback("Funcionário cadastrado com sucesso!", "success");
            form.reset();

        } catch (erro) {
            mostrarFeedback(erro.message, "error");
        } finally {
            btnCadastrar.disabled = false;
            btnCadastrar.textContent = 'Cadastrar Funcionário';
        }
    }

    // --- INICIALIZAÇÃO DA PÁGINA ---
    if (verificarPermissao()) {
        form.addEventListener('submit', cadastrarUsuario);
    }
});