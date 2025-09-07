var database = require("../database/config");

function aprovar() {
  var instrucaoSql = `select * from Fabricante;`;

  return database.executar(instrucaoSql);
}

module.exports = { aprovar };
