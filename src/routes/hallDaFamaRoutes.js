// Arquivo: src/routes/hallDaFamaRoutes.js
import { Router } from 'express';
import * as HallDaFamaController from '../controllers/hallDaFamaController.js';

const router = Router();

// GET /api/hall-da-fama
router.get('/', HallDaFamaController.getHallDaFama);

export default router;