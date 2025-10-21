var express = require('express');
var router = express.Router();
var equipeController = require('../controllers/equipeController');
const authMiddleware = require('../middleware/authMiddleware');

// A rota de CRIAR equipe (restrita para admins da clinica)
router.post('/criar', authMiddleware.verificarAdminClinica, equipeController.criar);

// A rota de LISTAR as equipes de acordo com as clinicas
router.get('/por-clinica/:idClinica', authMiddleware.verificarUsuarioAutenticado, equipeController.listarPorClinica);

module.exports = router;