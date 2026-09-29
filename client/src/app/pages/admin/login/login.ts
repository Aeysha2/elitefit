import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { apiErrorMessage } from '../../../core/api-error';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <section class="section">
      <div class="container login">
        <div class="card login__card">
          <h1>Administration</h1>
          <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field">
              <label for="a-email">E-mail</label>
              <input id="a-email" type="email" formControlName="email" autocomplete="username" />
            </div>
            <div class="field">
              <label for="a-password">Mot de passe</label>
              <input id="a-password" type="password" formControlName="password" autocomplete="current-password" />
            </div>
            @if (error(); as message) {
              <p class="alert alert--error" role="alert">{{ message }}</p>
            }
            <button class="btn" type="submit" [disabled]="form.invalid || submitting()">
              {{ submitting() ? 'Connexion…' : 'Se connecter' }}
            </button>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: `
    .login { display: flex; justify-content: center; }
    .login__card { width: 100%; max-width: 420px; padding: 32px; }
    h1 { font-size: 2.2rem; }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
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
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (err) => {
        this.submitting.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
