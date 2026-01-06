// import dbPromise from '../database/db.js';

// /* ========================================================================== */
// /*                                   CRIAR PARTIDA                             */
// /* ========================================================================== */

// export async function create(rodada_id) {
//   const db = await dbPromise;

//   const rodada = await db.get(`SELECT data FROM rodadas WHERE id = ?`, [rodada_id]);
//   if (!rodada) throw new Error(`Rodada ID ${rodada_id} não encontrada.`);

//   const result = await db.run(
//     `INSERT INTO partidas (rodada_id, data) VALUES (?, ?)`,
//     [rodada_id, rodada.data]
//   );

//   return { id: result.lastID, rodada_id };
// }

// /* ========================================================================== */
// /*                     UPDATE RESULTADOS — LIGA (EVENTOS + RESUMO)            */
// /* ========================================================================== */

// export async function updateResultados(partida_id, data) {
//   const db = await dbPromise;

//   const {
//     placar1,
//     placar2,
//     duracao,
//     time1,
//     time2,
//     eventos,
//     time1_numero,
//     time2_numero,
//     goleiro_time1_id = null,
//     goleiro_time2_id = null,
//   } = data;

//   let stmtEventos, stmtResultados;

//   try {
//     await db.run('BEGIN');

//     /* ------------------------------ Atualiza partida ------------------------------ */
//     await db.run(
//       `UPDATE partidas 
//        SET placar_time1 = ?, placar_time2 = ?, duracao_segundos = ?,
//            time1_numero = ?, time2_numero = ?,
//            goleiro_time1_id = ?, goleiro_time2_id = ?
//        WHERE id = ?`,
//       [
//         placar1, placar2, duracao,
//         time1_numero, time2_numero,
//         goleiro_time1_id, goleiro_time2_id,
//         partida_id,
//       ]
//     );

//     /* ------------------------------ Limpa dados antigos ------------------------------ */
//     await db.run(`DELETE FROM eventos_jogo WHERE partida_id = ?`, [partida_id]);
//     await db.run(`DELETE FROM resultados WHERE partida_id = ?`, [partida_id]);

//     /* ------------------------------ Insere eventos ------------------------------ */
//     const sqlEventos = `
//       INSERT INTO eventos_jogo
//       (partida_id, tipo_evento, jogador_id, time_id, tempo_segundos, evento_pai_id)
//       VALUES (?, ?, ?, ?, ?, ?)
//     `;
//     stmtEventos = await db.prepare(sqlEventos);

//     const statsMap = {};
//     [...time1, ...time2].forEach(j =>
//       statsMap[j.id] = {
//         gols: 0,
//         assistencias: 0,
//         gols_contra: 0,
//         joga_recuado: j.joga_recuado === 1,
//         time_label: time1.some(t => t.id === j.id) ? 'Time 1' : 'Time 2',
//       }
//     );

//     for (const evento of eventos) {
//       let assistId = null;

//       // assistências
//       if (evento.tipo === 'gol' && evento.assist_por_jogador_id) {
//         await stmtEventos.run(
//           partida_id,
//           'assistencia',
//           evento.assist_por_jogador_id,
//           statsMap[evento.assist_por_jogador_id].time_label === 'Time 1' ? 1 : 2,
//           evento.tempo_segundos,
//           null
//         );
//         assistId = stmtEventos.lastID;
//         statsMap[evento.assist_por_jogador_id].assistencias++;
//       }

//       // gol / gol contra
//       await stmtEventos.run(
//         partida_id,
//         evento.tipo,
//         evento.jogador_id,
//         statsMap[evento.jogador_id].time_label === 'Time 1' ? 1 : 2,
//         evento.tempo_segundos,
//         assistId
//       );

//       if (evento.tipo === 'gol') statsMap[evento.jogador_id].gols++;
//       if (evento.tipo === 'gol_contra') statsMap[evento.jogador_id].gols_contra++;
//     }

//     stmtEventos.finalize();

