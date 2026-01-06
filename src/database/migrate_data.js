// Arquivo: src/database/migrate_data.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pool from './db.js'; // Conexão MySQL (Hostinger)
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAÇÃO ---
// Ajuste o nome do arquivo se necessário. 
// Geralmente fica na raiz ou pasta pai, baseado no seu código antigo.
// Se seu banco chama 'database.sqlite' ou 'futlendas.db', mude aqui.
const SQLITE_PATH = path.resolve(__dirname, '../../futlendas'); // Tentei deduzir pelo seu db.js antigo

async function migrate() {
  console.log('🚀 Iniciando Migração: SQLite (Local) -> MySQL (Hostinger)...');
  
  let sqliteDb;
  let mysqlConn;

  try {
    // 1. Conectar no SQLite Local
    console.log(`📂 Lendo banco SQLite em: ${SQLITE_PATH}`);
    sqliteDb = await open({
      filename: SQLITE_PATH,
      driver: sqlite3.Database
    });
    console.log('✅ SQLite Conectado!');

    // 2. Conectar no MySQL Remoto
    mysqlConn = await pool.getConnection();
    console.log('✅ MySQL Hostinger Conectado!');

    // 3. Desativar verificação de chave estrangeira (CRUCIAL para importar em qualquer ordem)
    await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 0');

    // Lista de tabelas para migrar (na ordem lógica, mas com FK desativada a ordem importa menos)
    const tabelas = [
      'usuarios',
      'times',
      'jogadores',
      'convites',
      'ligas',
      'campeonatos',
      'rodadas',
      'partidas',
      'resultados',
      'rodada_jogadores',
      'rodada_times',
      'premios_rodada',
      'time_jogadores',
      'campeonato_times',
      'campeonato_elencos',
      'campeonato_rodada_elencos',
      'campeonato_partidas',
      'campeonato_estatisticas_partida',
      'campeonato_vencedores',
      'campeonato_premios',
      'eventos_jogo'
    ];

    for (const tabela of tabelas) {
      console.log(`\n--- Migrando tabela: ${tabela} ---`);

      // A. Ler dados do SQLite
      let dadosOld;
      try {
        dadosOld = await sqliteDb.all(`SELECT * FROM ${tabela}`);
      } catch (e) {
        console.warn(`⚠️ Tabela ${tabela} não encontrada no SQLite ou vazia. Pulando...`);
        continue;
      }

      if (dadosOld.length === 0) {
        console.log(`0 registros encontrados.`);
        continue;
      }

      console.log(`${dadosOld.length} registros encontrados.`);

      // B. Limpar tabela no MySQL (TRUNCATE) para evitar duplicidade
      // Usamos DELETE porque TRUNCATE às vezes trava com FK mesmo desativado
      await mysqlConn.query(`DELETE FROM ${tabela}`);

      // C. Inserir no MySQL
      const colunas = Object.keys(dadosOld[0]); // Pega nomes das colunas (id, nome, etc)
      const placeholders = colunas.map(() => '?').join(', ');
      
      const sqlInsert = `INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES (${placeholders})`;

      for (const row of dadosOld) {
        // Prepara os valores (transforma booleanos do SQLite 1/0 se necessário, mas MySQL aceita)
        const valores = colunas.map(col => {
            // Pequeno ajuste para datas se vierem vazias
            if (row[col] === '') return null;
            return row[col];
        });

        try {
            await mysqlConn.query(sqlInsert, valores);
        } catch (errInsert) {
            console.error(`❌ Erro ao inserir ID ${row.id} na tabela ${tabela}:`, errInsert.message);
        }
      }
      console.log(`✅ ${tabela} migrada!`);
    }

    console.log('\n------------------------------------------------');
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('------------------------------------------------');

  } catch (erro) {
    console.error('❌ ERRO FATAL NA MIGRAÇÃO:', erro);
  } finally {
    // Reativar chaves estrangeiras
    if (mysqlConn) {
        await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 1');
        mysqlConn.release();
    }
    if (sqliteDb) {
        await sqliteDb.close();
    }
    process.exit();
  }
}

migrate();