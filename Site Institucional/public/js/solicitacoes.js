// Espera a página carregar completamente antes de executar qualquer script
// Só tirar se souber tratar o erro!!!
document.addEventListener('DOMContentLoaded', () => {

    const nomeUsuarioLogadoEl = document.getElementById('nome_usuario_logado');
    const emailUsuarioLogadoEl = document.getElementById('email_usuario_logado');
    const container = document.getElementById('solicitacoes_container');

    // 1. VERIFICA SE O LOGIN É MESMO DO ADMIN PARA INICIAR
    function iniciarPagina() {
        const nomeAdmin = sessionStorage.getItem("nomeUsuario");
        const emailAdmin = sessionStorage.getItem("emailUsuario");
        
        nomeUsuarioLogadoEl.innerHTML = nomeAdmin;
        emailUsuarioLogadoEl.innerHTML = emailAdmin;

        carregarSolicitacoes();
    }

    // 2. BUSCA DE SOLICITAÇÕES NO BACK-END
    async function carregarSolicitacoes() {
        const endpoint = 'http://localhost:3333/clinicas/listar';

        try {
            const resposta = await fetch(endpoint);
            if (!resposta.ok) {
                throw new Error(`Erro na requisição: ${resposta.statusText}`);
            }
            const solicitacoes = await resposta.json();
            renderizarSolicitacoes(solicitacoes);

        } catch (erro) {
            console.error("Falha ao carregar solicitações:", erro);
            container.innerHTML = `<p class="erro-msg">Não foi possível carregar as solicitações. Tente novamente mais tarde.</p>`;
        }
    }

    // 3. RENDERIZA OS CARDS NA TELA 
    function renderizarSolicitacoes(solicitacoes) {
        console.log("Renderizando as seguintes solicitações:", solicitacoes);
        container.innerHTML = '';

        if (solicitacoes.length === 0) {
            container.innerHTML = `<p class="aviso-msg">Nenhuma solicitação encontrada.</p>`;
            return;
        }

        solicitacoes.forEach(org => {
            const card = document.createElement('div');
            card.className = 'card';
            card.id = `org-${org.id}`;

            let botoesHtml = '';
            let statusHtml = '';

            switch (org.status) {
                case 'Pendente':
                    statusHtml = '<span class="status status-pendente">Pendente</span>';
                    botoesHtml = `
                        <button class="btn-aceitar" data-id="${org.id}">Aprovar</button>
                        <button class="btn-recusar" data-id="${org.id}">Recusar</button>
                    `;
                    break;
                case 'Ativo':
                    statusHtml = '<span class="status status-aprovada">Ativo</span>';
                    botoesHtml = `
                        <button class="btn-recusar" data-id="${org.id}">Inativar</button>
                    `;
                    break;
                case 'Inativo':
                    statusHtml = '<span class="status status-recusada">Inativo</span>';
                    botoesHtml = `
                        <button class="btn-aceitar" data-id="${org.id}">Reativar</button>
                    `;
                    break;
            }

            card.innerHTML = `
                <div class="informacoes">
                    <p><b>Nome da Empresa:</b> ${org.nome}</p> 
                    </div>
                <div class="aceitar">
                    <p><b>CNPJ:</b> ${org.cnpj}</p>
                    <div class="status-container">
                        ${statusHtml}
                    </div>
                    <div class="botoes">
                        ${botoesHtml}
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    // 4. ATUALIZA O STATUS DA CLÍNICA NO BD
    async function atualizarStatus(idClinica, novoStatus) {
        const endpoint = `http://localhost:3333/clinicas/atualizarStatus/${idClinica}`;

        try {
            const resposta = await fetch(endpoint, {
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: novoStatus 
                })
            });

            if (!resposta.ok) {
                throw new Error('Falha ao atualizar o status.');
            }
            //Chama função para recarregar com atualização
            carregarSolicitacoes();

        } catch (erro) {
            console.error(`Erro ao atualizar status para ${novoStatus}:`, erro);
            alert(`Não foi possível atualizar o status da clínica.`);
        }
    }

    // 5. EVENTOS
    container.addEventListener('click', (event) => {
        const target = event.target;
        const id = target.dataset.id;
        if (!id) return;

        if (target.classList.contains('btn-aceitar')) {
            if (confirm(`Deseja realmente ATIVAR a clínica com ID ${id}?`)) {
                atualizarStatus(id, 'Ativo');
            }
        }

        if (target.classList.contains('btn-recusar')) {
            if (confirm(`Deseja realmente INATIVAR a clínica com ID ${id}?`)) {
                atualizarStatus(id, 'Inativo');
            }
        }
    });

    // Inicia a página
    iniciarPagina();
});