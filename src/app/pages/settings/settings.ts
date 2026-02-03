import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SecretKeyApi } from 'src/app/core/apis/SecretKey.api';
import { ToastService } from 'src/app/core/services/toast.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputDirective } from '@shared/components/input/input.directive';
import { NgClass } from '@angular/common';

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

  onSubmitSecretKey(): void {
    if (this.secretKeyForm.valid) {
      this.creatingSecretKey.set(true);
      const secretKeyValue = this.secretKeyForm.controls.secretKey.value || '';
      this.secretKeyApi.createSecretKey({ key: secretKeyValue }).subscribe({
        next: () => {
          this.creatingSecretKey.set(false);
          this.toastService.show('Secret Key configurado com sucesso!', 'success');
          this.hasSecretKey.set(true);
          this.secretKeyForm.reset();
        },
        error: () => this.creatingSecretKey.set(false),
      });
    } else {
      this.secretKeyForm.markAllAsTouched();
    }
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
