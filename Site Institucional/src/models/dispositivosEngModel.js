var database = require('../database/config');

function listar(modeloId) {
    var instrucaoSql = `
        SELECT dispositivo_id, dispositivo_uuid FROM Dispositivos
        WHERE modelo_id = ?
    `;
    return database.executar(instrucaoSql, [modeloId]);
}

function listarAtual(dispositivoid) {
    var instrucaoSql = `
        SELECT 
            dispositivo_id,
            dispositivo_uuid, 
            SUBSTRING(dispositivo_uuid, 1, 15) as dispositivo_uuid_reduzido,
            id_paciente_na_clinica idp 
        FROM Dispositivos d
        JOIN Pacientes p ON d.paciente_id = p.paciente_id
        WHERE d.dispositivo_id = ?
    `;
    return database.executar(instrucaoSql, [dispositivoid]);
}

module.exports = {
    listar,
    listarAtual
};