// Arquivo: src/controllers/partidaManagementController.js
import * as PartidaUnificadaModel from '../models/partidaUnificadaModel.js';
import * as PartidaManagementModel from '../models/partidaManagementModel.js';
import * as CampeonatoPartidaModel from '../models/campeonatoPartidaModel.js'; // Reuso para Salvar Edição

// --- LISTAGEM COM FILTROS ---
export async function listarPartidas(req, res, next) {
  try {
    const { limit, offset, dataInicio, campeonato_id, liga_id, rodada_id } = req.query;
    
    const partidas = await PartidaUnificadaModel.findAll({
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
        dataInicio,
        campeonatoId: campeonato_id,
        ligaId: liga_id,
        rodadaId: rodada_id
    });
    
    res.status(200).json(partidas);
  } catch (err) {
    next(err);
  }
}

// --- DETALHES PARA EDIÇÃO ---
export async function getDetalhesEdicao(req, res, next) {
    try {
        const { id } = req.params; // ID da partida
        const detalhes = await PartidaManagementModel.getDetalhesPartidaCampeonato(id);
        
        if (!detalhes) {
            return res.status(404).json({ message: "Partida não encontrada." });
        }
        
        res.status(200).json(detalhes);
    } catch (err) {
        next(err);
    }
}

// --- SALVAR EDIÇÃO ---
// Reutilizamos a lógica de "Salvar Partida Live". 
// Como ela apaga eventos antigos e insere os novos, ela serve perfeitamente para EDIÇÃO.
export async function editarPartida(req, res, next) {
    const { id } = req.params;
    const data = req.body;

    try {
        // A função updateResultadoComEventos já faz a limpeza e re-inserção
        // Isso garante que se trocarmos o autor do gol, a estatística será corrigida.
        await CampeonatoPartidaModel.updateResultadoComEventos(id, data);
        res.status(200).json({ message: "Partida atualizada com sucesso!" });
    } catch (err) {
        next(err);
    }
}

// --- DELETAR PARTIDA ---
export async function excluirPartida(req, res, next) {
    try {
        const { id } = req.params;
        const result = await PartidaManagementModel.deletePartidaCampeonato(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}