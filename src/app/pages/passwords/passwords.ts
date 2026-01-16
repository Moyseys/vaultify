import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecretsApi } from '../../core/apis/Secrets.api';
import { SecretListInterface } from '../../core/interfaces/secretList.interface';
import { SecretInterface } from '../../core/interfaces/secret.interface';
import { PaginationComponent } from 'src/app/core/components/pagination/pagination.component';
import { ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { PaginationUtils } from 'src/app/core/utils/pagination.util';
import { ButtonComponent } from '@shared/components/button/button.component';
import { PasswordFormComponent } from './password-form/password-form';

@Component({
  selector: 'app-passwords',
  imports: [
    CommonModule,
    PaginationComponent,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    ButtonComponent,
    PasswordFormComponent,
  ],
  templateUrl: './passwords.html',
  styleUrl: './passwords.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SecretsApi],
})
export class Passwords implements OnInit {
  private readonly secretsApi = inject(SecretsApi);

  secrets = signal<SecretListInterface[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  pagination = new PaginationUtils();

  isModalOpen = signal(false);
  selectedSecret = signal<SecretInterface | null>(null);

  openCreateModal(): void {
    this.selectedSecret.set(null);
    this.isModalOpen.set(true);
  }

  ngOnInit() {
    this.pagination.form.valueChanges.subscribe((pagination) => {
      console.log(pagination);
      if (!pagination) return;
      this.loadSecrets();
    });
    this.loadSecrets();
  }

  loadSecrets() {
    this.isLoading.set(true);
    this.error.set(null);

    const { page, size } = this.pagination.getValue();
    this.secretsApi.get(page, size, 'title,asc').subscribe({
      next: (response) => {
        this.pagination.setPeagleableValue(response);
        this.secrets.set(response.items);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Erro ao carregar senhas');
        this.isLoading.set(false);
        console.error('Error loading secrets:', err);
      },
    });
  }

  openSecretDetails(secretId: string): void {
    this.isLoading.set(true);

    const master = window.prompt('Digite sua Master Password para visualizar a senha:');
    if (!master) {
      this.isLoading.set(false);
      return;
    }

    this.secretsApi.getById(secretId, master).subscribe({
      next: (secret) => {
        this.selectedSecret.set(secret);
        this.isModalOpen.set(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar senha:', err);
        this.isLoading.set(false);
        window.alert('Erro ao carregar senha. Verifique sua Master Password.');
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

  async copyPassword(event: Event, secretId: string): Promise<void> {
    event.stopPropagation();

    const master = window.prompt('Digite sua Master Password para copiar a senha:');
    if (master === null) return;

    this.secretsApi.getById(secretId, master).subscribe({
      next: async (secret) => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(secret.password);
            alert('Senha copiada!');
          } else {
            const textarea = document.createElement('textarea');
            textarea.value = secret.password;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Senha copiada!');
          }
        } catch (err) {
          console.error('Erro ao copiar senha:', err);
          alert('Erro ao copiar senha');
        }
      },
      error: (err) => {
        console.error('Erro ao buscar senha:', err);
      },
    });
  }
}
