import { Router } from 'express';
import {
  createLiga,
  getAllLigas,
  getLigaById,
  updateLiga,
  deleteLiga,
  finalizarLiga,
} from '../controllers/ligaController.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import { body, param } from 'express-validator';

const router = Router();

/* ----------------------------- Validações ----------------------------- */

const validateParamId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('O ID da liga é inválido.'),
];

const validateCreateLiga = [
  body('nome').notEmpty().trim().withMessage('O nome é obrigatório.'),
  body('data_inicio')
    .isISO8601()
    .withMessage('Data de início inválida (YYYY-MM-DD).'),
  body('data_fim')
    .isISO8601()
    .withMessage('Data de fim inválida (YYYY-MM-DD).'),
];

const validateUpdateLiga = [
  ...validateParamId,
  body('nome')
    .optional()
    .notEmpty()
    .trim()
    .withMessage('Nome não pode ser vazio.'),
  body('data_inicio')
    .optional()
    .isISO8601()
    .withMessage('Data de início inválida (YYYY-MM-DD).'),
  body('data_fim')
    .optional()
    .isISO8601()
    .withMessage('Data de fim inválida (YYYY-MM-DD).'),
];

/* ------------------------------ Rotas Swagger ------------------------------ */

/**
 * @swagger
 * /ligas:
 *   post:
 *     summary: Criar nova liga (Admin)
 *     description: Cria uma nova liga no sistema.
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - data_inicio
 *               - data_fim
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Liga de Verão 2025"
 *               data_inicio:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *               data_fim:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-30"
 *     responses:
 *       201:
 *         description: Liga criada com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       401:
 *         description: Não autenticado.
 *       403:
 *         description: Acesso negado.
 *   get:
 *     summary: Listar todas as ligas
 *     description: Retorna todas as ligas cadastradas.
 *     tags: [Ligas]
 *     responses:
 *       200:
 *         description: Lista retornada com sucesso.
 */
router.post('/', isAdmin, validateCreateLiga, createLiga);
router.get('/', getAllLigas);

/**
 * @swagger
 * /ligas/{id}:
 *   get:
 *     summary: Buscar liga por ID
 *     tags: [Ligas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Liga encontrada.
 *       404:
 *         description: Liga não encontrada.
 *   put:
 *     summary: Atualizar liga (Admin)
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               data_fim:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Liga atualizada.
 *   delete:
 *     summary: Deletar liga (Admin)
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liga deletada.
 */
router.get('/:id', validateParamId, getLigaById);
router.put('/:id', isAdmin, validateUpdateLiga, updateLiga);
router.delete('/:id', isAdmin, validateParamId, deleteLiga);

/**
 * @swagger
 * /ligas/{id}/finalizar:
 *   post:
 *     summary: Finalizar liga (Admin)
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liga finalizada.
 */
router.post('/:id/finalizar', isAdmin, validateParamId, finalizarLiga);

export default router;
