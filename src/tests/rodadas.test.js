// Arquivo: src/tests/rodadas.test.js
import request from 'supertest';
import app from '../app.js';
import dbPromise from '../database/db.js';
import jwt from 'jsonwebtoken';
import * as RodadaModel from '../models/rodadaModel.js'; // Para finalizar

describe('Testes de Integração: /api/rodadas', () => {
  let db;
  let adminToken;
  let jogador1, jogador2, jogador3;
  let liga1;
  let rodada1, rodada2;

  beforeAll(async () => {
    db = await dbPromise;
    process.env.JWT_SECRET = 'seu_jwt_secret_de_desenvolvimento';
    adminToken = jwt.sign({ user: 'admin_test', role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Limpeza inicial
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

    // Dados base
    const j1 = await db.run('INSERT INTO jogadores (nome) VALUES (?)', ['Jogador Rodada 1']);
    jogador1 = { id: j1.lastID };
    const j2 = await db.run('INSERT INTO jogadores (nome) VALUES (?)', ['Jogador Rodada 2']);
    jogador2 = { id: j2.lastID };
    const j3 = await db.run('INSERT INTO jogadores (nome) VALUES (?)', ['Jogador Rodada 3']);
    jogador3 = { id: j3.lastID };
    const l1 = await db.run('INSERT INTO ligas (nome, data_inicio, data_fim) VALUES (?, ?, ?)', [
      'Liga Rodada Teste',
      '2025-01-01',
      '2025-12-31',
    ]);
    liga1 = { id: l1.lastID };
    const r1 = await db.run('INSERT INTO rodadas (liga_id, data, status) VALUES (?, ?, ?)', [
      liga1.id,
      '2025-10-25',
      'aberta',
    ]);
    rodada1 = { id: r1.lastID };
    const r2 = await db.run('INSERT INTO rodadas (liga_id, data, status) VALUES (?, ?, ?)', [
      liga1.id,
      '2025-11-01',
      'aberta',
    ]);
    rodada2 = { id: r2.lastID };

    // Adiciona jogadores à rodada1 para outros testes
    await db.run('INSERT INTO rodada_jogadores (rodada_id, jogador_id) VALUES (?, ?), (?, ?)', [
      rodada1.id,
      jogador1.id,
      rodada1.id,
      jogador2.id,
    ]);
  });

  beforeEach(async () => {
    // Limpeza antes de cada teste POST/PUT/DELETE
    await db.exec('DELETE FROM premios_rodada;');
    await db.exec('DELETE FROM resultados;');
    await db.exec('DELETE FROM partidas;');
    await db.exec('DELETE FROM rodada_times;');
    // Reseta status da rodada1 se foi finalizada
    await db.run('UPDATE rodadas SET status = "aberta" WHERE id = ?', [rodada1.id]);
  });

  describe('POST /api/rodadas/liga/:liga_id', () => {
    test('deve criar uma nova rodada (como admin)', async () => {
      const res = await request(app)
        .post(`/api/rodadas/liga/${liga1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ data: '2025-12-01' });

      expect(res.statusCode).toBe(201);
      // --- CORREÇÃO APLICADA AQUI ---
      expect(Number(res.body.liga_id)).toBe(liga1.id); // Compara números
      // --- FIM DA CORREÇÃO ---
      expect(res.body.data).toBe('2025-12-01');
      expect(res.body.status).toBe('aberta');
    });

    test('deve falhar ao criar rodada em data duplicada', async () => {
      const res = await request(app)
        .post(`/api/rodadas/liga/${liga1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ data: '2025-10-25' }); // Já existe
      expect(res.statusCode).toBe(409); // Middleware agora retorna 409
      expect(res.body.message).toContain('Já existe uma rodada');
    });

    test('deve falhar ao criar rodada com data inválida', async () => {
      const res = await request(app)
        .post(`/api/rodadas/liga/${liga1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ data: 'data errada' });
      expect(res.statusCode).toBe(400); // Validação da rota
    });
  });

  describe('GET /api/rodadas/liga/:liga_id', () => {
    test('deve listar as rodadas de uma liga', async () => {
      // Cria uma extra para garantir a contagem
      await request(app)
        .post(`/api/rodadas/liga/${liga1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ data: '2025-12-05' });

      const res = await request(app).get(`/api/rodadas/liga/${liga1.id}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3); // rodada1, rodada2 + as criadas nos testes
      expect(res.body.every((r) => r.liga_id === liga1.id)).toBe(true);
    });
  });

  describe('POST /api/rodadas/:rodada_id/sync-jogadores', () => {
    test('deve sincronizar jogadores, criando novos (como admin)', async () => {
      await db.run('DELETE FROM rodada_jogadores WHERE rodada_id = ?', [rodada2.id]); // Limpa antes
      const res = await request(app)
        .post(`/api/rodadas/${rodada2.id}/sync-jogadores`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nomes: ['Jogador Rodada 2', 'Novo Syncado'] }); // 1 existente, 1 novo

      expect(res.statusCode).toBe(200);
      expect(res.body.existentes).toBe(1);
      expect(res.body.novos).toBe(1);
      expect(res.body.jogadores).toHaveLength(2);

      const jogadoresNaRodada = await db.all(
        'SELECT jogador_id FROM rodada_jogadores WHERE rodada_id = ?',
        [rodada2.id]
      );
      expect(jogadoresNaRodada).toHaveLength(2);
    });

    test('deve falhar sync sem lista de nomes', async () => {
      const res = await request(app)
        .post(`/api/rodadas/${rodada2.id}/sync-jogadores`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nomes: [] }); // Lista vazia
      expect(res.statusCode).toBe(400); // Validação da rota
    });
  });

  describe('GET /api/rodadas/:rodada_id/jogadores', () => {
    test('deve listar os jogadores de uma rodada', async () => {
      const res = await request(app).get(`/api/rodadas/${rodada1.id}/jogadores`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2); // Do beforeAll
      expect(res.body.map((j) => j.id).sort()).toEqual([jogador1.id, jogador2.id].sort());
    });
  });

  describe('POST /api/rodadas/:rodada_id/times', () => {
    test('deve salvar os times com nomes e jogadores válidos (Status 200)', async () => {
      const payload = {
        times: [
          { nome: 'Time Amarelo', jogadores: [{ id: jogador1.id }] },
          { nome: 'Time Preto', jogadores: [{ id: jogador2.id }] },
        ],
      };
      const res = await request(app)
        .post(`/api/rodadas/${rodada1.id}/times`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Times guardados com sucesso!');
      const timeSalvo = await db.get(
        'SELECT nome_time FROM rodada_times WHERE rodada_id = ? AND jogador_id = ?',
        [rodada1.id, jogador1.id]
      );
      expect(timeSalvo.nome_time).toBe('Time Amarelo');
    });

    test('DEVE FALHAR: salvar times com um jogador_id inválido (Status 409)', async () => {
      const payload = {
        times: [{ nome: 'Time Azul', jogadores: [{ id: jogador1.id }, { id: 999 }] }],
      };
      const res = await request(app)
        .post(`/api/rodadas/${rodada1.id}/times`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe('Conflito: Violação de chave estrangeira.');
      expect(res.body.error).toContain('FOREIGN KEY constraint failed');
    });

    test('DEVE FALHAR: salvar times com rodada_id inválido (Status 404)', async () => {
      const payload = { times: [{ nome: 'Time Rosa', jogadores: [{ id: jogador1.id }] }] };
      const res = await request(app)
        .post('/api/rodadas/999/times')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Rodada com ID 999 não encontrada.');
    });

    test('deve falhar ao salvar times sem token (Status 401)', async () => {
      const payload = { times: [{ nome: 'Time A', jogadores: [{ id: jogador1.id }] }] };
      const res = await request(app).post(`/api/rodadas/${rodada1.id}/times`).send(payload);
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Acesso negado. Nenhum token fornecido.');
    });

    test('deve falhar ao salvar times com payload inválido (Status 400)', async () => {
      const payload = { outra_coisa: 'invalida' };
      const res = await request(app)
        .post(`/api/rodadas/${rodada1.id}/times`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Erro de validação.');
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].msg).toBe('A lista de times é obrigatória.');
    });
  });

  describe('GET /api/rodadas/:rodada_id/times', () => {
    test('deve listar os times sorteados com nome', async () => {
      await request(app)
        .post(`/api/rodadas/${rodada1.id}/times`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          times: [
            { nome: 'Time Laranja', jogadores: [jogador1] },
            { nome: 'Time Verde', jogadores: [jogador2] },
          ],
        });

      const res = await request(app).get(`/api/rodadas/${rodada1.id}/times`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.find((j) => j.id === jogador1.id).nome_time).toBe('Time Laranja');
      expect(res.body.find((j) => j.id === jogador2.id).nome_time).toBe('Time Verde');
    });
  });

  describe('POST /api/rodadas/:rodada_id/partidas', () => {
    test('deve criar uma nova partida na rodada (como admin)', async () => {
      const res = await request(app)
        .post(`/api/rodadas/${rodada1.id}/partidas`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(Number(res.body.rodada_id)).toBe(rodada1.id); // Compara números
    });
  });

  describe('PUT /api/rodadas/:rodada_id', () => {
    test('deve atualizar a data da rodada (como admin)', async () => {
      const res = await request(app)
        .put(`/api/rodadas/${rodada2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ data: '2025-11-05' });
      expect(res.statusCode).toBe(200);
      const updated = await db.get('SELECT data FROM rodadas WHERE id = ?', [rodada2.id]);
      expect(updated.data).toBe('2025-11-05');
    });
    test('deve falhar ao atualizar rodada finalizada', async () => {
      await db.run('UPDATE rodadas SET status = "finalizada" WHERE id = ?', [rodada1.id]);
      const res = await request(app)
        .put(`/api/rodadas/${rodada1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ data: '2025-10-26' });
      // --- CORREÇÃO APLICADA AQUI ---
      expect(res.statusCode).toBe(400); // Espera 400 que o Model agora joga
      // --- FIM DA CORREÇÃO ---
      expect(res.body.message).toContain('rodada finalizada');
    });
  });

  describe('DELETE /api/rodadas/:rodada_id', () => {
    test('deve deletar uma rodada (como admin)', async () => {
      const rTemp = await db.run('INSERT INTO rodadas (liga_id, data) VALUES (?, ?)', [
        liga1.id,
        '2025-12-31',
      ]);
      const idToDelete = rTemp.lastID;
      const res = await request(app)
        .delete(`/api/rodadas/${idToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      const deleted = await db.get('SELECT * FROM rodadas WHERE id = ?', [idToDelete]);
      expect(deleted).toBeUndefined();
    });
    test('deve retornar 404 ao deletar ID inexistente', async () => {
      const res = await request(app)
        .delete('/api/rodadas/999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/rodadas/:rodada_id/resultados', () => {
    test('deve retornar os resultados completos com nome do time', async () => {
      await request(app)
        .post(`/api/rodadas/${rodada1.id}/times`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          times: [
            { nome: 'Vencedores', jogadores: [jogador1] },
            { nome: 'Perdedores', jogadores: [jogador2] },
          ],
        });

      const pRes = await request(app)
        .post(`/api/rodadas/${rodada1.id}/partidas`)
        .set('Authorization', `Bearer ${adminToken}`);
      const partidaId = pRes.body.id;
      await request(app)
        .put(`/api/partidas/${partidaId}/resultados`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          placar1: 1,
          placar2: 0,
          time1_numero: 1,
          time2_numero: 2,
          time1: [{ id: jogador1.id, gols: 1 }],
          time2: [{ id: jogador2.id }],
        });

      const res = await request(app).get(`/api/rodadas/${rodada1.id}/resultados`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);

      const resJ1 = res.body.find((r) => r.id === jogador1.id);
      const resJ2 = res.body.find((r) => r.id === jogador2.id);

      expect(resJ1.time).toBe('Vencedores');
      expect(resJ2.time).toBe('Perdedores');
      expect(resJ1.total_pontos).toBeGreaterThan(0);
      expect(resJ2.total_pontos).toBeLessThan(0);
    });
  });
});
