import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { loadable } from '../../core/resource';
import { ImgFallback } from '../../shared/img-fallback';

@Component({
  selector: 'app-trainers',
  imports: [ImgFallback, RouterLink],
  template: `
    <section class="section">
      <div class="container">
        <h1>Nos coachs</h1>
        <p class="lead">Des professionnels diplômés pour vous guider, vous corriger et vous motiver.</p>
        @switch (trainers().status) {
          @case ('loading') { <p class="state">Chargement des coachs…</p> }
          @case ('error') { <p class="state">Impossible de charger les coachs pour le moment.</p> }
          @case ('ready') {
            <div class="grid trainers">
              @for (t of trainers().data ?? []; track t.id) {
                <article class="card trainer">
                  <img appImgFallback [src]="t.photoUrl" [alt]="'Photo de ' + t.name" loading="lazy" width="600" height="600" />
                  <div class="trainer__body">
                    <h2 class="trainer__name">{{ t.name }}</h2>
                    <p class="trainer__spec">{{ t.specialization }}</p>
                    <p class="badge">{{ t.experienceYears }} ans d'expérience</p>
                    <ul>
                      @for (c of t.certifications; track c) { <li>{{ c }}</li> }
                    </ul>
                  </div>
                </article>
              }
            </div>
          }
        }
        <p class="note"><a routerLink="/essai-gratuit">Réservez un essai</a> pour rencontrer un coach.</p>
      </div>
    </section>
  `,
  styles: `
    .trainers { margin-top: 32px; }
    .trainer img { width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; }
    .trainer__body { padding: 20px; }
    .trainer__name { font-size: 1.6rem; text-transform: none; margin-bottom: 4px; }
    .trainer__spec { color: var(--accent); font-weight: 600; margin-bottom: 8px; }
    ul { margin: 12px 0 0; padding-left: 18px; color: var(--text-muted); font-size: 0.95rem; }
    .note { margin-top: 32px; }
  `,
})
export class Trainers {
  protected readonly trainers = loadable(inject(ApiService).getTrainers());
}
