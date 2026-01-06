// // Arquivo: src/models/rodadaModel.js
// import dbPromise from "../database/db.js";

// /* ============================================================================
//    CRIAR RODADA (COM PROTEÇÃO CONTRA DUPLICATAS)
// ============================================================================ */
// export async function create(liga_id, campeonato_id, data) {
//   const db = await dbPromise;

//   const result = await db.run(
//     `INSERT INTO rodadas (liga_id, campeonato_id, data, status) VALUES (?, ?, ?, 'aberta')`,
//     [liga_id, campeonato_id, data]
//   );
//   const rodada_id = result.lastID;

//   if (liga_id !== null) {
//     await db.run(
//       `INSERT INTO rodada_jogadores (rodada_id, jogador_id) SELECT ?, jogador_id FROM liga_jogadores WHERE liga_id = ?`,
//       [rodada_id, liga_id]
//     );
//   }

//   if (campeonato_id !== null) {
//     // 1. Presença básica (DISTINCT para evitar duplicatas se o banco estiver sujo)
//     await db.run(
//       `
//       INSERT INTO rodada_jogadores (rodada_id, jogador_id)
//       SELECT DISTINCT ?, jogador_id
//       FROM campeonato_elencos
//       WHERE campeonato_id = ?
//     `,
//       [rodada_id, campeonato_id]
//     );

//     // 2. Snapshot do Elenco (AQUI QUE DEU O ERRO ANTES, AGORA COM DISTINCT)
//     await db.run(
//       `
//       INSERT INTO campeonato_rodada_elencos (rodada_id, time_id, jogador_id, is_capitao)
//       SELECT DISTINCT ?, time_id, jogador_id, is_capitao
//       FROM campeonato_elencos
//       WHERE campeonato_id = ?
//       `,
//       [rodada_id, campeonato_id]
//     );
//   }

//   return findById(rodada_id);
// }

// /* ============================================================================
//    LEITURA DE ELENCO (COM FALLBACK SEGURO)
// ============================================================================ */
// export async function getElencoDaRodada(rodada_id) {
//   const db = await dbPromise;
//   const rodada = await db.get('SELECT liga_id, campeonato_id FROM rodadas WHERE id = ?', [rodada_id]);

//   if (!rodada) return [];

//   if (rodada.campeonato_id) {
//     // Tenta ler da tabela de snapshot
//     const sql = `
//       SELECT 
//         cre.rowid AS vinculo_id,
//         j.id AS jogador_id,
//         j.nome AS nome_jogador,
//         j.foto_url,
//         j.posicao,
//         t.id AS time_id,
//         t.nome AS nome_time,
//         t.logo_url AS logo_time,
//         cre.is_capitao,
//         0 as is_pe_de_rato
//       FROM campeonato_rodada_elencos cre
//       JOIN jogadores j ON cre.jogador_id = j.id
//       JOIN times t ON cre.time_id = t.id
//       WHERE cre.rodada_id = ?
//       ORDER BY t.nome, j.nome
//     `;
//     const result = await db.all(sql, [rodada_id]);

//     // Se estiver vazio, usa o fallback legado
//     if (result.length === 0) {
//         return getElencoDaRodadaLegacy(rodada_id, rodada.campeonato_id, db);
//     }
//     return result;
//   } else {
//     // LIGA
//     const sql = `
//       SELECT rj.rowid AS vinculo_id, j.id AS jogador_id, j.nome AS nome_jogador, j.foto_url, j.posicao
//       FROM rodada_jogadores rj JOIN jogadores j ON rj.jogador_id = j.id WHERE rj.rodada_id = ? ORDER BY j.nome
//     `;
//     return await db.all(sql, [rodada_id]);
//   }
// }

// async function getElencoDaRodadaLegacy(rodada_id, campeonato_id, db) {
//     // Fallback: junta presença + elenco original
//     const sql = `
//       SELECT rj.rowid AS vinculo_id, j.id AS jogador_id, j.nome AS nome_jogador, j.foto_url, j.posicao,
//         t.id AS time_id, COALESCE(t.nome, 'Time Indefinido') AS nome_time, t.logo_url AS logo_time,
//         ce.is_capitao, ce.is_pe_de_rato
//       FROM rodada_jogadores rj
//       JOIN jogadores j ON rj.jogador_id = j.id
//       JOIN campeonato_elencos ce ON (ce.jogador_id = j.id AND ce.campeonato_id = ?)
//       LEFT JOIN times t ON ce.time_id = t.id
//       WHERE rj.rodada_id = ?
//       ORDER BY t.nome, j.nome
//     `;
//     return await db.all(sql, [campeonato_id, rodada_id]);
// }

