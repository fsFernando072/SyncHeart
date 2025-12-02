document.addEventListener('DOMContentLoaded', () => {
    let dispositivoData;

    const token = sessionStorage.getItem('authToken');
    const idDispositivo = sessionStorage.getItem('idDispositivo');
    const idModelo = sessionStorage.getItem('idModelo');
    const nomeClinica = JSON.parse(sessionStorage.getItem('USUARIO_LOGADO')).clinica.nome;

    const cardContainer = document.getElementById('card_container');


    async function iniciarDashboard() {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        if (!dadosUsuarioLogado) {
            window.location.href = "../login.html";
            return;
        }

        const nomeUsuario = dadosUsuarioLogado.usuario.nome;
        const emailUsuario = dadosUsuarioLogado.usuario.email;
        const headerUserInfoEl = document.getElementById('header_user_info');
        headerUserInfoEl.innerHTML = `<div class="user-info"><span class="user-name">${nomeUsuario}</span><span class="user-email">${emailUsuario}</span></div>`;

        await carregarDispositivo();
        let alertas = await buscarTicketsPorModelo(nomeClinica, idModelo, token);
        await carregarDispositivos(dispositivoData, alertas);
    }




    async function carregarDispositivo() {
        const resposta = await fetch(`/dispositivosEng/${idDispositivo}`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (!resposta.ok) throw new Error('Falha ao carregar dispositivo.');
        let infoDispositivo = await resposta.json();

        const respostaModelo = await fetch(`/modelos/${idModelo}`, { headers: { 'Authorization': `Bearer ${token}`}});
        let infoModelo = await respostaModelo.json();
        console.log(infoDispositivo);
        

        document.querySelector("#header_title").innerHTML += `${infoDispositivo[0].dispositivo_uuid}`;
        document.querySelector("#id_dispositivo").innerHTML += `${infoDispositivo[0].dispositivo_id}`;
        document.querySelector("#uuid_dispositivo").innerHTML += `${infoDispositivo[0].dispositivo_uuid}`;
        document.querySelector("#id_paciente").innerHTML += `${infoDispositivo[0].idp}`
        let primeiroCaminho = document.querySelector("#breadcrumb_path").querySelectorAll("a")[0];
        let segundoCaminho = document.querySelector("#breadcrumb_path").querySelectorAll("a")[1];
        primeiroCaminho.innerHTML += `${infoModelo.nome_fabricante} ${infoModelo.nome_modelo}`;
        segundoCaminho.innerHTML += `${infoDispositivo[0].dispositivo_uuid}`;
    }

    async function carregarDispositivos(data, tickets) {
        const listaDispositivos = document.querySelector("#lista_dispositivos");


        card = "";
        if (data == null) {
            try {
                const resposta = await fetch(`/modelos/listar/${idModelo}/dispositivos`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!resposta.ok) throw new Error('Falha ao carregar dispositivos do modelo.');
                dispositivoData = await resposta.json();

                if (dispositivoData.length === 0) {
                    cardContainer.innerHTML = '<p>Nenhum dispositivo encontrado.</p>';
                    return;
                }

                for (let i = 0; i < dispositivoData.length; i++) {
                    dispositivoData[i].status = "Online";
                    dispositivoData[i].alertas_ativos = 0;
                    dispositivoData[i].alertas_criticos = 0;

                    for (let j = tickets.length - 1; j >= 0; j--) {
                        let ticket = tickets[j];

                        if (ticket.dispositivo_uuid == dispositivoData[i].dispositivo_uuid) {
                            dispositivoData[i].alertas_ativos += 1;

                            if (ticket.tipo_alerta == "Offline") {
                                dispositivoData[i].status += "Offline";
                            }

                            tickets.splice(j, 1);
                        }
                    };
                }

                data = dispositivoData;
            } catch (erro) {
                console.error(erro);
                cardContainer.innerHTML = `<p style="color: red;">${erro.message}</p>`;
                return;
            }

        }

        for (let i = 0; i < data.length; i++) {
            card += `<div class="dispositivo-card">`;
            card += `<div class="card-container" id="card_container">`;
            card += `<div class="card-cima">`;
            card += `<div class="titulo-card">`;
            card += `<h3 id="dispositivo_card_id">Dispositivo ${data[i].dispositivo_id}</h3> `;

            if (data[i].status == "Offline") {
                card += `<span class="status-dispositivo offline" id="dispositivo_card_status">${data[i].status}</span>`;
            }
            else {
                card += `<span class="status-dispositivo online" id="dispositivo_card_status">${data[i].status}</span>`;
            }

            card += `</div>`;
            card += `<h4 id="dispositivo_card_uuid">${data[i].dispositivo_uuid}</h4>`;
            card += `</div>`;
            card += `<div class="card-baixo">`;
            card += `<h4>Alertas ativos: <span id="dispositivo_card_alertas_ativos">${data[i].alertas_ativos}</span></h4>`;
            card += `<h5 id="dispositivo_card_ultima_att">${data[i].ultima_atualizacao}</h5>`;
            card += `</div>`;
            card += `</div>`;
            card += `</div>`;
        }

        listaDispositivos.innerHTML = card;


    }

    async function buscarTicketsPorModelo(nomeClinica, idModelo, token) {
        try {
            const listaBody = { nomeClinica: nomeClinica, idModelo: idModelo };
            const resposta = await fetch(`/jira/listar/modelo`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(listaBody)
                });

            if (!resposta.ok) throw new Error('Falha ao carregar tickets.');

            let tickets = await resposta.json();

            let alertas = [];

            tickets.forEach(ticket => {
                let description = ticket.description.content[0].content[0].text.trim().split('\n');
                let dispositivo_uuid = description[0].split(":")[1].trim();
                dispositivo_uuid = dispositivo_uuid.substring(0, 15)

                let alerta = {
                    "dispositivo_uuid": dispositivo_uuid.substring(0, 15),
                }

                alertas.push(alerta);
            });

            return alertas;
        } catch (erro) {
            console.error(erro);

            return [];
        }
    }


    iniciarDashboard();
});