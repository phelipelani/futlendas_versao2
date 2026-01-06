// // Arquivo: src/models/analyticsModel.js
// import dbPromise from '../database/db.js';
// import { PONTOS } from '../utils/constants.js';

// /* ==========================================================================
//    ANALYTICS GERAL (Visão Panorâmica) - FASE 2
   
//    NOTA: Schema atual de campeonato_estatisticas_partida:
//    - partida_id, jogador_id, time_id, gols, assistencias
   
//    NÃO TEM: e_goleiro, e_recuado, clean_sheet
//    Por isso, rankings de goleiros/zagueiros usam jogadores.posicao
// ========================================================================== */

// export async function getDadosGerais() {
//   const db = await dbPromise;

//   // 1. Totais Absolutos
//   const totais = await db.get(`
//     SELECT 
//       (SELECT COUNT(*) FROM campeonato_partidas WHERE status = 'finalizada') as total_jogos,
//       (SELECT COALESCE(SUM(placar_timeA + placar_timeB), 0) FROM campeonato_partidas WHERE status = 'finalizada') as total_gols,
//       (SELECT COUNT(DISTINCT jogador_id) FROM campeonato_estatisticas_partida) as total_jogadores
//   `);

//   // 2. TOP 10 ARTILHEIROS (Gols + Jogos + Média)
//   const topArtilheiros = await db.all(`
//     SELECT 
//         j.id,
//         j.nome, 
//         j.foto_url, 
//         COALESCE(SUM(cep.gols), 0) as gols,
//         COUNT(DISTINCT cep.partida_id) as jogos,
//         ROUND(CAST(COALESCE(SUM(cep.gols), 0) AS FLOAT) / NULLIF(COUNT(DISTINCT cep.partida_id), 0), 2) as media
//     FROM campeonato_estatisticas_partida cep
//     JOIN jogadores j ON cep.jogador_id = j.id
//     GROUP BY j.id
//     HAVING COALESCE(SUM(cep.gols), 0) > 0
//     ORDER BY gols DESC
//     LIMIT 10
//   `);

//   // 3. TOP 10 GARÇONS (Assists + Jogos + Média)
//   const topGarcons = await db.all(`
//     SELECT 
//         j.id,
//         j.nome, 
//         j.foto_url, 
//         COALESCE(SUM(cep.assistencias), 0) as assistencias,
//         COUNT(DISTINCT cep.partida_id) as jogos,
//         ROUND(CAST(COALESCE(SUM(cep.assistencias), 0) AS FLOAT) / NULLIF(COUNT(DISTINCT cep.partida_id), 0), 2) as media
//     FROM campeonato_estatisticas_partida cep
//     JOIN jogadores j ON cep.jogador_id = j.id
//     GROUP BY j.id
//     HAVING COALESCE(SUM(cep.assistencias), 0) > 0
//     ORDER BY assistencias DESC
//     LIMIT 10
//   `);

//   // 4. TOP 10 ARTILHEIROS POR MÉDIA (mínimo 5 jogos)
//   const topMediaGols = await db.all(`
//     SELECT 
//         j.id,
//         j.nome, 
//         j.foto_url, 
//         COALESCE(SUM(cep.gols), 0) as gols,
//         COUNT(DISTINCT cep.partida_id) as jogos,
//         ROUND(CAST(COALESCE(SUM(cep.gols), 0) AS FLOAT) / NULLIF(COUNT(DISTINCT cep.partida_id), 0), 2) as media
//     FROM campeonato_estatisticas_partida cep
//     JOIN jogadores j ON cep.jogador_id = j.id
//     GROUP BY j.id
//     HAVING COUNT(DISTINCT cep.partida_id) >= 5 AND COALESCE(SUM(cep.gols), 0) > 0
//     ORDER BY media DESC
//     LIMIT 10
//   `);

//   // 5. TOP 5 GOLEIROS (baseado em jogadores.posicao = 'goleiro' OU goleiro_timeA_id/goleiro_timeB_id)
//   let topGoleiros = [];
//   try {
//     topGoleiros = await db.all(`
//       SELECT 
//           j.id,
//           j.nome, 
//           j.foto_url,
//           COUNT(DISTINCT cp.id) as jogos,
//           COALESCE(SUM(
//               CASE 
//                   WHEN cp.goleiro_timeA_id = j.id THEN cp.placar_timeB
//                   WHEN cp.goleiro_timeB_id = j.id THEN cp.placar_timeA
//                   ELSE 0
//               END
//           ), 0) as gols_sofridos,
//           COALESCE(SUM(
//               CASE 
//                   WHEN cp.goleiro_timeA_id = j.id AND cp.placar_timeB = 0 THEN 1
//                   WHEN cp.goleiro_timeB_id = j.id AND cp.placar_timeA = 0 THEN 1
//                   ELSE 0
//               END
//           ), 0) as clean_sheets,
//           ROUND(
//               CAST(COALESCE(SUM(
//                   CASE 
//                       WHEN cp.goleiro_timeA_id = j.id THEN cp.placar_timeB
//                       WHEN cp.goleiro_timeB_id = j.id THEN cp.placar_timeA
//                       ELSE 0
//                   END
//               ), 0) AS FLOAT) / NULLIF(COUNT(DISTINCT cp.id), 0)
//           , 2) as media_sofridos
//       FROM jogadores j
//       JOIN campeonato_partidas cp ON cp.goleiro_timeA_id = j.id OR cp.goleiro_timeB_id = j.id
//       WHERE cp.status = 'finalizada'
//       GROUP BY j.id
//       HAVING COUNT(DISTINCT cp.id) >= 1
//       ORDER BY media_sofridos ASC, clean_sheets DESC
//       LIMIT 5
//     `);
//   } catch (e) {
//     console.log('Erro ao buscar goleiros:', e.message);
//   }

//   // 6. TOP 5 ZAGUEIROS (baseado em jogadores.joga_recuado = 1)
//   let topZagueiros = [];
//   try {
//     topZagueiros = await db.all(`
//       SELECT 
//           j.id,
//           j.nome, 
//           j.foto_url,
//           COUNT(DISTINCT cep.partida_id) as jogos,
//           COALESCE(SUM(cep.gols), 0) as gols,
//           COALESCE(SUM(cep.assistencias), 0) as assistencias,
//           COALESCE(SUM(cep.clean_sheet), 0) as clean_sheets,
//           ROUND(
//               CAST(COALESCE(SUM(
//                   CASE 
//                       WHEN cp.timeA_id = cep.time_id THEN cp.placar_timeB
//                       WHEN cp.timeB_id = cep.time_id THEN cp.placar_timeA
//                       ELSE 0
//                   END
//               ), 0) AS FLOAT) / NULLIF(COUNT(DISTINCT cep.partida_id), 0)
//           , 2) as media_gols_sofridos
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       JOIN campeonato_partidas cp ON cep.partida_id = cp.id
//       WHERE j.joga_recuado = 1 AND cp.status = 'finalizada'
//       GROUP BY j.id
//       HAVING COUNT(DISTINCT cep.partida_id) >= 1
//       ORDER BY clean_sheets DESC, media_gols_sofridos ASC
//       LIMIT 5
//     `);
//   } catch (e) {
//     console.log('Erro ao buscar zagueiros:', e.message);
//   }

//   // 7. TOP 5 PARTICIPAÇÕES (Gols + Assists)
//   const topParticipacoes = await db.all(`
//     SELECT 
//         j.id,
//         j.nome, 
//         j.foto_url, 
//         COALESCE(SUM(cep.gols), 0) as gols,
//         COALESCE(SUM(cep.assistencias), 0) as assistencias,
//         COALESCE(SUM(cep.gols), 0) + COALESCE(SUM(cep.assistencias), 0) as participacoes,
//         COUNT(DISTINCT cep.partida_id) as jogos
//     FROM campeonato_estatisticas_partida cep
//     JOIN jogadores j ON cep.jogador_id = j.id
//     GROUP BY j.id
//     HAVING (COALESCE(SUM(cep.gols), 0) + COALESCE(SUM(cep.assistencias), 0)) > 0
//     ORDER BY participacoes DESC
//     LIMIT 5
//   `);

//   // 8. Evolução (Timeline de gols por mês)
//   let evolucao = [];
//   try {
//     evolucao = await db.all(`
//       SELECT 
//           strftime('%Y-%m', r.data) as mes_ano, 
//           SUM(cp.placar_timeA + cp.placar_timeB) as total_gols,
//           COUNT(cp.id) as total_jogos
//       FROM campeonato_partidas cp
//       JOIN rodadas r ON cp.rodada_id = r.id
//       WHERE cp.status = 'finalizada'
//       GROUP BY mes_ano
//       ORDER BY mes_ano ASC
//       LIMIT 12
//     `);
//   } catch (e) {
//     // Se não tiver rodada_id, tenta sem
//     try {
//       evolucao = await db.all(`
//         SELECT 
//             strftime('%Y-%m', 'now') as mes_ano, 
//             SUM(placar_timeA + placar_timeB) as total_gols,
//             COUNT(id) as total_jogos
//         FROM campeonato_partidas
//         WHERE status = 'finalizada'
//       `);
//     } catch (e2) {
//       console.log('Erro ao buscar evolução:', e2.message);
//     }
//   }

//   // 9. Recordes
//   const recordes = await db.get(`
//     SELECT 
//         (SELECT MAX(ABS(placar_timeA - placar_timeB)) FROM campeonato_partidas WHERE status = 'finalizada') as maior_goleada,
//         (SELECT MAX(placar_timeA + placar_timeB) FROM campeonato_partidas WHERE status = 'finalizada') as mais_gols_jogo
//   `);

//   // 10. Melhor Dupla (gol + assist conectados via eventos_jogo)
//   let melhorDupla = null;
//   try {
//     melhorDupla = await db.get(`
//       SELECT 
//           jGarcom.id as garcom_id,
//           jGarcom.nome as garcom_nome,
//           jGarcom.foto_url as garcom_foto,
//           jArtilheiro.id as artilheiro_id,
//           jArtilheiro.nome as artilheiro_nome,
//           jArtilheiro.foto_url as artilheiro_foto,
//           COUNT(*) as gols_juntos
//       FROM eventos_jogo gol
//       JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
//       JOIN jogadores jGarcom ON assist.jogador_id = jGarcom.id
//       JOIN jogadores jArtilheiro ON gol.jogador_id = jArtilheiro.id
//       WHERE gol.tipo_evento = 'gol'
//       GROUP BY assist.jogador_id, gol.jogador_id
//       ORDER BY gols_juntos DESC
//       LIMIT 1
//     `);
//   } catch (e) {
//     console.log('Erro ao buscar melhor dupla:', e.message);
//   }

//   return {
//     totais,
//     rankings: {
//         artilheiros: topArtilheiros || [],
//         garcons: topGarcons || [],
//         mediaGols: topMediaGols || [],
//         goleiros: topGoleiros || [],
//         zagueiros: topZagueiros || [],
//         participacoes: topParticipacoes || []
//     },
//     evolucao: evolucao || [],
//     recordes,
//     melhorDupla
//   };
// }

// /* ==========================================================================
//    RANKING GERAL (Aba Analytics - Lista Completa)
// ========================================================================== */
// export async function getRankingGeral() {
//   const db = await dbPromise;
  
