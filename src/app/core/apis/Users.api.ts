import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { BaseHttpClientApi } from './base-http-client.api';
import { Injectable } from '@angular/core';

export interface PayloadCreateUser {
  email: string;
  name: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersApi extends BaseHttpClientApi {
  private readonly resource = `${environment.api.url}/account/v1/users`;

  register(payload: PayloadCreateUser): Observable<void> {
    return this.http.post<void>(this.resource, payload);
  }
}
