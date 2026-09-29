import { Router } from 'express';
import { body } from 'express-validator';
import { login } from '../controllers/auth.controller.js';
import { formLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  formLimiter(),
  body('email').trim().isEmail().withMessage('E-mail invalide').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Mot de passe requis'),
  validate,
  login,
);
