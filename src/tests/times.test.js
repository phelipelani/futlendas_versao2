// Arquivo: src/tests/times.test.js
import request from 'supertest';
import app from '../app.js';
import dbPromise from '../database/db.js';
import jwt from 'jsonwebtoken';

describe('Testes de Integração: /api/times', () => {
  let db;
  let adminToken;
  let timeId;
  let jogador1, jogador2;

  beforeAll(async () => {
    db = await dbPromise;

    await db.exec('DELETE FROM time_jogadores;');
    await db.exec('DELETE FROM times;');
    await db.exec('DELETE FROM jogadores;'); // Dependência
    await db.exec("DELETE FROM sqlite_sequence WHERE name IN ('times', 'jogadores');");

    process.env.JWT_SECRET = 'seu_jwt_secret_de_desenvolvimento';
    adminToken = jwt.sign({ user: 'admin_test', role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const t1 = await db.run('INSERT INTO times (nome) VALUES (?)', ['Time Base']);
    timeId = t1.lastID;
    const j1 = await db.run('INSERT INTO jogadores (nome) VALUES (?)', ['Jogador Time 1']);
    jogador1 = { id: j1.lastID };
    const j2 = await db.run('INSERT INTO jogadores (nome) VALUES (?)', ['Jogador Time 2']);
    jogador2 = { id: j2.lastID };

    // Adiciona jogador1 ao time base
    await db.run('INSERT INTO time_jogadores (time_id, jogador_id) VALUES (?, ?)', [
      timeId,
      jogador1.id,
    ]);
  });

  describe('POST /api/times', () => {
    test('deve criar um novo time (como admin)', async () => {
      const res = await request(app)
        .post('/api/times')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Time Novo Teste', logo_url: 'http://logo.url' });

      expect(res.statusCode).toBe(201);
      expect(res.body.nome).toBe('Time Novo Teste');
      expect(res.body.logo_url).toBe('http://logo.url');
    });

    test('deve falhar ao criar time com nome duplicado', async () => {
      const res = await request(app)
        .post('/api/times')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Time Base' }); // Já existe
      expect(res.statusCode).toBe(409);
    });
  });

  describe('GET /api/times', () => {
    test('deve retornar todos os times', async () => {
      const res = await request(app).get('/api/times');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/times/:id', () => {
    test('deve retornar um time pelo ID', async () => {
      const res = await request(app).get(`/api/times/${timeId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(timeId);
    });

    test('deve retornar 404 para ID inexistente', async () => {
      const res = await request(app).get('/api/times/999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/times/:id', () => {
    test('deve atualizar um time (como admin)', async () => {
      const res = await request(app)
        .put(`/api/times/${timeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Time Base Editado', logo_url: null });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Time atualizado com sucesso.');

      const updated = await db.get('SELECT nome, logo_url FROM times WHERE id = ?', [timeId]);
      expect(updated.nome).toBe('Time Base Editado');
      expect(updated.logo_url).toBeNull();
    });

    test('deve falhar ao atualizar com nome duplicado', async () => {
      const tTemp = await db.run('INSERT INTO times (nome) VALUES (?)', ['Nome Duplicado']);
      const res = await request(app)
        .put(`/api/times/${timeId}`) // Tenta colocar nome duplicado no time base
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Nome Duplicado' });
      expect(res.statusCode).toBe(409);
      await db.run('DELETE FROM times WHERE id = ?', [tTemp.lastID]); // Limpa
    });
  });

  describe('POST /api/times/:id/jogadores', () => {
    test('deve adicionar jogadores a um time (como admin)', async () => {
      const res = await request(app)
        .post(`/api/times/${timeId}/jogadores`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ jogador_ids: [jogador2.id] }); // Adiciona jogador2

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Jogadores adicionados ao time com sucesso.');

      const jogadoresDoTime = await db.all(
        'SELECT jogador_id FROM time_jogadores WHERE time_id = ?',
        [timeId]
      );
      expect(jogadoresDoTime).toHaveLength(2); // Agora tem jogador1 e jogador2
      expect(jogadoresDoTime.map((j) => j.jogador_id).sort()).toEqual(
        [jogador1.id, jogador2.id].sort()
      );
    });
  });

  describe('GET /api/times/:id/jogadores', () => {
    test('deve listar os jogadores de um time', async () => {
      const res = await request(app).get(`/api/times/${timeId}/jogadores`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Espera jogador1 e jogador2 (adicionado no teste anterior)
      expect(res.body).toHaveLength(2);
    });
  });

  describe('DELETE /api/times/:id/jogadores/:jogador_id', () => {
    test('deve remover um jogador de um time (como admin)', async () => {
      const res = await request(app)
        .delete(`/api/times/${timeId}/jogadores/${jogador2.id}`) // Remove jogador2
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Jogador removido do time.');

      const jogadoresDoTime = await db.all(
        'SELECT jogador_id FROM time_jogadores WHERE time_id = ?',
        [timeId]
      );
      expect(jogadoresDoTime).toHaveLength(1); // Sobrou só o jogador1
      expect(jogadoresDoTime[0].jogador_id).toBe(jogador1.id);
    });
  });
});
