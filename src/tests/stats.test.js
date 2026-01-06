// Arquivo: src/tests/stats.test.js
import request from 'supertest';
import app from '../app.js';
import dbPromise from '../database/db.js';
import * as RodadaModel from '../models/rodadaModel.js'; // Para usar o finalizar

describe('Testes de Integração: /api/estatisticas', () => {
  let db;
  let liga1Id, rodada1Id, partida1Id;
  let jogador1Id, jogador2Id;

  beforeAll(async () => {
    db = await dbPromise;

    // Limpeza
    await db.exec('DELETE FROM premios_rodada;');
    await db.exec('DELETE FROM resultados;');
    await db.exec('DELETE FROM partidas;');
    await db.exec('DELETE FROM rodada_times;');
    await db.exec('DELETE FROM rodada_jogadores;');
    await db.exec('DELETE FROM rodadas;');
    await db.exec('DELETE FROM ligas;');
    await db.exec('DELETE FROM jogadores;');
    await db.exec(
      "DELETE FROM sqlite_sequence WHERE name IN ('ligas', 'jogadores', 'rodadas', 'partidas');"
    );

    // Dados base complexos para gerar estatísticas
    const j1 = await db.run('INSERT INTO jogadores (nome, joga_recuado) VALUES (?, ?)', [
      'Artilheiro Stats',
      0,
    ]);
    jogador1Id = j1.lastID;
    const j2 = await db.run('INSERT INTO jogadores (nome, joga_recuado) VALUES (?, ?)', [
      'Assistente Stats',
      0,
    ]);
    jogador2Id = j2.lastID;
    const l1 = await db.run('INSERT INTO ligas (nome, data_inicio, data_fim) VALUES (?, ?, ?)', [
      'Liga Stats Teste',
      '2025-01-01',
      '2025-12-31',
    ]);
    liga1Id = l1.lastID;
    const r1 = await db.run('INSERT INTO rodadas (liga_id, data) VALUES (?, ?)', [
      liga1Id,
      '2025-10-25',
    ]);
    rodada1Id = r1.lastID;

    // Adiciona jogadores à rodada
    await db.run('INSERT INTO rodada_jogadores (rodada_id, jogador_id) VALUES (?, ?), (?, ?)', [
      rodada1Id,
      jogador1Id,
      rodada1Id,
      jogador2Id,
    ]);

    // Cria uma partida
    const p1 = await db.run('INSERT INTO partidas (rodada_id, data) VALUES (?, ?)', [
      rodada1Id,
      '2025-10-25',
    ]);
    partida1Id = p1.lastID;

    // Atualiza o resultado da partida
    await db.run(
      `UPDATE partidas SET placar_time1 = 3, placar_time2 = 1, duracao_segundos = 600, 
                       time1_numero = 1, time2_numero = 2 WHERE id = ?`,
      [partida1Id]
    );

    // Insere resultados detalhados
    // Jogador 1 (Time 1): 2 Gols, 1 Assist, Vitoria
    await db.run(
      `INSERT INTO resultados 
                      (partida_id, jogador_id, time, gols, assistencias, vitorias, derrotas, empates) 
                      VALUES (?, ?, 'Time 1', 2, 1, 1, 0, 0)`,
      [partida1Id, jogador1Id]
    );
    // Jogador 2 (Time 2): 1 Gol, Derrota
    await db.run(
      `INSERT INTO resultados 
                      (partida_id, jogador_id, time, gols, assistencias, vitorias, derrotas, empates) 
                      VALUES (?, ?, 'Time 2', 1, 0, 0, 1, 0)`,
      [partida1Id, jogador2Id]
    );

    // Finaliza a rodada para gerar prêmios
    await RodadaModel.finalizar(rodada1Id);
  });

  test('GET /api/estatisticas (Ranking Geral)', async () => {
    const res = await request(app).get(`/api/estatisticas?liga_id=${liga1Id}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);

    // Jogador 1 deve ter mais pontos (2G, 1A, 1V)
    const jogador1Stats = res.body.find((j) => j.jogador_id === jogador1Id);
    const jogador2Stats = res.body.find((j) => j.jogador_id === jogador2Id);
    expect(jogador1Stats.total_pontos).toBeGreaterThan(jogador2Stats.total_pontos);
    expect(jogador1Stats.gols).toBe(2);
    expect(jogador1Stats.assistencias).toBe(1);
    expect(jogador1Stats.vitorias).toBe(1);
    expect(jogador1Stats.mvp_count).toBe(1); // Foi o MVP
    expect(jogador1Stats.artilheiro_rodada_count).toBe(1); // Foi o artilheiro
    expect(jogador1Stats.assist_rodada_count).toBe(1); // Foi o líder de assist

    expect(jogador2Stats.gols).toBe(1);
    expect(jogador2Stats.derrotas).toBe(1);
    expect(jogador2Stats.pe_de_rato_count).toBe(1); // Foi o pé de rato
  });

  test('GET /api/estatisticas/artilharia', async () => {
    const res = await request(app).get(`/api/estatisticas/artilharia?liga_id=${liga1Id}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].jogador_id).toBe(jogador1Id); // Jogador 1 é o artilheiro
    expect(res.body[0].total_gols).toBe(2);
  });

  test('GET /api/estatisticas/assistencias', async () => {
    const res = await request(app).get(`/api/estatisticas/assistencias?liga_id=${liga1Id}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1); // Só jogador 1 deu assistência
    expect(res.body[0].jogador_id).toBe(jogador1Id);
    expect(res.body[0].total_assistencias).toBe(1);
  });

  test('GET /api/estatisticas/premios', async () => {
    const res = await request(app).get(`/api/estatisticas/premios?liga_id=${liga1Id}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2); // Jogador 1 ganhou 3 prêmios, Jogador 2 ganhou 1

    const jogador1Premios = res.body.find((j) => j.jogador_id === jogador1Id);
    expect(jogador1Premios.mvp).toBe(1);
    expect(jogador1Premios.artilheiro_rodada).toBe(1);
    expect(jogador1Premios.assist_rodada).toBe(1);

    const jogador2Premios = res.body.find((j) => j.jogador_id === jogador2Id);
    expect(jogador2Premios.pe_de_rato).toBe(1);
  });

  test('GET /api/estatisticas/dashboard', async () => {
    const res = await request(app).get(`/api/estatisticas/dashboard?liga_id=${liga1Id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.totalJogadores).toBe(2);
    expect(res.body.totalGols).toBe(3); // 2 de J1 + 1 de J2
    expect(res.body.artilheiro.nome).toBe('Artilheiro Stats');
    expect(res.body.artilheiro.total).toBe(2);
    expect(res.body.liderAssistencias.nome).toBe('Artilheiro Stats');
    expect(res.body.liderAssistencias.total).toBe(1);
    expect(res.body.reiDoMvp.nome).toBe('Artilheiro Stats');
    expect(res.body.reiDoMvp.total).toBe(1);
  });
});
