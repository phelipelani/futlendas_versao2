// Arquivo: src/routes/campeonatoPartidaRoutes.js
import { Router } from 'express';
import {
  getPartidasDoCampeonato,
  updateResultadoPartida,
  getPartidasDaRodada,
  finalizarPartida,
  getEventosPartida,
} from '../controllers/campeonatoPartidaController.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import { param, body } from 'express-validator';

const router = Router();

/* ========================================================================== */
/*                                 VALIDAÇÕES                                 */
/* ========================================================================== */

const validateCampId = [param('campeonato_id').isInt()];
const validatePartidaId = [param('partida_id').isInt()];
const validateRodadaId = [param('rodada_id').isInt({ min: 1 })];

const validateResultado = [
  ...validatePartidaId,
  body('placar_timeA').isInt(),
  body('placar_timeB').isInt(),
];

/* ========================================================================== */
/*                                    ROTAS                                   */
/* ========================================================================== */
/* 
   IMPORTANTE: Essas rotas são montadas em '/campeonato-partidas' no app.js
   Portanto as URLs finais serão:
   - /campeonato-partidas/:campeonato_id/partidas
   - /campeonato-partidas/partidas/:partida_id/resultado
   - /campeonato-partidas/rodada/:rodada_id/partidas
   - /campeonato-partidas/partidas/:partida_id/eventos
*/

// Lista partidas do campeonato
// URL final: /campeonato-partidas/:campeonato_id/partidas
router.get(
  '/:campeonato_id/partidas',
  validateCampId,
  getPartidasDoCampeonato
);

// Salva resultado da partida (campeonato)
// URL final: /campeonato-partidas/partidas/:partida_id/resultado
router.put(
  '/partidas/:partida_id/resultado',
  isAdmin,
  validateResultado,
  updateResultadoPartida
);

// Lista partidas de uma rodada específica
// URL final: /campeonato-partidas/rodada/:rodada_id/partidas
router.get(
  '/rodada/:rodada_id/partidas',
  validateRodadaId,
  getPartidasDaRodada
);

// ✅ NOVA ROTA: Buscar eventos (gols, assistências) de uma partida
// URL final: /campeonato-partidas/partidas/:partida_id/eventos
router.get(
  '/partidas/:partida_id/eventos',
  validatePartidaId,
  getEventosPartida
);

// Finaliza partida do campeonato (versão mais completa)
// URL final: /campeonato-partidas/:partida_id/resultados
router.put(
  '/:partida_id/resultados',
  isAdmin,
  validatePartidaId,
  finalizarPartida
);

export default router;