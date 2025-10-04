var database = require("../database/config");

//
function criar(nome, cnpj) {
    var instrucaoSql = `
        INSERT INTO organizacoes (nome, cnpj, status) VALUES (?, ?, 'pendente');
    `;
    return database.executar(instrucaoSql, [nome, cnpj]);
}
//Não está sendo usada
function deletarPorId(idOrganizacao) {
    var instrucaoSql = `
        DELETE FROM organizacoes WHERE id = ?;
    `;
    return database.executar(instrucaoSql, [idOrganizacao]);
}
//Não está sendo usada
async function listarPendentes() {
    var instrucaoSql = `
        SELECT 
            org.id, org.nome, org.cnpj, org.criado_em,
            usr.email AS representante_email
        FROM organizacoes org
        LEFT JOIN usuarios usr ON org.id = usr.organizacao_id AND usr.papel = 'representante'
        WHERE org.status = 'pendente';
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);

   
    console.log("--- DENTRO DO MODEL: Antes de chamar o database.executar ---");
    const resultado = await database.executar(instrucaoSql);
    console.log("--- DENTRO DO MODEL: O que retornou do database.executar ---", resultado);

    return resultado;
}
//Listar todas as organizações para tela de solicitacoes
function listarTodas() {
    var instrucaoSql = `
        SELECT 
            org.id,
            org.nome,
            org.cnpj,
            org.status,
            DATE_FORMAT(org.criado_em, '%d/%m/%Y %H:%i') as data_criacao,
            usr.email AS representante_email
        FROM organizacoes org
        LEFT JOIN usuarios usr ON org.id = usr.organizacao_id AND usr.papel = 'representante'
        ORDER BY
            CASE
                WHEN org.status = 'pendente' THEN 1
                WHEN org.status = 'aprovada' THEN 2
                WHEN org.status = 'recusada' THEN 3
                ELSE 4
            END,
            org.criado_em DESC;
    `;
    return database.executar(instrucaoSql);
}

//Atualiza o status da organizacao no BD, de acordo com o que foi definido na tela solicitacoes
function atualizarStatus(idOrganizacao, novoStatus) {
    var instrucaoSql = `
        UPDATE organizacoes SET status = ? WHERE id = ?;
    `;
    return database.executar(instrucaoSql, [novoStatus, idOrganizacao]);
}

module.exports = {
    criar,
    deletarPorId,
    listarPendentes,
    listarTodas,
    atualizarStatus
};