//   const sql = `
//     SELECT 
//         j.id, 
//         j.nome, 
//         j.foto_url,
//         COALESCE(SUM(cep.gols), 0) as total_gols,
//         COALESCE(SUM(cep.assistencias), 0) as total_assistencias,
//         COALESCE(SUM(cep.clean_sheet), 0) as total_clean_sheets,
//         COUNT(DISTINCT cep.partida_id) as jogos_disputados,
//         (
//             (COALESCE(SUM(cep.gols), 0) * ${PONTOS.GOLS}) + 
//             (COALESCE(SUM(cep.assistencias), 0) * ${PONTOS.ASSISTENCIAS}) +
//             (COALESCE(SUM(cep.clean_sheet), 0) * ${PONTOS.CLEAN_SHEET})
//         ) as pontuacao_total
//     FROM campeonato_estatisticas_partida cep
//     JOIN jogadores j ON cep.jogador_id = j.id
//     GROUP BY j.id
//     ORDER BY pontuacao_total DESC
//     LIMIT 50
//   `;
//   return await db.all(sql);
// }

// /* ==========================================================================
//    MELHORES DUPLAS (Top 10)
// ========================================================================== */
// export async function getMelhoresDuplas() {
//   const db = await dbPromise;
//   try {
//     const sql = `
//       SELECT 
//           jGarcom.id as garcom_id,
//           jGarcom.nome as garcom_nome,
//           jGarcom.foto_url as garcom_foto,
//           jArtilheiro.id as artilheiro_id,
//           jArtilheiro.nome as artilheiro_nome,
//           jArtilheiro.foto_url as artilheiro_foto,
//           COUNT(*) as gols_juntos
//       FROM eventos_jogo gol
//       JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
//       JOIN jogadores jGarcom ON assist.jogador_id = jGarcom.id
//       JOIN jogadores jArtilheiro ON gol.jogador_id = jArtilheiro.id
//       WHERE gol.tipo_evento = 'gol'
//       GROUP BY assist.jogador_id, gol.jogador_id
//       ORDER BY gols_juntos DESC
//       LIMIT 10
//     `;
//     return await db.all(sql);
//   } catch (e) {
//     return [];
//   }
// }

// /* ==========================================================================
//    PERFIL DE JOGADOR (Full Stats) - FASE 3 COMPLETA
// ========================================================================== */
// export async function getPlayerFullStats(jogadorId) {
//   const db = await dbPromise;

//   // Info básica do jogador
//   const jogador = await db.get(`
//     SELECT id, nome, foto_url, joga_recuado, posicao, nivel
//     FROM jogadores WHERE id = ?
//   `, [jogadorId]);

//   // 1. TOTAIS GERAIS
//   const totais = await db.get(`
//     SELECT 
//         COALESCE(SUM(gols), 0) as gols, 
//         COALESCE(SUM(assistencias), 0) as assists,
//         COALESCE(SUM(clean_sheet), 0) as clean_sheets,
//         COUNT(DISTINCT partida_id) as jogos
//     FROM campeonato_estatisticas_partida 
//     WHERE jogador_id = ?
//   `, [jogadorId]);

//   // 2. DESEMPENHO (V/E/D)
//   const desempenho = await db.get(`
//     SELECT 
//         COALESCE(SUM(CASE 
//           WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
//                (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
//           THEN 1 ELSE 0 END), 0) as vitorias,
//         COALESCE(SUM(CASE WHEN cp.placar_timeA = cp.placar_timeB THEN 1 ELSE 0 END), 0) as empates,
//         COALESCE(SUM(CASE 
//           WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA < cp.placar_timeB) OR 
//                (cp.timeB_id = cep.time_id AND cp.placar_timeB < cp.placar_timeA) 
//           THEN 1 ELSE 0 END), 0) as derrotas
//     FROM campeonato_estatisticas_partida cep
//     JOIN campeonato_partidas cp ON cep.partida_id = cp.id
//     WHERE cep.jogador_id = ? AND cp.status = 'finalizada'
//   `, [jogadorId]);

//   // 3. RECORDES PESSOAIS
//   let recordes = {};
//   try {
//     // Mais gols em uma partida
//     const maisGolsPartida = await db.get(`
//       SELECT MAX(gols) as max_gols FROM campeonato_estatisticas_partida WHERE jogador_id = ?
//     `, [jogadorId]);
//     recordes.mais_gols_partida = maisGolsPartida?.max_gols || 0;

//     // Mais assists em uma partida
//     const maisAssistsPartida = await db.get(`
//       SELECT MAX(assistencias) as max_assists FROM campeonato_estatisticas_partida WHERE jogador_id = ?
//     `, [jogadorId]);
//     recordes.mais_assists_partida = maisAssistsPartida?.max_assists || 0;
//   } catch (e) {}

//   // 4. PARCERIAS - GARÇOM FAVORITO (quem mais deu assist pra ele)
//   let garcomFavorito = null;
//   try {
//     garcomFavorito = await db.get(`
//       SELECT j.id, j.nome, j.foto_url, COUNT(*) as total
//       FROM eventos_jogo gol
//       JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
//       JOIN jogadores j ON assist.jogador_id = j.id
//       WHERE gol.jogador_id = ? AND gol.tipo_evento = 'gol'
//       GROUP BY assist.jogador_id
//       ORDER BY total DESC
//       LIMIT 1
//     `, [jogadorId]);
//   } catch (e) {}

//   // 5. PARCERIAS - ARTILHEIRO FAVORITO (quem ele mais assistiu)
//   let artilheiroFavorito = null;
//   try {
//     artilheiroFavorito = await db.get(`
//       SELECT j.id, j.nome, j.foto_url, COUNT(*) as total
//       FROM eventos_jogo gol
//       JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
//       JOIN jogadores j ON gol.jogador_id = j.id
//       WHERE assist.jogador_id = ? AND gol.tipo_evento = 'gol'
//       GROUP BY gol.jogador_id
//       ORDER BY total DESC
//       LIMIT 1
//     `, [jogadorId]);
//   } catch (e) {}

//   // 6. PARCERIAS - ZAGUEIRO MAIS SÓLIDO (mais clean sheets jogando junto)
//   let zagueiroSolido = null;
//   try {
//     zagueiroSolido = await db.get(`
//       SELECT j.id, j.nome, j.foto_url, SUM(cep2.clean_sheet) as clean_sheets
//       FROM campeonato_estatisticas_partida cep1
//       JOIN campeonato_estatisticas_partida cep2 ON cep1.partida_id = cep2.partida_id AND cep1.time_id = cep2.time_id
//       JOIN jogadores j ON cep2.jogador_id = j.id
//       WHERE cep1.jogador_id = ? 
//         AND cep2.jogador_id != ?
//         AND j.joga_recuado = 1
//       GROUP BY cep2.jogador_id
//       ORDER BY clean_sheets DESC
//       LIMIT 1
//     `, [jogadorId, jogadorId]);
//   } catch (e) {}

//   // 7. PARCERIAS - ZAGUEIRO ARTILHEIRO (zagueiro que mais fez gol jogando junto)
//   let zagueiroArtilheiro = null;
//   try {
//     zagueiroArtilheiro = await db.get(`
//       SELECT j.id, j.nome, j.foto_url, SUM(cep2.gols) as gols
//       FROM campeonato_estatisticas_partida cep1
//       JOIN campeonato_estatisticas_partida cep2 ON cep1.partida_id = cep2.partida_id AND cep1.time_id = cep2.time_id
//       JOIN jogadores j ON cep2.jogador_id = j.id
//       WHERE cep1.jogador_id = ? 
//         AND cep2.jogador_id != ?
//         AND j.joga_recuado = 1
//       GROUP BY cep2.jogador_id
//       HAVING SUM(cep2.gols) > 0
//       ORDER BY gols DESC
//       LIMIT 1
//     `, [jogadorId, jogadorId]);
//   } catch (e) {}

//   // 8. PARCERIAS - GOLEIRO DE CONFIANÇA (goleiro com melhor desempenho jogando junto)
//   let goleiroConfianca = null;
//   try {
//     goleiroConfianca = await db.get(`
//       SELECT 
//         j.id, j.nome, j.foto_url,
//         COUNT(DISTINCT cp.id) as jogos_juntos,
//         SUM(CASE 
//           WHEN (cp.goleiro_timeA_id = j.id AND cp.placar_timeB = 0) OR 
//                (cp.goleiro_timeB_id = j.id AND cp.placar_timeA = 0) 
//           THEN 1 ELSE 0 END) as clean_sheets,
//         ROUND(
//           CAST(SUM(CASE 
//             WHEN cp.goleiro_timeA_id = j.id THEN cp.placar_timeB
//             WHEN cp.goleiro_timeB_id = j.id THEN cp.placar_timeA
//             ELSE 0 END) AS FLOAT) / NULLIF(COUNT(DISTINCT cp.id), 0)
//         , 2) as media_sofridos
//       FROM campeonato_estatisticas_partida cep
//       JOIN campeonato_partidas cp ON cep.partida_id = cp.id
//       JOIN jogadores j ON (cp.goleiro_timeA_id = j.id AND cp.timeA_id = cep.time_id) 
//                        OR (cp.goleiro_timeB_id = j.id AND cp.timeB_id = cep.time_id)
//       WHERE cep.jogador_id = ? AND cp.status = 'finalizada'
//       GROUP BY j.id
//       ORDER BY clean_sheets DESC, media_sofridos ASC
//       LIMIT 1
//     `, [jogadorId]);
//   } catch (e) {}

//   // 9. PARCEIRO MAIS FREQUENTE (quem mais jogou junto no mesmo time)
//   let parceiroFrequente = null;
//   try {
//     parceiroFrequente = await db.get(`
//       SELECT j.id, j.nome, j.foto_url, COUNT(DISTINCT cep1.partida_id) as jogos_juntos
//       FROM campeonato_estatisticas_partida cep1
//       JOIN campeonato_estatisticas_partida cep2 ON cep1.partida_id = cep2.partida_id AND cep1.time_id = cep2.time_id
//       JOIN jogadores j ON cep2.jogador_id = j.id
//       WHERE cep1.jogador_id = ? AND cep2.jogador_id != ?
//       GROUP BY cep2.jogador_id
//       ORDER BY jogos_juntos DESC
//       LIMIT 1
//     `, [jogadorId, jogadorId]);
//   } catch (e) {}

//   // 10. PARCEIRO DE VITÓRIAS (quem mais venceu junto)
//   let parceiroVitorias = null;
//   try {
//     parceiroVitorias = await db.get(`
//       SELECT j.id, j.nome, j.foto_url, COUNT(DISTINCT cep1.partida_id) as vitorias_juntos
//       FROM campeonato_estatisticas_partida cep1
//       JOIN campeonato_estatisticas_partida cep2 ON cep1.partida_id = cep2.partida_id AND cep1.time_id = cep2.time_id
//       JOIN campeonato_partidas cp ON cep1.partida_id = cp.id
//       JOIN jogadores j ON cep2.jogador_id = j.id
//       WHERE cep1.jogador_id = ? AND cep2.jogador_id != ?
//         AND (
//           (cp.timeA_id = cep1.time_id AND cp.placar_timeA > cp.placar_timeB) OR
//           (cp.timeB_id = cep1.time_id AND cp.placar_timeB > cp.placar_timeA)
//         )
//       GROUP BY cep2.jogador_id
//       ORDER BY vitorias_juntos DESC
//       LIMIT 1
//     `, [jogadorId, jogadorId]);
//   } catch (e) {}