// /* ============================================================================
//    SUBSTITUIÇÃO (CORRIGIDA)
// ============================================================================ */
// export async function realizarSubstituicao(rodada_id, time_id, jogador_sai_id, jogador_entra_id) {
//   const db = await dbPromise;
//   const rodada = await db.get('SELECT campeonato_id FROM rodadas WHERE id = ?', [rodada_id]);

//   if (rodada && rodada.campeonato_id) {
//     await db.run('BEGIN TRANSACTION');
//     try {
//         // 1. Atualiza Presença (Remove Sai, Adiciona Entra)
//         await db.run('DELETE FROM rodada_jogadores WHERE rodada_id = ? AND jogador_id = ?', [rodada_id, jogador_sai_id]);
//         // Ignora erro se já existir na presença
//         try { await db.run('INSERT INTO rodada_jogadores (rodada_id, jogador_id) VALUES (?, ?)', [rodada_id, jogador_entra_id]); } catch(e){}

//         // 2. Atualiza Snapshot (Troca o ID no time)
//         const updateResult = await db.run(
//             `UPDATE campeonato_rodada_elencos 
//              SET jogador_id = ? 
//              WHERE rodada_id = ? AND jogador_id = ? AND time_id = ?`,
//             [jogador_entra_id, rodada_id, jogador_sai_id, time_id]
//         );

//         // Se o UPDATE não achou ninguém (ex: rodada criada antes do fix), forçamos um INSERT para garantir que o novo apareça
//         if (updateResult.changes === 0) {
//             // Verifica se o 'sai' existia no elenco original para pegar metadados
//             const dadosOriginais = await db.get(
//                 'SELECT is_capitao FROM campeonato_elencos WHERE campeonato_id = ? AND jogador_id = ?', 
//                 [rodada.campeonato_id, jogador_sai_id]
//             );
            
//             // Insere o novo
//             await db.run(
//                 `INSERT INTO campeonato_rodada_elencos (rodada_id, time_id, jogador_id, is_capitao) VALUES (?, ?, ?, ?)`,
//                 [rodada_id, time_id, jogador_entra_id, dadosOriginais?.is_capitao || 0]
//             );
//             // O antigo já sumiu da view porque removemos de rodada_jogadores (se estiver usando Legacy)
//             // Se estiver usando Snapshot, ele continua lá se o update falhou. Então vamos forçar delete:
//             await db.run(
//                 `DELETE FROM campeonato_rodada_elencos WHERE rodada_id = ? AND jogador_id = ? AND time_id = ?`,
//                 [rodada_id, jogador_sai_id, time_id]
//             );
//         }

//         await db.run('COMMIT');
//     } catch (err) {
//         await db.run('ROLLBACK');
//         throw err;
//     }
//   } else {
//     // LIGA
//     try {
//         await db.run(
//         `UPDATE rodada_times SET jogador_id = ? WHERE rodada_id = ? AND numero_time = ? AND jogador_id = ?`,
//         [jogador_entra_id, rodada_id, time_id, jogador_sai_id]
//         );
//     } catch (e) { }
//   }

//   return { message: "Substituição realizada com sucesso." };
// }

