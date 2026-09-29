import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

export interface NewMessage {
  fullName: string;
  email: string;
  phone: string | null;
  content: string;
}

export async function insertMessage(m: NewMessage): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO messages (full_name, email, phone, content) VALUES (?, ?, ?, ?)',
    [m.fullName, m.email, m.phone, m.content],
  );
  return result.insertId;
}

export async function findMessages() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, full_name AS fullName, email, phone, content, is_read AS isRead,
            created_at AS createdAt
       FROM messages ORDER BY created_at DESC, id DESC`,
  );
  return rows.map((r) => ({ ...r, isRead: Boolean(r.isRead) }));
}

export async function markMessageRead(id: number, isRead: boolean): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE messages SET is_read = ? WHERE id = ?',
    [isRead, id],
  );
  return result.affectedRows > 0;
}
