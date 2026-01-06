import * as TimeModel from '../models/timeModel.js';

/* -------------------------------------------------------------------------- */
/*                                   CREATE                                   */
/* -------------------------------------------------------------------------- */

export async function createTime(req, res, next) {
  const { nome, logo_url } = req.body;

  if (!nome) {
    const err = new Error('O nome do time é obrigatório.');
    err.status = 400;
    throw err;
  }

  const time = await TimeModel.create(nome, logo_url);

  res.status(201).json(time);
}

/* -------------------------------------------------------------------------- */
/*                               FIND ALL / ID                                */
/* -------------------------------------------------------------------------- */

export async function getAllTimes(req, res, next) {
  const times = await TimeModel.findAll();
  res.status(200).json(times);
}

export async function getTimeById(req, res, next) {
  const { id } = req.params;

  const time = await TimeModel.findById(id);

  if (!time) {
    const err = new Error('Time não encontrado.');
    err.status = 404;
    throw err;
  }

  res.status(200).json(time);
}

export async function getJogadoresDoTime(req, res, next) {
  const { id } = req.params;

  const elenco = await TimeModel.findJogadoresByTimeId(id);

  res.status(200).json(elenco);
}

/* -------------------------------------------------------------------------- */
/*                             ADD / REMOVE PLAYERS                            */
/* -------------------------------------------------------------------------- */

export async function addJogadoresAoTime(req, res, next) {
  const { id } = req.params;
  const { jogador_ids } = req.body;

  if (!jogador_ids || !Array.isArray(jogador_ids) || jogador_ids.length === 0) {
    const err = new Error('A lista de IDs de jogadores é obrigatória.');
    err.status = 400;
    throw err;
  }

  await TimeModel.addJogadores(id, jogador_ids);

  res.status(200).json({ message: 'Jogadores adicionados ao time com sucesso.' });
}

export async function removeJogadorDoTime(req, res, next) {
  const { id, jogador_id } = req.params;

  await TimeModel.removeJogador(id, jogador_id);

  res.status(200).json({ message: 'Jogador removido do time.' });
}

/* -------------------------------------------------------------------------- */
/*                               UPDATE JOGADOR                                */
/* -------------------------------------------------------------------------- */

export async function updateJogadorRole(req, res, next) {
  const { id, jogador_id } = req.params;
  const { is_capitao, is_pe_de_rato } = req.body;

  await TimeModel.updateJogadorRole(id, jogador_id, {
    is_capitao,
    is_pe_de_rato,
  });

  res.status(200).json({ message: 'Papel do jogador atualizado.' });
}

/* -------------------------------------------------------------------------- */
/*                                   UPDATE                                    */
/* -------------------------------------------------------------------------- */

export async function updateTime(req, res, next) {
  const { id } = req.params;
  const { nome, logo_url, criado_em } = req.body;

  if (nome === undefined && logo_url === undefined && criado_em === undefined) {
    const err = new Error(
      'Nenhum dado (nome, logo_url ou criado_em) fornecido para atualização.'
    );
    err.status = 400;
    throw err;
  }

  const resultado = await TimeModel.update(id, {
    nome,
    logo_url,
    criado_em,
  });

  res.status(200).json(resultado);
}

/* -------------------------------------------------------------------------- */
/*                                   DELETE                                    */
/* -------------------------------------------------------------------------- */

export async function deleteTime(req, res, next) {
  const { id } = req.params;

  await TimeModel.remove(id);

  res.status(200).json({ message: 'Time deletado com sucesso.' });
}
