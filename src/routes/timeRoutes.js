import { Router } from 'express';
import {
  createTime,
  updateJogadorRole,
  getAllTimes,
  getTimeById,
  getJogadoresDoTime,
  addJogadoresAoTime,
  removeJogadorDoTime,
  updateTime,
  deleteTime,
} from '../controllers/timeController.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import { body, param } from 'express-validator';

const router = Router();

/* -------------------------------------------------------------------------- */
/*                                   VALIDAR                                  */
/* -------------------------------------------------------------------------- */

const validateTimeId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('O ID do time é inválido.'),
];

const validateJogadorId = [
  param('jogador_id')
    .isInt({ min: 1 })
    .withMessage('O ID do jogador é inválido.'),
];

const validateCreate = [
  body('nome')
    .notEmpty()
    .trim()
    .withMessage('O nome do time é obrigatório.'),
];

const validateUpdate = [
  ...validateTimeId,
  body('nome').optional().notEmpty().trim(),
  body('logo_url').optional().isURL(),
];

const validateAddJogadores = [
  ...validateTimeId,
  body('jogador_ids')
    .isArray({ min: 1 })
    .withMessage('A lista de IDs de jogadores é obrigatória.'),
];

/* -------------------------------------------------------------------------- */
/*                                ROTAS SWAGGER                               */
/* -------------------------------------------------------------------------- */

/**
 * @swagger
 * /times:
 *   get:
 *     summary: Listar todos os times fixos
 *     description: Retorna a lista completa de times fixos cadastrados no sistema.
 *     tags: [Times]
 *     responses:
 *       200:
 *         description: Lista de times retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TimeFixo'
 *
 *   post:
 *     summary: Criar novo time fixo (Admin)
 *     description: Cadastra um novo time fixo no sistema, que poderá ser usado em campeonatos.
 *     tags: [Times]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimeFixoInput'
 *     responses:
 *       201:
 *         description: Time criado com sucesso.
 *       400:
 *         description: "Dados inválidos (ex: nome faltando)."
 *       401:
 *         description: Não autenticado.
 *       403:
 *         description: Acesso negado.
 *       409:
 *         description: "Conflito: Um time com este nome já existe."
 */
router.get('/', getAllTimes);
router.post('/', isAdmin, validateCreate, createTime);

/**
 * @swagger
 * /times/{id}:
 *   get:
 *     summary: Buscar time por ID
 *     description: Retorna os detalhes de um time fixo específico.
 *     tags: [Times]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Time encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimeFixo'
 *       404:
 *         description: Time não encontrado.
 *
 *   put:
 *     summary: Atualizar time (Admin)
 *     description: Atualiza o nome e/ou logotipo do time.
 *     tags: [Times]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimeFixoUpdateInput'
 *     responses:
 *       200:
 *         description: Time atualizado com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       401:
 *         description: Não autenticado.
 *       403:
 *         description: Acesso negado.
 *       404:
 *         description: Time não encontrado.
 *       409:
 *         description: "Conflito: já existe outro time com este nome."
 */
router.get('/:id', validateTimeId, getTimeById);
router.put('/:id', isAdmin, validateUpdate, updateTime);

/**
 * @swagger
 * /times/{id}/jogadores:
 *   get:
 *     summary: Listar jogadores do time
 *     description: Retorna todos os jogadores vinculados a um time.
 *     tags: [Times]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de jogadores retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Jogador'
 *
 *   post:
 *     summary: Adicionar jogadores ao time (Admin)
 *     description: Adiciona um ou mais jogadores a um time. Jogadores já existentes são ignorados.
 *     tags: [Times]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimeAddJogadoresInput'
 *     responses:
 *       200:
 *         description: Jogadores adicionados com sucesso.
 *       400:
 *         description: Lista de IDs inválida.
 *       401:
 *         description: Não autenticado.
 *       403:
 *         description: Acesso negado.
 *       404:
 *         description: Time não encontrado.
 */
router.get('/:id/jogadores', validateTimeId, getJogadoresDoTime);
router.post('/:id/jogadores', isAdmin, validateAddJogadores, addJogadoresAoTime);

/**
 * @swagger
 * /times/{id}/jogadores/{jogador_id}:
 *   delete:
 *     summary: Remover jogador do time (Admin)
 *     description: Remove a vinculação entre um jogador e o time.
 *     tags: [Times]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *       - in: path
 *         name: jogador_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Jogador removido com sucesso.
 *       401:
 *         description: Não autenticado.
 *       403:
 *         description: Acesso negado.
 *       404:
 *         description: Associação não encontrada.
 */
router.delete(
  '/:id/jogadores/:jogador_id',
  isAdmin,
  [...validateTimeId, ...validateJogadorId],
  removeJogadorDoTime
);

/**
 * @swagger
 * /times/{id}/jogadores/{jogador_id}/role:
 *   put:
 *     summary: Atualizar papel do jogador (Capitão / Pé-de-rato)
 *     description: Permite alterar se o jogador é capitão ou pé-de-rato.
 *     tags: [Times]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id/jogadores/:jogador_id/role',
  isAdmin,
  [...validateTimeId, ...validateJogadorId],
  updateJogadorRole
);

/**
 * @swagger
 * /times/{id}:
 *   delete:
 *     summary: Remover time (Admin)
 *     description: Remove o time fixo definitivamente.
 *     tags: [Times]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', isAdmin, validateTimeId, deleteTime);

export default router;
