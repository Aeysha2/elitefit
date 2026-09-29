import type { Request, Response } from 'express';
import * as bookings from '../models/booking.model.js';
import { planExists } from '../models/content.model.js';
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
  const status = req.query.status as bookings.BookingStatus | undefined;
  res.json(await bookings.findBookings(status));
}

export async function changeBookingStatus(req: Request, res: Response) {
  const id = Number(req.params.id);
  const status = req.body.status as bookings.BookingStatus;
  if (!(await bookings.updateBookingStatus(id, status))) {
    throw new HttpError(404, 'NOT_FOUND', 'Réservation introuvable.');
  }
  const booking = await bookings.findBookingById(id);
  if (booking) void sendMail(bookingMail(booking));
  res.json(booking);
}
