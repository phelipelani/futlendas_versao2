// Arquivo: src/models/jogadorModel.test.js
import * as JogadorModel from '../models/jogadorModel.js';
import dbPromise from '../database/db.js';

// O setup.js (do jest.config.js) já rodou e criou as tabelas

describe('Testes de Unidade: jogadorModel', () => {
  // Limpa a tabela de jogadores antes de CADA teste
  // Isso garante que um teste não interfira no outro
  beforeEach(async () => {
    const db = await dbPromise;
    await db.exec('DELETE FROM jogadores;');
    // Reseta o autoincremento (opcional, mas bom para SQLite)
    await db.exec("DELETE FROM sqlite_sequence WHERE name='jogadores';");
  });

  test('deve criar um novo jogador e encontrá-lo por ID', async () => {
    // 1. Ação (Action)
    const novoJogador = await JogadorModel.add('Lenda Testador', 'admin', 'goleiro');

    // 2. Verificação (Assert)
    expect(novoJogador).toBeDefined();
    expect(novoJogador.id).toBe(1);
    expect(novoJogador.nome).toBe('Lenda Testador');
    expect(novoJogador.posicao).toBe('goleiro');

    // 3. Ação 2
    const jogadorEncontrado = await JogadorModel.findById(novoJogador.id);

    // 4. Verificação 2
    expect(jogadorEncontrado).toBeDefined();
    expect(jogadorEncontrado.nome).toBe('Lenda Testador');
  });

  test('deve retornar null ao buscar jogador inexistente', async () => {
    const jogador = await JogadorModel.findById(999);
    expect(jogador).toBeNull();
  });

  test('deve atualizar os detalhes de um jogador', async () => {
    const jogador = await JogadorModel.add('Jogador Original', 'player', 'linha');
    const updateData = {
      nome: 'Jogador Atualizado',
      nivel: 5,
      posicao: 'goleiro',
      joga_recuado: 1,
    };

    await JogadorModel.updateDetails(jogador.id, updateData);

    const jogadorAtualizado = await JogadorModel.findById(jogador.id);

    expect(jogadorAtualizado.nome).toBe('Jogador Atualizado');
    expect(jogadorAtualizado.nivel).toBe(5);
    expect(jogadorAtualizado.posicao).toBe('goleiro');
    expect(jogadorAtualizado.joga_recuado).toBe(1);
  });

  test('deve deletar um jogador', async () => {
    const jogador = await JogadorModel.add('Jogador a Deletar', 'player', 'linha');
    expect(await JogadorModel.findById(jogador.id)).toBeDefined(); // Garante que existe

    await JogadorModel.deleteById(jogador.id);

    expect(await JogadorModel.findById(jogador.id)).toBeNull(); // Garante que foi deletado
  });

  test('deve listar todos os jogadores filtrando por posicao', async () => {
    await JogadorModel.add('Atacante 1', 'player', 'linha');
    await JogadorModel.add('Goleiro 1', 'player', 'goleiro');
    await JogadorModel.add('Atacante 2', 'player', 'linha');

    const todos = await JogadorModel.findAll();
    expect(todos.length).toBe(3);

    const linhas = await JogadorModel.findAll('linha');
    expect(linhas.length).toBe(2);
    expect(linhas[0].nome).toBe('Atacante 1');

    const goleiros = await JogadorModel.findAll('goleiro');
    expect(goleiros.length).toBe(1);
    expect(goleiros[0].nome).toBe('Goleiro 1');
  });
});
