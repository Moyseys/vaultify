import { Injectable, inject } from '@angular/core';
import { CryptoService } from './crypto.service';
import { SecretKeyPayload } from '../apis/SecretKey.api';
import { environment } from 'src/environments/environment';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class SecretKeyService {
  private readonly cryptoService = inject(CryptoService);
  private readonly toastService = inject(ToastService);
  private readonly config = environment.crypto;

  async genSecretKey(secretKeyInput: string): Promise<SecretKeyPayload | void> {
    const salt = this.cryptoService.generateRandomBytes(this.config.saltSize);
    const kek = await this.cryptoService.deriveKeyFromPassword(
      secretKeyInput,
      salt,
      this.config.derivationAlgorithm,
      this.config.iterations,
      this.config.hash,
      this.config.algorithm,
      this.config.length,
    );

    const dek = await this.cryptoService.generateNewVaultKey(
      this.config.algorithm,
      this.config.length,
    );
    const { key, iv } = await this.cryptoService.wrapKey(
      dek,
      kek,
      this.config.algorithm,
      this.config.saltSize,
    );

    const saltBase64 = this.cryptoService.bufferToBase64(salt);
    const payload: SecretKeyPayload = {
      key,
      keySize: this.config.length,
      keyIV: iv,
      salt: saltBase64,
      saltSize: this.config.saltSize,
      iterations: this.config.iterations,
      algorithm: this.config.algorithm,
      hashAlgorithm: this.config.hash,
      derivationAlgorithm: this.config.derivationAlgorithm,
    };
    return payload;
  }
}
