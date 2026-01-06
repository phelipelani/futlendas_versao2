// // Arquivo: src/models/hallDaFamaModel.js
// import dbPromise from '../database/db.js';

// /* ==========================================================================
//    PANTEÃO DAS LENDAS - HALL DA FAMA COMPLETO
//    Queries baseadas no schema real do banco de dados
   
//    TABELAS PRINCIPAIS:
//    - premios_rodada: MVP semanal, pé de rato semanal (tipo_premio)
//    - campeonato_premios: MVP campeonato, artilheiro, assistências (tipo_premio)
//    - campeonato_vencedores: jogadores campeões
//    - campeonato_rodada_elencos: jogadores que jogaram em cada rodada/time
//    - campeonatos: time_campeao_id
// ========================================================================== */

// export async function getHallDaFama() {
//   const db = await dbPromise;

//   // =========================================================================
//   // SEÇÃO 1: G.O.A.T - GREATEST OF ALL TIME
//   // Fórmula: (gols × 4) + (assists × 3) + (CS × 4) + (títulos × 10) + (MVP camp × 5) + (MVP semanal × 2)
//   // =========================================================================
//   let goat = null;
//   try {
//     goat = await db.get(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COALESCE(stats.gols, 0) as total_gols,
//         COALESCE(stats.assists, 0) as total_assists,
//         COALESCE(stats.clean_sheets, 0) as total_clean_sheets,
//         COALESCE(stats.jogos, 0) as total_jogos,
//         COALESCE(titulos.qtd, 0) as qtd_titulos,
//         COALESCE(mvp_camp.qtd, 0) as mvp_campeonato,
//         COALESCE(mvp_sem.qtd, 0) as mvp_semanal,
//         (
//           (COALESCE(stats.gols, 0) * 4) + 
//           (COALESCE(stats.assists, 0) * 3) + 
//           (COALESCE(stats.clean_sheets, 0) * 4) + 
//           (COALESCE(titulos.qtd, 0) * 10) +
//           (COALESCE(mvp_camp.qtd, 0) * 5) +
//           (COALESCE(mvp_sem.qtd, 0) * 2)
//         ) as score_lendario
//       FROM jogadores j
//       LEFT JOIN (
//         SELECT 
//           jogador_id,
//           SUM(gols) as gols,
//           SUM(assistencias) as assists,
//           SUM(CASE WHEN clean_sheet = 1 THEN 1 ELSE 0 END) as clean_sheets,
//           COUNT(DISTINCT partida_id) as jogos
//         FROM campeonato_estatisticas_partida
//         GROUP BY jogador_id
//       ) stats ON j.id = stats.jogador_id
//       LEFT JOIN (
//         SELECT jogador_id, COUNT(*) as qtd
//         FROM campeonato_vencedores
//         GROUP BY jogador_id
//       ) titulos ON j.id = titulos.jogador_id
//       LEFT JOIN (
//         SELECT jogador_id, COUNT(*) as qtd
//         FROM campeonato_premios
//         WHERE tipo_premio = 'mvp'
//         GROUP BY jogador_id
//       ) mvp_camp ON j.id = mvp_camp.jogador_id
//       LEFT JOIN (
//         SELECT jogador_id, COUNT(*) as qtd
//         FROM premios_rodada
//         WHERE tipo_premio = 'mvp'
//         GROUP BY jogador_id
//       ) mvp_sem ON j.id = mvp_sem.jogador_id
//       WHERE stats.jogos > 0
//       ORDER BY score_lendario DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro GOAT:', e.message); }

//   // =========================================================================
//   // SEÇÃO 2: MAIORES CAMPEÕES
//   // Primeiro tenta campeonato_vencedores, depois campeonato_rodada_elencos
//   // =========================================================================
//   let maioresCampeoes = [];
//   try {
//     // Tenta tabela de vencedores
//     maioresCampeoes = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(DISTINCT cv.campeonato_id) as total
//       FROM campeonato_vencedores cv
//       JOIN jogadores j ON cv.jogador_id = j.id
//       GROUP BY j.id
//       ORDER BY total DESC
//       LIMIT 10
//     `);
    
//     // Se vazia, busca jogadores que jogaram pelo time campeão
//     if (!maioresCampeoes || maioresCampeoes.length === 0) {
//       maioresCampeoes = await db.all(`
//         SELECT 
//           j.id,
//           j.nome,
//           j.foto_url,
//           COUNT(DISTINCT c.id) as total
//         FROM campeonatos c
//         JOIN campeonato_rodada_elencos cre ON cre.rodada_id IN (
//           SELECT id FROM rodadas WHERE campeonato_id = c.id
//         ) AND cre.time_id = c.time_campeao_id
//         JOIN jogadores j ON cre.jogador_id = j.id
//         WHERE c.time_campeao_id IS NOT NULL AND c.fase_atual = 'finalizado'
//         GROUP BY j.id
//         ORDER BY total DESC
//         LIMIT 10
//       `);
//     }
//   } catch (e) { console.error('Erro maioresCampeoes:', e.message); }

//   // =========================================================================
//   // SEÇÃO 3: ARTILHEIROS E GARÇONS ALL-TIME
//   // =========================================================================
  
//   let artilheirosAllTime = [];
//   try {
//     artilheirosAllTime = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         SUM(cep.gols) as total,
//         COUNT(DISTINCT cep.partida_id) as jogos,
//         ROUND(CAST(SUM(cep.gols) AS FLOAT) / COUNT(DISTINCT cep.partida_id), 2) as media
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       GROUP BY j.id
//       HAVING SUM(cep.gols) > 0
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro artilheirosAllTime:', e.message); }

//   let garconsAllTime = [];
//   try {
//     garconsAllTime = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         SUM(cep.assistencias) as total,
//         COUNT(DISTINCT cep.partida_id) as jogos,
//         ROUND(CAST(SUM(cep.assistencias) AS FLOAT) / COUNT(DISTINCT cep.partida_id), 2) as media
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       GROUP BY j.id
//       HAVING SUM(cep.assistencias) > 0
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro garconsAllTime:', e.message); }

