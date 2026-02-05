import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { BaseHttpClientApi } from './base-http-client.api';

export interface SecretKeyPayload {
  key: string;
  keySize: number;
  keyIV: string;
  salt: string;
  saltSize: number;
  iterations: number;
  algorithm: string;
  hashAlgorithm: string;
  derivationAlgorithm: string;
}

@Injectable({
  providedIn: 'root',
})
export class SecretKeyApi extends BaseHttpClientApi {
  private readonly resource = `${environment.api.url}/vaultify/v1/secret-key`;

  createSecretKey(payload: SecretKeyPayload): Observable<void> {
    return this.http.post<void>(this.resource, payload);
  }

  checkSecretKeyExists(): Observable<SecretKeyPayload> {
    return this.http.get<SecretKeyPayload>(this.resource);
  }
}
