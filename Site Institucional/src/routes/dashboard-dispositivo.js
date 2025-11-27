var express = require('express');
var router = express.Router();
var dash_dispositivoController = require('../controllers/dash-dispositivoController');
// Importa o middleware de segurança.
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:idUsuario', authMiddleware.verificarEletrofisiologista, dash_dispositivoController.buscarDispositivos);

module.exports = router;