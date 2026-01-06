// Arquivo: src/controllers/goleiroStatsController.js
import * as GoleiroStatsModel from '../models/goleiroStatsModel.js';

export async function getStatsGoleirosLiga(req, res, next) {
  const { liga_id } = req.query;
  if (!liga_id) {
    const err = new Error('O query parameter liga_id é obrigatório.');
    err.status = 400;
    throw err;
  }
  const stats = await GoleiroStatsModel.getStatsGoleirosLiga(liga_id);
  res.status(200).json(stats);
}

export async function getStatsGoleirosCampeonato(req, res, next) {
  const { campeonato_id } = req.params;
  const stats = await GoleiroStatsModel.getStatsGoleirosCampeonato(campeonato_id);
  res.status(200).json(stats);
}
