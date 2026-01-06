// // Arquivo: src/models/jogadorModel.js
// import dbPromise from '../database/db.js';

// /* ========================================================================== */
// /*                                 CRIAR JOGADOR                               */
// /* ========================================================================== */

// export async function add(
//   nome,
//   role = 'player',
//   posicao = 'linha',
//   foto_url = null,
//   avatar_url = null
// ) {
//   const db = await dbPromise;

//   if (!['linha', 'goleiro'].includes(posicao)) {
//     throw new Error("Posição inválida. Use 'linha' ou 'goleiro'.");
//   }

//   const joga_recuado = 0;
//   const nivel = 1;

//   const sql = `
//     INSERT INTO jogadores 
//       (nome, role, posicao, foto_url, avatar_url, joga_recuado, nivel)
//     VALUES (?, ?, ?, ?, ?, ?, ?)
//   `;

//   const result = await db.run(sql, [
//     nome,
//     role,
//     posicao,
//     foto_url,
//     avatar_url,
//     joga_recuado,
//     nivel,
//   ]);

//   return {
//     id: result.lastID,
//     nome,
//     role,
//     posicao,
//     foto_url,
//     avatar_url,
//     joga_recuado,
//     nivel,
//   };
// }

// /* ========================================================================== */
// /*                                  BUSCAS                                     */
// /* ========================================================================== */

// export async function findAll(posicao = null, nivel = null) {
//   const db = await dbPromise;

//   let sql = `
//     SELECT 
//       id, nome, role, joga_recuado, nivel, posicao, foto_url, avatar_url
//     FROM jogadores
//   `;

//   const params = [];
//   const conditions = [];

//   if (posicao) {
//     conditions.push('posicao = ?');
//     params.push(posicao);
//   }

//   if (nivel) {
//     conditions.push('nivel = ?');
//     params.push(nivel);
//   }

//   if (conditions.length > 0) {
//     sql += ' WHERE ' + conditions.join(' AND ');
//   }

//   sql += ' ORDER BY nome';

//   return db.all(sql, params);
// }

// export async function findByRodadaId(rodada_id) {
//   const db = await dbPromise;

//   const sql = `
//     SELECT j.*
//     FROM jogadores j
//     JOIN rodada_jogadores rj ON j.id = rj.jogador_id
//     WHERE rj.rodada_id = ?
//   `;

//   return db.all(sql, [rodada_id]);
// }

// export async function findById(id) {
//   const db = await dbPromise;

//   return db.get(
//     `SELECT id, nome, role, joga_recuado, nivel, posicao, foto_url, avatar_url 
//      FROM jogadores 
//      WHERE id = ?`,
//     [id]
//   );
// }

// /* ========================================================================== */
// /*                               UPDATE DETALHES                               */
// /* ========================================================================== */

// export async function updateDetails(id, data) {
//   const db = await dbPromise;

//   const { nome, nivel, posicao, joga_recuado, foto_url, avatar_url } = data;

//   const fields = [];
//   const params = [];

//   if (nome !== undefined) {
//     fields.push('nome = ?');
//     params.push(nome);
//   }

//   if (nivel !== undefined) {
//     fields.push('nivel = ?');
//     params.push(nivel);
//   }

//   if (posicao !== undefined) {
//     if (!['linha', 'goleiro'].includes(posicao))
//       throw new Error('Posição inválida.');
//     fields.push('posicao = ?');
//     params.push(posicao);
//   }

//   if (joga_recuado !== undefined) {
//     fields.push('joga_recuado = ?');
//     params.push(joga_recuado);
//   }

//   if (foto_url !== undefined) {
//     fields.push('foto_url = ?');
//     params.push(foto_url);
//   }

//   if (avatar_url !== undefined) {
//     fields.push('avatar_url = ?');
//     params.push(avatar_url);
//   }

//   if (fields.length === 0) {
//     return { message: 'Nenhum dado para atualizar.' };
//   }

//   params.push(id);

//   const sql = `UPDATE jogadores SET ${fields.join(', ')} WHERE id = ?`;
//   const result = await db.run(sql, params);

