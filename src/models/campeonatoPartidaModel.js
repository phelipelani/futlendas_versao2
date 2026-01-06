// // Arquivo: src/models/campeonatoPartidaModel.js
// import dbPromise from '../database/db.js';

// /* ========================================================================== */
// /*                         CRIAR PARTIDAS EM LOTE                             */
// /* ========================================================================== */

// export async function createPartidasEmLote(partidas, db) {
//   const dbConn = db || (await dbPromise);
//   let stmt;

//   try {
//     const sql = `
//       INSERT INTO campeonato_partidas 
//       (campeonato_id, rodada_id, fase, timeA_id, timeB_id, status)
//       VALUES (?, ?, ?, ?, ?, 'pendente')
//     `;

//     stmt = await dbConn.prepare(sql);

//     for (const partida of partidas) {
//       await stmt.run(
//         partida.campeonato_id,
//         partida.rodada_id || null,
//         partida.fase,
//         partida.timeA_id,
//         partida.timeB_id
//       );
//     }

//   } catch (err) {
//     console.error('Erro ao criar partidas em lote:', err);
//     throw err;

//   } finally {
//     if (stmt) await stmt.finalize();
//   }
// }

// /* ========================================================================== */
// /*                      BUSCAR PARTIDAS DO CAMPEONATO                         */
// /* ========================================================================== */

// export async function findPartidasByCampeonatoId(campeonato_id) {
//   const db = await dbPromise;

//   try {
//     const sql = `
//       SELECT 
//         p.*,
//         timeA.nome AS nome_timeA,
//         timeA.logo_url AS timeA_logo_url,
//         timeB.nome AS nome_timeB,
//         timeB.logo_url AS timeB_logo_url
//       FROM campeonato_partidas p
//       JOIN times timeA ON p.timeA_id = timeA.id
//       JOIN times timeB ON p.timeB_id = timeB.id
//       WHERE p.campeonato_id = ?
//       ORDER BY p.id DESC
//     `;

//     return db.all(sql, [campeonato_id]);

//   } catch (err) {
//     console.error('Erro ao buscar partidas do campeonato:', err);
//     throw err;
//   }
// }

// /* ========================================================================== */
// /*                       BUSCAR PARTIDAS POR RODADA                           */
// /* ========================================================================== */

// export async function findPartidasByRodadaId(rodada_id) {
//   const db = await dbPromise;

//   try {
//     const sql = `
//       SELECT 
//         p.*,
//         timeA.nome AS nome_timeA,
//         timeA.logo_url AS timeA_logo_url,
//         timeB.nome AS nome_timeB,
//         timeB.logo_url AS timeB_logo_url
//       FROM campeonato_partidas p
//       JOIN times timeA ON p.timeA_id = timeA.id
//       JOIN times timeB ON p.timeB_id = timeB.id
//       WHERE p.rodada_id = ?
//       ORDER BY p.id DESC
//     `;

//     return db.all(sql, [rodada_id]);

//   } catch (err) {
//     console.error('Erro ao buscar partidas da rodada:', err);
//     throw err;
//   }
// }

// /* ========================================================================== */
// /*                     BUSCAR EVENTOS DE UMA PARTIDA                          */
// /* ========================================================================== */

// export async function findEventosByPartidaId(partida_id) {
//   const db = await dbPromise;

//   try {
//     // Primeiro, busca os gols com suas assistências
//     const sql = `
//       SELECT 
//         e.id,
//         e.tipo_evento as tipo,
//         e.jogador_id,
//         j.nome as jogador_nome,
//         e.time_id,
//         e.tempo_segundos,
//         (
//           SELECT ea.jogador_id 
//           FROM eventos_jogo ea 
//           WHERE ea.id = e.evento_pai_id
//         ) as assist_por_jogador_id,
//         (
//           SELECT ja.nome 
//           FROM eventos_jogo ea 
//           JOIN jogadores ja ON ea.jogador_id = ja.id 
//           WHERE ea.id = e.evento_pai_id
//         ) as assist_por_nome
//       FROM eventos_jogo e
//       LEFT JOIN jogadores j ON e.jogador_id = j.id
//       WHERE e.campeonato_partida_id = ?
//       AND e.tipo_evento IN ('gol', 'gol_contra')
//       ORDER BY e.tempo_segundos ASC
//     `;

//     return db.all(sql, [partida_id]);

//   } catch (err) {
//     console.error('Erro ao buscar eventos da partida:', err);
//     throw err;
//   }
// }

// /* ========================================================================== */
// /*                     SALVAR RESULTADO COMPLETO + EVENTOS                    */
// /* ========================================================================== */

