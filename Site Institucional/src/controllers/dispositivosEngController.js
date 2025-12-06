var dispositivoEngModel = require('../models/dispositivosEngModel');

async function listar(req, res) {
    const modeloId = req.params.modeloId;
    try {
        const dispositivos = await dispositivoEngModel.listar(modeloId);
        res.status(200).json(dispositivos);
    }
    catch (error) {
        console.error("Erro ao listar os dispositivos: " + error);
        res.status(500).json({ erro: "Ocorreu uma falha no servidor."});
    }
}

async function listarAtual(req, res) {
    const dispositivoid = req.params.dispositivoid;
    try {
        const dispositivo = await dispositivoEngModel.listarAtual(dispositivoid);
        res.status(200).json(dispositivo);
    }
    catch (error) {
        console.error("Erro ao buscar o dispositivo: " + error);
        res.status(200).json({ erro: "Ocorreu uma falha no servidor."});
    }
}

module.exports = {
    listar,
    listarAtual
}