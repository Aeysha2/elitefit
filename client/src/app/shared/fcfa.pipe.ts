import { Pipe, PipeTransform } from '@angular/core';

/** 150000 → « 150 000 FCFA » */
@Pipe({ name: 'fcfa' })
export class FcfaPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '';
    const digits = Math.round(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${digits} FCFA`;
  }
}
