/**
 * Comptes et données de démonstration, pour voir ce que voit chaque rôle : npm run db:demo
 * Relançable à volonté : les données de démo sont recréées à l'identique. Refusé en production.
 */
import bcrypt from 'bcryptjs';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { addDays, addMonths, todayIso } from '../utils/dates.js';

if (env.isProduction) {
  console.error('Refusé : les comptes de démonstration ne doivent pas exister en production.');
  process.exit(1);
}

const ACCOUNTS = [
  { role: 'admin', fullName: 'Admin Démo', email: 'admin@demo.elitefit.test', password: 'DemoAdmin2026' },
  { role: 'coach', fullName: 'Moussa Diallo', email: 'coach@demo.elitefit.test', password: 'DemoCoach2026' },
  { role: 'member', fullName: 'Awa Membre', email: 'membre@demo.elitefit.test', password: 'DemoMembre2026' },
] as const;

const VISITORS = ['kofi.visiteur@demo.elitefit.test', 'mariam.visiteur@demo.elitefit.test'];

async function upsertUser(a: (typeof ACCOUNTS)[number], trainerId: number | null): Promise<number> {
  const hash = await bcrypt.hash(a.password, 10);
  await pool.execute(
    `INSERT INTO users (full_name, email, phone, password_hash, role, trainer_id)
     VALUES (?, ?, '0700000000', ?, ?, ?)
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash),
       role = VALUES(role), trainer_id = VALUES(trainer_id), is_active = TRUE`,
    [a.fullName, a.email, hash, a.role, trainerId],
  );
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [a.email]);
  return rows[0].id;
}

async function insertBooking(b: {
  fullName: string;
  email: string;
  date: string;
  time: string;
  goal: string;
  planId: number | null;
  userId: number | null;
  trainerId: number | null;
  status: string;
}) {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO bookings (full_name, email, phone, booking_date, booking_time, goal, plan_id, user_id, trainer_id, status)
     VALUES (?, ?, '0700000000', ?, ?, ?, ?, ?, ?, ?)`,
    [b.fullName, b.email, b.date, b.time, b.goal, b.planId, b.userId, b.trainerId, b.status],
  );
}

const [trainers] = await pool.query<RowDataPacket[]>(
  `SELECT id FROM trainers ORDER BY name = 'Moussa Diallo' DESC, id LIMIT 1`,
);
const [plans] = await pool.query<RowDataPacket[]>(
  'SELECT id, name, duration_months, price_fcfa FROM plans ORDER BY is_featured DESC, price_fcfa DESC LIMIT 1',
);
if (!trainers.length || !plans.length) {
  console.error('Lancez d\'abord npm run db:seed (il faut au moins un coach et une formule).');
  process.exit(1);
}
const trainerId: number = trainers[0].id;
const plan = plans[0];

const [adminId, coachId, memberId] = [
  await upsertUser(ACCOUNTS[0], null),
  await upsertUser(ACCOUNTS[1], trainerId),
  await upsertUser(ACCOUNTS[2], null),
];
void adminId;
void coachId;

// Données de démo recréées à chaque lancement
const demoEmails = [ACCOUNTS[2].email, ...VISITORS];
await pool.query('DELETE FROM bookings WHERE email IN (?)', [demoEmails]);
await pool.execute('DELETE FROM subscriptions WHERE user_id = ?', [memberId]);

const today = todayIso();
const start = addDays(today, -30);
await pool.execute(
  `INSERT INTO subscriptions (user_id, plan_id, plan_name, amount_fcfa, start_date, end_date)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [memberId, plan.id, plan.name, plan.price_fcfa, start, addMonths(start, plan.duration_months)],
);

// Membre : un essai confirmé avec le coach
await insertBooking({
  fullName: ACCOUNTS[2].fullName, email: ACCOUNTS[2].email, date: addDays(today, 2), time: '18:00',
  goal: 'muscle_gain', planId: plan.id, userId: memberId, trainerId, status: 'confirmed',
});
// Coach : un essai à traiter
await insertBooking({
  fullName: 'Kofi Visiteur', email: VISITORS[0], date: addDays(today, 3), time: '07:00',
  goal: 'weight_loss', planId: null, userId: null, trainerId, status: 'pending',
});
// Admin : un essai pas encore attribué
await insertBooking({
  fullName: 'Mariam Visiteuse', email: VISITORS[1], date: addDays(today, 4), time: '12:00',
  goal: 'flexibility', planId: null, userId: null, trainerId: null, status: 'pending',
});

console.info('Comptes de démonstration prêts (connexion sur /connexion) :\n');
for (const a of ACCOUNTS) {
  console.info(`  ${a.role.padEnd(6)}  ${a.email.padEnd(28)}  ${a.password}`);
}
await pool.end();
