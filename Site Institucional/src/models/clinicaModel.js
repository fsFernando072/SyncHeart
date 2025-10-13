var database = require("../database/config");


//Cria uma nova clínica no banco de dados com status 'Pendente'
function criar(nomeFantasia, cnpj, emailContato, senhaHash) {
    var instrucaoSql = `
        INSERT INTO Clinicas (nome_fantasia, cnpj, email_contato, senha_hash, status) 
        VALUES (?, ?, ?, ?, 'Pendente');
    `;
    return database.executar(instrucaoSql, [nomeFantasia, cnpj, emailContato, senhaHash]);
}

// Lista todas as clínicas cadastradas, ordenando por status e data de criação
function listarTodas() {
    var instrucaoSql = `
        SELECT 
            clinica_id AS id,
            nome_fantasia AS nome,
            cnpj,
            status,
            DATE_FORMAT(criado_em, '%d/%m/%Y %H:%i') as data_criacao
        FROM Clinicas
        ORDER BY
            CASE
                WHEN status = 'Pendente' THEN 1
                WHEN status = 'Ativo' THEN 2
                WHEN status = 'Inativo' THEN 3
                ELSE 4
            END,
            criado_em DESC;
    `;
    return database.executar(instrucaoSql);
}


//Atualiza o status de uma clínica (Pendente -> Ativo ou Inativo).
function atualizarStatus(idClinica, novoStatus) {
    var instrucaoSql = `
        UPDATE Clinicas SET status = ? WHERE clinica_id = ?;
    `;
    return database.executar(instrucaoSql, [novoStatus, idClinica]);
}

// Busca uma clínica específica pelo seu ID.
function buscarPorId(idClinica) {
    var instrucaoSql = `SELECT * FROM Clinicas WHERE clinica_id = ?`;
    return database.executar(instrucaoSql, [idClinica]);
}


module.exports = {
    criar,
    listarTodas,
    atualizarStatus,
    buscarPorId
};