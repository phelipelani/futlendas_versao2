// Arquivo: server.js (Na raiz do projeto)
import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// O 'app' importado de 'src/app.js' já vem com a rota '/api-docs' configurada.

// Escuta em 0.0.0.0 para ser acessível na sua rede local
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}` );
  // <<< CORREÇÃO: Adicionando log para mostrar o IP da rede
  // (Substitua [SEU_IP_LOCAL_ATUAL] pelo seu IP real para facilitar)
  console.log(`✅ Rede local em http://[SEU_IP_LOCAL_ATUAL]:${PORT}` );
  console.log(`📚 Documentação disponível em: http://localhost:${PORT}/api-docs` );
  console.log(`📚 Doc. (Rede) disponível em: http://[SEU_IP_LOCAL_ATUAL]:${PORT}/api-docs` );
});