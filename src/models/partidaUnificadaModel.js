// // Arquivo: src/models/partidaUnificadaModel.js
// import dbPromise from '../database/db.js';

// /* ==========================================================================
//    MODELO DE PARTIDAS UNIFICADAS (COM FILTROS AVANÇADOS)
// ========================================================================== */

// export async function findAll({ limit = 50, offset = 0, dataInicio, campeonatoId, ligaId, rodadaId }) {
//   const db = await dbPromise;

//   // Filtros Base
//   let whereLiga = "WHERE 1=1";
//   let whereCamp = "WHERE 1=1";
//   const paramsLiga = [];
//   const paramsCamp = [];

//   // Filtro de Data
//   if (dataInicio) {
//     whereLiga += " AND p.data >= ?";
//     whereCamp += " AND r.data >= ?";
//     paramsLiga.push(dataInicio);
//     paramsCamp.push(dataInicio);
//   }

//   // Filtro por ID de Liga (Se definido, zera a query de campeonato para não trazer lixo)
//   if (ligaId) {
//     whereLiga += " AND l.id = ?";
//     paramsLiga.push(ligaId);
//     whereCamp = "WHERE 1=0"; // Anula parte do campeonato
//   }

//   // Filtro por ID de Campeonato
//   if (campeonatoId) {
//     whereCamp += " AND c.id = ?";
//     paramsCamp.push(campeonatoId);
//     whereLiga = "WHERE 1=0"; // Anula parte da liga
//   }

//   // Filtro por Rodada
//   if (rodadaId) {
//     whereLiga += " AND p.rodada_id = ?";
//     whereCamp += " AND cp.rodada_id = ?";
//     paramsLiga.push(rodadaId);
//     paramsCamp.push(rodadaId);
//   }

//   const sql = `
//     SELECT * FROM (
//         -- PARTIDAS DE LIGA
//         SELECT 
//             'LIGA' as tipo_competicao,
//             l.id as competicao_id,
//             l.nome as nome_competicao,
//             p.id as partida_id,
//             p.data,
//             p.rodada_id,
//             'Time 1' as timeA_nome, -- Em ligas antigas, o nome pode ser fixo ou via rodada_times
//             null as timeA_logo,
//             p.placar_time1 as placarA,
//             'Time 2' as timeB_nome,
//             null as timeB_logo,
//             p.placar_time2 as placarB,
//             'finalizada' as status
//         FROM partidas p
//         JOIN rodadas r ON p.rodada_id = r.id
//         JOIN ligas l ON r.liga_id = l.id
//         ${whereLiga}

//         UNION ALL

//         -- PARTIDAS DE CAMPEONATO
//         SELECT 
//             'CAMPEONATO' as tipo_competicao,
//             c.id as competicao_id,
//             c.nome as nome_competicao,
//             cp.id as partida_id,
//             r.data as data,
//             cp.rodada_id,
//             ta.nome as timeA_nome,
//             ta.logo_url as timeA_logo,
//             cp.placar_timeA as placarA,
//             tb.nome as timeB_nome,
//             tb.logo_url as timeB_logo,
//             cp.placar_timeB as placarB,
//             cp.status
//         FROM campeonato_partidas cp
//         JOIN campeonatos c ON cp.campeonato_id = c.id
//         JOIN rodadas r ON cp.rodada_id = r.id
//         JOIN times ta ON cp.timeA_id = ta.id
//         JOIN times tb ON cp.timeB_id = tb.id
//         ${whereCamp}
//     ) as unificada
//     ORDER BY data DESC, partida_id DESC
//     LIMIT ? OFFSET ?
//   `;

//   // Junta parâmetros na ordem correta
//   const finalParams = [...paramsLiga, ...paramsCamp, limit, offset];

//   return await db.all(sql, finalParams);
// }

