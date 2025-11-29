var database = require("../database/config");

function listarAlertasPorModelo(modeloId) {
    var instrucaoSql = `
        SELECT 
            d.dispositivo_id,
            SUBSTRING(d.dispositivo_uuid, 1, 15) as dispositivo_uuid,
            a.tipo_alerta,
            CASE 
                WHEN a.severidade = 'CRITICO' THEN 'CRÍTICO'
                WHEN a.severidade = 'ATENCAO' THEN 'ATENÇÃO'
                ELSE UPPER(a.severidade)
            END AS severidade
        FROM Dispositivos d
        JOIN Alertas a ON a.dispositivo_id = d.dispositivo_id
        WHERE d.modelo_id = ? AND a.status_alerta != 'Resolvido'
        ORDER BY a.severidade;
    `;
    return database.executar(instrucaoSql, [modeloId]);
}

function listarAlertasDispositivosPorModelo(modeloId) {
    var instrucaoSql = `
        SELECT 
            SUBSTRING(d.dispositivo_uuid, 1, 15) AS dispositivo_uuid,
            COALESCE(SUM(a.status_alerta != 'Resolvido'), 0) AS alertas_ativos,
            COALESCE(SUM(a.severidade = 'CRITICO' AND a.status_alerta != 'Resolvido'), 0) AS alertas_criticos
        FROM Dispositivos d
        LEFT JOIN Alertas a 
            ON a.dispositivo_id = d.dispositivo_id
        WHERE 
            d.modelo_id = ?
        GROUP BY 
            d.dispositivo_uuid
        ORDER BY alertas_ativos DESC, alertas_criticos DESC;  
    `;
    return database.executar(instrucaoSql, [modeloId]);
}

function calcularAlertasPorComponente(modeloId) {
    var instrucaoSql = `
        SELECT 
            SUBSTRING(d.dispositivo_uuid, 1, 15) AS dispositivo_uuid,
            COALESCE(SUM(a.status_alerta != 'Resolvido'), 0) AS alertas_ativos,
            COALESCE(SUM(a.severidade = 'CRITICO' AND a.status_alerta != 'Resolvido'), 0) AS alertas_criticos
        FROM Dispositivos d
        LEFT JOIN Alertas a 
            ON a.dispositivo_id = d.dispositivo_id
        WHERE 
            d.modelo_id = ?
        GROUP BY 
            d.dispositivo_uuid
        ORDER BY alertas_ativos DESC, alertas_criticos DESC;  
    `;
    return database.executar(instrucaoSql, [modeloId]);
}

module.exports = {
    listarAlertasPorModelo,
    listarAlertasDispositivosPorModelo
};