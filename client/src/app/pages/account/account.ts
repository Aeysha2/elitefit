import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { GOAL_LABELS, ROLE_LABELS, STATUS_LABELS } from '../../core/models';
import { loadable } from '../../core/resource';
import { PHONE_PATTERN } from '../../core/validators';
import { FcfaPipe } from '../../shared/fcfa.pipe';
import { formatDate } from '../../shared/format';
import { PASSWORD_MIN, passwordsMatch } from '../auth/register/register';

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, RouterLink, FcfaPipe],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);

  protected readonly bookings = loadable(this.api.myBookings());
  protected readonly subscriptions = loadable(this.api.mySubscriptions());
  protected readonly goals = GOAL_LABELS;
  protected readonly statuses = STATUS_LABELS;
  protected readonly roles = ROLE_LABELS;
  protected readonly formatDate = formatDate;
  protected readonly min = PASSWORD_MIN;

  protected readonly profileMessage = signal<{ ok: boolean; text: string } | null>(null);
  protected readonly passwordMessage = signal<{ ok: boolean; text: string } | null>(null);

  protected readonly profile = this.fb.nonNullable.group({
    fullName: [this.auth.user()?.fullName ?? '', [Validators.required, Validators.minLength(2)]],
    phone: [this.auth.user()?.phone ?? '', Validators.pattern(PHONE_PATTERN)],
  });

  protected readonly password = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected saveProfile() {
    if (this.profile.invalid) {
      this.profile.markAllAsTouched();
      return;
    }
    const { fullName, phone } = this.profile.getRawValue();
    this.api.updateProfile({ fullName: fullName.trim(), phone: phone.trim() }).subscribe({
      next: (user) => {
        this.auth.setUser(user);
        this.profile.markAsPristine();
        this.profileMessage.set({ ok: true, text: 'Profil enregistré.' });
      },
      error: (err) => this.profileMessage.set({ ok: false, text: apiErrorMessage(err) }),
    });
  }

  protected savePassword() {
    if (this.password.invalid) {
      this.password.markAllAsTouched();
      return;
    }
    const { currentPassword, password } = this.password.getRawValue();
    this.api.changePassword(currentPassword, password).subscribe({
      next: () => {
        this.password.reset();
        this.passwordMessage.set({ ok: true, text: 'Mot de passe modifié.' });
      },
      error: (err) => this.passwordMessage.set({ ok: false, text: apiErrorMessage(err) }),
    });
  }

  protected daysLeft(endDate: string): number {
    const end = new Date(`${endDate}T23:59:59`);
    return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000));
  }
}
