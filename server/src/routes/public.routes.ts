import { Router } from 'express';
import { body, query } from 'express-validator';
import * as booking from '../controllers/booking.controller.js';
import * as content from '../controllers/content.controller.js';
import * as message from '../controllers/message.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { formLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

export const GOALS = ['weight_loss', 'muscle_gain', 'fitness', 'flexibility', 'other'];
const PHONE = /^\+?[0-9 ]{8,15}$/;

export const publicRouter = Router();

publicRouter.get('/plans', content.listPlans);
publicRouter.get('/trainers', content.listTrainers);
publicRouter.get('/programs', content.listPrograms);
publicRouter.get('/testimonials', content.listTestimonials);
publicRouter.get(
  '/gallery',
  query('category').optional().isIn(['interior', 'equipment', 'sessions', 'events']).withMessage('Catégorie inconnue'),
  validate,
  content.listGallery,
);

publicRouter.get(
  '/bookings/availability',
  query('date').isISO8601({ strict: true }).withMessage('Date invalide (AAAA-MM-JJ)'),
  validate,
  booking.availability,
);

publicRouter.post(
  '/bookings',
  formLimiter(),
  optionalAuth,
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Nom : 2 à 100 caractères'),
  body('email').trim().isEmail().withMessage('E-mail invalide').toLowerCase(),
  body('phone').trim().matches(PHONE).withMessage('Téléphone invalide'),
  body('date').isISO8601({ strict: true }).withMessage('Date invalide (AAAA-MM-JJ)'),
  body('time').matches(/^([01]\d|2[0-3]):00$/).withMessage('Heure invalide (HH:00)'),
  body('goal').isIn(GOALS).withMessage('Objectif inconnu'),
  body('planId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Formule invalide').toInt(),
  validate,
  booking.createBooking,
);

publicRouter.post(
  '/messages',
  formLimiter(),
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Nom : 2 à 100 caractères'),
  body('email').trim().isEmail().withMessage('E-mail invalide').toLowerCase(),
  body('phone').optional({ values: 'falsy' }).trim().matches(PHONE).withMessage('Téléphone invalide'),
  body('content').trim().isLength({ min: 10, max: 1000 }).withMessage('Message : 10 à 1 000 caractères'),
  validate,
  message.createMessage,
);
