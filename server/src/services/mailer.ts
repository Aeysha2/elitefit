import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    })
  : null;

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

/**
 * Envoie un e-mail. Sans SMTP configuré (développement), l'e-mail est affiché dans la console.
 * Un échec d'envoi est journalisé mais ne fait jamais échouer la requête.
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (env.isTest) return;
  if (!transporter) {
    console.info(`[mail] À : ${mail.to}\n[mail] Objet : ${mail.subject}\n${mail.text}\n`);
    return;
  }
  try {
    await transporter.sendMail({ from: env.smtp.from, ...mail });
  } catch (err) {
    console.error('[mail] Échec de l\'envoi', err);
  }
}

const STATUS_LABELS = {
  pending: 'en attente de confirmation',
  confirmed: 'confirmée',
  cancelled: 'annulée',
} as const;

export function bookingMail(b: {
  fullName: string;
  email: string;
  date: string;
  time: string;
  status: keyof typeof STATUS_LABELS;
}): Mail {
  const [y, m, d] = b.date.split('-');
  return {
    to: b.email,
    subject: `EliteFit — votre séance d'essai est ${STATUS_LABELS[b.status]}`,
    text: [
      `Bonjour ${b.fullName},`,
      '',
      `Votre séance d'essai gratuite du ${d}/${m}/${y} à ${b.time} est ${STATUS_LABELS[b.status]}.`,
      b.status === 'pending' ? 'Notre équipe vous confirmera le créneau très vite.' : '',
      b.status === 'confirmed' ? 'Pensez à venir en tenue de sport avec une bouteille d\'eau.' : '',
      '',
      'À bientôt chez EliteFit, ouvert 24 h/24 et 7 j/7.',
    ]
      .filter((line, i, all) => line !== '' || all[i - 1] !== '')
      .join('\n'),
  };
}
