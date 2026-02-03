import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseHttpClientApi } from '../apis/base-http-client.api';
import { AuthApi } from '../apis/Auth.api';
import { SecretKeyApi } from '../apis/SecretKey.api';
import { Observable, of } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';

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
  private readonly secretKeyApi = inject(SecretKeyApi);

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

  login(email: string, password: string): Observable<LoginWithSecretKeyCheck> {
    return this.authApi.login(email, password).pipe(
      tap(() => this.authState.set(true)),
      switchMap((user) => {
        return this.secretKeyApi.checkSecretKeyExists().pipe(
          tap((response) => {
            if (!response.exists) {
              console.warn('User does not have a secret key configured');
            }
          }),
          catchError(() => {
            return of({ exists: false });
          }),
          switchMap((secretKeyResponse) => {
            return of({
              user,
              hasSecretKey: secretKeyResponse.exists,
            });
          }),
        );
      }),
    );
  }

  logout(): Observable<void> {
    return this.authApi.logout().pipe(
      tap(() => {
        this.authState.set(false);
        this.router.navigate(['/login']);
      }),
    );
  }
}
