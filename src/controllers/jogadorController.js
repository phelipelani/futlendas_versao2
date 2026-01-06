// // Arquivo: src/controllers/jogadorController.js
// import * as JogadorModel from '../models/jogadorModel.js';
// import * as AnalyticsModel from '../models/analyticsModel.js';
// import dbPromise from '../database/db.js';
// import { validationResult } from 'express-validator';
// import { uploadToS3 } from '../utils/s3Client.js';

// // OBS: 'fetch' é nativo no Node 22, não importamos node-fetch.

// /* ========================================================================== */
// /* HELPER DE VALIDAÇÃO                                */
// /* ========================================================================== */

// function checkValidation(req) {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     const err = new Error('Erro de validação.');
//     err.status = 400;
//     err.errors = errors.array();
//     throw err;
//   }
// }

// /* ========================================================================== */
// /* PERFIL COMPLETO (DASHBOARD) - CORRIGIDO (Removido j.numero)    */
// /* ========================================================================== */
// export async function getPerfilCompleto(req, res, next) {
//   try {
//     const { id } = req.params;
//     const db = await dbPromise;

//     // 1. Dados Básicos
//     // REMOVI 'j.numero' DA LISTA ABAIXO PARA PARAR O ERRO
//     const jogador = await db.get(
//       `SELECT 
//         j.id, j.nome, j.posicao, j.foto_url, j.avatar_url, j.nivel, j.role,
//         u.username as usuario_username
//        FROM jogadores j
//        LEFT JOIN usuarios u ON j.usuario_id = u.id
//        WHERE j.id = ?`, 
//       [id]
//     );
    
//     if (!jogador) {
//         return res.status(404).json({ message: 'Jogador não encontrado' });
//     }

//     // 2. Dados Avançados (Analytics)
//     let stats = {};
//     try {
//         stats = await AnalyticsModel.getPlayerFullStats(id);
//     } catch (error) {
//         console.warn("Erro ao carregar stats do jogador:", error);
//         // Retorna objeto vazio para não quebrar a tela se o analytics falhar
//         stats = { totais: {}, desempenho: {}, titulos: [], premios: [] };
//     }

//     res.status(200).json({
//         ...jogador,
//         stats: stats
//     });
//   } catch (err) {
//     next(err);
//   }
// }

// /* ========================================================================== */
// /* UPDATE AVATAR (HÍBRIDO & INTELIGENTE)             */
// /* ========================================================================== */
// export async function updateAvatar(req, res, next) {
//   try {
//     const { id } = req.params;
//     const { avatar_url } = req.body; 
//     let finalUrl = null;

//     // CENÁRIO A: Upload de Arquivo
//     if (req.file) {
//       console.log(`[Avatar] Recebido arquivo físico: ${req.file.originalname}`);
//       finalUrl = await uploadToS3(req.file, `avatares/${id}`);
//     } 
//     // CENÁRIO B: URL do Ready Player Me
//     else if (avatar_url) {
//         console.log(`[Avatar] Processando URL externa: ${avatar_url}`);
        
//         const response = await fetch(avatar_url);
//         if (!response.ok) throw new Error("Falha ao baixar avatar do provedor.");
        
//         const arrayBuffer = await response.arrayBuffer();
//         const buffer = Buffer.from(arrayBuffer);
        
//         const fakeFile = {
//             originalname: `rpm_avatar_${Date.now()}.glb`,
//             mimetype: 'model/gltf-binary',
//             buffer: buffer
//         };

//         finalUrl = await uploadToS3(fakeFile, `avatares/${id}`);
//     }

//     if (!finalUrl) {
//         return res.status(400).json({ message: "Nenhum arquivo ou URL válido fornecido." });
//     }

//     await JogadorModel.updateDetails(id, { avatar_url: finalUrl });

//     res.status(200).json({ 
//         message: 'Avatar atualizado com sucesso!', 
//         url: finalUrl 
//     });

//   } catch (err) {
//     next(err);
//   }
// }

// /* ========================================================================== */
// /* MÉTODOS ORIGINAIS (CRUD)                          */
// /* ========================================================================== */

// export async function createJogador(req, res, next) {
//   checkValidation(req);
//   const { nome, role, posicao, foto_url } = req.body;
//   const novoJogador = await JogadorModel.add(nome, role, posicao, foto_url);
//   res.status(201).json({ message: 'Jogador adicionado com sucesso!', jogador: novoJogador });
// }

// export async function getAllJogadores(req, res, next) {
//   const { posicao, nivel } = req.query;
//   const db = await dbPromise;

//   let query = `
//     SELECT 
//       j.*,
//       u.id AS usuario_id,
//       u.username AS usuario_username,
//       u.role AS usuario_role
//     FROM jogadores j
//     LEFT JOIN usuarios u ON j.usuario_id = u.id
//     WHERE 1=1
//   `;

