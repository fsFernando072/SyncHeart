var express = require('express');
var router = express.Router();
var autenticacaoController = require('../controllers/autenticacaoController');

// Rota para o CADASTRO
// Esta rota é para o cadastro GERAL, que cria a Clínica + Usuário
router.post('/cadastrar', function (req, res) {
    autenticacaoController.cadastrar(req, res);
});

// Rota para a AUTENTICAÇÃO (LOGIN)
router.post('/autenticar', function (req, res) {
    autenticacaoController.autenticar(req, res);
});

// Rota para ADICIONAR um funcionário a uma clínica existente
router.post('/adicionar', autenticacaoController.adicionarFuncionario);


// Rota para LISTAR FUNCIONMÁRIOS de uma CLÍNICA pelo ID
router.get('/por-clinica/:idClinica', autenticacaoController.listarPorClinica);



module.exports = router;