var clinicaModel = require("../models/clinicaModel");
var usuarioModel = require("../models/usuarioModel");

// Função para listar todas as clínicas (para a tela de solicitações)
function listarTodas(req, res) {
    clinicaModel.listarTodas()
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("Houve um erro ao buscar as clínicas: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

// Função para aprovar/recusar uma solicitação
function atualizarStatus(req, res) {
    var idClinica = req.params.idClinica;
    var novoStatus = req.body.status; // 'Ativo' ou 'Inativo'

    if (!novoStatus) {
        res.status(400).send("O novo status é obrigatório.");
        return;
    }

    clinicaModel.atualizarStatus(idClinica, novoStatus)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("Houve um erro ao atualizar o status: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

// Função de cadastro
async function cadastrar(req, res) {
    // Coleta de todos os dados do formulário de cadastro
    var { nome_empresa, nome_representante, email, senha, cnpj} = req.body;

    // Validação básica dos campos
    if (!nome_empresa || !cnpj || !email || !senha || !nome_representante) {
        return res.status(400).send("Dados incompletos! Verifique os campos do formulário.");
    }

   //#ALERTA_HASH - Na hora de criptografar senhas, devemos substituir para hashing
    var senhaHash = senha; 
    try {
        // Passo 1: Criar a clínica no BD
        const resultadoClinica = await clinicaModel.criar(nome_empresa, cnpj, email, senhaHash);
        
        // passo 2: Pegar o id da clinica que acabou de ser inserida
        const idClinicaCriada = resultadoClinica.insertId;

        if (idClinicaCriada) {
            // passo 3: Criar o usuário representante associado a clínica
            //#BE-ALTERACOES
            //Assumindo que o cargo 'Representante' tem o ID = 2 no BD.  - Isso pode ser buscado dinamicamente.
            const cargoRepresentanteId = 2; 
            await usuarioModel.criar(nome_representante, email, senhaHash, cargoRepresentanteId, idClinicaCriada);

            //Se tudo deu certo, envia a resposta de sucesso
            res.status(201).send("Clínica e usuário representante cadastrados com sucesso!");
        } else {
            throw new Error("Não foi possível obter o ID da clínica criada.");
        }

    } catch (erro) { // Pega qualquer erro gerado
        //console.log("Houve um erro durante o cadastro completo: ", erro.sqlMessage || erro.message);
        // #BE-ALTERACOES - O ideal seria deletar a clínica caso a criação do usuário falhe (
        // Precisaria alterar o arquivo config para permitir transaction)
        res.status(500).json(erro.sqlMessage || "Erro no servidor ao tentar cadastrar.");
    }
}

module.exports = {
    listarTodas,
    atualizarStatus,
    cadastrar
};