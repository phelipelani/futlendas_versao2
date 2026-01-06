// Arquivo: src/database/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do Pool de Conexões (Ideal para produção)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'futlendas_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Teste de conexão ao iniciar (opcional, apenas para debug)
pool.getConnection()
  .then((conn) => {
    console.log('✅ Conectado ao MySQL com sucesso!');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao MySQL:', err.message);
  });

export default pool;

// Funções utilitárias para manter compatibilidade com testes ou encerramento manual
export async function closeDb() {
  await pool.end();
  console.log('Conexão com o pool MySQL encerrada.');
}

// Para uso em mocks de teste se necessário
export function getDbInstance() {
  return pool;
}