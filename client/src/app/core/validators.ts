import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Date locale du jour décalée de n jours, au format AAAA-MM-JJ. */
export function isoDateFromToday(days: number, now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Date comprise entre J+minDays et J+maxDays (comparaison de chaînes AAAA-MM-JJ). */
export function dateInRange(minDays: number, maxDays: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;
    const min = isoDateFromToday(minDays);
    const max = isoDateFromToday(maxDays);
    return value < min || value > max ? { dateRange: { min, max } } : null;
  };
}

export const PHONE_PATTERN = /^\+?[0-9 ]{8,15}$/;
