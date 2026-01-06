// Arquivo: src/routes/partidaRoutes.js
import { Router } from 'express';
import { isAdmin } from '../middleware/authMiddleware.js';

// Importamos do NOVO controller que criamos (Gerenciamento Avançado)
import {
  listarPartidas,      // Substitui o antigo listarPartidasGlobais (agora com filtros)
  getDetalhesEdicao,   // Substitui o antigo getDetalhes
  editarPartida,       // Substitui o updateResultadosPartida
  excluirPartida       // Nova funcionalidade
} from '../controllers/partidaManagementController.js';

const router = Router();

/* -------------------------------------------------------------------------- */
/* ROTAS                                     */
/* -------------------------------------------------------------------------- */

/**
 * @swagger
 * /partidas/globais:
 * get:
 * summary: Lista histórico unificado (Ligas + Campeonatos) com Filtros
 * parameters:
 * - in: query
 * name: campeonato_id
 * - in: query
 * name: rodada_id
 * tags: [Partidas]
 */
router.get('/globais', listarPartidas);

/**
 * @swagger
 * /partidas/{id}/detalhes:
 * get:
 * summary: Buscar detalhes completos da partida (incluindo eventos e elenco)
 * tags: [Partidas]
 */
router.get('/:id/detalhes', getDetalhesEdicao);

/**
 * @swagger
 * /partidas/{id}:
 * put:
 * summary: Editar resultado e eventos de uma partida já finalizada (Admin)
 * tags: [Partidas]
 */
router.put('/:id', isAdmin, editarPartida);

/**
 * @swagger
 * /partidas/{id}:
 * delete:
 * summary: Excluir partida e reverter estatísticas (Admin)
 * tags: [Partidas]
 */
router.delete('/:id', isAdmin, excluirPartida);

export default router;