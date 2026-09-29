import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { signToken } from '../middleware/auth.js';
import * as users from '../models/user.model.js';
import { HttpError } from '../utils/httpError.js';

const BCRYPT_COST = 12;

export async function register(req: Request, res: Response) {
  const { fullName, email, phone, password } = req.body as Record<string, string>;
  if (await users.emailExists(email)) {
    throw new HttpError(409, 'EMAIL_TAKEN', 'Un compte existe déjà avec cet e-mail.');
  }
  const id = await users.insertUser({
    fullName,
    email,
    phone: phone || null,
    passwordHash: await bcrypt.hash(password, BCRYPT_COST),
    role: 'member',
    trainerId: null,
  });
  const user = (await users.findUserById(id))!;
  res.status(201).json({ token: signToken(user), user });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const credentials = await users.findCredentials(email);
  const valid = credentials ? await bcrypt.compare(password, credentials.passwordHash) : false;
  if (!credentials || !valid) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou mot de passe incorrect.');
  }
  if (!credentials.isActive) {
    throw new HttpError(403, 'ACCOUNT_DISABLED', 'Ce compte a été désactivé. Contactez la salle.');
  }
  const user = (await users.findUserById(credentials.id))!;
  res.json({ token: signToken(user), user });
}

export function me(req: Request, res: Response) {
  res.json(req.user);
}

export async function updateProfile(req: Request, res: Response) {
  await users.updateUser(req.user!.id, {
    fullName: req.body.fullName,
    phone: req.body.phone === undefined ? undefined : req.body.phone || null,
  });
  res.json(await users.findUserById(req.user!.id));
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body as Record<string, string>;
  const hash = await users.findPasswordHash(req.user!.id);
  if (!hash || !(await bcrypt.compare(currentPassword, hash))) {
    throw new HttpError(400, 'WRONG_PASSWORD', 'Mot de passe actuel incorrect.');
  }
  await users.updateUser(req.user!.id, { passwordHash: await bcrypt.hash(newPassword, BCRYPT_COST) });
  res.status(204).end();
}

export { BCRYPT_COST };
