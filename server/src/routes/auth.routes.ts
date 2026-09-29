import { Router } from 'express';
import { body } from 'express-validator';
import { myBookings, mySubscriptions } from '../controllers/account.controller.js';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { formLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { emailField, nameField, passwordField, phoneField } from '../utils/validators.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  formLimiter(),
  nameField(),
  emailField(),
  phoneField(),
  passwordField(),
  validate,
  auth.register,
);

authRouter.post(
  '/login',
  formLimiter({ failedOnly: true }),
  emailField(),
  body('password').isString().notEmpty().withMessage('Mot de passe requis'),
  validate,
  auth.login,
);

/** Espace personnel, quel que soit le rôle. */
export const meRouter = Router();

meRouter.use(requireAuth);
meRouter.get('/', auth.me);
meRouter.patch('/', nameField().optional(), phoneField(), validate, auth.updateProfile);
meRouter.patch(
  '/password',
  body('currentPassword').isString().notEmpty().withMessage('Mot de passe actuel requis'),
  passwordField('newPassword'),
  validate,
  auth.changePassword,
);
meRouter.get('/bookings', myBookings);
meRouter.get('/subscriptions', mySubscriptions);
