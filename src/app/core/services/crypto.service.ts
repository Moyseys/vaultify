import { Injectable } from '@angular/core';

export class IncorrectPasswordError extends Error {
  constructor(message: string = 'Incorrect Master Password') {
    super(message);
    this.name = 'IncorrectPasswordError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  generateRandomBytes(length: number): ArrayBuffer {
    return window.crypto.getRandomValues(new Uint8Array(length)).buffer;
  }

  bufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  base64ToBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async generateNewVaultKey(algorithm: string, length: number): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
      {
        name: algorithm,
        length: length,
      },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  async deriveKeyFromPassword(
    password: string,
    salt: ArrayBuffer,
    derivationAlgorithm: string,
    iterations: number,
    hash: string,
    algorithm: string,
    length: number,
  ): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      derivationAlgorithm,
      false,
      ['deriveKey'],
    );

    return window.crypto.subtle.deriveKey(
      {
        name: derivationAlgorithm,
        salt: salt,
        iterations: iterations,
        hash: hash,
      },
      keyMaterial,
      { name: algorithm, length: length },
      false,
      ['wrapKey', 'unwrapKey'],
    );
  }

  async wrapKey(
    dek: CryptoKey,
    kek: CryptoKey,
    algorithm: string,
    ivSize: number,
  ): Promise<{ key: string; iv: string }> {
    const iv = this.generateRandomBytes(ivSize);

    const wrappedBuffer = await window.crypto.subtle.wrapKey(
      'raw',
      dek, //(SecretKey)
      kek, // (Master Password derivada)
      {
        name: algorithm,
        iv: iv,
      },
    );

    return {
      key: this.bufferToBase64(wrappedBuffer),
      iv: this.bufferToBase64(iv),
    };
  }

  async unwrapKey(
    wrappedKeyBase64: string,
    kek: CryptoKey,
    ivBase64: string,
    algorithm: string,
    length: number,
  ): Promise<CryptoKey> {
    try {
      const wrappedKey = this.base64ToBuffer(wrappedKeyBase64);
      const iv = this.base64ToBuffer(ivBase64);

      return await window.crypto.subtle.unwrapKey(
        'raw',
        wrappedKey,
        kek,
        {
          name: algorithm,
          iv: iv,
        },
        { name: algorithm, length: length },
        true,
        ['encrypt', 'decrypt'],
      );
    } catch (error) {
      throw new IncorrectPasswordError('Failed to unwrap key. The master password is incorrect.');
    }
  }

  async encryptData(
    data: string,
    dek: CryptoKey,
    algorithm: string,
    ivSize: number,
  ): Promise<{ cipherText: string; iv: string }> {
    const iv = this.generateRandomBytes(ivSize);
    const enc = new TextEncoder();

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: algorithm,
        iv: iv,
      },
      dek,
      enc.encode(data),
    );

    return {
      cipherText: this.bufferToBase64(encryptedBuffer),
      iv: this.bufferToBase64(iv),
    };
  }

  async decryptData(
    cipherTextBase64: string,
    dek: CryptoKey,
    ivBase64: string,
    algorithm: string,
  ): Promise<string> {
    try {
      const cipherText = this.base64ToBuffer(cipherTextBase64);
      const iv = this.base64ToBuffer(ivBase64);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: algorithm,
          iv: iv,
        },
        dek,
        cipherText,
      );

      const dec = new TextDecoder();
      return dec.decode(decryptedBuffer);
    } catch (error) {
      throw new IncorrectPasswordError('Failed to decrypt data. The master password is incorrect.');
    }
  }
}
