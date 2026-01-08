// // Arquivo: src/controllers/conviteController.js
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcrypt';
// import { v4 as uuidv4 } from 'uuid';
// import dbPromise from '../database/db.js';
// import { validationResult } from 'express-validator';
// import { HttpError } from '../utils/errors.js';

// const SALT_ROUNDS = 10;

// // Helper para validação
// function checkValidation(req) {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     const err = new HttpError('Erro de validação.', 400);
//     err.errors = errors.array();
//     throw err;
//   }
// }

// /**
//  * Gera um convite para um jogador
//  * POST /api/auth/convite/gerar
//  * Body: { jogador_id: number, tipo_usuario: 'user' | 'admin' }
//  */
// export async function gerarConvite(req, res, next) {
//   checkValidation(req);

//   // Pega o 'role' do corpo da requisição (padrão 'user')
//   const { jogador_id, role = 'user' } = req.body;
//   const adminId = req.user.userId;

//   const db = await dbPromise;

//   const jogador = await db.get('SELECT * FROM jogadores WHERE id = ?', [jogador_id]);
  
//   if (!jogador) {
//     throw new HttpError('Jogador não encontrado.', 404);
//   }

//   if (jogador.usuario_id) {
//     throw new HttpError('Este jogador já possui uma conta ativa.', 400);
//   }

//   // Verifica convite existente
//   const conviteExistente = await db.get(
//     `SELECT * FROM convites 
//      WHERE jogador_id = ? 
//      AND usado = 0 
//      AND datetime(expira_em) > datetime('now')`,
//     [jogador_id]
//   );

//   if (conviteExistente) {
//     // Se o convite já existe, ATUALIZA o role dele se for diferente
//     if (conviteExistente.role !== role) {
//         await db.run('UPDATE convites SET role = ? WHERE id = ?', [role, conviteExistente.id]);
//         conviteExistente.role = role; // Atualiza objeto local
//     }

//     return res.status(200).json({
//       message: 'Convite já existe e ainda é válido.',
//       convite: {
//         token: conviteExistente.token,
//         link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ativar-conta/${conviteExistente.token}`,
//         expira_em: conviteExistente.expira_em,
//         role: conviteExistente.role, // Retorna o role
//         jogador: {
//           id: jogador.id,
//           nome: jogador.nome,
//           foto_url: jogador.foto_url,
//         },
//       },
//     });
//   }

//   const token = uuidv4();
//   const agora = new Date();
//   const expiraEm = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

//   // Inserir convite COM O ROLE
//   const result = await db.run(
//     `INSERT INTO convites (jogador_id, token, role, criado_em, expira_em, criado_por)
//      VALUES (?, ?, ?, datetime('now'), datetime(?), ?)`,
//     [jogador_id, token, role, expiraEm.toISOString(), adminId]
//   );

//   const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ativar-conta/${token}`;

//   res.status(201).json({
//     message: 'Convite gerado com sucesso!',
//     convite: {
//       id: result.lastID,
//       token: token,
//       link: link,
//       expira_em: expiraEm.toISOString(),
//       role: role,
//       jogador: {
//         id: jogador.id,
//         nome: jogador.nome,
//         foto_url: jogador.foto_url,
//       },
//     },
//   });
// }

// /**
//  * Valida um token de convite
//  * GET /api/auth/convite/validar/:token
//  */
// export async function validarConvite(req, res, next) {
//   const { token } = req.params;
//   const db = await dbPromise;

//   const convite = await db.get(
//     `SELECT c.*, j.nome as jogador_nome, j.foto_url as jogador_foto
//      FROM convites c
//      JOIN jogadores j ON c.jogador_id = j.id
//      WHERE c.token = ?`,
//     [token]
//   );

//   if (!convite) throw new HttpError('Convite não encontrado.', 404);
//   if (convite.usado) throw new HttpError('Este convite já foi utilizado.', 400);

//   const agora = new Date();
//   const expiraEm = new Date(convite.expira_em);

//   if (agora > expiraEm) throw new HttpError('Este convite expirou.', 400);

