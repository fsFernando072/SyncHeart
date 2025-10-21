var database = require("../database/config");


//Cria uma nova equipe de cuidado no banco de dados.
function criar(nomeEquipe, idClinica) {
    var instrucaoSql = `
        INSERT INTO EquipesCuidado (nome_equipe, clinica_id) VALUES (?, ?);
    `;
    return database.executar(instrucaoSql, [nomeEquipe, idClinica]);
}


// Lista todas as equipes de cuidado de uma determinada clínica.
function listarPorClinica(idClinica) {
    var instrucaoSql = `
        SELECT equipe_id, nome_equipe 
        FROM EquipesCuidado 
        WHERE clinica_id = ?;
    `;
    return database.executar(instrucaoSql, [idClinica]);
}

module.exports = {
    criar, 
    listarPorClinica
};