//   const params = [];
//   if (posicao) { query += ' AND j.posicao = ?'; params.push(posicao); }
//   if (nivel) { query += ' AND j.nivel = ?'; params.push(nivel); }
//   query += ' ORDER BY j.nome ASC';

//   const rows = await db.all(query, params);

//   const jogadores = rows.map(j => ({
//     id: j.id,
//     nome: j.nome,
//     role: j.role,
//     posicao: j.posicao,
//     nivel: j.nivel,
//     joga_recuado: j.joga_recuado,
//     foto_url: j.foto_url,
//     avatar_url: j.avatar_url,
//     usuario: j.usuario_id ? { id: j.usuario_id, username: j.usuario_username, role: j.usuario_role, tem_conta_ativa: true } : { tem_conta_ativa: false },
//   }));

//   res.status(200).json(jogadores);
// }

// export async function getJogadorById(req, res, next) {
//   checkValidation(req);
//   const { id } = req.params;
//   const db = await dbPromise;
//   const jogador = await db.get(
//     `SELECT j.*, u.id AS usuario_id, u.username AS usuario_username, u.role AS usuario_role
//     FROM jogadores j LEFT JOIN usuarios u ON j.usuario_id = u.id WHERE j.id = ?`,
//     [id]
//   );

//   if (!jogador) { const err = new Error('Jogador não encontrado.'); err.status = 404; throw err; }

//   res.status(200).json({
//     id: jogador.id,
//     nome: jogador.nome,
//     role: jogador.role,
//     posicao: jogador.posicao,
//     nivel: jogador.nivel,
//     joga_recuado: jogador.joga_recuado,
//     foto_url: jogador.foto_url,
//     avatar_url: jogador.avatar_url,
//     usuario: jogador.usuario_id ? { id: jogador.usuario_id, username: jogador.usuario_username, role: jogador.usuario_role, tem_conta_ativa: true } : { tem_conta_ativa: false },
//   });
// }

// export async function getJogadoresByRodada(req, res, next) {
//   checkValidation(req);
//   const { rodada_id } = req.params;
//   const jogadores = await JogadorModel.findByRodadaId(rodada_id);
//   res.status(200).json(jogadores);
// }

// export async function updateJogadorDetails(req, res, next) {
//   checkValidation(req);
//   const { id } = req.params;
//   const data = req.body;
//   if (Object.keys(data).length === 0) { const err = new Error('Nenhum dado fornecido.'); err.status = 400; throw err; }
//   const result = await JogadorModel.updateDetails(id, data);
//   res.status(200).json(result);
// }

// export async function deleteJogador(req, res, next) {
//   checkValidation(req);
//   const { id } = req.params;
//   const result = await JogadorModel.deleteById(id);
//   res.status(200).json(result);
// }

// export async function syncPorNomes(req, res, next) {
//   try {
//     const { nomes } = req.body;

//     if (!nomes || !Array.isArray(nomes) || nomes.length === 0) {
//       return res.status(400).json({ message: 'Lista de nomes é obrigatória' });
//     }

//     const resultado = await JogadorModel.syncPorNomes(nomes);
//     res.status(200).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// Arquivo: src/controllers/jogadorController.js
import * as JogadorModel from '../models/jogadorModel.js';
import * as AnalyticsModel from '../models/analyticsModel.js';
import pool from '../database/db.js'; // Mudança para MySQL
import { validationResult } from 'express-validator';
import { uploadToS3 } from '../utils/s3Client.js';

/* ========================================================================== */
/* HELPER DE VALIDAÇÃO                                */
/* ========================================================================== */

function checkValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Erro de validação.');
    err.status = 400;
    err.errors = errors.array();
    throw err;
  }
}

/* ========================================================================== */
/* PERFIL COMPLETO (DASHBOARD)                                                */
/* ========================================================================== */
export async function getPerfilCompleto(req, res, next) {
  try {
    const { id } = req.params;

    // 1. Dados Básicos (MySQL syntax)
    const [rows] = await pool.query(
      `SELECT 
        j.id, j.nome, j.posicao, j.foto_url, j.avatar_url, j.nivel, j.role,
        u.username as usuario_username
       FROM jogadores j
       LEFT JOIN usuarios u ON j.usuario_id = u.id
       WHERE j.id = ?`, 
      [id]
    );
    const jogador = rows[0];
    
    if (!jogador) {
        return res.status(404).json({ message: 'Jogador não encontrado' });
    }

    // 2. Dados Avançados (Analytics)
    let stats = {};
    try {
        stats = await AnalyticsModel.getPlayerFullStats(id);
    } catch (error) {
        console.warn("Erro ao carregar stats do jogador:", error);
        stats = { totais: {}, desempenho: {}, titulos: [], premios: [] };
    }

    res.status(200).json({
        ...jogador,
        stats: stats
    });
  } catch (err) {
    next(err);
  }
}

