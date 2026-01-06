import * as LigaModel from '../models/ligaModel.js';
import { validationResult } from 'express-validator';

/* ------------------------- Helper de validação ------------------------- */

function checkValidation(req) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error('Erro de validação.');
    err.status = 400;
    err.errors = errors.array();
    throw err;
  }
}

/* ------------------------------- Controllers ------------------------------- */

export async function createLiga(req, res, next) {
  checkValidation(req);

  const { nome, data_inicio, data_fim } = req.body;
  const liga = await LigaModel.add({ nome, data_inicio, data_fim });

  res.status(201).json({
    message: 'Liga criada com sucesso!',
    liga,
  });
}

export async function getAllLigas(req, res, next) {
  const ligas = await LigaModel.findAll();
  res.status(200).json(ligas);
}

export async function getLigaById(req, res, next) {
  checkValidation(req);

  const { id } = req.params;
  const liga = await LigaModel.findById(id);

  if (!liga) {
    const err = new Error('Liga não encontrada.');
    err.status = 404;
    throw err;
  }

  res.status(200).json(liga);
}

export async function updateLiga(req, res, next) {
  checkValidation(req);

  const { id } = req.params;
  const { nome, data_inicio, data_fim } = req.body;

  const result = await LigaModel.update(id, { nome, data_inicio, data_fim });

  res.status(200).json(result);
}

export async function deleteLiga(req, res, next) {
  checkValidation(req);

  const { id } = req.params;
  const result = await LigaModel.remove(id);

  res.status(200).json(result);
}

export async function finalizarLiga(req, res, next) {
  checkValidation(req);

  const { id } = req.params;
  const result = await LigaModel.finalizar(id);

  res.status(200).json(result);
}
