import { Injectable, signal } from '@angular/core';
import { Subject, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MasterPasswordService {
  private requestSubject = new Subject<string | null>();
  private chachedMasterPassword: string | null = null;

  isModalOpen = signal(false);
  modalPurpose = signal<string>('');

  async requestMasterPassword(purpose: string): Promise<string | null> {
    if (this.chachedMasterPassword) return this.chachedMasterPassword;

    this.modalPurpose.set(purpose);
    this.isModalOpen.set(true);

    const password = await firstValueFrom(this.requestSubject);

    this.isModalOpen.set(false);
    this.modalPurpose.set('');
    this.chachedMasterPassword = password;

    return password;
  }

  clearCachedMasterPassword(): void {
    this.chachedMasterPassword = null;
  }

  confirmPassword(password: string): void {
    this.requestSubject.next(password);
  }

  cancelRequest(): void {
    this.requestSubject.next(null);
  }
}
