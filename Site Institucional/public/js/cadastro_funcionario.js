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

    // VERIFICA SE O USUARIO TEM PERMISSAO PARA CADASTRAR FUNCIONARIOS EM "idClinica"
    function verificarPermissao() {
        const idClinica = sessionStorage.getItem("idClinica");

      
        if (!idClinica) {   //Verifica se é o admin que está logado
            containerDireito.innerHTML = `
                <div class="aviso-permissao">
                    <h2>Acesso Negado</h2>
                    <p>Você está logado como Administrador do Sistema. Apenas usuários vinculados a uma clínica podem cadastrar novos funcionários.</p>
                    <a href="solicitacoes.html" class="btn-voltar">← Voltar para a tela de aprovações</a>
                </div>
            `;
            return false; // Indica que não tem permissão
        }
        return true; // Indica que tem permissão
    }

    // 2.FEEDBACK
    function mostrarFeedback(mensagem, tipo = 'error') {
        clearTimeout(feedbackTimeout);
        divFeedback.textContent = mensagem;
        divFeedback.className = '';
        divFeedback.classList.add(tipo, 'show');
        feedbackTimeout = setTimeout(() => {
            divFeedback.classList.remove('show');
        }, 4000);
    }

    // 3.VALIDAÇÃO DO FORM
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

    // 4.CADASTRO DE FUNCIONARIO
    async function cadastrarUsuario(event) {
        event.preventDefault();

        if (!validarFormulario()) {
            mostrarFeedback("Por favor, corrija os erros no formulário.", "error");
            return;
        }

        btnCadastrar.disabled = true;
        btnCadastrar.textContent = 'Aguarde...';

        try {
            const idClinica = sessionStorage.getItem("idClinica");

            if (!idClinica) {
                throw new Error("ID da clínica não encontrado. Faça o login novamente.");
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
                headers: { "Content-Type": "application/json" },
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

    // 5. INICIALIZAÇÃO DA PÁGINA
    if (verificarPermissao()) {
        form.addEventListener('submit', cadastrarUsuario);
    }
});