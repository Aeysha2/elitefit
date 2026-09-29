import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { apiErrorMessage } from '../../../core/api-error';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Booking, BookingStatus, GOAL_LABELS, Message, STATUS_LABELS } from '../../../core/models';
import { formatDate } from '../../../shared/format';
import { AdminUsers } from '../users/users';

type Tab = 'bookings' | 'messages' | 'users';

@Component({
  selector: 'app-dashboard',
  imports: [AdminUsers],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  protected readonly tab = signal<Tab>('bookings');
  protected readonly statusFilter = signal<BookingStatus | ''>('pending');
  protected readonly trainerFilter = signal<number | 0>(0);
  protected readonly bookings = signal<Booking[]>([]);
  protected readonly messages = signal<Message[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly trainers = toSignal(this.api.getTrainerOptions().pipe(catchError(() => of([]))), {
    initialValue: [],
  });
  protected readonly plans = toSignal(this.api.getPlans().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  protected readonly goals = GOAL_LABELS;
  protected readonly statuses = STATUS_LABELS;
  protected readonly statusKeys = Object.keys(STATUS_LABELS) as BookingStatus[];
  protected readonly formatDate = formatDate;
  protected readonly unread = computed(() => this.messages().filter((m) => !m.isRead).length);

  constructor() {
    this.loadBookings();
    this.loadMessages();
  }

  protected loadBookings() {
    this.loading.set(true);
    this.api
      .getBookings({ status: this.statusFilter() || undefined, trainerId: this.trainerFilter() || undefined })
      .subscribe({
        next: (list) => {
          this.bookings.set(list);
          this.loading.set(false);
        },
        error: (err) => this.fail(err),
      });
  }

  protected loadMessages() {
    this.api.getMessages().subscribe({
      next: (list) => this.messages.set(list),
      error: (err) => this.fail(err),
    });
  }

  protected filterByStatus(status: BookingStatus | '') {
    this.statusFilter.set(status);
    this.loadBookings();
  }

  protected filterByTrainer(value: string) {
    this.trainerFilter.set(Number(value) || 0);
    this.loadBookings();
  }

  protected setStatus(booking: Booking, status: 'confirmed' | 'cancelled') {
    this.api.updateBooking(booking.id, { status }).subscribe({
      next: () => this.loadBookings(),
      error: (err) => this.fail(err),
    });
  }

  protected assign(booking: Booking, value: string) {
    this.api.updateBooking(booking.id, { trainerId: value ? Number(value) : null }).subscribe({
      next: (updated) => this.bookings.update((list) => list.map((b) => (b.id === updated.id ? updated : b))),
      error: (err) => this.fail(err),
    });
  }

  protected toggleRead(message: Message) {
    this.api.setMessageRead(message.id, !message.isRead).subscribe({
      next: () =>
        this.messages.update((list) =>
          list.map((m) => (m.id === message.id ? { ...m, isRead: !m.isRead } : m)),
        ),
      error: (err) => this.fail(err),
    });
  }

  private fail(err: unknown) {
    this.loading.set(false);
    this.error.set(apiErrorMessage(err));
  }
}
