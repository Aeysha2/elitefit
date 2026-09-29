import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Aucune base réelle : on remplace la connexion et les modèles par des doublures.
vi.mock('../src/config/db.js', () => ({ pool: { query: vi.fn().mockResolvedValue([[]]) } }));
vi.mock('../src/models/content.model.js', () => ({
  findPlans: vi.fn().mockResolvedValue([{ id: 4, name: 'Annuel', priceFcfa: 150000 }]),
  planExists: vi.fn().mockResolvedValue(true),
  findTrainers: vi.fn(),
  findPrograms: vi.fn(),
  findTestimonials: vi.fn(),
  findGallery: vi.fn(),
}));
vi.mock('../src/models/booking.model.js', () => ({
  findSlotsWithUsage: vi.fn(),
  hasActiveBooking: vi.fn(),
  insertBooking: vi.fn(),
  findBookings: vi.fn().mockResolvedValue([]),
  findBookingById: vi.fn(),
  updateBookingStatus: vi.fn(),
}));

const bookings = await import('../src/models/booking.model.js');
const { createApp } = await import('../src/app.js');
const { addDays, todayIso } = await import('../src/utils/dates.js');
const app = createApp();

const validBooking = () => ({
  fullName: 'Sarah Martin',
  email: 'sarah@example.com',
  phone: '+225 0712345678',
  date: addDays(todayIso(), 3),
  time: '18:00',
  goal: 'muscle_gain',
  planId: 4,
});

beforeEach(() => {
  vi.mocked(bookings.findSlotsWithUsage).mockResolvedValue([
    { time: '18:00', capacity: 3, remaining: 1 },
  ]);
  vi.mocked(bookings.hasActiveBooking).mockResolvedValue(false);
  vi.mocked(bookings.insertBooking).mockResolvedValue(42);
});

describe('API publique', () => {
  it('répond sur /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('liste les formules', async () => {
    const res = await request(app).get('/api/plans');
    expect(res.body[0].priceFcfa).toBe(150000);
  });

  it('crée une réservation valide', async () => {
    const res = await request(app).post('/api/bookings').send(validBooking());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 42, status: 'pending', time: '18:00' });
  });

  it('refuse des champs invalides avec le détail par champ', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ ...validBooking(), email: 'pas-un-email', time: '18:30' });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d: { field: string }) => d.field)).toEqual(['email', 'time']);
  });

  it('refuse une date hors de la fenêtre J+1 à J+30', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ ...validBooking(), date: addDays(todayIso(), 31) });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('DATE_OUT_OF_RANGE');
  });

  it('refuse un créneau complet', async () => {
    vi.mocked(bookings.findSlotsWithUsage).mockResolvedValue([
      { time: '18:00', capacity: 3, remaining: 0 },
    ]);
    const res = await request(app).post('/api/bookings').send(validBooking());
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('SLOT_FULL');
  });

  it('refuse un deuxième essai pour le même e-mail', async () => {
    vi.mocked(bookings.hasActiveBooking).mockResolvedValue(true);
    const res = await request(app).post('/api/bookings').send(validBooking());
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ALREADY_BOOKED');
  });
});

describe('API admin', () => {
  it('exige un jeton', async () => {
    const res = await request(app).get('/api/admin/bookings');
    expect(res.status).toBe(401);
  });

  it('accepte un jeton valide', async () => {
    const token = jwt.sign({ sub: '1', email: 'admin@elitefit.test' }, 'test-secret');
    const res = await request(app).get('/api/admin/bookings').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
