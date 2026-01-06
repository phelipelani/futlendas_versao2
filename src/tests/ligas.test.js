// Arquivo: src/tests/ligas.test.js
import request from 'supertest';
import app from '../app.js';
import dbPromise from '../database/db.js';
import jwt from 'jsonwebtoken';

describe('Testes de Integração: /api/ligas', () => {
  let db;
  let adminToken;
  let ligaId;

  beforeAll(async () => {
    db = await dbPromise; // Reusa a instância

    // Limpa a tabela
    await db.exec('DELETE FROM ligas;');
    await db.exec("DELETE FROM sqlite_sequence WHERE name='ligas';");

    // Configura o JWT_SECRET (DEVE SER O MESMO DO SEU .env)
    process.env.JWT_SECRET = 'seu_jwt_secret_de_desenvolvimento';

    // Gera token de admin
    adminToken = jwt.sign({ user: 'admin_test', role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Cria uma liga inicial para testes de GET/PUT/DELETE
    const result = await db.run(
      'INSERT INTO ligas (nome, data_inicio, data_fim) VALUES (?, ?, ?)',
      ['Liga Base', '2025-01-01', '2025-12-31']
    );
    ligaId = result.lastID;
  });

  describe('POST /api/ligas', () => {
    test('deve criar uma nova liga com sucesso (como admin)', async () => {
      const res = await request(app)
        .post('/api/ligas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Nova Liga Teste', data_inicio: '2026-01-01', data_fim: '2026-12-31' });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Liga criada com sucesso!');
      expect(res.body.liga.nome).toBe('Nova Liga Teste');
    });

    test('deve falhar ao criar liga sem token de admin', async () => {
      const res = await request(app)
        .post('/api/ligas')
        // Sem token
        .send({ nome: 'Liga Sem Auth', data_inicio: '2026-01-01', data_fim: '2026-12-31' });

      expect(res.statusCode).toBe(401);
    });

    test('deve falhar ao criar liga com dados inválidos', async () => {
      const res = await request(app)
        .post('/api/ligas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: '', data_inicio: 'data-invalida', data_fim: '2026-12-31' }); // Nome vazio, data inválida

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Erro de validação.');
      expect(res.body.errors).toHaveLength(2); // Espera 2 erros (nome e data_inicio)
    });
  });

  describe('GET /api/ligas', () => {
    test('deve retornar todas as ligas', async () => {
      const res = await request(app).get('/api/ligas');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1); // Pelo menos a 'Liga Base'
      expect(res.body.some((liga) => liga.nome === 'Liga Base')).toBe(true);
    });
  });

  describe('GET /api/ligas/:id', () => {
    test('deve retornar uma liga específica pelo ID', async () => {
      const res = await request(app).get(`/api/ligas/${ligaId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(ligaId);
      expect(res.body.nome).toBe('Liga Base');
    });

    test('deve retornar 404 para um ID inexistente', async () => {
      const res = await request(app).get('/api/ligas/999');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Liga não encontrada.');
    });

    test('deve retornar 400 para um ID inválido', async () => {
      const res = await request(app).get('/api/ligas/abc'); // ID não numérico
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Erro de validação.');
    });
  });

  describe('PUT /api/ligas/:id', () => {
    test('deve atualizar uma liga com sucesso (como admin)', async () => {
      const res = await request(app)
        .put(`/api/ligas/${ligaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Liga Base Atualizada', data_fim: '2025-11-30' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Liga atualizada com sucesso.');

      // Verifica se realmente atualizou
      const updated = await db.get('SELECT * FROM ligas WHERE id = ?', [ligaId]);
      expect(updated.nome).toBe('Liga Base Atualizada');
      expect(updated.data_fim).toBe('2025-11-30');
    });

    test('deve falhar ao atualizar sem token de admin', async () => {
      const res = await request(app)
        .put(`/api/ligas/${ligaId}`)
        // Sem token
        .send({ nome: 'Update Sem Auth' });
      expect(res.statusCode).toBe(401);
    });

    test('deve falhar ao atualizar com dados inválidos', async () => {
      const res = await request(app)
        .put(`/api/ligas/${ligaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ data_inicio: 'data-errada' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Erro de validação.');
    });

    test('deve retornar 404 ao tentar atualizar liga inexistente', async () => {
      const res = await request(app)
        .put('/api/ligas/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Liga Inexistente' });
      expect(res.statusCode).toBe(404); // O model/middleware global pega isso
      expect(res.body.message).toBe('Liga não encontrada.');
    });
  });

  describe('DELETE /api/ligas/:id', () => {
    test('deve deletar uma liga com sucesso (como admin)', async () => {
      // Cria uma liga extra só para deletar
      const result = await db.run(
        'INSERT INTO ligas (nome, data_inicio, data_fim) VALUES (?, ?, ?)',
        ['Liga Para Deletar', '2027-01-01', '2027-12-31']
      );
      const idToDelete = result.lastID;

      const res = await request(app)
        .delete(`/api/ligas/${idToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Liga e todos os seus dados');

      // Verifica se realmente deletou
      const deleted = await db.get('SELECT * FROM ligas WHERE id = ?', [idToDelete]);
      expect(deleted).toBeUndefined();
    });

    test('deve falhar ao deletar sem token de admin', async () => {
      const res = await request(app).delete(`/api/ligas/${ligaId}`); // Usa a liga base
      expect(res.statusCode).toBe(401);
    });

    test('deve retornar 404 ao tentar deletar liga inexistente', async () => {
      const res = await request(app)
        .delete('/api/ligas/999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Liga não encontrada.');
    });
  });
});
