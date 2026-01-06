// Arquivo: src/tests/campeonatoPartidas.test.js
import request from 'supertest';
import app from '../app.js';
import dbPromise from '../database/db.js';
import jwt from 'jsonwebtoken';

describe('Testes de Integração: /api/camp-partidas', () => {
  let db;
  let adminToken;
  let campId, time1Id, time2Id, jogador1Id, jogador2Id, goleiro1Id;
  let partidaId;

  beforeAll(async () => {
    db = await dbPromise;

    // Limpeza
    await db.exec('DELETE FROM campeonato_estatisticas_partida;');
    await db.exec('DELETE FROM campeonato_partidas;');
    await db.exec('DELETE FROM campeonato_times;');
    await db.exec('DELETE FROM time_jogadores;');
    await db.exec('DELETE FROM times;');
    await db.exec('DELETE FROM jogadores;');
    await db.exec('DELETE FROM campeonatos;');
    await db.exec(
      "DELETE FROM sqlite_sequence WHERE name IN ('campeonatos', 'times', 'jogadores', 'campeonato_partidas');"
    );

    process.env.JWT_SECRET = 'seu_jwt_secret_de_desenvolvimento';
    adminToken = jwt.sign({ user: 'admin_test', role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Dados base
    const c1 = await db.run(
      'INSERT INTO campeonatos (nome, data, formato, fase_atual) VALUES (?, ?, ?, ?)',
      ['Camp Partida Teste', '2025-11-10', 'pontos_corridos_desafio', 'em_andamento']
    );
    campId = c1.lastID;
    const t1 = await db.run('INSERT INTO times (nome) VALUES (?)', ['Time Partida 1']);
    time1Id = t1.lastID;
    const t2 = await db.run('INSERT INTO times (nome) VALUES (?)', ['Time Partida 2']);
    time2Id = t2.lastID;
    const j1 = await db.run('INSERT INTO jogadores (nome) VALUES (?)', ['Jogador Partida Camp 1']);
    jogador1Id = j1.lastID;
    const j2 = await db.run('INSERT INTO jogadores (nome) VALUES (?)', ['Jogador Partida Camp 2']);
    jogador2Id = j2.lastID;
    const g1 = await db.run('INSERT INTO jogadores (nome, posicao) VALUES (?, ?)', [
      'Goleiro Partida Camp 1',
      'goleiro',
    ]);
    goleiro1Id = g1.lastID;

    // Cria uma partida base
    const p1 = await db.run(
      'INSERT INTO campeonato_partidas (campeonato_id, fase, timeA_id, timeB_id, status) VALUES (?, ?, ?, ?, ?)',
      [campId, 'em_andamento', time1Id, time2Id, 'pendente']
    );
    partidaId = p1.lastID;

    // Associa jogadores aos times (necessário para estatísticas)
    await db.run('INSERT INTO time_jogadores (time_id, jogador_id) VALUES (?, ?), (?, ?)', [
      time1Id,
      jogador1Id,
      time2Id,
      jogador2Id,
    ]);
  });

  describe('PUT /api/camp-partidas/:partida_id/resultado', () => {
    test('deve salvar o resultado de uma partida de campeonato (como admin)', async () => {
      const payload = {
        placar_timeA: 3,
        placar_timeB: 2,
        duracao_segundos: 720,
        goleiro_timeA_id: goleiro1Id,
        estatisticasJogadores: [
          { jogador_id: jogador1Id, time_id: time1Id, gols: 2, assistencias: 1 },
          { jogador_id: jogador2Id, time_id: time2Id, gols: 2 },
        ],
      };

      const res = await request(app)
        .put(`/api/camp-partidas/${partidaId}/resultado`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Resultado da partida salvo com sucesso.');

      // Verifica partida
      const partida = await db.get('SELECT * FROM campeonato_partidas WHERE id = ?', [partidaId]);
      expect(partida.placar_timeA).toBe(3);
      expect(partida.placar_timeB).toBe(2);
      expect(partida.status).toBe('finalizada');
      expect(partida.goleiro_timeA_id).toBe(goleiro1Id);

      // Verifica estatísticas
      const stats = await db.all(
        'SELECT * FROM campeonato_estatisticas_partida WHERE partida_id = ?',
        [partidaId]
      );
      expect(stats).toHaveLength(2);
      const statJ1 = stats.find((s) => s.jogador_id === jogador1Id);
      expect(statJ1.gols).toBe(2);
      expect(statJ1.assistencias).toBe(1);
    });

    test('deve falhar ao salvar resultado sem placar', async () => {
      const payload = { estatisticasJogadores: [] }; // Sem placar
      const res = await request(app)
        .put(`/api/camp-partidas/${partidaId}/resultado`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/camp-partidas/campeonato/:campeonato_id', () => {
    test('deve listar as partidas de um campeonato', async () => {
      // Cria mais uma partida para garantir a lista
      await db.run(
        'INSERT INTO campeonato_partidas (campeonato_id, fase, timeA_id, timeB_id) VALUES (?, ?, ?, ?)',
        [campId, 'em_andamento', time2Id, time1Id]
      );

      const res = await request(app).get(`/api/camp-partidas/campeonato/${campId}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // As duas partidas criadas
      expect(res.body.every((p) => p.campeonato_id === campId)).toBe(true);
    });
  });
});
