// Arquivo: src/controllers/campeonatoPartidaController.js
import * as PartidaModel from '../models/campeonatoPartidaModel.js';

/* ========================================================================== */
/*                      SALVAR RESULTADO COMPLETO (CAMPEONATO)                */
/* ========================================================================== */

export async function updateResultadoPartida(req, res, next) {
  const { partida_id } = req.params;
  const data = req.body;

  if (!data.eventos || !Array.isArray(data.eventos)) {
    const err = new Error('O array de eventos é obrigatório para salvar a partida.');
    err.status = 400;
    throw err;
  }

  const resultado = await PartidaModel.updateResultadoComEventos(partida_id, data);
  res.status(200).json(resultado);
}

/* ========================================================================== */
/*                        LISTAR PARTIDAS DO CAMPEONATO                       */
/* ========================================================================== */

export async function getPartidasDoCampeonato(req, res, next) {
  const { campeonato_id } = req.params;
  const partidas = await PartidaModel.findPartidasByCampeonatoId(campeonato_id);
  res.status(200).json(partidas);
}

/* ========================================================================== */
/*                         LISTAR PARTIDAS DA RODADA                           */
/* ========================================================================== */

export async function getPartidasDaRodada(req, res, next) {
  const { rodada_id } = req.params;
  const partidas = await PartidaModel.findPartidasByRodadaId(rodada_id);
  res.status(200).json(partidas);
}

/* ========================================================================== */
/*                               FINALIZAR PARTIDA                             */
/* ========================================================================== */

export async function finalizarPartida(req, res, next) {
  const { partida_id } = req.params;
  const data = req.body;

  console.log(`[BACKEND] Finalizando partida de CAMPEONATO ID: ${partida_id}`);

  try {
    if (!data || !data.timeA_jogadores || !data.eventos) {
      const err = new Error('Dados incompletos para finalizar partida de campeonato.');
      err.status = 400;
      throw err;
    }

    const resultado = await PartidaModel.updateResultadoComEventos(partida_id, data);
    res.status(200).json(resultado);

  } catch (err) {
    next(err);
  }
}

/* ========================================================================== */
/*              LISTAR TODAS PARTIDAS DE UM CAMPEONATO (ROTAS ANTIGAS)        */
/* ========================================================================== */

export async function listarPartidasDoCampeonato(req, res, next) {
  const { id } = req.params;
  try {
    const partidas = await PartidaModel.findPartidasByCampeonatoId(id);
    res.status(200).json(partidas);
  } catch (err) {
    next(err);
  }
}

/* ========================================================================== */
/*                      BUSCAR EVENTOS DE UMA PARTIDA                         */
/* ========================================================================== */

export async function getEventosPartida(req, res, next) {
  const { partida_id } = req.params;
  
  try {
    const eventos = await PartidaModel.findEventosByPartidaId(partida_id);
    res.status(200).json(eventos);
  } catch (err) {
    next(err);
  }
}