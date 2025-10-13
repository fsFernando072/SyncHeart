// Arquivo: src/routes/usuarios.js

var express = require('express');
var router = express.Router();
var autenticacaoController = require('../controllers/autenticacaoController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota de cadastro geral 
router.post('/cadastrar', autenticacaoController.cadastrar);

// Rota de login 
router.post('/autenticar', autenticacaoController.autenticar);

// Rota para adicionar um novo funcionário 
router.post('/adicionar', authMiddleware.verificarAdminClinica, autenticacaoController.adicionarFuncionario);

// Rota para listar todos os funcionários de uma clínica 
router.get('/por-clinica/:idClinica', authMiddleware.verificarAdminClinica, autenticacaoController.listarPorClinica);

// Rota para BUSCAR os dados de um único funcionário pelo ID 
router.get('/:idUsuario', authMiddleware.verificarAdminClinica, autenticacaoController.buscarPorId);

// Rota para ATUALIZAR os dados de um funcionário 
router.put('/:idUsuario', authMiddleware.verificarAdminClinica, autenticacaoController.atualizar);

/**
 * Rota para INATIVAR um funcionário (exclusão lógica).
 * Ex: PUT /usuarios/15/inativar
 */
router.put('/:idUsuario/inativar', authMiddleware.verificarAdminClinica, autenticacaoController.inativar);


module.exports = router;