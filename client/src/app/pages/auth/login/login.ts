import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../../core/api-error';
import { AuthService, HOME_BY_ROLE } from '../../../core/auth.service';
import { safeRedirect } from '../redirect';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="section">
      <div class="container auth">
        <div class="card auth__card">
          <h1>Connexion</h1>
          <p class="lead">Membres, coachs et administrateurs.</p>
          <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field">
              <label for="l-email">E-mail</label>
              <input id="l-email" type="email" formControlName="email" autocomplete="username" />
            </div>
            <div class="field">
              <label for="l-password">Mot de passe</label>
              <input id="l-password" type="password" formControlName="password" autocomplete="current-password" />
            </div>
            @if (error(); as message) {
              <p class="alert alert--error" role="alert">{{ message }}</p>
            }
            <button class="btn" type="submit" [disabled]="form.invalid || submitting()">
              {{ submitting() ? 'Connexion…' : 'Se connecter' }}
            </button>
          </form>
          <p class="auth__switch">
            Pas encore de compte ?
            <a routerLink="/inscription" [queryParams]="redirect() ? { redirect: redirect() } : {}">Créer un compte</a>
          </p>
        </div>
      </div>
    </section>
  `,
  styleUrl: '../auth.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** ?redirect=/page-demandée */
  readonly redirect = input<string>();

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit() {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.auth.login(email.trim(), password).subscribe({
      next: ({ user }) =>
        this.router.navigateByUrl(safeRedirect(this.redirect()) ?? HOME_BY_ROLE[user.role]),
      error: (err) => {
        this.submitting.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
