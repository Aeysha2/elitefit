import { Component, computed, inject, signal } from '@angular/core';
import { apiErrorMessage } from '../../../core/api-error';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import {
  Booking,
  BookingStatus,
  GOAL_LABELS,
  Message,
  STATUS_LABELS,
} from '../../../core/models';

type Tab = 'bookings' | 'messages';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  protected readonly tab = signal<Tab>('bookings');
  protected readonly statusFilter = signal<BookingStatus | ''>('pending');
  protected readonly bookings = signal<Booking[]>([]);
  protected readonly messages = signal<Message[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly goals = GOAL_LABELS;
  protected readonly statuses = STATUS_LABELS;
  protected readonly statusKeys = Object.keys(STATUS_LABELS) as BookingStatus[];
  protected readonly unread = computed(() => this.messages().filter((m) => !m.isRead).length);

  constructor() {
    this.loadBookings();
    this.loadMessages();
  }

  protected loadBookings() {
    this.loading.set(true);
    this.api.getBookings(this.statusFilter() || undefined).subscribe({
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

  protected filterBy(status: BookingStatus | '') {
    this.statusFilter.set(status);
    this.loadBookings();
  }

  protected setStatus(booking: Booking, status: 'confirmed' | 'cancelled') {
    this.api.setBookingStatus(booking.id, status).subscribe({
      next: () => this.loadBookings(),
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

  protected formatDate(iso: string): string {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }

  private fail(err: unknown) {
    this.loading.set(false);
    this.error.set(apiErrorMessage(err));
  }
}
