import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { BaseHttpClientApi } from './base-http-client.api';

export interface CreateSecretKeyPayload {
  key: string;
}

export interface SecretKeyExistsResponse {
  exists: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SecretKeyApi extends BaseHttpClientApi {
  private readonly resource = `${environment.api.url}/vaultify/v1/secret-key`;

  createSecretKey(payload: CreateSecretKeyPayload): Observable<void> {
    return this.http.post<void>(this.resource, payload);
  }

  checkSecretKeyExists(): Observable<SecretKeyExistsResponse> {
    return this.http.get<SecretKeyExistsResponse>(this.resource);
  }
}
