import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '@shared/components/button/button.component';
import { CardComponent } from '@shared/components/card/card.component';
import { InputDirective } from '@shared/components/input/input.directive';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

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
        next: () => {
          this.toastService.success('Login realizado com sucesso');
          this.router.navigateByUrl(this.redirectUrl);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.toastService.error(error?.error?.message || 'Falha ao fazer login');
          this.loginForm.reset();
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
