const axios = require("axios");

require("dotenv").config({ path: '../.env.dev' });

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

async function buscarTickets(nome) {
	nome = "Fachada";
	try {
		const jql =
			`project = "SYN" AND status = "Open" AND labels = "${nome}" ORDER BY created DESC`;
		const body = {
			jql,
			maxResults: 50,
			fields: [
				"description",
				"summary",
				"status",
				"assignee",
				"reporter",
				"created",
				"updated",
				"priority",
				"issuetype",
				"project",
			],
		};

		const response = await axios.post(
			`${JIRA_BASE_URL}/rest/api/3/search/jql`,
			body,
			{
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					Authorization: `Basic ${Buffer.from(
						`${JIRA_EMAIL}:${JIRA_API_TOKEN}`
					).toString("base64")}`,
				},
			}
		);

		const tickets = []
		const issues = response.data.issues || [];

		issues.forEach((issue) => {
			const f = issue.fields;
			// if(f.summary.includes(nome.nome)){
			tickets.push(f)
			// }
		});

		return tickets
	} catch (error) {
		console.error(error.response?.data || error.message);
	}
}
async function listar(req, res) {
	var nomeClinica = req.params.nomeClinica;

	let tickets = await buscarTickets(nomeClinica)
	res.status(200).json(tickets);
}

module.exports = {
	listar,
};
