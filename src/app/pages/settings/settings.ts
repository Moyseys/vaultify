import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { SecretKeyApi } from 'src/app/core/apis/SecretKey.api';
import { ToastService } from 'src/app/core/services/toast.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputDirective } from '@shared/components/input/input.directive';
import { NgClass } from '@angular/common';
import { SecretKeyService } from 'src/app/core/services/secret-key.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, ButtonComponent, InputDirective, NgClass],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly secretKeyApi = inject(SecretKeyApi);
  private readonly toastService = inject(ToastService);
  private readonly secretKeyService = inject(SecretKeyService);

  hasSecretKey = signal(true);
  checkingSecretKey = signal(true);
  creatingSecretKey = signal(false);
  showSecretKey = signal(false);
  showConfirmSecretKey = signal(false);

  readonly secretKeyForm = this.fb.group(
    {
      secretKey: ['', [Validators.required, Validators.minLength(6)]],
      confirmSecretKey: ['', [Validators.required]],
    },
    {
      validators: [this.secretKeyMatchValidator],
    },
  );

  private secretKeyMatchValidator(control: AbstractControl): ValidationErrors | null {
    const secretKey = control.get('secretKey')?.value;
    const confirmSecretKey = control.get('confirmSecretKey')?.value;

    if (secretKey && confirmSecretKey && secretKey !== confirmSecretKey) {
      return { secretKeyMismatch: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.checkSecretKey();
  }

  checkSecretKey(): void {
    this.checkingSecretKey.set(true);
    this.secretKeyApi.checkSecretKeyExists().subscribe({
      next: (response) => {
        this.hasSecretKey.set(true);
        this.checkingSecretKey.set(false);
      },
      error: () => {
        this.hasSecretKey.set(false);
        this.checkingSecretKey.set(false);
      },
    });
  }

  async onSubmitSecretKey() {
    if (!this.secretKeyForm.valid) return this.secretKeyForm.markAllAsTouched();

    this.creatingSecretKey.set(true);
    const secretKeyValue = this.secretKeyForm.controls.secretKey.value || '';

    try {
      const payload = await this.secretKeyService.genSecretKey(secretKeyValue);
      if (!payload) return;
      return this.secretKeyApi.createSecretKey(payload).subscribe({
        next: this.handleCreateKeySuccess.bind(this),
        error: this.handleCreateKeyError.bind(this),
      });
    } catch (error) {
      this.handleCreateKeyError();
    }
  }

  handleCreateKeySuccess() {
    this.toastService.success('Secret key created successfully.');
    this.hasSecretKey.set(true);
    this.creatingSecretKey.set(false);
  }

  handleCreateKeyError() {
    this.toastService.error('Failed to create secret key.');
    this.creatingSecretKey.set(false);
  }

  toggleSecretKeyVisibility(): void {
    this.showSecretKey.set(!this.showSecretKey());
  }

  toggleConfirmSecretKeyVisibility(): void {
    this.showConfirmSecretKey.set(!this.showConfirmSecretKey());
  }

  get hasSecretKeyMismatch(): boolean {
    return (
      (this.secretKeyForm.hasError('secretKeyMismatch') &&
        (this.secretKeyForm.get('confirmSecretKey')?.dirty ||
          this.secretKeyForm.get('confirmSecretKey')?.touched)) ||
      false
    );
  }
}
