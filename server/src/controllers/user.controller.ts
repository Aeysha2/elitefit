import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { findAllTrainers, findPlanById, trainerExists } from '../models/content.model.js';
import { findSubscriptions, insertSubscription } from '../models/subscription.model.js';
import * as users from '../models/user.model.js';
import { addMonths, todayIso } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { BCRYPT_COST } from './auth.controller.js';

async function checkTrainer(trainerId: number | null | undefined) {
  if (trainerId != null && !(await trainerExists(trainerId))) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Coach inconnu.', [
      { field: 'trainerId', message: 'Coach inconnu' },
    ]);
  }
}

export async function listUsers(req: Request, res: Response) {
  res.json(
    await users.findUsers({
      role: req.query.role as users.Role | undefined,
      search: typeof req.query.search === 'string' ? req.query.search.trim() : undefined,
    }),
  );
}

export async function listTrainerProfiles(_req: Request, res: Response) {
  res.json(await findAllTrainers());
}

export async function createUser(req: Request, res: Response) {
  const { fullName, email, phone, password, role } = req.body as Record<string, string>;
  const trainerId = req.body.trainerId ?? null;
  if (await users.emailExists(email)) {
    throw new HttpError(409, 'EMAIL_TAKEN', 'Un compte existe déjà avec cet e-mail.');
  }
  await checkTrainer(trainerId);
  const id = await users.insertUser({
    fullName,
    email,
    phone: phone || null,
    passwordHash: await bcrypt.hash(password, BCRYPT_COST),
    role: role as users.Role,
    trainerId: role === 'coach' ? trainerId : null,
  });
  res.status(201).json(await users.findUserById(id));
}

export async function updateUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const target = await users.findUserById(id);
  if (!target) throw new HttpError(404, 'NOT_FOUND', 'Compte introuvable.');

  const role = req.body.role as users.Role | undefined;
  const isActive = req.body.isActive as boolean | undefined;
  const losesAdmin =
    target.role === 'admin' && target.isActive && ((role && role !== 'admin') || isActive === false);

  // Un admin ne peut pas se retirer ses propres droits (risque de se bloquer dehors).
  if (id === req.user!.id && losesAdmin) {
    throw new HttpError(400, 'SELF_LOCKOUT', 'Vous ne pouvez pas retirer vos propres droits d\'administrateur.');
  }
  if (losesAdmin && (await users.countActiveAdmins()) <= 1) {
    throw new HttpError(400, 'LAST_ADMIN', 'Il doit rester au moins un administrateur actif.');
  }

  const trainerId = req.body.trainerId as number | null | undefined;
  await checkTrainer(trainerId);
  const finalRole = role ?? target.role;

  await users.updateUser(id, {
    fullName: req.body.fullName,
    phone: req.body.phone === undefined ? undefined : req.body.phone || null,
    role,
    isActive,
    // La fiche coach n'a de sens que pour le rôle coach.
    trainerId: finalRole === 'coach' ? trainerId : role ? null : undefined,
    passwordHash: req.body.password ? await bcrypt.hash(req.body.password, BCRYPT_COST) : undefined,
  });
  res.json(await users.findUserById(id));
}

export async function listUserSubscriptions(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!(await users.findUserById(id))) throw new HttpError(404, 'NOT_FOUND', 'Compte introuvable.');
  res.json(await findSubscriptions(id));
}

export async function addSubscription(req: Request, res: Response) {
  const id = Number(req.params.id);
  const user = await users.findUserById(id);
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'Compte introuvable.');
  const plan = await findPlanById(req.body.planId);
  if (!plan) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Formule inconnue.', [
      { field: 'planId', message: 'Formule inconnue' },
    ]);
  }
  const startDate: string = req.body.startDate ?? todayIso();
  const subscriptionId = await insertSubscription({
    userId: id,
    planId: plan.id,
    planName: plan.name,
    amountFcfa: plan.priceFcfa,
    startDate,
    endDate: addMonths(startDate, plan.durationMonths),
  });
  const list = await findSubscriptions(id);
  res.status(201).json(list.find((s) => s.id === subscriptionId));
}
