// 1.SELEÇÃO DE ELEMENTOS
const emailInput = document.getElementById('ipt_email');
const senhaInput = document.getElementById('ipt_senha');
const btnLogin = document.getElementById('btn_login');
const divFeedback = document.getElementById('div_feedback');

let feedbackTimeout;

// 2.FEEDBACK 
function mostrarFeedback(mensagem, tipo = 'error') {
    clearTimeout(feedbackTimeout);
    divFeedback.textContent = mensagem;
    divFeedback.className = '';
    divFeedback.classList.add(tipo, 'show');
    feedbackTimeout = setTimeout(() => {
        divFeedback.classList.remove('show');
    }, 5000);
}

// 3.VALIDAÇÃO DOS CAMPOS 
function validarCampos() {
    document.querySelectorAll('.erro').forEach(e => e.remove());
    let erros = 0;
    if (emailInput.value.trim() === '') {
        const spanErro = document.createElement('span');
        spanErro.classList.add('erro');
        spanErro.textContent = "O campo de e-mail é obrigatório.";
        emailInput.insertAdjacentElement('afterend', spanErro);
        erros++;
    }
    if (senhaInput.value.trim() === '') {
        const spanErro = document.createElement('span');
        spanErro.classList.add('erro');
        spanErro.textContent = "O campo de senha é obrigatório.";
        senhaInput.insertAdjacentElement('afterend', spanErro);
        erros++;
    }
    return erros === 0;
}

// 4.FUNÇÃO PRINCIPAL DE LOGIN 
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
        body: JSON.stringify({
            email: emailVar,
            senha: senhaVar
        })
    })
    .then(resposta => {
        if (!resposta.ok) {
            return resposta.json().then(erroJson => {
                throw erroJson;
            });
        }
        return resposta.json();
    })
    .then(json => {
        //console.log("Resposta de sucesso do back-end:", json);
        mostrarFeedback("Login realizado com sucesso! Redirecionando...", 'success');
        sessionStorage.setItem('USUARIO_LOGADO', JSON.stringify(json.dados));
        
        setTimeout(() => {
            if (json.status === "sucesso_admin") {
                window.location.href = "solicitacoes.html";
            } else {
                window.location.href = "dashboard_final.html";
            }
        }, 1500);
    })
    .catch(erro => {
        // O bloco .catch() agora recebe o JSON de erro do backend.
        console.error("Erro no login:", erro);

        // Verifica se a aprovação já foi realizada
        if (erro.status === "aprovacao_pendente") {
            mostrarFeedback(erro.mensagem, 'warning'); // Mostra a mensagem de "Aguarde aprovação"
            setTimeout(() => {
                // Redireciona para a tela de espera
                window.location.href = "aguardando_validacao.html"; 
            }, 2000);
        } else {
            // Para todos os outros erros mostra essa mensagem de erro.
            mostrarFeedback(erro.erro || "Usuário ou senha inválidos.", 'error');
        }
    })
    .finally(() => {
        //reativa o botão de login
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    });
}

// Adiciona os eventos de clique e tecla
btnLogin.addEventListener('click', login);
senhaInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        login();
    }
});