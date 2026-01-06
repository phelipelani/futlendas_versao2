// ============================================================================
// ARQUIVO: src/controllers/faseGruposController.js
// Controller para gerenciar fase de grupos e mata-mata
// ============================================================================

import * as faseGruposModel from '../models/faseGruposModel.js';

export const iniciarFaseGrupos = async (req, res, next) => {
  try {
    const { campeonato_id } = req.params;
    const result = await faseGruposModel.gerarPartidasFaseGrupos(Number(campeonato_id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPartidasFaseGrupos = async (req, res, next) => {
  try {
    const { campeonato_id } = req.params;
    const partidas = await faseGruposModel.getPartidasFaseGrupos(Number(campeonato_id));
    res.json(partidas);
  } catch (error) {
    next(error);
  }
};

export const finalizarFaseGrupos = async (req, res, next) => {
  try {
    const { campeonato_id } = req.params;
    const result = await faseGruposModel.finalizarFaseGruposEGerarMataAMata(Number(campeonato_id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getClassificacao = async (req, res, next) => {
  try {
    const { campeonato_id } = req.params;
    const classificacao = await faseGruposModel.getClassificacaoFaseGrupos(Number(campeonato_id));
    res.json(classificacao);
  } catch (error) {
    next(error);
  }
};

export const getBracket = async (req, res, next) => {
  try {
    const { campeonato_id } = req.params;
    const bracket = await faseGruposModel.getBracketMataAMata(Number(campeonato_id));
    res.json(bracket);
  } catch (error) {
    next(error);
  }
};

export const avancarMataAMata = async (req, res, next) => {
  try {
    const { campeonato_id } = req.params;
    const result = await faseGruposModel.avancarMataAMata(Number(campeonato_id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ARQUIVO: src/routes/faseGruposRoutes.js
// Rotas para fase de grupos e mata-mata
// ============================================================================

/*
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
*/

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