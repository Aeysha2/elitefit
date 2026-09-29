import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

export interface Subscription {
  id: number;
  planId: number | null;
  planName: string;
  amountFcfa: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export async function findSubscriptions(userId: number): Promise<Subscription[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, plan_id AS planId, plan_name AS planName, amount_fcfa AS amountFcfa,
            start_date AS startDate, end_date AS endDate, created_at AS createdAt
       FROM subscriptions WHERE user_id = ? ORDER BY end_date DESC, id DESC`,
    [userId],
  );
  return rows as Subscription[];
}

export async function insertSubscription(s: {
  userId: number;
  planId: number;
  planName: string;
  amountFcfa: number;
  startDate: string;
  endDate: string;
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO subscriptions (user_id, plan_id, plan_name, amount_fcfa, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [s.userId, s.planId, s.planName, s.amountFcfa, s.startDate, s.endDate],
  );
  return result.insertId;
}
