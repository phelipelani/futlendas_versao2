// Arquivo: src/tests/jest.globalSetup.js

import { setup as setupDatabase } from '../database/setup_database.js';
// Precisamos importar o dbPromise (para iniciar a conexão)
// e a nova função getDbInstance (para pegar a instância criada)
import dbPromise, { getDbInstance } from '../database/db.js';

export default async () => {
  console.log('\n[JEST GLOBAL SETUP] Configurando o banco de dados em memória...');
  process.env.NODE_ENV = 'test';

  try {
    // 1. Garante que a conexão ':memory:' seja criada
    //    Isso vai rodar o openDb() pela primeira vez.
    await dbPromise;

    // 2. Roda o SEU script de criação de tabelas
    await setupDatabase();

    // 3. GUARDA A INSTÂNCIA NO GLOBAL
    //    getDbInstance() vai retornar o 'dbInstance' que o openDb() criou.
    global.__DB_INSTANCE__ = getDbInstance();

    if (!global.__DB_INSTANCE__) {
      throw new Error('Falha ao guardar a instância do DB no global. A instância é nula.');
    }

    console.log('[JEST GLOBAL SETUP] Banco de dados pronto, tabelas criadas e instância guardada.');
  } catch (error) {
    console.error('[JEST GLOBAL SETUP] FALHA AO CRIAR BANCO:', error);
    process.exit(1);
  }
};
