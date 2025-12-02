var express = require('express');
var router = express.Router();
var DispositivosEngController = require('../controllers/dispositivosEngController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:modeloId/:dispositivoId', authMiddleware.verificarEngClinico, DispositivosEngController.listar);

router.get('/:modeloId/:dispositivoId', authMiddleware.verificarEngClinico, DispositivosEngController.listarAtual);

module.exports = router;