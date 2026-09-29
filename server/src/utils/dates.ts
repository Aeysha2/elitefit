import { env } from '../config/env.js';

/** Date du jour (AAAA-MM-JJ) dans le fuseau de la salle. */
export function todayIso(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: env.timezone }).format(now);
}

/** Ajoute des jours à une date AAAA-MM-JJ. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Jour de la semaine d'une date AAAA-MM-JJ : 1 = lundi ... 7 = dimanche. */
export function isoWeekday(iso: string): number {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Fenêtre de réservation d'un essai : de demain à J+30. */
export function bookingWindow(now = new Date()): { min: string; max: string } {
  const today = todayIso(now);
  return { min: addDays(today, 1), max: addDays(today, 30) };
}
