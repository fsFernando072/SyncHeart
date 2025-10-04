const express = require('express');
const router = express.Router();
const organizacaoController = require('../controllers/organizacaoController');

// Rota para buscar todas as organizações com status 'pendente'
//Não está sendo utilizada
router.get('/pendentes', organizacaoController.listarPendentes);

// Rota para executar a ação de aprovar ou recusar
router.post('/atualizar-status', organizacaoController.atualizarStatus);

// NOVA ROTA: para buscar todas as organizações
router.get('/todas', organizacaoController.listarTodas);
module.exports = router;