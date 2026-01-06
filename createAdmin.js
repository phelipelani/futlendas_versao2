import dbPromise from './src/database/db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// --- CONFIGURE AQUI SEU PRIMEIRO ADMIN ---
const adminUsername = 'admin';
const adminPassword = '160416Dud@';
// ----------------------------------------

async function createFirstAdmin() {
  console.log('Criando primeiro usuário admin...');
  try {
    const db = await dbPromise;
    const password_hash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    await db.run(
      'INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)',
      [adminUsername, password_hash, 'admin']
    );

    console.log(`Usuário admin '${adminUsername}' criado com sucesso!`);
    console.log('Pode deletar este script agora.');

  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
        console.warn(`O usuário '${adminUsername}' já existe. Nenhum usuário foi criado.`);
    } else {
        console.error('Erro ao criar admin:', err.message);
    }
  }
}

createFirstAdmin();