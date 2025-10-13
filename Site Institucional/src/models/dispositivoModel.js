// Arquivo: models/dispositivoModel.js

var database = require("../database/config");

/**
 * Cria um novo paciente anónimo na base de dados.
 * Retorna o ID do paciente recém-criado.
 */
function criarPaciente(idPacienteNaClinica, idClinica) {
    var instrucaoSql = `
        INSERT INTO Pacientes (id_paciente_na_clinica, clinica_id) VALUES (?, ?);
    `;
    return database.executar(instrucaoSql, [idPacienteNaClinica, idClinica]);
}


//Provisiona um novo dispositivo na base de dados.
function provisionar(dispositivoUuid, tokenRegistro, modeloId, equipeId, pacienteId) {
    var instrucaoSql = `
        INSERT INTO Dispositivos (dispositivo_uuid, token_registro, modelo_id, equipe_id, paciente_id, status) 
        VALUES (?, ?, ?, ?, ?, 'Pendente');
    `;
    return database.executar(instrucaoSql, [dispositivoUuid, tokenRegistro, modeloId, equipeId, pacienteId]);
}

module.exports = {
    criarPaciente,
    provisionar
};