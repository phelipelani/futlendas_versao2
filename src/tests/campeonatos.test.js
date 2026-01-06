// Arquivo: src/tests/campeonatos.test.js
import request from 'supertest';
import app from '../app.js';
import dbPromise from '../database/db.js';
import jwt from 'jsonwebtoken';

describe('Testes de Integração: /api/campeonatos', () => {
  let db;
  let adminToken;
  let campId, time1Id, time2Id, jogador1Id;

  beforeAll(async () => {
    db = await dbPromise;

    // Limpeza profunda (dependências de campeonato)
    await db.exec('DELETE FROM campeonato_premios;');
    await db.exec('DELETE FROM campeonato_vencedores;');
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
    const c1 = await db.run('INSERT INTO campeonatos (nome, data, fase_atual) VALUES (?, ?, ?)', [
      'Camp Base',
      '2025-11-10',
      'inscricao',
    ]);
    campId = c1.lastID;
    const t1 = await db.run('INSERT INTO times (nome) VALUES (?)', ['Time Camp 1']);
    time1Id = t1.lastID;
    const t2 = await db.run('INSERT INTO times (nome) VALUES (?)', ['Time Camp 2']);
    time2Id = t2.lastID;
    const j1 = await db.run('INSERT INTO jogadores (nome) VALUES (?)', ['Jogador Camp 1']);
    jogador1Id = j1.lastID;

    // Inscreve time1 no camp base
    await db.run('INSERT INTO campeonato_times (campeonato_id, time_id) VALUES (?, ?)', [
      campId,
      time1Id,
    ]);
    // Associa jogador1 ao time1
    await db.run('INSERT INTO time_jogadores (time_id, jogador_id) VALUES (?, ?)', [
      time1Id,
      jogador1Id,
    ]);
  });

  describe('POST /api/campeonatos', () => {
    test('deve criar um novo campeonato (como admin)', async () => {
      const res = await request(app)
        .post('/api/campeonatos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Camp Novo', data: '2026-01-15' });

      expect(res.statusCode).toBe(201);
      expect(res.body.nome).toBe('Camp Novo');
      expect(res.body.fase_atual).toBe('inscricao');
    });

    test('deve falhar ao criar com nome duplicado', async () => {
      const res = await request(app)
        .post('/api/campeonatos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Camp Base', data: '2026-01-15' }); // Nome já existe
      expect(res.statusCode).toBe(409);
    });
  });

  describe('PUT /api/campeonatos/:campeonato_id', () => {
    test('deve atualizar detalhes do campeonato (como admin, fase=inscricao)', async () => {
      const res = await request(app)
        .put(`/api/campeonatos/${campId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Camp Base Editado', data: '2025-11-11' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Detalhes do campeonato atualizados com sucesso.');

      const updated = await db.get('SELECT nome, data FROM campeonatos WHERE id = ?', [campId]);
      expect(updated.nome).toBe('Camp Base Editado');
      expect(updated.data).toBe('2025-11-11');

      // Reverter nome para outros testes
      await db.run('UPDATE campeonatos SET nome = ? WHERE id = ?', ['Camp Base', campId]);
    });

    test('deve falhar ao atualizar se a fase não for inscricao', async () => {
      await db.run("UPDATE campeonatos SET fase_atual = 'finalizado' WHERE id = ?", [campId]);
      const res = await request(app)
        .put(`/api/campeonatos/${campId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Tentativa Edit Fase Finalizada' });
      expect(res.statusCode).toBe(400); // Ou 409 - depende do middleware global
      expect(res.body.message).toContain('fase de inscrição');
      await db.run("UPDATE campeonatos SET fase_atual = 'inscricao' WHERE id = ?", [campId]); // Reverte
    });
  });

  describe('PATCH /api/campeonatos/:campeonato_id/status', () => {
    test('deve atualizar o status do campeonato (como admin)', async () => {
      const res = await request(app)
        .patch(`/api/campeonatos/${campId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ formato: 'pontos_corridos_desafio', fase_atual: 'em_andamento' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Status do campeonato atualizado com sucesso.');

      const updated = await db.get('SELECT formato, fase_atual FROM campeonatos WHERE id = ?', [
        campId,
      ]);
      expect(updated.formato).toBe('pontos_corridos_desafio');
      expect(updated.fase_atual).toBe('em_andamento');

      // Reverte para outros testes
      await db.run("UPDATE campeonatos SET formato = NULL, fase_atual = 'inscricao' WHERE id = ?", [
        campId,
      ]);
    });
  });

  describe('POST /api/campeonatos/:campeonato_id/times', () => {
    test('deve registrar um time no campeonato (como admin)', async () => {
      const res = await request(app)
        .post(`/api/campeonatos/${campId}/times`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ time_id: time2Id }); // Registra time2

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Time registrado no campeonato com sucesso.');

      const timesNoCamp = await db.all(
        'SELECT time_id FROM campeonato_times WHERE campeonato_id = ?',
        [campId]
      );
      expect(timesNoCamp).toHaveLength(2); // Agora tem time1 e time2
    });

    test('deve falhar ao registrar time já registrado', async () => {
      const res = await request(app)
        .post(`/api/campeonatos/${campId}/times`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ time_id: time1Id }); // time1 já está registrado
      expect(res.statusCode).toBe(409);
    });
  });

  describe('GET /api/campeonatos/:campeonato_id/times', () => {
    test('deve listar os times de um campeonato', async () => {
      const res = await request(app).get(`/api/campeonatos/${campId}/times`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2); // time1 e time2
    });
  });

  describe('POST /api/campeonatos/:campeonato_id/vencedores', () => {
    test('deve adicionar vencedores ao campeonato (como admin)', async () => {
      await db.run("UPDATE campeonatos SET fase_atual = 'finalizado' WHERE id = ?", [campId]); // Precisa estar finalizado (lógica do app)
      const res = await request(app)
        .post(`/api/campeonatos/${campId}/vencedores`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ jogadores_ids: [jogador1Id] });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Vencedores adicionados com sucesso!');

      const vencedores = await db.all(
        'SELECT jogador_id FROM campeonato_vencedores WHERE campeonato_id = ?',
        [campId]
      );
      expect(vencedores).toHaveLength(1);
      expect(vencedores[0].jogador_id).toBe(jogador1Id);

      await db.run("UPDATE campeonatos SET fase_atual = 'inscricao' WHERE id = ?", [campId]); // Reverte
      await db.run('DELETE FROM campeonato_vencedores WHERE campeonato_id = ?', [campId]); // Limpa
    });
  });

  // Testes para /iniciar, /avancar-fase, /partidas, /estatisticas-jogadores, /premios
  // exigiriam setups mais complexos simulando um campeonato inteiro.
  // Deixaremos como TODO por enquanto.

  describe('DELETE /api/campeonatos/:campeonato_id', () => {
    test('deve deletar um campeonato (como admin)', async () => {
      const cTemp = await db.run('INSERT INTO campeonatos (nome, data) VALUES (?, ?)', [
        'Camp Para Deletar',
        '2027-01-01',
      ]);
      const idToDelete = cTemp.lastID;

      const res = await request(app)
        .delete(`/api/campeonatos/${idToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Campeonato e todos os seus dados');

      const deleted = await db.get('SELECT * FROM campeonatos WHERE id = ?', [idToDelete]);
      expect(deleted).toBeUndefined();
    });

    test('deve retornar 404 ao deletar ID inexistente', async () => {
      const res = await request(app)
        .delete('/api/campeonatos/999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
    });
  });
});
