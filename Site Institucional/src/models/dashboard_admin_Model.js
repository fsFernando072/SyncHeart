var database = require("../database/config");

function contarClinicas() {
    const sql = `SELECT COUNT(*) AS total FROM Clinicas;`;
    return database.executar(sql);
}

function contarEquipes() {
    const sql = `SELECT COUNT(*) AS total FROM Equipes;`;
    return database.executar(sql);
}

function contarModelos() {
    const sql = `SELECT COUNT(*) AS total FROM Modelos;`;
    return database.executar(sql);
}

module.exports = {
    contarClinicas,
    contarEquipes,
    contarModelos
};