//   // 11. ÚLTIMAS PARTIDAS (últimos 10 jogos)
//   let ultimasPartidas = [];
//   try {
//     ultimasPartidas = await db.all(`
//       SELECT 
//         cp.id as partida_id,
//         r.data,
//         cep.gols,
//         cep.assistencias,
//         cep.clean_sheet,
//         cp.placar_timeA,
//         cp.placar_timeB,
//         cp.timeA_id,
//         cp.timeB_id,
//         cep.time_id,
//         tA.nome as timeA_nome,
//         tB.nome as timeB_nome,
//         CASE 
//           WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
//                (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
//           THEN 'V'
//           WHEN cp.placar_timeA = cp.placar_timeB THEN 'E'
//           ELSE 'D'
//         END as resultado
//       FROM campeonato_estatisticas_partida cep
//       JOIN campeonato_partidas cp ON cep.partida_id = cp.id
//       JOIN times tA ON cp.timeA_id = tA.id
//       JOIN times tB ON cp.timeB_id = tB.id
//       LEFT JOIN rodadas r ON cp.rodada_id = r.id
//       WHERE cep.jogador_id = ? AND cp.status = 'finalizada'
//       ORDER BY cp.id DESC
//       LIMIT 10
//     `, [jogadorId]);
//   } catch (e) {}

//   // 12. TÍTULOS
//   let titulos = [];
//   try {
//     titulos = await db.all(`
//       SELECT c.nome, c.data 
//       FROM campeonato_vencedores cv
//       JOIN campeonatos c ON cv.campeonato_id = c.id
//       WHERE cv.jogador_id = ?
//     `, [jogadorId]);
//   } catch (e) {}

//   // 13. PRÊMIOS INDIVIDUAIS
//   let premios = [];
//   try {
//     premios = await db.all(`
//       SELECT tipo_premio, valor, c.nome as campeonato_nome
//       FROM campeonato_premios cp
//       JOIN campeonatos c ON cp.campeonato_id = c.id
//       WHERE jogador_id = ?
//     `, [jogadorId]);
//   } catch (e) {}

//   return {
//     jogador,
//     totais,
//     desempenho,
//     recordes,
//     parcerias: {
//       garcomFavorito,
//       artilheiroFavorito,
//       zagueiroSolido,
//       zagueiroArtilheiro,
//       goleiroConfianca,
//       parceiroFrequente,
//       parceiroVitorias
//     },
//     ultimasPartidas,
//     titulos,
//     premios
//   };
// }

// /* ==========================================================================
//    CONFRONTO DIRETO (1v1)
// ========================================================================== */
// export async function getConfrontoDireto(jogadorA_id, jogadorB_id) {
//   const db = await dbPromise;

//   // Info básica dos jogadores
//   const jogadorA = await db.get(`
//     SELECT id, nome, foto_url, posicao, joga_recuado, nivel
//     FROM jogadores WHERE id = ?
//   `, [jogadorA_id]);
  
//   const jogadorB = await db.get(`
//     SELECT id, nome, foto_url, posicao, joga_recuado, nivel
//     FROM jogadores WHERE id = ?
//   `, [jogadorB_id]);

//   // Stats gerais de cada jogador
//   const statsA = await db.get(`
//     SELECT 
//       COUNT(DISTINCT partida_id) as jogos,
//       COALESCE(SUM(gols), 0) as gols,
//       COALESCE(SUM(assistencias), 0) as assists,
//       COALESCE(SUM(clean_sheet), 0) as clean_sheets
//     FROM campeonato_estatisticas_partida
//     WHERE jogador_id = ?
//   `, [jogadorA_id]);

//   const statsB = await db.get(`
//     SELECT 
//       COUNT(DISTINCT partida_id) as jogos,
//       COALESCE(SUM(gols), 0) as gols,
//       COALESCE(SUM(assistencias), 0) as assists,
//       COALESCE(SUM(clean_sheet), 0) as clean_sheets
//     FROM campeonato_estatisticas_partida
//     WHERE jogador_id = ?
//   `, [jogadorB_id]);

//   // Desempenho (Vitórias/Empates/Derrotas) de cada jogador
//   const desempenhoA = await db.get(`
//     SELECT 
//       COUNT(*) as jogos,
//       SUM(CASE 
//         WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
//              (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
//         THEN 1 ELSE 0 
//       END) as vitorias,
//       SUM(CASE WHEN cp.placar_timeA = cp.placar_timeB THEN 1 ELSE 0 END) as empates,
//       SUM(CASE 
//         WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA < cp.placar_timeB) OR 
//              (cp.timeB_id = cep.time_id AND cp.placar_timeB < cp.placar_timeA) 
//         THEN 1 ELSE 0 
//       END) as derrotas
//     FROM campeonato_estatisticas_partida cep
//     JOIN campeonato_partidas cp ON cep.partida_id = cp.id
//     WHERE cep.jogador_id = ? AND cp.status = 'finalizada'
//   `, [jogadorA_id]);

//   const desempenhoB = await db.get(`
//     SELECT 
//       COUNT(*) as jogos,
//       SUM(CASE 
//         WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
//              (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
//         THEN 1 ELSE 0 
//       END) as vitorias,
//       SUM(CASE WHEN cp.placar_timeA = cp.placar_timeB THEN 1 ELSE 0 END) as empates,
//       SUM(CASE 
//         WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA < cp.placar_timeB) OR 
//              (cp.timeB_id = cep.time_id AND cp.placar_timeB < cp.placar_timeA) 
//         THEN 1 ELSE 0 
//       END) as derrotas
//     FROM campeonato_estatisticas_partida cep
//     JOIN campeonato_partidas cp ON cep.partida_id = cp.id
//     WHERE cep.jogador_id = ? AND cp.status = 'finalizada'
//   `, [jogadorB_id]);

//   // CONFRONTOS DIRETOS (quando jogaram em times opostos)
//   const confronto = await db.get(`
//     SELECT 
//       COUNT(DISTINCT cp.id) as jogos,
//       SUM(CASE 
//         WHEN (cp.placar_timeA > cp.placar_timeB AND sA.time_id = cp.timeA_id) OR 
//              (cp.placar_timeB > cp.placar_timeA AND sA.time_id = cp.timeB_id) 
//         THEN 1 ELSE 0 
//       END) as vitorias_A,
//       SUM(CASE 
//         WHEN (cp.placar_timeA > cp.placar_timeB AND sB.time_id = cp.timeA_id) OR 
//              (cp.placar_timeB > cp.placar_timeA AND sB.time_id = cp.timeB_id) 
//         THEN 1 ELSE 0 
//       END) as vitorias_B,
//       SUM(CASE WHEN cp.placar_timeA = cp.placar_timeB THEN 1 ELSE 0 END) as empates,
//       COALESCE(SUM(sA.gols), 0) as gols_A,
//       COALESCE(SUM(sB.gols), 0) as gols_B,
//       COALESCE(SUM(sA.assistencias), 0) as assists_A,
//       COALESCE(SUM(sB.assistencias), 0) as assists_B
//     FROM campeonato_partidas cp
//     JOIN campeonato_estatisticas_partida sA ON cp.id = sA.partida_id AND sA.jogador_id = ?
//     JOIN campeonato_estatisticas_partida sB ON cp.id = sB.partida_id AND sB.jogador_id = ?
//     WHERE cp.status = 'finalizada' AND sA.time_id != sB.time_id
//   `, [jogadorA_id, jogadorB_id]);

//   // Quantas vezes jogaram JUNTOS (mesmo time)
//   const parceria = await db.get(`
//     SELECT 
//       COUNT(DISTINCT sA.partida_id) as jogos_juntos,
//       SUM(CASE 
//         WHEN (cp.placar_timeA > cp.placar_timeB AND sA.time_id = cp.timeA_id) OR 
//              (cp.placar_timeB > cp.placar_timeA AND sA.time_id = cp.timeB_id) 
//         THEN 1 ELSE 0 
//       END) as vitorias_juntos
//     FROM campeonato_partidas cp
//     JOIN campeonato_estatisticas_partida sA ON cp.id = sA.partida_id AND sA.jogador_id = ?
//     JOIN campeonato_estatisticas_partida sB ON cp.id = sB.partida_id AND sB.jogador_id = ?
//     WHERE cp.status = 'finalizada' AND sA.time_id = sB.time_id
//   `, [jogadorA_id, jogadorB_id]);

//   // Gols de A assistidos por B (e vice-versa)
//   let golsAbyB = 0;
//   let golsBbyA = 0;
//   try {
//     const resAbyB = await db.get(`
//       SELECT COUNT(*) as total
//       FROM eventos_jogo gol
//       JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
//       WHERE gol.jogador_id = ? AND assist.jogador_id = ? AND gol.tipo_evento = 'gol'
//     `, [jogadorA_id, jogadorB_id]);
//     golsAbyB = resAbyB?.total || 0;

//     const resBbyA = await db.get(`
//       SELECT COUNT(*) as total
//       FROM eventos_jogo gol
//       JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
//       WHERE gol.jogador_id = ? AND assist.jogador_id = ? AND gol.tipo_evento = 'gol'
//     `, [jogadorB_id, jogadorA_id]);
//     golsBbyA = resBbyA?.total || 0;
//   } catch (e) {}

//   return { 
//     jogadorA: {
//       ...jogadorA,
//       stats: statsA,
//       desempenho: desempenhoA
//     },
//     jogadorB: {
//       ...jogadorB,
//       stats: statsB,
//       desempenho: desempenhoB
//     },
//     confronto: confronto || { jogos: 0, vitorias_A: 0, vitorias_B: 0, empates: 0, gols_A: 0, gols_B: 0 },
//     parceria: {
//       jogos_juntos: parceria?.jogos_juntos || 0,
//       vitorias_juntos: parceria?.vitorias_juntos || 0,
//       gols_A_assistidos_por_B: golsAbyB,
//       gols_B_assistidos_por_A: golsBbyA
//     }
//   };
// }

// /* ==========================================================================
//    TIME FULL STATS
// ========================================================================== */
// export async function getTimeFullStats(timeId) {
//   const db = await dbPromise;

//   let titulos = [];
//   try {
//     titulos = await db.all(`
//       SELECT c.id, c.nome, c.data, c.formato
//       FROM campeonatos c
//       WHERE c.time_campeao_id = ?
//       ORDER BY c.data DESC
//     `, [timeId]);
//   } catch (e) {}

//   const desempenho = await db.get(`
//     SELECT 
//         COUNT(*) as jogos,
//         SUM(CASE WHEN (cp.timeA_id = ? AND cp.placar_timeA > cp.placar_timeB) OR (cp.timeB_id = ? AND cp.placar_timeB > cp.placar_timeA) THEN 1 ELSE 0 END) as vitorias,
//         SUM(CASE WHEN cp.placar_timeA = cp.placar_timeB THEN 1 ELSE 0 END) as empates,
//         SUM(CASE WHEN (cp.timeA_id = ? AND cp.placar_timeA < cp.placar_timeB) OR (cp.timeB_id = ? AND cp.placar_timeB < cp.placar_timeA) THEN 1 ELSE 0 END) as derrotas,
//         SUM(CASE WHEN cp.timeA_id = ? THEN cp.placar_timeA WHEN cp.timeB_id = ? THEN cp.placar_timeB ELSE 0 END) as gols_pro,
//         SUM(CASE WHEN cp.timeA_id = ? THEN cp.placar_timeB WHEN cp.timeB_id = ? THEN cp.placar_timeA ELSE 0 END) as gols_contra
//     FROM campeonato_partidas cp
//     WHERE (cp.timeA_id = ? OR cp.timeB_id = ?) AND cp.status = 'finalizada'
//   `, [timeId, timeId, timeId, timeId, timeId, timeId, timeId, timeId, timeId, timeId]);

