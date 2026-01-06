// src/routes/uploadAvatarRoutes.js
import { Router } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { s3Client, BUCKET_NAME, getPublicUrl } from "../utils/s3Client.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

/**
 * POST /api/upload/avatar
 * Recebe um arquivo GLB (campo 'avatar') e envia ao S3. Retorna { url }
 */
router.post("/", upload.single("avatar"), async (req, res, next) => {
  try {
    console.log("📦 Upload de avatar iniciado");
    console.log("📁 Arquivo recebido:", req.file ? req.file.originalname : "Nenhum");

    if (!req.file) {
      console.error("❌ Nenhum arquivo enviado");
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    console.log("📊 Tamanho do arquivo:", req.file.size, "bytes");
    console.log("📝 Tipo MIME:", req.file.mimetype);

    const key = `avatars/${uuidv4()}.glb`;
    console.log("🔑 Key do S3:", key);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: "model/gltf-binary",
      // ✅ REMOVIDO: ACL: "public-read" 
      // O bucket deve ter permissão pública configurada diretamente
    });

    console.log("⬆️ Enviando para S3...");
    await s3Client.send(command);

    const url = getPublicUrl(key);
    console.log("✅ Upload concluído! URL:", url);

    return res.status(200).json({
      message: "Avatar enviado com sucesso.",
      url,
    });
  } catch (err) {
    console.error("❌ Erro no upload avatar:", err);
    console.error("Stack:", err.stack);
    
    return res.status(500).json({
      message: "Erro ao fazer upload do avatar",
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router;