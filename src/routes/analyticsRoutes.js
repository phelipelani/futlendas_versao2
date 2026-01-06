// Arquivo: src/routes/analyticsRoutes.js
import { Router } from 'express';
import * as AnalyticsController from '../controllers/analyticsController.js';

const router = Router();

/* ==========================================================================
   VISÃO PANORÂMICA (GERAL)
   GET /api/analytics/panoramica
========================================================================== */
router.get('/panoramica', AnalyticsController.getPanoramica);

/* ==========================================================================
   RANKING GERAL
   GET /api/analytics/ranking
========================================================================== */
router.get('/ranking', AnalyticsController.getRanking);

/* ==========================================================================
   MELHORES DUPLAS
   GET /api/analytics/duplas
========================================================================== */
router.get('/duplas', AnalyticsController.getDuplas);

/* ==========================================================================
   PERFIL COMPLETO DO JOGADOR
   GET /api/analytics/jogador/:jogador_id
========================================================================== */
router.get('/jogador/:jogador_id', AnalyticsController.getJogador);

/* ==========================================================================
   CONFRONTO DIRETO (RIVALIDADES)
   GET /api/analytics/confronto/:jogadorA_id/:jogadorB_id
========================================================================== */
router.get('/confronto/:jogadorA_id/:jogadorB_id', AnalyticsController.getConfronto);

/* ==========================================================================
   STATS COMPLETOS DO TIME
   GET /api/analytics/time/:time_id
========================================================================== */
router.get('/time/:time_id', AnalyticsController.getTime);

/* ==========================================================================
   SINERGIA DO JOGADOR (INDIVIDUAL)
   GET /api/analytics/sinergia/:jogador_id
========================================================================== */
router.get('/sinergia/:jogador_id', AnalyticsController.getSinergiaJogador);

/* ==========================================================================
   SINERGIA GERAL (RANKINGS DE DUPLAS)
   GET /api/analytics/sinergia
========================================================================== */
router.get('/sinergia', AnalyticsController.getSinergiaGeral);

export default router;