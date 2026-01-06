import { Router } from 'express';
import * as controller from '../controllers/faseGruposController.js';

const router = Router();

// Fase de Grupos
router.post('/:campeonato_id/fase-grupos/iniciar', controller.iniciarFaseGrupos);
router.get('/:campeonato_id/fase-grupos/partidas', controller.getPartidasFaseGrupos);
router.get('/:campeonato_id/fase-grupos/classificacao', controller.getClassificacao);
router.post('/:campeonato_id/fase-grupos/finalizar', controller.finalizarFaseGrupos);

// Mata-Mata
router.get('/:campeonato_id/mata-mata/bracket', controller.getBracket);
router.post('/:campeonato_id/mata-mata/avancar', controller.avancarMataAMata);

export default router;


// ============================================================================
// ADICIONAR AO campeonatoRoutes.js EXISTENTE:
// ============================================================================
/*
// Adicione estas importações:
import * as faseGruposController from '../controllers/faseGruposController.js';

// Adicione estas rotas ao router existente:
router.post('/:campeonato_id/fase-grupos/iniciar', faseGruposController.iniciarFaseGrupos);
router.get('/:campeonato_id/fase-grupos/partidas', faseGruposController.getPartidasFaseGrupos);
router.get('/:campeonato_id/fase-grupos/classificacao', faseGruposController.getClassificacao);
router.post('/:campeonato_id/fase-grupos/finalizar', faseGruposController.finalizarFaseGrupos);
router.get('/:campeonato_id/mata-mata/bracket', faseGruposController.getBracket);
router.post('/:campeonato_id/mata-mata/avancar', faseGruposController.avancarMataAMata);
*/


























































































































































































































