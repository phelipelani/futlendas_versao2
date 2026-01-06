import { Router } from 'express';
import {
  getStatsGoleirosLiga,
  getStatsGoleirosCampeonato,
} from '../controllers/goleiroStatsController.js';
import { param } from 'express-validator';

const router = Router();

// Validação para o ID do campeonato
const validateCampId = [
  param('campeonato_id')
    .isInt({ min: 1 })
    .withMessage('O ID do campeonato é inválido.'),
];

/**
 * @swagger
 * components:
 *   schemas:
 *     GoleiroStats:
 *       type: object
 *       description: "Schema com as estatísticas de desempenho de um goleiro."
 *       properties:
 *         jogador_id:
 *           type: integer
 *           description: "ID do jogador (goleiro)."
 *           example: 5
 *         nome_goleiro:
 *           type: string
 *           description: "Nome do goleiro."
 *           example: "Alisson Becker"
 *         total_jogos:
 *           type: integer
 *           description: "Número total de partidas jogadas como goleiro."
 *           example: 10
 *         total_gols_sofridos:
 *           type: integer
 *           description: "Número total de gols sofridos."
 *           example: 8
 *         total_vitorias:
 *           type: integer
 *           description: "Número de partidas vencidas como goleiro."
 *           example: 6
 *         total_derrotas:
 *           type: integer
 *           description: "Número de partidas perdidas como goleiro."
 *           example: 2
 *         total_segundos_jogados:
 *           type: integer
 *           description: "Tempo total em segundos jogado."
 *           example: 5400
 *         total_minutos_jogados:
 *           type: number
 *           format: float
 *           description: "Tempo total em minutos jogado."
 *           example: 90.00
 *         media_gols_sofridos_por_minuto:
 *           type: number
 *           format: float
 *           description: "Média de gols sofridos por minuto."
 *           example: 0.09
 */

/**
 * @swagger
 * /goleiro-stats/liga:
 *   get:
 *     summary: Estatísticas dos goleiros por Liga
 *     description: "Retorna ranking dos goleiros que jogaram na liga, ordenado pela melhor média de gols sofridos."
 *     tags: [Estatísticas de Goleiros]
 *     parameters:
 *       - in: query
 *         name: liga_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da liga
 *         example: 1
 *     responses:
 *       200:
 *         description: Ranking retornado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GoleiroStats'
 *       400:
 *         description: "O query parameter 'liga_id' é obrigatório."
 */
router.get('/liga', getStatsGoleirosLiga);

/**
 * @swagger
 * /goleiro-stats/campeonato/{campeonato_id}:
 *   get:
 *     summary: Estatísticas dos goleiros por Campeonato
 *     description: "Retorna ranking de goleiros do campeonato, ordenado pela melhor média de gols sofridos."
 *     tags: [Estatísticas de Goleiros]
 *     parameters:
 *       - in: path
 *         name: campeonato_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do campeonato
 *         example: 1
 *     responses:
 *       200:
 *         description: Ranking retornado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GoleiroStats'
 *       400:
 *         description: "ID do campeonato inválido."
 *       404:
 *         description: "Campeonato não encontrado."
 */
router.get('/campeonato/:campeonato_id', validateCampId, getStatsGoleirosCampeonato);

export default router;