//   // Participações Decisivas (G+A)
//   let participacoesDecisivas = [];
//   try {
//     participacoesDecisivas = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         SUM(cep.gols) as gols,
//         SUM(cep.assistencias) as assists,
//         SUM(cep.gols + cep.assistencias) as total
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       GROUP BY j.id
//       HAVING total > 0
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro participacoesDecisivas:', e.message); }

//   // Os Incansáveis (mais partidas)
//   let incansaveis = [];
//   try {
//     incansaveis = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(DISTINCT cep.partida_id) as total
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       GROUP BY j.id
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro incansaveis:', e.message); }

//   // =========================================================================
//   // SEÇÃO 4: PRÊMIOS MVP E PÉ DE RATO
//   // =========================================================================
  
//   // MVP do Campeonato (peso 5)
//   let mvpCampeonato = [];
//   try {
//     mvpCampeonato = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(cp.id) as total
//       FROM campeonato_premios cp
//       JOIN jogadores j ON cp.jogador_id = j.id
//       WHERE cp.tipo_premio = 'mvp'
//       GROUP BY j.id
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro mvpCampeonato:', e.message); }

//   // MVP Semanal (peso 2.5)
//   let mvpSemanal = [];
//   try {
//     mvpSemanal = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(pr.id) as total
//       FROM premios_rodada pr
//       JOIN jogadores j ON pr.jogador_id = j.id
//       WHERE pr.tipo_premio = 'mvp'
//       GROUP BY j.id
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro mvpSemanal:', e.message); }

//   // Pé de Rato do Campeonato (anti-prêmio)
//   let peDeRatoCampeonato = [];
//   try {
//     peDeRatoCampeonato = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(cp.id) as total
//       FROM campeonato_premios cp
//       JOIN jogadores j ON cp.jogador_id = j.id
//       WHERE cp.tipo_premio = 'pe_de_rato' OR cp.tipo_premio = 'pior'
//       GROUP BY j.id
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro peDeRatoCampeonato:', e.message); }

//   // Pé de Rato Semanal (anti-prêmio)
//   let peDeRatoSemanal = [];
//   try {
//     peDeRatoSemanal = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(pr.id) as total
//       FROM premios_rodada pr
//       JOIN jogadores j ON pr.jogador_id = j.id
//       WHERE pr.tipo_premio = 'pe_de_rato' OR pr.tipo_premio = 'pior'
//       GROUP BY j.id
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro peDeRatoSemanal:', e.message); }

//   // Chuteiras de Ouro (artilheiro de campeonato)
//   let chuteirasOuro = [];
//   try {
//     chuteirasOuro = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(cp.id) as total
//       FROM campeonato_premios cp
//       JOIN jogadores j ON cp.jogador_id = j.id
//       WHERE cp.tipo_premio = 'artilheiro'
//       GROUP BY j.id
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro chuteirasOuro:', e.message); }

//   // Luvas de Ouro (garçom de campeonato)
//   let luvasOuro = [];
//   try {
//     luvasOuro = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(cp.id) as total
//       FROM campeonato_premios cp
//       JOIN jogadores j ON cp.jogador_id = j.id
//       WHERE cp.tipo_premio = 'assistencias' OR cp.tipo_premio = 'garcom'
//       GROUP BY j.id
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro luvasOuro:', e.message); }

//   // =========================================================================
//   // SEÇÃO 5: GOLEIROS LENDÁRIOS
//   // =========================================================================
  
//   let goleirosLendarios = [];
//   try {
//     goleirosLendarios = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(DISTINCT cp.id) as jogos,
//         SUM(CASE 
//           WHEN (cp.goleiro_timeA_id = j.id AND cp.placar_timeB = 0) OR
//                (cp.goleiro_timeB_id = j.id AND cp.placar_timeA = 0)
//           THEN 1 ELSE 0 
//         END) as clean_sheets,
//         SUM(CASE 
//           WHEN cp.goleiro_timeA_id = j.id THEN cp.placar_timeB
//           WHEN cp.goleiro_timeB_id = j.id THEN cp.placar_timeA
//           ELSE 0
//         END) as gols_sofridos
//       FROM jogadores j
//       JOIN campeonato_partidas cp ON cp.goleiro_timeA_id = j.id OR cp.goleiro_timeB_id = j.id
//       WHERE cp.status = 'finalizada'
//       GROUP BY j.id
//       ORDER BY jogos DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro goleirosLendarios:', e.message); }

//   let goleirosCleanSheet = [];
//   try {
//     goleirosCleanSheet = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(DISTINCT cp.id) as jogos,
//         SUM(CASE 
//           WHEN (cp.goleiro_timeA_id = j.id AND cp.placar_timeB = 0) OR
//                (cp.goleiro_timeB_id = j.id AND cp.placar_timeA = 0)
//           THEN 1 ELSE 0 
//         END) as total
//       FROM jogadores j
//       JOIN campeonato_partidas cp ON cp.goleiro_timeA_id = j.id OR cp.goleiro_timeB_id = j.id
//       WHERE cp.status = 'finalizada'
//       GROUP BY j.id
//       HAVING total > 0
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro goleirosCleanSheet:', e.message); }

//   let goleirosMelhorMedia = [];
//   try {
//     goleirosMelhorMedia = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(DISTINCT cp.id) as jogos,
//         SUM(CASE 
//           WHEN cp.goleiro_timeA_id = j.id THEN cp.placar_timeB
//           WHEN cp.goleiro_timeB_id = j.id THEN cp.placar_timeA
//           ELSE 0
//         END) as gols_sofridos,
//         ROUND(CAST(SUM(CASE 
//           WHEN cp.goleiro_timeA_id = j.id THEN cp.placar_timeB
//           WHEN cp.goleiro_timeB_id = j.id THEN cp.placar_timeA
//           ELSE 0
//         END) AS FLOAT) / COUNT(DISTINCT cp.id), 2) as media
//       FROM jogadores j
//       JOIN campeonato_partidas cp ON cp.goleiro_timeA_id = j.id OR cp.goleiro_timeB_id = j.id
//       WHERE cp.status = 'finalizada'
//       GROUP BY j.id
//       HAVING jogos >= 5
//       ORDER BY media ASC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro goleirosMelhorMedia:', e.message); }

