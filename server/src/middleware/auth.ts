import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export interface AdminClaims {
  sub: string;
  email: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    admin?: AdminClaims;
  }
}

/** Exige un JWT administrateur valide dans l'en-tête Authorization. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'UNAUTHORIZED', 'Authentification requise.'));
  }
  try {
    req.admin = jwt.verify(token, env.jwtSecret) as AdminClaims;
    next();
  } catch {
    next(new HttpError(401, 'UNAUTHORIZED', 'Session expirée ou invalide.'));
  }
}
