import type { NextFunction, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUserById, type Role, type User } from '../models/user.model.js';
import { HttpError } from '../utils/httpError.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export function signToken(user: Pick<User, 'id' | 'role'>): string {
  return jwt.sign({ sub: String(user.id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });
}

/**
 * Lit le jeton et recharge le compte en base : un changement de rôle ou une
 * désactivation s'applique immédiatement, sans attendre l'expiration du jeton.
 */
async function userFromRequest(req: Request): Promise<User | null> {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
  } catch {
    throw new HttpError(401, 'UNAUTHORIZED', 'Session expirée ou invalide.');
  }
  const user = await findUserById(Number(payload.sub));
  if (!user || !user.isActive) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Compte introuvable ou désactivé.');
  }
  return user;
}

/** Exige un utilisateur connecté. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'Authentification requise.');
  req.user = user;
  next();
}

/** Attache l'utilisateur s'il est connecté, sans rien exiger. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    req.user = (await userFromRequest(req)) ?? undefined;
  } catch {
    req.user = undefined; // jeton expiré : on continue en visiteur
  }
  next();
}

/** Exige l'un des rôles donnés (à placer après requireAuth). */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'FORBIDDEN', 'Accès réservé.'));
    }
    next();
  };
}