// // ... Restante das funções (getTimesSorteados, etc) iguais ao anterior ...
// export async function findById(id) { const db = await dbPromise; return await db.get(`SELECT * FROM rodadas WHERE id = ?`, [id]); }
// export async function findByLigaIdAndData(liga_id, data) { const db = await dbPromise; return await db.get(`SELECT * FROM rodadas WHERE liga_id = ? AND data = ?`, [liga_id, data]); }
// export async function findByLigaId(liga_id) { const db = await dbPromise; return await db.all(`SELECT * FROM rodadas WHERE liga_id = ? ORDER BY data ASC`, [liga_id]); }
// export async function findByCampeonatoId(campeonato_id) { const db = await dbPromise; return await db.all(`SELECT * FROM rodadas WHERE campeonato_id = ? ORDER BY data ASC`, [campeonato_id]); }
// export async function getTimesSorteados(rodada_id) {
//   const db = await dbPromise;
//   const rodada = await db.get('SELECT liga_id, campeonato_id FROM rodadas WHERE id = ?', [rodada_id]);
//   if (!rodada) return {};
//   if (rodada.campeonato_id) {
//     const rows = await db.all(`SELECT time_id, jogador_id FROM campeonato_rodada_elencos WHERE rodada_id = ?`, [rodada_id]);
//     if (rows.length === 0) return getTimesSorteadosLegacy(rodada_id, rodada.campeonato_id, db);
//     const times = {};
//     for (const row of rows) {
//       const jog = await db.get('SELECT nome FROM jogadores WHERE id = ?', [row.jogador_id]);
//       if (!times[row.time_id]) times[row.time_id] = [];
//       times[row.time_id].push({ id: row.jogador_id, nome: jog?.nome || '??' });
//     }
//     return times;
//   } else {
//     try {
//       const rows = await db.all(`SELECT rt.numero_time AS time_id, rt.jogador_id, j.nome FROM rodada_times rt INNER JOIN jogadores j ON j.id = rt.jogador_id WHERE rt.rodada_id = ? ORDER BY rt.numero_time ASC`, [rodada_id]);
//       const times = {};
//       for (const row of rows) { if (!times[row.time_id]) times[row.time_id] = []; times[row.time_id].push({ id: row.jogador_id, nome: row.nome }); }
//       return times;
//     } catch (e) { return {}; }
//   }
// }
// async function getTimesSorteadosLegacy(rodada_id, campeonato_id, db) {
//     const rows = await db.all(`SELECT ce.time_id, rj.jogador_id, j.nome FROM rodada_jogadores rj JOIN campeonato_elencos ce ON (ce.jogador_id = rj.jogador_id AND ce.campeonato_id = ?) JOIN jogadores j ON rj.jogador_id = j.id WHERE rj.rodada_id = ?`, [campeonato_id, rodada_id]);
//     const times = {};
//     for (const row of rows) { if (!times[row.time_id]) times[row.time_id] = []; times[row.time_id].push({ id: row.jogador_id, nome: row.nome }); }
//     return times;
// }
// export async function saveTimesSorteados(rodada_id, times) { const db = await dbPromise; try { await db.run(`DELETE FROM rodada_times WHERE rodada_id = ?`, [rodada_id]); } catch (e) {} for (const timeId in times) { const numeroTime = parseInt(timeId); const nomeTime = `Time ${numeroTime}`; for (const jogador of times[timeId]) { try { await db.run(`INSERT INTO rodada_times (rodada_id, numero_time, nome_time, jogador_id) VALUES (?, ?, ?, ?)`, [rodada_id, numeroTime, nomeTime, jogador.id]); } catch (e) {} } } }
// export async function getResultadosCompletos(rodada_id) { const db = await dbPromise; return await db.all(`SELECT * FROM partidas WHERE rodada_id = ?`, [rodada_id]); }
// export async function findJogadoresByRodadaId(rodada_id) { const db = await dbPromise; return await db.all(`SELECT j.* FROM jogadores j INNER JOIN rodada_jogadores rj ON rj.jogador_id = j.id WHERE rj.rodada_id = ?`, [rodada_id]); }
// export async function finalizar(rodada_id) { const db = await dbPromise; await db.run(`UPDATE rodadas SET status = 'finalizada' WHERE id = ?`, [rodada_id]); return { rodada_id, status: "finalizada" }; }
// export async function update(rodada_id, data) { const db = await dbPromise; await db.run(`UPDATE rodadas SET data = ? WHERE id = ?`, [data, rodada_id]); return findById(rodada_id); }
// export async function remove(rodada_id) { const db = await dbPromise; try { await db.run(`DELETE FROM rodada_jogadores WHERE rodada_id = ?`, [rodada_id]); await db.run(`DELETE FROM rodada_times WHERE rodada_id = ?`, [rodada_id]); await db.run(`DELETE FROM partidas WHERE rodada_id = ?`, [rodada_id]); await db.run(`DELETE FROM campeonato_rodada_elencos WHERE rodada_id = ?`, [rodada_id]); await db.run(`DELETE FROM rodadas WHERE id = ?`, [rodada_id]); } catch (e) {} return { message: "Rodada removida." }; }
// export async function replaceJogadores(rodada_id, jogadoresIds) { const db = await dbPromise; try { await db.run('BEGIN TRANSACTION'); await db.run('DELETE FROM rodada_jogadores WHERE rodada_id = ?', [rodada_id]); const stmt = await db.prepare('INSERT INTO rodada_jogadores (rodada_id, jogador_id) VALUES (?, ?)'); for (const id of jogadoresIds) { await stmt.run(rodada_id, id); } await stmt.finalize(); await db.run('COMMIT'); } catch (err) { await db.run('ROLLBACK'); throw err; } }

