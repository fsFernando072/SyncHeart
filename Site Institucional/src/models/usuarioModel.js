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

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT id_fabricante as IdFabricante, nome_fabricante as NomeFabricante from Fabricante where email = '${email}' and senha = '${senha}';
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar, cadastrarAprovado, limpar, autenticar
};