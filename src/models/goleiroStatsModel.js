// // Arquivo: src/models/goleiroStatsModel.js
// import dbPromise from '../database/db.js';

// export async function getStatsGoleirosLiga(liga_id) {
//   const db = await dbPromise;
//   try {
//     const sql = `
//             SELECT
//                 j.id as jogador_id,
//                 j.nome as nome_goleiro,
//                 COUNT(p.id) as total_jogos,
//                 SUM(
//                     CASE 
//                         WHEN p.goleiro_time1_id = j.id THEN p.placar_time2
//                         WHEN p.goleiro_time2_id = j.id THEN p.placar_time1
//                         ELSE 0 
//                     END
//                 ) as total_gols_sofridos,
//                 SUM(
//                     CASE 
//                         WHEN p.goleiro_time1_id = j.id AND p.placar_time1 > p.placar_time2 THEN 1
//                         WHEN p.goleiro_time2_id = j.id AND p.placar_time2 > p.placar_time1 THEN 1
//                         ELSE 0 
//                     END
//                 ) as total_vitorias,
//                  SUM(
//                     CASE 
//                         WHEN p.goleiro_time1_id = j.id AND p.placar_time1 < p.placar_time2 THEN 1
//                         WHEN p.goleiro_time2_id = j.id AND p.placar_time2 < p.placar_time1 THEN 1
//                         ELSE 0 
//                     END
//                 ) as total_derrotas,
//                 SUM(p.duracao_segundos) as total_segundos_jogados
//             FROM jogadores j
//             JOIN partidas p ON (j.id = p.goleiro_time1_id OR j.id = p.goleiro_time2_id)
//             JOIN rodadas r ON p.rodada_id = r.id
//             WHERE r.liga_id = ? 
//             GROUP BY j.id, j.nome
//             ORDER BY nome_goleiro;
//         `;

//     const rows = await db.all(sql, [liga_id]);

//     return rows
//       .map((row) => {
//         const minutos = (row.total_segundos_jogados || 0) / 60;
//         return {
//           ...row,
//           total_minutos_jogados: parseFloat(minutos.toFixed(2)),
//           media_gols_sofridos_por_minuto:
//             minutos > 0 ? parseFloat((row.total_gols_sofridos / minutos).toFixed(2)) : 0,
//         };
//       })
//       .sort((a, b) => a.media_gols_sofridos_por_minuto - b.media_gols_sofridos_por_minuto);
//   } catch (err) {
//     console.error('Erro ao buscar estatísticas de goleiros da liga:', err);
//     throw err;
//   }
// }

// export async function getStatsGoleirosCampeonato(campeonato_id) {
//   const db = await dbPromise;
//   try {
//     const sql = `
//             SELECT
//                 j.id as jogador_id,
//                 j.nome as nome_goleiro,
//                 COUNT(p.id) as total_jogos,
//                 SUM(
//                     CASE 
//                         WHEN p.goleiro_timeA_id = j.id THEN p.placar_timeB 
//                         WHEN p.goleiro_timeB_id = j.id THEN p.placar_timeA
//                         ELSE 0 
//                     END
//                 ) as total_gols_sofridos,
//                 SUM(
//                     CASE 
//                         WHEN p.goleiro_timeA_id = j.id AND p.placar_timeA > p.placar_timeB THEN 1 
//                         WHEN p.goleiro_timeB_id = j.id AND p.placar_timeB > p.placar_timeA THEN 1
//                         WHEN p.goleiro_timeA_id = j.id AND p.placar_timeA = p.placar_timeB AND p.placar_penaltis_timeA > p.placar_penaltis_timeB THEN 1
//                         WHEN p.goleiro_timeB_id = j.id AND p.placar_timeA = p.placar_timeB AND p.placar_penaltis_timeB > p.placar_penaltis_timeA THEN 1
//                         ELSE 0 
//                     END
//                 ) as total_vitorias,
//                 SUM(
//                     CASE 
//                         WHEN p.goleiro_timeA_id = j.id AND p.placar_timeA < p.placar_timeB THEN 1 
//                         WHEN p.goleiro_timeB_id = j.id AND p.placar_timeB < p.placar_timeA THEN 1
//                         WHEN p.goleiro_timeA_id = j.id AND p.placar_timeA = p.placar_timeB AND p.placar_penaltis_timeA < p.placar_penaltis_timeB THEN 1
//                         WHEN p.goleiro_timeB_id = j.id AND p.placar_timeA = p.placar_timeB AND p.placar_penaltis_timeB < p.placar_penaltis_timeA THEN 1
//                         ELSE 0 
//                     END
//                 ) as total_derrotas,
//                 SUM(p.duracao_segundos) as total_segundos_jogados
//             FROM jogadores j
//             JOIN campeonato_partidas p ON (j.id = p.goleiro_timeA_id OR j.id = p.goleiro_timeB_id)
//             WHERE p.campeonato_id = ? AND p.status = 'finalizada'
//             GROUP BY j.id, j.nome
//             ORDER BY nome_goleiro;
//         `;

