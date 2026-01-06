// Arquivo: src/routes/campeonatoRoutes.js
import { Router } from 'express';

import { upload } from '../middleware/uploadMiddleware.js';
import * as faseGruposController from '../controllers/faseGruposController.js';
import {
  getCampeonatos,
  uploadChampionPhoto,
  getCampeonatoById,
  createCampeonato,
  addVencedoresCampeonato,
  salvarPartidaLive,
  getStatsAvancadas,
  finalizarCampeonato,
  getTitulos,
  registerTimeNoCampeonato,
  getTimesDoCampeonato,
  updateCampeonatoStatus,
  iniciarCampeonato,
  avancarFaseCampeonato,
  avancarParaMataAMata,
  getBracket,
  criarTimesSorteio,           // ✅ NOVO
  getClassificacaoCampeonato,
  getEstatisticasJogadores,
  getCampeonatoPremios,
  createProximaPartidaCampeonato,
  updateCampeonatoDetails,
  deleteCampeonato,
  getRivalidades
} from '../controllers/campeonatoController.js';

import { listarPartidasDoCampeonato } from '../controllers/campeonatoPartidaController.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import { body, param } from 'express-validator';

const router = Router();

/* -------------------------------------------------------------------------- */
/*                                 VALIDAÇÕES                                 */
/* -------------------------------------------------------------------------- */

const validateParamCampId = [
  param('campeonato_id')
    .isInt({ min: 1 })
    .withMessage('O ID do campeonato é inválido.')
];

const validateCreateCampeonato = [
  body('nome')
    .notEmpty()
    .trim()
    .withMessage('O nome do campeonato é obrigatório.'),
  body('num_times')
    .optional()
    .isInt({ min: 2, max: 16 })
    .withMessage('Número de times deve ser entre 2 e 16.'),
  body('tem_fase_grupos')
    .optional()
    .isBoolean(),
  body('fase_grupos_ida_volta')
    .optional()
    .isBoolean(),
  body('tem_repescagem')
    .optional()
    .isBoolean(),
  body('tem_terceiro_lugar')
    .optional()
    .isBoolean(),
  body('modo_selecao_times')
    .optional()
    .isIn(['fixo', 'sorteio'])
];

const validateUpdateDetails = [
  ...validateParamCampId,
  body('nome').optional().notEmpty().trim()
];

const validateUpdateStatus = [
  ...validateParamCampId,
  body('formato').optional().notEmpty()
];

const validateRegisterTime = [
  ...validateParamCampId,
  body('time_id').isInt({ min: 1 })
];

const validateAddVencedores = [
  ...validateParamCampId,
  body('jogadores_ids').isArray({ min: 1 })
];

const validateCreatePartida = [
  ...validateParamCampId,
  body('timeA_id').isInt(),
  body('timeB_id').isInt()
];

const validateCriarTimesSorteio = [
  ...validateParamCampId,
  body('times')
    .isArray({ min: 2 })
    .withMessage('É necessário pelo menos 2 times'),
  body('times.*.nome')
    .notEmpty()
    .withMessage('Nome do time é obrigatório'),
  body('times.*.jogadores')
    .isArray({ min: 1 })
    .withMessage('Cada time deve ter pelo menos 1 jogador'),
  body('jogadoresPorTime')
    .optional()
    .isInt({ min: 1 })
];

/* -------------------------------------------------------------------------- */
/*                                     ROTAS                                  */
/* -------------------------------------------------------------------------- */

/**
 * @swagger
 * /campeonatos:
 *   get:
 *     summary: Listar todos os campeonatos
 */
router.get('/', getCampeonatos);

/**
 * @swagger
 * /campeonatos:
 *   post:
 *     summary: Criar campeonato (Admin)
 */
router.post('/', isAdmin, validateCreateCampeonato, createCampeonato);

/**
 * @swagger
 * /campeonatos/rodada/{rodada_id}/partida:
 *   post:
 *     summary: Salvar partida ao vivo
 */
router.post('/rodada/:rodada_id/partida', isAdmin, salvarPartidaLive);

/**
 * @swagger
 * /campeonatos/titulos:
 *   get:
 *     summary: Listar títulos por jogador
 */
router.get('/titulos', getTitulos);

/**
 * @swagger
 * /campeonatos/{campeonato_id}:
 *   put:
 *     summary: Editar detalhes do campeonato
 */
router.put('/:campeonato_id', isAdmin, validateUpdateDetails, updateCampeonatoDetails);

/**
 * @swagger
 * /campeonatos/{campeonato_id}:
 *   delete:
 *     summary: Excluir campeonato
 */
