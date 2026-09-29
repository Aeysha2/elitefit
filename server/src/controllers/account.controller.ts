import type { Request, Response } from 'express';
import { findBookingsForUser } from '../models/booking.model.js';
import { findSubscriptions } from '../models/subscription.model.js';
import { todayIso } from '../utils/dates.js';

/** Réservations du membre connecté. */
export async function myBookings(req: Request, res: Response) {
  res.json(await findBookingsForUser(req.user!.id, req.user!.email));
}

/** Abonnements du membre, avec l'abonnement en cours s'il y en a un. */
export async function mySubscriptions(req: Request, res: Response) {
  const list = await findSubscriptions(req.user!.id);
  const today = todayIso();
  const current = list.find((s) => s.startDate <= today && s.endDate >= today) ?? null;
  res.json({ current, history: list });
}
