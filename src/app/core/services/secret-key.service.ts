import { Injectable, inject } from '@angular/core';
import { CryptoService } from './crypto.service';
import { SecretKeyPayload } from '../apis/SecretKey.api';
import { environment } from 'src/environments/environment';
import { ToastService } from './toast.service';
import { CryptoConfig } from '../interfaces/crypto-config.interface';

@Injectable({
  providedIn: 'root',
})
export class SecretKeyService {
  private readonly cryptoService = inject(CryptoService);
  private readonly defaultConfig = environment.crypto;

  async genSecretKey(
    secretKeyInput: string,
    config?: CryptoConfig,
  ): Promise<SecretKeyPayload | void> {
    const cryptoConfig = config ?? this.defaultConfig;

    const salt = this.cryptoService.generateRandomBytes(cryptoConfig.saltSize);
    const kek = await this.cryptoService.deriveKeyFromPassword(
      secretKeyInput,
      salt,
      cryptoConfig.derivationAlgorithm,
      cryptoConfig.iterations,
      cryptoConfig.hash,
      cryptoConfig.algorithm,
      cryptoConfig.length,
    );

    const dek = await this.cryptoService.generateNewVaultKey(
      cryptoConfig.algorithm,
      cryptoConfig.length,
    );
    const { key, iv } = await this.cryptoService.wrapKey(
      dek,
      kek,
      cryptoConfig.algorithm,
      cryptoConfig.saltSize,
    );

    const saltBase64 = this.cryptoService.bufferToBase64(salt);
    const payload: SecretKeyPayload = {
      key,
      keySize: cryptoConfig.length,
      keyIV: iv,
      salt: saltBase64,
      saltSize: cryptoConfig.saltSize,
      iterations: cryptoConfig.iterations,
      algorithm: cryptoConfig.algorithm,
      hashAlgorithm: cryptoConfig.hash,
      derivationAlgorithm: cryptoConfig.derivationAlgorithm,
    };
    return payload;
  }
}
