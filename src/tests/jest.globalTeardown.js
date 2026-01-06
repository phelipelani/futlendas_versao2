// Arquivo: src/tests/jest.globalTeardown.js

import { closeDb } from '../database/db.js'; // Importa a nova função que vamos criar

export default async () => {
  console.log('\n[JEST GLOBAL TEARDOWN] Fechando conexão com o banco de dados...');
  await closeDb();
  console.log('[JEST GLOBAL TEARDOWN] Conexão fechada.');
};
