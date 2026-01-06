// // Arquivo: src/controllers/authController.js
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcrypt';
// import dbPromise from '../database/db.js';
// import { validationResult } from 'express-validator';
// import { HttpError } from '../utils/errors.js';

// const SALT_ROUNDS = 10;

// /* ---------------------------- Helper de Validação ---------------------------- */

// function checkValidation(req) {
//   const errors = validationResult(req);

//   if (!errors.isEmpty()) {
//     const err = new HttpError('Erro de validação.', 400);
//     err.errors = errors.array();
//     throw err;
//   }
// }

// /* --------------------------------- Register -------------------------------- */

// export async function register(req, res, next) {
//   try {
//     // 1. Validação
//     checkValidation(req);

//     const { username, password, role } = req.body;
//     const userRole = role === 'admin' ? 'admin' : 'user';
//     const db = await dbPromise;

//     // 2. Verificar existência
//     const existingUser = await db.get(
//       'SELECT id FROM usuarios WHERE username = ?',
//       [username]
//     );

//     if (existingUser) {
//       throw new HttpError('Este username já está em uso.', 409);
//     }

//     // 3. Hash e Criação
//     const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

//     const result = await db.run(
//       `INSERT INTO usuarios (username, password_hash, role)
//        VALUES (?, ?, ?)`,
//       [username, password_hash, userRole]
//     );

//     res.status(201).json({
//       message: 'Usuário registrado com sucesso!',
//       userId: result.lastID,
//       username,
//       role: userRole,
//     });
//   } catch (error) {
//     // Envia o erro para o middleware global (não quebra o app)
//     next(error);
//   }
// }

// /* ----------------------------------- Login ---------------------------------- */

// export async function login(req, res, next) {
//   try {
//     // 1. Validação
//     checkValidation(req);

//     const { username, password } = req.body;
//     const db = await dbPromise;

//     // 2. Buscar usuário
//     const user = await db.get(
//       'SELECT * FROM usuarios WHERE username = ?',
//       [username]
//     );

//     // Se não achar o usuário, lança 401 (sem derrubar o server)
//     if (!user) {
//       throw new HttpError('Credenciais inválidas.', 401);
//     }

//     // 3. Verificar senha
//     const isMatch = await bcrypt.compare(password, user.password_hash);

//     if (!isMatch) {
//       throw new HttpError('Credenciais inválidas.', 401);
//     }

//     // 4. Gerar Token
//     const payload = {
//       userId: user.id,
//       username: user.username,
//       role: user.role,
//     };

//     // Use uma variável de ambiente para o segredo em produção
//     const secret = process.env.JWT_SECRET || 'seusegredomuitoseguro';
    
//     const token = jwt.sign(payload, secret, {
//       expiresIn: '24h', // Token expira em 24 horas
//     });

//     // 5. Retornar sucesso
//     res.status(200).json({
//       message: 'Login realizado com sucesso!',
//       token,
//       user: {
//         id: user.id,
//         username: user.username,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     // Envia o erro para o middleware global (não quebra o app)
//     next(error);
//   }
// }

// Arquivo: src/controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../database/db.js'; // Mudança aqui: Importando pool do MySQL
import { validationResult } from 'express-validator';
import { HttpError } from '../utils/errors.js';

const SALT_ROUNDS = 10;

/* ---------------------------- Helper de Validação ---------------------------- */

function checkValidation(req) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new HttpError('Erro de validação.', 400);
    err.errors = errors.array();
    throw err;
  }
}

/* --------------------------------- Register -------------------------------- */

export async function register(req, res, next) {
  try {
    // 1. Validação
    checkValidation(req);

    const { username, password, role } = req.body;
    const userRole = role === 'admin' ? 'admin' : 'user';

    // 2. Verificar existência (MySQL retorna um array de rows na primeira posição)
    const [rows] = await pool.query(
      'SELECT id FROM usuarios WHERE username = ?',
      [username]
    );
    const existingUser = rows[0];

    if (existingUser) {
      throw new HttpError('Este username já está em uso.', 409);
    }

    // 3. Hash e Criação
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      `INSERT INTO usuarios (username, password_hash, role)
       VALUES (?, ?, ?)`,
      [username, password_hash, userRole]
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      userId: result.insertId, // MySQL usa insertId, não lastID
      username,
      role: userRole,
    });
  } catch (error) {
    next(error);
  }
}

/* ----------------------------------- Login ---------------------------------- */

export async function login(req, res, next) {
  try {
    // 1. Validação
    checkValidation(req);

    const { username, password } = req.body;

    // 2. Buscar usuário
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE username = ?',
      [username]
    );
    const user = rows[0];

    // Se não achar o usuário
    if (!user) {
      throw new HttpError('Credenciais inválidas.', 401);
    }

    // 3. Verificar senha
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw new HttpError('Credenciais inválidas.', 401);
    }

    // 4. Gerar Token
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const secret = process.env.JWT_SECRET || 'seusegredomuitoseguro';
    
    const token = jwt.sign(payload, secret, {
      expiresIn: '24h',
    });

    // 5. Retornar sucesso
    res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}