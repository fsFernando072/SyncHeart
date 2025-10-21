var database = require("../database/config");

function criar(fabricanteId, nomeModelo, vidaUtil, dimensoes, frequencia, garantia, bateria) {
    var instrucaoSql = `
        INSERT INTO Modelos (clinica_id, fabricante_id, nome_modelo, vida_util_projetada_anos, dimensoes, frequencia_basica, prazo_garantia, tipo_bateria) 
        VALUES ( (SELECT clinica_id FROM Fabricantes WHERE fabricante_id = ?), ?, ?, ?, ?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [fabricanteId, fabricanteId, nomeModelo, vidaUtil, dimensoes, frequencia, garantia, bateria]);
}

function criarParametro(modeloId, metrica, condicao, limiar, duracao, criticidade) {
    var instrucaoSql = `
        INSERT INTO ModelosAlertaParametros (modelo_id, metrica, condicao, limiar_valor, duracao_minutos, criticidade)
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [modeloId, metrica, condicao, limiar, duracao, criticidade]);
}

function listar(idClinica) {
    var instrucaoSql = `
        SELECT 
            m.modelo_id,
            m.nome_modelo,
            m.vida_util_projetada_anos,
            f.nome_fabricante 
        FROM Modelos m
        JOIN Fabricantes f ON m.fabricante_id = f.fabricante_id
        WHERE m.clinica_id = ? 
        ORDER BY f.nome_fabricante, m.nome_modelo;
    `;
    return database.executar(instrucaoSql, [idClinica]);
}

function listarFabricantes() {
    var instrucaoSql = `SELECT * FROM Fabricantes ORDER BY nome_fabricante;`;
    return database.executar(instrucaoSql);
}

function listarParametrosPorModelo(modeloId) {
    var instrucaoSql = `
        SELECT * FROM ModelosAlertaParametros WHERE modelo_id = ?;
    `;
    return database.executar(instrucaoSql, [modeloId]);
}



/**
 * Busca um único modelo pelo seu ID.
 * Essencial para preencher o formulário de edição.
 */
function buscarPorId(modeloId) {
    var instrucaoSql = `SELECT * FROM Modelos WHERE modelo_id = ?;`;
    return database.executar(instrucaoSql, [modeloId]);
}


// Atualiza os dados de um modelo de dispositivo.
function atualizar(modeloId, nomeModelo, vidaUtil, dimensoes, frequencia, garantia, bateria) {
    var instrucaoSql = `
        UPDATE Modelos 
        SET nome_modelo = ?, 
            vida_util_projetada_anos = ?,
            dimensoes = ?,
            frequencia_basica = ?,
            prazo_garantia = ?,
            tipo_bateria = ?
        WHERE modelo_id = ?;
    `;
    return database.executar(instrucaoSql, [nomeModelo, vidaUtil, dimensoes, frequencia, garantia, bateria, modeloId]);
}


module.exports = {
    criar,
    criarParametro,
    listar,
    listarFabricantes,
    listarParametrosPorModelo,
    buscarPorId,
    atualizar
};