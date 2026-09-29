import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiErrorMessage } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { PHONE_PATTERN } from '../../core/validators';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.html',
  styles: `
    .contact { display: grid; gap: 40px; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); align-items: start; }
    .contact__card { padding: 28px; }
    .info { list-style: none; padding: 0; margin: 24px 0 0; display: grid; gap: 16px; }
    .info strong { display: block; font-family: var(--font-display); font-size: 1.2rem; text-transform: uppercase; }
    small { font-weight: 400; color: var(--text-muted); }
    @media (max-width: 900px) { .contact { grid-template-columns: 1fr; } }
  `,
})
export class Contact {
  private readonly api = inject(ApiService);
  protected readonly sent = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(PHONE_PATTERN)],
    content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  protected submit() {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.api.sendMessage(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sent.set(true);
        this.form.reset();
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
