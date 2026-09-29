import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

export type Role = 'admin' | 'coach' | 'member';
export const ROLES: Role[] = ['admin', 'coach', 'member'];

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

const SELECT_USER = `
  SELECT u.id, u.full_name AS fullName, u.email, u.phone, u.role, u.trainer_id AS trainerId,
         t.name AS trainerName, u.is_active AS isActive, u.created_at AS createdAt
    FROM users u LEFT JOIN trainers t ON t.id = u.trainer_id`;

function toUser(row: RowDataPacket): User {
  return { ...(row as User), isActive: Boolean(row.isActive) };
}

export async function findUserById(id: number): Promise<User | undefined> {
  const [rows] = await pool.execute<RowDataPacket[]>(`${SELECT_USER} WHERE u.id = ?`, [id]);
  return rows[0] ? toUser(rows[0]) : undefined;
}

export async function findCredentials(
  email: string,
): Promise<{ id: number; passwordHash: string; isActive: boolean } | undefined> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, password_hash AS passwordHash, is_active AS isActive FROM users WHERE email = ?',
    [email],
  );
  return rows[0]
    ? { id: rows[0].id, passwordHash: rows[0].passwordHash, isActive: Boolean(rows[0].isActive) }
    : undefined;
}

export async function findPasswordHash(id: number): Promise<string | undefined> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT password_hash AS passwordHash FROM users WHERE id = ?',
    [id],
  );
  return rows[0]?.passwordHash;
}

export async function emailExists(email: string): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT 1 FROM users WHERE email = ?', [email]);
  return rows.length > 0;
}

export async function findUsers(filters: { role?: Role; search?: string }): Promise<User[]> {
  const where: string[] = [];
  const params: string[] = [];
  if (filters.role) {
    where.push('u.role = ?');
    params.push(filters.role);
  }
  if (filters.search) {
    where.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    `${SELECT_USER} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY u.created_at DESC, u.id DESC`,
    params,
  );
  return rows.map(toUser);
}

export interface NewUser {
  fullName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: Role;
  trainerId: number | null;
}

export async function insertUser(u: NewUser): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users (full_name, email, phone, password_hash, role, trainer_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [u.fullName, u.email, u.phone, u.passwordHash, u.role, u.trainerId],
  );
  return result.insertId;
}

/** Met à jour les champs fournis (undefined = inchangé). */
export async function updateUser(
  id: number,
  changes: Partial<{
    fullName: string;
    phone: string | null;
    role: Role;
    trainerId: number | null;
    isActive: boolean;
    passwordHash: string;
  }>,
): Promise<boolean> {
  const columns: Record<string, string> = {
    fullName: 'full_name',
    phone: 'phone',
    role: 'role',
    trainerId: 'trainer_id',
    isActive: 'is_active',
    passwordHash: 'password_hash',
  };
  const sets: string[] = [];
  const params: (string | number | boolean | null)[] = [];
  for (const [key, column] of Object.entries(columns)) {
    const value = changes[key as keyof typeof changes];
    if (value !== undefined) {
      sets.push(`${column} = ?`);
      params.push(value);
    }
  }
  if (!sets.length) return (await findUserById(id)) !== undefined;
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE users SET ${sets.join(', ')} WHERE id = ?`,
    [...params, id],
  );
  return result.affectedRows > 0;
}

/** Crée ou met à jour un administrateur (script create-admin). */
export async function upsertAdmin(email: string, passwordHash: string): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ('Administrateur', ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin', is_active = TRUE`,
    [email, passwordHash],
  );
}

export async function countActiveAdmins(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND is_active = TRUE`,
  );
  return Number(rows[0].n);
}
