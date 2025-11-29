const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const Papa = require('papaparse');

const s3Client = new S3Client({
    region: process.env.AWS_REGION
});

async function lerArquivo(req, res) {
    try {
        const fileKey = req.params.arquivo;

        if (!/^[\w.\-]+$/.test(fileKey)) {
            return res.status(400).send('❌ Nome de arquivo inválido.');
        }

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

module.exports = {
    lerArquivo
};
