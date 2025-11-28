var express = require('express');
var router = express.Router();
var jiraController = require('../controllers/jiraController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para LISTAR alertas de um modelo
router.get('/listar/:nomeClinica', authMiddleware.verificarUsuarioAutenticado, jiraController.listar);

module.exports = router;