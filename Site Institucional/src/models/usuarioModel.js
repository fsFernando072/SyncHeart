var database = require("../database/config")

function cadastrar(nome, email, senha, cnpj) {
    var instrucaoSql = `
        INSERT INTO Tabela_Aprovacao (nome_aprovacao, email_aprovacao, senha_aprovacao, cnpj_aprovacao ) VALUES ('${nome}', '${email}', '${senha}', '${cnpj}');
    `;
    return database.executar(instrucaoSql);
}

function cadastrarAprovado(nomeAprovado, emailAprovado, senhaAprovado, cnpjAprovado) {
    var instrucaoSql = `
        INSERT INTO Fabricante (nome_fabricante, email_fabricante, senha_fabricante, cnpj_fabricante ) VALUES ('${nomeAprovado}', '${emailAprovado}', '${senhaAprovado}', '${cnpjAprovado}');
    `;
    return database.executar(instrucaoSql);
}

function limpar(idAprovado) {
    var instrucaoSql = `
        DELETE FROM Tabela_Aprovacao WHERE id = ${idAprovado};
    `;
    return database.executar(instrucaoSql);
}

function autenticarFabricante(email, senha) {
    var instrucaoSql = `
        SELECT id_fabricante as Id, nome_fabricante as Nome, 'fabricante' as Tipo
        FROM Fabricante 
        WHERE email_fabricante = '${email}' AND senha_fabricante = '${senha}';
    `;
    return database.executar(instrucaoSql);
}

function autenticarAprovacao(email, senha) {
    var instrucaoSql = `
        SELECT id as Id, nome_aprovacao as Nome, 'aprovacao' as Tipo
        FROM Tabela_Aprovacao
        WHERE email_aprovacao = '${email}' AND senha_aprovacao = '${senha}';
    `;
    return database.executar(instrucaoSql);
}

function autenticarEmpresa(email, senha) {
    var instrucaoSql = `
        SELECT id as Id, nome as Nome, 'empresa' as Tipo
        FROM Usuario_Syncheart 
        WHERE email = '${email}' AND senha = '${senha}';
    `;
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar, cadastrarAprovado, limpar,
    autenticarFabricante, autenticarAprovacao, autenticarEmpresa
};