//   // =========================================================================
//   // SEÇÃO 6: MURALHAS (ZAGUEIROS)
//   // =========================================================================
  
//   let muralhas = [];
//   try {
//     muralhas = await db.all(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(DISTINCT cep.partida_id) as jogos,
//         SUM(CASE WHEN cep.clean_sheet = 1 THEN 1 ELSE 0 END) as total
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       WHERE j.joga_recuado = 1
//       GROUP BY j.id
//       HAVING total > 0
//       ORDER BY total DESC
//       LIMIT 10
//     `);
//   } catch (e) { console.error('Erro muralhas:', e.message); }

//   // =========================================================================
//   // SEÇÃO 7: RECORDES DE PARTIDA ÚNICA
//   // =========================================================================
  
//   let hatTrickKing = null;
//   try {
//     hatTrickKing = await db.get(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         cep.gols as recorde,
//         tA.nome as timeA_nome,
//         tB.nome as timeB_nome,
//         cp.placar_timeA,
//         cp.placar_timeB,
//         c.nome as campeonato_nome
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       JOIN campeonato_partidas cp ON cep.partida_id = cp.id
//       JOIN times tA ON cp.timeA_id = tA.id
//       JOIN times tB ON cp.timeB_id = tB.id
//       JOIN campeonatos c ON cp.campeonato_id = c.id
//       WHERE cp.status = 'finalizada' AND cep.gols > 0
//       ORDER BY cep.gols DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro hatTrickKing:', e.message); }

//   let assistenteReal = null;
//   try {
//     assistenteReal = await db.get(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         cep.assistencias as recorde,
//         tA.nome as timeA_nome,
//         tB.nome as timeB_nome,
//         cp.placar_timeA,
//         cp.placar_timeB,
//         c.nome as campeonato_nome
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       JOIN campeonato_partidas cp ON cep.partida_id = cp.id
//       JOIN times tA ON cp.timeA_id = tA.id
//       JOIN times tB ON cp.timeB_id = tB.id
//       JOIN campeonatos c ON cp.campeonato_id = c.id
//       WHERE cp.status = 'finalizada' AND cep.assistencias > 0
//       ORDER BY cep.assistencias DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro assistenteReal:', e.message); }

//   let showCompleto = null;
//   try {
//     showCompleto = await db.get(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         cep.gols,
//         cep.assistencias,
//         (cep.gols + cep.assistencias) as recorde,
//         tA.nome as timeA_nome,
//         tB.nome as timeB_nome,
//         c.nome as campeonato_nome
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       JOIN campeonato_partidas cp ON cep.partida_id = cp.id
//       JOIN times tA ON cp.timeA_id = tA.id
//       JOIN times tB ON cp.timeB_id = tB.id
//       JOIN campeonatos c ON cp.campeonato_id = c.id
//       WHERE cp.status = 'finalizada'
//       ORDER BY (cep.gols + cep.assistencias) DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro showCompleto:', e.message); }

//   // =========================================================================
//   // SEÇÃO 8: EFICIÊNCIA (mín. 10 jogos)
//   // =========================================================================
  
//   let melhorMediaGols = null;
//   try {
//     melhorMediaGols = await db.get(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         SUM(cep.gols) as gols,
//         COUNT(DISTINCT cep.partida_id) as jogos,
//         ROUND(CAST(SUM(cep.gols) AS FLOAT) / COUNT(DISTINCT cep.partida_id), 2) as media
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       GROUP BY j.id
//       HAVING jogos >= 10
//       ORDER BY media DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro melhorMediaGols:', e.message); }

//   let melhorMediaAssists = null;
//   try {
//     melhorMediaAssists = await db.get(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         SUM(cep.assistencias) as assists,
//         COUNT(DISTINCT cep.partida_id) as jogos,
//         ROUND(CAST(SUM(cep.assistencias) AS FLOAT) / COUNT(DISTINCT cep.partida_id), 2) as media
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       GROUP BY j.id
//       HAVING jogos >= 10
//       ORDER BY media DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro melhorMediaAssists:', e.message); }

//   let melhorAproveitamento = null;
//   try {
//     melhorAproveitamento = await db.get(`
//       SELECT 
//         j.id,
//         j.nome,
//         j.foto_url,
//         COUNT(DISTINCT cep.partida_id) as jogos,
//         SUM(CASE 
//           WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
//                (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
//           THEN 1 ELSE 0 
//         END) as vitorias,
//         ROUND(
//           CAST(SUM(CASE 
//             WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
//                  (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
//             THEN 1 ELSE 0 
//           END) AS FLOAT) / COUNT(DISTINCT cep.partida_id) * 100,
//         1) as aproveitamento
//       FROM campeonato_estatisticas_partida cep
//       JOIN jogadores j ON cep.jogador_id = j.id
//       JOIN campeonato_partidas cp ON cep.partida_id = cp.id
//       WHERE cp.status = 'finalizada'
//       GROUP BY j.id
//       HAVING jogos >= 15
//       ORDER BY aproveitamento DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro melhorAproveitamento:', e.message); }

//   // =========================================================================
//   // SEÇÃO 9: PARTIDAS HISTÓRICAS
//   // =========================================================================
  
//   let partidaMaisGols = null;
//   try {
//     partidaMaisGols = await db.get(`
//       SELECT 
//         cp.id,
//         cp.placar_timeA,
//         cp.placar_timeB,
//         (cp.placar_timeA + cp.placar_timeB) as total_gols,
//         tA.nome as timeA_nome,
//         tA.logo_url as timeA_logo,
//         tB.nome as timeB_nome,
//         tB.logo_url as timeB_logo,
//         c.nome as campeonato_nome
//       FROM campeonato_partidas cp
//       JOIN times tA ON cp.timeA_id = tA.id
//       JOIN times tB ON cp.timeB_id = tB.id
//       JOIN campeonatos c ON cp.campeonato_id = c.id
//       WHERE cp.status = 'finalizada'
//       ORDER BY total_gols DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro partidaMaisGols:', e.message); }

