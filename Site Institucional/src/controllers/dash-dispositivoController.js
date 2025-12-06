const dash_dispositivoModel = require("../models/dash-dispositivoModel");

// dash-dispositivoController.js
async function buscarDispositivos(req, res) {
    try {
        const idUsuario = req.params.idUsuario;

        if (!idUsuario) {
            return res.status(400).json({ erro: "ID do usuário não informado." });
        }

        const resultado = await dash_dispositivoModel.buscarDispositivos(idUsuario);

        
        const dispositivos = Array.isArray(resultado) ? resultado : [];

        if (dispositivos.length === 0) {
            return res.status(200).json([]); 
        }

        return res.status(200).json(dispositivos);

    } catch (erro) {
        console.error("Erro ao buscar dispositivos:", erro);
        return res.status(500).json({ erro: "Erro interno ao buscar dispositivos." });
    }
}

module.exports = { buscarDispositivos };

