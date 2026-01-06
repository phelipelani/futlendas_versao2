// src/app.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';

// Import das rotas
import authRoutes from './routes/authRoutes.js';

import jogadorRoutes from './routes/jogadorRoutes.js';
import timeRoutes from './routes/timeRoutes.js';
import ligaRoutes from './routes/ligaRoutes.js';
import rodadaRoutes from './routes/rodadaRoutes.js';
import partidaRoutes from './routes/partidaRoutes.js';
import campeonatoRoutes from './routes/campeonatoRoutes.js';
import campeonatoPartidaRoutes from './routes/campeonatoPartidaRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import goleiroStatsRoutes from './routes/goleiroStatsRoutes.js';
import uploadAvatarRoutes from './routes/uploadAvatarRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler } from './utils/errors.js';
import { getHallDaFama } from './controllers/hallDaFamaController.js';

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Carregar o OpenAPI JSON
try {
  const swaggerDocument = JSON.parse(
    fs.readFileSync(path.resolve('src/swagger/openapi.json'), 'utf8')
  );
  // Rota da documentação
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  console.warn("⚠️ Arquivo Swagger não encontrado ou inválido. A documentação não será carregada.");
}

// ==================================================================
// ROTAS PRINCIPAIS (Todas prefixadas com /api para padronização)
// ==================================================================

app.use('/auth', authRoutes);
app.use('/jogadores', jogadorRoutes);
app.use('/times', timeRoutes);
app.use('/ligas', ligaRoutes);
app.use('/rodadas', rodadaRoutes);

// Unificamos as partidas aqui.
// O arquivo partidaRoutes.js agora gerencia listagem global, edição e delete.
app.use('/partidas', partidaRoutes); 

app.use('/campeonatos', campeonatoRoutes);
app.use('/campeonato-partidas', campeonatoPartidaRoutes);
app.use('/stats', statsRoutes);
app.use('/goleiro-stats', goleiroStatsRoutes);
app.use('/upload-avatar', uploadAvatarRoutes);
app.use('/upload', uploadRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/analytics', getHallDaFama);

// Analytics (O arquivo de rotas já define /analytics/..., então montamos na raiz /api)
// Resultado final: /api/analytics/panoramica, /api/analytics/jogador/:id
// app.use('', analyticsRoutes); 

// Middleware final de erro
app.use(errorHandler);

// Página raiz opcional (Health Check)
app.get('/', (req, res) => {
  res.send({
    status: 'ok',
    message: 'API FutLendas está no ar!',
    docs: '/api-docs',
    version: '1.0.0'
  });
});

export default app;