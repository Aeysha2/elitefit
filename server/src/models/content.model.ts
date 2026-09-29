import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

/** MariaDB (XAMPP, WAMP) peut renvoyer les colonnes JSON sous forme de texte. */
function jsonArray(value: unknown): string[] {
  return typeof value === 'string' ? JSON.parse(value) : (value as string[]);
}

export async function findPlans() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, duration_months AS durationMonths, price_fcfa AS priceFcfa, benefits,
            is_featured AS isFeatured
       FROM plans ORDER BY sort_order, price_fcfa`,
  );
  return rows.map((r) => ({ ...r, benefits: jsonArray(r.benefits), isFeatured: Boolean(r.isFeatured) }));
}

export async function planExists(id: number): Promise<boolean> {
  return (await findPlanById(id)) !== undefined;
}

export async function findPlanById(
  id: number,
): Promise<{ id: number; name: string; durationMonths: number; priceFcfa: number } | undefined> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name, duration_months AS durationMonths, price_fcfa AS priceFcfa
       FROM plans WHERE id = ?`,
    [id],
  );
  return rows[0] as { id: number; name: string; durationMonths: number; priceFcfa: number } | undefined;
}

export async function trainerExists(id: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT 1 FROM trainers WHERE id = ?', [id]);
  return rows.length > 0;
}

/** Tous les coachs (actifs ou non) pour les listes de l'administration. */
export async function findAllTrainers() {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, is_active AS isActive FROM trainers ORDER BY name',
  );
  return rows.map((r) => ({ id: r.id as number, name: r.name as string, isActive: Boolean(r.isActive) }));
}

export async function findTrainers() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, specialization, experience_years AS experienceYears, certifications,
            photo_url AS photoUrl
       FROM trainers WHERE is_active = TRUE ORDER BY id`,
  );
  return rows.map((r) => ({ ...r, certifications: jsonArray(r.certifications) }));
}

export async function findPrograms(featuredOnly: boolean) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, description, duration_weeks AS durationWeeks, level, image_url AS imageUrl,
            is_featured AS isFeatured
       FROM programs ${featuredOnly ? 'WHERE is_featured = TRUE' : ''} ORDER BY id`,
  );
  return rows.map((r) => ({ ...r, isFeatured: Boolean(r.isFeatured) }));
}

export async function findTestimonials(limit: number) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, author, rating, content, created_at AS createdAt
       FROM testimonials WHERE is_published = TRUE ORDER BY created_at DESC, id DESC LIMIT ?`,
    [String(limit)],
  );
  return rows;
}

export async function findGallery(category?: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, url, alt_text AS altText, category
       FROM gallery_images ${category ? 'WHERE category = ?' : ''} ORDER BY sort_order, id`,
    category ? [category] : [],
  );
  return rows;
}
