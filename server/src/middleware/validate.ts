import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { HttpError } from '../utils/httpError.js';

/** Transforme les erreurs de express-validator en réponse 400 au format commun. */
export function validate(req: Request, _res: Response, next: NextFunction) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({
    field: e.type === 'field' ? e.path : 'request',
    message: String(e.msg),
  }));
  next(new HttpError(400, 'VALIDATION_ERROR', 'Certains champs sont invalides.', details));
}
