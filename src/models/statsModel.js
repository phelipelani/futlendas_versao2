// // Arquivo: src/models/statsModel.js
// import dbPromise from '../database/db.js';
// import { PONTOS } from '../utils/constants.js';

// // (Placeholder para futuras implementações de Ligas separadas, se houver)
// export async function getRankingLiga(ligaId) {
//   // Se não usar ligas antigas, pode retornar vazio.
//   return []; 
// }

// // Função para estatísticas gerais (dashboard antigo)
// export async function getGeneralStats() {
//     const db = await dbPromise;
//     // Retorna objeto vazio por padrão
//     return {};
// }

// Arquivo: src/models/statsModel.js
import pool from '../database/db.js';
import { PONTOS } from '../utils/constants.js';

// (Placeholder para futuras implementações de Ligas separadas, se houver)
export async function getRankingLiga(ligaId) {
  // Se não usar ligas antigas, pode retornar vazio.
  return []; 
}

// Função para estatísticas gerais (dashboard antigo)
export async function getGeneralStats() {
    // Apenas garante que a conexão está ok
    // Em MySQL, não precisamos abrir explicitamente como no SQLite
    return {};
}

// Se você tiver queries de ligas antigas aqui no futuro:
// Use pool.query('SELECT ...') no lugar de db.all