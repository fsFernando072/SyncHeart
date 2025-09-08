var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
})

router.post("/cadastrarAprovado", function (req, res) {
    usuarioController.cadastrarAprovado(req, res);
})

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
})

router.post("/limpar", function (req, res) {
    usuarioController.limpar(req, res);
})

router.post("/cadastrarUsuario", function (req, res) {
    usuarioController.cadastrarUsuario(req, res);
});

router.post("/limparUsuario", function (req, res) {
    usuarioController.limparUsuario(req, res);
});

module.exports = router;
