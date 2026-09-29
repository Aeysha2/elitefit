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

/**
 * Date de fin d'un abonnement de n mois commençant à `iso` (dernier jour inclus).
 * 2026-03-15 + 1 mois → 2026-04-14 ; 2026-01-31 + 1 mois → 2026-02-27 (fin de mois ramenée au 28).
 */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return addDays(target.toISOString().slice(0, 10), -1);
}
