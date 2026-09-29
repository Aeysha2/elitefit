import { Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Level, LEVEL_LABELS, Program } from '../../core/models';
import { loadable } from '../../core/resource';

@Component({
  selector: 'app-programs',
  template: `
    <section class="section">
      <div class="container">
        <h1>Programmes d'entraînement</h1>
        <p class="lead">Choisissez un objectif : nos coachs adaptent chaque programme à votre niveau.</p>

        <div class="chips" role="group" aria-label="Filtrer par niveau">
          <button type="button" class="chip" [class.is-active]="level() === null" (click)="level.set(null)">Tous</button>
          @for (l of levelKeys; track l) {
            <button type="button" class="chip" [class.is-active]="level() === l" (click)="level.set(l)">
              {{ labels[l] }}
            </button>
          }
        </div>

        @switch (programs().status) {
          @case ('loading') { <p class="state">Chargement des programmes…</p> }
          @case ('error') { <p class="state">Impossible de charger les programmes pour le moment.</p> }
          @case ('ready') {
            <div class="grid">
              @for (p of visible(); track p.id) {
                <article class="card program">
                  <img [src]="p.imageUrl" [alt]="p.name" loading="lazy" width="800" height="500" />
                  <div class="program__body">
                    <h2 class="program__name">{{ p.name }}</h2>
                    <p>{{ p.description }}</p>
                    <dl>
                      <div><dt>Durée</dt><dd>{{ p.durationWeeks }} semaines</dd></div>
                      <div><dt>Niveau</dt><dd>{{ labels[p.level] }}</dd></div>
                    </dl>
                  </div>
                </article>
              } @empty {
                <p class="state">Aucun programme pour ce niveau.</p>
              }
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: `
    .program img { width: 100%; height: 200px; object-fit: cover; }
    .program__body { padding: 20px; }
    .program__name { font-size: 1.6rem; }
    .program p { color: var(--text-muted); }
    dl { display: flex; gap: 24px; margin: 0; }
    dt { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    dd { margin: 0; font-weight: 600; }
  `,
})
export class Programs {
  protected readonly programs = loadable(inject(ApiService).getPrograms());
  protected readonly labels = LEVEL_LABELS;
  protected readonly levelKeys = Object.keys(LEVEL_LABELS) as Level[];
  protected readonly level = signal<Level | null>(null);

  protected readonly visible = computed<Program[]>(() => {
    const state = this.programs();
    const all = state.data ?? [];
    const level = this.level();
    return level ? all.filter((p) => p.level === level) : all;
  });
}