//   const artilheiros = await db.all(`
//     SELECT j.nome, j.foto_url, SUM(cep.gols) as total
//     FROM campeonato_estatisticas_partida cep
//     JOIN jogadores j ON cep.jogador_id = j.id
//     WHERE cep.time_id = ?
//     GROUP BY j.id
//     ORDER BY total DESC
//     LIMIT 5
//   `, [timeId]);

//   const garcons = await db.all(`
//     SELECT j.nome, j.foto_url, SUM(cep.assistencias) as total
//     FROM campeonato_estatisticas_partida cep
//     JOIN jogadores j ON cep.jogador_id = j.id
//     WHERE cep.time_id = ?
//     GROUP BY j.id
//     ORDER BY total DESC
//     LIMIT 5
//   `, [timeId]);

//   const maisJogaram = await db.all(`
//     SELECT j.id, j.nome, j.foto_url, COUNT(DISTINCT cep.partida_id) as total
//     FROM campeonato_estatisticas_partida cep
//     JOIN jogadores j ON cep.jogador_id = j.id
//     WHERE cep.time_id = ?
//     GROUP BY j.id
//     ORDER BY total DESC
//     LIMIT 5
//   `, [timeId]);

//   // Últimas partidas do time
//   let ultimasPartidas = [];
//   try {
//     ultimasPartidas = await db.all(`
//       SELECT 
//         cp.id as partida_id,
//         r.data,
//         cp.placar_timeA,
//         cp.placar_timeB,
//         cp.timeA_id,
//         cp.timeB_id,
//         tA.nome as timeA_nome,
//         tA.logo_url as timeA_logo,
//         tB.nome as timeB_nome,
//         tB.logo_url as timeB_logo,
//         CASE 
//           WHEN (cp.timeA_id = ? AND cp.placar_timeA > cp.placar_timeB) OR 
//                (cp.timeB_id = ? AND cp.placar_timeB > cp.placar_timeA) 
//           THEN 'V'
//           WHEN cp.placar_timeA = cp.placar_timeB THEN 'E'
//           ELSE 'D'
//         END as resultado
//       FROM campeonato_partidas cp
//       JOIN times tA ON cp.timeA_id = tA.id
//       JOIN times tB ON cp.timeB_id = tB.id
//       LEFT JOIN rodadas r ON cp.rodada_id = r.id
//       WHERE (cp.timeA_id = ? OR cp.timeB_id = ?) AND cp.status = 'finalizada'
//       ORDER BY cp.id DESC
//       LIMIT 10
//     `, [timeId, timeId, timeId, timeId]);
//   } catch (e) {}

//   const timeInfo = await db.get('SELECT * FROM times WHERE id = ?', [timeId]);

//   return {
//     info: timeInfo,
//     titulos: titulos || [],
//     desempenho,
//     rankings: {
//         artilheiros: artilheiros || [],
//         garcons: garcons || [],
//         mais_jogaram: maisJogaram || []
//     },
//     ultimasPartidas: ultimasPartidas || []
//   };
// }

// /* ==========================================================================
//    SINERGIA (PARCERIAS)
// ========================================================================== */
// export async function getSinergiaJogador(jogadorId) {
//   const db = await dbPromise;

//   let maisJogaramJuntos = null;
//   try {
//     maisJogaramJuntos = await db.get(`
//       SELECT j.nome, j.foto_url, COUNT(DISTINCT t1.partida_id) as total
//       FROM campeonato_estatisticas_partida t1
//       JOIN campeonato_estatisticas_partida t2 ON t1.partida_id = t2.partida_id AND t1.time_id = t2.time_id
//       JOIN jogadores j ON t2.jogador_id = j.id
//       WHERE t1.jogador_id = ? AND t2.jogador_id != ?
//       GROUP BY t2.jogador_id
//       ORDER BY total DESC LIMIT 1
//     `, [jogadorId, jogadorId]);
//   } catch (e) {}

//   let maisVenceramJuntos = null;
//   try {
//     maisVenceramJuntos = await db.get(`
//       SELECT j.nome, j.foto_url, COUNT(DISTINCT t1.partida_id) as total
//       FROM campeonato_estatisticas_partida t1
//       JOIN campeonato_estatisticas_partida t2 ON t1.partida_id = t2.partida_id AND t1.time_id = t2.time_id
//       JOIN campeonato_partidas cp ON t1.partida_id = cp.id
//       JOIN jogadores j ON t2.jogador_id = j.id
//       WHERE t1.jogador_id = ? AND t2.jogador_id != ?
//       AND (
//           (cp.timeA_id = t1.time_id AND cp.placar_timeA > cp.placar_timeB) OR
//           (cp.timeB_id = t1.time_id AND cp.placar_timeB > cp.placar_timeA)
//       )
//       GROUP BY t2.jogador_id
//       ORDER BY total DESC LIMIT 1
//     `, [jogadorId, jogadorId]);
//   } catch (e) {}

//   let garcomFavorito = null;
//   try {
//     garcomFavorito = await db.get(`
//       SELECT j.nome, j.foto_url, COUNT(*) as total
//       FROM eventos_jogo gol
//       JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
//       JOIN jogadores j ON assist.jogador_id = j.id
//       WHERE gol.jogador_id = ? AND gol.tipo_evento = 'gol'
//       GROUP BY assist.jogador_id
//       ORDER BY total DESC LIMIT 1
//     `, [jogadorId]);
//   } catch (e) {}

//   let artilheiroFavorito = null;
//   try {
//     artilheiroFavorito = await db.get(`
//       SELECT j.nome, j.foto_url, COUNT(*) as total
//       FROM eventos_jogo gol
//       JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
//       JOIN jogadores j ON gol.jogador_id = j.id
//       WHERE assist.jogador_id = ? AND gol.tipo_evento = 'gol'
//       GROUP BY gol.jogador_id
//       ORDER BY total DESC LIMIT 1
//     `, [jogadorId]);
//   } catch (e) {}

//   return {
//     maisJogaramJuntos,
//     maisVenceramJuntos,
//     garcomFavorito,
//     artilheiroFavorito
//   };
// }

// /* ==========================================================================
//    SINERGIA GERAL (RANKINGS DE DUPLAS)
// ========================================================================== */
// export async function getSinergiaGeral() {
//   const db = await dbPromise;

//   // 1. TOP DUPLAS ARTILHEIRO + GARÇOM (quem mais fez gols assistidos por quem)
//   let topDuplasGols = [];
//   try {
//     topDuplasGols = await db.all(`
//       SELECT 
//         jGol.id as artilheiro_id,
//         jGol.nome as artilheiro_nome,
//         jGol.foto_url as artilheiro_foto,
//         jAssist.id as garcom_id,
//         jAssist.nome as garcom_nome,
//         jAssist.foto_url as garcom_foto,
//         COUNT(*) as gols_juntos
//       FROM eventos_jogo gol
//       JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
//       JOIN jogadores jGol ON gol.jogador_id = jGol.id
//       JOIN jogadores jAssist ON assist.jogador_id = jAssist.id
//       WHERE gol.tipo_evento = 'gol'
//       GROUP BY gol.jogador_id, assist.jogador_id
//       ORDER BY gols_juntos DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro topDuplasGols:', e); }

//   // 2. DUPLAS QUE MAIS JOGARAM JUNTAS (mesmo time, mesma partida)
//   let maisJogaramJuntos = [];
//   try {
//     maisJogaramJuntos = await db.all(`
//       SELECT 
//         j1.id as jogador1_id,
//         j1.nome as jogador1_nome,
//         j1.foto_url as jogador1_foto,
//         j2.id as jogador2_id,
//         j2.nome as jogador2_nome,
//         j2.foto_url as jogador2_foto,
//         COUNT(DISTINCT cep1.partida_id) as jogos_juntos
//       FROM campeonato_estatisticas_partida cep1
//       JOIN campeonato_estatisticas_partida cep2 
//         ON cep1.partida_id = cep2.partida_id 
//         AND cep1.time_id = cep2.time_id
//         AND cep1.jogador_id < cep2.jogador_id
//       JOIN jogadores j1 ON cep1.jogador_id = j1.id
//       JOIN jogadores j2 ON cep2.jogador_id = j2.id
//       GROUP BY cep1.jogador_id, cep2.jogador_id
//       ORDER BY jogos_juntos DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro maisJogaramJuntos:', e); }

//   // 3. DUPLAS QUE MAIS VENCERAM JUNTAS
//   let maisVenceramJuntos = [];
//   try {
//     maisVenceramJuntos = await db.all(`
//       SELECT 
//         j1.id as jogador1_id,
//         j1.nome as jogador1_nome,
//         j1.foto_url as jogador1_foto,
//         j2.id as jogador2_id,
//         j2.nome as jogador2_nome,
//         j2.foto_url as jogador2_foto,
//         COUNT(DISTINCT cep1.partida_id) as vitorias_juntos
//       FROM campeonato_estatisticas_partida cep1
//       JOIN campeonato_estatisticas_partida cep2 
//         ON cep1.partida_id = cep2.partida_id 
//         AND cep1.time_id = cep2.time_id
//         AND cep1.jogador_id < cep2.jogador_id
//       JOIN campeonato_partidas cp ON cep1.partida_id = cp.id
//       JOIN jogadores j1 ON cep1.jogador_id = j1.id
//       JOIN jogadores j2 ON cep2.jogador_id = j2.id
//       WHERE (
//         (cp.timeA_id = cep1.time_id AND cp.placar_timeA > cp.placar_timeB) OR
//         (cp.timeB_id = cep1.time_id AND cp.placar_timeB > cp.placar_timeA)
//       )
//       GROUP BY cep1.jogador_id, cep2.jogador_id
//       ORDER BY vitorias_juntos DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro maisVenceramJuntos:', e); }

//   // 4. MURALHAS - Duplas de Zagueiros com mais Clean Sheets juntos
//   let muralhas = [];
//   try {
//     muralhas = await db.all(`
//       SELECT 
//         j1.id as jogador1_id,
//         j1.nome as jogador1_nome,
//         j1.foto_url as jogador1_foto,
//         j2.id as jogador2_id,
//         j2.nome as jogador2_nome,
//         j2.foto_url as jogador2_foto,
//         SUM(CASE WHEN cep1.clean_sheet = 1 AND cep2.clean_sheet = 1 THEN 1 ELSE 0 END) as clean_sheets_juntos,
//         COUNT(DISTINCT cep1.partida_id) as jogos_juntos
//       FROM campeonato_estatisticas_partida cep1
//       JOIN campeonato_estatisticas_partida cep2 
//         ON cep1.partida_id = cep2.partida_id 
//         AND cep1.time_id = cep2.time_id
//         AND cep1.jogador_id < cep2.jogador_id
//       JOIN jogadores j1 ON cep1.jogador_id = j1.id
//       JOIN jogadores j2 ON cep2.jogador_id = j2.id
//       WHERE j1.joga_recuado = 1 AND j2.joga_recuado = 1
//       GROUP BY cep1.jogador_id, cep2.jogador_id
//       HAVING clean_sheets_juntos > 0
//       ORDER BY clean_sheets_juntos DESC, jogos_juntos DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro muralhas:', e); }

