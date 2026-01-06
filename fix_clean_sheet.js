// Arquivo: fix_clean_sheet.js
import dbPromise from './src/database/db.js';

async function fix() {
  console.log("🛠️ Adicionando suporte a Clean Sheet...");
  const db = await dbPromise;
  try {
    // Adiciona a coluna na tabela de estatísticas do campeonato
    await db.exec("ALTER TABLE campeonato_estatisticas_partida ADD COLUMN clean_sheet BOOLEAN DEFAULT 0");
    console.log("✅ Coluna 'clean_sheet' criada!");
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log("⚠️ Coluna já existe.");
    } else {
      console.error("❌ Erro:", err.message);
    }
  }
}
fix();