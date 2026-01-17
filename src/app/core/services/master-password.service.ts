import { Injectable, signal } from '@angular/core';
import { Subject, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MasterPasswordService {
  private requestSubject = new Subject<string | null>();

  isModalOpen = signal(false);
  modalPurpose = signal<string>('');

  /**
   * Solicita o master password ao usuário via modal
   * @param purpose Descrição do propósito (ex: "visualizar a senha", "copiar a senha")
   * @returns Promise com o master password ou null se cancelado
   */
  async requestMasterPassword(purpose: string): Promise<string | null> {
    this.modalPurpose.set(purpose);
    this.isModalOpen.set(true);

    const password = await firstValueFrom(this.requestSubject);

    this.isModalOpen.set(false);
    this.modalPurpose.set('');

    return password;
  }

  /**
   * Confirma o master password fornecido pelo usuário
   * @param password Master password inserido
   */
  confirmPassword(password: string): void {
    this.requestSubject.next(password);
  }

  /**
   * Cancela a solicitação do master password
   */
  cancelRequest(): void {
    this.requestSubject.next(null);
  }
}
