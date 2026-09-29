import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  protected readonly theme = inject(ThemeService);
  protected readonly open = signal(false);

  protected readonly links = [
    { path: '/formules', label: 'Formules' },
    { path: '/programmes', label: 'Programmes' },
    { path: '/coachs', label: 'Coachs' },
    { path: '/galerie', label: 'Galerie' },
    { path: '/contact', label: 'Contact' },
  ];

  protected close() {
    this.open.set(false);
  }
}
