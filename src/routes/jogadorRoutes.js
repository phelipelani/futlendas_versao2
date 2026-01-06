// Arquivo: src/routes/jogadorRoutes.js
import { Router } from 'express';
import {
  createJogador,
  getAllJogadores,
  getJogadorById,
  getJogadoresByRodada,
  updateJogadorDetails,
  deleteJogador,
  updateAvatar,
  getPerfilCompleto, // <--- IMPORTADO
  syncPorNomes
} from '../controllers/jogadorController.js';

import { isAdmin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js'; // <--- SEU MIDDLEWARE DE UPLOAD
import { body, param } from 'express-validator';

const router = Router();

const validateParamId = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido.'),
];

/* --- ROTAS NOVAS E AJUSTADAS --- */

// Perfil Completo (Dados + Analytics)
router.get('/:id/perfil-completo', validateParamId, getPerfilCompleto);

// Avatar Inteligente (Aceita arquivo OU url no body)
// O middleware 'upload.single' processa se vier arquivo. Se não vier, o controller lê o body.
router.put('/:id/avatar', validateParamId, upload.single('avatar'), updateAvatar);

/* --- ROTAS PADRÃO (MANTIDAS) --- */

router.get('/', getAllJogadores);
router.post('/', isAdmin, createJogador); // Adicione suas validações aqui se quiser
router.get('/:id', validateParamId, getJogadorById);
router.delete('/:id', isAdmin, validateParamId, deleteJogador);
router.put('/:id/details', isAdmin, validateParamId, updateJogadorDetails);
router.get('/rodada/:rodada_id', getJogadoresByRodada);
router.post('/sync-por-nomes', syncPorNomes);

export default router;