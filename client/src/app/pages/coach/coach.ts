import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Booking, BookingStatus, GOAL_LABELS, STATUS_LABELS } from '../../core/models';
import { formatDate } from '../../shared/format';

@Component({
  selector: 'app-coach',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container">
        <div class="head">
          <div>
            <h1>Espace coach</h1>
            <p class="lead">
              {{ auth.user()?.fullName }}
              @if (auth.user()?.trainerName) { · fiche « {{ auth.user()?.trainerName }} » }
            </p>
          </div>
          <div class="head__actions">
            <a routerLink="/mon-compte" class="btn btn--ghost btn--small">Mon profil</a>
            <button class="btn btn--ghost btn--small" type="button" (click)="auth.logout()">Se déconnecter</button>
          </div>
        </div>

        @if (!auth.user()?.trainerId) {
          <p class="alert alert--error">
            Votre compte n'est relié à aucune fiche coach. Demandez à l'administrateur de le faire
            pour voir les séances d'essai qui vous sont attribuées.
          </p>
        } @else {
          <div class="chips" role="group" aria-label="Filtrer par statut">
            @for (f of filters; track f.value) {
              <button type="button" class="chip" [class.is-active]="status() === f.value" (click)="filter(f.value)">
                {{ f.label }}
              </button>
            }
          </div>

          @if (error(); as message) {
            <p class="alert alert--error" role="alert">{{ message }}</p>
          }

          <div class="grid">
            @for (b of bookings(); track b.id) {
              <article class="card session">
                <p class="session__when">{{ formatDate(b.date) }} · {{ b.time }}</p>
                <h2 class="session__name">{{ b.fullName }}</h2>
                <p class="muted">{{ goals[b.goal] }}@if (b.planName) { · intéressé(e) par {{ b.planName }} }</p>
                <p class="muted">
                  <a [href]="'tel:' + b.phone">{{ b.phone }}</a> ·
                  <a [href]="'mailto:' + b.email">{{ b.email }}</a>
                </p>
                <p><span class="status status--{{ b.status }}">{{ statuses[b.status] }}</span></p>
                <div class="actions">
                  @if (b.status !== 'confirmed') {
                    <button class="btn btn--small" type="button" (click)="set(b, 'confirmed')">Confirmer</button>
                  }
                  @if (b.status !== 'cancelled') {
                    <button class="btn btn--small btn--ghost" type="button" (click)="set(b, 'cancelled')">Annuler</button>
                  }
                </div>
              </article>
            } @empty {
              <p class="state">{{ loading() ? 'Chargement…' : 'Aucune séance d\\'essai pour ce filtre.' }}</p>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .head { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; justify-content: space-between; }
    .head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .session { padding: 20px; }
    .session__when { font: 700 1.4rem var(--font-display); color: var(--accent); margin: 0; }
    .session__name { font-size: 1.4rem; text-transform: none; margin: 4px 0 6px; }
    .muted { color: var(--text-muted); font-size: 0.92rem; margin: 0 0 6px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .status { font-weight: 600; }
    .status--pending { color: var(--warning); }
    .status--confirmed { color: var(--success); }
    .status--cancelled { color: var(--text-muted); }
  `,
})
export class Coach {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  protected readonly goals = GOAL_LABELS;
  protected readonly statuses = STATUS_LABELS;
  protected readonly formatDate = formatDate;
  protected readonly filters: { value: BookingStatus | ''; label: string }[] = [
    { value: 'pending', label: 'À traiter' },
    { value: 'confirmed', label: 'Confirmées' },
    { value: '', label: 'Toutes' },
  ];

  protected readonly status = signal<BookingStatus | ''>('pending');
  protected readonly bookings = signal<Booking[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    if (this.auth.user()?.trainerId) this.load();
  }

  protected filter(value: BookingStatus | '') {
    this.status.set(value);
    this.load();
  }

  protected set(booking: Booking, status: 'confirmed' | 'cancelled') {
    this.api.setCoachBookingStatus(booking.id, status).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }

  private load() {
    this.loading.set(true);
    this.api.getCoachBookings(this.status() || undefined).subscribe({
      next: (list) => {
        this.bookings.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
