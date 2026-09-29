import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Limite anti-spam propre à une route : 5 envois par tranche de 15 minutes et par adresse IP.
 * Avec `failedOnly`, seules les tentatives refusées comptent (connexion : un réseau partagé,
 * comme le Wi-Fi de l'accueil, n'est pas bloqué par les connexions réussies).
 */
export function formLimiter({ failedOnly = false } = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: failedOnly,
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
