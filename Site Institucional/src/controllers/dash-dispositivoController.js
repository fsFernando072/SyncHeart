const dash_dispositivoModel = require("../models/dash-dispositivoModel");

async function buscarDispositivos(req, res) {
    try {
        const idUsuario = req.params.idUsuario;

        if (!idUsuario) {
            return res.status(400).json({ erro: "ID do usuário não informado." });
        }

        const resultado = await dash_dispositivoModel.buscarDispositivos(idUsuario);

        if (resultado.length === 0) {
            return res.status(404).json({
                mensagem: "Nenhum dispositivo encontrado para este usuário."
            });
        }

        return res.status(200).json(resultado);

    } catch (erro) {
        console.error("Erro ao buscar dispositivos:", erro);
        return res.status(500).json({
            erro: "Erro interno ao buscar dispositivos."
        });
    }
}

module.exports = {
    buscarDispositivos
};
