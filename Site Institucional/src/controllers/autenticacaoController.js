const clinicaModel = require('../models/clinicaModel');
const usuarioModel = require('../models/usuarioModel');
//Linha abaixo serve para biblioteca de criptografia
// const bcrypt = require('bcryptjs'); 


async function autenticar(req, res) { //(login)
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
    }

    try {
        const resultadoUsuario = await usuarioModel.buscarPorEmail(email);

        if (resultadoUsuario.length == 0) {
            return res.status(401).json({ erro: "Credenciais inválidas." });
        }
        
        const usuario = resultadoUsuario[0];

        if (senha !== usuario.senha_hash) {
            return res.status(401).json({ erro: "Credenciais inválidas." });
        }
     
        const CARGO_ADMIN_ID = 1;   //ID do admin definido no banco 
        //#BE-ALTERACOES - ID do Admin está mockado no backend
        //Verifica se o usuário logando é o admin e se for nem vai atrás das outras consultas
        if (usuario.cargo_id === CARGO_ADMIN_ID) {
            const dadosSessaoAdmin = {
                usuario: { 
                    id: usuario.usuario_id, 
                    nome: usuario.nome_completo, 
                    email: usuario.email,
                    cargoId: usuario.cargo_id
                },
                clinica: null 
            };
            return res.status(200).json({ status: "sucesso_admin", dados: dadosSessaoAdmin });
        }
     

        // Só é executado se o usuário logando NÃO for admin
        const resultadoClinica = await clinicaModel.buscarPorId(usuario.clinica_id);

        if (resultadoClinica.length == 0) {
            return res.status(404).json({ erro: "Clínica associada a este usuário não foi encontrada." });
        }

        const clinica = resultadoClinica[0];
        
        if (clinica.status === 'Pendente') {
            return res.status(403).json({ 
                status: "aprovacao_pendente", 
                mensagem: "Cadastro da clínica aguarda aprovação." 
            });
        }
        
        const dadosSessao = {
            usuario: { 
                id: usuario.usuario_id, 
                nome: usuario.nome_completo, 
                email: usuario.email,
                cargoId: usuario.cargo_id
            },
            clinica: { 
                id: clinica.clinica_id, 
                nome: clinica.nome_fantasia, 
                status: clinica.status 
            }
        };
        
        res.status(200).json({ status: "sucesso", dados: dadosSessao });

    } catch (error) {
        console.error("Erro na autenticação:", error);
        res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
}

async function cadastrar(req, res) { //Cadastro de CLINICA (Onboarding)
    const { nome_empresa, cnpj, nome_representante, email, senha } = req.body;

    if (!nome_empresa || !cnpj || !nome_representante || !email || !senha) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }

    const senhaHash = senha;

    try {
        const resultadoClinica = await clinicaModel.criar(nome_empresa, cnpj, email, senhaHash);
        const novaClinicaId = resultadoClinica.insertId;

        if (!novaClinicaId) {
            throw new Error("Falha ao criar a clínica.");
        }

        const cargoRepresentanteId = 1;
        const resultadoUsuario = await usuarioModel.criar(nome_representante, email, senhaHash, cargoRepresentanteId, novaClinicaId);

        res.status(201).json({ 
            mensagem: "Cadastro realizado com sucesso! Aguardando aprovação.", 
            clinicaId: novaClinicaId,
            usuarioId: resultadoUsuario.insertId 
        });

    } catch (error) {
        console.error("Erro no cadastro:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Este e-mail ou CNPJ já está cadastrado.' });
        }
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor ao tentar cadastrar.' });
    }
}

// Função para adicionar funcionário
async function adicionarFuncionario(req, res) {
    const { clinicaId, nome_completo, email, senha, cargoId } = req.body;

    if (!clinicaId || !nome_completo || !email || !senha || !cargoId) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }
    
    const senhaHash = senha; //#BE-ALERTA_HASH

    try {
        const resultado = await usuarioModel.criar(nome_completo, email, senhaHash, cargoId, clinicaId);
        res.status(201).json({ mensagem: "Funcionário cadastrado com sucesso!", usuarioId: resultado.insertId });
    } catch (error) {
        console.error("Erro ao adicionar funcionário:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Este e-mail já está em uso.' });
        }
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

// Função para listar usuários por clínica
async function listarPorClinica(req, res) {
    const { idClinica } = req.params;

    if (!idClinica) {
        return res.status(400).json({ erro: "O ID da clínica é obrigatório." });
    }

    try {
        const usuarios = await usuarioModel.listarPorClinica(idClinica);
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Erro ao listar funcionários:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

module.exports = {
    autenticar,
    cadastrar,
    adicionarFuncionario,
    listarPorClinica
};