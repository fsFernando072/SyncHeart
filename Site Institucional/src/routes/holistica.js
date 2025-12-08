var express = require('express');
var router = express.Router();
var holisticaController = require('../controllers/holisticaController');
const authMiddleware = require('../middleware/authMiddleware');

/*
 * Rota para obter dados da Dashboard Holística
 * Agrega KPIs, Alertas, Hotspots e Histórico de múltiplas fontes
 */
router.get(
    '/dashboard', authMiddleware.verificarUsuarioAutenticado, holisticaController.obterDashboardHolistica
);

module.exports = router;
