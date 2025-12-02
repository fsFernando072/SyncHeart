document.addEventListener('DOMContentLoaded', () => {

    const token = sessionStorage.getItem('authToken');
    const uuidDispositivo = sessionStorage.getItem('uuidDispositivo');
    const idModelo = sessionStorage.getItem('idModelo');

    const nomeClinica = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO")).clinica.nome;

    const cardContainer = document.getElementById('card_container');

    async function iniciarDashboard() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        if (!dadosUsuarioLogado) {
            window.location.href = "../login.html";
            return;
        }

        const nomeUsuario = dadosUsuarioLogado.usuario.nome;
        const emailUsuario = dadosUsuarioLogado.usuario.email;
        headerUserInfoEl.innerHTML = `<div class="user-info"><span class="user-name">${nomeUsuario}</span><span class="user-email">${emailUsuario}</span></div>`;

        await carregarDispositivo();
    }




    async function carregarDispositivo() {
        const resposta = await fetch(`/dispositivosEng/${uuidDispositivo}`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (!resposta.ok) throw new Error('Falha ao carregar dispositivo.');
        let infoDispositivo = await resposta.json();

        const respostaModelo = await fetch(`/modelos/${idModelo}`, { headers: { 'Authorization': `Bearer ${token}`}});
        let infoModelo = await respostaModelo.json();

        document.querySelector("#header_title").innerHTML += `${infoDispositivo.dispositivo_uuid}`;
        document.querySelector("#id_dispositivo").innerHTML += `${infoDispositivo.dispositivo_id}`;
        document.querySelector("#uuid_dispositivo").innerHTML += `${infoDispositivo.dispositivo_uuid}`;
        let primeiroCaminho = document.querySelector("#breadcrumb_path").querySelectorAll("a")[0];
        let segundoCaminho = document.querySelector("#breadcrumb_path").querySelectorAll("a")[1];
        primeiroCaminho.innerHTML += `${infoModelo.nome_fabricante} ${infoModelo.nome_modelo}`;
        segundoCaminho.innerHTML += `${infoDispositivo.dispositivo_uuid}`;
    }

    async function carregarDispositivos() {
        const listaDispositivos = document.querySelector("#lista_dispositivos");


    }


    iniciarDashboard();
});