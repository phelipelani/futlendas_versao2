// Arquivo: src/tests/jogadores.test.js
import request from 'supertest';
import app from '../app.js';
import dbPromise from '../database/db.js';
import jwt from 'jsonwebtoken';

describe('Testes de Integração: /api/jogadores', () => {
  let db;
  let adminToken;
  let jogadorId;

  beforeAll(async () => {
    db = await dbPromise;

    await db.exec('DELETE FROM jogadores;');
    await db.exec("DELETE FROM sqlite_sequence WHERE name='jogadores';");

    process.env.JWT_SECRET = 'seu_jwt_secret_de_desenvolvimento';
    adminToken = jwt.sign({ user: 'admin_test', role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const result = await db.run(
      'INSERT INTO jogadores (nome, role, posicao, joga_recuado, nivel) VALUES (?, ?, ?, ?, ?)',
      ['Jogador Base', 'player', 'linha', 0, 1]
    );
    jogadorId = result.lastID;
  });

  describe('POST /api/jogadores', () => {
    test('deve criar um novo jogador (como admin)', async () => {
      const res = await request(app)
        .post('/api/jogadores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Novo Craque', posicao: 'goleiro' });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Jogador adicionado com sucesso!');
      expect(res.body.jogador.nome).toBe('Novo Craque');
      expect(res.body.jogador.posicao).toBe('goleiro');
    });

    test('deve falhar ao criar jogador sem nome', async () => {
      const res = await request(app)
        .post('/api/jogadores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ posicao: 'linha' }); // Sem nome
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Erro de validação.');
    });

    test('deve falhar ao criar jogador com nome duplicado', async () => {
      const res = await request(app)
        .post('/api/jogadores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Jogador Base' }); // Já existe
      expect(res.statusCode).toBe(409); // Conflito
    });

    test('deve falhar ao criar jogador sem token', async () => {
      const res = await request(app)
        .post('/api/jogadores')
        // Sem token
        .send({ nome: 'Jogador Sem Auth' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/jogadores', () => {
    test('deve retornar todos os jogadores', async () => {
      const res = await request(app).get('/api/jogadores');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    test('deve filtrar jogadores por posição', async () => {
      await request(app)
        .post('/api/jogadores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Goleiro Filtro', posicao: 'goleiro' });
      const res = await request(app).get('/api/jogadores?posicao=goleiro');
      expect(res.statusCode).toBe(200);
      expect(res.body.every((j) => j.posicao === 'goleiro')).toBe(true);
    });

    test('deve filtrar jogadores por nível', async () => {
      await request(app)
        .post('/api/jogadores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Nivel 5', nivel: 5 });
      const res = await request(app).get('/api/jogadores?nivel=5');
      expect(res.statusCode).toBe(200);
      expect(res.body.every((j) => j.nivel === 5)).toBe(true);
    });
  });

  describe('GET /api/jogadores/:id', () => {
    test('deve retornar um jogador pelo ID', async () => {
      const res = await request(app).get(`/api/jogadores/${jogadorId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(jogadorId);
      expect(res.body.nome).toBe('Jogador Base');
    });

    test('deve retornar 404 para ID inexistente', async () => {
      const res = await request(app).get('/api/jogadores/999');
      expect(res.statusCode).toBe(404);
    });

    test('deve retornar 400 para ID inválido', async () => {
      const res = await request(app).get('/api/jogadores/xyz');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/jogadores/:id/details', () => {
    test('deve atualizar detalhes do jogador (como admin)', async () => {
      const res = await request(app)
        .put(`/api/jogadores/${jogadorId}/details`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Jogador Base Editado', nivel: 3, joga_recuado: 1 });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Jogador atualizado com sucesso.');

      const updated = await db.get('SELECT * FROM jogadores WHERE id = ?', [jogadorId]);
      expect(updated.nome).toBe('Jogador Base Editado');
      expect(updated.nivel).toBe(3);
      expect(updated.joga_recuado).toBe(1);
    });

    test('deve falhar ao atualizar com dados inválidos', async () => {
      const res = await request(app)
        .put(`/api/jogadores/${jogadorId}/details`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nivel: -5 }); // Nível inválido
      expect(res.statusCode).toBe(400);
    });

    test('deve falhar ao atualizar sem token', async () => {
      const res = await request(app)
        .put(`/api/jogadores/${jogadorId}/details`)
        // Sem token
        .send({ nome: 'Update Sem Auth' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/jogadores/:id', () => {
    test('deve deletar um jogador (como admin)', async () => {
      const result = await db.run('INSERT INTO jogadores (nome) VALUES (?)', [
        'Jogador Para Deletar',
      ]);
      const idToDelete = result.lastID;

      const res = await request(app)
        .delete(`/api/jogadores/${idToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Jogador deletado');

      const deleted = await db.get('SELECT * FROM jogadores WHERE id = ?', [idToDelete]);
      expect(deleted).toBeUndefined();
    });

    test('deve falhar ao deletar sem token', async () => {
      const res = await request(app).delete(`/api/jogadores/${jogadorId}`);
      expect(res.statusCode).toBe(401);
    });

    test('deve retornar 404 ao deletar ID inexistente', async () => {
      const res = await request(app)
        .delete('/api/jogadores/999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
    });
  });
});
