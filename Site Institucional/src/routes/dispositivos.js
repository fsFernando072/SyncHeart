var express = require('express');
var router = express.Router();
var dispositivoController = require('../controllers/dispositivoController');
// Importa o middleware de segurança.
const authMiddleware = require('../middleware/authMiddleware');


router.post('/provisionar', authMiddleware.verificarEletrofisiologista, dispositivoController.provisionar);

module.exports = router;