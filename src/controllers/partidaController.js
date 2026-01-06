import * as PartidaModel from '../models/partidaModel.js';

/* ========================================================================== */
/*                              ATUALIZAR RESULTADOS                           */
/* ========================================================================== */

export async function updateResultadosPartida(req, res, next) {
  const { partida_id } = req.params;
  const data = req.body;

  console.log(`[BACKEND] Finalizando partida ID: ${partida_id}`);
  console.log('[BACKEND] Dados recebidos:', JSON.stringify(data, null, 2));

  if (!data || !data.time1 || !data.time2 || !data.eventos) {
    const err = new Error('Dados obrigatórios ausentes: time1, time2 e eventos.');
    err.status = 400;
    throw err;
  }

  const resultado = await PartidaModel.updateResultados(partida_id, data);
  res.status(200).json(resultado);
}

/* ========================================================================== */
/*                               LISTAR PARTIDAS                               */
/* ========================================================================== */

export async function listarPartidasGlobais(req, res, next) {
  try {
    const partidas = await PartidaModel.findAllGlobal();
    res.status(200).json(partidas);
  } catch (err) {
    next(err);
  }
}

/* ========================================================================== */
/*                               DETALHES PARTIDA                              */
/* ========================================================================== */

export async function getDetalhes(req, res, next) {
  const { id } = req.params;
  const { origem } = req.query; // 'Liga' ou 'Campeonato'

  try {
    const detalhes = await PartidaModel.getDetalhesPartida(id, origem);
    res.status(200).json(detalhes);
  } catch (err) {
    next(err);
  }
}
