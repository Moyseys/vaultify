import { Injectable, signal } from '@angular/core';
import { Subject, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MasterPasswordService {
  private requestSubject = new Subject<string | null>();

  isModalOpen = signal(false);
  modalPurpose = signal<string>('');

  async requestMasterPassword(purpose: string): Promise<string | null> {
    this.modalPurpose.set(purpose);
    this.isModalOpen.set(true);

    const password = await firstValueFrom(this.requestSubject);

    this.isModalOpen.set(false);
    this.modalPurpose.set('');

    return password;
  }

  confirmPassword(password: string): void {
    this.requestSubject.next(password);
  }

  cancelRequest(): void {
    this.requestSubject.next(null);
  }
}
