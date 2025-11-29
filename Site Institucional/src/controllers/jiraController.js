var jiraModel = require("../models/jiraModel");

// --- FUNÇÃO PARA LISTAR OS TICKETS DO JIRA DE UMA CLÍNICA ---
async function listar(req, res) {
	let nomeClinica = req.params.nomeClinica;
	nomeClinica = nomeClinica.replaceAll(" ", "_");

	try {
		const tickets = await jiraModel.buscarTicketsAtivos(nomeClinica)
		res.status(200).json(tickets);
	} catch (error) {
		console.error("Erro ao lista alertas do jira:", error);
		res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
	}
}

// --- FUNÇÃO PARA LISTAR OS TICKETS DO JIRA DE UM MODELO DE UMA CLÍNICA ---
async function listarPorModelo(req, res) {
	let nomeClinica = req.body.nomeClinica;
	let idModelo = req.body.idModelo;
	nomeClinica = nomeClinica.replaceAll(" ", "_");

	try {
		const tickets = await jiraModel.buscarTicketsAtivosModelo(nomeClinica, idModelo)
		res.status(200).json(tickets);
	} catch (error) {
		console.error("Erro ao lista alertas do jira:", error);
		res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
	}
}

module.exports = {
	listar,
	listarPorModelo
};
