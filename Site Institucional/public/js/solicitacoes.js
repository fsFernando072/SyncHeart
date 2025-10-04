// Aguarda o DOM estar completamente carregado antes de executar o script
//Não retirar -> está dando erro sem ele
document.addEventListener('DOMContentLoaded', () => {

    const nomeUsuarioLogadoEl = document.getElementById('nome_usuario_logado');
    const emailUsuarioLogadoEl = document.getElementById('email_usuario_logado');
    const container = document.getElementById('solicitacoes_container');

    // 1. CARREGA DADOS DO USUÁRIO LOGADO E DAS SOLICITAÇÕES
    function iniciarPagina() {
        const nomeAdmin = sessionStorage.getItem("nomeUsuario"); 
        const emailAdmin = sessionStorage.getItem("emailUsuario");
        
        nomeUsuarioLogadoEl.innerHTML = nomeAdmin || 'Admin';
        emailUsuarioLogadoEl.innerHTML = emailAdmin || 'admin@syncheart.com';

        carregarSolicitacoes();
    }

    // 2. FUNÇÃO PARA BUSCAR AS SOLICITAÇÕES PENDENTES NO BACK-END
    async function carregarSolicitacoes() {
          const endpoint = 'http://localhost:3333/organizacoes/todas';

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

    // 3. FUNÇÃO PARA RENDERIZAR OS CARDS NA TELA
   function renderizarSolicitacoes(solicitacoes) {
    console.log("Renderizando as seguintes solicitações:", solicitacoes);
    container.innerHTML = ''; 

    if (solicitacoes.length === 0) {
        // Faltando colocar código de nenhuma solicitação
        return;
    }

    solicitacoes.forEach(org => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `org-${org.id}`;

        let botoesHtml = '';
        let statusHtml = '';

        // Lógica para definir os botões e o selo de status
        switch (org.status) {
            case 'pendente':
                statusHtml = '<span class="status status-pendente">Pendente</span>';
                botoesHtml = `
                    <button class="btn-aceitar" data-id="${org.id}">Aprovar</button>
                    <button class="btn-recusar" data-id="${org.id}">Recusar</button>
                `;
                break;
            case 'aprovada':
                statusHtml = '<span class="status status-aprovada">Aprovada</span>';
                botoesHtml = `
                    <button class="btn-recusar" data-id="${org.id}">Revogar</button>
                `;
                break;
            case 'recusada':
                statusHtml = '<span class="status status-recusada">Recusada</span>';
                botoesHtml = `
                    <button class="btn-aceitar" data-id="${org.id}">Re-aprovar</button>
                `;
                break;
        }

        card.innerHTML = `
            <div class="informacoes">
                <p><b>Nome da Empresa:</b> ${org.nome}</p> 
                <p><b>Email do Representante:</b> ${org.representante_email || 'Não informado'}</p>
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

    // 4. FUNÇÃO PARA ATUALIZAR O STATUS (APROVAR/RECUSAR)
    async function atualizarStatus(idOrganizacao, novoStatus) {
        const endpoint = `http://localhost:3333/organizacoes/atualizar-status`;

        try {
            const resposta = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    idOrganizacao: idOrganizacao, 
                    novoStatus: novoStatus 
                })
            });

            if (!resposta.ok) {
                throw new Error('Falha ao atualizar o status.');
            }

            const cardParaRemover = document.getElementById(`org-${idOrganizacao}`);
            if (cardParaRemover) {
                cardParaRemover.remove();
            }
            
            if (container.children.length === 0) {
                renderizarSolicitacoes([]);
            }

        } catch (erro) {
            console.error(`Erro ao ${novoStatus} organização:`, erro);
            alert(`Não foi possível atualizar o status da organização.`);
        }
    }

    // 5. GERENCIADOR DE EVENTOS 
    container.addEventListener('click', (event) => {
        const target = event.target;
        const id = target.dataset.id;

        if (target.classList.contains('btn-aceitar')) {
            if (confirm(`Deseja realmente APROVAR a organização com ID ${id}?`)) {
                atualizarStatus(id, 'aprovada');
            }
        }

        if (target.classList.contains('btn-recusar')) {
            if (confirm(`Deseja realmente RECUSAR a organização com ID ${id}?`)) {
                atualizarStatus(id, 'recusada');
            }
        }
    });

    // Inicia a página
    iniciarPagina();
});