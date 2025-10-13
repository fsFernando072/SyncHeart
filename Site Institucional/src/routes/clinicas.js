const express = require('express');
const router = express.Router();

const clinicaController = require('../controllers/clinicaController');

//Rota para LISTAR todas as clínicas (para a tela de solicitações)
router.get('/listar', function (req, res) {
    clinicaController.listarTodas(req, res);
});

//Rota para ATUALIZAR O STATUS de uma clínica específica
router.put('/atualizarStatus/:idClinica', function (req, res) {
    clinicaController.atualizarStatus(req, res);
});


module.exports = router;