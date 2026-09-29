import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  Booking,
  BookingRequest,
  BookingStatus,
  GalleryImage,
  Message,
  MessageRequest,
  NewUserRequest,
  Plan,
  Program,
  Role,
  Slot,
  Subscription,
  Testimonial,
  Trainer,
  TrainerOption,
  User,
  UserChanges,
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

  // Comptes
  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, { email, password });
  }

  register(data: { fullName: string; email: string; phone: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, data);
  }

  me() {
    return this.http.get<User>(`${this.base}/me`);
  }

  updateProfile(data: { fullName: string; phone: string }) {
    return this.http.patch<User>(`${this.base}/me`, data);
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.patch<void>(`${this.base}/me/password`, { currentPassword, newPassword });
  }

  myBookings() {
    return this.http.get<Booking[]>(`${this.base}/me/bookings`);
  }

  mySubscriptions() {
    return this.http.get<{ current: Subscription | null; history: Subscription[] }>(
      `${this.base}/me/subscriptions`,
    );
  }

  // Administration
  getBookings(filters: { status?: BookingStatus; trainerId?: number } = {}) {
    const params: Record<string, string | number> = {};
    if (filters.status) params['status'] = filters.status;
    if (filters.trainerId) params['trainerId'] = filters.trainerId;
    return this.http.get<Booking[]>(`${this.base}/admin/bookings`, { params });
  }

  updateBooking(id: number, changes: { status?: BookingStatus; trainerId?: number | null }) {
    return this.http.patch<Booking>(`${this.base}/admin/bookings/${id}`, changes);
  }

  getMessages() {
    return this.http.get<Message[]>(`${this.base}/admin/messages`);
  }

  setMessageRead(id: number, isRead: boolean) {
    return this.http.patch<void>(`${this.base}/admin/messages/${id}`, { isRead });
  }

  getTrainerOptions() {
    return this.http.get<TrainerOption[]>(`${this.base}/admin/trainers`);
  }

  getUsers(filters: { role?: Role; search?: string } = {}) {
    const params: Record<string, string> = {};
    if (filters.role) params['role'] = filters.role;
    if (filters.search) params['search'] = filters.search;
    return this.http.get<User[]>(`${this.base}/admin/users`, { params });
  }

  createUser(data: NewUserRequest) {
    return this.http.post<User>(`${this.base}/admin/users`, data);
  }

  updateUser(id: number, changes: UserChanges) {
    return this.http.patch<User>(`${this.base}/admin/users/${id}`, changes);
  }

  getUserSubscriptions(id: number) {
    return this.http.get<Subscription[]>(`${this.base}/admin/users/${id}/subscriptions`);
  }

  addSubscription(id: number, planId: number, startDate: string) {
    return this.http.post<Subscription>(`${this.base}/admin/users/${id}/subscriptions`, {
      planId,
      startDate,
    });
  }

  // Espace coach
  getCoachBookings(status?: BookingStatus) {
    return this.http.get<Booking[]>(`${this.base}/coach/bookings`, {
      params: status ? { status } : {},
    });
  }

  setCoachBookingStatus(id: number, status: 'confirmed' | 'cancelled') {
    return this.http.patch<Booking>(`${this.base}/coach/bookings/${id}`, { status });
  }
}
