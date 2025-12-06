const axios = require("axios");

// --- FUNÇÃO BASE QUE FAZ AS REQUISIÇÕES PARA O JIRA ---
async function modeloBuscar(jql, maxTentativas = 5) {
    const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
    const JIRA_EMAIL = process.env.JIRA_EMAIL;
    const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

    const body = {
        jql,
        maxResults: 200,
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

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
        try {
            const response = await axios.post(
                `${JIRA_BASE_URL}/rest/api/3/search/jql`,
                body,
                {
                    timeout: 10000,
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Basic ${Buffer.from(
                            `${JIRA_EMAIL}:${JIRA_API_TOKEN}`
                        ).toString("base64")}`,
                    },
                }
            );

            return response;
        } catch (error) {
            console.warn(`Tentativa ${tentativa} falhou com erro de conexão (${error.code}). Tentando novamente...`);
        }
    }


}

// --- FUNÇÃO QUE BUSCA SOMENTE OS TICKETS ATIVOS DA CLÍNICA ---
async function buscarTicketsAtivos(nomeClinica) {
    try {
        const jql =
            `project = "SYN" AND status = "Open" AND labels = "${nomeClinica}" ORDER BY created DESC`;

        const response = await modeloBuscar(jql);
        const tickets = []
        const issues = response.data.issues || [];

        issues.forEach((issue) => {
            const f = issue.fields;
            tickets.push(f)
        });

        return tickets
    } catch (error) {
        console.error(error.response?.data || error.message);
    }
}

// --- FUNÇÃO PARA LISTAR OS TICKETS DO JIRA DE UM MODELO DE UMA CLÍNICA ---
async function buscarTicketsAtivosModelo(nomeClinica, idModelo) {
    try {
        const jql =
            `project = "SYN" AND status = "Open" AND labels = "${nomeClinica}" AND description ~ "Modelo_ID: ${idModelo} " ORDER BY created DESC`;

        const response = await modeloBuscar(jql);
        const tickets = []
        const issues = response.data.issues || [];

        issues.forEach((issue) => {
            const f = issue.fields;
            tickets.push(f)
        });
        
        return tickets
    } catch (error) {
        console.error(error.response?.data || error.message);
    }
}

// --- FUNÇÃO PARA LISTAR OS TICKETS DO JIRA DA ÚLTIMA SEMANA DE UM MODELO DE UMA CLÍNICA ---
async function buscarTicketsUltimaSemanaModelo(nomeClinica, idModelo) {
    try {
        const jql =
            `project = "SYN" 
            AND labels = "${nomeClinica}" 
            AND description ~ "Modelo_ID: ${idModelo} "
            AND status WAS ("Open") BY endOfWeek(-1w) BEFORE startOfWeek()
            ORDER BY created DESC`;

        const response = await modeloBuscar(jql);
        const tickets = []
        const issues = response.data.issues || [];

        issues.forEach((issue) => {
            const f = issue.fields;
            tickets.push(f)
        });

        return tickets
    } catch (error) {
        console.error(error.response?.data || error.message);
    }
}

// --- FUNÇÃO PARA LISTAR OS TICKETS DO JIRA DE UM DIA DE UM MODELO DE UMA CLÍNICA ---
async function buscarTicketsPorDiaModelo(nomeClinica, idModelo, dataDoDia) {
    try {
        const inicioDoDia = `${dataDoDia} 00:00`;
        const fimDoDia = `${dataDoDia} 23:59`;

        const jql =
            `project = "SYN" 
            AND labels = "${nomeClinica}" 
            AND description ~ "Modelo_ID: ${idModelo} "
            AND status WAS ("Open") 
            AFTER "${inicioDoDia}" BEFORE "${fimDoDia}"
            ORDER BY created DESC`;

        const response = await modeloBuscar(jql);
        const tickets = []
        const issues = response.data.issues || [];

        issues.forEach((issue) => {
            const f = issue.fields;
            tickets.push(f)
        });

        return tickets
    } catch (error) {
        console.error(error.response?.data || error.message);
    }
}

module.exports = {
    buscarTicketsAtivos,
    buscarTicketsAtivosModelo,
    buscarTicketsUltimaSemanaModelo,
    buscarTicketsPorDiaModelo
};