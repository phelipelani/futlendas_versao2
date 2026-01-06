// Arquivo: src/tests/partidas.test.js
import request from 'supertest';
import app from '../app.js';
import dbPromise from '../database/db.js';
import jwt from 'jsonwebtoken';

describe('Testes de Integração: /api/partidas', () => {
  let db;
  let adminToken;
  let jogador1, jogador2, goleiro1;
  let liga1;
  let rodada1;
  let partida1;

  beforeAll(async () => {
    db = await dbPromise;

    process.env.JWT_SECRET = 'seu_jwt_secret_de_desenvolvimento';
    adminToken = jwt.sign({ user: 'admin_test', role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Limpeza e Dados Base
    await db.exec('DELETE FROM resultados;');
    await db.exec('DELETE FROM partidas;');
    await db.exec('DELETE FROM rodadas;');
    await db.exec('DELETE FROM ligas;');
    await db.exec('DELETE FROM jogadores;');
    await db.exec(
      "DELETE FROM sqlite_sequence WHERE name IN ('ligas', 'jogadores', 'rodadas', 'partidas');"
    );

    const j1 = await db.run('INSERT INTO jogadores (nome, posicao) VALUES (?, ?)', [
      'Jogador Partida 1',
      'linha',
    ]);
    jogador1 = { id: j1.lastID };
    const j2 = await db.run('INSERT INTO jogadores (nome, posicao) VALUES (?, ?)', [
      'Jogador Partida 2',
      'linha',
    ]);
    jogador2 = { id: j2.lastID };
    const g1 = await db.run('INSERT INTO jogadores (nome, posicao) VALUES (?, ?)', [
      'Goleiro Partida 1',
      'goleiro',
    ]);
    goleiro1 = { id: g1.lastID };
    const l1 = await db.run('INSERT INTO ligas (nome, data_inicio, data_fim) VALUES (?, ?, ?)', [
      'Liga Partida Teste',
      '2025-01-01',
      '2025-12-31',
    ]);
    liga1 = { id: l1.lastID };
    const r1 = await db.run('INSERT INTO rodadas (liga_id, data) VALUES (?, ?)', [
      liga1.id,
      '2025-10-25',
    ]);
    rodada1 = { id: r1.lastID };
    const p1 = await db.run('INSERT INTO partidas (rodada_id, data) VALUES (?, ?)', [
      rodada1.id,
      '2025-10-25',
    ]);
    partida1 = { id: p1.lastID };
  });

  describe('PUT /api/partidas/:partida_id/resultados', () => {
    test('deve salvar os resultados de uma partida (como admin)', async () => {
      const payload = {
        placar1: 2,
        placar2: 1,
        duracao: 600, // 10 minutos
        time1_numero: 1,
        time2_numero: 2,
        goleiro_time1_id: goleiro1.id, // Goleiro no time 1
        goleiro_time2_id: null,
        time1: [{ id: jogador1.id, gols: 1, assistencias: 1 }],
        time2: [{ id: jogador2.id, gols: 1 }],
      };

      const res = await request(app)
        .put(`/api/partidas/${partida1.id}/resultados`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Resultados da partida salvos com sucesso.');

      // Verifica se a partida foi atualizada
      const partidaAtualizada = await db.get('SELECT * FROM partidas WHERE id = ?', [partida1.id]);
      expect(partidaAtualizada.placar_time1).toBe(2);
      expect(partidaAtualizada.placar_time2).toBe(1);
      expect(partidaAtualizada.duracao_segundos).toBe(600);
      expect(partidaAtualizada.goleiro_time1_id).toBe(goleiro1.id);

      // Verifica se os resultados foram inseridos
      const resultados = await db.all('SELECT * FROM resultados WHERE partida_id = ?', [
        partida1.id,
      ]);
      expect(resultados).toHaveLength(2);
      const resJ1 = resultados.find((r) => r.jogador_id === jogador1.id);
      const resJ2 = resultados.find((r) => r.jogador_id === jogador2.id);
      expect(resJ1.gols).toBe(1);
      expect(resJ1.assistencias).toBe(1);
      expect(resJ1.vitorias).toBe(1); // Time 1 venceu
      expect(resJ1.sem_sofrer_gols).toBe(0); // Time 1 sofreu gol
      expect(resJ2.gols).toBe(1);
      expect(resJ2.derrotas).toBe(1); // Time 2 perdeu
      expect(resJ2.sem_sofrer_gols).toBe(0); // Time 2 sofreu gol
    });

    test('deve falhar ao salvar resultados sem times', async () => {
      const payload = { placar1: 1, placar2: 0 }; // Faltando time1 e time2
      const res = await request(app)
        .put(`/api/partidas/${partida1.id}/resultados`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/partidas/:partida_id/golcontra', () => {
    beforeEach(async () => {
      // Reseta o placar e resultados antes de cada teste de gol contra
      await db.run('UPDATE partidas SET placar_time1 = 0, placar_time2 = 0 WHERE id = ?', [
        partida1.id,
      ]);
      await db.run('DELETE FROM resultados WHERE partida_id = ?', [partida1.id]);
      // Insere um resultado base para o jogador 1 (time 1)
      await db.run('INSERT INTO resultados (partida_id, jogador_id, time) VALUES (?, ?, ?)', [
        partida1.id,
        jogador1.id,
        'Time 1',
      ]);
    });

    test('deve registrar um gol contra (como admin)', async () => {
      const res = await request(app)
        .post(`/api/partidas/${partida1.id}/golcontra`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ jogadorId: jogador1.id, timeMarcouPonto: 2 }); // Jogador 1 (time 1) fez gol contra, ponto pro time 2

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Gol contra registrado com sucesso.');

      // Verifica se placar foi atualizado
      const partida = await db.get('SELECT placar_time1, placar_time2 FROM partidas WHERE id = ?', [
        partida1.id,
      ]);
      expect(partida.placar_time1).toBe(0);
      expect(partida.placar_time2).toBe(1); // Ponto pro time 2

      // Verifica se o resultado do jogador foi atualizado
      const resultado = await db.get(
        'SELECT gols_contra FROM resultados WHERE partida_id = ? AND jogador_id = ?',
        [partida1.id, jogador1.id]
      );
      expect(resultado.gols_contra).toBe(1);
    });

    test('deve falhar ao registrar gol contra sem jogadorId', async () => {
      const res = await request(app)
        .post(`/api/partidas/${partida1.id}/golcontra`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ timeMarcouPonto: 1 });
      expect(res.statusCode).toBe(400);
    });
  });
});
