var express = require('express');
var router = express.Router();
var autenticacaoController = require('../controllers/autenticacaoController');

// 2. Define a rota para o CADASTRO
// Quando uma requisição POST chega em '/usuarios/cadastrar', 
// ela aciona a função 'cadastrar' do autenticacaoController.
router.post('/cadastrar', function (req, res) {
    autenticacaoController.cadastrar(req, res);
});

// 3. Define a rota para a AUTENTICAÇÃO (LOGIN)
// Quando uma requisição POST chegar em '/usuarios/autenticar',
// ela aciona la função 'autenticar' do autenticacaoController.
router.post('/autenticar', function (req, res) {
    autenticacaoController.autenticar(req, res);
});


// NOVA ROTA: Adiciona um funcionário a uma organização
router.post('/adicionar', autenticacaoController.adicionarFuncionario);

// NOVA ROTA: Lista funcionários de uma organização pelo ID
router.get('/por-organizacao/:idOrganizacao', autenticacaoController.listarPorOrganizacao);


module.exports = router;