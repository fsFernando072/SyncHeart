/**
 * navbar.js - Gerenciamento Dinâmico da Navbar
 * Este arquivo configura a navbar de forma dinâmica baseado no cargo do usuário logado
 */

// IDs dos cargos
const CARGOS = {
    ADMIN_SYNCHEART: 1,
    ADMIN_CLINICA: 2,
    ELETROFISIOLOGISTA: 3,
    ENGENHEIRO_CLINICO: 4,
    VISUALIZADOR: 5
};

/**
 * Configura a navbar dinamicamente com base no cargo do usuário
 */
function configurarNavbarDinamica() {
    try {
        const dadosUsuarioLogado = JSON.parse(sessionStorage.getItem("USUARIO_LOGADO"));
        
        if (!dadosUsuarioLogado || !dadosUsuarioLogado.usuario) {
            console.warn("Usuário não encontrado no sessionStorage");
            return;
        }

        const cargoId = dadosUsuarioLogado.usuario.cargoId;
        
        // Configura o botão de Dashboard (terceiro botão)
        configurarBotaoDashboard(cargoId);
        
        // Configura o botão de Cadastro (quarto botão)
        configurarBotaoCadastro(cargoId);
        
    } catch (error) {
        console.error("Erro ao configurar navbar:", error);
    }
}

/**
 * Configura o terceiro botão da navbar (Dashboard específico do usuário)
 */
function configurarBotaoDashboard(cargoId) {
    const botaoDashboard = document.querySelector('.sidebar-top a[title="Dashboard Detalhado"]');
    
    if (!botaoDashboard) {
        console.warn("Botão de dashboard não encontrado");
        return;
    }

    const iconeDashboard = botaoDashboard.querySelector('.nav-icon');
    const labelDashboard = botaoDashboard.querySelector('.nav-label');

    switch (cargoId) {
        case CARGOS.ENGENHEIRO_CLINICO:
            // Engenheiro Clínico -> dashboard_dispositivo_eng.html
            botaoDashboard.href = 'lista_modelos.html';
            botaoDashboard.title = 'Dashboard Engenharia';
            if (labelDashboard) labelDashboard.textContent = 'Dashboard Eng.';
            break;
            
        case CARGOS.ELETROFISIOLOGISTA:
            // Eletrofisiologista -> dashboard_dispositivo.html
            botaoDashboard.href = 'dashboard_dispositivo.html';
            botaoDashboard.title = 'Dashboard Dispositivo';
            if (labelDashboard) labelDashboard.textContent = 'Dashboard';
            break;
            
        case CARGOS.ADMIN_CLINICA:
        case CARGOS.VISUALIZADOR:
            // Administrador e Visualizador -> dashboard_dispositivo.html (por enquanto)
            botaoDashboard.href = 'dashboard_dispositivo.html';
            botaoDashboard.title = 'Dashboard Dispositivo';
            if (labelDashboard) labelDashboard.textContent = 'Dashboard';
            break;
            
        case CARGOS.ADMIN_SYNCHEART:
            // Admin SyncHeart -> Pendente (pode ocultar ou redirecionar)
            botaoDashboard.style.display = 'none';
            break;
            
        default:
            console.warn(`Cargo não reconhecido: ${cargoId}`);
            botaoDashboard.href = '#';
            botaoDashboard.title = 'Dashboard Pendente';
            if (labelDashboard) labelDashboard.textContent = 'Pendente';
            break;
    }
}

/**
 * Configura o quarto botão da navbar (Cadastro específico do cargo)
 */
function configurarBotaoCadastro(cargoId) {
    const botaoCadastro = document.getElementById('nav_cadastrar');
    const labelCadastro = document.getElementById('nav_cadastrar_label');

    if (!botaoCadastro) {
        console.warn("Botão de cadastro não encontrado");
        return;
    }

    // Por padrão, esconde o botão
    botaoCadastro.style.display = 'none';

    switch (cargoId) {
        case CARGOS.ADMIN_CLINICA:
            // Administrador da Clínica -> crud_funcionario.html
            botaoCadastro.href = 'crud_funcionario.html';
            botaoCadastro.title = 'Gerenciar Funcionários';
            if (labelCadastro) labelCadastro.textContent = 'Funcionários';
            botaoCadastro.style.display = 'flex';
            break;
            
        case CARGOS.ENGENHEIRO_CLINICO:
            // Engenheiro Clínico -> lista_modelos.html
            botaoCadastro.href = 'crud_modelo.html';
            botaoCadastro.title = 'Gerenciar Modelos';
            if (labelCadastro) labelCadastro.textContent = 'Modelos';
            botaoCadastro.style.display = 'flex';
            
            // Substitui o ícone por um ícone de modelos
            const iconeModelos = botaoCadastro.querySelector('.nav-icon svg');
            if (iconeModelos) {
                iconeModelos.innerHTML = `
                    <path d="M10 10.02h5V21h-5zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10H3v9z" />
                `;
            }
            break;
            
        case CARGOS.ELETROFISIOLOGISTA:
            // Eletrofisiologista -> provisionar_dispositivo.html
            botaoCadastro.href = 'provisionar_dispositivo.html';
            botaoCadastro.title = 'Provisionar Marcapasso';
            if (labelCadastro) labelCadastro.textContent = 'Provisionar';
            botaoCadastro.style.display = 'flex';
            break;
            
        case CARGOS.ADMIN_SYNCHEART:
        case CARGOS.VISUALIZADOR:
        default:
            // Outros cargos não têm função de cadastro
            botaoCadastro.style.display = 'none';
            break;
    }
}

/**
 * Destaca o item ativo na navbar baseado na página atual
 */
function destacarItemAtivo() {
    const paginaAtual = window.location.pathname.split('/').pop();
    const itensNav = document.querySelectorAll('.sidebar-top .nav-item');
    
    itensNav.forEach(item => {
        item.classList.remove('active');
        
        const href = item.getAttribute('href');
        if (href && href.includes(paginaAtual)) {
            item.classList.add('active');
        }
    });
}

/**
 * Inicializa a navbar quando o DOM estiver pronto
 */
document.addEventListener('DOMContentLoaded', () => {
    configurarNavbarDinamica();
    destacarItemAtivo();
});
