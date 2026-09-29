/** Crée (ou met à jour) un compte administrateur : npm run create-admin */
import bcrypt from 'bcryptjs';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline';
import { pool } from '../config/db.js';
import { upsertAdmin } from '../models/user.model.js';

// Lecture ligne par ligne : fonctionne au clavier comme avec une entrée redirigée.
const lines = createInterface({ input })[Symbol.asyncIterator]();
async function ask(prompt: string): Promise<string> {
  output.write(prompt);
  const { value } = await lines.next();
  return String(value ?? '');
}

const email = (await ask('E-mail de l\'administrateur : ')).trim().toLowerCase();
const password = await ask('Mot de passe (12 caractères minimum) : ');

if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12) {
  console.error('\nE-mail invalide ou mot de passe trop court.');
  process.exit(1);
}

await upsertAdmin(email, await bcrypt.hash(password, 12));
console.info(`\nAdministrateur ${email} enregistré.`);
await pool.end();
process.exit(0);
