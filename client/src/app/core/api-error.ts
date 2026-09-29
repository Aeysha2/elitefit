import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './models';

/** Message lisible à partir d'une erreur HTTP de l'API. */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Le serveur est injoignable. Vérifiez votre connexion et réessayez.';
    const body = err.error as ApiError | null;
    if (body?.details?.length) return body.details.map((d) => d.message).join(' · ');
    if (body?.message) return body.message;
  }
  return 'Une erreur est survenue. Réessayez dans un instant.';
}
