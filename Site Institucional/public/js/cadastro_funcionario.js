document.addEventListener('DOMContentLoaded', () => {

    // 1. SELEÇÃO DOS ELEMENTOS
    const form = document.getElementById('form_cadastro');
    const nomeInput = document.getElementById('ipt_nome');
    const emailInput = document.getElementById('ipt_email');
    const senhaInput = document.getElementById('ipt_senha');
    const papelSelect = document.getElementById('sel_papel');
    const btnCadastrar = document.getElementById('btn_cadastrar');
    const divFeedback = document.getElementById('div_feedback');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let feedbackTimeout;

    // 2. FUNÇÃO DE FEEDBACK 
    function mostrarFeedback(mensagem, tipo = 'error') {
        clearTimeout(feedbackTimeout);
        divFeedback.textContent = mensagem;
        divFeedback.className = '';
        divFeedback.classList.add(tipo, 'show');
        feedbackTimeout = setTimeout(() => {
            divFeedback.classList.remove('show');
        }, 4000);
    }

    // 3. FUNÇÃO DE VALIDAÇÃO
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
        gerenciarErro(papelSelect, papelSelect.value === "", "Selecione um papel.");
        
        return erros === 0;
    }

    // 4. FUNÇÃO PRINCIPAL DE CADASTRO
    async function cadastrarUsuario(event) {
        event.preventDefault(); // Impede o recarregamento da página

        if (!validarFormulario()) {
            mostrarFeedback("Por favor, corrija os erros no formulário.", "error");
            return;
        }

        btnCadastrar.disabled = true;
        btnCadastrar.textContent = 'Aguarde...';

        //Busca a chave do sessionStorage
        const idOrganizacao = sessionStorage.getItem("idOrganizacao");

        // Montan o objeto com os nomes para o back-end
        const dados = {
            organizacaoId: idOrganizacao,
            nome_completo: nomeInput.value,
            email: emailInput.value,
            senha: senhaInput.value,
            papel: papelSelect.value
        };

        try {
            const resposta = await fetch("/usuarios/adicionar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados),
            });
            
            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.erro || "Falha ao cadastrar.");
            }
            
            mostrarFeedback("Funcionário cadastrado com sucesso!", "success");
            form.reset(); // Limpa o formulário

        } catch (erro) {
            mostrarFeedback(erro.message, "error");
        } finally {
            btnCadastrar.disabled = false;
            btnCadastrar.textContent = 'Cadastrar Funcionário';
        }
    }

    // 5. ADICIONA O EVENTO AO FORMULÁRIO
    form.addEventListener('submit', cadastrarUsuario);

});