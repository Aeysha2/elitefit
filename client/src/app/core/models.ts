export interface Plan {
  id: number;
  name: string;
  durationMonths: number;
  priceFcfa: number;
  benefits: string[];
  isFeatured: boolean;
}

export interface Trainer {
  id: number;
  name: string;
  specialization: string;
  experienceYears: number;
  certifications: string[];
  photoUrl: string;
}

export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface Program {
  id: number;
  name: string;
  description: string;
  durationWeeks: number;
  level: Level;
  imageUrl: string;
  isFeatured: boolean;
}

export interface Testimonial {
  id: number;
  author: string;
  rating: number;
  content: string;
}

export type GalleryCategory = 'interior' | 'equipment' | 'sessions' | 'events';

export interface GalleryImage {
  id: number;
  url: string;
  altText: string;
  category: GalleryCategory;
}

export interface Slot {
  time: string;
  capacity: number;
  remaining: number;
}

export type Goal = 'weight_loss' | 'muscle_gain' | 'fitness' | 'flexibility' | 'other';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface BookingRequest {
  fullName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  goal: Goal;
  planId: number | null;
}

export interface Booking extends BookingRequest {
  id: number;
  status: BookingStatus;
  planName: string | null;
  trainerId: number | null;
  trainerName: string | null;
  createdAt: string;
}

export interface MessageRequest {
  fullName: string;
  email: string;
  phone: string;
  content: string;
}

export interface Message extends MessageRequest {
  id: number;
  isRead: boolean;
  createdAt: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: { field: string; message: string }[];
}

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export const GOAL_LABELS: Record<Goal, string> = {
  weight_loss: 'Perte de poids',
  muscle_gain: 'Prise de muscle',
  fitness: 'Remise en forme',
  flexibility: 'Souplesse',
  other: 'Autre',
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
};

export type Role = 'admin' | 'coach' | 'member';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur',
  coach: 'Coach',
  member: 'Membre',
};

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  trainerId: number | null;
  trainerName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TrainerOption {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Subscription {
  id: number;
  planId: number | null;
  planName: string;
  amountFcfa: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface NewUserRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  trainerId: number | null;
}

export type UserChanges = Partial<{
  fullName: string;
  phone: string;
  role: Role;
  trainerId: number | null;
  isActive: boolean;
  password: string;
}>;