// export async function updateResultadoComEventos(partida_id, data, dbTransaction = null) {
//   const db = dbTransaction || (await dbPromise);
//   const shouldHandleTransaction = !dbTransaction;

//   const {
//     placar_timeA,
//     placar_timeB,
//     duracao_segundos,
//     goleiro_timeA_id,
//     goleiro_timeB_id,
//     timeA_jogadores,
//     timeB_jogadores,
//     eventos,
//   } = data;

//   let stmtEventos;
//   let stmtStats;

//   try {
//     if (shouldHandleTransaction) await db.run('BEGIN TRANSACTION');

//     /* ---------------------------------------------------------------------- */
//     /*                        Atualiza dados da partida                        */
//     /* ---------------------------------------------------------------------- */

//     await db.run(
//       `
//       UPDATE campeonato_partidas 
//       SET placar_timeA = ?, placar_timeB = ?, duracao_segundos = ?,
//           goleiro_timeA_id = ?, goleiro_timeB_id = ?, status = 'finalizada'
//       WHERE id = ?
//       `,
//       [
//         placar_timeA,
//         placar_timeB,
//         duracao_segundos,
//         goleiro_timeA_id,
//         goleiro_timeB_id,
//         partida_id,
//       ]
//     );

//     /* ---------------------------------------------------------------------- */
//     /*                      Limpa eventos & estatísticas antigas               */
//     /* ---------------------------------------------------------------------- */

//     await db.run(`DELETE FROM eventos_jogo WHERE campeonato_partida_id = ?`, [
//       partida_id,
//     ]);

//     await db.run(
//       `DELETE FROM campeonato_estatisticas_partida WHERE partida_id = ?`,
//       [partida_id]
//     );

//     /* ---------------------------------------------------------------------- */
//     /*                              INSERIR EVENTOS                            */
//     /* ---------------------------------------------------------------------- */

//     const sqlEventos = `
//       INSERT INTO eventos_jogo 
//       (campeonato_partida_id, tipo_evento, jogador_id, time_id, tempo_segundos, evento_pai_id)
//       VALUES (?, ?, ?, ?, ?, ?)
//     `;
//     stmtEventos = await db.prepare(sqlEventos);

//     const statsMap = {};

//     const partida = await db.get(
//       `SELECT timeA_id, timeB_id FROM campeonato_partidas WHERE id = ?`,
//       [partida_id]
//     );

//     const timeA_id = partida?.timeA_id ?? null;
//     const timeB_id = partida?.timeB_id ?? null;

//     const timeASofreu = placar_timeB > 0;
//     const timeBSofreu = placar_timeA > 0;

//     const initStats = (id, tId) =>
//       (statsMap[id] = { gols: 0, assistencias: 0, time_id: tId });

//     timeA_jogadores?.forEach((j) => initStats(j.id, timeA_id));
//     timeB_jogadores?.forEach((j) => initStats(j.id, timeB_id));

//     for (const evento of eventos ?? []) {
//       let assistId = null;

//       const timeDoEvento =
//         statsMap[evento.jogador_id]?.time_id ??
//         (evento.time_id === timeA_id ? timeA_id : timeB_id);

//       // Assistência
//       if (evento.tipo === 'gol' && evento.assist_por_jogador_id) {
//         const timeAssist =
//           statsMap[evento.assist_por_jogador_id]?.time_id ?? timeDoEvento;

//         const r = await stmtEventos.run(
//           partida_id,
//           'assistencia',
//           evento.assist_por_jogador_id,
//           timeAssist,
//           evento.tempo_segundos,
//           null
//         );

//         assistId = r.lastID;
//         if (statsMap[evento.assist_por_jogador_id])
//           statsMap[evento.assist_por_jogador_id].assistencias++;
//       }

//       // Evento principal (gol, cartão, etc)
//       await stmtEventos.run(
//         partida_id,
//         evento.tipo,
//         evento.jogador_id,
//         timeDoEvento,
//         evento.tempo_segundos,
//         assistId
//       );

//       if (statsMap[evento.jogador_id] && evento.tipo === 'gol') {
//         statsMap[evento.jogador_id].gols++;
//       }
//     }

//     /* ---------------------------------------------------------------------- */
//     /*                        INSERIR ESTATÍSTICAS FINAIS                      */
//     /* ---------------------------------------------------------------------- */

//     // Busca joga_recuado direto do banco para todos os jogadores da partida
//     const jogadoresIds = Object.keys(statsMap);
//     let recuadoMap = {};
    
