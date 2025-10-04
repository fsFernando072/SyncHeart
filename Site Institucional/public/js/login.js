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
        body: JSON.stringify({
            email: emailVar,
            senha: senhaVar
        })
    })
    .then(resposta => {
        if (!resposta.ok) {
            // Se a resposta for 401, 403, etc., o erro será tratado no .catch
            throw new Error('Credenciais inválidas ou usuário inativo.');
        }
        return resposta.json();
    })
    .then(json => {
        console.log("Resposta do back-end:", json);
        
        // Salva os dados do usuário e organização na sessão
        sessionStorage.setItem("idUsuario", json.dados.usuario.id);
        sessionStorage.setItem("nomeUsuario", json.dados.usuario.nome);
        sessionStorage.setItem("emailUsuario", json.dados.usuario.email);
        sessionStorage.setItem("papelUsuario", json.dados.usuario.papel);
        sessionStorage.setItem("idOrganizacao", json.dados.organizacao.id);
        sessionStorage.setItem("nomeOrganizacao", json.dados.organizacao.nome);
        
        mostrarFeedback("Login realizado com sucesso! Redirecionando...", 'success');

        setTimeout(() => {
            // Decide para onde redirecionar com base na resposta do back-end
            if (json.status === "aprovacao") {
                // Se a organização está pendente, vai para a tela de aguardo
                window.location = "aguardando_validacao.html";
            } else if (json.dados.usuario.papel === 'superadmin' || json.dados.usuario.papel === 'suporte') {
                // Se for um admin da SyncHeart, vai para a tela de aprovações
                window.location = "solicitacoes.html";
            } else {
                // Para outros papéis (médico, técnico, etc.), vai para o dashboard principal
                window.location = "dashboard_final.html"; 
            }
        }, 2000); // Redireciona após 2 segundos
    })
    .catch(erro => {
        console.error("Erro no login:", erro);
        mostrarFeedback("Usuário ou senha inválidos.", 'error');
    })
    .finally(() => {
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