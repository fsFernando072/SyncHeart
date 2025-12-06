var jiraModel = require("../models/jiraModel");

// --- FUNÇÃO PARA LISTAR OS TICKETS DO JIRA DE UMA CLÍNICA ---
async function listar(req, res) {
	let nomeClinica = req.params.nomeClinica;
	nomeClinica = nomeClinica.replaceAll(" ", "_");

	try {
		const tickets = await jiraModel.buscarTicketsAtivos(nomeClinica)
		res.status(200).json(tickets);
	} catch (error) {
		console.error("Erro ao listar alertas do jira:", error);
		res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
	}
}

// >>> NOVO <<<
// --- FUNÇÃO PARA LISTAR TODOS OS TICKETS DO JIRA DE UMA CLÍNICA ---
async function listarTudo(req, res) {
	let nomeClinica = req.params.nomeClinica;
	nomeClinica = nomeClinica.replaceAll(" ", "_");

	try {
		const tickets = await jiraModel.buscarTodosTickets(nomeClinica)
		res.status(200).json(tickets);
	} catch (error) {
		console.error("Erro ao listar alertas do jira:", error);
		res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
	}
}

// --- FUNÇÃO PARA LISTAR OS TICKETS DO JIRA DE UM MODELO DE UMA CLÍNICA ---
async function listarPorModelo(req, res) {
	let nomeClinica = req.body.a;
	let idModelo = req.body.idModelo;
	nomeClinica = nomeClinica.replaceAll(" ", "_");

	try {
		const tickets = await jiraModel.buscarTicketsAtivosModelo(nomeClinica, idModelo)
		res.status(200).json(tickets);
	} catch (error) {
		console.error("Erro ao listar alertas do jira:", error);
		res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
	}
}

// --- FUNÇÃO PARA LISTAR OS TICKETS DO JIRA DE UM MODELO DE UMA CLÍNICA ---
async function listarPorModeloUltimaSemana(req, res) {
	let nomeClinica = req.body.nomeClinica;
	let idModelo = req.body.idModelo;
	nomeClinica = nomeClinica.replaceAll(" ", "_");

	try {
		const tickets = await jiraModel.buscarTicketsUltimaSemanaModelo(nomeClinica, idModelo)
		res.status(200).json(tickets);
	} catch (error) {
		console.error("Erro ao listar alertas do jira:", error);
		res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
	}
}

// --- FUNÇÃO PARA LISTAR OS TICKETS DO JIRA DE UM DIA DE UM MODELO DE UMA CLÍNICA ---
async function listarPorModeloPorDia(req, res) {
	let nomeClinica = req.body.nomeClinica;
	let idModelo = req.body.idModelo;
	let dataDoDia = req.body.dataDoDia;
	nomeClinica = nomeClinica.replaceAll(" ", "_");

	try {
		const tickets = await jiraModel.buscarTicketsPorDiaModelo(nomeClinica, idModelo, dataDoDia);
		res.status(200).json(tickets);
	} catch (error) {
		console.error("Erro ao listar alertas do jira:", error);
		res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
	}
}

module.exports = {
	listar,
	listarTudo,
	listarPorModelo,
	listarPorModeloUltimaSemana,
	listarPorModeloPorDia
};