//   // 5. DUPLAS MAIS LETAIS (mais gols combinados na mesma partida)
//   let maisLetais = [];
//   try {
//     maisLetais = await db.all(`
//       SELECT 
//         j1.id as jogador1_id,
//         j1.nome as jogador1_nome,
//         j1.foto_url as jogador1_foto,
//         j2.id as jogador2_id,
//         j2.nome as jogador2_nome,
//         j2.foto_url as jogador2_foto,
//         SUM(cep1.gols + cep2.gols) as gols_combinados,
//         COUNT(DISTINCT cep1.partida_id) as jogos_juntos
//       FROM campeonato_estatisticas_partida cep1
//       JOIN campeonato_estatisticas_partida cep2 
//         ON cep1.partida_id = cep2.partida_id 
//         AND cep1.time_id = cep2.time_id
//         AND cep1.jogador_id < cep2.jogador_id
//       JOIN jogadores j1 ON cep1.jogador_id = j1.id
//       JOIN jogadores j2 ON cep2.jogador_id = j2.id
//       GROUP BY cep1.jogador_id, cep2.jogador_id
//       HAVING gols_combinados > 0
//       ORDER BY gols_combinados DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro maisLetais:', e); }

//   return {
//     topDuplasGols,
//     maisJogaramJuntos,
//     maisVenceramJuntos,
//     muralhas,
//     maisLetais
//   };
// }

// Arquivo: src/models/analyticsModel.js
import pool from '../database/db.js';
import { PONTOS } from '../utils/constants.js';

/* ==========================================================================
   ANALYTICS GERAL (Visão Panorâmica) - FASE 2
========================================================================== */

export async function getDadosGerais() {
  // 1. Totais Absolutos
  const [totaisRows] = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM campeonato_partidas WHERE status = 'finalizada') as total_jogos,
      (SELECT COALESCE(SUM(placar_timeA + placar_timeB), 0) FROM campeonato_partidas WHERE status = 'finalizada') as total_gols,
      (SELECT COUNT(DISTINCT jogador_id) FROM campeonato_estatisticas_partida) as total_jogadores
  `);
  const totais = totaisRows[0];

  // 2. TOP 10 ARTILHEIROS (Gols + Jogos + Média)
  const [topArtilheiros] = await pool.query(`
    SELECT 
        j.id,
        j.nome, 
        j.foto_url, 
        COALESCE(SUM(cep.gols), 0) as gols,
        COUNT(DISTINCT cep.partida_id) as jogos,
        ROUND(CAST(COALESCE(SUM(cep.gols), 0) AS FLOAT) / NULLIF(COUNT(DISTINCT cep.partida_id), 0), 2) as media
    FROM campeonato_estatisticas_partida cep
    JOIN jogadores j ON cep.jogador_id = j.id
    GROUP BY j.id
    HAVING COALESCE(SUM(cep.gols), 0) > 0
    ORDER BY gols DESC
    LIMIT 10
  `);

  // 3. TOP 10 GARÇONS (Assists + Jogos + Média)
  const [topGarcons] = await pool.query(`
    SELECT 
        j.id,
        j.nome, 
        j.foto_url, 
        COALESCE(SUM(cep.assistencias), 0) as assistencias,
        COUNT(DISTINCT cep.partida_id) as jogos,
        ROUND(CAST(COALESCE(SUM(cep.assistencias), 0) AS FLOAT) / NULLIF(COUNT(DISTINCT cep.partida_id), 0), 2) as media
    FROM campeonato_estatisticas_partida cep
    JOIN jogadores j ON cep.jogador_id = j.id
    GROUP BY j.id
    HAVING COALESCE(SUM(cep.assistencias), 0) > 0
    ORDER BY assistencias DESC
    LIMIT 10
  `);

  // 4. TOP 10 ARTILHEIROS POR MÉDIA (mínimo 5 jogos)
  const [topMediaGols] = await pool.query(`
    SELECT 
        j.id,
        j.nome, 
        j.foto_url, 
        COALESCE(SUM(cep.gols), 0) as gols,
        COUNT(DISTINCT cep.partida_id) as jogos,
        ROUND(CAST(COALESCE(SUM(cep.gols), 0) AS FLOAT) / NULLIF(COUNT(DISTINCT cep.partida_id), 0), 2) as media
    FROM campeonato_estatisticas_partida cep
    JOIN jogadores j ON cep.jogador_id = j.id
    GROUP BY j.id
    HAVING COUNT(DISTINCT cep.partida_id) >= 5 AND COALESCE(SUM(cep.gols), 0) > 0
    ORDER BY media DESC
    LIMIT 10
  `);

  // 5. TOP 5 GOLEIROS
  let topGoleiros = [];
  try {
    const [gRows] = await pool.query(`
      SELECT 
          j.id,
          j.nome, 
          j.foto_url,
          COUNT(DISTINCT cp.id) as jogos,
          COALESCE(SUM(
              CASE 
                  WHEN cp.goleiro_timeA_id = j.id THEN cp.placar_timeB
                  WHEN cp.goleiro_timeB_id = j.id THEN cp.placar_timeA
                  ELSE 0
              END
          ), 0) as gols_sofridos,
          COALESCE(SUM(
              CASE 
                  WHEN cp.goleiro_timeA_id = j.id AND cp.placar_timeB = 0 THEN 1
                  WHEN cp.goleiro_timeB_id = j.id AND cp.placar_timeA = 0 THEN 1
                  ELSE 0
              END
          ), 0) as clean_sheets,
          ROUND(
              CAST(COALESCE(SUM(
                  CASE 
                      WHEN cp.goleiro_timeA_id = j.id THEN cp.placar_timeB
                      WHEN cp.goleiro_timeB_id = j.id THEN cp.placar_timeA
                      ELSE 0
                  END
              ), 0) AS FLOAT) / NULLIF(COUNT(DISTINCT cp.id), 0)
          , 2) as media_sofridos
      FROM jogadores j
      JOIN campeonato_partidas cp ON cp.goleiro_timeA_id = j.id OR cp.goleiro_timeB_id = j.id
      WHERE cp.status = 'finalizada'
      GROUP BY j.id
      HAVING COUNT(DISTINCT cp.id) >= 1
      ORDER BY media_sofridos ASC, clean_sheets DESC
      LIMIT 5
    `);
    topGoleiros = gRows;
  } catch (e) {
    console.log('Erro ao buscar goleiros:', e.message);
  }

  // 6. TOP 5 ZAGUEIROS
  let topZagueiros = [];
  try {
    const [zRows] = await pool.query(`
      SELECT 
          j.id,
          j.nome, 
          j.foto_url,
          COUNT(DISTINCT cep.partida_id) as jogos,
          COALESCE(SUM(cep.gols), 0) as gols,
          COALESCE(SUM(cep.assistencias), 0) as assistencias,
          COALESCE(SUM(cep.clean_sheet), 0) as clean_sheets,
          ROUND(
              CAST(COALESCE(SUM(
                  CASE 
                      WHEN cp.timeA_id = cep.time_id THEN cp.placar_timeB
                      WHEN cp.timeB_id = cep.time_id THEN cp.placar_timeA
                      ELSE 0
                  END
              ), 0) AS FLOAT) / NULLIF(COUNT(DISTINCT cep.partida_id), 0)
          , 2) as media_gols_sofridos
      FROM campeonato_estatisticas_partida cep
      JOIN jogadores j ON cep.jogador_id = j.id
      JOIN campeonato_partidas cp ON cep.partida_id = cp.id
      WHERE j.joga_recuado = 1 AND cp.status = 'finalizada'
      GROUP BY j.id
      HAVING COUNT(DISTINCT cep.partida_id) >= 1
      ORDER BY clean_sheets DESC, media_gols_sofridos ASC
      LIMIT 5
    `);
    topZagueiros = zRows;
  } catch (e) {
    console.log('Erro ao buscar zagueiros:', e.message);
  }

  // 7. TOP 5 PARTICIPAÇÕES
  const [topParticipacoes] = await pool.query(`
    SELECT 
        j.id,
        j.nome, 
        j.foto_url, 
        COALESCE(SUM(cep.gols), 0) as gols,
        COALESCE(SUM(cep.assistencias), 0) as assistencias,
        COALESCE(SUM(cep.gols), 0) + COALESCE(SUM(cep.assistencias), 0) as participacoes,
        COUNT(DISTINCT cep.partida_id) as jogos
    FROM campeonato_estatisticas_partida cep
    JOIN jogadores j ON cep.jogador_id = j.id
    GROUP BY j.id
    HAVING (COALESCE(SUM(cep.gols), 0) + COALESCE(SUM(cep.assistencias), 0)) > 0
    ORDER BY participacoes DESC
    LIMIT 5
  `);

  // 8. Evolução (Timeline de gols por mês)
  let evolucao = [];
  try {
    // MySQL: DATE_FORMAT em vez de strftime
    const [evoRows] = await pool.query(`
      SELECT 
          DATE_FORMAT(r.data, '%Y-%m') as mes_ano, 
          SUM(cp.placar_timeA + cp.placar_timeB) as total_gols,
          COUNT(cp.id) as total_jogos
      FROM campeonato_partidas cp
      JOIN rodadas r ON cp.rodada_id = r.id
      WHERE cp.status = 'finalizada'
      GROUP BY mes_ano
      ORDER BY mes_ano ASC
      LIMIT 12
    `);
    evolucao = evoRows;
  } catch (e) {
    // Se não tiver rodada_id, tenta sem
    try {
      const [evoRows2] = await pool.query(`
        SELECT 
            DATE_FORMAT(NOW(), '%Y-%m') as mes_ano, 
            SUM(placar_timeA + placar_timeB) as total_gols,
            COUNT(id) as total_jogos
        FROM campeonato_partidas
        WHERE status = 'finalizada'
      `);
      evolucao = evoRows2;
    } catch (e2) {
      console.log('Erro ao buscar evolução:', e2.message);
    }
  }

  // 9. Recordes
  const [recordesRows] = await pool.query(`
    SELECT 
        (SELECT MAX(ABS(placar_timeA - placar_timeB)) FROM campeonato_partidas WHERE status = 'finalizada') as maior_goleada,
        (SELECT MAX(placar_timeA + placar_timeB) FROM campeonato_partidas WHERE status = 'finalizada') as mais_gols_jogo
  `);
  const recordes = recordesRows[0];

  // 10. Melhor Dupla
  let melhorDupla = null;
  try {
    const [duplaRows] = await pool.query(`
      SELECT 
          jGarcom.id as garcom_id,
          jGarcom.nome as garcom_nome,
          jGarcom.foto_url as garcom_foto,
          jArtilheiro.id as artilheiro_id,
          jArtilheiro.nome as artilheiro_nome,
          jArtilheiro.foto_url as artilheiro_foto,
          COUNT(*) as gols_juntos
      FROM eventos_jogo gol
      JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
      JOIN jogadores jGarcom ON assist.jogador_id = jGarcom.id
      JOIN jogadores jArtilheiro ON gol.jogador_id = jArtilheiro.id
      WHERE gol.tipo_evento = 'gol'
      GROUP BY assist.jogador_id, gol.jogador_id
      ORDER BY gols_juntos DESC
      LIMIT 1
    `);
    melhorDupla = duplaRows[0];
  } catch (e) {
    console.log('Erro ao buscar melhor dupla:', e.message);
  }

  return {
    totais,
    rankings: {
        artilheiros: topArtilheiros || [],
        garcons: topGarcons || [],
        mediaGols: topMediaGols || [],
        goleiros: topGoleiros || [],
        zagueiros: topZagueiros || [],
        participacoes: topParticipacoes || []
    },
    evolucao: evolucao || [],
    recordes,
    melhorDupla
  };
}

/* ==========================================================================
   RANKING GERAL (Aba Analytics - Lista Completa)
========================================================================== */
export async function getRankingGeral() {
  const sql = `
    SELECT 
        j.id, 
        j.nome, 
        j.foto_url,
        COALESCE(SUM(cep.gols), 0) as total_gols,
        COALESCE(SUM(cep.assistencias), 0) as total_assistencias,
        COALESCE(SUM(cep.clean_sheet), 0) as total_clean_sheets,
        COUNT(DISTINCT cep.partida_id) as jogos_disputados,
        (
            (COALESCE(SUM(cep.gols), 0) * ${PONTOS.GOLS}) + 
            (COALESCE(SUM(cep.assistencias), 0) * ${PONTOS.ASSISTENCIAS}) +
            (COALESCE(SUM(cep.clean_sheet), 0) * ${PONTOS.CLEAN_SHEET})
        ) as pontuacao_total
    FROM campeonato_estatisticas_partida cep
    JOIN jogadores j ON cep.jogador_id = j.id
    GROUP BY j.id
    ORDER BY pontuacao_total DESC
    LIMIT 50
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