//   if (result.changes === 0)
//     throw new Error('Jogador não encontrado.');

//   return { message: 'Jogador atualizado com sucesso.' };
// }

// /* ========================================================================== */
// /*                                 DELETE                                      */
// /* ========================================================================== */

// export async function deleteById(id) {
//   const db = await dbPromise;

//   await db.run(
//     `UPDATE partidas SET goleiro_time1_id = NULL WHERE goleiro_time1_id = ?`,
//     [id]
//   );
//   await db.run(
//     `UPDATE partidas SET goleiro_time2_id = NULL WHERE goleiro_time2_id = ?`,
//     [id]
//   );

//   await db.run(
//     `UPDATE campeonato_partidas SET goleiro_timeA_id = NULL WHERE goleiro_timeA_id = ?`,
//     [id]
//   );
//   await db.run(
//     `UPDATE campeonato_partidas SET goleiro_timeB_id = NULL WHERE goleiro_timeB_id = ?`,
//     [id]
//   );

//   const result = await db.run(
//     `DELETE FROM jogadores WHERE id = ?`,
//     [id]
//   );

//   if (result.changes === 0)
//     throw new Error('Jogador não encontrado.');

//   return {
//     message: 'Jogador deletado (com todas as referências removidas).',
//   };
// }

// /* ========================================================================== */
// /*                      FIND OR CREATE (MÚLTIPLOS NOMES)                       */
// /* ========================================================================== */

// export async function findOrCreateManyByNomes(nomes) {
//   if (!nomes || nomes.length === 0)
//     return { jogadores: [], novos: 0, existentes: 0 };

//   const db = await dbPromise;

//   const nomesUnicos = [...new Set(nomes.map(n => n.trim()))];
//   const nomesLowerCase = nomesUnicos.map(n => n.toLowerCase());

//   const placeholders = nomesLowerCase.map(() => '?').join(',');
//   const sqlSelect = `
//     SELECT * 
//     FROM jogadores 
//     WHERE LOWER(nome) IN (${placeholders})
//   `;

//   const existentes = await db.all(sqlSelect, nomesLowerCase);
//   const existentesSet = new Set(existentes.map(j => j.nome.toLowerCase()));

//   const novosNomes = nomesUnicos.filter(
//     n => !existentesSet.has(n.toLowerCase())
//   );

//   const novos = [];

//   if (novosNomes.length > 0) {
//     let stmt;

//     try {
//       await db.run('BEGIN TRANSACTION');

//       stmt = await db.prepare(`
//         INSERT INTO jogadores (nome, role, posicao, joga_recuado, nivel)
//         VALUES (?, 'player', 'linha', 0, 1)
//       `);

//       for (const nome of novosNomes) {
//         const result = await stmt.run(nome);
//         novos.push({
//           id: result.lastID,
//           nome,
//           role: 'player',
//           posicao: 'linha',
//           joga_recuado: 0,
//           nivel: 1,
//           foto_url: null,
//           avatar_url: null,
//         });
//       }

//       await stmt.finalize();
//       await db.run('COMMIT');

//     } catch (err) {
//       if (stmt) await stmt.finalize();
//       await db.run('ROLLBACK');
//       throw err;
//     }
//   }

//   return {
//     jogadores: [...existentes, ...novos],
//     novos: novos.length,
//     existentes: existentes.length,
//   };
// }

// export async function syncPorNomes(nomes) {
//   const db = await dbPromise;
  
//   const jogadores = [];
//   let novos = 0;
//   let existentes = 0;

//   for (const nome of nomes) {
//     const nomeLimpo = nome.trim();
//     if (!nomeLimpo) continue;

//     // Busca jogador pelo nome (case insensitive)
//     let jogador = await db.get(
//       `SELECT id, nome, nivel, foto_url, posicao 
//        FROM jogadores 
//        WHERE LOWER(nome) = LOWER(?)`,
//       [nomeLimpo]
//     );

