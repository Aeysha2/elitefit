import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

export interface AdminRow {
  id: number;
  email: string;
  passwordHash: string;
}

export async function findAdminByEmail(email: string): Promise<AdminRow | undefined> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, email, password_hash AS passwordHash FROM admins WHERE email = ?',
    [email],
  );
  return rows[0] as AdminRow | undefined;
}

export async function upsertAdmin(email: string, passwordHash: string): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO admins (email, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [email, passwordHash],
  );
}
