// Arquivo: src/controllers/analyticsController.js
import * as AnalyticsModel from '../models/analyticsModel.js';

/* ==========================================================================
   VISÃO PANORÂMICA (GERAL)
========================================================================== */

export async function getPanoramica(req, res, next) {
  try {
    const dados = await AnalyticsModel.getDadosGerais();
    res.status(200).json(dados);
  } catch (err) {
    console.error('Erro em getPanoramica:', err);
    next(err);
  }
}

/* ==========================================================================
   RANKING GERAL
========================================================================== */

export async function getRanking(req, res, next) {
  try {
    const ranking = await AnalyticsModel.getRankingGeral();
    res.status(200).json(ranking);
  } catch (err) {
    console.error('Erro em getRanking:', err);
    next(err);
  }
}

/* ==========================================================================
   MELHORES DUPLAS
========================================================================== */

export async function getDuplas(req, res, next) {
  try {
    const duplas = await AnalyticsModel.getMelhoresDuplas();
    res.status(200).json(duplas);
  } catch (err) {
    console.error('Erro em getDuplas:', err);
    next(err);
  }
}

/* ==========================================================================
   PERFIL COMPLETO DO JOGADOR
========================================================================== */

export async function getJogador(req, res, next) {
  try {
    const { jogador_id } = req.params;
    
    if (!jogador_id) {
      return res.status(400).json({ message: 'ID do jogador é obrigatório' });
    }

    const perfil = await AnalyticsModel.getPlayerFullStats(jogador_id);
    res.status(200).json(perfil);
  } catch (err) {
    console.error('Erro em getJogador:', err);
    next(err);
  }
}

/* ==========================================================================
   CONFRONTO DIRETO (RIVALIDADES)
========================================================================== */

export async function getConfronto(req, res, next) {
  try {
    const { jogadorA_id, jogadorB_id } = req.params;
    
    if (!jogadorA_id || !jogadorB_id) {
      return res.status(400).json({ message: 'IDs dos jogadores são obrigatórios' });
    }

    if (jogadorA_id === jogadorB_id) {
      return res.status(400).json({ message: 'Escolha jogadores diferentes' });
    }

    const confronto = await AnalyticsModel.getConfrontoDireto(jogadorA_id, jogadorB_id);
    res.status(200).json(confronto);
  } catch (err) {
    console.error('Erro em getConfronto:', err);
    next(err);
  }
}

/* ==========================================================================
   STATS COMPLETOS DO TIME
========================================================================== */

export async function getTime(req, res, next) {
  try {
    const { time_id } = req.params;
    
    if (!time_id) {
      return res.status(400).json({ message: 'ID do time é obrigatório' });
    }

    const stats = await AnalyticsModel.getTimeFullStats(time_id);
    res.status(200).json(stats);
  } catch (err) {
    console.error('Erro em getTime:', err);
    next(err);
  }
}

/* ==========================================================================
   SINERGIA DO JOGADOR (INDIVIDUAL)
========================================================================== */

export async function getSinergiaJogador(req, res, next) {
  try {
    const { jogador_id } = req.params;
    
    if (!jogador_id) {
      return res.status(400).json({ message: 'ID do jogador é obrigatório' });
    }

    const sinergia = await AnalyticsModel.getSinergiaJogador(jogador_id);
    res.status(200).json(sinergia);
  } catch (err) {
    console.error('Erro em getSinergiaJogador:', err);
    next(err);
  }
}

/* ==========================================================================
   SINERGIA GERAL (RANKINGS DE DUPLAS)
========================================================================== */

export async function getSinergiaGeral(req, res, next) {
  try {
    const sinergia = await AnalyticsModel.getSinergiaGeral();
    res.status(200).json(sinergia);
  } catch (err) {
    console.error('Erro em getSinergiaGeral:', err);
    next(err);
  }
}