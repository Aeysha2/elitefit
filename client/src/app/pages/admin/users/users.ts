import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiErrorMessage } from '../../../core/api-error';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import {
  Plan,
  Role,
  ROLE_LABELS,
  Subscription,
  TrainerOption,
  User,
  UserChanges,
} from '../../../core/models';
import { isoDateFromToday, PHONE_PATTERN } from '../../../core/validators';
import { FcfaPipe } from '../../../shared/fcfa.pipe';
import { formatDate } from '../../../shared/format';
import { PASSWORD_MIN } from '../../auth/register/register';

/** Onglet « Comptes » de l'administration. */
@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule, FormsModule, FcfaPipe],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class AdminUsers {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);

  readonly trainers = input.required<TrainerOption[]>();
  readonly plans = input.required<Plan[]>();

  protected readonly roles = ROLE_LABELS;
  protected readonly roleKeys = Object.keys(ROLE_LABELS) as Role[];
  protected readonly formatDate = formatDate;
  protected readonly min = PASSWORD_MIN;

  protected readonly users = signal<User[]>([]);
  protected readonly roleFilter = signal<Role | ''>('');
  protected readonly search = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly showCreate = signal(false);

  /** Compte dont on affiche les abonnements. */
  protected readonly selected = signal<User | null>(null);
  protected readonly subscriptions = signal<Subscription[]>([]);
  protected newPlanId: number | null = null;
  protected newStartDate = isoDateFromToday(0);

  protected readonly createForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(PHONE_PATTERN)],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN)]],
    role: ['coach' as Role, Validators.required],
    trainerId: [null as number | null],
  });

  constructor() {
    this.load();
  }

  protected load() {
    this.api.getUsers({ role: this.roleFilter() || undefined, search: this.search().trim() || undefined }).subscribe({
      next: (list) => this.users.set(list),
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }

  protected isSelf(user: User): boolean {
    return user.id === this.auth.user()?.id;
  }

  protected update(user: User, changes: UserChanges, notice: string) {
    this.error.set(null);
    this.api.updateUser(user.id, changes).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        if (this.isSelf(updated)) this.auth.setUser(updated);
        this.notice.set(notice);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.load(); // remet les listes déroulantes dans leur état réel
      },
    });
  }

  protected changeRole(user: User, role: Role) {
    this.update(user, { role }, `${user.fullName} est maintenant ${ROLE_LABELS[role].toLowerCase()}.`);
  }

  protected changeTrainer(user: User, value: string) {
    this.update(user, { trainerId: value ? Number(value) : null }, `Fiche coach de ${user.fullName} mise à jour.`);
  }

  protected toggleActive(user: User) {
    const isActive = !user.isActive;
    this.update(user, { isActive }, `${user.fullName} est ${isActive ? 'réactivé' : 'désactivé'}.`);
  }

  protected resetPassword(user: User) {
    const password = prompt(`Nouveau mot de passe pour ${user.fullName} (${PASSWORD_MIN} caractères minimum) :`);
    if (password === null) return;
    if (password.length < PASSWORD_MIN) {
      this.error.set(`Le mot de passe doit faire au moins ${PASSWORD_MIN} caractères.`);
      return;
    }
    this.update(user, { password }, `Mot de passe de ${user.fullName} modifié.`);
  }

  protected create() {
    this.error.set(null);
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const v = this.createForm.getRawValue();
    this.api
      .createUser({
        ...v,
        fullName: v.fullName.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        trainerId: v.role === 'coach' && v.trainerId ? Number(v.trainerId) : null,
      })
      .subscribe({
        next: (user) => {
          this.notice.set(`Compte ${ROLE_LABELS[user.role].toLowerCase()} créé pour ${user.fullName}.`);
          this.createForm.reset();
          this.showCreate.set(false);
          this.load();
        },
        error: (err) => this.error.set(apiErrorMessage(err)),
      });
  }

  protected openSubscriptions(user: User) {
    this.selected.set(user);
    this.newPlanId = this.plans().find((p) => p.isFeatured)?.id ?? this.plans()[0]?.id ?? null;
    this.newStartDate = isoDateFromToday(0);
    this.api.getUserSubscriptions(user.id).subscribe({
      next: (list) => this.subscriptions.set(list),
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }

  protected addSubscription() {
    const user = this.selected();
    if (!user || !this.newPlanId || !this.newStartDate) return;
    this.api.addSubscription(user.id, Number(this.newPlanId), this.newStartDate).subscribe({
      next: (s) => {
        this.subscriptions.update((list) => [s, ...list]);
        this.notice.set(`Abonnement ${s.planName} enregistré pour ${user.fullName}.`);
      },
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }
}
