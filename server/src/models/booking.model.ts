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
}

export interface Booking extends NewBooking {
  id: number;
  status: BookingStatus;
  planName: string | null;
  createdAt: string;
}

const SELECT_BOOKING = `
  SELECT b.id, b.full_name AS fullName, b.email, b.phone, b.booking_date AS date,
         TIME_FORMAT(b.booking_time, '%H:%i') AS time, b.goal, b.plan_id AS planId,
         p.name AS planName, b.status, b.created_at AS createdAt
    FROM bookings b LEFT JOIN plans p ON p.id = b.plan_id`;

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
    `INSERT INTO bookings (full_name, email, phone, booking_date, booking_time, goal, plan_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [b.fullName, b.email, b.phone, b.date, b.time, b.goal, b.planId],
  );
  return result.insertId;
}

export async function findBookings(status?: BookingStatus): Promise<Booking[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `${SELECT_BOOKING} ${status ? 'WHERE b.status = ?' : ''}
      ORDER BY b.booking_date DESC, b.booking_time DESC`,
    status ? [status] : [],
  );
  return rows as Booking[];
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