//     if (jogador) {
//       // Jogador existe
//       existentes++;
//       jogadores.push(jogador);
//     } else {
//       // Criar novo jogador
//       const result = await db.run(
//         `INSERT INTO jogadores (nome, posicao, nivel) VALUES (?, 'linha', 5)`,
//         [nomeLimpo]
//       );
      
//       jogador = {
//         id: result.lastID,
//         nome: nomeLimpo,
//         nivel: 5,
//         posicao: 'linha',
//         foto_url: null
//       };
      
//       novos++;
//       jogadores.push(jogador);
//     }
//   }

//   return {
//     jogadores,
//     novos,
//     existentes
//   };
// }


// Arquivo: src/models/jogadorModel.js
import pool from '../database/db.js';

/* ========================================================================== */
/* CRIAR JOGADOR                               */
/* ========================================================================== */

export async function add(
  nome,
  role = 'player',
  posicao = 'linha',
  foto_url = null,
  avatar_url = null
) {
  if (!['linha', 'goleiro'].includes(posicao)) {
    throw new Error("Posição inválida. Use 'linha' ou 'goleiro'.");
  }

  const joga_recuado = 0;
  const nivel = 1;

  const sql = `
    INSERT INTO jogadores 
      (nome, role, posicao, foto_url, avatar_url, joga_recuado, nivel)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  // MySQL retorna [result, fields]
  const [result] = await pool.query(sql, [
    nome,
    role,
    posicao,
    foto_url,
    avatar_url,
    joga_recuado,
    nivel,
  ]);

  return {
    id: result.insertId, // MySQL: insertId
    nome,
    role,
    posicao,
    foto_url,
    avatar_url,
    joga_recuado,
    nivel,
  };
}

/* ========================================================================== */
/* BUSCAS                                     */
/* ========================================================================== */

export async function findAll(posicao = null, nivel = null) {
  let sql = `
    SELECT 
      id, nome, role, joga_recuado, nivel, posicao, foto_url, avatar_url
    FROM jogadores
  `;

  const params = [];
  const conditions = [];

  if (posicao) {
    conditions.push('posicao = ?');
    params.push(posicao);
  }

  if (nivel) {
    conditions.push('nivel = ?');
    params.push(nivel);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY nome';

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function findByRodadaId(rodada_id) {
  const sql = `
    SELECT j.*
    FROM jogadores j
    JOIN rodada_jogadores rj ON j.id = rj.jogador_id
    WHERE rj.rodada_id = ?
  `;
  const [rows] = await pool.query(sql, [rodada_id]);
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id, nome, role, joga_recuado, nivel, posicao, foto_url, avatar_url 
     FROM jogadores 
     WHERE id = ?`,
    [id]
  );
  return rows[0];
}

/* ========================================================================== */
/* UPDATE DETALHES                               */
/* ========================================================================== */

export async function updateDetails(id, data) {
  const { nome, nivel, posicao, joga_recuado, foto_url, avatar_url } = data;

  const fields = [];
  const params = [];

  if (nome !== undefined) {
    fields.push('nome = ?');
    params.push(nome);
  }
  if (nivel !== undefined) {
    fields.push('nivel = ?');
    params.push(nivel);
  }
  if (posicao !== undefined) {
    if (!['linha', 'goleiro'].includes(posicao))
      throw new Error('Posição inválida.');
    fields.push('posicao = ?');
    params.push(posicao);
  }
  if (joga_recuado !== undefined) {
    fields.push('joga_recuado = ?');
    params.push(joga_recuado);
  }
  if (foto_url !== undefined) {
    fields.push('foto_url = ?');
    params.push(foto_url);
  }
  if (avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    params.push(avatar_url);
  }

  if (fields.length === 0) {
    return { message: 'Nenhum dado para atualizar.' };
  }

  params.push(id);

  const sql = `UPDATE jogadores SET ${fields.join(', ')} WHERE id = ?`;
  const [result] = await pool.query(sql, params);

  if (result.affectedRows === 0) // MySQL: affectedRows
    throw new Error('Jogador não encontrado.');

  return { message: 'Jogador atualizado com sucesso.' };
}

