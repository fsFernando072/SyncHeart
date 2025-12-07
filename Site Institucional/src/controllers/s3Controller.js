const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const Papa = require('papaparse');

const s3Client = new S3Client({
    region: process.env.AWS_REGION
});

async function lerArquivo(req, res) {
    try {
        const fileKey = decodeURIComponent(req.params.arquivo);


        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: fileKey
        };

        console.log(`📥 Lendo do S3: ${params.Bucket}/${params.Key}`);

        const command = new GetObjectCommand(params);
        const data = await s3Client.send(command);

        const text = await data.Body.transformToString('utf-8');

        let content;
        if (text.startsWith('[') || text.startsWith('{')) {
            content = JSON.parse(text);
        } else {
            const parsed = Papa.parse(text, {
                header: true,
                delimiter: text.includes(';') ? ';' : ',',
                skipEmptyLines: true
            });
            content = parsed.data;
        }

        res.json(content);
    } catch (err) {
        console.error('❌ Erro ao buscar arquivo:', err.message);
        res.status(500).send('Erro ao buscar arquivo: ' + err.message);
    }
}

async function buscarDadosBateria(nomeClinica) {
    try {
        // Normaliza o nome da clínica para o formato do arquivo
        const nomeArquivo = `${nomeClinica.toLowerCase().replace(/\s+/g, '-').replace(/ú/g, 'u')}-battery-data.json`;
        
        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: `clinicas/${nomeArquivo}`
        };

        console.log(`🔋 Buscando dados de bateria no S3: ${params.Bucket}/${params.Key}`);

        const command = new GetObjectCommand(params);
        const data = await s3Client.send(command);
        const text = await data.Body.transformToString('utf-8');

        let content;
        if (text.startsWith('[') || text.startsWith('{')) {
            content = JSON.parse(text);
        } else {
            // Parse CSV
            const parsed = Papa.parse(text, {
                header: true,
                delimiter: text.includes(';') ? ';' : ',',
                skipEmptyLines: true,
                dynamicTyping: true
            });
            content = parsed.data;
        }

        // Normalizar formato: Array de {device_id, battery_level}
        if (Array.isArray(content)) {
            return content.map(item => ({
                device_id: item.device_id || item.dispositivo_uuid || item.uuid,
                battery_level: parseFloat(item.battery_level || item.nivel_bateria || item.bateria || 50)
            }));
        }

        console.warn('⚠️ Formato de dados de bateria inesperado, retornando array vazio');
        return [];

    } catch (err) {
        console.warn(`⚠️ Erro ao buscar dados de bateria do S3: ${err.message}`);
        console.warn('Usando valores padrão de bateria (50%)');
        return []; // Retorna vazio, será tratado com valor padrão
    }
}

module.exports = {
    lerArquivo,
    buscarDadosBateria
};
