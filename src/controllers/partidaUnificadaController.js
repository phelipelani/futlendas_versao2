import * as PartidaModel from '../models/partidaUnificadaModel.js';

export async function listarTodasPartidas(req, res, next) {
  try {
    const { limit, offset, dataInicio } = req.query;
    const partidas = await PartidaModel.findAll({
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
        dataInicio
    });
    res.status(200).json(partidas);
  } catch (err) {
    next(err);
  }
}

export async function getDashboardResumo(req, res, next) {
    try {
        const resumo = await PartidaModel.getResumoGeral();
        res.status(200).json(resumo);
    } catch (err) {
        next(err);
    }
}