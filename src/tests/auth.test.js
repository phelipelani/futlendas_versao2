// Arquivo: src/tests/auth.test.js
import request from 'supertest';
import app from '../app.js';
import dbPromise from '../database/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Testes de Integração: /api/auth', () => {
  let db;
  const testPassword = 'password123';
  let adminToken;

  beforeAll(async () => {
    db = await dbPromise; // Usa a instância do globalSetup

    // Limpa a tabela de usuários
    await db.exec('DELETE FROM usuarios;');
    await db.exec("DELETE FROM sqlite_sequence WHERE name='usuarios';");

    // Cria um usuário admin para testes
    const password_hash = await bcrypt.hash(testPassword, 10);
    await db.run('INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)', [
      'admin_user',
      password_hash,
      'admin',
    ]);

    // Cria um usuário comum para testes
    const user_password_hash = await bcrypt.hash(testPassword, 10);
    await db.run('INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)', [
      'common_user',
      user_password_hash,
      'user',
    ]);

    // Configura o JWT_SECRET (DEVE SER O MESMO DO SEU .env)
    process.env.JWT_SECRET = 'seu_jwt_secret_de_desenvolvimento';

    // Gera um token de admin para usar nos testes de registro
    adminToken = jwt.sign({ user: 'admin_test', role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
  });

  describe('POST /api/auth/login', () => {
    test('deve logar com sucesso com credenciais válidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin_user', password: testPassword });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login bem-sucedido!');
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe('admin_user');
      expect(res.body.user.role).toBe('admin');
    });

    test('deve falhar ao logar com senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin_user', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Credenciais inválidas.');
    });

    test('deve falhar ao logar com username inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: testPassword });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Credenciais inválidas.');
    });

    test('deve falhar ao logar sem enviar username ou password', async () => {
      const res = await request(app).post('/api/auth/login').send({ username: 'admin_user' }); // Faltando password

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Erro de validação.');
      expect(res.body.errors[0].msg).toBe('Password é obrigatório.');
    });
  });

  describe('POST /api/auth/register', () => {
    test('deve registrar um novo usuário com sucesso (como admin)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`) // Precisa ser admin
        .send({ username: 'new_user', password: 'newpassword123', role: 'user' });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Usuário registrado com sucesso!');
      expect(res.body.username).toBe('new_user');
      expect(res.body.role).toBe('user');
    });

    test('deve registrar um novo admin com sucesso (como admin)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'new_admin', password: 'newpassword123', role: 'admin' });

      expect(res.statusCode).toBe(201);
      expect(res.body.username).toBe('new_admin');
      expect(res.body.role).toBe('admin');
    });

    test('deve falhar ao registrar com username já existente', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'common_user', password: 'newpassword123' }); // common_user já existe

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe('Este username já está em uso.');
    });

    test('deve falhar ao registrar sem token de admin', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        // Sem .set('Authorization', ...)
        .send({ username: 'another_user', password: 'newpassword123' });

      expect(res.statusCode).toBe(401); // Ou 403 dependendo do middleware
      expect(res.body.message).toContain('Acesso negado.');
    });

    test('deve falhar ao registrar com senha curta', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'shortpass_user', password: '123', role: 'user' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Erro de validação.');
      expect(res.body.errors[0].msg).toBe('Password deve ter pelo menos 6 caracteres.');
    });
  });
});
