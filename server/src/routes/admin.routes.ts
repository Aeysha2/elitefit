import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as booking from '../controllers/booking.controller.js';
import * as message from '../controllers/message.controller.js';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const STATUSES = ['pending', 'confirmed', 'cancelled'];

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get(
  '/bookings',
  query('status').optional().isIn(STATUSES).withMessage('Statut inconnu'),
  validate,
  booking.listBookings,
);
adminRouter.patch(
  '/bookings/:id',
  param('id').isInt({ min: 1 }),
  body('status').isIn(['confirmed', 'cancelled']).withMessage('Statut : confirmed ou cancelled'),
  validate,
  booking.changeBookingStatus,
);
adminRouter.get('/messages', message.listMessages);
adminRouter.patch(
  '/messages/:id',
  param('id').isInt({ min: 1 }),
  body('isRead').isBoolean({ strict: true }).withMessage('isRead doit être un booléen'),
  validate,
  message.updateMessage,
);
