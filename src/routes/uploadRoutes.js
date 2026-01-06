// Arquivo: src/routes/uploadRoutes.js
import { Router } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { s3Client, BUCKET_NAME, getPublicUrl } from '../utils/s3Client.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @swagger
 * /upload/foto:
 *   post:
 *     summary: Upload de foto de jogador (Admin)
 *     description: >
 *       Faz o upload de uma imagem de jogador para um bucket S3.
 *       A rota valida o tipo de arquivo (JPG, PNG, WEBP) e o tamanho (máximo de 5MB).
 *       Se o upload for bem-sucedido, a API retorna a URL pública e permanente da imagem, que pode ser usada para associar a um jogador.
 *       Requer permissão de administrador.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - foto
 *             properties:
 *               foto:
 *                 type: string
 *                 format: binary
 *                 description: "Arquivo de imagem a ser enviado. Tipos permitidos: JPG, PNG, WEBP. Tamanho máximo: 5MB."
 *     responses:
 *       200:
 *         description: Upload realizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Upload realizado com sucesso!"
 *                 url:
 *                   type: string
 *                   format: url
 *                   description: URL pública da imagem no S3.
 *                   example: "https://seubucket.s3.sua-regiao.amazonaws.com/jogadores/arquivo-unico.jpg"
 *       400:
 *         description: "Requisição inválida: nenhum arquivo foi enviado ou o tipo de arquivo não é suportado."
 *       401:
 *         description: "Não autenticado: o token de acesso está ausente ou é inválido."
 *       403:
 *         description: "Acesso negado: o usuário não tem permissão de administrador."
 *       413:
 *         description: "Arquivo muito grande: o tamanho do arquivo excede o limite de 5MB."
 *       500:
 *         description: "Erro interno do servidor ao processar o upload."
 */
router.post('/foto', isAdmin, upload.single('foto' ), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    const fileExtension = path.extname(req.file.originalname);
    const fileName = `jogadores/${uuidv4()}${fileExtension}`;

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    const publicUrl = getPublicUrl(fileName);

    res.status(200).json({
      message: 'Upload realizado com sucesso!',
      url: publicUrl,
    });

  } catch (error) {
    // O middleware de erro global (se houver) pode lidar com isso,
    // mas o tratamento específico aqui também é válido.
    // O erro do multer é passado para o 'next' pelo próprio multer.
    // Este bloco 'catch' pegaria outros erros inesperados.
    console.error('Erro no controller de upload:', error);
    next(error); // Passa o erro para o manipulador de erros global
  }
});

export default router;