router.delete('/:campeonato_id', isAdmin, validateParamCampId, deleteCampeonato);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/times:
 *   get:
 *     summary: Listar times do campeonato
 */
router.get('/:campeonato_id/times', validateParamCampId, getTimesDoCampeonato);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/times:
 *   post:
 *     summary: Registrar time no campeonato (Admin)
 */
router.post('/:campeonato_id/times', isAdmin, validateRegisterTime, registerTimeNoCampeonato);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/status:
 *   patch:
 *     summary: Atualizar status do campeonato
 */
router.patch('/:campeonato_id/status', isAdmin, validateUpdateStatus, updateCampeonatoStatus);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/iniciar:
 *   post:
 *     summary: Iniciar campeonato (gera fase de grupos ou mata-mata direto)
 */
router.post('/:campeonato_id/iniciar', isAdmin, validateParamCampId, iniciarCampeonato);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/criar-times-sorteio:
 *   post:
 *     summary: Criar times via sorteio e inscrever no campeonato
 */
router.post('/:campeonato_id/criar-times-sorteio', isAdmin, validateCriarTimesSorteio, criarTimesSorteio);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/avancar-mata-mata:
 *   post:
 *     summary: Avançar da fase de grupos para o mata-mata
 */
router.post('/:campeonato_id/avancar-mata-mata', isAdmin, validateParamCampId, avancarParaMataAMata);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/avancar-fase:
 *   post:
 *     summary: Avançar fase do mata-mata (semi → final, etc)
 */
router.post('/:campeonato_id/avancar-fase', isAdmin, validateParamCampId, avancarFaseCampeonato);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/bracket:
 *   get:
 *     summary: Buscar bracket/chaves do mata-mata
 */
router.get('/:campeonato_id/bracket', validateParamCampId, getBracket);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/partidas:
 *   post:
 *     summary: Criar próxima partida
 */
router.post(
  '/:campeonato_id/partidas',
  isAdmin,
  validateCreatePartida,
  createProximaPartidaCampeonato
);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/vencedores:
 *   post:
 *     summary: Registrar vencedores
 */
router.post('/:campeonato_id/vencedores', isAdmin, validateAddVencedores, addVencedoresCampeonato);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/classificacao:
 *   get:
 *     summary: Obter tabela de classificação
 */
router.get('/:campeonato_id/classificacao', validateParamCampId, getClassificacaoCampeonato);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/estatisticas-jogadores:
 *   get:
 *     summary: Estatísticas gerais dos jogadores
 */
router.get('/:campeonato_id/estatisticas-jogadores', validateParamCampId, getEstatisticasJogadores);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/premios:
 *   get:
 *     summary: Premiações do campeonato
 */
router.get('/:campeonato_id/premios', validateParamCampId, getCampeonatoPremios);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/stats-avancadas:
 *   get:
 *     summary: Estatísticas avançadas (jogadores, goleiros e times)
 */
router.get('/:campeonato_id/stats-avancadas', validateParamCampId, getStatsAvancadas);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/rivalidades:
 *   get:
 *     summary: Rivalidades entre capitães
 */
router.get('/:campeonato_id/rivalidades', validateParamCampId, getRivalidades);

/**
 * @swagger
 * /campeonatos/{id}/partidas:
 *   get:
 *     summary: Listar partidas do campeonato
 */
router.get('/:id/partidas', listarPartidasDoCampeonato);

/**
 * @swagger
 * /campeonatos/{campeonato_id}:
 *   get:
 *     summary: Buscar campeonato pelo ID
 */
router.get('/:campeonato_id', validateParamCampId, getCampeonatoById);

/**
 * @swagger
 * /campeonatos/{campeonato_id}/finalizar:
 *   post:
 *     summary: Finalizar o campeonato
 */
router.post('/:campeonato_id/finalizar', isAdmin, validateParamCampId, finalizarCampeonato);

router.post('/:campeonato_id/fase-grupos/iniciar', faseGruposController.iniciarFaseGrupos);
router.get('/:campeonato_id/fase-grupos/partidas', faseGruposController.getPartidasFaseGrupos);
router.get('/:campeonato_id/fase-grupos/classificacao', faseGruposController.getClassificacao);
router.post('/:campeonato_id/fase-grupos/finalizar', faseGruposController.finalizarFaseGrupos);
router.get('/:campeonato_id/mata-mata/bracket', faseGruposController.getBracket);
router.post('/:campeonato_id/mata-mata/avancar', faseGruposController.avancarMataAMata);

router.post(
  '/:campeonato_id/foto-campeao',
  upload.single('foto'),
  uploadChampionPhoto
);

export default router;