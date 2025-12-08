const jwt = require('jsonwebtoken');

// "guarda" que verifica se o usuário é um 'Admin da Clínica'
function verificarAdminClinica(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato esperado: "Bearer TOKEN"
    if (token == null) {
        return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
    }
    jwt.verify(token, 'sua_chave_secreta_super_segura', (err, usuario) => {
        if (err) {
            return res.status(403).json({ erro: "Token inválido ou expirado." });
        }
        const CARGO_ADMIN_CLINICA = 2; 
        if (usuario.cargoId !== CARGO_ADMIN_CLINICA) {
            return res.status(403).json({ erro: "Acesso negado. Você não tem permissão para esta ação." });
        }
        // Se passou por todas as verificações, anexa os dados do usuário à requisição e continua
        req.usuario = usuario; 
        next(); 
    });
}

function verificarEngClinico(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
    }

    jwt.verify(token, 'sua_chave_secreta_super_segura', (err, usuario) => {
        if (err) {
            return res.status(403).json({ erro: "Token inválido ou expirado." });
        }

        const CARGO_ENG_CLINICA = 4;
        if (usuario.cargoId !== CARGO_ENG_CLINICA) {
            return res.status(403).json({ erro: "Acesso negado. Apenas Engenheiros Clínicos podem realizar esta ação." });
        }

        req.usuario = usuario; 
        next(); 
    });
}


function verificarEletrofisiologista(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
    }

    jwt.verify(token, 'sua_chave_secreta_super_segura', (err, usuario) => {
        if (err) {
            return res.status(403).json({ erro: "Token inválido ou expirado." });
        }

        const CARGO_ELETROFISIOLOGISTA = 3;
        if (usuario.cargoId !== CARGO_ELETROFISIOLOGISTA) {
            return res.status(403).json({ erro: "Acesso negado. Apenas Eletrofisiologistas podem realizar esta ação." });
        }

        req.usuario = usuario; 
        next(); 
    });
}


//Verificação de usuário global (Serve apenas para requisições simples de consulta)
function verificarUsuarioAutenticado(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
    }

    jwt.verify(token, 'sua_chave_secreta_super_segura', (err, usuario) => {
        if (err) {
            return res.status(403).json({ erro: "Token inválido ou expirado." });
        }

        // A única verificação é se o usuário tem um ID de clínica, ou seja, não é o Admin SyncHeart
        if (!usuario.clinicaId) {
             return res.status(403).json({ erro: "Acesso negado." });
        }

        req.usuario = usuario; 
        next(); 
    });
}
module.exports = {
    verificarAdminClinica,
    verificarEngClinico,
    verificarEletrofisiologista,
    verificarUsuarioAutenticado
};