import { Router } from 'express';
import {
  getEstatisticas,
  getDashboardStats,
  getArtilharia,
  getAssistencias,
  getPremios,
} from '../controllers/statsController.js';
import { getHallDaFama } from '../controllers/hallDaFamaController.js';

const router = Router();

/* -------------------------------------------------------------------------- */
/*                                 SWAGGER DOCS                                */
/* -------------------------------------------------------------------------- */

/**
 * @swagger
 * components:
 *   parameters:
 *     LigaIdQuery:
 *       in: query
 *       name: liga_id
 *       schema:
 *         type: integer
 *       description: "(Opcional) ID da liga para filtrar as estatísticas."
 *       example: 1
 *
 *   schemas:
 *     StatsGeraisJogador:
 *       type: object
 *       properties:
 *         jogador_id: { type: integer, example: 10 }
 *         nome: { type: string, example: "Gabigol" }
 *         vitorias: { type: integer, example: 15 }
 *         derrotas: { type: integer, example: 5 }
 *         empates: { type: integer, example: 3 }
 *         gols: { type: integer, example: 25 }
 *         assistencias: { type: integer, example: 12 }
 *         gols_contra: { type: integer, example: 1 }
 *         clean_sheets: { type: integer, example: 4 }
 *         total_pontos: { type: number, example: 150.5 }
 *
 *     RankingArtilharia:
 *       type: object
 *       properties:
 *         jogador_id: { type: integer, example: 10 }
 *         nome: { type: string, example: "Gabigol" }
 *         total_gols: { type: integer, example: 25 }
 *
 *     RankingAssistencias:
 *       type: object
 *       properties:
 *         jogador_id: { type: integer, example: 12 }
 *         nome: { type: string, example: "Arrascaeta" }
 *         total_assistencias: { type: integer, example: 18 }
 *
 *     RankingPremios:
 *       type: object
 *       properties:
 *         jogador_id: { type: integer, example: 10 }
 *         nome: { type: string, example: "Gabigol" }
 *         mvp: { type: integer, example: 5 }
 *         pe_de_rato: { type: integer, example: 1 }
 *         artilheiro_rodada: { type: integer, example: 3 }
 *         assist_rodada: { type: integer, example: 2 }
 */

/* -------------------------------------------------------------------------- */
/*                                    ROTAS                                   */
/* -------------------------------------------------------------------------- */

/**
 * @swagger
 * /estatisticas:
 *   get:
 *     summary: Ranking geral de jogadores
 *     tags: [Estatísticas]
 */
router.get('/', getEstatisticas);

/**
 * @swagger
 * /estatisticas/dashboard:
 *   get:
 *     summary: Estatísticas para o Dashboard
 *     tags: [Estatísticas]
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /estatisticas/artilharia:
 *   get:
 *     summary: Ranking de artilharia
 *     tags: [Estatísticas]
 */
router.get('/artilharia', getArtilharia);

/**
 * @swagger
 * /estatisticas/assistencias:
 *   get:
 *     summary: Ranking de assistências
 *     tags: [Estatísticas]
 */
router.get('/assistencias', getAssistencias);

/**
 * @swagger
 * /estatisticas/premios:
 *   get:
 *     summary: Ranking de prêmios
 *     tags: [Estatísticas]
 */
router.get('/premios', getPremios);

router.get('/hall-da-fama', getHallDaFama);

export default router;
