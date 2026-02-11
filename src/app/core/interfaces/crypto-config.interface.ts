export type CryptoAlgorithm = 'AES-GCM' | 'AES-CBC';
export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';
export type DerivationAlgorithm = 'PBKDF2';

export interface CryptoConfig {
  //Symmetric encryption algorithm used for data encryption.
  algorithm: CryptoAlgorithm;

  // Key derivation function algorithm.
  derivationAlgorithm: DerivationAlgorithm;

  // Key length in bits. Higher values provide stronger encryption.
  length: number;

  // Hash algorithm used in key derivation.
  hash: HashAlgorithm;

  // Number of iterations for key derivation. Higher values increase
  iterations: number;

  // Salt size in bytes. Salt is used to prevent rainbow table attacks.
  saltSize: number;
}