// Arquivo: src/models/rodadaModel.js
import pool from "../database/db.js";

/* ============================================================================
   CRIAR RODADA (COM PROTEÇÃO CONTRA DUPLICATAS)
============================================================================ */
export async function create(liga_id, campeonato_id, data) {
  const [result] = await pool.query(
    `INSERT INTO rodadas (liga_id, campeonato_id, data, status) VALUES (?, ?, ?, 'aberta')`,
    [liga_id, campeonato_id, data]
  );
  const rodada_id = result.insertId;

  if (liga_id !== null) {
    await pool.query(
      `INSERT INTO rodada_jogadores (rodada_id, jogador_id) SELECT ?, jogador_id FROM liga_jogadores WHERE liga_id = ?`,
      [rodada_id, liga_id]
    );
  }

  if (campeonato_id !== null) {
    // 1. Presença básica
    await pool.query(
      `
      INSERT INTO rodada_jogadores (rodada_id, jogador_id)
      SELECT DISTINCT ?, jogador_id
      FROM campeonato_elencos
      WHERE campeonato_id = ?
    `,
      [rodada_id, campeonato_id]
    );

    // 2. Snapshot do Elenco
    await pool.query(
      `
      INSERT INTO campeonato_rodada_elencos (rodada_id, time_id, jogador_id, is_capitao)
      SELECT DISTINCT ?, time_id, jogador_id, is_capitao
      FROM campeonato_elencos
      WHERE campeonato_id = ?
      `,
      [rodada_id, campeonato_id]
    );
  }

  return findById(rodada_id);
}

/* ============================================================================
   LEITURA DE ELENCO (COM FALLBACK SEGURO)
============================================================================ */
export async function getElencoDaRodada(rodada_id) {
  const [rows] = await pool.query('SELECT liga_id, campeonato_id FROM rodadas WHERE id = ?', [rodada_id]);
  const rodada = rows[0];

  if (!rodada) return [];

  if (rodada.campeonato_id) {
    // Tenta ler da tabela de snapshot
    // MySQL não tem rowid, usamos o ID da tabela
    const sql = `
      SELECT 
        cre.id AS vinculo_id,
        j.id AS jogador_id,
        j.nome AS nome_jogador,
        j.foto_url,
        j.posicao,
        t.id AS time_id,
        t.nome AS nome_time,
        t.logo_url AS logo_time,
        cre.is_capitao,
        0 as is_pe_de_rato
      FROM campeonato_rodada_elencos cre
      JOIN jogadores j ON cre.jogador_id = j.id
      JOIN times t ON cre.time_id = t.id
      WHERE cre.rodada_id = ?
      ORDER BY t.nome, j.nome
    `;
    const [result] = await pool.query(sql, [rodada_id]);

    // Se estiver vazio, usa o fallback legado
    if (result.length === 0) {
        return getElencoDaRodadaLegacy(rodada_id, rodada.campeonato_id);
    }
    return result;
  } else {
    // LIGA (MySQL workaround para rowid: usamos NULL ou construimos um ID)
    const sql = `
      SELECT NULL AS vinculo_id, j.id AS jogador_id, j.nome AS nome_jogador, j.foto_url, j.posicao
      FROM rodada_jogadores rj JOIN jogadores j ON rj.jogador_id = j.id WHERE rj.rodada_id = ? ORDER BY j.nome
    `;
    const [result] = await pool.query(sql, [rodada_id]);
    return result;
  }
}

async function getElencoDaRodadaLegacy(rodada_id, campeonato_id) {
    // Fallback: junta presença + elenco original
    const sql = `
      SELECT NULL AS vinculo_id, j.id AS jogador_id, j.nome AS nome_jogador, j.foto_url, j.posicao,
        t.id AS time_id, COALESCE(t.nome, 'Time Indefinido') AS nome_time, t.logo_url AS logo_time,
        ce.is_capitao, ce.is_pe_de_rato
      FROM rodada_jogadores rj
      JOIN jogadores j ON rj.jogador_id = j.id
      JOIN campeonato_elencos ce ON (ce.jogador_id = j.id AND ce.campeonato_id = ?)
      LEFT JOIN times t ON ce.time_id = t.id
      WHERE rj.rodada_id = ?
      ORDER BY t.nome, j.nome
    `;
    const [rows] = await pool.query(sql, [campeonato_id, rodada_id]);
    return rows;
}

