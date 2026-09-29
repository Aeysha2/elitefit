import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type Goal = 'weight_loss' | 'muscle_gain' | 'fitness' | 'flexibility' | 'other';

export interface NewBooking {
  fullName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  goal: Goal;
  planId: number | null;
  userId?: number | null;
}

export interface Booking extends NewBooking {
  id: number;
  status: BookingStatus;
  planName: string | null;
  trainerId: number | null;
  trainerName: string | null;
  createdAt: string;
}

const SELECT_BOOKING = `
  SELECT b.id, b.full_name AS fullName, b.email, b.phone, b.booking_date AS date,
         TIME_FORMAT(b.booking_time, '%H:%i') AS time, b.goal, b.plan_id AS planId,
         p.name AS planName, b.trainer_id AS trainerId, t.name AS trainerName,
         b.status, b.created_at AS createdAt
    FROM bookings b
    LEFT JOIN plans p ON p.id = b.plan_id
    LEFT JOIN trainers t ON t.id = b.trainer_id`;

/** Créneaux d'un jour de semaine, avec le nombre de réservations actives à cette date. */
export async function findSlotsWithUsage(date: string, weekday: number) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT TIME_FORMAT(s.start_time, '%H:%i') AS time, s.capacity,
            COUNT(b.id) AS booked
       FROM time_slots s
       LEFT JOIN bookings b
         ON b.booking_date = ? AND b.booking_time = s.start_time AND b.status <> 'cancelled'
      WHERE s.weekday = ?
      GROUP BY s.id, s.start_time, s.capacity
      ORDER BY s.start_time`,
    [date, weekday],
  );
  return rows.map((r) => ({
    time: r.time as string,
    capacity: Number(r.capacity),
    remaining: Math.max(0, Number(r.capacity) - Number(r.booked)),
  }));
}

export async function hasActiveBooking(email: string): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 1 FROM bookings WHERE email = ? AND status IN ('pending','confirmed') LIMIT 1`,
    [email],
  );
  return rows.length > 0;
}

export async function insertBooking(b: NewBooking): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO bookings (full_name, email, phone, booking_date, booking_time, goal, plan_id, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.fullName, b.email, b.phone, b.date, b.time, b.goal, b.planId, b.userId ?? null],
  );
  return result.insertId;
}

export async function findBookings(
  filters: { status?: BookingStatus; trainerId?: number } = {},
): Promise<Booking[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filters.status) {
    where.push('b.status = ?');
    params.push(filters.status);
  }
  if (filters.trainerId !== undefined) {
    where.push('b.trainer_id = ?');
    params.push(filters.trainerId);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    `${SELECT_BOOKING} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY b.booking_date DESC, b.booking_time DESC`,
    params,
  );
  return rows as Booking[];
}

/** Réservations d'un membre : liées à son compte ou faites avec son e-mail. */
export async function findBookingsForUser(userId: number, email: string): Promise<Booking[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `${SELECT_BOOKING} WHERE b.user_id = ? OR b.email = ?
      ORDER BY b.booking_date DESC, b.booking_time DESC`,
    [userId, email],
  );
  return rows as Booking[];
}

export async function assignTrainer(id: number, trainerId: number | null): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE bookings SET trainer_id = ? WHERE id = ?',
    [trainerId, id],
  );
  return result.affectedRows > 0;
}

export async function findBookingById(id: number): Promise<Booking | undefined> {
  const [rows] = await pool.execute<RowDataPacket[]>(`${SELECT_BOOKING} WHERE b.id = ?`, [id]);
  return rows[0] as Booking | undefined;
}

export async function updateBookingStatus(id: number, status: BookingStatus): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE bookings SET status = ? WHERE id = ?',
    [status, id],
  );
  return result.affectedRows > 0;
}