/* ========================================================================== */
/* UPDATE AVATAR                                                              */
/* ========================================================================== */
export async function updateAvatar(req, res, next) {
  try {
    const { id } = req.params;
    const { avatar_url } = req.body; 
    let finalUrl = null;

    if (req.file) {
      console.log(`[Avatar] Recebido arquivo físico: ${req.file.originalname}`);
      finalUrl = await uploadToS3(req.file, `avatares/${id}`);
    } 
    else if (avatar_url) {
        console.log(`[Avatar] Processando URL externa: ${avatar_url}`);
        
        const response = await fetch(avatar_url);
        if (!response.ok) throw new Error("Falha ao baixar avatar do provedor.");
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const fakeFile = {
            originalname: `rpm_avatar_${Date.now()}.glb`,
            mimetype: 'model/gltf-binary',
            buffer: buffer
        };

        finalUrl = await uploadToS3(fakeFile, `avatares/${id}`);
    }

    if (!finalUrl) {
        return res.status(400).json({ message: "Nenhum arquivo ou URL válido fornecido." });
    }

    await JogadorModel.updateDetails(id, { avatar_url: finalUrl });

    res.status(200).json({ 
        message: 'Avatar atualizado com sucesso!', 
        url: finalUrl 
    });

  } catch (err) {
    next(err);
  }
}

/* ========================================================================== */
/* MÉTODOS ORIGINAIS (CRUD)                                                  */
/* ========================================================================== */

export async function createJogador(req, res, next) {
  checkValidation(req);
  const { nome, role, posicao, foto_url } = req.body;
  const novoJogador = await JogadorModel.add(nome, role, posicao, foto_url);
  res.status(201).json({ message: 'Jogador adicionado com sucesso!', jogador: novoJogador });
}

export async function getAllJogadores(req, res, next) {
  const { posicao, nivel } = req.query;

  let query = `
    SELECT 
      j.*,
      u.id AS usuario_id,
      u.username AS usuario_username,
      u.role AS usuario_role
    FROM jogadores j
    LEFT JOIN usuarios u ON j.usuario_id = u.id
    WHERE 1=1
  `;

  const params = [];
  if (posicao) { query += ' AND j.posicao = ?'; params.push(posicao); }
  if (nivel) { query += ' AND j.nivel = ?'; params.push(nivel); }
  query += ' ORDER BY j.nome ASC';

  // MySQL: Retorna [rows, fields], pegamos o primeiro elemento
  const [rows] = await pool.query(query, params);

  const jogadores = rows.map(j => ({
    id: j.id,
    nome: j.nome,
    role: j.role,
    posicao: j.posicao,
    nivel: j.nivel,
    joga_recuado: j.joga_recuado,
    foto_url: j.foto_url,
    avatar_url: j.avatar_url,
    usuario: j.usuario_id ? { id: j.usuario_id, username: j.usuario_username, role: j.usuario_role, tem_conta_ativa: true } : { tem_conta_ativa: false },
  }));

  res.status(200).json(jogadores);
}

export async function getJogadorById(req, res, next) {
  checkValidation(req);
  const { id } = req.params;
  
  const [rows] = await pool.query(
    `SELECT j.*, u.id AS usuario_id, u.username AS usuario_username, u.role AS usuario_role
    FROM jogadores j LEFT JOIN usuarios u ON j.usuario_id = u.id WHERE j.id = ?`,
    [id]
  );
  const jogador = rows[0];

  if (!jogador) { const err = new Error('Jogador não encontrado.'); err.status = 404; throw err; }

  res.status(200).json({
    id: jogador.id,
    nome: jogador.nome,
    role: jogador.role,
    posicao: jogador.posicao,
    nivel: jogador.nivel,
    joga_recuado: jogador.joga_recuado,
    foto_url: jogador.foto_url,
    avatar_url: jogador.avatar_url,
    usuario: jogador.usuario_id ? { id: jogador.usuario_id, username: jogador.usuario_username, role: jogador.usuario_role, tem_conta_ativa: true } : { tem_conta_ativa: false },
  });
}

export async function getJogadoresByRodada(req, res, next) {
  checkValidation(req);
  const { rodada_id } = req.params;
  const jogadores = await JogadorModel.findByRodadaId(rodada_id);
  res.status(200).json(jogadores);
}

export async function updateJogadorDetails(req, res, next) {
  checkValidation(req);
  const { id } = req.params;
  const data = req.body;
  if (Object.keys(data).length === 0) { const err = new Error('Nenhum dado fornecido.'); err.status = 400; throw err; }
  const result = await JogadorModel.updateDetails(id, data);
  res.status(200).json(result);
}

export async function deleteJogador(req, res, next) {
  checkValidation(req);
  const { id } = req.params;
  const result = await JogadorModel.deleteById(id);
  res.status(200).json(result);
}

export async function syncPorNomes(req, res, next) {
  try {
    const { nomes } = req.body;
    if (!nomes || !Array.isArray(nomes) || nomes.length === 0) {
      return res.status(400).json({ message: 'Lista de nomes é obrigatória' });
    }
    const resultado = await JogadorModel.syncPorNomes(nomes);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}