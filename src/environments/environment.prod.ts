export const environment = {
  api: {
    url: 'https://api.pass.moyseys.com',
  },
  cookies: {
    token: 'sso-token',
  },
  crypto: {
    algorithm: 'AES-GCM',
    derivationAlgorithm: 'PBKDF2',
    length: 256,
    hash: 'SHA-256',
    iterations: 1000000,
    saltSize: 16,
  },
};
