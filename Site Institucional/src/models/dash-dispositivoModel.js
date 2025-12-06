var database = require("../database/config");

function buscarDispositivos(usuarioId) {
    var instrucaoSql = `
       SELECT 
        d.dispositivo_id,
        d.dispositivo_uuid,
        p.id_paciente_na_clinica,
        m.nome_modelo,
        e.nome_equipe
        FROM Usuarios u
            JOIN UsuarioEquipe ue ON ue.usuario_id = u.usuario_id
                JOIN EquipesCuidado e ON e.equipe_id = ue.equipe_id
                    JOIN Dispositivos d ON d.equipe_id = e.equipe_id
                        JOIN Pacientes p ON p.paciente_id = d.paciente_id
                            JOIN Modelos m ON m.modelo_id = d.modelo_id
        WHERE u.usuario_id = ?
    `;
    return database.executar(instrucaoSql, [usuarioId]);
}

module.exports = {
    buscarDispositivos
};