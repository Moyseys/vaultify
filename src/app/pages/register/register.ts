import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonComponent } from '@shared/components/button/button.component';
import { CardComponent } from '@shared/components/card/card.component';
import { InputDirective } from '@shared/components/input/input.directive';
import { PayloadCreateUser, UsersApi } from 'src/app/core/apis/Users.api';
import { ToastService } from 'src/app/core/services/toast.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { AnalyticsEvent } from 'src/app/core/interfaces/analytics.interface';

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    InputDirective,
    RouterLink,
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApi);
  private readonly toastService = inject(ToastService);
  private readonly analyticsService = inject(AnalyticsService);

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  loading = signal(false);

  readonly registerForm = this.fb.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [this.passwordMatchValidator],
    },
  );

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  get formValue(): PayloadCreateUser {
    return {
      name: this.registerForm.controls.name.value,
      email: this.registerForm.controls.email.value,
      password: this.registerForm.controls.password.value,
    } as PayloadCreateUser;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading.set(true);
      this.usersApi.register(this.formValue).subscribe({
        next: () => {
          this.loading.set(false);
          this.toastService.show('Account created successfully!', 'success');
          this.analyticsService.trackEvent(AnalyticsEvent.REGISTER_SUCCESS, {
            email: this.formValue.email,
          });
          this.router.navigate(['/login'], { queryParams: { firstAccess: true } });
        },
        error: (err: any) => {
          this.loading.set(false);
          let errorMsg = err?.error?.message || 'Registration error';

          if (err.status === 409) errorMsg = 'Email already registered';

          this.analyticsService.trackEvent(AnalyticsEvent.REGISTER_FAILED);
          this.toastService.show(errorMsg, 'error');
        },
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  get name() {
    return this.registerForm.get('name');
  }
  get email() {
    return this.registerForm.get('email');
  }
  get password() {
    return this.registerForm.get('password');
  }
  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get hasPasswordMismatch(): boolean {
    return (
      (this.registerForm.hasError('passwordMismatch') &&
        (this.confirmPassword?.dirty || this.confirmPassword?.touched)) ||
      false
    );
  }
}
