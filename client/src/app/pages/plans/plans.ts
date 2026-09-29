import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Plan } from '../../core/models';
import { loadable } from '../../core/resource';
import { FcfaPipe } from '../../shared/fcfa.pipe';

@Component({
  selector: 'app-plans',
  imports: [RouterLink, FcfaPipe],
  templateUrl: './plans.html',
  styleUrl: './plans.scss',
})
export class Plans {
  protected readonly plans = loadable(inject(ApiService).getPlans());

  protected monthly(plan: Plan): number {
    return Math.round(plan.priceFcfa / plan.durationMonths);
  }

  protected durationLabel(plan: Plan): string {
    return plan.durationMonths === 1 ? '1 mois' : `${plan.durationMonths} mois`;
  }
}
