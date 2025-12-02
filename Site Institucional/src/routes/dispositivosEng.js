var express = require('express');
var router = express.Router();
var dispositivosEngController = require('../controllers/dispositivosEngController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:modeloId/dispositivos', authMiddleware.verificarEngClinico, dispositivosEngController.listar);

router.get('/:dispositivoid', authMiddleware.verificarEngClinico, dispositivosEngController.listarAtual);

module.exports = router;