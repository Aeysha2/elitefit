import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as booking from '../controllers/booking.controller.js';
import * as message from '../controllers/message.controller.js';
import * as user from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../models/user.model.js';
import { emailField, nameField, passwordField, phoneField } from '../utils/validators.js';

const STATUSES = ['pending', 'confirmed', 'cancelled'];
const idParam = param('id').isInt({ min: 1 }).toInt();
const trainerIdField = body('trainerId')
  .optional({ values: 'undefined' })
  .custom((v) => v === null || (Number.isInteger(v) && v > 0))
  .withMessage('Coach invalide');

/** Administration : réservé au rôle admin. */
export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get(
  '/bookings',
  query('status').optional().isIn(STATUSES).withMessage('Statut inconnu'),
  query('trainerId').optional().isInt({ min: 1 }),
  validate,
  booking.listBookings,
);
adminRouter.patch(
  '/bookings/:id',
  idParam,
  body('status').optional().isIn(STATUSES).withMessage('Statut inconnu'),
  trainerIdField,
  validate,
  booking.updateBooking,
);

adminRouter.get('/messages', message.listMessages);
adminRouter.patch(
  '/messages/:id',
  idParam,
  body('isRead').isBoolean({ strict: true }).withMessage('isRead doit être un booléen'),
  validate,
  message.updateMessage,
);

adminRouter.get('/trainers', user.listTrainerProfiles);
adminRouter.get(
  '/users',
  query('role').optional().isIn(ROLES).withMessage('Rôle inconnu'),
  query('search').optional().isString().isLength({ max: 100 }),
  validate,
  user.listUsers,
);
adminRouter.post(
  '/users',
  nameField(),
  emailField(),
  phoneField(),
  passwordField(),
  body('role').isIn(ROLES).withMessage('Rôle inconnu'),
  trainerIdField,
  validate,
  user.createUser,
);
adminRouter.patch(
  '/users/:id',
  idParam,
  nameField().optional(),
  phoneField(),
  body('role').optional().isIn(ROLES).withMessage('Rôle inconnu'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive doit être un booléen'),
  passwordField().optional(),
  trainerIdField,
  validate,
  user.updateUser,
);
adminRouter.get('/users/:id/subscriptions', idParam, validate, user.listUserSubscriptions);
adminRouter.post(
  '/users/:id/subscriptions',
  idParam,
  body('planId').isInt({ min: 1 }).withMessage('Formule invalide').toInt(),
  body('startDate').optional().isISO8601({ strict: true }).withMessage('Date invalide (AAAA-MM-JJ)'),
  validate,
  user.addSubscription,
);

/** Espace coach : ses essais attribués. */
export const coachRouter = Router();
coachRouter.use(requireAuth, requireRole('coach'));

coachRouter.get(
  '/bookings',
  query('status').optional().isIn(STATUSES).withMessage('Statut inconnu'),
  validate,
  booking.listCoachBookings,
);
coachRouter.patch(
  '/bookings/:id',
  idParam,
  body('status').isIn(['confirmed', 'cancelled']).withMessage('Statut : confirmed ou cancelled'),
  validate,
  booking.updateCoachBooking,
);
