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
import { CryptoConfig } from 'src/app/core/interfaces/crypto-config.interface';
import { environment } from 'src/environments/environment';
import { passwordStrengthValidator } from 'src/app/core/validators';

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

  private readonly defaultCryptoConfig = environment.crypto;

  hasSecretKey = signal(true);
  checkingSecretKey = signal(true);
  creatingSecretKey = signal(false);
  showSecretKey = signal(false);
  showConfirmSecretKey = signal(false);
  showAdvancedSettings = signal(false);

  readonly secretKeyForm = this.fb.group(
    {
      secretKey: [
        '',
        [
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(128),
          passwordStrengthValidator,
        ],
      ],
      confirmSecretKey: ['', [Validators.required]],
      advancedSettings: this.fb.group({
        algorithm: [this.defaultCryptoConfig.algorithm, [Validators.required]],
        derivationAlgorithm: [this.defaultCryptoConfig.derivationAlgorithm, [Validators.required]],
        hash: [this.defaultCryptoConfig.hash, [Validators.required]],
        length: [this.defaultCryptoConfig.length, [Validators.required, Validators.min(128)]],
        iterations: [
          this.defaultCryptoConfig.iterations,
          [Validators.required, Validators.min(100000)],
        ],
        saltSize: [this.defaultCryptoConfig.saltSize, [Validators.required, Validators.min(16)]],
      }),
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

  genCryptoConfigFromForm(): CryptoConfig {
    const advancedSettings = this.secretKeyForm.controls.advancedSettings.value;

    const derivationAlgorithm = (advancedSettings.derivationAlgorithm ||
      this.defaultCryptoConfig.derivationAlgorithm) as CryptoConfig['derivationAlgorithm'];
    const hash = (advancedSettings.hash || this.defaultCryptoConfig.hash) as CryptoConfig['hash'];
    const algorithm = (advancedSettings.algorithm ||
      this.defaultCryptoConfig.algorithm) as CryptoConfig['algorithm'];
    return {
      algorithm,
      derivationAlgorithm,
      hash,
      length: advancedSettings.length || this.defaultCryptoConfig.length,
      iterations: advancedSettings.iterations || this.defaultCryptoConfig.iterations,
      saltSize: advancedSettings.saltSize || this.defaultCryptoConfig.saltSize,
    };
  }

  async onSubmitSecretKey() {
    if (!this.secretKeyForm.valid) return this.secretKeyForm.markAllAsTouched();
    this.creatingSecretKey.set(true);
    const secretKeyValue = this.secretKeyForm.controls.secretKey.value || '';

    const cryptoConfig = this.genCryptoConfigFromForm();

    try {
      const payload = await this.secretKeyService.genSecretKey(secretKeyValue, cryptoConfig);
      if (!payload) {
        this.creatingSecretKey.set(false);
        return;
      }

      return this.secretKeyApi.createSecretKey(payload).subscribe({
        next: () => {
          this.handleCreateKeySuccess();
          this.clearSensitiveFormData();
        },
        error: this.handleCreateKeyError.bind(this),
      });
    } catch (error) {
      console.error('[SecretKey] Creation failed:', error);
      this.handleCreateKeyError();
    }
  }

  private clearSensitiveFormData(): void {
    this.secretKeyForm.patchValue({
      secretKey: '',
      confirmSecretKey: '',
    });
    this.secretKeyForm.markAsPristine();
    this.secretKeyForm.markAsUntouched();
  }

  handleCreateKeySuccess() {
    this.toastService.success('Secret key created successfully.');
    this.hasSecretKey.set(true);
    this.creatingSecretKey.set(false);
  }

  handleCreateKeyError() {
    this.toastService.error('Failed to create secret key. Please try again.');
    this.creatingSecretKey.set(false);
    this.clearSensitiveFormData();
  }

  toggleSecretKeyVisibility(): void {
    this.showSecretKey.set(!this.showSecretKey());
  }

  toggleConfirmSecretKeyVisibility(): void {
    this.showConfirmSecretKey.set(!this.showConfirmSecretKey());
  }

  toggleAdvancedSettings(): void {
    this.showAdvancedSettings.set(!this.showAdvancedSettings());
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
