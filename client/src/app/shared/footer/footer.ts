import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GYM_INFO } from '../../core/gym-info';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container footer__grid">
        <div>
          <p class="footer__logo">Elite<span>Fit</span></p>
          <p>Votre salle de sport ouverte 24 h/24 et 7 j/7.</p>
        </div>
        <div>
          <h3>Nous trouver</h3>
          <p>
            {{ info.hours }}<br />
            {{ info.address }}, {{ info.city }}<br />
            <a [href]="'tel:' + info.phone.replaceAll(' ', '')">{{ info.phone }}</a><br />
            <a [href]="'mailto:' + info.email">{{ info.email }}</a>
          </p>
        </div>
        <div>
          <h3>Liens</h3>
          <p>
            <a routerLink="/formules">Formules</a><br />
            <a routerLink="/essai-gratuit">Essai gratuit</a><br />
            <a routerLink="/contact">Contact</a>
          </p>
          <p>
            <a [href]="info.instagram" target="_blank" rel="noopener">Instagram</a> ·
            <a [href]="info.facebook" target="_blank" rel="noopener">Facebook</a>
          </p>
        </div>
      </div>
      <div class="container footer__bottom">© {{ year }} EliteFit. Tous droits réservés.</div>
    </footer>
  `,
  styles: `
    .footer { background: #111214; color: #d6d6d2; padding: 56px 0 24px; margin-top: 0; }
    .footer__grid { display: grid; gap: 32px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
    .footer__logo { font: 700 1.8rem var(--font-display); text-transform: uppercase; color: #fff; margin: 0 0 8px; }
    .footer__logo span { color: #fb7a2a; }
    h3 { color: #fff; font-size: 1.2rem; text-transform: uppercase; }
    a { color: #d6d6d2; }
    a:hover { color: #fb7a2a; }
    .footer__bottom { border-top: 1px solid #2a2c30; margin-top: 32px; padding-top: 20px; font-size: 0.875rem; color: #8b8e94; }
  `,
})
export class Footer {
  protected readonly year = new Date().getFullYear();
  protected readonly info = GYM_INFO;
}
