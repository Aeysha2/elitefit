import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, Role, User } from './models';

const TOKEN_KEY = 'elitefit.token';
const USER_KEY = 'elitefit.user';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Stockage indisponible (navigation privée) : la session reste en mémoire.
  }
}

function tokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

/** Page d'accueil de chaque rôle après connexion. */
export const HOME_BY_ROLE: Record<Role, string> = {
  admin: '/admin',
  coach: '/coach',
  member: '/mon-compte',
};

/** Session de l'utilisateur : jeton JWT + profil, conservés dans le navigateur. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<User | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.userSignal() !== null);
  readonly role = computed(() => this.userSignal()?.role ?? null);
  readonly home = computed(() => (this.role() ? HOME_BY_ROLE[this.role()!] : '/connexion'));

  constructor() {
    const token = read(TOKEN_KEY);
    const user = read(USER_KEY);
    if (token && user && !tokenExpired(token)) {
      this.tokenSignal.set(token);
      try {
        this.userSignal.set(JSON.parse(user) as User);
      } catch {
        this.clear();
      }
      // Rafraîchit le profil (rôle ou nom modifiés entre-temps).
      this.api.me().subscribe({ next: (u) => this.setUser(u), error: () => undefined });
    } else {
      this.clear();
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api.login(email, password).pipe(tap((res) => this.start(res)));
  }

  register(data: { fullName: string; email: string; phone: string; password: string }) {
    return this.api.register(data).pipe(tap((res) => this.start(res)));
  }

  setUser(user: User) {
    this.userSignal.set(user);
    write(USER_KEY, JSON.stringify(user));
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.role();
    return role !== null && roles.includes(role);
  }

  logout(redirect = true) {
    this.clear();
    if (redirect) this.router.navigate(['/connexion']);
  }

  private start({ token, user }: AuthResponse) {
    this.tokenSignal.set(token);
    write(TOKEN_KEY, token);
    this.setUser(user);
  }

  private clear() {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    write(TOKEN_KEY, null);
    write(USER_KEY, null);
  }
}
