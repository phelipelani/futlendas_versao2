import { Router } from 'express';
import { login, register } from '../controllers/authController.js';
import {
  gerarConvite,
  validarConvite,
  ativarConta,
  gerarConviteAdmin,
  listarConvites,
} from '../controllers/conviteController.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = Router();

/* ----------------------------- Validações ----------------------------- */

const validateLogin = [
  body('username').notEmpty().withMessage('Username é obrigatório.'),
  body('password').notEmpty().withMessage('Password é obrigatório.'),
];

const validateRegister = [
  body('username').notEmpty().withMessage('Username é obrigatório.'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password deve ter pelo menos 6 caracteres.'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role inválido.'),
];

const validateGerarConvite = [
  body('jogador_id')
    .isInt({ min: 1 })
    .withMessage('jogador_id deve ser inteiro positivo.'),
  body('tipo_usuario')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('tipo_usuario inválido.'),
];

const validateAtivarConta = [
  body('token').notEmpty().withMessage('Token é obrigatório.'),
  body('username').notEmpty().withMessage('Username é obrigatório.'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password deve ter pelo menos 6 caracteres.'),
];

const validateGerarConviteAdmin = [
  body('email').isEmail().withMessage('Email inválido.'),
];

/* ------------------------------- Rotas ------------------------------- */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realizar login
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 */
router.post('/login', validateLogin, login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar novo usuário (Admin)
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 */
router.post('/register', isAdmin, validateRegister, register);

/**
 * @swagger
 * /auth/convites:
 *   get:
 *     summary: Listar convites (Admin)
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 */
router.get('/convites', isAdmin, listarConvites);

/**
 * @swagger
 * /auth/convite/gerar:
 *   post:
 *     summary: Gerar convite para jogador (Admin)
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 */
router.post('/convite/gerar', isAdmin, validateGerarConvite, gerarConvite);

/**
 * @swagger
 * /auth/convite/admin:
 *   post:
 *     summary: Gerar convite para novo admin (Admin)
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 */
router.post('/convite/admin', isAdmin, validateGerarConviteAdmin, gerarConviteAdmin);

/**
 * @swagger
 * /auth/convite/validar/{token}:
 *   get:
 *     summary: Validar token de convite
 *     tags: [Convites]
 */
router.get('/convite/validar/:token', validarConvite);

/**
 * @swagger
 * /auth/convite/ativar:
 *   post:
 *     summary: Ativar conta via convite
 *     tags: [Convites]
 */
router.post('/convite/ativar', validateAtivarConta, ativarConta);

export default router;
