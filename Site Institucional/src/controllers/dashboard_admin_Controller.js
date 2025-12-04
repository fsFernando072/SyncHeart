const dashboardModel = require("../models/dashboard_admin_Model");

async function resumo(req, res) {
    try {
        const [clinicas] = await dashboardModel.contarClinicas();
        const [equipes] = await dashboardModel.contarEquipes();
        const [modelos] = await dashboardModel.contarModelos();

        res.status(200).json({
            totalClinicas: clinicas.total,
            totalEquipes: equipes.total,
            totalModelos: modelos.total
        });

    } catch (error) {
        console.error("Erro ao carregar resumo admin:", error);
        res.status(500).json({ erro: "Ocorreu uma falha no servidor." });
    }
}

module.exports = {
    resumo
};