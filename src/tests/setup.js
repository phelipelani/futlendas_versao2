// Arquivo: src/tests/setup.js
// (Agora com os imports corretos, partindo de dentro da SRC)

import dbPromise from '../database/db.js';

// Importa a lógica de setup que você JÁ CRIOU
// Caminho: sobe de 'tests' (../) e entra em 'database'
import { setup as setupDatabase } from '../database/setup_database.js';

// Esta função será executada pelo Jest antes de cada arquivo de teste
export default async () => {
  console.log('\n[JEST SETUP] Configurando banco de dados em memória...');
  try {
    // Garante que a conexão em memória esteja pronta
    await dbPromise;

    // Roda o seu script de criação de tabelas (CREATE TABLE IF NOT EXISTS...)
    await setupDatabase();

    console.log('[JEST SETUP] Banco de dados em memória pronto e schema aplicado.');
  } catch (error) {
    console.error('[JEST SETUP] Falha ao configurar o banco de teste:', error);
    process.exit(1); // Falha o teste se o banco não puder ser configurado
  }
};
