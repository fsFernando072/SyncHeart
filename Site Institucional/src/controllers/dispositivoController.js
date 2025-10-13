// Arquivo: controllers/dispositivoController.js

const dispositivoModel = require("../models/dispositivoModel");
const { v4: uuidv4 } = require('uuid'); // Para gerar o UUID do dispositivo
const crypto = require('crypto'); // Para gerar o token de registro seguro

async function provisionar(req, res) {
    // 1. Coleta os dados enviados pelo letrofisiologista
    const { idPacienteNaClinica, modeloId, equipeId } = req.body;
    const clinicaId = req.usuario.clinicaId;

    if (!idPacienteNaClinica || !modeloId || !equipeId) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios para o provisionamento." });
    }

    try {
        // 2. Cria o registro do paciente anônimo e obtém o ID
        const resultadoPaciente = await dispositivoModel.criarPaciente(idPacienteNaClinica, clinicaId);
        const novoPacienteId = resultadoPaciente.insertId;

        // 3. Gera os identificadores para o dispositivo
        const dispositivoUuid = uuidv4(); // Gera um UUID (ex: 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
        const tokenRegistro = crypto.randomBytes(20).toString('hex'); // Gera um token aleatório

        // 4. Cria o registro do dispositivo no banco de dados, associando tudo
        await dispositivoModel.provisionar(dispositivoUuid, tokenRegistro, modeloId, equipeId, novoPacienteId);

        // 5. Envia a resposta de sucesso para o frontend
        res.status(201).json({
            mensagem: "Dispositivo provisionado com sucesso! O script de instalação está pronto para download.",
            dispositivoUuid: dispositivoUuid,
            tokenRegistro: tokenRegistro // token para ser injetado no script
        });

    } catch (error) {
        console.error("Erro ao provisionar dispositivo:", error);
        res.status(500).json({ erro: 'Ocorreu uma falha no servidor durante o provisionamento.' });
    }
}

module.exports = {
    provisionar
};