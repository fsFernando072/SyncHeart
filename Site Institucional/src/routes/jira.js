var express = require('express');
var router = express.Router();
var jiraController = require('../controllers/jiraController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para LISTAR tickets ativos de uma clínica
router.get('/listar/:nomeClinica', authMiddleware.verificarUsuarioAutenticado, jiraController.listar);

// Rota para LISTAR tickets ativos de um modelo de uma clínica
router.post('/listar/modelo', authMiddleware.verificarUsuarioAutenticado, jiraController.listarPorModelo);

// Rota para LISTAR tickets ativos de um modelo na última semana de uma clínica
router.post('/listar/modelo/ultsemana', authMiddleware.verificarUsuarioAutenticado, jiraController.listarPorModeloUltimaSemana);

// Rota para LISTAR tickets ativos de um modelo por dia de uma clínica
router.post('/listar/modelo/dia', authMiddleware.verificarUsuarioAutenticado, jiraController.listarPorModeloPorDia);

module.exports = router;