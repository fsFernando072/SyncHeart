var aprovacaoModel = require("../models/aprovacaoModel");

function aprovar(req, res) {
  aprovacaoModel.aprovar().then((resultado) => {
    res.status(200).json(resultado);
  });
}

module.exports = {
    aprovar
}