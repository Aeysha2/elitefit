import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

/**
 * Autorise la route aux rôles donnés (ou à tout utilisateur connecté si aucun rôle).
 * Non connecté → page de connexion, puis retour ici ; mauvais rôle → son propre espace.
 */
export function roleGuard(...roles: Role[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/connexion'], { queryParams: { redirect: state.url } });
    }
    if (roles.length && !auth.hasRole(...roles)) {
      return router.createUrlTree([auth.home()]);
    }
    return true;
  };
}

/** Pages de connexion / inscription : inutiles une fois connecté. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? inject(Router).createUrlTree([auth.home()]) : true;
};
