// 1. SELEÇÃO DE ELEMENTOS
const emailInput = document.getElementById('ipt_email');
const senhaInput = document.getElementById('ipt_senha');
const btnLogin = document.getElementById('btn_login');
const divFeedback = document.getElementById('div_feedback');

let feedbackTimeout;

// 2. FUNÇÃO DE FEEDBACK 
function mostrarFeedback(mensagem, tipo = 'error') {
    clearTimeout(feedbackTimeout);
    divFeedback.textContent = mensagem;
    divFeedback.className = '';
    divFeedback.classList.add(tipo, 'show');
    feedbackTimeout = setTimeout(() => {
        divFeedback.classList.remove('show');
    }, 5000);
}

// 3. FUNÇÃO DE VALIDAÇÃO DOS CAMPOS 
function validarCampos() {
    // Limpa erros anteriores
    document.querySelectorAll('.erro').forEach(e => e.remove());
    
    let erros = 0;
    
    // Validação do e-mail
    if (emailInput.value.trim() === '') {
        const spanErro = document.createElement('span');
        spanErro.classList.add('erro');
        spanErro.textContent = "O campo de e-mail é obrigatório.";
        emailInput.insertAdjacentElement('afterend', spanErro);
        erros++;
    }

    // Validação da senha
    if (senhaInput.value.trim() === '') {
        const spanErro = document.createElement('span');
        spanErro.classList.add('erro');
        spanErro.textContent = "O campo de senha é obrigatório.";
        senhaInput.insertAdjacentElement('afterend', spanErro);
        erros++;
    }
    
    return erros === 0;
}

// 4. FUNÇÃO PRINCIPAL DE LOGIN 
function login() {
    if (!validarCampos()) {
        return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = 'Aguarde...';

    const emailVar = emailInput.value;
    const senhaVar = senhaInput.value;

    fetch("/usuarios/autenticar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVar, senha: senhaVar })
    })
    .then(resposta => {
        if (!resposta.ok) {
            return resposta.json().then(erroJson => { throw erroJson; });
        }
        return resposta.json();
    })
    .then(json => {
        if (json.status === "sucesso" || json.status === "sucesso_admin") {
            
            mostrarFeedback("Login realizado com sucesso! Redirecionando...", 'success');

            // Salva o token e os dados do usuário no session storage
            sessionStorage.setItem('authToken', json.token);
            sessionStorage.setItem('USUARIO_LOGADO', JSON.stringify(json.dados));
            
            setTimeout(() => {
                if (json.status === "sucesso_admin") {
                    window.location.href = "solicitacoes.html";
                } else {
                    // Corrigindo o caminho para a pasta dashboard
<<<<<<< HEAD
                    window.location.href = "./dashboard/dashboard.html";
=======
                    window.location.href = "./dashboard/dash_geral.html";
>>>>>>> 3b66fad5c696628a38be516641b9bd4fd74366f0
                }
            }, 1500);
        }
    })
    .catch(erro => {
        console.error("Erro no login:", erro);

        if (erro.status === "aprovacao_pendente") {
            mostrarFeedback(erro.mensagem, 'error');
            setTimeout(() => {
                window.location.href = "aguardando_validacao.html"; 
            }, 2000);
        } else {
            mostrarFeedback(erro.erro || "Usuário ou senha inválidos.", 'error');
        }
    })
    .finally(() => {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    });
}

// 5. CONFIGURAÇÃO DOS EVENTOS
btnLogin.addEventListener('click', login);
senhaInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        login();
    }
});