//   let maiorGoleada = null;
//   try {
//     maiorGoleada = await db.get(`
//       SELECT 
//         cp.id,
//         cp.placar_timeA,
//         cp.placar_timeB,
//         ABS(cp.placar_timeA - cp.placar_timeB) as diferenca,
//         tA.nome as timeA_nome,
//         tA.logo_url as timeA_logo,
//         tB.nome as timeB_nome,
//         tB.logo_url as timeB_logo,
//         c.nome as campeonato_nome,
//         CASE WHEN cp.placar_timeA > cp.placar_timeB THEN tA.nome ELSE tB.nome END as vencedor
//       FROM campeonato_partidas cp
//       JOIN times tA ON cp.timeA_id = tA.id
//       JOIN times tB ON cp.timeB_id = tB.id
//       JOIN campeonatos c ON cp.campeonato_id = c.id
//       WHERE cp.status = 'finalizada' AND cp.placar_timeA != cp.placar_timeB
//       ORDER BY diferenca DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro maiorGoleada:', e.message); }

//   let empateMaisGols = null;
//   try {
//     empateMaisGols = await db.get(`
//       SELECT 
//         cp.id,
//         cp.placar_timeA,
//         cp.placar_timeB,
//         (cp.placar_timeA + cp.placar_timeB) as total_gols,
//         tA.nome as timeA_nome,
//         tA.logo_url as timeA_logo,
//         tB.nome as timeB_nome,
//         tB.logo_url as timeB_logo,
//         c.nome as campeonato_nome
//       FROM campeonato_partidas cp
//       JOIN times tA ON cp.timeA_id = tA.id
//       JOIN times tB ON cp.timeB_id = tB.id
//       JOIN campeonatos c ON cp.campeonato_id = c.id
//       WHERE cp.status = 'finalizada' AND cp.placar_timeA = cp.placar_timeB AND cp.placar_timeA > 0
//       ORDER BY total_gols DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro empateMaisGols:', e.message); }

//   // =========================================================================
//   // SEÇÃO 10: TIMES
//   // =========================================================================
  
//   let dinastia = null;
//   try {
//     dinastia = await db.get(`
//       SELECT 
//         t.id,
//         t.nome,
//         t.logo_url,
//         COUNT(c.id) as total
//       FROM campeonatos c
//       JOIN times t ON c.time_campeao_id = t.id
//       WHERE c.time_campeao_id IS NOT NULL
//       GROUP BY t.id
//       ORDER BY total DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro dinastia:', e.message); }

//   let timeArtilheiro = null;
//   try {
//     timeArtilheiro = await db.get(`
//       SELECT 
//         t.id,
//         t.nome,
//         t.logo_url,
//         SUM(CASE WHEN cp.timeA_id = t.id THEN cp.placar_timeA ELSE cp.placar_timeB END) as total,
//         COUNT(DISTINCT cp.id) as jogos
//       FROM times t
//       JOIN campeonato_partidas cp ON cp.timeA_id = t.id OR cp.timeB_id = t.id
//       WHERE cp.status = 'finalizada'
//       GROUP BY t.id
//       ORDER BY total DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro timeArtilheiro:', e.message); }

//   let timeMelhorDefesa = null;
//   try {
//     timeMelhorDefesa = await db.get(`
//       SELECT 
//         t.id,
//         t.nome,
//         t.logo_url,
//         COUNT(DISTINCT cp.id) as jogos,
//         SUM(CASE WHEN cp.timeA_id = t.id THEN cp.placar_timeB ELSE cp.placar_timeA END) as gols_sofridos,
//         ROUND(
//           CAST(SUM(CASE WHEN cp.timeA_id = t.id THEN cp.placar_timeB ELSE cp.placar_timeA END) AS FLOAT) / 
//           COUNT(DISTINCT cp.id), 
//         2) as media
//       FROM times t
//       JOIN campeonato_partidas cp ON cp.timeA_id = t.id OR cp.timeB_id = t.id
//       WHERE cp.status = 'finalizada'
//       GROUP BY t.id
//       HAVING jogos >= 5
//       ORDER BY media ASC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro timeMelhorDefesa:', e.message); }

//   let timeMaisVitorias = null;
//   try {
//     timeMaisVitorias = await db.get(`
//       SELECT 
//         t.id,
//         t.nome,
//         t.logo_url,
//         COUNT(DISTINCT cp.id) as jogos,
//         SUM(CASE 
//           WHEN (cp.timeA_id = t.id AND cp.placar_timeA > cp.placar_timeB) OR 
//                (cp.timeB_id = t.id AND cp.placar_timeB > cp.placar_timeA) 
//           THEN 1 ELSE 0 
//         END) as total
//       FROM times t
//       JOIN campeonato_partidas cp ON cp.timeA_id = t.id OR cp.timeB_id = t.id
//       WHERE cp.status = 'finalizada'
//       GROUP BY t.id
//       ORDER BY total DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro timeMaisVitorias:', e.message); }

//   // =========================================================================
//   // SEÇÃO 11: DUPLAS LENDÁRIAS
//   // =========================================================================
  
//   let duplaConexao = null;
//   try {
//     duplaConexao = await db.get(`
//       SELECT 
//         jGol.id as artilheiro_id,
//         jGol.nome as artilheiro_nome,
//         jGol.foto_url as artilheiro_foto,
//         jAssist.id as garcom_id,
//         jAssist.nome as garcom_nome,
//         jAssist.foto_url as garcom_foto,
//         COUNT(*) as total
//       FROM eventos_jogo gol
//       JOIN eventos_jogo assist ON gol.evento_pai_id = assist.id
//       JOIN jogadores jGol ON gol.jogador_id = jGol.id
//       JOIN jogadores jAssist ON assist.jogador_id = jAssist.id
//       WHERE gol.tipo_evento = 'gol'
//       GROUP BY gol.jogador_id, assist.jogador_id
//       ORDER BY total DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro duplaConexao:', e.message); }

