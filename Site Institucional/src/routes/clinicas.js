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


const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    
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
            const key = `client/${deviceId}/_dashboard_bateria.json`;

            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: key
            });

            const resultado = await s3Client.send(command);
            const dashboardJson = JSON.parse(await resultado.Body.transformToString('utf-8'));
            dashboardJson.uuid = deviceId;

            return res.status(200).json(dashboardJson);

        } catch (error) {
            if (error.name === 'NoSuchKey') {
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