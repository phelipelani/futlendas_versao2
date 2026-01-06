// Arquivo: src/tests/goleiroStats.test.js
import request from 'supertest';
import app from '../app.js';
import dbPromise from '../database/db.js';

describe('Testes de Integração: /api/goleiro-stats', () => {
  let db;
  let liga1Id, camp1Id;
  let goleiro1Id, goleiro2Id;
  let partidaLigaId, partidaCampId;

  beforeAll(async () => {
    db = await dbPromise;

    // Limpeza
    await db.exec('DELETE FROM campeonato_estatisticas_partida;');
    await db.exec('DELETE FROM campeonato_partidas;');
    await db.exec('DELETE FROM campeonatos;');
    await db.exec('DELETE FROM resultados;');
    await db.exec('DELETE FROM partidas;');
    await db.exec('DELETE FROM rodadas;');
    await db.exec('DELETE FROM ligas;');
    await db.exec('DELETE FROM jogadores;');
    // Adicionado 'times' à lista de limpeza da sequence
    await db.exec(
      "DELETE FROM sqlite_sequence WHERE name IN ('ligas', 'campeonatos', 'jogadores', 'rodadas', 'partidas', 'campeonato_partidas', 'times');"
    );

    // Dados base
    const g1 = await db.run('INSERT INTO jogadores (nome, posicao) VALUES (?, ?)', [
      'Goleiro Stats 1',
      'goleiro',
    ]);
    goleiro1Id = g1.lastID;
    const g2 = await db.run('INSERT INTO jogadores (nome, posicao) VALUES (?, ?)', [
      'Goleiro Stats 2',
      'goleiro',
    ]);
    goleiro2Id = g2.lastID;
    const l1 = await db.run('INSERT INTO ligas (nome, data_inicio, data_fim) VALUES (?, ?, ?)', [
      'Liga Goleiro Teste',
      '2025-01-01',
      '2025-12-31',
    ]);
    liga1Id = l1.lastID;
    const c1 = await db.run('INSERT INTO campeonatos (nome, data, fase_atual) VALUES (?, ?, ?)', [
      'Camp Goleiro Teste',
      '2025-11-10',
      'finalizado',
    ]);
    camp1Id = c1.lastID;
    const r1 = await db.run('INSERT INTO rodadas (liga_id, data) VALUES (?, ?)', [
      liga1Id,
      '2025-10-25',
    ]);

    // Cria partida de LIGA com goleiros e resultado
    const pL = await db.run(
      'INSERT INTO partidas (rodada_id, data, placar_time1, placar_time2, duracao_segundos, goleiro_time1_id, goleiro_time2_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [r1.lastID, '2025-10-25', 2, 3, 600, goleiro1Id, goleiro2Id]
    );
    partidaLigaId = pL.lastID;

    // --- CORREÇÃO APLICADA AQUI ---
    // Adiciona nomes aos times
    const t1 = await db.run('INSERT INTO times (nome) VALUES (?)', ['Time Goleiro A']);
    const time1Id = t1.lastID;
    const t2 = await db.run('INSERT INTO times (nome) VALUES (?)', ['Time Goleiro B']);
    const time2Id = t2.lastID;
    // --- FIM DA CORREÇÃO ---

    // Cria partida de CAMPEONATO com goleiros e resultado
    const pC = await db.run(
      `INSERT INTO campeonato_partidas 
                                (campeonato_id, fase, timeA_id, timeB_id, status, placar_timeA, placar_timeB, duracao_segundos, goleiro_timeA_id, goleiro_timeB_id) 
                                VALUES (?, 'final', ?, ?, 'finalizada', 1, 0, 720, ?, ?)`,
      [camp1Id, time1Id, time2Id, goleiro1Id, goleiro2Id]
    );
    partidaCampId = pC.lastID;
  });

  test('GET /api/goleiro-stats/liga', async () => {
    const res = await request(app).get(`/api/goleiro-stats/liga?liga_id=${liga1Id}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2); // Goleiro 1 e Goleiro 2

    const statsG1 = res.body.find((g) => g.jogador_id === goleiro1Id);
    const statsG2 = res.body.find((g) => g.jogador_id === goleiro2Id);

    // Goleiro 1 (Time 1) perdeu por 3x2, sofreu 3 gols em 10 min
    expect(statsG1.total_jogos).toBe(1);
    expect(statsG1.total_gols_sofridos).toBe(3);
    expect(statsG1.total_vitorias).toBe(0);
    expect(statsG1.total_derrotas).toBe(1);
    expect(statsG1.total_minutos_jogados).toBe(10);
    expect(statsG1.media_gols_sofridos_por_minuto).toBe(0.3);

    // Goleiro 2 (Time 2) ganhou por 3x2, sofreu 2 gols em 10 min
    expect(statsG2.total_jogos).toBe(1);
    expect(statsG2.total_gols_sofridos).toBe(2);
    expect(statsG2.total_vitorias).toBe(1);
    expect(statsG2.total_derrotas).toBe(0);
    expect(statsG2.total_minutos_jogados).toBe(10);
    expect(statsG2.media_gols_sofridos_por_minuto).toBe(0.2);
  });

  test('GET /api/goleiro-stats/campeonato/:campeonato_id', async () => {
    const res = await request(app).get(`/api/goleiro-stats/campeonato/${camp1Id}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2); // Goleiro 1 e Goleiro 2

    const statsG1 = res.body.find((g) => g.jogador_id === goleiro1Id);
    const statsG2 = res.body.find((g) => g.jogador_id === goleiro2Id);

    // Goleiro 1 (Time A) ganhou por 1x0, sofreu 0 gols em 12 min
    expect(statsG1.total_jogos).toBe(1);
    expect(statsG1.total_gols_sofridos).toBe(0);
    expect(statsG1.total_vitorias).toBe(1);
    expect(statsG1.total_derrotas).toBe(0);
    expect(statsG1.total_minutos_jogados).toBe(12);
    expect(statsG1.media_gols_sofridos_por_minuto).toBe(0);

    // Goleiro 2 (Time B) perdeu por 1x0, sofreu 1 gol em 12 min
    expect(statsG2.total_jogos).toBe(1);
    expect(statsG2.total_gols_sofridos).toBe(1);
    expect(statsG2.total_vitorias).toBe(0);
    expect(statsG2.total_derrotas).toBe(1);
    expect(statsG2.total_minutos_jogados).toBe(12);
    expect(statsG2.media_gols_sofridos_por_minuto).toBeCloseTo(0.08); // 1/12
  });
});