//   res.status(200).json({
//     message: 'Convite válido!',
//     convite: {
//       jogador_id: convite.jogador_id,
//       jogador_nome: convite.jogador_nome,
//       jogador_foto: convite.jogador_foto,
//       expira_em: convite.expira_em,
//       role: convite.role || 'user', // Retorna o role para o front saber
//     },
//   });
// }

// /**
//  * Ativa a conta de um jogador usando o token de convite
//  * POST /api/auth/convite/ativar
//  * Body: { token: string, username: string, password: string }
//  */
// export async function ativarConta(req, res, next) {
//   checkValidation(req);

//   const { token, username, password } = req.body;
//   const db = await dbPromise;

//   const convite = await db.get(
//     `SELECT c.*, j.nome as jogador_nome, j.id as jogador_id
//      FROM convites c
//      JOIN jogadores j ON c.jogador_id = j.id
//      WHERE c.token = ?`,
//     [token]
//   );

//   if (!convite) throw new HttpError('Convite não encontrado.', 404);
//   if (convite.usado) throw new HttpError('Este convite já foi utilizado.', 400);

//   const agora = new Date();
//   const expiraEm = new Date(convite.expira_em);
//   if (agora > expiraEm) throw new HttpError('Este convite expirou.', 400);

//   const existingUser = await db.get('SELECT id FROM usuarios WHERE username = ?', [username]);
//   if (existingUser) throw new HttpError('Este username já está em uso.', 409);

//   const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  
//   // --- CORREÇÃO AQUI: Usa o role do convite ao criar o usuário ---
//   const userRole = convite.role || 'user'; // Fallback para 'user' se for antigo

//   const userResult = await db.run(
//     'INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)',
//     [username, password_hash, userRole]
//   );

//   const userId = userResult.lastID;

//   await db.run('UPDATE jogadores SET usuario_id = ? WHERE id = ?', [userId, convite.jogador_id]);
//   await db.run(`UPDATE convites SET usado = 1, usado_em = datetime('now') WHERE id = ?`, [convite.id]);

//   // Gera o token já com o role correto
//   const payload = {
//     userId: userId,
//     username: username,
//     role: userRole,
//   };

//   const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

//   res.status(200).json({
//     message: 'Conta ativada com sucesso!',
//     token: jwtToken,
//     user: {
//       id: userId,
//       username: username,
//       role: userRole,
//       jogador_id: convite.jogador_id,
//       jogador_nome: convite.jogador_nome,
//     },
//   });
// }

// /**
//  * Gera um convite para um novo ADMIN (não vinculado a jogador)
//  * POST /api/auth/convite/admin
//  * Body: { email: string }
//  */
// export async function gerarConviteAdmin(req, res, next) {
//   checkValidation(req);

//   const { email } = req.body;
//   const adminId = req.user.userId;

//   const db = await dbPromise;

//   // Verificar se já existe usuário com este email
//   const existingUser = await db.get('SELECT id FROM usuarios WHERE username = ?', [email]);
  
//   if (existingUser) {
//     throw new HttpError('Já existe um usuário com este email.', 409);
//   }

//   // Gerar token único
//   const token = uuidv4();

//   // Calcular expiração (24h)
//   const agora = new Date();
//   const expiraEm = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

//   // Inserir convite (sem jogador_id, pois é admin)
//   const result = await db.run(
//     `INSERT INTO convites (jogador_id, token, criado_em, expira_em, criado_por)
//      VALUES (NULL, ?, datetime('now'), datetime(?), ?)`,
//     [token, expiraEm.toISOString(), adminId]
//   );

//   const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ativar-admin/${token}`;

//   res.status(201).json({
//     message: 'Convite de admin gerado com sucesso!',
//     convite: {
//       id: result.lastID,
//       token: token,
//       link: link,
//       email: email,
//       expira_em: expiraEm.toISOString(),
//     },
//   });
// }

// /**
//  * Lista todos os convites ativos
//  * GET /api/auth/convites
//  */
// export async function listarConvites(req, res, next) {
//   const db = await dbPromise;

//   const convites = await db.all(
//     `SELECT 
//       c.*,
//       j.nome as jogador_nome,
//       j.foto_url as jogador_foto,
//       u.username as criado_por_username
//      FROM convites c
//      LEFT JOIN jogadores j ON c.jogador_id = j.id
//      LEFT JOIN usuarios u ON c.criado_por = u.id
//      ORDER BY c.criado_em DESC`
//   );

