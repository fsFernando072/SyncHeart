var database = require("../database/config")

function cadastrar(nome, email, senha, cnpj) {
    var instrucaoSql = `
        INSERT INTO Fabricante (nome_fabricante, email_fabricante, senha_fabricante, cnpj_fabricante,acesso ) VALUES ('${nome}', '${email}', '${senha}', '${cnpj}',0);
    `;
    return database.executar(instrucaoSql);
}

function cadastrarAprovado(nomeAprovado, emailAprovado, senhaAprovado) {
    var instrucaoSql = `
        UPDATE Fabricante SET acesso = 1 WHERE nome_fabricante = '${nomeAprovado}' AND email_fabricante = '${emailAprovado}' AND senha_fabricante = '${senhaAprovado}'
    `;
    return database.executar(instrucaoSql);
}

function autenticarFabricante(email, senha) {
    var instrucaoSql = `
        SELECT id_fabricante as Id, email_fabricante as Email, nome_fabricante as Nome, acesso
        FROM Fabricante 
        WHERE email_fabricante = '${email}' AND senha_fabricante = '${senha}';
    `;
    return database.executar(instrucaoSql);
}

function autenticarEmpresa(email, senha) {
    var instrucaoSql = `
        SELECT id_UsuarioSyncHeart as Id, nome as Nome, 'empresa' as Tipo
        FROM Usuario_Syncheart 
        WHERE email = '${email}' AND senha = '${senha}';
    `;
    return database.executar(instrucaoSql);
}

function autenticarUsuario(email, senha) {
    var instrucaoSql = `
        SELECT id_usuario as Id, nome_usuario as Nome, email_usuario as Email
        FROM Usuario 
        WHERE email_usuario = '${email}' AND senha_usuario = '${senha}';
    `;
    return database.executar(instrucaoSql);
}

function cadastrarUsuario(nome, cpf, email, senha, fk_fabricante) {
    var instrucaoSql = `
        INSERT INTO Usuario (nome_usuario, cpf_usuario, email_usuario, senha_usuario, fk_fabricante) 
        VALUES ('${nome}', '${cpf}', '${email}', '${senha}', ${fk_fabricante});
    `;
    return database.executar(instrucaoSql);
}

function limpar(idAprovado) {
    var instrucaoSql = `
        DELETE FROM Fabricante WHERE id_fabricante = ${idAprovado};
    `;
    return database.executar(instrucaoSql);
}

function limparUsuario(idAprovado) {
    var instrucaoSql = `
        DELETE FROM Usuario WHERE fk_fabricante = ${idAprovado};
    `;
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar, cadastrarAprovado,
    autenticarFabricante, autenticarEmpresa,
    cadastrarUsuario,limpar,limparUsuario,
    autenticarUsuario
};