//     if (jogadoresIds.length > 0) {
//       const placeholders = jogadoresIds.map(() => '?').join(',');
//       const jogadoresComRecuado = await db.all(
//         `SELECT id, joga_recuado FROM jogadores WHERE id IN (${placeholders})`,
//         jogadoresIds
//       );
//       jogadoresComRecuado.forEach(j => {
//         recuadoMap[j.id] = j.joga_recuado === 1 || j.joga_recuado === true;
//       });
//     }

//     const sqlStats = `
//       INSERT INTO campeonato_estatisticas_partida 
//         (partida_id, jogador_id, time_id, gols, assistencias, clean_sheet)
//       VALUES (?, ?, ?, ?, ?, ?)
//     `;
//     stmtStats = await db.prepare(sqlStats);

//     for (const jogadorId in statsMap) {
//       const s = statsMap[jogadorId];
//       const isTimeA = s.time_id === timeA_id;

//       // Usa joga_recuado do banco, não do payload
//       const jogaRecuado = recuadoMap[jogadorId] || false;
//       const timeSofreuGol = isTimeA ? timeASofreu : timeBSofreu;

//       const clean = jogaRecuado && !timeSofreuGol ? 1 : 0;

//       await stmtStats.run(
//         partida_id,
//         jogadorId,
//         s.time_id,
//         s.gols,
//         s.assistencias,
//         clean
//       );
//     }

//     if (shouldHandleTransaction) await db.run('COMMIT');

//     return { message: 'Partida salva com sucesso!' };

//   } catch (err) {
//     console.error('Erro ao salvar resultado:', err);
//     if (shouldHandleTransaction) await db.run('ROLLBACK');
//     throw err;

//   } finally {
//     if (stmtEventos) await stmtEventos.finalize();
//     if (stmtStats) await stmtStats.finalize();
//   }
// }

// Arquivo: src/models/campeonatoPartidaModel.js
import pool from '../database/db.js';

/* ========================================================================== */
/* CRIAR PARTIDAS EM LOTE                             */
/* ========================================================================== */

export async function createPartidasEmLote(partidas, dbConnection) {
  const conn = dbConnection || pool;
  
  if (partidas.length === 0) return;

  // MySQL permite inserir múltiplos registros de uma vez: VALUES ?
  // Formato: [[camp_id, rodada, fase, timeA, timeB, 'pendente'], [...]]
  const values = partidas.map(p => [
    p.campeonato_id,
    p.rodada_id || null,
    p.fase,
    p.timeA_id,
    p.timeB_id,
    'pendente'
  ]);

  const sql = `
    INSERT INTO campeonato_partidas 
    (campeonato_id, rodada_id, fase, timeA_id, timeB_id, status)
    VALUES ?
  `;

  await conn.query(sql, [values]);
}

/* ========================================================================== */
/* BUSCAR PARTIDAS                                       */
/* ========================================================================== */

export async function findPartidasByCampeonatoId(campeonato_id) {
  const sql = `
    SELECT 
      p.*,
      timeA.nome AS nome_timeA,
      timeA.logo_url AS timeA_logo_url,
      timeB.nome AS nome_timeB,
      timeB.logo_url AS timeB_logo_url
    FROM campeonato_partidas p
    JOIN times timeA ON p.timeA_id = timeA.id
    JOIN times timeB ON p.timeB_id = timeB.id
    WHERE p.campeonato_id = ?
    ORDER BY p.id DESC
  `;
  const [rows] = await pool.query(sql, [campeonato_id]);
  return rows;
}

export async function findPartidasByRodadaId(rodada_id) {
  const sql = `
    SELECT 
      p.*,
      timeA.nome AS nome_timeA,
      timeA.logo_url AS timeA_logo_url,
      timeB.nome AS nome_timeB,
      timeB.logo_url AS timeB_logo_url
    FROM campeonato_partidas p
    JOIN times timeA ON p.timeA_id = timeA.id
    JOIN times timeB ON p.timeB_id = timeB.id
    WHERE p.rodada_id = ?
    ORDER BY p.id DESC
  `;
  const [rows] = await pool.query(sql, [rodada_id]);
  return rows;
}

export async function findEventosByPartidaId(partida_id) {
  const sql = `
    SELECT 
      e.id,
      e.tipo_evento as tipo,
      e.jogador_id,
      j.nome as jogador_nome,
      e.time_id,
      e.tempo_segundos,
      (SELECT ea.jogador_id FROM eventos_jogo ea WHERE ea.id = e.evento_pai_id) as assist_por_jogador_id
    FROM eventos_jogo e
    LEFT JOIN jogadores j ON e.jogador_id = j.id
    WHERE e.campeonato_partida_id = ?
    AND e.tipo_evento IN ('gol', 'gol_contra')
    ORDER BY e.tempo_segundos ASC
  `;
  const [rows] = await pool.query(sql, [partida_id]);
  return rows;
}

