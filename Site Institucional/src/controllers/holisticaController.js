const holisticaModel = require("../models/holisticaModel");
const clinicaModel = require("../models/clinicaModel");
const jiraController = require("./jiraController");

/**
 * Controlador para Dashboard Holística
 * Agrega dados de múltiplas fontes: Banco de Dados, Jira e S3
 */

async function obterDashboardHolistica(req, res) {
    try {
        const usuarioId = req.usuario && (req.usuario.usuarioId || req.usuario.usuarioId === 0 ? req.usuario.usuarioId : null);
        const clinicaId = req.usuario && (req.usuario.clinicaId || req.usuario.clinicaId === 0 ? req.usuario.clinicaId : null);
        let nomeClinica = '';

        if (!usuarioId || !clinicaId) {
            return res.status(400).json({ 
                erro: "Usuário não autenticado corretamente." 
            });
        }
        // Buscar nome da clínica para consultas no Jira (labels)
        try {
            const clinicaRows = await clinicaModel.buscarPorId(clinicaId);
            if (clinicaRows && clinicaRows.length > 0) {
                nomeClinica = clinicaRows[0].nome_fantasia || '';
            }
        } catch (err) {
            console.warn('Não foi possível recuperar nome da clínica:', err && err.message);
        }

        // 1. Obter KPIs do Banco de Dados
        const kpis = await holisticaModel.obterKPIs(clinicaId, nomeClinica);

        // 2. Obter Alertas Críticos e de Atenção do Banco de Dados
        const dispositivosCriticos = await holisticaModel.obterDispositivosCriticos(clinicaId);
        const dispositivosAtencao = await holisticaModel.obterDispositivosAtencao(clinicaId);

        // 3. Obter Fila de Triagem do Jira
        let filaTriagem = [];
        try {
            filaTriagem = await holisticaModel.obterFilaTriagemJira(nomeClinica);
        } catch (err) {
            console.warn("Erro ao buscar fila do Jira, retornando vazio:", err.message);
        }

        // 4. Obter Hotspot (modelo x bateria x incidentes)
        const hotspots = await holisticaModel.obterHotspots(clinicaId, nomeClinica);

        // 5. Obter Histórico de Alertas (últimos 7 dias)
        const historico = await holisticaModel.obterHistoricoAlertas(clinicaId, 7, nomeClinica);

        // 6. Obter Saúde da Bateria
        let saudeBateria = { saudavel: [0], atencao: [0], critico: [0] };
        try {
            saudeBateria = await holisticaModel.obterSaudeBateria(clinicaId, nomeClinica);
        } catch (err) {
            console.warn("Erro ao obter saúde da bateria:", err.message);
        }

        // 7. Montar resposta estruturada
        const dashboard = {
            kpis: {
                total: kpis.total || 0,
                atencao: kpis.atencao || 0,
                critico: kpis.critico || 0,
                desconectados: kpis.desconectados || 0
            },
            filaTriagem: transformarFilaTriagem(filaTriagem),
            hotspot: hotspots || [],
            historico: historico || [],
            saudeBateria: saudeBateria || {
                saudavel: [0],
                atencao: [0],
                critico: [0]
            }
        };

        return res.status(200).json(dashboard);

    } catch (erro) {
        console.error("Erro ao obter dashboard holística:", erro);
        return res.status(500).json({ 
            erro: "Erro ao obter dados da dashboard." 
        });
    }
}

/**
 * Transforma dados do Jira para o formato esperado pela dashboard
 */
function transformarFilaTriagem(ticketsJira) {
    if (!Array.isArray(ticketsJira) || ticketsJira.length === 0) {
        return [];
    }

    return ticketsJira.map((ticket, index) => ({
        id: index + 1,
        idDispositivo: extrairIdDispositivo(ticket.description),
        idModelo: extrairIdModelo(ticket.description),
        tipo: extrairTipo(ticket.priority),
        texto: ticket.summary || "Alerta sem descrição",
        tempo: calcularTempoDecorrido(ticket.created),
        metrica: extrairMetrica(ticket.summary),
        valor: extrairValor(ticket.summary)
    }));
}

/**
 * Extrai ID do dispositivo da descrição do ticket
 */
function extrairIdDispositivo(descricao) {
    if (!descricao) return "Desconhecido";
    
    // Converter para string se for objeto
    let descricaoTexto = descricao;
    if (typeof descricao === 'object') {
        descricaoTexto = JSON.stringify(descricao);
    }
    
    // Tentar extrair do campo 'content' se existir (formato ADF do Jira)
    if (typeof descricao === 'object' && descricao.content) {
        descricaoTexto = extrairTextoDeADF(descricao);
    }
    
    const match = String(descricaoTexto).match(/Dispositivo_UUID:\s*([a-zA-Z0-9-]+)/);
    return match ? match[1] : "Desconhecido";
}

/**
 * Extrai ID do modelo da descrição do ticket
 */
function extrairIdModelo(descricao) {
    if (!descricao) return null;
    
    // Converter para string se for objeto
    let descricaoTexto = descricao;
    if (typeof descricao === 'object') {
        descricaoTexto = JSON.stringify(descricao);
    }
    
    // Tentar extrair do campo 'content' se existir (formato ADF do Jira)
    if (typeof descricao === 'object' && descricao.content) {
        descricaoTexto = extrairTextoDeADF(descricao);
    }
    
    const match = String(descricaoTexto).match(/Modelo_ID:\s*(\d+)/);
    return match ? parseInt(match[1]) : null;
}

/**
 * Extrai texto do formato ADF (Atlassian Document Format) do Jira
 */
function extrairTextoDeADF(adf) {
    if (!adf || !adf.content) return '';
    
    let texto = '';
    function extrair(node) {
        if (node.type === 'text' && node.text) {
            texto += node.text + ' ';
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(extrair);
        }
    }
    
    extrair(adf);
    return texto;
}

/**
 * Converte prioridade do Jira para tipo de alerta
 */
function extrairTipo(priority) {
    if (!priority) return "atencao";
    const nome = priority.name || priority;
    if (nome.toLowerCase().includes("highest") || nome.toLowerCase().includes("critical")) {
        return "critico";
    }
    if (nome.toLowerCase().includes("high")) {
        return "atencao";
    }
    return "atencao";
}

/**
 * Calcula tempo decorrido desde a criação do ticket
 */
function calcularTempoDecorrido(dataTicket) {
    if (!dataTicket) return "Desconhecido";
    
    const agora = new Date();
    const criacao = new Date(dataTicket);
    const diffMs = agora - criacao;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `${diffMin} min`;
    
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `${diffHoras}h`;
    
    const diffDias = Math.floor(diffHoras / 24);
    return `${diffDias}d`;
}

/**
 * Extrai a métrica mencionada no título do ticket
 */
function extrairMetrica(summary) {
    if (!summary) return "Geral";
    if (summary.toLowerCase().includes("cpu")) return "CPU";
    if (summary.toLowerCase().includes("ram") || summary.toLowerCase().includes("memória")) return "RAM";
    if (summary.toLowerCase().includes("bateria") || summary.toLowerCase().includes("battery")) return "Bateria";
    if (summary.toLowerCase().includes("disco") || summary.toLowerCase().includes("disk")) return "Disco";
    return "Geral";
}

/**
 * Extrai valor numérico do resumo do ticket
 */
function extrairValor(summary) {
    if (!summary) return "N/A";
    const match = summary.match(/(\d+\.?\d*%)/);
    return match ? match[1] : "N/A";
}

module.exports = {
    obterDashboardHolistica
};
