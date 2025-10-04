var database = require("../database/config");

function criarRepresentante(organizacaoId, nome_completo, email, senha) {
    // ATENÇÃO!!!!!!!! SENHA SEM CRIPTOGRAFIA IMPLEMENTAR FUTURAMENTE
    var usuario = email.split('@')[0];
    var papel = 'representante';

    var instrucaoSql = `
        INSERT INTO usuarios (organizacao_id, usuario, email, senha_hash, nome_completo, papel) 
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [organizacaoId, usuario, email, senha, nome_completo, papel]);
}

function buscarPorEmail(email) {
    var instrucaoSql = `
        SELECT u.*, o.nome as nome_organizacao, o.status as status_organizacao
        FROM usuarios u
        LEFT JOIN organizacoes o ON u.organizacao_id = o.id
        WHERE u.email = ?;
    `;
    return database.executar(instrucaoSql, [email]);
}

function criarFuncionario(organizacaoId, nome_completo, email, senha, papel) {
    var usuario = email.split('@')[0];

    var instrucaoSql = `
        INSERT INTO usuarios (organizacao_id, usuario, email, senha_hash, nome_completo, papel) 
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [organizacaoId, usuario, email, senha, nome_completo, papel]);
}

// Lista todos os usuários de uma organização específica
function listarPorOrganizacao(organizacaoId) {
    var instrucaoSql = `
        SELECT id, nome_completo, email, papel, ativo 
        FROM usuarios 
        WHERE organizacao_id = ?;
    `;
    return database.executar(instrucaoSql, [organizacaoId]);
}

module.exports = {
    criarRepresentante,
    buscarPorEmail,
    criarFuncionario,
    listarPorOrganizacao
};