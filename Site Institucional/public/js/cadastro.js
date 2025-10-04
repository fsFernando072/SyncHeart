// Seleção dos elementos
const nomeInput = document.getElementById('nome_input');
const nomeRepresentanteInput = document.getElementById('nome_representante_input'); 
const emailInput = document.getElementById('email_input');
const cnpjInput = document.getElementById('cnpj_input');
const senhaInput = document.getElementById('senha_input');
const btnCadastrar = document.getElementById('btn_cadastrar');
const divFeedback = document.getElementById('div_feedback');

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

let feedbackTimeout;

function mostrarFeedback(mensagem, tipo = 'error') {
    clearTimeout(feedbackTimeout);
    divFeedback.textContent = mensagem;
    divFeedback.className = '';
    divFeedback.classList.add(tipo, 'show');
    feedbackTimeout = setTimeout(() => {
        divFeedback.classList.remove('show');
    }, 5000);
}

// Máscara de CNPJ 
cnpjInput.addEventListener("input", () => {
    let valorLimpo = cnpjInput.value.replace(/\D/g, "").substring(0, 14);
    let numerosArray = valorLimpo.split("");
    let numeroFormatado = "";
    if (numerosArray.length > 0) numeroFormatado += `${numerosArray.slice(0, 2).join("")}`;
    if (numerosArray.length > 2) numeroFormatado += `.${numerosArray.slice(2, 5).join("")}`;
    if (numerosArray.length > 5) numeroFormatado += `.${numerosArray.slice(5, 8).join("")}`;
    if (numerosArray.length > 8) numeroFormatado += `/${numerosArray.slice(8, 12).join("")}`;
    if (numerosArray.length > 12) numeroFormatado += `-${numerosArray.slice(12, 14).join("")}`;
    cnpjInput.value = numeroFormatado;
});

// Função de Validação 
function validarFormulario() {
    let erros = 0;
    function gerenciarErro(input, condicao, mensagem) {
        let proxElemento = input.nextElementSibling;
        if (proxElemento && proxElemento.classList.contains('erro')) {
            proxElemento.remove();
        }
        if (condicao) {
            const spanErro = document.createElement('span');
            spanErro.classList.add('erro');
            spanErro.textContent = mensagem;
            input.insertAdjacentElement('afterend', spanErro);
            return 1;
        }
        return 0;
    }
    erros += gerenciarErro(nomeInput, nomeInput.value.trim().length < 2, "O nome da empresa deve ter pelo menos 2 caracteres");
    erros += gerenciarErro(nomeRepresentanteInput, nomeRepresentanteInput.value.trim().length < 2, "O nome do representante deve ter pelo menos 2 caracteres");
    erros += gerenciarErro(emailInput, !emailRegex.test(emailInput.value), "Por favor, insira um e-mail válido");
    erros += gerenciarErro(cnpjInput, cnpjInput.value.trim().length !== 18, "O CNPJ é inválido.");
    erros += gerenciarErro(senhaInput, senhaInput.value.trim().length < 6, "A senha deve ter pelo menos 6 caracteres");
    return erros === 0;
}

// Função de Cadastro
function cadastrar() {
    if (!validarFormulario()) {
        return;
    }

    btnCadastrar.disabled = true;
    btnCadastrar.textContent = 'Aguarde...';

    // Monta o objeto com os nomes corretos
    const dadosParaEnviar = {
        nome_empresa: nomeInput.value,
        nome_representante: nomeRepresentanteInput.value,
        email: emailInput.value,
        senha: senhaInput.value,
        cnpj: cnpjInput.value
    };

    fetch("/usuarios/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosParaEnviar), // Envia o objeto 
    })
    .then(function (resposta) {
        if (resposta.ok) {
            mostrarFeedback("Cadastro realizado com sucesso! Redirecionando...", 'success');
            setTimeout(() => {
                window.location = "login.html";
            }, 2000);
        } else {
            resposta.json().then(texto => {
                mostrarFeedback(texto.erro || 'Erro no cadastro. Verifique os dados.');
            }).catch(() => {
                mostrarFeedback('Houve um erro ao realizar o cadastro!');
            });
        }
    })
    .catch(function (erro) {
        console.log(`#ERRO: ${erro}`);
        mostrarFeedback('Não foi possível conectar ao servidor.');
    })
    .finally(() => {
        btnCadastrar.disabled = false;
        btnCadastrar.textContent = 'Cadastrar';
    });
}

btnCadastrar.addEventListener('click', cadastrar);