/* ==========================================================================
   MELHORES DUPLAS (Top 10)
========================================================================== */
export async function getMelhoresDuplas() {
  try {
    const sql = `
      SELECT 
          jGarcom.id as garcom_id,
          jGarcom.nome as garcom_nome,
          jGarcom.foto_url as garcom_foto,
          jArtilheiro.id as artilheiro_id,
          jArtilheiro.nome as artilheiro_nome,
          jArtilheiro.foto_url as artilheiro_foto,
          COUNT(*) as gols_juntos
      FROM eventos_jogo gol
      JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
      JOIN jogadores jGarcom ON assist.jogador_id = jGarcom.id
      JOIN jogadores jArtilheiro ON gol.jogador_id = jArtilheiro.id
      WHERE gol.tipo_evento = 'gol'
      GROUP BY assist.jogador_id, gol.jogador_id
      ORDER BY gols_juntos DESC
      LIMIT 10
    `;
    const [rows] = await pool.query(sql);
    return rows;
  } catch (e) {
    return [];
  }
}

/* ==========================================================================
   PERFIL DE JOGADOR (Full Stats) - FASE 3 COMPLETA
========================================================================== */
export async function getPlayerFullStats(jogadorId) {
  // Info básica do jogador
  const [jRows] = await pool.query(`
    SELECT id, nome, foto_url, joga_recuado, posicao, nivel
    FROM jogadores WHERE id = ?
  `, [jogadorId]);
  const jogador = jRows[0];

  // 1. TOTAIS GERAIS
  const [totaisRows] = await pool.query(`
    SELECT 
        COALESCE(SUM(gols), 0) as gols, 
        COALESCE(SUM(assistencias), 0) as assists,
        COALESCE(SUM(clean_sheet), 0) as clean_sheets,
        COUNT(DISTINCT partida_id) as jogos
    FROM campeonato_estatisticas_partida 
    WHERE jogador_id = ?
  `, [jogadorId]);
  const totais = totaisRows[0];

  // 2. DESEMPENHO (V/E/D)
  const [desempenhoRows] = await pool.query(`
    SELECT 
        COALESCE(SUM(CASE 
          WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
               (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
          THEN 1 ELSE 0 END), 0) as vitorias,
        COALESCE(SUM(CASE WHEN cp.placar_timeA = cp.placar_timeB THEN 1 ELSE 0 END), 0) as empates,
        COALESCE(SUM(CASE 
          WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA < cp.placar_timeB) OR 
               (cp.timeB_id = cep.time_id AND cp.placar_timeB < cp.placar_timeA) 
          THEN 1 ELSE 0 END), 0) as derrotas
    FROM campeonato_estatisticas_partida cep
    JOIN campeonato_partidas cp ON cep.partida_id = cp.id
    WHERE cep.jogador_id = ? AND cp.status = 'finalizada'
  `, [jogadorId]);
  const desempenho = desempenhoRows[0];

  // 3. RECORDES PESSOAIS
  let recordes = {};
  try {
    const [golsRec] = await pool.query(`
      SELECT MAX(gols) as max_gols FROM campeonato_estatisticas_partida WHERE jogador_id = ?
    `, [jogadorId]);
    recordes.mais_gols_partida = golsRec[0]?.max_gols || 0;

    const [assistsRec] = await pool.query(`
      SELECT MAX(assistencias) as max_assists FROM campeonato_estatisticas_partida WHERE jogador_id = ?
    `, [jogadorId]);
    recordes.mais_assists_partida = assistsRec[0]?.max_assists || 0;
  } catch (e) {}

  // 4. PARCERIAS - GARÇOM FAVORITO
  let garcomFavorito = null;
  try {
    const [gfRows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(*) as total
      FROM eventos_jogo gol
      JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
      JOIN jogadores j ON assist.jogador_id = j.id
      WHERE gol.jogador_id = ? AND gol.tipo_evento = 'gol'
      GROUP BY assist.jogador_id
      ORDER BY total DESC
      LIMIT 1
    `, [jogadorId]);
    garcomFavorito = gfRows[0];
  } catch (e) {}

  // 5. PARCERIAS - ARTILHEIRO FAVORITO
  let artilheiroFavorito = null;
  try {
    const [afRows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(*) as total
      FROM eventos_jogo gol
      JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
      JOIN jogadores j ON gol.jogador_id = j.id
      WHERE assist.jogador_id = ? AND gol.tipo_evento = 'gol'
      GROUP BY gol.jogador_id
      ORDER BY total DESC
      LIMIT 1
    `, [jogadorId]);
    artilheiroFavorito = afRows[0];
  } catch (e) {}

  // 6. PARCERIAS - ZAGUEIRO MAIS SÓLIDO
  let zagueiroSolido = null;
  try {
    const [zsRows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, SUM(cep2.clean_sheet) as clean_sheets
      FROM campeonato_estatisticas_partida cep1
      JOIN campeonato_estatisticas_partida cep2 ON cep1.partida_id = cep2.partida_id AND cep1.time_id = cep2.time_id
      JOIN jogadores j ON cep2.jogador_id = j.id
      WHERE cep1.jogador_id = ? 
        AND cep2.jogador_id != ?
        AND j.joga_recuado = 1
      GROUP BY cep2.jogador_id
      ORDER BY clean_sheets DESC
      LIMIT 1
    `, [jogadorId, jogadorId]);
    zagueiroSolido = zsRows[0];
  } catch (e) {}

  // 7. PARCERIAS - ZAGUEIRO ARTILHEIRO
  let zagueiroArtilheiro = null;
  try {
    const [zaRows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, SUM(cep2.gols) as gols
      FROM campeonato_estatisticas_partida cep1
      JOIN campeonato_estatisticas_partida cep2 ON cep1.partida_id = cep2.partida_id AND cep1.time_id = cep2.time_id
      JOIN jogadores j ON cep2.jogador_id = j.id
      WHERE cep1.jogador_id = ? 
        AND cep2.jogador_id != ?
        AND j.joga_recuado = 1
      GROUP BY cep2.jogador_id
      HAVING SUM(cep2.gols) > 0
      ORDER BY gols DESC
      LIMIT 1
    `, [jogadorId, jogadorId]);
    zagueiroArtilheiro = zaRows[0];
  } catch (e) {}

  // 8. PARCERIAS - GOLEIRO DE CONFIANÇA
  let goleiroConfianca = null;
  try {
    const [gcRows] = await pool.query(`
      SELECT 
        j.id, j.nome, j.foto_url,
        COUNT(DISTINCT cp.id) as jogos_juntos,
        SUM(CASE 
          WHEN (cp.goleiro_timeA_id = j.id AND cp.placar_timeB = 0) OR 
               (cp.goleiro_timeB_id = j.id AND cp.placar_timeA = 0) 
          THEN 1 ELSE 0 END) as clean_sheets,
        ROUND(
          CAST(SUM(CASE 
            WHEN cp.goleiro_timeA_id = j.id THEN cp.placar_timeB
            WHEN cp.goleiro_timeB_id = j.id THEN cp.placar_timeA
            ELSE 0 END) AS FLOAT) / NULLIF(COUNT(DISTINCT cp.id), 0)
        , 2) as media_sofridos
      FROM campeonato_estatisticas_partida cep
      JOIN campeonato_partidas cp ON cep.partida_id = cp.id
      JOIN jogadores j ON (cp.goleiro_timeA_id = j.id AND cp.timeA_id = cep.time_id) 
                       OR (cp.goleiro_timeB_id = j.id AND cp.timeB_id = cep.time_id)
      WHERE cep.jogador_id = ? AND cp.status = 'finalizada'
      GROUP BY j.id
      ORDER BY clean_sheets DESC, media_sofridos ASC
      LIMIT 1
    `, [jogadorId]);
    goleiroConfianca = gcRows[0];
  } catch (e) {}

  // 9. PARCEIRO MAIS FREQUENTE
  let parceiroFrequente = null;
  try {
    const [pfRows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(DISTINCT cep1.partida_id) as jogos_juntos
      FROM campeonato_estatisticas_partida cep1
      JOIN campeonato_estatisticas_partida cep2 ON cep1.partida_id = cep2.partida_id AND cep1.time_id = cep2.time_id
      JOIN jogadores j ON cep2.jogador_id = j.id
      WHERE cep1.jogador_id = ? AND cep2.jogador_id != ?
      GROUP BY cep2.jogador_id
      ORDER BY jogos_juntos DESC
      LIMIT 1
    `, [jogadorId, jogadorId]);
    parceiroFrequente = pfRows[0];
  } catch (e) {}

  // 10. PARCEIRO DE VITÓRIAS
  let parceiroVitorias = null;
  try {
    const [pvRows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(DISTINCT cep1.partida_id) as vitorias_juntos
      FROM campeonato_estatisticas_partida cep1
      JOIN campeonato_estatisticas_partida cep2 ON cep1.partida_id = cep2.partida_id AND cep1.time_id = cep2.time_id
      JOIN campeonato_partidas cp ON cep1.partida_id = cp.id
      JOIN jogadores j ON cep2.jogador_id = j.id
      WHERE cep1.jogador_id = ? AND cep2.jogador_id != ?
        AND (
          (cp.timeA_id = cep1.time_id AND cp.placar_timeA > cp.placar_timeB) OR
          (cp.timeB_id = cep1.time_id AND cp.placar_timeB > cp.placar_timeA)
        )
      GROUP BY cep2.jogador_id
      ORDER BY vitorias_juntos DESC
      LIMIT 1
    `, [jogadorId, jogadorId]);
    parceiroVitorias = pvRows[0];
  } catch (e) {}

  // 11. ÚLTIMAS PARTIDAS (últimos 10 jogos)
  let ultimasPartidas = [];
  try {
    const [upRows] = await pool.query(`
      SELECT 
        cp.id as partida_id,
        r.data,
        cep.gols,
        cep.assistencias,
        cep.clean_sheet,
        cp.placar_timeA,
        cp.placar_timeB,
        cp.timeA_id,
        cp.timeB_id,
        cep.time_id,
        tA.nome as timeA_nome,
        tB.nome as timeB_nome,
        CASE 
          WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
               (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
          THEN 'V'
          WHEN cp.placar_timeA = cp.placar_timeB THEN 'E'
          ELSE 'D'
        END as resultado
      FROM campeonato_estatisticas_partida cep
      JOIN campeonato_partidas cp ON cep.partida_id = cp.id
      JOIN times tA ON cp.timeA_id = tA.id
      JOIN times tB ON cp.timeB_id = tB.id
      LEFT JOIN rodadas r ON cp.rodada_id = r.id
      WHERE cep.jogador_id = ? AND cp.status = 'finalizada'
      ORDER BY cp.id DESC
      LIMIT 10
    `, [jogadorId]);
    ultimasPartidas = upRows;
  } catch (e) {}

  // 12. TÍTULOS
  let titulos = [];
  try {
    const [tRows] = await pool.query(`
      SELECT c.nome, c.data 
      FROM campeonato_vencedores cv
      JOIN campeonatos c ON cv.campeonato_id = c.id
      WHERE cv.jogador_id = ?
    `, [jogadorId]);
    titulos = tRows;
  } catch (e) {}

  // 13. PRÊMIOS INDIVIDUAIS
  let premios = [];
  try {
    const [pRows] = await pool.query(`
      SELECT tipo_premio, valor, c.nome as campeonato_nome
      FROM campeonato_premios cp
      JOIN campeonatos c ON cp.campeonato_id = c.id
      WHERE jogador_id = ?
    `, [jogadorId]);
    premios = pRows;
  } catch (e) {}

  return {
    jogador,
    totais,
    desempenho,
    recordes,
    parcerias: {
      garcomFavorito,
      artilheiroFavorito,
      zagueiroSolido,
      zagueiroArtilheiro,
      goleiroConfianca,
      parceiroFrequente,
      parceiroVitorias
    },
    ultimasPartidas,
    titulos,
    premios
  };
}

