var alertaModel = require("../models/alertaModel");

// --- FUNÇÃO PARA LISTAR ALERTAS DE UM DETERMINADO MODELO ---
async function listarAlertasPorModelo(req, res) {
    const { modeloId } = req.params;
    try {
        const parametros = await alertaModel.listarAlertasPorModelo(modeloId);
        res.status(200).json(parametros);
    } catch (error) {
        console.error("Erro ao listar alertas do modelo:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

// --- FUNÇÃO PARA LISTAR ALERTAS DOS DISPOSITIVOS DE UM DETERMINADO MODELO ---
async function listarAlertasDispositivosPorModelo(req, res) {
    const { modeloId } = req.params;
    try {
        const parametros = await alertaModel.listarAlertasDispositivosPorModelo(modeloId);
        res.status(200).json(parametros);
    } catch (error) {
        console.error("Erro ao listar alertas dos dispositivos do modelo:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

// --- FUNÇÃO PARA LISTAR CONTAR ALERTAS ATIVOS DE CADA COMPONENTE DE UM DETERMINADO MODELO ---
async function calcularAlertasPorComponente(req, res) {
    const { modeloId } = req.params;
    try {
        const parametros = await alertaModel.calcularAlertasPorComponente(modeloId);
        res.status(200).json(parametros);
    } catch (error) {
        console.error("Erro ao listar calcular alertas ativos do modelo:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

module.exports = {
    listarAlertasPorModelo,
    listarAlertasDispositivosPorModelo,
};