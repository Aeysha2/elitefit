import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  Booking,
  BookingRequest,
  BookingStatus,
  GalleryImage,
  Message,
  MessageRequest,
  Plan,
  Program,
  Slot,
  Testimonial,
  Trainer,
} from './models';

/** Seul point d'accès à l'API REST. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getPlans() {
    return this.http.get<Plan[]>(`${this.base}/plans`);
  }

  getTrainers() {
    return this.http.get<Trainer[]>(`${this.base}/trainers`);
  }

  getPrograms(featuredOnly = false) {
    return this.http.get<Program[]>(`${this.base}/programs`, {
      params: featuredOnly ? { featured: 'true' } : {},
    });
  }

  getTestimonials(limit = 20) {
    return this.http.get<Testimonial[]>(`${this.base}/testimonials`, { params: { limit } });
  }

  getGallery() {
    return this.http.get<GalleryImage[]>(`${this.base}/gallery`);
  }

  getAvailability(date: string) {
    return this.http.get<{ date: string; slots: Slot[] }>(`${this.base}/bookings/availability`, {
      params: { date },
    });
  }

  createBooking(booking: BookingRequest) {
    return this.http.post<{ id: number; status: BookingStatus }>(`${this.base}/bookings`, booking);
  }

  sendMessage(message: MessageRequest) {
    return this.http.post<{ id: number }>(`${this.base}/messages`, message);
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string; email: string }>(`${this.base}/auth/login`, {
      email,
      password,
    });
  }

  getBookings(status?: BookingStatus) {
    return this.http.get<Booking[]>(`${this.base}/admin/bookings`, {
      params: status ? { status } : {},
    });
  }

  setBookingStatus(id: number, status: 'confirmed' | 'cancelled') {
    return this.http.patch<Booking>(`${this.base}/admin/bookings/${id}`, { status });
  }

  getMessages() {
    return this.http.get<Message[]>(`${this.base}/admin/messages`);
  }

  setMessageRead(id: number, isRead: boolean) {
    return this.http.patch<void>(`${this.base}/admin/messages/${id}`, { isRead });
  }
}