/* ==========================================================================
   CONFRONTO DIRETO (1v1)
========================================================================== */
export async function getConfrontoDireto(jogadorA_id, jogadorB_id) {
  // Info básica dos jogadores
  const [rowsA] = await pool.query(`
    SELECT id, nome, foto_url, posicao, joga_recuado, nivel
    FROM jogadores WHERE id = ?
  `, [jogadorA_id]);
  const jogadorA = rowsA[0];
  
  const [rowsB] = await pool.query(`
    SELECT id, nome, foto_url, posicao, joga_recuado, nivel
    FROM jogadores WHERE id = ?
  `, [jogadorB_id]);
  const jogadorB = rowsB[0];

  // Stats gerais de cada jogador
  const [statsARows] = await pool.query(`
    SELECT 
      COUNT(DISTINCT partida_id) as jogos,
      COALESCE(SUM(gols), 0) as gols,
      COALESCE(SUM(assistencias), 0) as assists,
      COALESCE(SUM(clean_sheet), 0) as clean_sheets
    FROM campeonato_estatisticas_partida
    WHERE jogador_id = ?
  `, [jogadorA_id]);
  const statsA = statsARows[0];

  const [statsBRows] = await pool.query(`
    SELECT 
      COUNT(DISTINCT partida_id) as jogos,
      COALESCE(SUM(gols), 0) as gols,
      COALESCE(SUM(assistencias), 0) as assists,
      COALESCE(SUM(clean_sheet), 0) as clean_sheets
    FROM campeonato_estatisticas_partida
    WHERE jogador_id = ?
  `, [jogadorB_id]);
  const statsB = statsBRows[0];

  // Desempenho
  const [desempenhoARows] = await pool.query(`
    SELECT 
      COUNT(*) as jogos,
      SUM(CASE 
        WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
             (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
        THEN 1 ELSE 0 
      END) as vitorias,
      SUM(CASE WHEN cp.placar_timeA = cp.placar_timeB THEN 1 ELSE 0 END) as empates,
      SUM(CASE 
        WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA < cp.placar_timeB) OR 
             (cp.timeB_id = cep.time_id AND cp.placar_timeB < cp.placar_timeA) 
        THEN 1 ELSE 0 
      END) as derrotas
    FROM campeonato_estatisticas_partida cep
    JOIN campeonato_partidas cp ON cep.partida_id = cp.id
    WHERE cep.jogador_id = ? AND cp.status = 'finalizada'
  `, [jogadorA_id]);
  const desempenhoA = desempenhoARows[0];

  const [desempenhoBRows] = await pool.query(`
    SELECT 
      COUNT(*) as jogos,
      SUM(CASE 
        WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
             (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
        THEN 1 ELSE 0 
      END) as vitorias,
      SUM(CASE WHEN cp.placar_timeA = cp.placar_timeB THEN 1 ELSE 0 END) as empates,
      SUM(CASE 
        WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA < cp.placar_timeB) OR 
             (cp.timeB_id = cep.time_id AND cp.placar_timeB < cp.placar_timeA) 
        THEN 1 ELSE 0 
      END) as derrotas
    FROM campeonato_estatisticas_partida cep
    JOIN campeonato_partidas cp ON cep.partida_id = cp.id
    WHERE cep.jogador_id = ? AND cp.status = 'finalizada'
  `, [jogadorB_id]);
  const desempenhoB = desempenhoBRows[0];

  // CONFRONTOS DIRETOS
  const [confrontoRows] = await pool.query(`
    SELECT 
      COUNT(DISTINCT cp.id) as jogos,
      SUM(CASE 
        WHEN (cp.placar_timeA > cp.placar_timeB AND sA.time_id = cp.timeA_id) OR 
             (cp.placar_timeB > cp.placar_timeA AND sA.time_id = cp.timeB_id) 
        THEN 1 ELSE 0 
      END) as vitorias_A,
      SUM(CASE 
        WHEN (cp.placar_timeA > cp.placar_timeB AND sB.time_id = cp.timeA_id) OR 
             (cp.placar_timeB > cp.placar_timeA AND sB.time_id = cp.timeB_id) 
        THEN 1 ELSE 0 
      END) as vitorias_B,
      SUM(CASE WHEN cp.placar_timeA = cp.placar_timeB THEN 1 ELSE 0 END) as empates,
      COALESCE(SUM(sA.gols), 0) as gols_A,
      COALESCE(SUM(sB.gols), 0) as gols_B,
      COALESCE(SUM(sA.assistencias), 0) as assists_A,
      COALESCE(SUM(sB.assistencias), 0) as assists_B
    FROM campeonato_partidas cp
    JOIN campeonato_estatisticas_partida sA ON cp.id = sA.partida_id AND sA.jogador_id = ?
    JOIN campeonato_estatisticas_partida sB ON cp.id = sB.partida_id AND sB.jogador_id = ?
    WHERE cp.status = 'finalizada' AND sA.time_id != sB.time_id
  `, [jogadorA_id, jogadorB_id]);
  const confronto = confrontoRows[0];

  // Quantas vezes jogaram JUNTOS
  const [parceriaRows] = await pool.query(`
    SELECT 
      COUNT(DISTINCT sA.partida_id) as jogos_juntos,
      SUM(CASE 
        WHEN (cp.placar_timeA > cp.placar_timeB AND sA.time_id = cp.timeA_id) OR 
             (cp.placar_timeB > cp.placar_timeA AND sA.time_id = cp.timeB_id) 
        THEN 1 ELSE 0 
      END) as vitorias_juntos
    FROM campeonato_partidas cp
    JOIN campeonato_estatisticas_partida sA ON cp.id = sA.partida_id AND sA.jogador_id = ?
    JOIN campeonato_estatisticas_partida sB ON cp.id = sB.partida_id AND sB.jogador_id = ?
    WHERE cp.status = 'finalizada' AND sA.time_id = sB.time_id
  `, [jogadorA_id, jogadorB_id]);
  const parceria = parceriaRows[0];

  // Gols de A assistidos por B (e vice-versa)
  let golsAbyB = 0;
  let golsBbyA = 0;
  try {
    const [resAbyB] = await pool.query(`
      SELECT COUNT(*) as total
      FROM eventos_jogo gol
      JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
      WHERE gol.jogador_id = ? AND assist.jogador_id = ? AND gol.tipo_evento = 'gol'
    `, [jogadorA_id, jogadorB_id]);
    golsAbyB = resAbyB[0]?.total || 0;

    const [resBbyA] = await pool.query(`
      SELECT COUNT(*) as total
      FROM eventos_jogo gol
      JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
      WHERE gol.jogador_id = ? AND assist.jogador_id = ? AND gol.tipo_evento = 'gol'
    `, [jogadorB_id, jogadorA_id]);
    golsBbyA = resBbyA[0]?.total || 0;
  } catch (e) {}

  return { 
    jogadorA: {
      ...jogadorA,
      stats: statsA,
      desempenho: desempenhoA
    },
    jogadorB: {
      ...jogadorB,
      stats: statsB,
      desempenho: desempenhoB
    },
    confronto: confronto || { jogos: 0, vitorias_A: 0, vitorias_B: 0, empates: 0, gols_A: 0, gols_B: 0 },
    parceria: {
      jogos_juntos: parceria?.jogos_juntos || 0,
      vitorias_juntos: parceria?.vitorias_juntos || 0,
      gols_A_assistidos_por_B: golsAbyB,
      gols_B_assistidos_por_A: golsBbyA
    }
  };
}

/* ==========================================================================
   TIME FULL STATS
========================================================================== */
export async function getTimeFullStats(timeId) {
  let titulos = [];
  try {
    const [tRows] = await pool.query(`
      SELECT c.id, c.nome, c.data, c.formato
      FROM campeonatos c
      WHERE c.time_campeao_id = ?
      ORDER BY c.data DESC
    `, [timeId]);
    titulos = tRows;
  } catch (e) {}

  const [desempenhoRows] = await pool.query(`
    SELECT 
        COUNT(*) as jogos,
        SUM(CASE WHEN (cp.timeA_id = ? AND cp.placar_timeA > cp.placar_timeB) OR (cp.timeB_id = ? AND cp.placar_timeB > cp.placar_timeA) THEN 1 ELSE 0 END) as vitorias,
        SUM(CASE WHEN cp.placar_timeA = cp.placar_timeB THEN 1 ELSE 0 END) as empates,
        SUM(CASE WHEN (cp.timeA_id = ? AND cp.placar_timeA < cp.placar_timeB) OR (cp.timeB_id = ? AND cp.placar_timeB < cp.placar_timeA) THEN 1 ELSE 0 END) as derrotas,
        SUM(CASE WHEN cp.timeA_id = ? THEN cp.placar_timeA WHEN cp.timeB_id = ? THEN cp.placar_timeB ELSE 0 END) as gols_pro,
        SUM(CASE WHEN cp.timeA_id = ? THEN cp.placar_timeB WHEN cp.timeB_id = ? THEN cp.placar_timeA ELSE 0 END) as gols_contra
    FROM campeonato_partidas cp
    WHERE (cp.timeA_id = ? OR cp.timeB_id = ?) AND cp.status = 'finalizada'
  `, [timeId, timeId, timeId, timeId, timeId, timeId, timeId, timeId, timeId, timeId]);
  const desempenho = desempenhoRows[0];

  const [artilheiros] = await pool.query(`
    SELECT j.nome, j.foto_url, SUM(cep.gols) as total
    FROM campeonato_estatisticas_partida cep
    JOIN jogadores j ON cep.jogador_id = j.id
    WHERE cep.time_id = ?
    GROUP BY j.id
    ORDER BY total DESC
    LIMIT 5
  `, [timeId]);

  const [garcons] = await pool.query(`
    SELECT j.nome, j.foto_url, SUM(cep.assistencias) as total
    FROM campeonato_estatisticas_partida cep
    JOIN jogadores j ON cep.jogador_id = j.id
    WHERE cep.time_id = ?
    GROUP BY j.id
    ORDER BY total DESC
    LIMIT 5
  `, [timeId]);

  const [maisJogaram] = await pool.query(`
    SELECT j.id, j.nome, j.foto_url, COUNT(DISTINCT cep.partida_id) as total
    FROM campeonato_estatisticas_partida cep
    JOIN jogadores j ON cep.jogador_id = j.id
    WHERE cep.time_id = ?
    GROUP BY j.id
    ORDER BY total DESC
    LIMIT 5
  `, [timeId]);

  // Últimas partidas do time
  let ultimasPartidas = [];
  try {
    const [upRows] = await pool.query(`
      SELECT 
        cp.id as partida_id,
        r.data,
        cp.placar_timeA,
        cp.placar_timeB,
        cp.timeA_id,
        cp.timeB_id,
        tA.nome as timeA_nome,
        tA.logo_url as timeA_logo,
        tB.nome as timeB_nome,
        tB.logo_url as timeB_logo,
        CASE 
          WHEN (cp.timeA_id = ? AND cp.placar_timeA > cp.placar_timeB) OR 
               (cp.timeB_id = ? AND cp.placar_timeB > cp.placar_timeA) 
          THEN 'V'
          WHEN cp.placar_timeA = cp.placar_timeB THEN 'E'
          ELSE 'D'
        END as resultado
      FROM campeonato_partidas cp
      JOIN times tA ON cp.timeA_id = tA.id
      JOIN times tB ON cp.timeB_id = tB.id
      LEFT JOIN rodadas r ON cp.rodada_id = r.id
      WHERE (cp.timeA_id = ? OR cp.timeB_id = ?) AND cp.status = 'finalizada'
      ORDER BY cp.id DESC
      LIMIT 10
    `, [timeId, timeId, timeId, timeId]);
    ultimasPartidas = upRows;
  } catch (e) {}

  const [timeInfoRows] = await pool.query('SELECT * FROM times WHERE id = ?', [timeId]);
  const timeInfo = timeInfoRows[0];

  return {
    info: timeInfo,
    titulos: titulos || [],
    desempenho,
    rankings: {
        artilheiros: artilheiros || [],
        garcons: garcons || [],
        mais_jogaram: maisJogaram || []
    },
    ultimasPartidas: ultimasPartidas || []
  };
}

