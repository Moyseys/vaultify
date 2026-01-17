import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  input,
  effect,
  viewChild,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterPasswordService } from '../../services/master-password.service';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-master-password-modal',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './master-password-modal.html',
  styleUrl: './master-password-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterPasswordModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly masterPasswordService = inject(MasterPasswordService);

  purpose = input<string>('');
  showPassword = signal(false);

  passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');

  form = this.fb.group({
    masterPassword: ['', [Validators.required, Validators.minLength(1)]],
  });

  constructor() {
    effect(() => {
      if (this.masterPasswordService.isModalOpen()) {
        this.form.reset();
        this.showPassword.set(false);
      }
    });

    afterNextRender(() => {
      if (this.masterPasswordService.isModalOpen()) {
        this.passwordInput()?.nativeElement.focus();
      }
    });
  }

  get masterPassword() {
    return this.form.get('masterPassword');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  onSubmit(): void {
    if (this.form.valid) {
      const password = this.form.value.masterPassword!;
      this.masterPasswordService.confirmPassword(password);
    }
  }

  onCancel(): void {
    this.masterPasswordService.cancelRequest();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }
}
