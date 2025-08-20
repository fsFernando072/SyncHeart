var database = require("../database/config");

function aprovar() {
  var instrucaoSql = `select * from Tabela_Aprovacao;`;

  return database.executar(instrucaoSql);
}

module.exports = { aprovar };
