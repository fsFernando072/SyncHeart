var modeloModel = require("../models/modeloModel");
var database = require("../database/config");

// --- FUNÇÃO DE CRIAÇÃO DE MODELO ---
async function criar(req, res) {
    const { clinica_id, fabricante_id, nome_modelo, vida_util, dimensoes, frequencia_basica, prazo_garantia, tipo_bateria, parametros } = req.body;

    if (!fabricante_id || !nome_modelo || !vida_util) {
        return res.status(400).json({ erro: "Campos principais do modelo são obrigatórios." });
    }

    try {
        const resultadoModelo = await modeloModel.criar(clinica_id, fabricante_id, nome_modelo, vida_util, dimensoes, frequencia_basica, prazo_garantia, tipo_bateria);
        const novoModeloId = resultadoModelo.insertId;

        if (parametros && parametros.length > 0) {
            await Promise.all(parametros.map(p => {
                return modeloModel.criarParametro(novoModeloId, p.metrica, p.condicao, p.limiar_valor, p.duracao_minutos, p.criticidade || 'Atencao');
            }));
        }

        res.status(201).json({ 
            mensagem: "Modelo e parâmetros cadastrados com sucesso!", 
            modeloId: novoModeloId 
        });

    } catch (error) {
        console.error("Erro ao criar modelo com parâmetros:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor. Verifique os dados e tente novamente.' });
    }
}

// --- FUNÇÃO PARA LISTAR MODELOS DE DETERMINADA CLINICA ---
async function listar(req, res) {
    const idClinica = req.usuario.clinicaId;
    try {
        const modelos = await modeloModel.listar(idClinica);
        res.status(200).json(modelos);
    } catch (error) {
        console.error("Erro ao listar modelos:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

// --- FUNÇÃO PARA LISTAR FABRICANTES CADASTRADOS NO SISTEMA ---
async function listarFabricantes(req, res) {
    try {
        const fabricantes = await modeloModel.listarFabricantes();
        res.status(200).json(fabricantes);
    } catch (error) {
        console.error("Erro ao listar fabricantes:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

// --- FUNÇÃO PARA LISTAR OS PARAMETROS DE UM MODELO ---
async function listarParametrosPorModelo(req, res) {
    const { modeloId } = req.params;
    try {
        const parametros = await modeloModel.listarParametrosPorModelo(modeloId);
        res.status(200).json(parametros);
    } catch (error) {
        console.error("Erro ao listar parâmetros de alerta:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}


//Busca os dados de um único modelo pelo seu ID.
async function buscarPorId(req, res) {
    const { modeloId } = req.params;

    try {
        const resultado = await modeloModel.buscarPorId(modeloId);
        if (resultado.length > 0) {
            res.status(200).json(resultado[0]);
        } else {
            res.status(404).json({ erro: "Modelo não encontrado." });
        }
    } catch (error) {
        console.error("Erro ao buscar modelo por ID:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}


//Atualiza os dados de um modelo de dispositivo.
async function atualizar(req, res) {
    const { modeloId } = req.params;
    const { nome_modelo, vida_util, dimensoes, frequencia_basica, prazo_garantia, tipo_bateria } = req.body;

    if (!nome_modelo || !vida_util) {
        return res.status(400).json({ erro: "Nome do modelo e vida útil são obrigatórios." });
    }

    try {
        await modeloModel.atualizar(modeloId, nome_modelo, vida_util, dimensoes, frequencia_basica, prazo_garantia, tipo_bateria);
        res.status(200).json({ mensagem: "Modelo atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar modelo:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}


module.exports = {
    criar,
    listar,
    listarFabricantes,
    listarParametrosPorModelo,
    buscarPorId,
    atualizar
};