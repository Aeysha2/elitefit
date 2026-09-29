import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { GalleryCategory, GalleryImage } from '../../core/models';
import { loadable } from '../../core/resource';

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  interior: 'La salle',
  equipment: 'Équipements',
  sessions: 'Séances',
  events: 'Événements',
};

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class Gallery {
  protected readonly images = loadable(inject(ApiService).getGallery());
  protected readonly labels = CATEGORY_LABELS;
  protected readonly categories = Object.keys(CATEGORY_LABELS) as GalleryCategory[];
  protected readonly category = signal<GalleryCategory | null>(null);
  protected readonly openIndex = signal<number | null>(null);

  protected readonly visible = computed<GalleryImage[]>(() => {
    const state = this.images();
    const all = state.data ?? [];
    const category = this.category();
    return category ? all.filter((i) => i.category === category) : all;
  });

  protected readonly current = computed(() => {
    const index = this.openIndex();
    return index === null ? null : this.visible().at(index) ?? null;
  });

  protected open(index: number) {
    this.openIndex.set(index);
  }

  protected close() {
    this.openIndex.set(null);
  }

  protected step(delta: number) {
    const count = this.visible().length;
    this.openIndex.update((i) => (i === null ? null : (i + delta + count) % count));
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent) {
    if (this.openIndex() === null) return;
    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowRight') this.step(1);
    if (event.key === 'ArrowLeft') this.step(-1);
  }
}
