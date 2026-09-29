import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { LEVEL_LABELS } from '../../core/models';
import { loadable } from '../../core/resource';
import { ImgFallback } from '../../shared/img-fallback';
import { Stars } from '../../shared/stars';

@Component({
  selector: 'app-home',
  imports: [ImgFallback, RouterLink, Stars],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly api = inject(ApiService);
  protected readonly programs = loadable(this.api.getPrograms(true));
  protected readonly testimonials = loadable(this.api.getTestimonials(3));
  protected readonly levels = LEVEL_LABELS;

  protected readonly highlights = [
    { value: '24/7', label: 'Ouvert jour et nuit' },
    { value: '4', label: 'Coachs diplômés' },
    { value: '6', label: 'Programmes' },
    { value: '150 000', label: 'FCFA l\'année' },
  ];
}
