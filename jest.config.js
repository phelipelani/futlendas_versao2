// Arquivo: jest.config.js (Na raiz do projeto)

export default {
  // Define o ambiente de teste como Node.js
  testEnvironment: 'node',

  // Aponta para a pasta 'tests' DENTRO de 'src'
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/tests/**/*.test.js'], 

  // --- CORREÇÃO APLICADA AQUI ---
  // Caminho para o script que roda ANTES de TUDO
  globalSetup: '<rootDir>/src/tests/jest.globalSetup.js',
  
  // Caminho para o script que roda DEPOIS de TUDO
  globalTeardown: '<rootDir>/src/tests/jest.globalTeardown.js',
  
  // Não precisamos mais disso, a lógica foi movida
  // setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'], 
  // --- FIM DA CORREÇÃO ---

  // Tempo limite para testes assíncronos (útil para DB)
  testTimeout: 10000,
  
  // Garante que o Jest entenda ES Modules
  transform: {},
};