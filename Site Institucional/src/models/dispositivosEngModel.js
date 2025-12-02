var database = require('../database/config');

function listar(modeloId) {
    var instrucaoSql = `
        SELECT dispositivo_id, dispositivo_uuid FROM Dispositivos
        WHERE modelo_id = ?
    `;
    return database.executar(instrucaoSql, [modeloId]);
}

function listarAtual(dispositivoId) {
    var instrucaoSql = `
        SELECT dispositivo_id id, dispositivo_uuid uuid, id_paciente_na_clinica idp FROM Dispositivos d
        JOIN Pacientes p ON d.paciente_id = p.paciente_id
    `;
    return database.executar(instrucaoSql, [dispositivoId]);
}

module.exports = {
    listar,
    listarAtual
};