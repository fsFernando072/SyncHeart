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

module.exports = router;
