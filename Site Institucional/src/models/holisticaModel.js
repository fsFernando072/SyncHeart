var database = require("../database/config");
var jiraModel = require("./jiraModel");
var s3Controller = require("../controllers/s3Controller");

/*
 * Model para Dashboard Holística
 * Agrega dados de diferentes fontes (BD, Jira)
 */

// ============================================
// Funções Auxiliares
// ============================================

/**
 * Extrai UUID do dispositivo da descrição do ticket Jira
 */
function extrairDispositivoUuid(descricao) {
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
    
    const match = String(descricaoTexto).match(/Dispositivo_UUID:\s*([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
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

// ============================================
// KPIs - Indicadores Principais
// ============================================

/*
 * Obter KPIs gerais da clínica
 * Total, Crítico, Atenção, Desconectados
 */
async function obterKPIs(clinicaId, nomeClinica) {
    try {
        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN d.status = 'Ativo/Monitorando' THEN 1 ELSE 0 END) as ativos,
                SUM(CASE WHEN d.status = 'Descomissionado' THEN 1 ELSE 0 END) as descomissionados,
                SUM(CASE WHEN d.status IN ('Pendente', 'Registrado - Aguardando Dados') THEN 1 ELSE 0 END) as desconectados
            FROM Dispositivos d
            JOIN Modelos m ON d.modelo_id = m.modelo_id
            WHERE m.clinica_id = ?
        `;

        const resultTotal = await database.executar(sql, [clinicaId]);
        
        if (!resultTotal || resultTotal.length === 0) {
            return {
                total: 0,
                atencao: 0,
                critico: 0,
                desconectados: 0
            };
        }

        const row = resultTotal[0];

        // Recuperar tickets do Jira para contabilizar severidades
        let critico = 0;
        let atencao = 0;
        if (nomeClinica) {
            try {
                // Normalizar nome da clínica (substituir espaços por underscores)
                const nomeClinicaNormalizado = nomeClinica.replaceAll(" ", "_");
                const tickets = await jiraModel.buscarTicketsAtivos(nomeClinicaNormalizado) || [];
                
                // Agrupar dispositivos únicos por severidade
                const dispositivosCriticos = new Set();
                const dispositivosAtencao = new Set();
                
                tickets.forEach(t => {
                    const prioridade = (t.priority && (t.priority.name || t.priority)) || '';
                    const prioridadeLower = String(prioridade).toLowerCase();
                    
                    // Extrair UUID do dispositivo da descrição
                    const dispositivoUuid = extrairDispositivoUuid(t.description);
                    
                    if (dispositivoUuid) {
                        if (prioridadeLower.includes('highest') || prioridadeLower.includes('critical')) {
                            dispositivosCriticos.add(dispositivoUuid);
                        } else if (prioridadeLower.includes('high')) {
                            dispositivosAtencao.add(dispositivoUuid);
                        }
                    }
                });
                
                // Contar dispositivos únicos
                critico = dispositivosCriticos.size;
                atencao = dispositivosAtencao.size;
                
            } catch (err) {
                console.warn('Erro ao buscar tickets do Jira para KPIs:', err.message || err);
            }
        }

        return {
            total: parseInt(row.total) || 0,
            atencao: parseInt(atencao) || 0,
            critico: parseInt(critico) || 0,
            desconectados: parseInt(row.desconectados) || 0
        };
    } catch (error) {
        console.error("Erro ao obter KPIs:", error);
        return {
            total: 0,
            atencao: 0,
            critico: 0,
            desconectados: 0
        };
    }
}

// ============================================
// Dispositivos por Status
// ============================================

async function obterDispositivosCriticos(clinicaId) {
    try {
        const sql = `
            SELECT 
                d.dispositivo_id,
                d.dispositivo_uuid,
                m.nome_modelo,
                p.id_paciente_na_clinica
            FROM Dispositivos d
            JOIN Modelos m ON d.modelo_id = m.modelo_id
            JOIN Pacientes p ON d.paciente_id = p.paciente_id
            WHERE m.clinica_id = ? AND d.status = 'Ativo/Monitorando'
            LIMIT 10
        `;

        return await database.executar(sql, [clinicaId]) || [];
    } catch (error) {
        console.error("Erro ao obter dispositivos críticos:", error);
        return [];
    }
}

async function obterDispositivosAtencao(clinicaId) {
    try {
        const sql = `
            SELECT 
                d.dispositivo_id,
                d.dispositivo_uuid,
                m.nome_modelo,
                p.id_paciente_na_clinica
            FROM Dispositivos d
            JOIN Modelos m ON d.modelo_id = m.modelo_id
            JOIN Pacientes p ON d.paciente_id = p.paciente_id
            WHERE m.clinica_id = ? AND d.status IN ('Pendente', 'Registrado - Aguardando Dados')
            LIMIT 10
        `;

        return await database.executar(sql, [clinicaId]) || [];
    } catch (error) {
        console.error("Erro ao obter dispositivos em atenção:", error);
        return [];
    }
}

// ============================================
// Fila de Triagem (Jira)
// ============================================

async function obterFilaTriagemJira(nomeClinica) {
    try {
        if (!nomeClinica) {
            console.warn("Nome da clínica não fornecido para fila de triagem");
            return [];
        }

        // Normalizar nome da clínica (substituir espaços por underscores)
        const nomeClinicaNormalizado = nomeClinica.replaceAll(" ", "_");
        
        // Buscar tickets ativos usando o modelo do Jira
        const tickets = await jiraModel.buscarTicketsAtivos(nomeClinicaNormalizado);
        
        if (!tickets || tickets.length === 0) {
            return [];
        }

        return tickets;
    } catch (error) {
        console.error("Erro ao obter fila de triagem do Jira:", error.message || error);
        return [];
    }
}

// ============================================
// Hotspots (Modelo x Bateria x Incidentes)
// ============================================

async function obterHotspots(clinicaId, nomeClinica) {
    try {
        // Query corrigida: removido dispositivo_uuid do SELECT para evitar erro de GROUP BY
        // Incluindo dispositivos Pendentes e Ativo/Monitorando
        const sql = `
            SELECT 
                m.modelo_id,
                m.nome_modelo as model,
                COUNT(DISTINCT d.dispositivo_id) as devices
            FROM Modelos m
            LEFT JOIN Dispositivos d ON m.modelo_id = d.modelo_id 
                AND d.status IN ('Ativo/Monitorando', 'Pendente', 'Registrado - Aguardando Dados')
            WHERE m.clinica_id = ?
            GROUP BY m.modelo_id, m.nome_modelo
            LIMIT 10
        `;

        const resultado = await database.executar(sql, [clinicaId]);
        const listado = (resultado || []);

        // Buscar dados de bateria do S3
        let dadosBateriaS3 = [];
        if (nomeClinica) {
            try {
                dadosBateriaS3 = await s3Controller.buscarDadosBateria(nomeClinica);
                console.log(`✅ Dados de bateria carregados do S3: ${dadosBateriaS3.length} dispositivos`);
            } catch (err) {
                console.warn('⚠️ Não foi possível buscar dados de bateria do S3:', err.message);
            }
        }

        // Criar mapa de bateria por device_id para lookup rápido
        const mapaBateria = {};
        dadosBateriaS3.forEach(item => {
            if (item.device_id) {
                mapaBateria[item.device_id] = item.battery_level;
            }
        });

        // Buscar dispositivos por modelo para calcular média de bateria
        const sqlDispositivos = `
            SELECT 
                m.modelo_id,
                d.dispositivo_uuid
            FROM Modelos m
            JOIN Dispositivos d ON m.modelo_id = d.modelo_id
            WHERE m.clinica_id = ? 
                AND d.status IN ('Ativo/Monitorando', 'Pendente', 'Registrado - Aguardando Dados')
        `;
        const dispositivos = await database.executar(sqlDispositivos, [clinicaId]);

        // Calcular média de bateria por modelo
        const bateriasPorModelo = {};
        (dispositivos || []).forEach(disp => {
            const modeloId = disp.modelo_id;
            const uuid = disp.dispositivo_uuid;
            const bateria = mapaBateria[uuid] || 50; // Default 50% se não encontrado no S3

            if (!bateriasPorModelo[modeloId]) {
                bateriasPorModelo[modeloId] = [];
            }
            bateriasPorModelo[modeloId].push(bateria);
        });

        // Para cada modelo, buscar tickets do Jira e calcular média de bateria
        const hotspots = [];
        for (const row of listado) {
            let alertsCount = 0;
            if (nomeClinica) {
                try {
                    // Normalizar nome da clínica (substituir espaços por underscores)
                    const nomeClinicaNormalizado = nomeClinica.replaceAll(" ", "_");
                    const tickets = await jiraModel.buscarTicketsAtivosModelo(nomeClinicaNormalizado, row.modelo_id) || [];
                    alertsCount = tickets.length;
                } catch (err) {
                    console.warn('Erro ao buscar tickets do Jira por modelo:', err.message || err);
                }
            }

            // Calcular média de bateria do modelo
            const bateriasModelo = bateriasPorModelo[row.modelo_id] || [50];
            const mediaBateria = bateriasModelo.reduce((a, b) => a + b, 0) / bateriasModelo.length;

            hotspots.push({
                modelo_id: row.modelo_id, // Adicionar ID do modelo para filtros
                model: row.model,
                x: Math.round(mediaBateria), // Média de bateria real do S3
                devices: parseInt(row.devices) || 0,
                alerts: alertsCount || 0
            });
        }

        return hotspots;
    } catch (error) {
        console.error("Erro ao obter hotspots:", error);
        return [];
    }
}

// ============================================
// Histórico de Alertas (Últimos N dias)
// ============================================

async function obterHistoricoAlertas(clinicaId, dias = 7, nomeClinica) {
    try {
        // Como os alertas agora vêm do Jira, buscamos tickets criados nos últimos 'dias' dias e agregamos por dia
        const hoje = new Date();
        const dataInicio = new Date(hoje.getTime() - (dias * 24 * 60 * 60 * 1000));

        let tickets = [];
        if (nomeClinica) {
            try {
                // Normalizar nome da clínica (substituir espaços por underscores)
                const nomeClinicaNormalizado = nomeClinica.replaceAll(" ", "_");
                tickets = await jiraModel.buscarHistoricoTickets(nomeClinicaNormalizado, dataInicio) || [];
            } catch (err) {
                console.warn('Erro ao buscar histórico de tickets no Jira:', err.message || err);
            }
        }

        // Mapa de contadores por dia
        const mapa = {};
        if (tickets && tickets.length > 0) {
            tickets.forEach(t => {
                if (t && t.created) {
                    const dia = (new Date(t.created)).toISOString().slice(0, 10);
                    mapa[dia] = (mapa[dia] || 0) + 1;
                }
            });
        }

        // Gerar histórico para cada dia (últimos N dias) no formato esperado pelo gráfico
        const labels_dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const historico = [];
        for (let i = 0; i < dias; i++) {
            const d = new Date(dataInicio.getTime() + (i * 24 * 60 * 60 * 1000));
            const key = d.toISOString().slice(0, 10);
            const dayLabel = labels_dias[d.getDay()];
            const total = mapa[key] || 0;
            
            // Formato esperado pelo gráfico: day, cpu, bateria, ram, disco
            // Os dados do Jira não especificam tipo, então distribuímos o total entre os tipos
            historico.push({
                day: dayLabel,
                cpu: Math.floor(total / 4),
                bateria: Math.floor(total / 4),
                ram: Math.floor(total / 4),
                disco: total - Math.floor(total / 4) * 3
            });
        }
        return historico;
    } catch (error) {
        console.error("Erro ao obter historico de alertas:", error);
        return [];
    }
}

// ============================================
// Saúde da Bateria
// ============================================

async function obterSaudeBateria(clinicaId, nomeClinica) {
    try {
        // Buscar dispositivos ativos com seus UUIDs (incluindo Pendentes)
        const sql = `
            SELECT 
                d.dispositivo_uuid
            FROM Dispositivos d
            JOIN Modelos m ON d.modelo_id = m.modelo_id
            WHERE m.clinica_id = ? 
                AND d.status IN ('Ativo/Monitorando', 'Pendente', 'Registrado - Aguardando Dados')
        `;

        const dispositivos = await database.executar(sql, [clinicaId]);
        
        if (!dispositivos || dispositivos.length === 0) {
            return {
                saudavel: [0],
                atencao: [0],
                critico: [0]
            };
        }

        // Buscar dados de bateria do S3
        let critico = 0;
        let atencao = 0;
        let saudavel = 0;

        if (nomeClinica) {
            try {
                const dadosBateria = await s3Controller.buscarDadosBateria(nomeClinica);
                
                // Criar mapa de níveis de bateria por UUID
                const bateriaMap = {};
                dadosBateria.forEach(item => {
                    bateriaMap[item.device_id] = item.battery_level;
                });

                // Classificar cada dispositivo baseado no nível de bateria
                dispositivos.forEach(d => {
                    const nivelBateria = bateriaMap[d.dispositivo_uuid];
                    
                    if (nivelBateria !== undefined && nivelBateria !== null) {
                        // Classificação:
                        // Crítico: <= 30%
                        // Atenção: 31% - 60%
                        // Saudável: > 60%
                        if (nivelBateria <= 30) {
                            critico++;
                        } else if (nivelBateria <= 60) {
                            atencao++;
                        } else {
                            saudavel++;
                        }
                    } else {
                        // Se não tem dados de bateria, considera como saudável (default)
                        saudavel++;
                    }
                });
            } catch (err) {
                console.warn('Erro ao buscar dados de bateria do S3:', err && err.message);
                // Se falhar, considera todos como saudáveis
                saudavel = dispositivos.length;
            }
        } else {
            // Sem nome de clínica, considera todos como saudáveis
            saudavel = dispositivos.length;
        }

        return {
            saudavel: [saudavel],
            atencao: [atencao],
            critico: [critico]
        };
    } catch (error) {
        console.error("Erro ao obter saúde da bateria:", error);
        return {
            saudavel: [0],
            atencao: [0],
            critico: [0]
        };
    }
}

module.exports = {
    obterKPIs,
    obterDispositivosCriticos,
    obterDispositivosAtencao,
    obterFilaTriagemJira,
    obterHotspots,
    obterHistoricoAlertas,
    obterSaudeBateria
};