//   res.status(200).json(convites);
// }

// Arquivo: src/controllers/conviteController.js
// Arquivo: src/controllers/conviteController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import pool from '../database/db.js';
import { validationResult } from 'express-validator';
import { HttpError } from '../utils/errors.js';

const SALT_ROUNDS = 10;

// Helper para validação
function checkValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new HttpError('Erro de validação.', 400);
    err.errors = errors.array();
    throw err;
  }
}

/**
 * Helper para pegar a URL base do Frontend corretamente
 * Remove barra no final se houver, para evitar links como .com.br//ativar
 */
function getFrontendUrl() {
  const url = process.env.FRONTEND_URL || 'http://localhost:5173';
  return url.replace(/\/$/, ''); // Remove a última barra se existir
}

/**
 * Gera um convite para um jogador
 * POST /api/auth/convite/gerar
 * Body: { jogador_id: number, tipo_usuario: 'user' | 'admin' }
 */
export async function gerarConvite(req, res, next) {
  try {
    checkValidation(req);

    // Pega o 'role' do corpo da requisição (padrão 'user')
    const { jogador_id, role = 'user' } = req.body;
    const adminId = req.user.userId;

    // MySQL Query: Busca Jogador
    const [jogadores] = await pool.query('SELECT * FROM jogadores WHERE id = ?', [jogador_id]);
    const jogador = jogadores[0];
    
    if (!jogador) {
      throw new HttpError('Jogador não encontrado.', 404);
    }

    if (jogador.usuario_id) {
      throw new HttpError('Este jogador já possui uma conta ativa.', 400);
    }

    // Verifica convite existente
    const [convitesExistentes] = await pool.query(
      `SELECT * FROM convites 
       WHERE jogador_id = ? 
       AND usado = 0 
       AND expira_em > NOW()`,
      [jogador_id]
    );
    const conviteExistente = convitesExistentes[0];

    const baseUrl = getFrontendUrl();

    if (conviteExistente) {
      // Se o convite já existe, ATUALIZA o role dele se for diferente
      if (conviteExistente.role !== role) {
          await pool.query('UPDATE convites SET role = ? WHERE id = ?', [role, conviteExistente.id]);
          conviteExistente.role = role; // Atualiza objeto local
      }

      return res.status(200).json({
        message: 'Convite já existe e ainda é válido.',
        convite: {
          token: conviteExistente.token,
          link: `${baseUrl}/ativar-conta/${conviteExistente.token}`,
          expira_em: conviteExistente.expira_em,
          role: conviteExistente.role,
          jogador: {
            id: jogador.id,
            nome: jogador.nome,
            foto_url: jogador.foto_url,
          },
        },
      });
    }

    const token = uuidv4();
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + 24 * 60 * 60 * 1000); // 24 horas

    // Inserir convite COM O ROLE (MySQL syntax)
    const [result] = await pool.query(
      `INSERT INTO convites (jogador_id, token, role, criado_em, expira_em, criado_por)
       VALUES (?, ?, ?, NOW(), ?, ?)`,
      [jogador_id, token, role, expiraEm, adminId]
    );

    const link = `${baseUrl}/ativar-conta/${token}`;

    res.status(201).json({
      message: 'Convite gerado com sucesso!',
      convite: {
        id: result.insertId,
        token: token,
        link: link,
        expira_em: expiraEm.toISOString(),
        role: role,
        jogador: {
          id: jogador.id,
          nome: jogador.nome,
          foto_url: jogador.foto_url,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Valida um token de convite
 * GET /api/auth/convite/validar/:token
 */
export async function validarConvite(req, res, next) {
  try {
    const { token } = req.params;

    const [rows] = await pool.query(
      `SELECT c.*, j.nome as jogador_nome, j.foto_url as jogador_foto
       FROM convites c
       JOIN jogadores j ON c.jogador_id = j.id
       WHERE c.token = ?`,
      [token]
    );
    const convite = rows[0];

    if (!convite) throw new HttpError('Convite não encontrado.', 404);
    if (convite.usado) throw new HttpError('Este convite já foi utilizado.', 400);

    const agora = new Date();
    const expiraEm = new Date(convite.expira_em);

    if (agora > expiraEm) throw new HttpError('Este convite expirou.', 400);

    res.status(200).json({
      message: 'Convite válido!',
      convite: {
        jogador_id: convite.jogador_id,
        jogador_nome: convite.jogador_nome,
        jogador_foto: convite.jogador_foto,
        expira_em: convite.expira_em,
        role: convite.role || 'user',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Ativa a conta de um jogador usando o token de convite
 * POST /api/auth/convite/ativar
 * Body: { token: string, username: string, password: string }
 */
export async function ativarConta(req, res, next) {
  let connection;
  try {
    checkValidation(req);

    const { token, username, password } = req.body;

    // Pega conexão para usar transação
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT c.*, j.nome as jogador_nome, j.id as jogador_id
       FROM convites c
       JOIN jogadores j ON c.jogador_id = j.id
       WHERE c.token = ?`,
      [token]
    );
    const convite = rows[0];

    if (!convite) {
        await connection.rollback();
        throw new HttpError('Convite não encontrado.', 404);
    }
    if (convite.usado) {
        await connection.rollback();
        throw new HttpError('Este convite já foi utilizado.', 400);
    }

    const agora = new Date();
    const expiraEm = new Date(convite.expira_em);
    if (agora > expiraEm) {
        await connection.rollback();
        throw new HttpError('Este convite expirou.', 400);
    }

    const [users] = await connection.query('SELECT id FROM usuarios WHERE username = ?', [username]);
    if (users.length > 0) {
        await connection.rollback();
        throw new HttpError('Este username já está em uso.', 409);
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const userRole = convite.role || 'user';

    const [userResult] = await connection.query(
      'INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)',
      [username, password_hash, userRole]
    );

    const userId = userResult.insertId;

    await connection.query('UPDATE jogadores SET usuario_id = ? WHERE id = ?', [userId, convite.jogador_id]);
    await connection.query(`UPDATE convites SET usado = 1, usado_em = NOW() WHERE id = ?`, [convite.id]);

    await connection.commit();

    // Gera o token
    const payload = {
      userId: userId,
      username: username,
      role: userRole,
    };

    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({
      message: 'Conta ativada com sucesso!',
      token: jwtToken,
      user: {
        id: userId,
        username: username,
        role: userRole,
        jogador_id: convite.jogador_id,
        jogador_nome: convite.jogador_nome,
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Gera um convite para um novo ADMIN (não vinculado a jogador)
 * POST /api/auth/convite/admin
 * Body: { email: string }
 */
export async function gerarConviteAdmin(req, res, next) {
  try {
    checkValidation(req);

    const { email } = req.body;
    const adminId = req.user.userId;

    // Verificar se já existe usuário com este email (username)
    const [users] = await pool.query('SELECT id FROM usuarios WHERE username = ?', [email]);
    
    if (users.length > 0) {
      throw new HttpError('Já existe um usuário com este email.', 409);
    }

    const token = uuidv4();
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + 24 * 60 * 60 * 1000); // 24h

    const [result] = await pool.query(
      `INSERT INTO convites (jogador_id, token, criado_em, expira_em, criado_por)
       VALUES (NULL, ?, NOW(), ?, ?)`,
      [token, expiraEm, adminId]
    );

    const baseUrl = getFrontendUrl();
    const link = `${baseUrl}/ativar-admin/${token}`;

    res.status(201).json({
      message: 'Convite de admin gerado com sucesso!',
      convite: {
        id: result.insertId,
        token: token,
        link: link,
        email: email,
        expira_em: expiraEm.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lista todos os convites ativos
 * GET /api/auth/convites
 */
export async function listarConvites(req, res, next) {
  try {
    const [convites] = await pool.query(
      `SELECT 
        c.*,
        j.nome as jogador_nome,
        j.foto_url as jogador_foto,
        u.username as criado_por_username
       FROM convites c
       LEFT JOIN jogadores j ON c.jogador_id = j.id
       LEFT JOIN usuarios u ON c.criado_por = u.id
       ORDER BY c.criado_em DESC`
    );

    res.status(200).json(convites);
  } catch (error) {
    next(error);
  }
}