//   let duplaInseparavel = null;
//   try {
//     duplaInseparavel = await db.get(`
//       SELECT 
//         j1.id as jogador1_id,
//         j1.nome as jogador1_nome,
//         j1.foto_url as jogador1_foto,
//         j2.id as jogador2_id,
//         j2.nome as jogador2_nome,
//         j2.foto_url as jogador2_foto,
//         COUNT(DISTINCT cep1.partida_id) as total
//       FROM campeonato_estatisticas_partida cep1
//       JOIN campeonato_estatisticas_partida cep2 ON cep1.partida_id = cep2.partida_id 
//         AND cep1.time_id = cep2.time_id
//         AND cep1.jogador_id < cep2.jogador_id
//       JOIN jogadores j1 ON cep1.jogador_id = j1.id
//       JOIN jogadores j2 ON cep2.jogador_id = j2.id
//       GROUP BY cep1.jogador_id, cep2.jogador_id
//       ORDER BY total DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro duplaInseparavel:', e.message); }

//   let duplaVencedora = null;
//   try {
//     duplaVencedora = await db.get(`
//       SELECT 
//         j1.id as jogador1_id,
//         j1.nome as jogador1_nome,
//         j1.foto_url as jogador1_foto,
//         j2.id as jogador2_id,
//         j2.nome as jogador2_nome,
//         j2.foto_url as jogador2_foto,
//         COUNT(DISTINCT cep1.partida_id) as total
//       FROM campeonato_estatisticas_partida cep1
//       JOIN campeonato_estatisticas_partida cep2 ON cep1.partida_id = cep2.partida_id 
//         AND cep1.time_id = cep2.time_id
//         AND cep1.jogador_id < cep2.jogador_id
//       JOIN jogadores j1 ON cep1.jogador_id = j1.id
//       JOIN jogadores j2 ON cep2.jogador_id = j2.id
//       JOIN campeonato_partidas cp ON cep1.partida_id = cp.id
//       WHERE (cp.timeA_id = cep1.time_id AND cp.placar_timeA > cp.placar_timeB)
//          OR (cp.timeB_id = cep1.time_id AND cp.placar_timeB > cp.placar_timeA)
//       GROUP BY cep1.jogador_id, cep2.jogador_id
//       ORDER BY total DESC
//       LIMIT 1
//     `);
//   } catch (e) { console.error('Erro duplaVencedora:', e.message); }

//   // =========================================================================
//   // SEÇÃO 12: ESTATÍSTICAS GERAIS
//   // =========================================================================
  
//   let estatisticasGerais = null;
//   try {
//     estatisticasGerais = await db.get(`
//       SELECT 
//         (SELECT COUNT(*) FROM campeonato_partidas WHERE status = 'finalizada') as total_partidas,
//         (SELECT COALESCE(SUM(placar_timeA + placar_timeB), 0) FROM campeonato_partidas WHERE status = 'finalizada') as total_gols,
//         (SELECT ROUND(CAST(COALESCE(SUM(placar_timeA + placar_timeB), 0) AS FLOAT) / NULLIF(COUNT(*), 0), 2) FROM campeonato_partidas WHERE status = 'finalizada') as media_gols,
//         (SELECT COUNT(DISTINCT jogador_id) FROM campeonato_estatisticas_partida) as total_jogadores,
//         (SELECT COUNT(*) FROM campeonatos WHERE time_campeao_id IS NOT NULL) as total_campeonatos,
//         (SELECT COUNT(DISTINCT id) FROM times) as total_times
//     `);
//   } catch (e) { console.error('Erro estatisticasGerais:', e.message); }

//   // =========================================================================
//   // RETORNO FINAL
//   // =========================================================================
//   return {
//     goat,
    
//     rankings: {
//       maioresCampeoes,
//       artilheirosAllTime,
//       garconsAllTime,
//       participacoesDecisivas,
//       incansaveis
//     },
    
//     premios: {
//       mvpCampeonato,
//       mvpSemanal,
//       peDeRatoCampeonato,
//       peDeRatoSemanal,
//       chuteirasOuro,
//       luvasOuro
//     },
    
//     goleiros: {
//       lendarios: goleirosLendarios,
//       cleanSheets: goleirosCleanSheet,
//       melhorMedia: goleirosMelhorMedia
//     },
    
//     muralhas,
    
//     recordesPartida: {
//       hatTrickKing,
//       assistenteReal,
//       showCompleto
//     },
    
//     eficiencia: {
//       melhorMediaGols,
//       melhorMediaAssists,
//       melhorAproveitamento
//     },
    
//     partidasHistoricas: {
//       maisGols: partidaMaisGols,
//       maiorGoleada,
//       empateMaisGols
//     },
    
//     times: {
//       dinastia,
//       artilheiro: timeArtilheiro,
//       melhorDefesa: timeMelhorDefesa,
//       maisVitorias: timeMaisVitorias
//     },
    
//     duplas: {
//       conexao: duplaConexao,
//       inseparavel: duplaInseparavel,
//       vencedora: duplaVencedora
//     },
    
//     estatisticasGerais
//   };
// }

// Arquivo: src/models/hallDaFamaModel.js
import pool from '../database/db.js';

/* ==========================================================================
   PANTEÃO DAS LENDAS - HALL DA FAMA COMPLETO
========================================================================== */

