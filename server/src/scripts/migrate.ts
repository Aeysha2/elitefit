/** Applique les migrations de database/migrations pas encore passées : npm run db:migrate */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import mysql, { type RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env.js';

const dir = path.resolve('database/migrations');
const connection = await mysql.createConnection({ ...env.db, multipleStatements: true });

await connection.query(
  `CREATE TABLE IF NOT EXISTS schema_migrations (
     name VARCHAR(100) PRIMARY KEY,
     applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   )`,
);
const [rows] = await connection.query<RowDataPacket[]>('SELECT name FROM schema_migrations');
const applied = new Set(rows.map((r) => r.name as string));

const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  console.info(`→ ${file}`);
  await connection.query(await readFile(path.join(dir, file), 'utf8'));
  await connection.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
  count++;
}
console.info(count ? `${count} migration(s) appliquée(s).` : 'Base déjà à jour.');
await connection.end();
