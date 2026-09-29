import { FcfaPipe } from './fcfa.pipe';

describe('FcfaPipe', () => {
  const pipe = new FcfaPipe();

  it('sépare les milliers et ajoute la devise', () => {
    expect(pipe.transform(150000)).toBe('150 000 FCFA');
    expect(pipe.transform(1500000)).toBe('1 500 000 FCFA');
  });

  it('gère les petites valeurs et les valeurs absentes', () => {
    expect(pipe.transform(500)).toBe('500 FCFA');
    expect(pipe.transform(null)).toBe('');
  });
});
