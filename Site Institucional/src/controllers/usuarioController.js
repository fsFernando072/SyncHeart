var usuarioModel = require("../models/usuarioModel");

function cadastrar(req, res) {
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;
    var cnpj = req.body.cnpjServer;

    if (nome == undefined) {
        res.status(400).send("Seu nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    } else if (cnpj == undefined) {
        res.status(400).send("Seu cnpj está undefined!");
    } else {

        usuarioModel.cadastrar(nome, email, senha, cnpj)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

function cadastrarAprovado(req, res) {
    var nomeAprovado = req.body.nomeServer;
    var emailAprovado = req.body.emailServer;
    var senhaAprovado = req.body.senhaServer;
    var cnpjAprovado = req.body.cnpjServer;

    usuarioModel.cadastrarAprovado(nomeAprovado, emailAprovado, senhaAprovado, cnpjAprovado)
        .then(
            function (resultado) {
                res.json(resultado);
            }
        ).catch(
            function (erro) {
                console.log(erro);
                console.log(
                    "\nHouve um erro ao realizar o cadastro! Erro: ",
                    erro.sqlMessage
                );
                res.status(500).json(erro.sqlMessage);
            }
        );
}

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (!email || !senha) {
        return res.status(400).send("Email ou senha estão indefinidos!");
    }

    usuarioModel.autenticarFabricante(email, senha)
        .then(resultadoFabricante => {
            if (resultadoFabricante.length == 1) {
                if (resultadoFabricante[0].acesso == 0) {
                    res.json({ status: "aprovacao", dados: resultadoFabricante[0] });
                } else {
                    res.json({ status: "fabricante", dados: resultadoFabricante[0] });
                }
            } else {
                usuarioModel.autenticarEmpresa(email, senha)
                    .then(resultadoEmpresa => {
                        if (resultadoEmpresa.length == 1) {
                            res.json({ status: "empresa", dados: resultadoEmpresa[0] });
                        } else {
                            usuarioModel.autenticarUsuario(email, senha)
                                .then(resultadoUsuario => {
                                    if (resultadoUsuario.length == 1) {
                                        res.json({ status: "usuario", dados: resultadoUsuario[0] });
                                    } else {
                                        res.status(403).send("Usuário ou senha inválidos.");
                                    }
                                })
                                .catch(erro => {
                                    console.log("Erro ao autenticar usuário: ", erro.sqlMessage);
                                    res.status(500).json(erro.sqlMessage);
                                });
                        }
                    })
                    .catch(erro => {
                        console.log("Erro ao autenticar empresa: ", erro.sqlMessage);
                        res.status(500).json(erro.sqlMessage);
                    });
            }
        })
        .catch(erro => {
            console.log("Erro ao autenticar fabricante: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}


function cadastrarUsuario(req, res) {
    var nome = req.body.nomeServer;
    var cpf = req.body.cpfServer;
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;
    var fk_fabricante = req.body.fkFabricante;

    if (!nome || !cpf || !email || !fk_fabricante || !senha) {
        return res.status(400).send("Dados inválidos para cadastro do usuário.");
    }

    usuarioModel.cadastrarUsuario(nome, cpf, email, senha, fk_fabricante)
        .then(resultado => res.json(resultado))
        .catch(erro => {
            console.log("Erro ao cadastrar usuário: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

function limpar(req, res) {
    var idAprovado = req.body.idServer;

    usuarioModel.limpar(idAprovado)
        .then(
            function (resultado) {
                res.json(resultado);
            }
        ).catch(
            function (erro) {
                console.log(erro);
                console.log(
                    "\nHouve um erro ao realizar o cadastro! Erro: ",
                    erro.sqlMessage
                );
                res.status(500).json(erro.sqlMessage);
            }
        );
}

function limparUsuario(req, res) {
    var idAprovado = req.body.idServer;

    usuarioModel.limparUsuario(idAprovado)
        .then(
            function (resultado) {
                res.json(resultado);
            }
        ).catch(
            function (erro) {
                console.log(erro);
                console.log(
                    "\nHouve um erro ao realizar o cadastro! Erro: ",
                    erro.sqlMessage
                );
                res.status(500).json(erro.sqlMessage);
            }
        );
}

module.exports = {
    cadastrar, cadastrarAprovado, autenticar,
    cadastrarUsuario,limpar,limparUsuario
};
