import { FormControl } from '@angular/forms';
import { dateInRange, isoDateFromToday } from './validators';

describe('dateInRange', () => {
  const validator = dateInRange(1, 30);

  it('accepte demain et J+30', () => {
    expect(validator(new FormControl(isoDateFromToday(1)))).toBeNull();
    expect(validator(new FormControl(isoDateFromToday(30)))).toBeNull();
  });

  it("refuse aujourd'hui et J+31", () => {
    expect(validator(new FormControl(isoDateFromToday(0)))).not.toBeNull();
    expect(validator(new FormControl(isoDateFromToday(31)))).not.toBeNull();
  });

  it('ignore un champ vide (géré par required)', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });
});