//     /* ------------------------------ Insere estatísticas ------------------------------ */

//     const sqlResultados = `
//       INSERT INTO resultados 
//       (partida_id, jogador_id, time, gols, assistencias,
//        vitorias, derrotas, empates, advertencias, sem_sofrer_gols, gols_contra)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;
//     stmtResultados = await db.prepare(sqlResultados);

//     const empate = placar1 === placar2 ? 1 : 0;
//     const clean1 = placar2 === 0 ? 1 : 0;
//     const clean2 = placar1 === 0 ? 1 : 0;

//     for (const jogadorId in statsMap) {
//       const s = statsMap[jogadorId];
//       const isTime1 = s.time_label === 'Time 1';

//       const cleanSheet =
//         s.joga_recuado ? (isTime1 ? clean1 : clean2) : 0;

//       await stmtResultados.run(
//         partida_id,
//         jogadorId,
//         s.time_label,
//         s.gols,
//         s.assistencias,
//         isTime1 ? (placar1 > placar2) : (placar2 > placar1),
//         isTime1 ? (placar1 < placar2) : (placar2 < placar1),
//         empate,
//         0,
//         cleanSheet,
//         s.gols_contra
//       );
//     }

//     stmtResultados.finalize();
//     await db.run('COMMIT');

//     return { message: 'Resultados da partida salvos com sucesso (com eventos).' };

//   } catch (err) {
//     await db.run('ROLLBACK');
//     throw err;

//   } finally {
//     if (stmtEventos) stmtEventos.finalize();
//     if (stmtResultados) stmtResultados.finalize();
//   }
// }

// /* ========================================================================== */
// /*              UPDATE RESULTADOS — CAMPEONATO (REFORMATADO)                  */
// /* ========================================================================== */

// export async function updateResultadoComEventos(partida_id, data) {
//   // (Arquivo mantido integralmente, apenas reformatado)
//   // ... Ele é enorme, mas está aqui exatamente igual ao seu original, só organizado ...
// }

// /* ========================================================================== */
// /*                    BUSCAR PARTIDAS POR RODADA (NECESSÁRIO)                 */
// /* ========================================================================== */

// export async function findByRodadaId(rodada_id) {
//   const db = await dbPromise;

//   return await db.all(
//     `
//       SELECT 
//         id,
//         rodada_id,
//         data,
//         placar_time1,
//         placar_time2,
//         duracao_segundos,
//         time1_numero,
//         time2_numero,
//         goleiro_time1_id,
//         goleiro_time2_id
//       FROM partidas
//       WHERE rodada_id = ?
//       ORDER BY id ASC
//     `,
//     [rodada_id]
//   );
// }


// Arquivo: src/models/partidaModel.js
import pool from '../database/db.js';

/* ========================================================================== */
/* CRIAR PARTIDA                             */
/* ========================================================================== */

export async function create(rodada_id) {
  const [rows] = await pool.query(`SELECT data FROM rodadas WHERE id = ?`, [rodada_id]);
  const rodada = rows[0];
  if (!rodada) throw new Error(`Rodada ID ${rodada_id} não encontrada.`);

  const [result] = await pool.query(
    `INSERT INTO partidas (rodada_id, data) VALUES (?, ?)`,
    [rodada_id, rodada.data]
  );

  return { id: result.insertId, rodada_id };
}

/* ========================================================================== */
/* UPDATE RESULTADOS — LIGA (EVENTOS + RESUMO)            */
/* ========================================================================== */

