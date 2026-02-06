import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  effect,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SecretsApi } from '../../../core/apis/Secrets.api';
import { SecretInterface } from '../../../core/interfaces/secret.interface';
import { MasterPasswordService } from '../../../core/services/master-password.service';
import { MasterPasswordModalComponent } from '../../../core/components/master-password-modal/master-password-modal';
import { SecretService } from '../../../core/services/secret.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { IncorrectPasswordError } from '../../../core/services/crypto.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AnalyticsEvent } from '../../../core/interfaces/analytics.interface';

export interface FormPayload {
  title: string;
  username: string;
  password: string;
}

@Component({
  selector: 'app-password-form',
  imports: [CommonModule, ReactiveFormsModule, MasterPasswordModalComponent],
  templateUrl: './password-form.html',
  styleUrl: './password-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly secretsApi = inject(SecretsApi);
  private readonly secretService = inject(SecretService);
  readonly masterPasswordService = inject(MasterPasswordService);
  readonly toastService = inject(ToastService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly secret = input<SecretInterface | null>(null);
  readonly close = output<void>();
  readonly saved = output<void>();

  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);
  readonly showPassword = signal(false);
  readonly copyMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    effect(
      () => {
        const secretValue = this.secret();
        if (secretValue) {
          this.isEditMode.set(true);
          this.form.patchValue({
            title: secretValue.title,
            username: secretValue.username,
            password: secretValue.cipherPassword,
          });
        } else {
          this.isEditMode.set(false);
          this.form.reset();
        }
      },
      { allowSignalWrites: true },
    );
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  generatePassword(): void {
    const length = 16;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    this.form.patchValue({ password });
  }

  async copyToClipboard(text: string | null | undefined, field: string): Promise<void> {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      this.copyMessage.set(`${field} copied!`);
      setTimeout(() => this.copyMessage.set(null), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Please fill in all fields correctly.');
      return;
    }

    try {
      const master = await this.masterPasswordService.requestMasterPassword(
        `${this.isEditMode() ? 'save' : 'create'} the password`,
      );
      if (!master) return;

      this.isSaving.set(true);

      const { title, username, password } = this.form.value;
      const payload: FormPayload = {
        title: title!,
        username: username!,
        password: password!,
      };

      if (this.isEditMode()) await this.updateSecret(payload, master);
      else await this.createSecret(payload, master);
    } catch (error) {
      this.isSaving.set(false);
      this.toastService.error('Unexpected error. Please try again.');
    }
  }

  private async createSecret(payload: FormPayload, masterPassword: string) {
    this.secretService.create(payload, masterPassword).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success('Password created successfully!');
        this.analyticsService.trackEvent(AnalyticsEvent.PASSWORD_CREATED, {
          title: payload.title,
        });
        this.saved.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.handleError(err);
      },
    });
  }

  private async updateSecret(payload: FormPayload, masterPassword: string) {
    const secretId = this.secret()?.id;
    if (!secretId) return;
    this.secretService.update(secretId, payload, masterPassword).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success('Password updated successfully!');
        this.analyticsService.trackEvent(AnalyticsEvent.PASSWORD_UPDATED, {
          title: payload.title,
        });
        this.saved.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error updating password:', err);
        this.isSaving.set(false);
        this.handleError(err);
      },
    });
  }

  private handleError(error: any): void {
    if (error instanceof IncorrectPasswordError || error?.name === IncorrectPasswordError.name) {
      this.toastService.error('Incorrect Master Password.');
      return;
    }

    const errorMessage = error?.message || '';
    if (error.status === 404) {
      this.toastService.error('You need to set up your master key first. Go to settings.');
      return;
    }
  }

  onDelete(): void {
    if (!this.isEditMode() || !this.secret()) return;

    const secretTitle = this.form.value.title || 'this password';
    const confirmed = window.confirm(
      `Are you sure you want to delete "${secretTitle}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    this.isSaving.set(true);

    const secretId = this.secret()?.id;
    if (!secretId) return;
    this.secretsApi.delete(secretId).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saved.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Erro ao excluir senha:', err);
        this.isSaving.set(false);
        window.alert('Erro ao excluir senha. Tente novamente.');
      },
    });
  }

  get title() {
    return this.form.get('title');
  }

  get username() {
    return this.form.get('username');
  }

  get password() {
    return this.form.get('password');
  }
}
