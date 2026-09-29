import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findAdminByEmail } from '../models/admin.model.js';
import { HttpError } from '../utils/httpError.js';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const admin = await findAdminByEmail(email);
  const valid = admin ? await bcrypt.compare(password, admin.passwordHash) : false;
  if (!admin || !valid) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou mot de passe incorrect.');
  }
  const token = jwt.sign({ sub: String(admin.id), email: admin.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });
  res.json({ token, email: admin.email });
}