/* ========================================================================== */
/* DELETE                                      */
/* ========================================================================== */

export async function deleteById(id) {
  // Queries simples podem rodar sequencialmente no pool
  await pool.query(
    `UPDATE partidas SET goleiro_time1_id = NULL WHERE goleiro_time1_id = ?`,
    [id]
  );
  await pool.query(
    `UPDATE partidas SET goleiro_time2_id = NULL WHERE goleiro_time2_id = ?`,
    [id]
  );
  await pool.query(
    `UPDATE campeonato_partidas SET goleiro_timeA_id = NULL WHERE goleiro_timeA_id = ?`,
    [id]
  );
  await pool.query(
    `UPDATE campeonato_partidas SET goleiro_timeB_id = NULL WHERE goleiro_timeB_id = ?`,
    [id]
  );

  const [result] = await pool.query(`DELETE FROM jogadores WHERE id = ?`, [id]);

  if (result.affectedRows === 0)
    throw new Error('Jogador não encontrado.');

  return {
    message: 'Jogador deletado (com todas as referências removidas).',
  };
}

/* ========================================================================== */
/* FIND OR CREATE (MÚLTIPLOS NOMES)                       */
/* ========================================================================== */

export async function findOrCreateManyByNomes(nomes) {
  if (!nomes || nomes.length === 0)
    return { jogadores: [], novos: 0, existentes: 0 };

  const nomesUnicos = [...new Set(nomes.map(n => n.trim()))];
  const nomesLowerCase = nomesUnicos.map(n => n.toLowerCase());

  const placeholders = nomesLowerCase.map(() => '?').join(',');
  const sqlSelect = `
    SELECT * FROM jogadores 
    WHERE LOWER(nome) IN (${placeholders})
  `;

  // Em MySQL, collation geralmente é case-insensitive, mas LOWER funciona também
  const [existentes] = await pool.query(sqlSelect, nomesLowerCase);
  const existentesSet = new Set(existentes.map(j => j.nome.toLowerCase()));

  const novosNomes = nomesUnicos.filter(
    n => !existentesSet.has(n.toLowerCase())
  );

  const novos = [];
  let connection;

  if (novosNomes.length > 0) {
    try {
      // Pega conexão dedicada para transação
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const sqlInsert = `
        INSERT INTO jogadores (nome, role, posicao, joga_recuado, nivel)
        VALUES (?, 'player', 'linha', 0, 1)
      `;

      for (const nome of novosNomes) {
        const [result] = await connection.query(sqlInsert, [nome]);
        novos.push({
          id: result.insertId,
          nome,
          role: 'player',
          posicao: 'linha',
          joga_recuado: 0,
          nivel: 1,
          foto_url: null,
          avatar_url: null,
        });
      }

      await connection.commit();
    } catch (err) {
      if (connection) await connection.rollback();
      throw err;
    } finally {
      if (connection) connection.release();
    }
  }

  return {
    jogadores: [...existentes, ...novos],
    novos: novos.length,
    existentes: existentes.length,
  };
}

export async function syncPorNomes(nomes) {
  const jogadores = [];
  let novos = 0;
  let existentes = 0;

  for (const nome of nomes) {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) continue;

    // Busca jogador pelo nome
    const [rows] = await pool.query(
      `SELECT id, nome, nivel, foto_url, posicao 
       FROM jogadores 
       WHERE LOWER(nome) = LOWER(?)`,
      [nomeLimpo]
    );
    let jogador = rows[0];

    if (jogador) {
      existentes++;
      jogadores.push(jogador);
    } else {
      const [result] = await pool.query(
        `INSERT INTO jogadores (nome, posicao, nivel) VALUES (?, 'linha', 5)`,
        [nomeLimpo]
      );
      
      jogador = {
        id: result.insertId,
        nome: nomeLimpo,
        nivel: 5,
        posicao: 'linha',
        foto_url: null
      };
      
      novos++;
      jogadores.push(jogador);
    }
  }

  return {
    jogadores,
    novos,
    existentes
  };
}