import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/** Limite anti-spam propre à une route : 5 envois par tranche de 15 minutes et par adresse IP. */
export function formLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.isTest,
    handler: (_req, res) => {
      res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: 'Trop de tentatives. Réessayez dans quelques minutes.',
      });
    },
  });
}
