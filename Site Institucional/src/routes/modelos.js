var express = require('express');
var router = express.Router();
var modeloController = require('../controllers/modeloController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para CRIAR um novo modelo 
router.post('/criar', authMiddleware.verificarEngClinico, modeloController.criar);

// Rota para LISTAR todos os modelos de uma clínica
router.get('/listar', authMiddleware.verificarEngClinico, modeloController.listar);

// Rota para LISTAR todos os fabricantes
router.get('/fabricantes', authMiddleware.verificarEngClinico, modeloController.listarFabricantes);

// Rota para LISTAR todos os parâmetros de alerta de um modelo 
router.get('/:modeloId/parametros', authMiddleware.verificarEngClinico, modeloController.listarParametrosPorModelo);

/**
 * Rota para BUSCAR os dados de um único modelo pelo ID.
 * Usada para preencher o formulário de edição.
 */
router.get('/:modeloId', authMiddleware.verificarEngClinico, modeloController.buscarPorId);

/**
 * Rota para ATUALIZAR os dados de um modelo.
 */
router.put('/:modeloId', authMiddleware.verificarEngClinico, modeloController.atualizar);


module.exports = router;