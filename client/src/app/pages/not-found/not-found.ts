import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container" style="text-align: center">
        <h1>404</h1>
        <p class="lead" style="margin: 0 auto 24px">Cette page n'existe pas ou a été déplacée.</p>
        <a routerLink="/" class="btn">Retour à l'accueil</a>
      </div>
    </section>
  `,
})
export class NotFound {}
