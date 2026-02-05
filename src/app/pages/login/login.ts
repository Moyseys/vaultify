import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '@shared/components/button/button.component';
import { CardComponent } from '@shared/components/card/card.component';
import { InputDirective } from '@shared/components/input/input.directive';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { AnalyticsEvent } from 'src/app/core/interfaces/analytics.interface';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, CardComponent, InputDirective, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly showPassword = signal(false);
  readonly isLoading = signal(false);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(3)]],
  });

  constructor() {
    effect(() => {
      if (this.authService.isAuthCheckDone() && this.authService.isLoggedIn()) {
        this.router.navigateByUrl(this.redirectUrl);
      }
    });
  }

  private get redirectUrl(): string {
    return this.route.snapshot.queryParams['redirect'] || '/';
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      const email = this.loginForm.value.email!;
      const password = this.loginForm.value.password!;
      this.authService.login(email, password).subscribe({
        next: (result) => {
          this.isLoading.set(false);
          this.toastService.success('Login successful');
          this.analyticsService.trackEvent(AnalyticsEvent.LOGIN_SUCCESS, {
            email: email,
          });

          if (this.route.snapshot.queryParams['firstAccess']) {
            this.router.navigateByUrl('/settings');
            this.toastService.warning('Please create a secret key to proceed.');
          } else {
            this.router.navigateByUrl(this.redirectUrl);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.analyticsService.trackEvent(AnalyticsEvent.LOGIN_FAILED);
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }
}
