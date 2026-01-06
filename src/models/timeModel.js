// import dbPromise from '../database/db.js';

// /* -------------------------------------------------------------------------- */
// /*                                   CREATE                                   */
// /* -------------------------------------------------------------------------- */

// export async function create(nome, logo_url = null) {
//   const db = await dbPromise;

//   try {
//     const sql = `
//       INSERT INTO times (nome, logo_url, criado_em)
//       VALUES (?, ?, DATE('now'))
//     `;

//     const result = await db.run(sql, [nome, logo_url]);

//     return {
//       id: result.lastID,
//       nome,
//       logo_url,
//       criado_em: new Date().toISOString(),
//     };
//   } catch (err) {
//     console.error('Erro ao criar time:', err);
//     throw err;
//   }
// }

// /* -------------------------------------------------------------------------- */
// /*                                FIND ALL / ID                               */
// /* -------------------------------------------------------------------------- */

// export async function findAll() {
//   const db = await dbPromise;

//   try {
//     const sql = `
//       SELECT t.*, j.nome AS nome_capitao
//       FROM times t
//       LEFT JOIN time_jogadores tj
//         ON t.id = tj.time_id AND tj.is_capitao = 1
//       LEFT JOIN jogadores j
//         ON tj.jogador_id = j.id
//       ORDER BY t.nome
//     `;

//     return await db.all(sql);
//   } catch (err) {
//     console.error('Erro ao buscar todos os times:', err);
//     throw err;
//   }
// }

// export async function findById(time_id) {
//   const db = await dbPromise;

//   try {
//     const sql = `SELECT * FROM times WHERE id = ?`;
//     return await db.get(sql, [time_id]);
//   } catch (err) {
//     console.error('Erro ao buscar time por ID:', err);
//     throw err;
//   }
// }

// /* -------------------------------------------------------------------------- */
// /*                                   UPDATE                                   */
// /* -------------------------------------------------------------------------- */

// export async function update(time_id, { nome, logo_url, criado_em }) {
//   const db = await dbPromise;

//   const fields = [];
//   const params = [];

//   if (nome !== undefined) {
//     fields.push('nome = ?');
//     params.push(nome);
//   }

//   if (logo_url !== undefined) {
//     fields.push('logo_url = ?');
//     params.push(logo_url);
//   }

//   if (criado_em !== undefined) {
//     fields.push('criado_em = ?');
//     params.push(criado_em);
//   }

//   if (fields.length === 0) {
//     return { message: 'Nenhum dado para atualizar.' };
//   }

//   params.push(time_id);

//   try {
//     const sql = `UPDATE times SET ${fields.join(', ')} WHERE id = ?`;

//     const result = await db.run(sql, params);

//     if (result.changes === 0) {
//       throw new Error('Time não encontrado.');
//     }

//     return { message: 'Time atualizado com sucesso.' };
//   } catch (err) {
//     console.error('Erro ao atualizar time:', err);
//     if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
//       throw new Error('Um time com este nome já existe.');
//     }
//     throw err;
//   }
// }

// /* -------------------------------------------------------------------------- */
// /*                               ADD / REMOVE JOIN                             */
// /* -------------------------------------------------------------------------- */

// export async function addJogadores(time_id, jogador_ids) {
//   const db = await dbPromise;
//   let stmt;

//   try {
//     await db.run('BEGIN TRANSACTION;');

//     const sql = `
//       INSERT INTO time_jogadores (time_id, jogador_id, is_capitao, is_pe_de_rato)
//       VALUES (?, ?, 0, 0)
//     `;

//     stmt = await db.prepare(sql);

//     for (const jogador_id of jogador_ids) {
//       await stmt.run(time_id, jogador_id).catch((err) => {
//         if (err.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') throw err;
//       });
//     }

//     await db.run('COMMIT;');
//   } catch (err) {
//     await db.run('ROLLBACK;');
//     throw err;
//   } finally {
//     if (stmt) await stmt.finalize();
//   }
// }

// export async function updateJogadorRole(time_id, jogador_id, { is_capitao, is_pe_de_rato }) {
//   const db = await dbPromise;

//   const fields = [];
//   const params = [];

//   if (is_capitao !== undefined) {
//     fields.push('is_capitao = ?');
//     params.push(is_capitao ? 1 : 0);
//   }

//   if (is_pe_de_rato !== undefined) {
//     fields.push('is_pe_de_rato = ?');
//     params.push(is_pe_de_rato ? 1 : 0);
//   }

//   if (!fields.length) return;

//   params.push(time_id, jogador_id);

//   const sql = `
//     UPDATE time_jogadores
//     SET ${fields.join(', ')}
//     WHERE time_id = ? AND jogador_id = ?
//   `;

//   await db.run(sql, params);
// }

// export async function removeJogador(time_id, jogador_id) {
//   const db = await dbPromise;

//   const result = await db.run(
//     `
//     DELETE FROM time_jogadores
//     WHERE time_id = ? AND jogador_id = ?
//     `,
//     [time_id, jogador_id]
//   );

