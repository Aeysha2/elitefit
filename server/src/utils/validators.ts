import { body } from 'express-validator';

export const PHONE = /^\+?[0-9 ]{8,15}$/;
export const PASSWORD_MIN = 8;

/** E-mail en minuscules, sans autre transformation (les points Gmail sont conservés). */
export const emailField = (field = 'email') =>
  body(field).trim().isEmail().withMessage('E-mail invalide').toLowerCase();

export const passwordField = (field = 'password') =>
  body(field)
    .isString()
    .isLength({ min: PASSWORD_MIN, max: 100 })
    .withMessage(`Mot de passe : ${PASSWORD_MIN} caractères minimum`);

export const nameField = (field = 'fullName') =>
  body(field).trim().isLength({ min: 2, max: 100 }).withMessage('Nom : 2 à 100 caractères');

export const phoneField = (field = 'phone', optional = true) =>
  optional
    ? body(field).optional({ values: 'falsy' }).trim().matches(PHONE).withMessage('Téléphone invalide')
    : body(field).trim().matches(PHONE).withMessage('Téléphone invalide');
