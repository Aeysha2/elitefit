import { Component, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../../core/api-error';
import { AuthService } from '../../../core/auth.service';
import { PHONE_PATTERN } from '../../../core/validators';
import { safeRedirect } from '../redirect';

export const PASSWORD_MIN = 8;

export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="section">
      <div class="container auth">
        <div class="card auth__card">
          <h1>Créer un compte</h1>
          <p class="lead">Suivez vos réservations et votre abonnement EliteFit.</p>
          <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field">
              <label for="r-name">Nom complet</label>
              <input id="r-name" formControlName="fullName" autocomplete="name" />
              @if (invalid('fullName')) { <span class="field-error">Indiquez votre nom (2 caractères minimum).</span> }
            </div>
            <div class="field">
              <label for="r-email">E-mail</label>
              <input id="r-email" type="email" formControlName="email" autocomplete="email" />
              @if (invalid('email')) { <span class="field-error">Indiquez une adresse e-mail valide.</span> }
            </div>
            <div class="field">
              <label for="r-phone">Téléphone <small>(facultatif)</small></label>
              <input id="r-phone" type="tel" formControlName="phone" autocomplete="tel" />
              @if (invalid('phone')) { <span class="field-error">Numéro invalide (8 à 15 chiffres).</span> }
            </div>
            <div class="field">
              <label for="r-password">Mot de passe <small>({{ min }} caractères minimum)</small></label>
              <input id="r-password" type="password" formControlName="password" autocomplete="new-password" />
              @if (invalid('password')) { <span class="field-error">{{ min }} caractères minimum.</span> }
            </div>
            <div class="field">
              <label for="r-confirm">Confirmer le mot de passe</label>
              <input id="r-confirm" type="password" formControlName="confirm" autocomplete="new-password" />
              @if (form.hasError('mismatch') && form.controls.confirm.touched) {
                <span class="field-error">Les deux mots de passe ne correspondent pas.</span>
              }
            </div>
            @if (error(); as message) {
              <p class="alert alert--error" role="alert">{{ message }}</p>
            }
            <button class="btn" type="submit" [disabled]="submitting()">
              {{ submitting() ? 'Création…' : 'Créer mon compte' }}
            </button>
          </form>
          <p class="auth__switch">
            Déjà inscrit ?
            <a routerLink="/connexion" [queryParams]="redirect() ? { redirect: redirect() } : {}">Se connecter</a>
          </p>
        </div>
      </div>
    </section>
  `,
  styleUrl: '../auth.scss',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly redirect = input<string>();

  protected readonly min = PASSWORD_MIN;
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.pattern(PHONE_PATTERN)],
      password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  protected submit() {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { fullName, email, phone, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.auth.register({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), password }).subscribe({
      next: () => this.router.navigateByUrl(safeRedirect(this.redirect()) ?? '/mon-compte'),
      error: (err) => {
        this.submitting.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
