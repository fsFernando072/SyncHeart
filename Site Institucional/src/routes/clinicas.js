const express = require('express');
const router = express.Router();

const clinicaController = require('../controllers/clinicaController');
const authMiddleware = require('../middleware/authMiddleware');

// ==== ROTAS ANTIGAS (cadastro e aprovação) ====
router.post('/cadastrar', clinicaController.cadastrar);

router.get('/listar', function (req, res) {
    clinicaController.listarTodas(req, res);
});

router.put('/atualizarStatus/:idClinica', function (req, res) {
    clinicaController.atualizarStatus(req, res);
});

const AWS = require('aws-sdk');

// Configuração do S3 (pega do .env)
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: process.env.AWS_REGION
});


router.get('/:nomeClinica/dispositivos/:deviceId/dashboard-bateria',
    authMiddleware.verificarEletrofisiologista,
    async (req, res) => {
        const { deviceId } = req.params;
        const bucketName = process.env.AWS_S3_BUCKET_DASHBOARDS;

        if (!deviceId || deviceId.trim() === '' || deviceId.length < 8) {
            return res.status(400).json({ erro: "UUID do dispositivo inválido" });
        }

        try {
            // CORREÇÃO AQUI:
            const key = `client/${deviceId}/_dashboard_bateria.json`;

            const resultado = await s3.getObject({
                Bucket: bucketName,
                Key: key
            }).promise();

            const dashboardJson = JSON.parse(resultado.Body.toString('utf-8'));
            dashboardJson.uuid = deviceId;

            return res.status(200).json(dashboardJson);

        } catch (error) {
            if (error.code === 'NoSuchKey') {
                return res.status(404).json({
                    erro: "Dashboard não encontrado",
                    mensagem: "Este dispositivo ainda não enviou dados suficientes para gerar o dashboard.",
                    uuid: deviceId
                });
            }

            console.error(`Erro S3 - Dispositivo ${deviceId}:`, error);
            return res.status(500).json({ erro: "Erro interno ao carregar dados da bateria" });
        }
    }
);


module.exports = router;