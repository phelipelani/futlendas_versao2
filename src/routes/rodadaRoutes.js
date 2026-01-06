// Arquivo: src/routes/rodadaRoutes.js
import { Router } from 'express';
import {
  createRodada,
  createPartidaNaRodada,
  finalizarRodada,
  getRodadasByLiga,
  syncJogadoresDaRodada,
  getJogadoresDaRodada,
  createRodadaCampeonato,
  getRodadasByCampeonato,
  getElencoRodada,
  substituirJogadorRodada,
  saveTimes,
  getTimes,
  getResultadosDaRodada,
  updateRodada,
  deleteRodada,
  getRodadaById,
} from '../controllers/rodadaController.js';

import { isAdmin } from '../middleware/authMiddleware.js';
import { body, param } from 'express-validator';

const router = Router();

/* ========================================================================== */
/*                                 VALIDAÇÕES                                 */
/* ========================================================================== */

const validateParamLigaId = [
  param('liga_id')
    .isInt({ min: 1 })
    .withMessage('O ID da liga é inválido.'),
];

const validateParamRodadaId = [
  param('rodada_id')
    .isInt({ min: 1 })
    .withMessage('O ID da rodada é inválido.'),
];

const validateParamCampeonatoId = [
  param('campeonato_id')
    .isInt({ min: 1 })
    .withMessage('O ID do campeonato é inválido.'),
];

const validateData = [
  body('data')
    .isISO8601()
    .withMessage('Data inválida (formato ISO8601).'),
];

const validateCreateRodada = [...validateParamLigaId, ...validateData];

const validateSyncJogadores = [
  ...validateParamRodadaId,
  body('nomes')
    .isArray({ min: 1 })
    .withMessage('A lista de nomes é obrigatória.'),
];

const validateUpdateRodada = [
  ...validateParamRodadaId,
  body('data')
    .isISO8601()
    .withMessage('Nova data inválida (formato ISO8601).'),
];

const validateSaveTimes = [
  ...validateParamRodadaId,
  body('times')
    .isArray({ min: 1 })
    .withMessage('A lista de times é obrigatória.'),

  body('times.*.nome')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('O nome do time deve ser uma string não vazia.'),

  body('times.*.jogadores')
    .isArray()
    .withMessage('Cada time deve ter uma lista de jogadores.'),

  body('times.*.jogadores.*.id')
    .isInt({ min: 1 })
    .withMessage('ID de jogador inválido.'),
];

/* ========================================================================== */
/*                            ROTAS — LIGA                                     */
/* ========================================================================== */

/**
 * @swagger
 * /rodadas/liga/{liga_id}:
 *   get:
 *     summary: Listar rodadas de uma liga
 *     tags: [Rodadas]
 *   post:
 *     summary: Criar nova rodada (Admin)
 *     tags: [Rodadas]
 */
router.get('/liga/:liga_id', validateParamLigaId, getRodadasByLiga);
router.post('/liga/:liga_id', isAdmin, validateCreateRodada, createRodada);

/* ========================================================================== */
/*                         UPDATE / DELETE RODADA                              */
/* ========================================================================== */

router.put('/:rodada_id', isAdmin, validateUpdateRodada, updateRodada);
router.delete('/:rodada_id', isAdmin, validateParamRodadaId, deleteRodada);

/* ========================================================================== */
/*                         ROTAS — CAMPEONATO                                  */
/* ========================================================================== */

/**
 * @swagger
 * /rodadas/campeonato/{campeonato_id}:
 *   get:
 *     summary: Listar rodadas do campeonato
 *   post:
 *     summary: Criar rodada de campeonato (Admin)
 */
router.get('/campeonato/:campeonato_id', validateParamCampeonatoId, getRodadasByCampeonato);
router.post('/campeonato/:campeonato_id', isAdmin, validateParamCampeonatoId, validateData, createRodadaCampeonato);

/* ========================================================================== */
/*                       ELENCO — GET / SUBSTITUIÇÃO                           */
/* ========================================================================== */

/**
 * @swagger
 * /rodadas/{rodada_id}/elenco:
 */
router.get('/:rodada_id/elenco', validateParamRodadaId, getElencoRodada);

/**
 * @swagger
 * /rodadas/{rodada_id}/substituicao:
 */
router.post('/:rodada_id/substituicao', isAdmin, validateParamRodadaId, substituirJogadorRodada);

/* ========================================================================== */
/*                           JOGADORES DA RODADA                               */
/* ========================================================================== */

router.get('/:rodada_id/jogadores', validateParamRodadaId, getJogadoresDaRodada);

router.post('/:rodada_id/sync-jogadores', isAdmin, validateSyncJogadores, syncJogadoresDaRodada);

/* ========================================================================== */
/*                          TIMES — GET / POST                                 */
/* ========================================================================== */

router.get('/:rodada_id/times', validateParamRodadaId, getTimes);

router.post('/:rodada_id/times', isAdmin, validateSaveTimes, saveTimes);

/* ========================================================================== */
/*                           PARTIDAS DA RODADA                                */
/* ========================================================================== */

router.post(
  '/:rodada_id/partidas',
  isAdmin,
  validateParamRodadaId,
  createPartidaNaRodada
);

/* ========================================================================== */
/*                           FINALIZAR RODADA                                  */
/* ========================================================================== */

router.post('/:rodada_id/finalizar', isAdmin, validateParamRodadaId, finalizarRodada);

/* ========================================================================== */
/*                         RESULTADOS COMPLETOS                                */
/* ========================================================================== */

router.get('/:rodada_id/resultados', validateParamRodadaId, getResultadosDaRodada);

router.get("/:id", getRodadaById);

export default router;
