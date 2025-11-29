var express = require('express');
var router = express.Router();
var jiraController = require('../controllers/jiraController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para LISTAR tickets ativos de uma clínica
router.get('/listar/:nomeClinica', authMiddleware.verificarUsuarioAutenticado, jiraController.listar);

// Rota para LISTAR tickets ativos de um modelo de uma clínica
router.post('/listar/modelo', authMiddleware.verificarUsuarioAutenticado, jiraController.listarPorModelo);

module.exports = router;