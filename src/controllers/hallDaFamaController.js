// Arquivo: src/controllers/hallDaFamaController.js
import * as HallDaFamaModel from '../models/hallDaFamaModel.js';

export async function getHallDaFama(req, res, next) {
  try {
    const dados = await HallDaFamaModel.getHallDaFama();
    res.status(200).json(dados);
  } catch (err) {
    console.error('Erro em getHallDaFama:', err);
    next(err);
  }
}