// Arquivo: src/controllers/rodadaController.js
import * as RodadaModel from "../models/rodadaModel.js";
import * as JogadorModel from "../models/jogadorModel.js";
import * as PartidaModel from "../models/partidaModel.js";
import * as LigaModel from "../models/ligaModel.js";
import { validationResult } from "express-validator";

function checkValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Erro de validação.");
    err.status = 400;
    err.errors = errors.array();
    throw err;
  }
}

/* ============================================================
   CRIAR RODADA DE LIGA
============================================================ */
export async function createRodada(req, res, next) {
  checkValidation(req);
  const { liga_id } = req.params;
  const { data } = req.body;

  const liga = await LigaModel.findById(liga_id);
  if (!liga) {
    const err = new Error("Liga não encontrada.");
    err.status = 404;
    throw err;
  }

  if (liga.finalizada_em) {
    const err = new Error("Não é possível criar rodadas em liga finalizada.");
    err.status = 400;
    throw err;
  }

  const dataRodada = new Date(data);
  const dataFim = new Date(liga.data_fim);

  if (dataRodada > dataFim) {
    const err = new Error("Não é possível criar rodada após fim da liga.");
    err.status = 400;
    throw err;
  }

  const rodadaExistente = await RodadaModel.findByLigaIdAndData(
    liga_id,
    data
  );

  if (rodadaExistente) {
    const err = new Error("Já existe rodada nesta data.");
    err.status = 409;
    throw err;
  }

  const novaRodada = await RodadaModel.create(liga_id, null, data);
  res.status(201).json(novaRodada);
}

/* ============================================================
   CRIAR RODADA DE CAMPEONATO
============================================================ */
export async function createRodadaCampeonato(req, res) {
  checkValidation(req);
  const { campeonato_id } = req.params;
  const { data } = req.body;

  const novaRodada = await RodadaModel.create(null, campeonato_id, data);
  res.status(201).json(novaRodada);
}

/* ============================================================
   SINCRONIZAR JOGADORES DA RODADA
============================================================ */
export async function syncJogadoresDaRodada(req, res) {
  checkValidation(req);
  const { rodada_id } = req.params;
  const { nomes } = req.body;

  const { jogadores, novos, existentes } =
    await JogadorModel.findOrCreateManyByNomes(nomes);

  const jogadoresIds = jogadores.map((j) => j.id);

  await RodadaModel.replaceJogadores(rodada_id, jogadoresIds);

  res.status(200).json({ jogadores, novos, existentes });
}

/* ============================================================
   LISTAR RODADAS
============================================================ */
export async function getRodadasByLiga(req, res) {
  const { liga_id } = req.params;
  const rodadas = await RodadaModel.findByLigaId(liga_id);
  res.status(200).json(rodadas);
}

export async function getRodadasByCampeonato(req, res) {
  const { campeonato_id } = req.params;
  const rodadas = await RodadaModel.findByCampeonatoId(campeonato_id);
  res.status(200).json(rodadas);
}

/* ============================================================
   ELENCO DA RODADA
============================================================ */
export async function getElencoRodada(req, res) {
  const { rodada_id } = req.params;
  const elenco = await RodadaModel.getElencoDaRodada(rodada_id);
  res.status(200).json(elenco);
}

/* ============================================================
   SUBSTITUIÇÃO
============================================================ */
export async function substituirJogadorRodada(req, res) {
  const { rodada_id } = req.params;
  const { time_id, jogador_sai_id, jogador_entra_id } = req.body;

  if (!time_id || !jogador_sai_id || !jogador_entra_id) {
    throw new Error("Dados incompletos para substituição.");
  }

  const resultado = await RodadaModel.realizarSubstituicao(
    rodada_id,
    time_id,
    jogador_sai_id,
    jogador_entra_id
  );

  res.status(200).json(resultado);
}

/* ============================================================
   JOGADORES DA RODADA
============================================================ */
export async function getJogadoresDaRodada(req, res) {
  const { rodada_id } = req.params;
  const jogadores = await RodadaModel.findJogadoresByRodadaId(rodada_id);
  res.status(200).json(jogadores);
}

/* ============================================================
   CRIAR PARTIDA NA RODADA
============================================================ */
export async function createPartidaNaRodada(req, res, next) {
  try {
    const { rodada_id } = req.params;

    if (!rodada_id) {
      const err = new Error("ID da rodada é obrigatório.");
      err.status = 400;
      throw err;
    }

    const novaPartida = await PartidaModel.create(rodada_id);
    res.status(201).json(novaPartida);
  } catch (err) {
    next(err);
  }
}

/* ============================================================
   SALVAR TIMES SORTEADOS
============================================================ */
export async function saveTimes(req, res) {
  const { rodada_id } = req.params;
  const { times } = req.body;

  await RodadaModel.saveTimesSorteados(rodada_id, times);
  res.status(200).json({ message: "Times guardados com sucesso!" });
}

/* ============================================================
   OBTER TIMES DA RODADA
============================================================ */
export async function getTimes(req, res) {
  const { rodada_id } = req.params;
  const jogadoresPorTime = await RodadaModel.getTimesSorteados(rodada_id);
  res.status(200).json(jogadoresPorTime);
}

/* ============================================================
   RESULTADOS COMPLETOS
============================================================ */
export async function getResultadosDaRodada(req, res) {
  const { rodada_id } = req.params;
  const resultados = await RodadaModel.getResultadosCompletos(rodada_id);
  res.status(200).json(resultados);
}

/* ============================================================
   FINALIZAR RODADA
============================================================ */
export async function finalizarRodada(req, res) {
  const { rodada_id } = req.params;

  const retorno = await RodadaModel.finalizar(rodada_id);

  res.status(200).json({
    message: "Rodada finalizada com sucesso!",
    rodada_id: Number(rodada_id),
    ...retorno,
  });
}

/* ============================================================
   EDITAR RODADA
============================================================ */
export async function updateRodada(req, res) {
  const { rodada_id } = req.params;
  const { data } = req.body;

  const resultado = await RodadaModel.update(rodada_id, data);
  res.status(200).json(resultado);
}

/* ============================================================
   DELETAR RODADA
============================================================ */
export async function deleteRodada(req, res) {
  const { rodada_id } = req.params;
  const resultado = await RodadaModel.remove(rodada_id);
  res.status(200).json(resultado);
}

/* ============================================================
   RODADA COMPLETA (USADO NA SUA TELA)
============================================================ */
export async function getRodadaById(req, res) {
  try {
    const { id } = req.params;

    const rodada = await RodadaModel.findById(id);
    if (!rodada) {
      return res.status(404).json({ error: "Rodada não encontrada" });
    }

    const times = await RodadaModel.getTimesSorteados(id);
    const elenco = await RodadaModel.getElencoDaRodada(id);
    const partidas = await PartidaModel.findByRodadaId(id);

    res.status(200).json({
      rodada,
      times,
      elenco,
      partidas,
      campeonato_status: "fase_de_pontos",
    });
  } catch (error) {
    console.error("Erro ao buscar rodada completa:", error);
    res.status(500).json({ error: "Erro interno ao buscar rodada." });
  }
}
