// Arquivo: swagger.js (Na raiz do projeto)
import swaggerJsDoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FutLendas API',
      version: '1.0.0',
      description: 'Documentação completa da API backend para o aplicativo FutLendas - Gestão de Futebol Amador',
      contact: {
        name: 'Phelipe (Phe)',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desenvolvimento Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através da rota /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensagem de erro',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Detalhes dos erros de validação (quando aplicável)',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Caminho para os arquivos de rotas
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export default swaggerDocs;