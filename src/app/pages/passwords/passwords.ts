import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecretsApi } from '../../core/apis/Secrets.api';
import { SecretListInterface } from '../../core/interfaces/secretList.interface';
import { SecretInterface } from '../../core/interfaces/secret.interface';
import { PaginationComponent } from 'src/app/core/components/pagination/pagination.component';
import { ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { PaginationUtils } from 'src/app/core/utils/pagination.util';
import { ButtonComponent } from '@shared/components/button/button.component';
import { PasswordFormComponent } from './password-form/password-form';
import { MasterPasswordService } from '../../core/services/master-password.service';
import { MasterPasswordModalComponent } from '../../core/components/master-password-modal/master-password-modal';
import { ToastService } from '../../core/services/toast.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { SecretService } from 'src/app/core/services/secret.service';
import { IncorrectPasswordError } from 'src/app/core/services/crypto.service';

@Component({
  selector: 'app-passwords',
  imports: [
    CommonModule,
    PaginationComponent,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    ButtonComponent,
    PasswordFormComponent,
    MasterPasswordModalComponent,
  ],
  templateUrl: './passwords.html',
  styleUrl: './passwords.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SecretsApi],
})
export class Passwords implements OnInit, OnDestroy {
  private readonly secretsService = inject(SecretService);
  readonly masterPasswordService = inject(MasterPasswordService);
  private readonly toastService = inject(ToastService);

  secrets = signal<SecretListInterface[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  pagination = new PaginationUtils();

  isModalOpen = signal(false);
  selectedSecret = signal<SecretInterface | null>(null);

  openCreateModal(): void {
    this.selectedSecret.set(null);
    this.isModalOpen.set(true);
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  ngOnInit() {
    this.searchSubject
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.searchTerm.set(searchTerm);
        const currentPagination = this.pagination.getValue();
        this.pagination.setValue({ ...currentPagination, page: 1 }, false);
        this.loadSecrets();
      });

    this.pagination.form.valueChanges.subscribe((pagination) => {
      console.log(pagination);
      if (!pagination) return;
      this.loadSecrets();
    });
    this.loadSecrets();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSecrets() {
    this.isLoading.set(true);
    this.error.set(null);

    const { page, size } = this.pagination.getValue();
    const search = this.searchTerm();
    this.secretsService.listSecrets(page, size, 'title,asc', search || undefined).subscribe({
      next: (response) => {
        this.pagination.setPeagleableValue(response);
        this.secrets.set(response.items);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error loading passwords');
        this.isLoading.set(false);
        console.error('Error loading secrets:', err);
      },
    });
  }

  async openSecretDetails(secretId: string): Promise<void> {
    const master = await this.masterPasswordService.requestMasterPassword('view the password');
    if (!master) return;

    this.secretsService.getById(secretId, master).subscribe({
      next: (secret) => {
        this.selectedSecret.set(secret);
        this.isModalOpen.set(true);
      },
      error: (error) => {
        this.masterPasswordService.clearCachedMasterPassword();
        if (
          error instanceof IncorrectPasswordError ||
          error?.name === IncorrectPasswordError.name
        ) {
          this.toastService.error('Incorrect Master Password.');
          return;
        }

        const errorMessage = error?.message || '';
        if (error.status === 404) {
          this.toastService.error('You need to set up your master key first. Go to settings.');
          return;
        }
      },
    });
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedSecret.set(null);
  }

  onPasswordSaved(): void {
    this.loadSecrets();
  }
}
