import { FormBuilder } from '@angular/forms';
import { passwordsMatch } from './register/register';
import { safeRedirect } from './redirect';

describe('safeRedirect', () => {
  it('accepte un chemin interne', () => {
    expect(safeRedirect('/essai-gratuit')).toBe('/essai-gratuit');
  });

  it('refuse une adresse externe ou vide', () => {
    expect(safeRedirect('https://exemple.com')).toBeNull();
    expect(safeRedirect('//exemple.com')).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
  });
});

describe('passwordsMatch', () => {
  const fb = new FormBuilder();

  it('signale deux mots de passe différents', () => {
    expect(passwordsMatch(fb.group({ password: 'secret12', confirm: 'secret13' }))).toEqual({ mismatch: true });
    expect(passwordsMatch(fb.group({ password: 'secret12', confirm: 'secret12' }))).toBeNull();
  });
});