export async function getHallDaFama() {
  // =========================================================================
  // SEÇÃO 1: G.O.A.T - GREATEST OF ALL TIME
  // Fórmula: (gols × 4) + (assists × 3) + (CS × 4) + (títulos × 10) + (MVP camp × 5) + (MVP semanal × 2)
  // =========================================================================
  let goat = null;
  try {
    const [rows] = await pool.query(`
      SELECT 
        j.id,
        j.nome,
        j.foto_url,
        COALESCE(stats.gols, 0) as total_gols,
        COALESCE(stats.assists, 0) as total_assists,
        COALESCE(stats.clean_sheets, 0) as total_clean_sheets,
        COALESCE(titulos.qtd, 0) as total_titulos,
        COALESCE(mvp_camp.qtd, 0) as total_mvp_camp,
        COALESCE(mvp_sem.qtd, 0) as total_mvp_sem,
        (
          (COALESCE(stats.gols, 0) * 4) + 
          (COALESCE(stats.assists, 0) * 3) + 
          (COALESCE(stats.clean_sheets, 0) * 4) + 
          (COALESCE(titulos.qtd, 0) * 10) +
          (COALESCE(mvp_camp.qtd, 0) * 5) +
          (COALESCE(mvp_sem.qtd, 0) * 2)
        ) as goat_points
      FROM jogadores j
      LEFT JOIN (
        SELECT jogador_id, SUM(gols) as gols, SUM(assistencias) as assists, SUM(clean_sheet) as clean_sheets
        FROM campeonato_estatisticas_partida
        GROUP BY jogador_id
      ) stats ON j.id = stats.jogador_id
      LEFT JOIN (
        SELECT jogador_id, COUNT(*) as qtd FROM campeonato_vencedores GROUP BY jogador_id
      ) titulos ON j.id = titulos.jogador_id
      LEFT JOIN (
        SELECT jogador_id, COUNT(*) as qtd FROM campeonato_premios WHERE tipo_premio = 'mvp_campeonato' GROUP BY jogador_id
      ) mvp_camp ON j.id = mvp_camp.jogador_id
      LEFT JOIN (
        SELECT jogador_id, COUNT(*) as qtd FROM premios_rodada WHERE tipo_premio = 'mvp' GROUP BY jogador_id
      ) mvp_sem ON j.id = mvp_sem.jogador_id
      ORDER BY goat_points DESC
      LIMIT 1
    `);
    goat = rows[0];
  } catch (e) { console.error('Erro GOAT:', e.message); }

  // =========================================================================
  // SEÇÃO 2: RANKINGS HISTÓRICOS
  // =========================================================================

  // MAIORES CAMPEÕES
  let maioresCampeoes = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(cv.campeonato_id) as titulos
      FROM campeonato_vencedores cv
      JOIN jogadores j ON cv.jogador_id = j.id
      GROUP BY j.id, j.nome, j.foto_url
      ORDER BY titulos DESC
      LIMIT 5
    `);
    maioresCampeoes = rows;
  } catch (e) { console.error('Erro maioresCampeoes:', e.message); }

  // MAIORES ARTILHEIROS (ALL-TIME)
  let artilheirosAllTime = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, SUM(cep.gols) as total
      FROM campeonato_estatisticas_partida cep
      JOIN jogadores j ON cep.jogador_id = j.id
      GROUP BY j.id, j.nome, j.foto_url
      HAVING total > 0
      ORDER BY total DESC
      LIMIT 5
    `);
    artilheirosAllTime = rows;
  } catch (e) { console.error('Erro artilheirosAllTime:', e.message); }

  // MAIORES GARÇONS (ALL-TIME)
  let garconsAllTime = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, SUM(cep.assistencias) as total
      FROM campeonato_estatisticas_partida cep
      JOIN jogadores j ON cep.jogador_id = j.id
      GROUP BY j.id, j.nome, j.foto_url
      HAVING total > 0
      ORDER BY total DESC
      LIMIT 5
    `);
    garconsAllTime = rows;
  } catch (e) { console.error('Erro garconsAllTime:', e.message); }

  // PARTICIPAÇÕES DECISIVAS (Gols em Finais)
  let participacoesDecisivas = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, SUM(cep.gols + cep.assistencias) as total
      FROM campeonato_estatisticas_partida cep
      JOIN campeonato_partidas cp ON cep.partida_id = cp.id
      JOIN jogadores j ON cep.jogador_id = j.id
      WHERE cp.fase_mata_mata = 'final' OR cp.fase_mata_mata = 'grand_final'
      GROUP BY j.id, j.nome, j.foto_url
      HAVING total > 0
      ORDER BY total DESC
      LIMIT 5
    `);
    participacoesDecisivas = rows;
  } catch (e) { console.error('Erro participacoesDecisivas:', e.message); }

  // INCANSÁVEIS (Mais Jogos)
  let incansaveis = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(DISTINCT cep.partida_id) as total
      FROM campeonato_estatisticas_partida cep
      JOIN jogadores j ON cep.jogador_id = j.id
      GROUP BY j.id, j.nome, j.foto_url
      ORDER BY total DESC
      LIMIT 5
    `);
    incansaveis = rows;
  } catch (e) { console.error('Erro incansaveis:', e.message); }

  // =========================================================================
  // SEÇÃO 3: GALERIA DE TROFÉUS (Prêmios acumulados)
  // =========================================================================

  // MVP de Campeonato
  let mvpCampeonato = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(*) as total
      FROM campeonato_premios cp
      JOIN jogadores j ON cp.jogador_id = j.id
      WHERE cp.tipo_premio = 'mvp_campeonato'
      GROUP BY j.id, j.nome, j.foto_url
      ORDER BY total DESC
      LIMIT 3
    `);
    mvpCampeonato = rows;
  } catch (e) { console.error('Erro mvpCampeonato:', e.message); }

  // MVP Semanal
  let mvpSemanal = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(*) as total
      FROM premios_rodada pr
      JOIN jogadores j ON pr.jogador_id = j.id
      WHERE pr.tipo_premio = 'mvp'
      GROUP BY j.id, j.nome, j.foto_url
      ORDER BY total DESC
      LIMIT 3
    `);
    mvpSemanal = rows;
  } catch (e) { console.error('Erro mvpSemanal:', e.message); }

  // Pé de Rato (Campeonato)
  let peDeRatoCampeonato = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(*) as total
      FROM campeonato_premios cp
      JOIN jogadores j ON cp.jogador_id = j.id
      WHERE cp.tipo_premio = 'pe_de_rato'
      GROUP BY j.id, j.nome, j.foto_url
      ORDER BY total DESC
      LIMIT 3
    `);
    peDeRatoCampeonato = rows;
  } catch (e) { console.error('Erro peDeRatoCampeonato:', e.message); }

  // Pé de Rato (Semanal)
  let peDeRatoSemanal = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(*) as total
      FROM premios_rodada pr
      JOIN jogadores j ON pr.jogador_id = j.id
      WHERE pr.tipo_premio = 'pe_de_rato'
      GROUP BY j.id, j.nome, j.foto_url
      ORDER BY total DESC
      LIMIT 3
    `);
    peDeRatoSemanal = rows;
  } catch (e) { console.error('Erro peDeRatoSemanal:', e.message); }

  // Chuteira de Ouro (Artilharias)
  let chuteirasOuro = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(*) as total
      FROM campeonato_premios cp
      JOIN jogadores j ON cp.jogador_id = j.id
      WHERE cp.tipo_premio = 'artilheiro'
      GROUP BY j.id, j.nome, j.foto_url
      ORDER BY total DESC
      LIMIT 3
    `);
    chuteirasOuro = rows;
  } catch (e) { console.error('Erro chuteirasOuro:', e.message); }

  // Luva de Ouro (Melhor Goleiro)
  let luvasOuro = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(*) as total
      FROM campeonato_premios cp
      JOIN jogadores j ON cp.jogador_id = j.id
      WHERE cp.tipo_premio = 'melhor_goleiro'
      GROUP BY j.id, j.nome, j.foto_url
      ORDER BY total DESC
      LIMIT 3
    `);
    luvasOuro = rows;
  } catch (e) { console.error('Erro luvasOuro:', e.message); }

  // =========================================================================
  // SEÇÃO 4: GOLEIROS (Parede)
  // =========================================================================
  
  // Goleiros com mais jogos
  let goleirosLendarios = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, COUNT(DISTINCT cp.id) as total_jogos
      FROM campeonato_partidas cp
      JOIN jogadores j ON (cp.goleiro_timeA_id = j.id OR cp.goleiro_timeB_id = j.id)
      WHERE cp.status = 'finalizada'
      GROUP BY j.id, j.nome, j.foto_url
      ORDER BY total_jogos DESC
      LIMIT 5
    `);
    goleirosLendarios = rows;
  } catch (e) { console.error('Erro goleirosLendarios:', e.message); }

  // Goleiros com mais Clean Sheets
  let goleirosCleanSheet = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url,
        SUM(CASE 
          WHEN cp.goleiro_timeA_id = j.id AND cp.placar_timeB = 0 THEN 1
          WHEN cp.goleiro_timeB_id = j.id AND cp.placar_timeA = 0 THEN 1
          ELSE 0 
        END) as total
      FROM campeonato_partidas cp
      JOIN jogadores j ON (cp.goleiro_timeA_id = j.id OR cp.goleiro_timeB_id = j.id)
      WHERE cp.status = 'finalizada'
      GROUP BY j.id, j.nome, j.foto_url
      HAVING total > 0
      ORDER BY total DESC
      LIMIT 5
    `);
    goleirosCleanSheet = rows;
  } catch (e) { console.error('Erro goleirosCleanSheet:', e.message); }

  // Goleiros - Menor Média de Gols Sofridos (min 5 jogos)
  let goleirosMelhorMedia = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url,
        COUNT(DISTINCT cp.id) as jogos,
        SUM(CASE 
          WHEN cp.goleiro_timeA_id = j.id THEN cp.placar_timeB
          WHEN cp.goleiro_timeB_id = j.id THEN cp.placar_timeA
          ELSE 0 
        END) as gols_sofridos,
        ROUND(CAST(SUM(CASE 
          WHEN cp.goleiro_timeA_id = j.id THEN cp.placar_timeB
          WHEN cp.goleiro_timeB_id = j.id THEN cp.placar_timeA
          ELSE 0 
        END) AS FLOAT) / COUNT(DISTINCT cp.id), 2) as media
      FROM campeonato_partidas cp
      JOIN jogadores j ON (cp.goleiro_timeA_id = j.id OR cp.goleiro_timeB_id = j.id)
      WHERE cp.status = 'finalizada'
      GROUP BY j.id, j.nome, j.foto_url
      HAVING jogos >= 5
      ORDER BY media ASC
      LIMIT 5
    `);
    goleirosMelhorMedia = rows;
  } catch (e) { console.error('Erro goleirosMelhorMedia:', e.message); }

  // Muralhas (Zagueiros com mais Clean Sheets)
  let muralhas = [];
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, SUM(cep.clean_sheet) as total
      FROM campeonato_estatisticas_partida cep
      JOIN jogadores j ON cep.jogador_id = j.id
      WHERE j.joga_recuado = 1
      GROUP BY j.id, j.nome, j.foto_url
      HAVING total > 0
      ORDER BY total DESC
      LIMIT 5
    `);
    muralhas = rows;
  } catch (e) { console.error('Erro muralhas:', e.message); }

  // =========================================================================
  // SEÇÃO 5: RECORDES DE UMA ÚNICA PARTIDA
  // =========================================================================

  // Hat-trick King (Quem fez mais Hat-tricks) ou Mais Gols em 1 Jogo
  let hatTrickKing = null;
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, MAX(cep.gols) as recorde, r.data
      FROM campeonato_estatisticas_partida cep
      JOIN jogadores j ON cep.jogador_id = j.id
      JOIN campeonato_partidas cp ON cep.partida_id = cp.id
      JOIN rodadas r ON cp.rodada_id = r.id
      GROUP BY j.id, j.nome, j.foto_url, r.data
      ORDER BY recorde DESC
      LIMIT 1
    `);
    hatTrickKing = rows[0];
  } catch (e) { console.error('Erro hatTrickKing:', e.message); }

  // Rei da Assistência (Mais Assists em 1 Jogo)
  let assistenteReal = null;
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, MAX(cep.assistencias) as recorde, r.data
      FROM campeonato_estatisticas_partida cep
      JOIN jogadores j ON cep.jogador_id = j.id
      JOIN campeonato_partidas cp ON cep.partida_id = cp.id
      JOIN rodadas r ON cp.rodada_id = r.id
      GROUP BY j.id, j.nome, j.foto_url, r.data
      ORDER BY recorde DESC
      LIMIT 1
    `);
    assistenteReal = rows[0];
  } catch (e) { console.error('Erro assistenteReal:', e.message); }

  // O Show Completo (Mais participações G+A em 1 Jogo)
  let showCompleto = null;
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, (cep.gols + cep.assistencias) as recorde, r.data
      FROM campeonato_estatisticas_partida cep
      JOIN jogadores j ON cep.jogador_id = j.id
      JOIN campeonato_partidas cp ON cep.partida_id = cp.id
      JOIN rodadas r ON cp.rodada_id = r.id
      ORDER BY recorde DESC
      LIMIT 1
    `);
    showCompleto = rows[0];
  } catch (e) { console.error('Erro showCompleto:', e.message); }

  // =========================================================================
  // SEÇÃO 6: PARTIDAS HISTÓRICAS
  // =========================================================================

  // Partida com mais gols
  let partidaMaisGols = null;
  try {
    const [rows] = await pool.query(`
      SELECT cp.id, tA.nome as timeA, tB.nome as timeB, 
             cp.placar_timeA, cp.placar_timeB, 
             (cp.placar_timeA + cp.placar_timeB) as total_gols,
             c.nome as campeonato
      FROM campeonato_partidas cp
      JOIN times tA ON cp.timeA_id = tA.id
      JOIN times tB ON cp.timeB_id = tB.id
      JOIN campeonatos c ON cp.campeonato_id = c.id
      WHERE cp.status = 'finalizada'
      ORDER BY total_gols DESC
      LIMIT 1
    `);
    partidaMaisGols = rows[0];
  } catch (e) { console.error('Erro partidaMaisGols:', e.message); }

  // Maior Goleada
  let maiorGoleada = null;
  try {
    const [rows] = await pool.query(`
      SELECT cp.id, tA.nome as timeA, tB.nome as timeB, 
             cp.placar_timeA, cp.placar_timeB, 
             ABS(cp.placar_timeA - cp.placar_timeB) as diferenca,
             c.nome as campeonato
      FROM campeonato_partidas cp
      JOIN times tA ON cp.timeA_id = tA.id
      JOIN times tB ON cp.timeB_id = tB.id
      JOIN campeonatos c ON cp.campeonato_id = c.id
      WHERE cp.status = 'finalizada'
      ORDER BY diferenca DESC
      LIMIT 1
    `);
    maiorGoleada = rows[0];
  } catch (e) { console.error('Erro maiorGoleada:', e.message); }

  // =========================================================================
  // SEÇÃO 7: MÉDIAS E EFICIÊNCIA (Mínimo 10 jogos)
  // =========================================================================

  // Melhor Média de Gols
  let melhorMediaGols = null;
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, 
             COUNT(DISTINCT cep.partida_id) as jogos,
             SUM(cep.gols) as total,
             ROUND(CAST(SUM(cep.gols) AS FLOAT) / COUNT(DISTINCT cep.partida_id), 2) as media
      FROM campeonato_estatisticas_partida cep
      JOIN jogadores j ON cep.jogador_id = j.id
      GROUP BY j.id, j.nome, j.foto_url
      HAVING jogos >= 10
      ORDER BY media DESC
      LIMIT 1
    `);
    melhorMediaGols = rows[0];
  } catch (e) { console.error('Erro melhorMediaGols:', e.message); }

  // Melhor Média de Assistências
  let melhorMediaAssists = null;
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url, 
             COUNT(DISTINCT cep.partida_id) as jogos,
             SUM(cep.assistencias) as total,
             ROUND(CAST(SUM(cep.assistencias) AS FLOAT) / COUNT(DISTINCT cep.partida_id), 2) as media
      FROM campeonato_estatisticas_partida cep
      JOIN jogadores j ON cep.jogador_id = j.id
      GROUP BY j.id, j.nome, j.foto_url
      HAVING jogos >= 10
      ORDER BY media DESC
      LIMIT 1
    `);
    melhorMediaAssists = rows[0];
  } catch (e) { console.error('Erro melhorMediaAssists:', e.message); }

  // Jogador com mais vitórias % (Mínimo 10 jogos)
  let melhorAproveitamento = null;
  try {
    const [rows] = await pool.query(`
      SELECT j.id, j.nome, j.foto_url,
        COUNT(DISTINCT cep.partida_id) as jogos,
        SUM(CASE 
          WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
               (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
          THEN 1 ELSE 0 
        END) as vitorias,
        ROUND((CAST(SUM(CASE 
          WHEN (cp.timeA_id = cep.time_id AND cp.placar_timeA > cp.placar_timeB) OR 
               (cp.timeB_id = cep.time_id AND cp.placar_timeB > cp.placar_timeA) 
          THEN 1 ELSE 0 
        END) AS FLOAT) / COUNT(DISTINCT cep.partida_id)) * 100, 1) as porcentagem
      FROM campeonato_estatisticas_partida cep
      JOIN campeonato_partidas cp ON cep.partida_id = cp.id
      JOIN jogadores j ON cep.jogador_id = j.id
      WHERE cp.status = 'finalizada'
      GROUP BY j.id, j.nome, j.foto_url
      HAVING jogos >= 10
      ORDER BY porcentagem DESC
      LIMIT 1
    `);
    melhorAproveitamento = rows[0];
  } catch (e) { console.error('Erro melhorAproveitamento:', e.message); }

  // Estatísticas Gerais do Sistema
  try {
    const [statsGerais] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM campeonato_partidas WHERE status = 'finalizada') as total_jogos,
        (SELECT SUM(placar_timeA + placar_timeB) FROM campeonato_partidas WHERE status = 'finalizada') as total_gols,
        (SELECT COUNT(DISTINCT id) FROM campeonatos WHERE fase_atual = 'finalizado') as total_campeonatos,
        (SELECT COUNT(DISTINCT id) FROM times) as total_times
    `);
  } catch (e) { console.error('Erro estatisticasGerais:', e.message); }

  // =========================================================================
  // RETORNO FINAL
  // =========================================================================
  return {
    goat,
    
    rankings: {
      maioresCampeoes,
      artilheirosAllTime,
      garconsAllTime,
      participacoesDecisivas,
      incansaveis
    },
    
    premios: {
      mvpCampeonato,
      mvpSemanal,
      peDeRatoCampeonato,
      peDeRatoSemanal,
      chuteirasOuro,
      luvasOuro
    },
    
    goleiros: {
      lendarios: goleirosLendarios,
      cleanSheets: goleirosCleanSheet,
      melhorMedia: goleirosMelhorMedia
    },
    
    muralhas,
    
    recordesPartida: {
      hatTrickKing,
      assistenteReal,
      showCompleto
    },
    
    eficiencia: {
      melhorMediaGols,
      melhorMediaAssists,
      melhorAproveitamento
    },
    
    partidasHistoricas: {
      maisGols: partidaMaisGols,
      maiorGoleada,
    }
  };
}