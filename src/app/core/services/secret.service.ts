import { inject, Injectable, signal } from '@angular/core';
import { SecretsApi } from '../apis/Secrets.api';
import { of, switchMap, from, Observable, firstValueFrom } from 'rxjs';
import { SecretKeyApi, SecretKeyPayload } from '../apis/SecretKey.api';
import { CryptoService } from './crypto.service';
import { FormPayload } from 'src/app/pages/passwords/password-form/password-form';
import { SecretInterface } from '../interfaces/secret.interface';

@Injectable({ providedIn: 'root' })
export class SecretService {
  private secretsApi = inject(SecretsApi);
  private secretKeyApi = inject(SecretKeyApi);
  private crypto = inject(CryptoService);

  private secretKey = signal<SecretKeyPayload | null>(null);
  private cachedMasterPassword = signal<string | null>(null);

  setMasterPassword(masterPassword: string): void {
    this.cachedMasterPassword.set(masterPassword);
  }

  getMasterPassword(): string | null {
    return this.cachedMasterPassword();
  }

  clearMasterPassword(): void {
    this.cachedMasterPassword.set(null);
  }

  hasMasterPassword(): boolean {
    return this.cachedMasterPassword() !== null;
  }

  update(secretId: string, secretData: FormPayload, masterPassword: string): Observable<any> {
    return this.getSecretKey().pipe(
      switchMap((secretKey) => {
        if (!secretKey) throw new Error('Not found secretKey');
        return from(this.encryptAndUpdate(secretId, secretData, masterPassword, secretKey));
      }),
    );
  }

  private async encryptAndUpdate(
    secretId: string,
    secretData: FormPayload,
    masterPassword: string,
    secretKey: SecretKeyPayload,
  ): Promise<any> {
    const encryptedPayload = await this.encryptSecretData(secretData, masterPassword, secretKey);

    const result = await firstValueFrom(this.secretsApi.update(secretId, encryptedPayload));

    this.setMasterPassword(masterPassword);

    return result;
  }

  listSecrets(page?: number, size?: number, sort?: string, search?: string) {
    return this.secretsApi.get(page, size, sort, search);
  }

  getById(secretId: string, masterPassword: string): Observable<SecretInterface> {
    return this.getSecretKey().pipe(
      switchMap((secretKey) => {
        if (!secretKey) throw new Error('Not found secretKey');
        return from(this.getAndDecrypt(secretId, masterPassword, secretKey));
      }),
    );
  }

  private async getAndDecrypt(
    secretId: string,
    masterPassword: string,
    secretKey: SecretKeyPayload,
  ): Promise<SecretInterface> {
    const secretData = await firstValueFrom(this.secretsApi.getById(secretId));
    const decryptedPassword = await this.decryptSecretPassword(
      secretData,
      masterPassword,
      secretKey,
    );

    this.setMasterPassword(masterPassword);

    secretData.cipherPassword = decryptedPassword;

    return secretData;
  }

  private async decryptSecretPassword(
    secretData: SecretInterface,
    masterPassword: string,
    secretKey: SecretKeyPayload,
  ): Promise<string> {
    const kek = await this.getKek(secretKey, masterPassword);
    const dek = await this.getDek(secretKey, kek);

    return await this.crypto.decryptData(
      secretData.cipherPassword,
      dek,
      secretData.iv,
      secretKey.algorithm,
    );
  }

  create(secretData: FormPayload, masterPassword: string): Observable<any> {
    return this.getSecretKey().pipe(
      switchMap((secretKey) => {
        if (!secretKey) throw new Error('Not found secretKey');
        return from(this.encryptAndCreate(secretData, masterPassword, secretKey));
      }),
    );
  }

  private async encryptAndCreate(
    secretData: FormPayload,
    masterPassword: string,
    secretKey: SecretKeyPayload,
  ): Promise<any> {
    const encryptedPayload = await this.encryptSecretData(secretData, masterPassword, secretKey);
    const result = await firstValueFrom(this.secretsApi.create(encryptedPayload));

    this.setMasterPassword(masterPassword);

    return result;
  }

  private async encryptSecretData(
    secretData: FormPayload,
    masterPassword: string,
    secretKey: SecretKeyPayload,
  ): Promise<SecretInterface> {
    const kek = await this.getKek(secretKey, masterPassword);
    const dek = await this.getDek(secretKey, kek);

    const encryptedPassword = await this.crypto.encryptData(
      secretData.password,
      dek,
      secretKey.algorithm,
      secretKey.saltSize,
    );

    return {
      title: secretData.title,
      username: secretData.username,
      cipherPassword: encryptedPassword.cipherText,
      iv: encryptedPassword.iv,
    };
  }

  private async getDek(secretKey: SecretKeyPayload, kek: CryptoKey) {
    return await this.crypto.unwrapKey(
      secretKey.key,
      kek,
      secretKey.keyIV,
      secretKey.algorithm,
      secretKey.keySize,
    );
  }

  private async getKek(secretKey: SecretKeyPayload, masterPassword: string): Promise<CryptoKey> {
    const salt = this.crypto.base64ToBuffer(secretKey.salt);

    const kek = await this.crypto.deriveKeyFromPassword(
      masterPassword,
      salt,
      secretKey.derivationAlgorithm,
      secretKey.iterations,
      secretKey.hashAlgorithm,
      secretKey.algorithm,
      secretKey.keySize,
    );

    return kek;
  }

  private getSecretKey(): Observable<SecretKeyPayload | null> {
    if (this.secretKey()) return of(this.secretKey());

    return this.secretKeyApi.checkSecretKeyExists().pipe(
      switchMap((secretKey) => {
        this.secretKey.set(secretKey);
        return of(secretKey);
      }),
    );
  }
}
