import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-stars',
  template: `<span class="stars" [attr.aria-label]="rating() + ' sur 5'">{{ stars() }}</span>`,
  styles: `.stars { color: var(--accent); letter-spacing: 2px; }`,
})
export class Stars {
  readonly rating = input.required<number>();
  protected readonly stars = computed(() => '★'.repeat(this.rating()) + '☆'.repeat(5 - this.rating()));
}
