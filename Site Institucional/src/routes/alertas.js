var express = require('express');
var router = express.Router();
var alertaController = require('../controllers/alertaController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para LISTAR alertas de um modelo
router.get('/listar/:modeloId', authMiddleware.verificarEngClinico, alertaController.listarAlertasPorModelo);

// Rota para LISTAR alertas de cada dispositivo do modelo
router.get('/listar/:modeloId/dispositivos', authMiddleware.verificarEngClinico, alertaController.listarAlertasDispositivosPorModelo);

module.exports = router;