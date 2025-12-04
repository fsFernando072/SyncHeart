const clinicaModel = require('../models/clinicaModel');
const usuarioModel = require('../models/usuarioModel');
const jwt = require('jsonwebtoken');

// --- FUNÇÃO DE AUTENTICAÇÃO (LOGIN) ---
async function autenticar(req, res) {
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

        if (senha !== usuario.senha_hash) { // #BE-SENHA
            return res.status(401).json({ erro: "Credenciais inválidas." });
        }

        if (usuario.ativo === 0) {
            return res.status(403).json({ erro: "Acesso negado. Esta conta de usuário está desativada." });
        }

        const payload = {
            usuarioId: usuario.usuario_id,
            cargoId: usuario.cargo_id,
            clinicaId: usuario.clinica_id
        };
        const token = jwt.sign(payload, 'sua_chave_secreta_super_segura', { expiresIn: '8h' });

        const CARGO_ADMIN_ID = 1; // ID do 'Admin SyncHeart'
        // --- Admin SyncHeart ---
        if (usuario.cargo_id === CARGO_ADMIN_ID) {
            const dadosSessaoAdmin = {
                usuario: {
                    id: usuario.usuario_id,
                    nome: usuario.nome_completo,
                    email: usuario.email,
                    cargoId: usuario.cargo_id,
                    clinicaId: usuario.clinica_id
                },
                clinica: null
            };

            return res.status(200).json({
                status: "sucesso_admin",
                token,
                dados: dadosSessaoAdmin
            });
        }

        // --- Usuário comum (clínica) ---
        const resultadoClinica = await clinicaModel.buscarPorId(usuario.clinica_id);
        if (resultadoClinica.length == 0) {
            return res.status(404).json({ erro: "Clínica associada a este usuário não foi encontrada." });
        }

        const clinica = resultadoClinica[0];

        if (clinica.status === 'Pendente') {
            return res.status(403).json({ status: "aprovacao_pendente", mensagem: "Cadastro da clínica aguarda aprovação." });
        }

        if (clinica.status === 'Inativo') {
            return res.status(403).json({ erro: "Acesso negado. A conta desta clínica está inativa ou foi recusada." });
        }

        const dadosSessao = {
            usuario: {
                id: usuario.usuario_id,
                nome: usuario.nome_completo,
                email: usuario.email,
                cargoId: usuario.cargo_id,
                clinicaId: usuario.clinica_id
            },
            clinica: {
                id: clinica.clinica_id,
                nome: clinica.nome_fantasia,
                status: clinica.status
            }
        };

        res.status(200).json({
            status: "sucesso",
            token,
            dados: dadosSessao
        });

    } catch (error) {
        console.error("Erro na autenticação:", error);
        res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
}


// --- CADASTRAR CLÍNICA ---
async function cadastrar(req, res) {
    const { nomeFantasia, cnpj, nome_representante, email, senha } = req.body;
    if (!nomeFantasia || !cnpj || !nome_representante || !email || !senha) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }
    const senhaHash = senha;
    try {
        const resultadoClinica = await clinicaModel.criar(nomeFantasia, cnpj, email, senhaHash);
        const novaClinicaId = resultadoClinica.insertId;
        if (!novaClinicaId) { throw new Error("Falha ao criar a clínica."); }
        const cargoAdminClinicaId = 2;
        const resultadoUsuario = await usuarioModel.criar(nome_representante, email, senhaHash, cargoAdminClinicaId, novaClinicaId);
        res.status(201).json({ mensagem: "Cadastro realizado com sucesso! Aguardando aprovação.", clinicaId: novaClinicaId, usuarioId: resultadoUsuario.insertId });
    } catch (error) {
        console.error("Erro no cadastro:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Este e-mail ou CNPJ já está cadastrado.' });
        }
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor ao tentar cadastrar.' });
    }
}

async function adicionarFuncionario(req, res) {
    const { clinicaId, nome_completo, email, senha, cargoId, equipeId } = req.body;
    if (!clinicaId || !nome_completo || !email || !senha || !cargoId || !equipeId) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }
    const senhaHash = senha;
    try {
        const resultadoUsuario = await usuarioModel.criar(nome_completo, email, senhaHash, cargoId, clinicaId);
        const novoUsuarioId = resultadoUsuario.insertId;
        await usuarioModel.vincularEquipe(novoUsuarioId, equipeId);
        res.status(201).json({ mensagem: "Funcionário cadastrado e vinculado à equipe com sucesso!", usuarioId: novoUsuarioId });
    } catch (error) {
        console.error("Erro ao adicionar funcionário:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Este e-mail já está em uso.' });
        }
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

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

async function buscarPorId(req, res) {
    const { idUsuario } = req.params;
    try {
        const resultado = await usuarioModel.buscarPorId(idUsuario);
        if (resultado.length > 0) {
            res.status(200).json(resultado[0]);
        } else {
            res.status(404).json({ erro: "Funcionário não encontrado." });
        }
    } catch (error) {
        console.error("Erro ao buscar funcionário por ID:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

async function atualizar(req, res) {
    const { idUsuario } = req.params;
    const { nome_completo, cargoId, equipeId } = req.body;
    if (!nome_completo || !cargoId || !equipeId) {
        return res.status(400).json({ erro: "Nome, cargo e equipe são obrigatórios." });
    }
    try {
        await Promise.all([
            usuarioModel.atualizar(idUsuario, nome_completo, cargoId),
            usuarioModel.atualizarVinculoEquipe(idUsuario, equipeId)
        ]);
        res.status(200).json({ mensagem: "Funcionário atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar funcionário:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

async function inativar(req, res) {
    const { idUsuario } = req.params;
    try {
        await usuarioModel.inativar(idUsuario);
        res.status(200).json({ mensagem: "Funcionário inativado com sucesso!" });
    } catch (error) {
        console.error("Erro ao inativar funcionário:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
}

module.exports = {
    autenticar,
    cadastrar,
    adicionarFuncionario,
    listarPorClinica,
    buscarPorId,
    atualizar,
    inativar
};