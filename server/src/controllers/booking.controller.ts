import type { Request, Response } from 'express';
import * as bookings from '../models/booking.model.js';
import { planExists, trainerExists } from '../models/content.model.js';
import { bookingMail, sendMail } from '../services/mailer.js';
import { bookingWindow, isoWeekday } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';

export async function availability(req: Request, res: Response) {
  const date = String(req.query.date);
  const { min, max } = bookingWindow();
  if (date < min || date > max) {
    throw new HttpError(400, 'DATE_OUT_OF_RANGE', `Choisissez une date entre le ${min} et le ${max}.`);
  }
  res.json({ date, slots: await bookings.findSlotsWithUsage(date, isoWeekday(date)) });
}

export async function createBooking(req: Request, res: Response) {
  const input: bookings.NewBooking = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    date: req.body.date,
    time: req.body.time,
    goal: req.body.goal,
    planId: req.body.planId ?? null,
    userId: req.user?.id ?? null,
  };

  const { min, max } = bookingWindow();
  if (input.date < min || input.date > max) {
    throw new HttpError(400, 'DATE_OUT_OF_RANGE', `Choisissez une date entre le ${min} et le ${max}.`);
  }
  if (input.planId !== null && !(await planExists(input.planId))) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Formule inconnue.', [
      { field: 'planId', message: 'Formule inconnue' },
    ]);
  }

  const slots = await bookings.findSlotsWithUsage(input.date, isoWeekday(input.date));
  const slot = slots.find((s) => s.time === input.time);
  if (!slot) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Créneau indisponible.', [
      { field: 'time', message: 'Ce créneau n\'existe pas' },
    ]);
  }
  if (slot.remaining === 0) {
    throw new HttpError(409, 'SLOT_FULL', 'Ce créneau est complet. Choisissez-en un autre.');
  }
  if (await bookings.hasActiveBooking(input.email)) {
    throw new HttpError(409, 'ALREADY_BOOKED', 'Un essai est déjà prévu avec cette adresse e-mail.');
  }

  const id = await bookings.insertBooking(input);
  void sendMail(bookingMail({ ...input, status: 'pending' }));
  res.status(201).json({ id, status: 'pending', date: input.date, time: input.time });
}

export async function listBookings(req: Request, res: Response) {
  res.json(
    await bookings.findBookings({
      status: req.query.status as bookings.BookingStatus | undefined,
      trainerId: req.query.trainerId ? Number(req.query.trainerId) : undefined,
    }),
  );
}

/** Admin : change le statut et/ou le coach attribué. */
export async function updateBooking(req: Request, res: Response) {
  const id = Number(req.params.id);
  const before = await bookings.findBookingById(id);
  if (!before) throw new HttpError(404, 'NOT_FOUND', 'Réservation introuvable.');

  if (req.body.trainerId !== undefined) {
    const trainerId = req.body.trainerId as number | null;
    if (trainerId !== null && !(await trainerExists(trainerId))) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Coach inconnu.', [
        { field: 'trainerId', message: 'Coach inconnu' },
      ]);
    }
    await bookings.assignTrainer(id, trainerId);
  }
  await applyStatus(id, before, req.body.status);
  res.json(await bookings.findBookingById(id));
}

/** Coach : ses essais attribués. */
export async function listCoachBookings(req: Request, res: Response) {
  const trainerId = req.user!.trainerId;
  if (trainerId === null) {
    res.json([]);
    return;
  }
  res.json(
    await bookings.findBookings({
      trainerId,
      status: req.query.status as bookings.BookingStatus | undefined,
    }),
  );
}

/** Coach : confirme ou annule un essai qui lui est attribué. */
export async function updateCoachBooking(req: Request, res: Response) {
  const id = Number(req.params.id);
  const booking = await bookings.findBookingById(id);
  if (!booking || req.user!.trainerId === null || booking.trainerId !== req.user!.trainerId) {
    throw new HttpError(404, 'NOT_FOUND', 'Réservation introuvable.');
  }
  await applyStatus(id, booking, req.body.status);
  res.json(await bookings.findBookingById(id));
}

async function applyStatus(id: number, before: bookings.Booking, status?: bookings.BookingStatus) {
  if (!status || status === before.status) return;
  await bookings.updateBookingStatus(id, status);
  void sendMail(bookingMail({ ...before, status }));
}
