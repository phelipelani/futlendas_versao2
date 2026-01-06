// Arquivo: src/utils/s3Client.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'; // <--- ADICIONADO PutObjectCommand
import dotenv from 'dotenv';

dotenv.config();

// Configuração do cliente S3
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configurações do bucket
export const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
export const BUCKET_REGION = process.env.AWS_REGION;

// Função auxiliar para gerar URL pública da imagem
export const getPublicUrl = (key) => {
  return `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${key}`;
};

export async function uploadToS3(file, keyPrefix = "uploads") {
  // Pega a extensão do arquivo (funciona para .jpg, .mp4, .glb, etc)
  const ext = file.originalname.split('.').pop();
  
  // Gera um nome único com timestamp
  const key = `${keyPrefix}/${Date.now()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
    // ACL: 'public-read' // Se o bucket não for público por política, pode precisar disso
  });

  await s3Client.send(command);

  return getPublicUrl(key);
}