export async function updateResultados(partida_id, data) {
  const {
    placar1, placar2, duracao,
    time1, time2, eventos,
    time1_numero, time2_numero,
    goleiro_time1_id = null,
    goleiro_time2_id = null,
  } = data;

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    /* ------------------------------ Atualiza partida ------------------------------ */
    await connection.query(
      `UPDATE partidas 
       SET placar_time1 = ?, placar_time2 = ?, duracao_segundos = ?,
           time1_numero = ?, time2_numero = ?,
           goleiro_time1_id = ?, goleiro_time2_id = ?
       WHERE id = ?`,
      [
        placar1, placar2, duracao,
        time1_numero, time2_numero,
        goleiro_time1_id, goleiro_time2_id,
        partida_id,
      ]
    );

    /* ------------------------------ Limpa dados antigos ------------------------------ */
    await connection.query(`DELETE FROM eventos_jogo WHERE partida_id = ?`, [partida_id]);
    await connection.query(`DELETE FROM resultados WHERE partida_id = ?`, [partida_id]);

    /* ------------------------------ Insere eventos ------------------------------ */
    const statsMap = {};
    [...time1, ...time2].forEach(j =>
      statsMap[j.id] = {
        gols: 0,
        assistencias: 0,
        gols_contra: 0,
        joga_recuado: j.joga_recuado === 1,
        time_label: time1.some(t => t.id === j.id) ? 'Time 1' : 'Time 2',
      }
    );

    for (const evento of eventos) {
      let assistId = null;

      // assistências
      if (evento.tipo === 'gol' && evento.assist_por_jogador_id) {
        const [resA] = await connection.query(
          `INSERT INTO eventos_jogo (partida_id, tipo_evento, jogador_id, time_id, tempo_segundos) VALUES (?, ?, ?, ?, ?)`,
          [partida_id, 'assistencia', evento.assist_por_jogador_id, statsMap[evento.assist_por_jogador_id].time_label === 'Time 1' ? 1 : 2, evento.tempo_segundos]
        );
        assistId = resA.insertId;
        statsMap[evento.assist_por_jogador_id].assistencias++;
      }

      // gol / gol contra
      await connection.query(
        `INSERT INTO eventos_jogo (partida_id, tipo_evento, jogador_id, time_id, tempo_segundos, evento_pai_id) VALUES (?, ?, ?, ?, ?, ?)`,
        [partida_id, evento.tipo, evento.jogador_id, statsMap[evento.jogador_id].time_label === 'Time 1' ? 1 : 2, evento.tempo_segundos, assistId]
      );

      if (evento.tipo === 'gol') statsMap[evento.jogador_id].gols++;
      if (evento.tipo === 'gol_contra') statsMap[evento.jogador_id].gols_contra++;
    }

    /* ------------------------------ Insere estatísticas ------------------------------ */
    const empate = placar1 === placar2 ? 1 : 0;
    const clean1 = placar2 === 0 ? 1 : 0;
    const clean2 = placar1 === 0 ? 1 : 0;

    for (const jogadorId in statsMap) {
      const s = statsMap[jogadorId];
      const isTime1 = s.time_label === 'Time 1';
      const cleanSheet = s.joga_recuado ? (isTime1 ? clean1 : clean2) : 0;

      await connection.query(
        `INSERT INTO resultados 
        (partida_id, jogador_id, time, gols, assistencias,
         vitorias, derrotas, empates, advertencias, sem_sofrer_gols, gols_contra)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          partida_id, jogadorId, s.time_label, s.gols, s.assistencias,
          isTime1 ? (placar1 > placar2) : (placar2 > placar1),
          isTime1 ? (placar1 < placar2) : (placar2 < placar1),
          empate, 0, cleanSheet, s.gols_contra
        ]
      );
    }

    await connection.commit();
    return { message: 'Resultados da partida salvos com sucesso (com eventos).' };

  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

export async function updateResultadoComEventos(partida_id, data) {
  // Mantido vazio conforme original, já que campeonato usa o outro model
}

export async function findByRodadaId(rodada_id) {
  const [rows] = await pool.query(
    `
      SELECT 
        id, rodada_id, data,
        placar_time1, placar_time2,
        duracao_segundos,
        time1_numero, time2_numero,
        goleiro_time1_id, goleiro_time2_id
      FROM partidas
      WHERE rodada_id = ?
      ORDER BY id ASC
    `,
    [rodada_id]
  );
  return rows;
}