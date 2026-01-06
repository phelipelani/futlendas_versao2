// import dbPromise from '../database/db.js';

// export async function add(liga) {
//   const db = await dbPromise;
//   const { nome, data_inicio, data_fim } = liga;

//   try {
//     const sql = `
//       INSERT INTO ligas (nome, data_inicio, data_fim)
//       VALUES (?, ?, ?)
//     `;
//     const result = await db.run(sql, [nome, data_inicio, data_fim]);
//     return { id: result.lastID, ...liga };
//   } catch (err) {
//     console.error('Erro ao adicionar liga:', err);
//     throw err;
//   }
// }

// export async function findAll() {
//   const db = await dbPromise;

//   try {
//     const sql = `
//       SELECT id, nome, data_inicio, data_fim, finalizada_em
//       FROM ligas
//       ORDER BY nome
//     `;
//     return await db.all(sql);
//   } catch (err) {
//     console.error('[MODEL] Erro ao buscar todas as ligas:', err);
//     throw err;
//   }
// }

// export async function findById(id) {
//   const db = await dbPromise;

//   try {
//     const sql = 'SELECT * FROM ligas WHERE id = ?';
//     return await db.get(sql, [id]);
//   } catch (err) {
//     console.error('Erro ao buscar liga por ID:', err);
//     throw err;
//   }
// }

// export async function update(id, campos) {
//   const db = await dbPromise;

//   const fields = [];
//   const values = [];

//   for (const key in campos) {
//     if (campos[key] !== undefined) {
//       fields.push(`${key} = ?`);
//       values.push(campos[key]);
//     }
//   }

//   if (!fields.length) {
//     throw new Error('Nenhum dado fornecido para atualização.');
//   }

//   values.push(id);

//   const sql = `UPDATE ligas SET ${fields.join(', ')} WHERE id = ?`;
//   const result = await db.run(sql, values);

//   if (result.changes === 0) {
//     throw new Error('Liga não encontrada.');
//   }

//   return { message: 'Liga atualizada com sucesso.' };
// }

// export async function remove(id) {
//   const db = await dbPromise;

//   const sql = 'DELETE FROM ligas WHERE id = ?';
//   const result = await db.run(sql, [id]);

//   if (result.changes === 0) {
//     throw new Error('Liga não encontrada.');
//   }

//   return {
//     message:
//       'Liga e todos os seus dados (rodadas, partidas, estatísticas) foram deletados com sucesso.',
//   };
// }

// export async function finalizar(ligaId) {
//   const db = await dbPromise;

//   const liga = await findById(ligaId);
//   if (!liga) {
//     const err = new Error('Liga não encontrada.');
//     err.status = 404;
//     throw err;
//   }

//   if (liga.finalizada_em) {
//     const err = new Error('Esta liga já foi finalizada.');
//     err.status = 400;
//     throw err;
//   }

//   const agora = new Date().toISOString();
//   const sql = 'UPDATE ligas SET finalizada_em = ? WHERE id = ?';

//   await db.run(sql, [agora, ligaId]);

//   return { message: 'Liga finalizada com sucesso!', finalizada_em: agora };
// }
// Arquivo: src/models/ligaModel.js
import pool from '../database/db.js';

export async function add(liga) {
  const { nome, data_inicio, data_fim } = liga;
  const [result] = await pool.query(`INSERT INTO ligas (nome, data_inicio, data_fim) VALUES (?, ?, ?)`, [nome, data_inicio, data_fim]);
  return { id: result.insertId, ...liga };
}

export async function findAll() {
  const [rows] = await pool.query(`SELECT id, nome, data_inicio, data_fim, finalizada_em FROM ligas ORDER BY nome`);
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM ligas WHERE id = ?', [id]);
  return rows[0];
}

export async function update(id, campos) {
  const fields = [];
  const values = [];
  for (const key in campos) {
    if (campos[key] !== undefined) { fields.push(`${key} = ?`); values.push(campos[key]); }
  }
  if (!fields.length) throw new Error('Nenhum dado.');
  values.push(id);
  const [result] = await pool.query(`UPDATE ligas SET ${fields.join(', ')} WHERE id = ?`, values);
  if (result.affectedRows === 0) throw new Error('Liga não encontrada.');
  return { message: 'Liga atualizada.' };
}

export async function remove(id) {
  const [result] = await pool.query('DELETE FROM ligas WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw new Error('Liga não encontrada.');
  return { message: 'Liga deletada.' };
}

export async function finalizar(ligaId) {
  const [result] = await pool.query('UPDATE ligas SET finalizada_em = NOW() WHERE id = ?', [ligaId]);
  if (result.affectedRows === 0) throw new Error('Liga não encontrada.');
  return { message: 'Liga finalizada!' };
}