import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from './api.service';

const TOKEN_KEY = 'elitefit.admin.token';

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Session administrateur : le JWT vit dans sessionStorage et disparaît avec l'onglet. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly tokenSignal = signal<string | null>(readToken());

  readonly token = this.tokenSignal.asReadonly();
  readonly isLoggedIn = computed(() => {
    const token = this.tokenSignal();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload.exp !== 'number' || payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  });

  login(email: string, password: string) {
    return this.api.login(email, password).pipe(tap(({ token }) => this.store(token)));
  }

  logout() {
    this.store(null);
    this.router.navigate(['/admin/login']);
  }

  private store(token: string | null) {
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Stockage indisponible (navigation privée) : la session reste en mémoire.
    }
    this.tokenSignal.set(token);
  }
}
