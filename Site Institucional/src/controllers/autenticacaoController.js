const organizacaoModel = require('../models/organizacaoModel');
const usuarioModel = require('../models/usuarioModel');

exports.cadastrar = async (req, res) => {
    const { nome_empresa, cnpj, nome_representante, email, senha } = req.body;

    if (!nome_empresa || !cnpj || !nome_representante || !email || !senha) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }

    let novaOrganizacaoId;
    try {
        const resultadoOrganizacao = await organizacaoModel.criar(nome_empresa, cnpj);
        novaOrganizacaoId = resultadoOrganizacao.insertId;

        if (!novaOrganizacaoId) {
            throw new Error("Falha ao criar a organização.");
        }

        const resultadoUsuario = await usuarioModel.criarRepresentante(novaOrganizacaoId, nome_representante, email, senha);

        res.status(201).json({ 
            mensagem: "Cadastro realizado com sucesso! Aguardando aprovação.", 
            organizacaoId: novaOrganizacaoId,
            usuarioId: resultadoUsuario.insertId 
        });

    } catch (error) {
        if (novaOrganizacaoId) {
            await organizacaoModel.deletarPorId(novaOrganizacaoId);
        }
        
        console.error("Erro no cadastro:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Este e-mail ou CNPJ já está cadastrado.' });
        }
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor ao tentar cadastrar.' });
    }
};

exports.autenticar = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
    }

    try {
        const usuarios = await usuarioModel.buscarPorEmail(email);

        if (usuarios.length === 0) {
            return res.status(401).json({ erro: "Credenciais inválidas." });
        }
        
        const usuario = usuarios[0];

        if (senha !== usuario.senha_hash) { // ATENÇÃO!!!!!!!!!! SENHA SEM CRIPTOGRAFIA
            return res.status(401).json({ erro: "Credenciais inválidas." });
        }
        
        if (!usuario.ativo) {
            return res.status(403).json({ erro: "Este usuário está desativado." });
        }

        const resultado = {
            usuario: { id: usuario.id, nome: usuario.nome_completo, email: usuario.email, papel: usuario.papel },
            organizacao: { id: usuario.organizacao_id, nome: usuario.nome_organizacao, status: usuario.status_organizacao }
        };

        if (resultado.organizacao && resultado.organizacao.status === 'pendente') {
            return res.status(200).json({ status: "aprovacao", dados: resultado });
        }
        
        res.status(200).json({ status: "sucesso", dados: resultado });

    } catch (error) {
        console.error("Erro na autenticação:", error);
        res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};

exports.adicionarFuncionario = async (req, res) => {
    // O front-end envia todos estes dados no body
    const { organizacaoId, nome_completo, email, senha, papel } = req.body;

    if (!organizacaoId || !nome_completo || !email || !senha || !papel) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }

    try {
        const resultado = await usuarioModel.criarFuncionario(organizacaoId, nome_completo, email, senha, papel);
        res.status(201).json({ mensagem: "Funcionário cadastrado com sucesso!", usuarioId: resultado.insertId });
    } catch (error) {
        console.error("Erro ao adicionar funcionário:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Este e-mail já está em uso.' });
        }
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
};

// NOVA FUNÇÃO
exports.listarPorOrganizacao = async (req, res) => {
    // O ID vem pela URL (ex: /usuarios/por-organizacao/7)
    const { idOrganizacao } = req.params;

    if (!idOrganizacao) {
        return res.status(400).json({ erro: "O ID da organização é obrigatório." });
    }

    try {
        const usuarios = await usuarioModel.listarPorOrganizacao(idOrganizacao);
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Erro ao listar funcionários:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor.' });
    }
};