import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, filter, of, switchMap, tap } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { Goal, GOAL_LABELS, Slot } from '../../core/models';
import { loadable } from '../../core/resource';
import { dateInRange, isoDateFromToday, PHONE_PATTERN } from '../../core/validators';
import { FcfaPipe } from '../../shared/fcfa.pipe';

@Component({
  selector: 'app-booking',
  imports: [ReactiveFormsModule, RouterLink, FcfaPipe],
  templateUrl: './booking.html',
  styleUrl: './booking.scss',
})
export class Booking {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  /** ?formule=4 depuis la page des formules */
  readonly formule = input<string>();

  protected readonly plans = loadable(this.api.getPlans());
  protected readonly goals = Object.entries(GOAL_LABELS) as [Goal, string][];
  protected readonly minDate = isoDateFromToday(1);
  protected readonly maxDate = isoDateFromToday(30);

  protected readonly slots = signal<Slot[]>([]);
  protected readonly slotsLoading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmed = signal<{ date: string; time: string } | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    date: ['', [Validators.required, dateInRange(1, 30)]],
    time: [{ value: '', disabled: true }, Validators.required],
    goal: ['' as Goal | '', Validators.required],
    planId: ['' as string],
  });

  constructor() {
    // Charge les créneaux libres à chaque changement de date valide.
    this.form.controls.date.valueChanges
      .pipe(
        distinctUntilChanged(),
        tap(() => {
          this.form.controls.time.reset({ value: '', disabled: true });
          this.slots.set([]);
        }),
        filter(() => this.form.controls.date.valid),
        tap(() => this.slotsLoading.set(true)),
        switchMap((date) =>
          this.api.getAvailability(date).pipe(catchError(() => of({ date, slots: [] as Slot[] }))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ slots }) => {
        this.slotsLoading.set(false);
        this.slots.set(slots);
        if (slots.some((s) => s.remaining > 0)) this.form.controls.time.enable();
      });
  }

  ngOnInit() {
    const planId = this.formule();
    if (planId && /^\d+$/.test(planId)) this.form.controls.planId.setValue(planId);
  }

  protected hasError(name: keyof typeof this.form.controls, error: string): boolean {
    const control = this.form.controls[name];
    return control.touched && control.hasError(error);
  }

  protected formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  protected submit() {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createBooking({
        fullName: value.fullName.trim(),
        email: value.email.trim(),
        phone: value.phone.trim(),
        date: value.date,
        time: value.time,
        goal: value.goal as Goal,
        planId: value.planId ? Number(value.planId) : null,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.confirmed.set({ date: value.date, time: value.time });
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(apiErrorMessage(err));
        },
      });
  }
}
