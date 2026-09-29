import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from './core/theme.service';
import { Footer } from './shared/footer/footer';
import { Navbar } from './shared/navbar/navbar';

const DEFAULT_DESCRIPTION = 'EliteFit, salle de sport ouverte 24 h/24 et 7 j/7.';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  template: `
    <a class="skip-link" href="#contenu">Aller au contenu</a>
    <app-navbar />
    <main id="contenu"><router-outlet /></main>
    <app-footer />
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; }
    .skip-link {
      position: absolute; left: 16px; top: -48px; z-index: 100;
      background: var(--accent); color: var(--accent-contrast); padding: 8px 16px; border-radius: 8px;
      &:focus { top: 8px; }
    }
  `,
})
export class App {
  constructor() {
    inject(ThemeService); // applique le thème dès le démarrage
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const meta = inject(Meta);

    // Description SEO propre à chaque page
    router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        let current = route.snapshot;
        while (current.firstChild) current = current.firstChild;
        meta.updateTag({
          name: 'description',
          content: current.data['description'] ?? DEFAULT_DESCRIPTION,
        });
      });
  }
}