/* ============================================================================
   SUBSTITUIÇÃO
============================================================================ */
export async function realizarSubstituicao(rodada_id, time_id, jogador_sai_id, jogador_entra_id) {
  const [rows] = await pool.query('SELECT campeonato_id FROM rodadas WHERE id = ?', [rodada_id]);
  const rodada = rows[0];

  if (rodada && rodada.campeonato_id) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Atualiza Presença
        await connection.query('DELETE FROM rodada_jogadores WHERE rodada_id = ? AND jogador_id = ?', [rodada_id, jogador_sai_id]);
        try { 
            await connection.query('INSERT INTO rodada_jogadores (rodada_id, jogador_id) VALUES (?, ?)', [rodada_id, jogador_entra_id]); 
        } catch(e) {
            // Ignora duplicado
        }

        // 2. Atualiza Snapshot
        const [updateResult] = await connection.query(
            `UPDATE campeonato_rodada_elencos 
             SET jogador_id = ? 
             WHERE rodada_id = ? AND jogador_id = ? AND time_id = ?`,
            [jogador_entra_id, rodada_id, jogador_sai_id, time_id]
        );

        if (updateResult.affectedRows === 0) {
            const [originais] = await connection.query(
                'SELECT is_capitao FROM campeonato_elencos WHERE campeonato_id = ? AND jogador_id = ?', 
                [rodada.campeonato_id, jogador_sai_id]
            );
            
            await connection.query(
                `INSERT INTO campeonato_rodada_elencos (rodada_id, time_id, jogador_id, is_capitao) VALUES (?, ?, ?, ?)`,
                [rodada_id, time_id, jogador_entra_id, originais[0]?.is_capitao || 0]
            );
            
            await connection.query(
                `DELETE FROM campeonato_rodada_elencos WHERE rodada_id = ? AND jogador_id = ? AND time_id = ?`,
                [rodada_id, jogador_sai_id, time_id]
            );
        }

        await connection.commit();
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
  } else {
    // LIGA
    try {
        await pool.query(
        `UPDATE rodada_times SET jogador_id = ? WHERE rodada_id = ? AND numero_time = ? AND jogador_id = ?`,
        [jogador_entra_id, rodada_id, time_id, jogador_sai_id]
        );
    } catch (e) { }
  }

  return { message: "Substituição realizada com sucesso." };
}

// ... Restante das funções ...
export async function findById(id) { 
    const [rows] = await pool.query(`SELECT * FROM rodadas WHERE id = ?`, [id]); 
    return rows[0]; 
}
export async function findByLigaIdAndData(liga_id, data) { 
    const [rows] = await pool.query(`SELECT * FROM rodadas WHERE liga_id = ? AND data = ?`, [liga_id, data]); 
    return rows[0]; 
}
export async function findByLigaId(liga_id) { 
    const [rows] = await pool.query(`SELECT * FROM rodadas WHERE liga_id = ? ORDER BY data ASC`, [liga_id]); 
    return rows; 
}
export async function findByCampeonatoId(campeonato_id) { 
    const [rows] = await pool.query(`SELECT * FROM rodadas WHERE campeonato_id = ? ORDER BY data ASC`, [campeonato_id]); 
    return rows; 
}

