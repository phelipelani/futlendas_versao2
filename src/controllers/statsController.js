import * as StatsModel from '../models/statsModel.js';

export async function getEstatisticas(req, res, next) {
  const { liga_id } = req.query;
  const stats = await StatsModel.getLigaStats(liga_id || null);
  res.status(200).json(stats);
}

export async function getDashboardStats(req, res, next) {
  try {
    const { liga_id } = req.query;
    const stats = await StatsModel.getDashboardStats(liga_id || null);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function getArtilharia(req, res, next) {
  const { liga_id } = req.query;
  const stats = await StatsModel.getArtilhariaGeral(liga_id || null);
  res.status(200).json(stats);
}

export async function getAssistencias(req, res, next) {
  const { liga_id } = req.query;
  const stats = await StatsModel.getAssistenciasGeral(liga_id || null);
  res.status(200).json(stats);
}

export async function getPremios(req, res, next) {
  const { liga_id } = req.query;
  const stats = await StatsModel.getRankingPremios(liga_id || null);
  res.status(200).json(stats);
}
