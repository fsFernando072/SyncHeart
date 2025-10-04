const organizacaoModel = require('../models/organizacaoModel');


//Não está sendo usada
exports.listarPendentes = async (req, res) => {
    try {
        const organizacoes = await organizacaoModel.listarPendentes();
        res.status(200).json(organizacoes);
    } catch (error) {
        console.error("Erro no controlador ao listar pendentes:", error);
        res.status(500).json({ erro: "Ocorreu um erro ao buscar as solicitações." });
    }
};

//Lista todas as organizações para tela de solicitacoes
exports.listarTodas = async (req, res) => {
    try {
        const organizacoes = await organizacaoModel.listarTodas();
        res.status(200).json(organizacoes);
    } catch (error) {
        console.error("Erro no controlador ao listar todas as organizações:", error);
        res.status(500).json({ erro: "Ocorreu um erro ao buscar as organizações." });
    }
};

//Atualiza o status da organizacao no BD, de acordo com o que foi definido na tela solicitacoes
exports.atualizarStatus = async (req, res) => {
    const { idOrganizacao, novoStatus } = req.body;

    if (!idOrganizacao || !novoStatus) {
        return res.status(400).json({ erro: "ID da organização e o novo status são obrigatórios." });
    }
    if (novoStatus !== 'aprovada' && novoStatus !== 'recusada') {
        return res.status(400).json({ erro: "Status inválido. Use 'aprovada' ou 'recusada'." });
    }

    try {
        await organizacaoModel.atualizarStatus(idOrganizacao, novoStatus);
        res.status(200).json({ mensagem: "Status da organização atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro no controlador ao atualizar status:", error);
        res.status(500).json({ erro: "Ocorreu um erro ao atualizar a organização." });
    }
};