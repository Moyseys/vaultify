import { environment } from 'src/environments/environment';
import { Pageable } from '../models/pageable.model';
import { SecretListInterface } from '../interfaces/secretList.interface';
import { SecretInterface } from '../interfaces/secret.interface';
import { BaseHttpClientApi } from './base-http-client.api';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SecretsApi extends BaseHttpClientApi {
  private readonly resource = `${environment.api.url}/vaultify/v1/secrets`;

  get(page?: number, size?: number, sort?: string, search?: string) {
    const params: any = {
      sort: sort || 'title,asc',
    };
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;
    if (search) params.search = search;
    return this.http.get<Pageable<SecretListInterface>>(this.resource, { params });
  }

  create(data: SecretInterface) {
    return this.http.post(this.resource, { ...data });
  }

  getById(secretId: string) {
    return this.http.get<SecretInterface>(`${this.resource}/${secretId}`);
  }

  update(secretId: string, data: SecretInterface) {
    return this.http.patch<SecretInterface>(`${this.resource}/${secretId}`, { ...data });
  }

  delete(secretId: string) {
    const body = { active: false };
    return this.http.patch(`${this.resource}/${secretId}`, body);
  }
}
