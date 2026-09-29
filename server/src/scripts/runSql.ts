/** Exécute un fichier SQL sur la base configurée dans .env : npm run db:schema / db:seed */
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage : tsx src/scripts/runSql.ts <fichier.sql>');
  process.exit(1);
}

const { database, ...server } = env.db;
const connection = await mysql.createConnection({ ...server, multipleStatements: true });
try {
  // En local, crée la base au premier lancement ; chez un hébergeur elle existe déjà.
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
} catch {
  // Droits insuffisants : la base doit déjà exister.
}
await connection.query(`USE \`${database}\``);
await connection.query(await readFile(file, 'utf8'));
await connection.end();
console.info(`${file} exécuté sur la base ${database}.`);
