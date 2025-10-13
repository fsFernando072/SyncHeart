// Arquivo: controllers/equipeController.js

var equipeModel = require("../models/equipeModel");


//Cria uma nova equipe, associando a clínica do usuário logado
async function criar(req, res) {
    const { nome_equipe } = req.body;
    // O clinicaId é pego do token do usuário logado
    const clinicaId = req.usuario.clinicaId; 

    if (!nome_equipe) {
        return res.status(400).json({ erro: "O nome da equipe é obrigatório." });
    }

    try {
        const resultado = await equipeModel.criar(nome_equipe, clinicaId);
        res.status(201).json({ 
            mensagem: "Equipe criada com sucesso!", 
            equipeId: resultado.insertId 
        });
    } catch (error) {
        console.error("Erro ao criar equipe:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor ao criar a equipe.' });
    }
}


 //Lista as equipes de uma clínica específica
async function listarPorClinica(req, res) {
    const { idClinica } = req.params;

    try {
        const equipes = await equipeModel.listarPorClinica(idClinica);
        res.status(200).json(equipes);
    } catch (error) {
        console.error("Erro ao listar equipes:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

module.exports = {
    criar, 
    listarPorClinica
};