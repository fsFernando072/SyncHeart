var database = require("../database/config");

function criar(nomeCompleto, email, senhaHash, cargoId, clinicaId) {
    var instrucaoSql = `
        INSERT INTO Usuarios (nome_completo, email, senha_hash, cargo_id, clinica_id) 
        VALUES (?, ?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [nomeCompleto, email, senhaHash, cargoId, clinicaId]);
}

function buscarPorEmail(email) {
    var instrucaoSql = `
        SELECT 
            usuario_id, nome_completo, email, senha_hash, cargo_id, clinica_id 
        FROM Usuarios WHERE email = ?;
    `;
    return database.executar(instrucaoSql, [email]);
}

function listarPorClinica(idClinica) {
    var instrucaoSql = `
        SELECT 
            u.usuario_id, u.nome_completo, u.email, u.ativo, 
            c.nome_cargo,
            eq.nome_equipe 
        FROM Usuarios u
        JOIN Cargos c ON u.cargo_id = c.cargo_id
        LEFT JOIN UsuarioEquipe ue ON u.usuario_id = ue.usuario_id
        LEFT JOIN EquipesCuidado eq ON ue.equipe_id = eq.equipe_id
        WHERE u.clinica_id = ?;
    `;
    return database.executar(instrucaoSql, [idClinica]);
}

function vincularEquipe(usuarioId, equipeId) {
    var instrucaoSql = `
        INSERT INTO UsuarioEquipe (usuario_id, equipe_id) VALUES (?, ?);
    `;
    return database.executar(instrucaoSql, [usuarioId, equipeId]);
}

function buscarPorId(usuarioId) {
    var instrucaoSql = `
        SELECT 
            u.usuario_id, u.nome_completo, u.email, u.cargo_id,
            ue.equipe_id
        FROM Usuarios u
        LEFT JOIN UsuarioEquipe ue ON u.usuario_id = ue.usuario_id
        WHERE u.usuario_id = ?;
    `;
    return database.executar(instrucaoSql, [usuarioId]);
}

function atualizar(usuarioId, nomeCompleto, cargoId) {
    var instrucaoSql = `
        UPDATE Usuarios 
        SET nome_completo = ?, cargo_id = ? 
        WHERE usuario_id = ?;
    `;
    return database.executar(instrucaoSql, [nomeCompleto, cargoId, usuarioId]);
}

function atualizarVinculoEquipe(usuarioId, equipeId) {
    var instrucaoSql = `
        INSERT INTO UsuarioEquipe (usuario_id, equipe_id) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE equipe_id = ?;
    `;
    return database.executar(instrucaoSql, [usuarioId, equipeId, equipeId]);
}


function inativar(usuarioId) {
    var instrucaoSql = `
        UPDATE Usuarios SET ativo = 0 WHERE usuario_id = ?;
    `;
    return database.executar(instrucaoSql, [usuarioId]);
}


module.exports = {
    criar,
    buscarPorEmail,
    listarPorClinica,
    vincularEquipe,
    buscarPorId,
    atualizar,
    atualizarVinculoEquipe,
    inativar
};