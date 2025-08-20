var express = require("express");
var router = express.Router();

var aprovacaoController = require("../controllers/aprovacaoController");

router.get("/aprovar", function (req, res) {
    aprovacaoController.aprovar(req, res);
})

module.exports = router;
