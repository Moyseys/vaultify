import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseHttpClientApi } from '../apis/base-http-client.api';
import { AuthApi } from '../apis/Auth.api';
import { SecretKeyApi } from '../apis/SecretKey.api';
import { Observable, of } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { SecretService } from './secret.service';

export interface LoginResponse {
  name: string;
  email: string;
}

export interface LoginWithSecretKeyCheck {
  user: LoginResponse;
  hasSecretKey: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService extends BaseHttpClientApi {
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApi);
  private readonly secretService = inject(SecretService);

  private readonly authState = signal<boolean>(false);
  private readonly authCheckDone = signal<boolean>(false);
  readonly isLoggedIn = this.authState.asReadonly();
  readonly isAuthCheckDone = this.authCheckDone.asReadonly();

  constructor() {
    super();
    this.initializeAuthStatus();
  }
  private initializeAuthStatus(): void {
    this.authApi
      .checkAuth()
      .pipe(
        tap(() => {
          this.authState.set(true);
          this.authCheckDone.set(true);
        }),
        catchError(() => {
          this.authState.set(false);
          this.authCheckDone.set(true);
          return of(null);
        }),
      )
      .subscribe();
  }

  get redirectUrl(): string {
    return this.activeRoute.snapshot.queryParams['redirect'] || '/';
  }

  checkAuthStatus(): Observable<any> {
    return this.authApi.checkAuth().pipe(
      tap(() => this.authState.set(true)),
      catchError(() => {
        this.authState.set(false);
        return of(null);
      }),
    );
  }

  login(email: string, password: string) {
    return this.authApi.login(email, password).pipe(tap(() => this.authState.set(true)));
  }

  logout(): Observable<void> {
    return this.authApi.logout().pipe(
      tap(() => {
        this.authState.set(false);
        this.secretService.clearMasterPassword();
        this.router.navigate(['/login']);
      }),
    );
  }
}
