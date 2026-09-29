import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../src/models/user.model.js';

// Aucune base réelle : on remplace la connexion et les modèles par des doublures.
vi.mock('../src/config/db.js', () => ({ pool: { query: vi.fn().mockResolvedValue([[]]) } }));
vi.mock('../src/models/content.model.js', () => ({
  findPlans: vi.fn().mockResolvedValue([{ id: 4, name: 'Annuel', priceFcfa: 150000 }]),
  planExists: vi.fn().mockResolvedValue(true),
  findPlanById: vi.fn(),
  trainerExists: vi.fn().mockResolvedValue(true),
  findAllTrainers: vi.fn(),
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
  findBookingsForUser: vi.fn().mockResolvedValue([]),
  findBookingById: vi.fn(),
  updateBookingStatus: vi.fn(),
  assignTrainer: vi.fn(),
}));
vi.mock('../src/models/user.model.js', () => ({
  ROLES: ['admin', 'coach', 'member'],
  findUserById: vi.fn(),
  findCredentials: vi.fn(),
  findPasswordHash: vi.fn(),
  emailExists: vi.fn(),
  findUsers: vi.fn().mockResolvedValue([]),
  insertUser: vi.fn(),
  updateUser: vi.fn().mockResolvedValue(true),
  upsertAdmin: vi.fn(),
  countActiveAdmins: vi.fn(),
}));

const bookings = await import('../src/models/booking.model.js');
const users = await import('../src/models/user.model.js');
const { createApp } = await import('../src/app.js');
const { signToken } = await import('../src/middleware/auth.js');
const { addDays, addMonths, todayIso } = await import('../src/utils/dates.js');
const app = createApp();

function makeUser(overrides: Partial<User>): User {
  return {
    id: 1,
    fullName: 'Test',
    email: 'test@example.com',
    phone: null,
    role: 'member',
    trainerId: null,
    trainerName: null,
    isActive: true,
    createdAt: '2026-01-01 00:00:00',
    ...overrides,
  };
}

const ADMIN = makeUser({ id: 1, role: 'admin', email: 'admin@elitefit.test' });
const MEMBER = makeUser({ id: 2, role: 'member' });
const COACH = makeUser({ id: 3, role: 'coach', trainerId: 7 });
const bearer = (u: User) => `Bearer ${signToken(u)}`;

const validBooking = () => ({
  fullName: 'Sarah Martin',
  email: 'Sarah@Example.com',
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
  vi.mocked(users.findUserById).mockImplementation(
    async (id) => [ADMIN, MEMBER, COACH].find((u) => u.id === id),
  );
  vi.mocked(users.countActiveAdmins).mockResolvedValue(2);
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

  it('crée une réservation valide avec un e-mail en minuscules', async () => {
    const res = await request(app).post('/api/bookings').send(validBooking());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 42, status: 'pending', time: '18:00' });
    expect(vi.mocked(bookings.insertBooking).mock.lastCall?.[0]).toMatchObject({
      email: 'sarah@example.com',
      userId: null,
    });
  });

  it('relie la réservation au compte connecté', async () => {
    await request(app).post('/api/bookings').set('Authorization', bearer(MEMBER)).send(validBooking());
    expect(vi.mocked(bookings.insertBooking).mock.lastCall?.[0]).toMatchObject({ userId: 2 });
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

describe('Comptes', () => {
  it('inscrit un membre (jamais un autre rôle)', async () => {
    vi.mocked(users.emailExists).mockResolvedValue(false);
    vi.mocked(users.insertUser).mockResolvedValue(2);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Awa', email: 'awa@example.com', password: 'secret12', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(vi.mocked(users.insertUser).mock.lastCall?.[0].role).toBe('member');
  });

  it('refuse un mot de passe trop court', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Awa', email: 'awa@example.com', password: 'court' });
    expect(res.status).toBe(400);
  });

  it('refuse un e-mail déjà utilisé', async () => {
    vi.mocked(users.emailExists).mockResolvedValue(true);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Awa', email: 'awa@example.com', password: 'secret12' });
    expect(res.status).toBe(409);
  });

  it('renvoie le profil du compte connecté', async () => {
    const res = await request(app).get('/api/me').set('Authorization', bearer(MEMBER));
    expect(res.body).toMatchObject({ id: 2, role: 'member' });
  });

  it('bloque un compte désactivé même avec un jeton valide', async () => {
    vi.mocked(users.findUserById).mockResolvedValue({ ...MEMBER, isActive: false });
    const res = await request(app).get('/api/me').set('Authorization', bearer(MEMBER));
    expect(res.status).toBe(401);
  });
});

describe('Rôles', () => {
  it('exige un jeton pour l\'administration', async () => {
    const res = await request(app).get('/api/admin/bookings');
    expect(res.status).toBe(401);
  });

  it('refuse l\'administration à un membre et à un coach', async () => {
    for (const user of [MEMBER, COACH]) {
      const res = await request(app).get('/api/admin/users').set('Authorization', bearer(user));
      expect(res.status).toBe(403);
    }
  });

  it('ouvre l\'administration à un admin', async () => {
    const res = await request(app).get('/api/admin/bookings').set('Authorization', bearer(ADMIN));
    expect(res.status).toBe(200);
  });

  it('empêche un admin de se retirer ses propres droits', async () => {
    const res = await request(app)
      .patch('/api/admin/users/1')
      .set('Authorization', bearer(ADMIN))
      .send({ role: 'member' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('SELF_LOCKOUT');
  });

  it('limite le coach à ses propres essais', async () => {
    await request(app).get('/api/coach/bookings').set('Authorization', bearer(COACH));
    expect(vi.mocked(bookings.findBookings).mock.lastCall?.[0]).toMatchObject({ trainerId: 7 });

    vi.mocked(bookings.findBookingById).mockResolvedValue({
      id: 9, trainerId: 8, status: 'pending',
    } as bookings.Booking);
    const res = await request(app)
      .patch('/api/coach/bookings/9')
      .set('Authorization', bearer(COACH))
      .send({ status: 'confirmed' });
    expect(res.status).toBe(404);
    expect(bookings.updateBookingStatus).not.toHaveBeenCalled();
  });

  it('refuse l\'espace coach à un membre', async () => {
    const res = await request(app).get('/api/coach/bookings').set('Authorization', bearer(MEMBER));
    expect(res.status).toBe(403);
  });
});

describe('addMonths', () => {
  it('calcule le dernier jour inclus d\'un abonnement', () => {
    expect(addMonths('2026-09-01', 12)).toBe('2027-08-31');
    expect(addMonths('2026-03-15', 1)).toBe('2026-04-14');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-27');
    expect(addMonths('2026-11-30', 3)).toBe('2027-02-27');
  });
});