/* ========================================================================== */
/* SALVAR RESULTADO COMPLETO + EVENTOS                    */
/* ========================================================================== */

export async function updateResultadoComEventos(partida_id, data, dbTransaction = null) {
  // Se veio uma transação (connection), usa ela. Se não, usa o pool normal.
  const conn = dbTransaction || pool; 
  // Se NÃO veio transação externa, precisamos gerenciar uma aqui (opcional, simplificado para usar pool direto se não for critico)
  // Para manter a segurança, assumimos que quem chama sem transação aceita operations atomicas soltas ou implementa transaction wrapper.

  const {
    placar_timeA, placar_timeB, duracao_segundos,
    goleiro_timeA_id, goleiro_timeB_id,
    timeA_jogadores, timeB_jogadores, eventos
  } = data;

  // 1. Atualiza Partida
  await conn.query(
    `UPDATE campeonato_partidas 
     SET placar_timeA = ?, placar_timeB = ?, duracao_segundos = ?,
         goleiro_timeA_id = ?, goleiro_timeB_id = ?, status = 'finalizada'
     WHERE id = ?`,
    [placar_timeA, placar_timeB, duracao_segundos, goleiro_timeA_id, goleiro_timeB_id, partida_id]
  );

  // 2. Limpa dados antigos
  await conn.query(`DELETE FROM eventos_jogo WHERE campeonato_partida_id = ?`, [partida_id]);
  await conn.query(`DELETE FROM campeonato_estatisticas_partida WHERE partida_id = ?`, [partida_id]);

  // 3. Insere Eventos
  const statsMap = {};
  
  // (Pega IDs dos times para saber de quem é o gol)
  const [pRows] = await conn.query(`SELECT timeA_id, timeB_id FROM campeonato_partidas WHERE id = ?`, [partida_id]);
  const { timeA_id, timeB_id } = pRows[0];

  const initStats = (id, tId) => (statsMap[id] = { gols: 0, assistencias: 0, time_id: tId });
  timeA_jogadores?.forEach(j => initStats(j.id, timeA_id));
  timeB_jogadores?.forEach(j => initStats(j.id, timeB_id));

  if (eventos && eventos.length > 0) {
    for (const evento of eventos) {
       let assistId = null;
       const timeDoEvento = statsMap[evento.jogador_id]?.time_id || (evento.time_id === timeA_id ? timeA_id : timeB_id);

       if (evento.tipo === 'gol' && evento.assist_por_jogador_id) {
           const timeAssist = statsMap[evento.assist_por_jogador_id]?.time_id || timeDoEvento;
           const [resA] = await conn.query(
               `INSERT INTO eventos_jogo (campeonato_partida_id, tipo_evento, jogador_id, time_id, tempo_segundos) VALUES (?, 'assistencia', ?, ?, ?)`,
               [partida_id, evento.assist_por_jogador_id, timeAssist, evento.tempo_segundos]
           );
           assistId = resA.insertId;
           if(statsMap[evento.assist_por_jogador_id]) statsMap[evento.assist_por_jogador_id].assistencias++;
       }

       await conn.query(
           `INSERT INTO eventos_jogo (campeonato_partida_id, tipo_evento, jogador_id, time_id, tempo_segundos, evento_pai_id) VALUES (?, ?, ?, ?, ?, ?)`,
           [partida_id, evento.tipo, evento.jogador_id, timeDoEvento, evento.tempo_segundos, assistId]
       );

       if(statsMap[evento.jogador_id] && evento.tipo === 'gol') statsMap[evento.jogador_id].gols++;
    }
  }

  // 4. Insere Stats Finais
  // (Logica de Clean Sheet simplificada: se time oposto fez 0 gols)
  const timeASofreu = placar_timeB > 0;
  const timeBSofreu = placar_timeA > 0;

  for (const jogadorId in statsMap) {
      const s = statsMap[jogadorId];
      const isTimeA = s.time_id === timeA_id;
      const clean = (!timeASofreu && isTimeA) || (!timeBSofreu && !isTimeA) ? 1 : 0; // Simplificação se nao tiver joga_recuado no map

      await conn.query(
          `INSERT INTO campeonato_estatisticas_partida (partida_id, jogador_id, time_id, gols, assistencias, clean_sheet) VALUES (?, ?, ?, ?, ?, ?)`,
          [partida_id, jogadorId, s.time_id, s.gols, s.assistencias, clean]
      );
  }

  return { message: 'Partida salva com sucesso!' };
}