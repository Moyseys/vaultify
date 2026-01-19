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
  readonly masterPasswordService = inject(MasterPasswordService);

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
            password: secretValue.password,
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
      this.copyMessage.set(`${field} copiado!`);
      setTimeout(() => this.copyMessage.set(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const master = await this.masterPasswordService.requestMasterPassword(
      `${this.isEditMode() ? 'salvar' : 'criar'} a senha`,
    );
    if (!master) return;

    this.isSaving.set(true);

    const formValue = this.form.value;
    const payload = {
      title: formValue.title!,
      username: formValue.username!,
      password: formValue.password!,
    };

    const operation = this.isEditMode()
      ? this.secretsApi.update(this.secret()!.id, payload, master)
      : this.secretsApi.create(payload, master);

    operation.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saved.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Erro ao salvar senha:', err);
        this.isSaving.set(false);
        window.alert('Erro ao salvar senha. Verifique sua Master Password e tente novamente.');
      },
    });
  }

  onDelete(): void {
    if (!this.isEditMode() || !this.secret()) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir "${this.form.value.title}"? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) return;

    this.isSaving.set(true);

    this.secretsApi.delete(this.secret()!.id).subscribe({
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
