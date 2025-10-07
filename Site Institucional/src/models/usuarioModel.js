var database = require("../database/config");

//Cria um novo usuário no banco de dados.
function criar(nomeCompleto, email, senhaHash, cargoId, clinicaId) {
    var instrucaoSql = `
        INSERT INTO Usuarios (nome_completo, email, senha_hash, cargo_id, clinica_id) 
        VALUES (?, ?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [nomeCompleto, email, senhaHash, cargoId, clinicaId]);
}

/*Busca um usuário pelo endereço de e-mail.
Verifica se o usuário existe e se sua senha coincide com o BD, no processo de login*/
function buscarPorEmail(email) {
    var instrucaoSql = `
        SELECT 
            usuario_id,
            nome_completo,
            email,
            senha_hash,
            cargo_id,
            clinica_id 
        FROM Usuarios WHERE email = ?;
    `;
    return database.executar(instrucaoSql, [email]);
}

/*Lista todos os usuários de uma determinada clínica.
 Útil para a tela de gestão de usuários do administrador da clínica.*/
function listarPorClinica(idClinica) {
    var instrucaoSql = `
        SELECT 
            u.usuario_id,
            u.nome_completo,
            u.email,
            c.nome_cargo 
        FROM Usuarios u
        JOIN Cargos c ON u.cargo_id = c.cargo_id
        WHERE u.clinica_id = ?;
    `;
    return database.executar(instrucaoSql, [idClinica]);
}

module.exports = {
    criar,
    buscarPorEmail,
    listarPorClinica
};