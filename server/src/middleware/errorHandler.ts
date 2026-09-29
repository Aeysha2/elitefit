import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError.js';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'NOT_FOUND', 'Ressource introuvable.'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }
  // Corps JSON mal formé
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'BAD_JSON', message: 'Corps de requête JSON invalide.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' });
}
