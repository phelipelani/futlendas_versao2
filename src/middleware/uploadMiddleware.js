// Arquivo: src/middleware/uploadMiddleware.js
import multer from 'multer';

// Configuração do Multer para armazenamento em memória
const storage = multer.memoryStorage();

// Filtro para aceitar imagens E modelos 3D
const fileFilter = (req, file, cb) => {
  // Tipos MIME aceitos
  const allowedMimes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp',
    // ✅ ADICIONADO: Tipos para modelos 3D
    'model/gltf-binary',           // GLB
    'application/octet-stream',    // Fallback para GLB
  ];
  
  console.log('📝 Verificando arquivo:', file.originalname);
  console.log('📝 MIME type:', file.mimetype);
  
  if (allowedMimes.includes(file.mimetype)) {
    console.log('✅ Tipo aceito!');
    cb(null, true);
  } else {
    console.log('❌ Tipo rejeitado!');
    cb(new Error('Tipo de arquivo inválido. Apenas JPG, PNG, WEBP e GLB são permitidos.'), false);
  }
};

// Configuração do Multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // ✅ AUMENTADO: 10MB (avatares GLB são maiores que fotos)
  },
});