//     const rows = await db.all(sql, [campeonato_id]);

//     return rows
//       .map((row) => {
//         const minutos = (row.total_segundos_jogados || 0) / 60;
//         return {
//           ...row,
//           total_minutos_jogados: parseFloat(minutos.toFixed(2)),
//           media_gols_sofridos_por_minuto:
//             minutos > 0 ? parseFloat((row.total_gols_sofridos / minutos).toFixed(2)) : 0,
//         };
//       })
//       .sort((a, b) => a.media_gols_sofridos_por_minuto - b.media_gols_sofridos_por_minuto);
//   } catch (err) {
//     console.error('Erro ao buscar estatísticas de goleiros do campeonato:', err);
//     throw err;
//   }
// }
// Arquivo: src/models/goleiroStatsModel.js
import pool from '../database/db.js';

export async function getStatsGoleirosLiga(liga_id) {
  const [rows] = await pool.query(`
        SELECT j.id as jogador_id, j.nome as nome_goleiro, COUNT(p.id) as total_jogos,
        SUM(CASE WHEN p.goleiro_time1_id = j.id THEN p.placar_time2 WHEN p.goleiro_time2_id = j.id THEN p.placar_time1 ELSE 0 END) as total_gols_sofridos,
        SUM(p.duracao_segundos) as total_segundos_jogados
        FROM jogadores j
        JOIN partidas p ON (j.id = p.goleiro_time1_id OR j.id = p.goleiro_time2_id)
        JOIN rodadas r ON p.rodada_id = r.id
        WHERE r.liga_id = ? 
        GROUP BY j.id, j.nome
        ORDER BY nome_goleiro
    `, [liga_id]);

  return rows.map((row) => {
    const minutos = (row.total_segundos_jogados || 0) / 60;
    return {
      ...row,
      total_minutos_jogados: parseFloat(minutos.toFixed(2)),
      media_gols_sofridos_por_minuto: minutes > 0 ? parseFloat((row.total_gols_sofridos / minutos).toFixed(2)) : 0,
    };
  });
}

export async function getStatsGoleirosCampeonato(campeonato_id) {
  const [rows] = await pool.query(`
        SELECT j.id as jogador_id, j.nome as nome_goleiro, COUNT(p.id) as total_jogos,
        SUM(CASE WHEN p.goleiro_timeA_id = j.id THEN p.placar_timeB WHEN p.goleiro_timeB_id = j.id THEN p.placar_timeA ELSE 0 END) as total_gols_sofridos,
        SUM(p.duracao_segundos) as total_segundos_jogados
        FROM jogadores j
        JOIN campeonato_partidas p ON (j.id = p.goleiro_timeA_id OR j.id = p.goleiro_timeB_id)
        WHERE p.campeonato_id = ? AND p.status = 'finalizada'
        GROUP BY j.id, j.nome
    `, [campeonato_id]);
    
  return rows.map((row) => {
    const minutos = (row.total_segundos_jogados || 0) / 60;
    return { ...row, total_minutos_jogados: parseFloat(minutos.toFixed(2)) };
  });
}