//   if (result.changes === 0) {
//     throw new Error('Jogador não encontrado neste time.');
//   }

//   return { message: 'Jogador removido.' };
// }

// export async function findJogadoresByTimeId(time_id) {
//   const db = await dbPromise;

//   const sql = `
//     SELECT j.*, tj.is_capitao, tj.is_pe_de_rato
//     FROM jogadores j
//     JOIN time_jogadores tj ON j.id = tj.jogador_id
//     WHERE tj.time_id = ?
//     ORDER BY tj.is_capitao DESC, j.nome ASC
//   `;

//   return await db.all(sql, [time_id]);
// }

// /* -------------------------------------------------------------------------- */
// /*                                   DELETE                                    */
// /* -------------------------------------------------------------------------- */

// export async function remove(time_id) {
//   const db = await dbPromise;

//   const result = await db.run(
//     'DELETE FROM times WHERE id = ?',
//     [time_id]
//   );

//   if (result.changes === 0) {
//     throw new Error('Time não encontrado.');
//   }

//   return { message: 'Deletado.' };
// }


// Arquivo: src/models/timeModel.js
import pool from '../database/db.js';

export async function create(nome, logo_url = null) {
  try {
    const [result] = await pool.query(
      `INSERT INTO times (nome, logo_url, criado_em) VALUES (?, ?, CURDATE())`,
      [nome, logo_url]
    );
    return {
      id: result.insertId,
      nome,
      logo_url,
      criado_em: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Erro ao criar time:', err);
    throw err;
  }
}

export async function findAll() {
  const [rows] = await pool.query(`
    SELECT t.*, j.nome AS nome_capitao
    FROM times t
    LEFT JOIN time_jogadores tj ON t.id = tj.time_id AND tj.is_capitao = 1
    LEFT JOIN jogadores j ON tj.jogador_id = j.id
    ORDER BY t.nome
  `);
  return rows;
}

export async function findById(time_id) {
  const [rows] = await pool.query(`SELECT * FROM times WHERE id = ?`, [time_id]);
  return rows[0];
}

export async function update(time_id, { nome, logo_url, criado_em }) {
  const fields = [];
  const params = [];
  if (nome !== undefined) { fields.push('nome = ?'); params.push(nome); }
  if (logo_url !== undefined) { fields.push('logo_url = ?'); params.push(logo_url); }
  if (criado_em !== undefined) { fields.push('criado_em = ?'); params.push(criado_em); }

  if (fields.length === 0) return { message: 'Nenhum dado.' };
  params.push(time_id);

  try {
    const [result] = await pool.query(`UPDATE times SET ${fields.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) throw new Error('Time não encontrado.');
    return { message: 'Time atualizado com sucesso.' };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new Error('Um time com este nome já existe.');
    throw err;
  }
}

export async function addJogadores(time_id, jogador_ids) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    for (const jogador_id of jogador_ids) {
      // MySQL INSERT IGNORE ou ON DUPLICATE KEY UPDATE para evitar erro
      await connection.query(
        `INSERT IGNORE INTO time_jogadores (time_id, jogador_id, is_capitao, is_pe_de_rato) VALUES (?, ?, 0, 0)`,
        [time_id, jogador_id]
      );
    }
    await connection.commit();
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

export async function updateJogadorRole(time_id, jogador_id, { is_capitao, is_pe_de_rato }) {
  const fields = [];
  const params = [];
  if (is_capitao !== undefined) { fields.push('is_capitao = ?'); params.push(is_capitao ? 1 : 0); }
  if (is_pe_de_rato !== undefined) { fields.push('is_pe_de_rato = ?'); params.push(is_pe_de_rato ? 1 : 0); }
  if (!fields.length) return;
  params.push(time_id, jogador_id);
  await pool.query(`UPDATE time_jogadores SET ${fields.join(', ')} WHERE time_id = ? AND jogador_id = ?`, params);
}

export async function removeJogador(time_id, jogador_id) {
  const [result] = await pool.query(`DELETE FROM time_jogadores WHERE time_id = ? AND jogador_id = ?`, [time_id, jogador_id]);
  if (result.affectedRows === 0) throw new Error('Jogador não encontrado neste time.');
  return { message: 'Jogador removido.' };
}

export async function findJogadoresByTimeId(time_id) {
  const [rows] = await pool.query(`
    SELECT j.*, tj.is_capitao, tj.is_pe_de_rato
    FROM jogadores j
    JOIN time_jogadores tj ON j.id = tj.jogador_id
    WHERE tj.time_id = ?
    ORDER BY tj.is_capitao DESC, j.nome ASC
  `, [time_id]);
  return rows;
}

export async function remove(time_id) {
  const [result] = await pool.query('DELETE FROM times WHERE id = ?', [time_id]);
  if (result.affectedRows === 0) throw new Error('Time não encontrado.');
  return { message: 'Deletado.' };
}