// export async function getResumoGeral() {
//     const db = await dbPromise;
//     const totalLigas = await db.get("SELECT COUNT(*) as c FROM partidas");
//     const totalCamp = await db.get("SELECT COUNT(*) as c FROM campeonato_partidas WHERE status = 'finalizada'");
//     const totalGolsCamp = await db.get("SELECT SUM(gols) as g FROM campeonato_estatisticas_partida");
//     const golsLiga = await db.get("SELECT SUM(placar_time1 + placar_time2) as g FROM partidas");

//     return {
//         total_jogos: totalLigas.c + totalCamp.c,
//         total_gols: (golsLiga.g || 0) + (totalGolsCamp.g || 0)
//     };
// }

// Arquivo: src/models/partidaUnificadaModel.js
import pool from '../database/db.js';

export async function findAll({ limit = 50, offset = 0, dataInicio, campeonatoId, ligaId, rodadaId }) {
  let whereLiga = "WHERE 1=1";
  let whereCamp = "WHERE 1=1";
  const paramsLiga = [];
  const paramsCamp = [];

  if (dataInicio) {
    whereLiga += " AND p.data >= ?"; whereCamp += " AND r.data >= ?";
    paramsLiga.push(dataInicio); paramsCamp.push(dataInicio);
  }
  if (ligaId) { whereLiga += " AND l.id = ?"; paramsLiga.push(ligaId); whereCamp = "WHERE 1=0"; }
  if (campeonatoId) { whereCamp += " AND c.id = ?"; paramsCamp.push(campeonatoId); whereLiga = "WHERE 1=0"; }
  if (rodadaId) { whereLiga += " AND p.rodada_id = ?"; whereCamp += " AND cp.rodada_id = ?"; paramsLiga.push(rodadaId); paramsCamp.push(rodadaId); }

  const sql = `
    SELECT * FROM (
        SELECT 'LIGA' as tipo_competicao, l.id as competicao_id, l.nome as nome_competicao, p.id as partida_id, p.data, p.rodada_id,
            'Time 1' as timeA_nome, null as timeA_logo, p.placar_time1 as placarA,
            'Time 2' as timeB_nome, null as timeB_logo, p.placar_time2 as placarB, 'finalizada' as status
        FROM partidas p JOIN rodadas r ON p.rodada_id = r.id JOIN ligas l ON r.liga_id = l.id
        ${whereLiga}
        UNION ALL
        SELECT 'CAMPEONATO' as tipo_competicao, c.id as competicao_id, c.nome as nome_competicao, cp.id as partida_id, r.data as data, cp.rodada_id,
            ta.nome as timeA_nome, ta.logo_url as timeA_logo, cp.placar_timeA as placarA,
            tb.nome as timeB_nome, tb.logo_url as timeB_logo, cp.placar_timeB as placarB, cp.status
        FROM campeonato_partidas cp JOIN campeonatos c ON cp.campeonato_id = c.id JOIN rodadas r ON cp.rodada_id = r.id
        JOIN times ta ON cp.timeA_id = ta.id JOIN times tb ON cp.timeB_id = tb.id
        ${whereCamp}
    ) as unificada
    ORDER BY data DESC, partida_id DESC
    LIMIT ? OFFSET ?
  `;
  const finalParams = [...paramsLiga, ...paramsCamp, limit, offset];
  const [rows] = await pool.query(sql, finalParams);
  return rows;
}

export async function getResumoGeral() {
    const [rowsLigas] = await pool.query("SELECT COUNT(*) as c FROM partidas");
    const [rowsCamp] = await pool.query("SELECT COUNT(*) as c FROM campeonato_partidas WHERE status = 'finalizada'");
    const [rowsGolsCamp] = await pool.query("SELECT SUM(gols) as g FROM campeonato_estatisticas_partida");
    const [rowsGolsLiga] = await pool.query("SELECT SUM(placar_time1 + placar_time2) as g FROM partidas");

    return {
        total_jogos: rowsLigas[0].c + rowsCamp[0].c,
        total_gols: (rowsGolsLiga[0].g || 0) + (rowsGolsCamp[0].g || 0)
    };
}