export async function getTimesSorteados(rodada_id) {
  const [rows] = await pool.query('SELECT liga_id, campeonato_id FROM rodadas WHERE id = ?', [rodada_id]);
  const rodada = rows[0];
  if (!rodada) return {};

  if (rodada.campeonato_id) {
    const [creRows] = await pool.query(`SELECT time_id, jogador_id FROM campeonato_rodada_elencos WHERE rodada_id = ?`, [rodada_id]);
    if (creRows.length === 0) return getTimesSorteadosLegacy(rodada_id, rodada.campeonato_id);
    
    const times = {};
    for (const row of creRows) {
      const [jRows] = await pool.query('SELECT nome FROM jogadores WHERE id = ?', [row.jogador_id]);
      const jog = jRows[0];
      if (!times[row.time_id]) times[row.time_id] = [];
      times[row.time_id].push({ id: row.jogador_id, nome: jog?.nome || '??' });
    }
    return times;
  } else {
    try {
      const [rtRows] = await pool.query(`SELECT rt.numero_time AS time_id, rt.jogador_id, j.nome FROM rodada_times rt INNER JOIN jogadores j ON j.id = rt.jogador_id WHERE rt.rodada_id = ? ORDER BY rt.numero_time ASC`, [rodada_id]);
      const times = {};
      for (const row of rtRows) { if (!times[row.time_id]) times[row.time_id] = []; times[row.time_id].push({ id: row.jogador_id, nome: row.nome }); }
      return times;
    } catch (e) { return {}; }
  }
}

async function getTimesSorteadosLegacy(rodada_id, campeonato_id) {
    const [rows] = await pool.query(`SELECT ce.time_id, rj.jogador_id, j.nome FROM rodada_jogadores rj JOIN campeonato_elencos ce ON (ce.jogador_id = rj.jogador_id AND ce.campeonato_id = ?) JOIN jogadores j ON rj.jogador_id = j.id WHERE rj.rodada_id = ?`, [campeonato_id, rodada_id]);
    const times = {};
    for (const row of rows) { if (!times[row.time_id]) times[row.time_id] = []; times[row.time_id].push({ id: row.jogador_id, nome: row.nome }); }
    return times;
}

export async function saveTimesSorteados(rodada_id, times) { 
    await pool.query(`DELETE FROM rodada_times WHERE rodada_id = ?`, [rodada_id]); 
    for (const timeId in times) { 
        const numeroTime = parseInt(timeId); 
        const nomeTime = `Time ${numeroTime}`; 
        for (const jogador of times[timeId]) { 
            await pool.query(`INSERT INTO rodada_times (rodada_id, numero_time, nome_time, jogador_id) VALUES (?, ?, ?, ?)`, [rodada_id, numeroTime, nomeTime, jogador.id]); 
        } 
    } 
}

export async function getResultadosCompletos(rodada_id) { 
    const [rows] = await pool.query(`SELECT * FROM partidas WHERE rodada_id = ?`, [rodada_id]); 
    return rows; 
}

export async function findJogadoresByRodadaId(rodada_id) { 
    const [rows] = await pool.query(`SELECT j.* FROM jogadores j INNER JOIN rodada_jogadores rj ON rj.jogador_id = j.id WHERE rj.rodada_id = ?`, [rodada_id]); 
    return rows; 
}

export async function finalizar(rodada_id) { 
    await pool.query(`UPDATE rodadas SET status = 'finalizada' WHERE id = ?`, [rodada_id]); 
    return { rodada_id, status: "finalizada" }; 
}

export async function update(rodada_id, data) { 
    await pool.query(`UPDATE rodadas SET data = ? WHERE id = ?`, [data, rodada_id]); 
    return findById(rodada_id); 
}

export async function remove(rodada_id) { 
    try { 
        await pool.query(`DELETE FROM rodada_jogadores WHERE rodada_id = ?`, [rodada_id]); 
        await pool.query(`DELETE FROM rodada_times WHERE rodada_id = ?`, [rodada_id]); 
        await pool.query(`DELETE FROM partidas WHERE rodada_id = ?`, [rodada_id]); 
        await pool.query(`DELETE FROM campeonato_rodada_elencos WHERE rodada_id = ?`, [rodada_id]); 
        await pool.query(`DELETE FROM rodadas WHERE id = ?`, [rodada_id]); 
    } catch (e) {} 
    return { message: "Rodada removida." }; 
}

export async function replaceJogadores(rodada_id, jogadoresIds) { 
    let connection;
    try { 
        connection = await pool.getConnection();
        await connection.beginTransaction(); 
        await connection.query('DELETE FROM rodada_jogadores WHERE rodada_id = ?', [rodada_id]); 
        for (const id of jogadoresIds) { 
            await connection.query('INSERT INTO rodada_jogadores (rodada_id, jogador_id) VALUES (?, ?)', [rodada_id, id]); 
        } 
        await connection.commit(); 
    } catch (err) { 
        if (connection) await connection.rollback(); 
        throw err; 
    } finally {
        if (connection) connection.release();
    }
}