/* ==========================================================================
   SINERGIA (PARCERIAS)
========================================================================== */
export async function getSinergiaJogador(jogadorId) {
  let maisJogaramJuntos = null;
  try {
    const [rows] = await pool.query(`
      SELECT j.nome, j.foto_url, COUNT(DISTINCT t1.partida_id) as total
      FROM campeonato_estatisticas_partida t1
      JOIN campeonato_estatisticas_partida t2 ON t1.partida_id = t2.partida_id AND t1.time_id = t2.time_id
      JOIN jogadores j ON t2.jogador_id = j.id
      WHERE t1.jogador_id = ? AND t2.jogador_id != ?
      GROUP BY t2.jogador_id
      ORDER BY total DESC LIMIT 1
    `, [jogadorId, jogadorId]);
    maisJogaramJuntos = rows[0];
  } catch (e) {}

  let maisVenceramJuntos = null;
  try {
    const [rows] = await pool.query(`
      SELECT j.nome, j.foto_url, COUNT(DISTINCT t1.partida_id) as total
      FROM campeonato_estatisticas_partida t1
      JOIN campeonato_estatisticas_partida t2 ON t1.partida_id = t2.partida_id AND t1.time_id = t2.time_id
      JOIN campeonato_partidas cp ON t1.partida_id = cp.id
      JOIN jogadores j ON t2.jogador_id = j.id
      WHERE t1.jogador_id = ? AND t2.jogador_id != ?
      AND (
          (cp.timeA_id = t1.time_id AND cp.placar_timeA > cp.placar_timeB) OR
          (cp.timeB_id = t1.time_id AND cp.placar_timeB > cp.placar_timeA)
      )
      GROUP BY t2.jogador_id
      ORDER BY total DESC LIMIT 1
    `, [jogadorId, jogadorId]);
    maisVenceramJuntos = rows[0];
  } catch (e) {}

  let garcomFavorito = null;
  try {
    const [rows] = await pool.query(`
      SELECT j.nome, j.foto_url, COUNT(*) as total
      FROM eventos_jogo gol
      JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
      JOIN jogadores j ON assist.jogador_id = j.id
      WHERE gol.jogador_id = ? AND gol.tipo_evento = 'gol'
      GROUP BY assist.jogador_id
      ORDER BY total DESC LIMIT 1
    `, [jogadorId]);
    garcomFavorito = rows[0];
  } catch (e) {}

  let artilheiroFavorito = null;
  try {
    const [rows] = await pool.query(`
      SELECT j.nome, j.foto_url, COUNT(*) as total
      FROM eventos_jogo gol
      JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
      JOIN jogadores j ON gol.jogador_id = j.id
      WHERE assist.jogador_id = ? AND gol.tipo_evento = 'gol'
      GROUP BY gol.jogador_id
      ORDER BY total DESC LIMIT 1
    `, [jogadorId]);
    artilheiroFavorito = rows[0];
  } catch (e) {}

  return {
    maisJogaramJuntos,
    maisVenceramJuntos,
    garcomFavorito,
    artilheiroFavorito
  };
}

/* ==========================================================================
   SINERGIA GERAL (RANKINGS DE DUPLAS)
========================================================================== */
export async function getSinergiaGeral() {
  // 1. TOP DUPLAS ARTILHEIRO + GARÇOM
  let topDuplasGols = [];
  try {
    const [rows] = await pool.query(`
      SELECT 
        jGol.id as artilheiro_id,
        jGol.nome as artilheiro_nome,
        jGol.foto_url as artilheiro_foto,
        jAssist.id as garcom_id,
        jAssist.nome as garcom_nome,
        jAssist.foto_url as garcom_foto,
        COUNT(*) as gols_juntos
      FROM eventos_jogo gol
      JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
      JOIN jogadores jGol ON gol.jogador_id = jGol.id
      JOIN jogadores jAssist ON assist.jogador_id = jAssist.id
      WHERE gol.tipo_evento = 'gol'
      GROUP BY gol.jogador_id, assist.jogador_id
      ORDER BY gols_juntos DESC
      LIMIT 10
    `);
    topDuplasGols = rows;
  } catch (e) { console.error('Erro topDuplasGols:', e); }

  // 2. DUPLAS QUE MAIS JOGARAM JUNTAS
  let maisJogaramJuntos = [];
  try {
    const [rows] = await pool.query(`
      SELECT 
        j1.id as jogador1_id,
        j1.nome as jogador1_nome,
        j1.foto_url as jogador1_foto,
        j2.id as jogador2_id,
        j2.nome as jogador2_nome,
        j2.foto_url as jogador2_foto,
        COUNT(DISTINCT cep1.partida_id) as jogos_juntos
      FROM campeonato_estatisticas_partida cep1
      JOIN campeonato_estatisticas_partida cep2 
        ON cep1.partida_id = cep2.partida_id 
        AND cep1.time_id = cep2.time_id
        AND cep1.jogador_id < cep2.jogador_id
      JOIN jogadores j1 ON cep1.jogador_id = j1.id
      JOIN jogadores j2 ON cep2.jogador_id = j2.id
      GROUP BY cep1.jogador_id, cep2.jogador_id
      ORDER BY jogos_juntos DESC
      LIMIT 10
    `);
    maisJogaramJuntos = rows;
  } catch (e) { console.error('Erro maisJogaramJuntos:', e); }

  // 3. DUPLAS QUE MAIS VENCERAM JUNTAS
  let maisVenceramJuntos = [];
  try {
    const [rows] = await pool.query(`
      SELECT 
        j1.id as jogador1_id,
        j1.nome as jogador1_nome,
        j1.foto_url as jogador1_foto,
        j2.id as jogador2_id,
        j2.nome as jogador2_nome,
        j2.foto_url as jogador2_foto,
        COUNT(DISTINCT cep1.partida_id) as vitorias_juntos
      FROM campeonato_estatisticas_partida cep1
      JOIN campeonato_estatisticas_partida cep2 
        ON cep1.partida_id = cep2.partida_id 
        AND cep1.time_id = cep2.time_id
        AND cep1.jogador_id < cep2.jogador_id
      JOIN campeonato_partidas cp ON cep1.partida_id = cp.id
      JOIN jogadores j1 ON cep1.jogador_id = j1.id
      JOIN jogadores j2 ON cep2.jogador_id = j2.id
      WHERE (
        (cp.timeA_id = cep1.time_id AND cp.placar_timeA > cp.placar_timeB) OR
        (cp.timeB_id = cep1.time_id AND cp.placar_timeB > cp.placar_timeA)
      )
      GROUP BY cep1.jogador_id, cep2.jogador_id
      ORDER BY vitorias_juntos DESC
      LIMIT 10
    `);
    maisVenceramJuntos = rows;
  } catch (e) { console.error('Erro maisVenceramJuntos:', e); }

  // 4. MURALHAS
  let muralhas = [];
  try {
    const [rows] = await pool.query(`
      SELECT 
        j1.id as jogador1_id,
        j1.nome as jogador1_nome,
        j1.foto_url as jogador1_foto,
        j2.id as jogador2_id,
        j2.nome as jogador2_nome,
        j2.foto_url as jogador2_foto,
        SUM(CASE WHEN cep1.clean_sheet = 1 AND cep2.clean_sheet = 1 THEN 1 ELSE 0 END) as clean_sheets_juntos,
        COUNT(DISTINCT cep1.partida_id) as jogos_juntos
      FROM campeonato_estatisticas_partida cep1
      JOIN campeonato_estatisticas_partida cep2 
        ON cep1.partida_id = cep2.partida_id 
        AND cep1.time_id = cep2.time_id
        AND cep1.jogador_id < cep2.jogador_id
      JOIN jogadores j1 ON cep1.jogador_id = j1.id
      JOIN jogadores j2 ON cep2.jogador_id = j2.id
      WHERE j1.joga_recuado = 1 AND j2.joga_recuado = 1
      GROUP BY cep1.jogador_id, cep2.jogador_id
      HAVING clean_sheets_juntos > 0
      ORDER BY clean_sheets_juntos DESC, jogos_juntos DESC
      LIMIT 10
    `);
    muralhas = rows;
  } catch (e) { console.error('Erro muralhas:', e); }

  // 5. DUPLAS MAIS LETAIS
  let maisLetais = [];
  try {
    const [rows] = await pool.query(`
      SELECT 
        j1.id as jogador1_id,
        j1.nome as jogador1_nome,
        j1.foto_url as jogador1_foto,
        j2.id as jogador2_id,
        j2.nome as jogador2_nome,
        j2.foto_url as jogador2_foto,
        SUM(cep1.gols + cep2.gols) as gols_combinados,
        COUNT(DISTINCT cep1.partida_id) as jogos_juntos
      FROM campeonato_estatisticas_partida cep1
      JOIN campeonato_estatisticas_partida cep2 
        ON cep1.partida_id = cep2.partida_id 
        AND cep1.time_id = cep2.time_id
        AND cep1.jogador_id < cep2.jogador_id
      JOIN jogadores j1 ON cep1.jogador_id = j1.id
      JOIN jogadores j2 ON cep2.jogador_id = j2.id
      GROUP BY cep1.jogador_id, cep2.jogador_id
      HAVING gols_combinados > 0
      ORDER BY gols_combinados DESC
      LIMIT 10
    `);
    maisLetais = rows;
  } catch (e) { console.error('Erro maisLetais:', e); }

  return {
    topDuplasGols,
    maisJogaramJuntos,
    maisVenceramJuntos,
    muralhas,
    maisLetais
  };
}