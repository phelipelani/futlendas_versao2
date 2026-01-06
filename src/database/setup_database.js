// Arquivo: src/database/setup_database.js
import pool from './db.js';
import { fileURLToPath } from 'url';

console.log('Iniciando verificação e configuração do banco de dados MySQL...');

/*
  CORREÇÃO APLICADA:
  - Removido 'NOT NULL' das colunas que possuem 'ON DELETE SET NULL'
  - Isso resolve o erro "Foreign key constraint is incorrectly formed" (errno: 150)
*/

const tabelas = [
  // 1. USUÁRIOS (Sem dependências)
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user'
  );`,

  // 2. TIMES (Sem dependências)
  `CREATE TABLE IF NOT EXISTS times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    criado_em DATE DEFAULT (CURRENT_DATE)
  );`,

  // 3. JOGADORES (Depende de usuarios)
  `CREATE TABLE IF NOT EXISTS jogadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'player',
    joga_recuado BOOLEAN NOT NULL DEFAULT 0,
    nivel INT NOT NULL DEFAULT 1,
    posicao VARCHAR(50) NOT NULL DEFAULT 'linha',
    foto_url TEXT,
    usuario_id INT, -- Pode ser NULL
    avatar_url TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
  );`,

  // 4. CONVITES (Depende de jogadores e usuarios)
  `CREATE TABLE IF NOT EXISTS convites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jogador_id INT UNIQUE,
    token VARCHAR(255) NOT NULL UNIQUE,
    criado_em DATETIME NOT NULL,
    expira_em DATETIME NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT 0,
    usado_em DATETIME,
    criado_por INT, -- CORREÇÃO: Removido 'NOT NULL' para aceitar SET NULL
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
  );`,

  // 5. LIGAS
  `CREATE TABLE IF NOT EXISTS ligas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    finalizada_em DATETIME
  );`,

  // 6. CAMPEONATOS (Depende de times)
  `CREATE TABLE IF NOT EXISTS campeonatos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    data DATE NOT NULL,
    formato VARCHAR(50),
    fase_atual VARCHAR(50) NOT NULL DEFAULT 'inscricao',
    num_times INT DEFAULT 4,
    tem_fase_grupos BOOLEAN DEFAULT 1,
    fase_grupos_ida_volta BOOLEAN DEFAULT 0,
    tem_repescagem BOOLEAN DEFAULT 0,
    tem_terceiro_lugar BOOLEAN DEFAULT 0,
    modo_selecao_times VARCHAR(50) DEFAULT 'fixo',
    time_campeao_id INT, -- Pode ser NULL
    foto_campiao_url TEXT,
    FOREIGN KEY (time_campeao_id) REFERENCES times(id) ON DELETE SET NULL
  );`,

  // 7. RODADAS (Depende de ligas e campeonatos)
  `CREATE TABLE IF NOT EXISTS rodadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    liga_id INT,
    campeonato_id INT,
    data DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'aberta',
    FOREIGN KEY (liga_id) REFERENCES ligas(id) ON DELETE CASCADE,
    FOREIGN KEY (campeonato_id) REFERENCES campeonatos(id) ON DELETE CASCADE
  );`,

  // 8. PARTIDAS (Depende de rodadas e jogadores)
  `CREATE TABLE IF NOT EXISTS partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data DATETIME NOT NULL,
    rodada_id INT,
    placar_time1 INT DEFAULT 0,
    placar_time2 INT DEFAULT 0,
    duracao_segundos INT DEFAULT 0,
    time1_numero INT,
    time2_numero INT,
    goleiro_time1_id INT,
    goleiro_time2_id INT,
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id) ON DELETE CASCADE,
    FOREIGN KEY (goleiro_time1_id) REFERENCES jogadores(id) ON DELETE SET NULL,
    FOREIGN KEY (goleiro_time2_id) REFERENCES jogadores(id) ON DELETE SET NULL
  );`,

  // 9. RESULTADOS (Depende de partidas e jogadores)
  `CREATE TABLE IF NOT EXISTS resultados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partida_id INT NOT NULL,
    jogador_id INT NOT NULL,
    time VARCHAR(50) NOT NULL,
    gols INT DEFAULT 0,
    assistencias INT DEFAULT 0,
    vitorias INT DEFAULT 0,
    derrotas INT DEFAULT 0,
    empates INT DEFAULT 0,
    advertencias INT DEFAULT 0,
    sem_sofrer_gols BOOLEAN NOT NULL DEFAULT 0,
    gols_contra INT DEFAULT 0,
    FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE
  );`,

  // --- Tabelas Auxiliares ---
  
  `CREATE TABLE IF NOT EXISTS rodada_jogadores (
    rodada_id INT NOT NULL,
    jogador_id INT NOT NULL,
    PRIMARY KEY (rodada_id, jogador_id),
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id) ON DELETE CASCADE,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS rodada_times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rodada_id INT NOT NULL,
    jogador_id INT NOT NULL,
    numero_time INT NOT NULL,
    nome_time VARCHAR(255),
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id) ON DELETE CASCADE,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS premios_rodada (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rodada_id INT NOT NULL,
    jogador_id INT NOT NULL,
    tipo_premio VARCHAR(100) NOT NULL,
    pontuacao DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id) ON DELETE CASCADE,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS time_jogadores (
    time_id INT NOT NULL,
    jogador_id INT NOT NULL,
    is_capitao BOOLEAN DEFAULT 0,
    is_pe_de_rato BOOLEAN DEFAULT 0,
    PRIMARY KEY (time_id, jogador_id),
    FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE CASCADE,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS campeonato_times (
    campeonato_id INT NOT NULL,
    time_id INT NOT NULL,
    PRIMARY KEY (campeonato_id, time_id),
    FOREIGN KEY (campeonato_id) REFERENCES campeonatos(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS campeonato_elencos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campeonato_id INT NOT NULL,
    time_id INT NOT NULL,
    jogador_id INT NOT NULL,
    is_capitao BOOLEAN DEFAULT 0,
    is_pe_de_rato BOOLEAN DEFAULT 0,
    FOREIGN KEY (campeonato_id) REFERENCES campeonatos(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE CASCADE,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS campeonato_rodada_elencos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rodada_id INT NOT NULL,
    time_id INT NOT NULL,
    jogador_id INT NOT NULL,
    is_capitao BOOLEAN DEFAULT 0,
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE CASCADE,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS campeonato_partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campeonato_id INT NOT NULL,
    rodada_id INT,
    fase VARCHAR(50) NOT NULL,
    fase_mata_mata VARCHAR(50), 
    bracket VARCHAR(50),        
    ordem_confronto INT,        
    ordem_jogo INT,             
    timeA_id INT NOT NULL,
    timeB_id INT NOT NULL,
    placar_timeA INT DEFAULT 0,
    placar_timeB INT DEFAULT 0,
    placar_penaltis_timeA INT DEFAULT 0,
    placar_penaltis_timeB INT DEFAULT 0,
    duracao_segundos INT DEFAULT 0,
    goleiro_timeA_id INT,
    goleiro_timeB_id INT,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente',
    FOREIGN KEY (campeonato_id) REFERENCES campeonatos(id) ON DELETE CASCADE,
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id) ON DELETE CASCADE,
    FOREIGN KEY (timeA_id) REFERENCES times(id) ON DELETE CASCADE,
    FOREIGN KEY (timeB_id) REFERENCES times(id) ON DELETE CASCADE,
    FOREIGN KEY (goleiro_timeA_id) REFERENCES jogadores(id) ON DELETE SET NULL,
    FOREIGN KEY (goleiro_timeB_id) REFERENCES jogadores(id) ON DELETE SET NULL
  );`,

  `CREATE TABLE IF NOT EXISTS campeonato_estatisticas_partida (
    partida_id INT NOT NULL,
    jogador_id INT NOT NULL,
    time_id INT NOT NULL,
    gols INT NOT NULL DEFAULT 0,
    assistencias INT NOT NULL DEFAULT 0,
    clean_sheet BOOLEAN DEFAULT 0,
    PRIMARY KEY (partida_id, jogador_id),
    FOREIGN KEY (partida_id) REFERENCES campeonato_partidas(id) ON DELETE CASCADE,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS campeonato_vencedores (
    campeonato_id INT NOT NULL,
    jogador_id INT NOT NULL,
    PRIMARY KEY (campeonato_id, jogador_id),
    FOREIGN KEY (campeonato_id) REFERENCES campeonatos(id) ON DELETE CASCADE,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS campeonato_premios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campeonato_id INT NOT NULL,
    jogador_id INT NOT NULL,
    tipo_premio VARCHAR(100) NOT NULL, 
    valor VARCHAR(255) NOT NULL, 
    FOREIGN KEY (campeonato_id) REFERENCES campeonatos(id) ON DELETE CASCADE,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS eventos_jogo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partida_id INT, 
    campeonato_partida_id INT, 
    tipo_evento VARCHAR(100) NOT NULL,
    jogador_id INT NOT NULL,
    time_id INT,
    tempo_segundos INT NOT NULL,
    evento_pai_id INT,
    FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE,
    FOREIGN KEY (campeonato_partida_id) REFERENCES campeonato_partidas(id) ON DELETE CASCADE,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_pai_id) REFERENCES eventos_jogo(id) ON DELETE SET NULL
  );`
];

export const setup = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Desativa verificação temporariamente
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const sql of tabelas) {
      await connection.query(sql);
    }

    // Reativa verificações
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Índices
    const indices = [
      'CREATE INDEX idx_jogadores_usuario_id ON jogadores(usuario_id)',
      'CREATE INDEX idx_convites_token ON convites(token)',
      'CREATE INDEX idx_convites_jogador_id ON convites(jogador_id)',
    ];

    for (const sql of indices) {
      try { 
        await connection.query(sql); 
      } 
      catch (err) { 
        if (!err.message.includes('Duplicate key name') && !err.message.includes('already exists')) {
            console.warn(`Aviso ao criar índice: ${err.message}`);
        }
      }
    }

    await connection.commit();
    console.log('✅ Banco de dados MySQL atualizado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao configurar o banco de dados:', err.message);
    if (connection) await connection.rollback();
  } finally {
    if (connection) connection.release();
  }
};

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  console.log('Executando setup_database.js diretamente...');
  setup();
}