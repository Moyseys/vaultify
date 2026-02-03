import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import type { ApiErrorResponse } from '../interfaces/api-error-response.interface';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';
      let apiError: Partial<ApiErrorResponse> | null = null;

      if (error.error && typeof error.error === 'object') {
        apiError = error.error as Partial<ApiErrorResponse>;

        if (apiError.detail) {
          errorMessage = apiError.detail;
        } else if (typeof error.error.message === 'string') {
          errorMessage = error.error.message;
        }
      }

      switch (error.status) {
        case 0:
          errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
          toastService.error(errorMessage);
          break;

        case 400:
          toastService.error(errorMessage);
          break;

        case 401:
          // Unauthorized - httpOnly cookie expired or invalid
          // Skip error message if this is an auth check request
          if (req.headers.get('X-Skip-Auth-Error') !== 'true') {
            toastService.warning('Sua sessão expirou. Faça login novamente.');
            router.navigate(['/login']);
          }
          break;

        case 403:
          errorMessage = apiError?.detail || 'Você não tem permissão para acessar este recurso.';
          toastService.error(errorMessage);
          break;

        case 404:
          toastService.error(errorMessage);
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = apiError?.detail || 'Erro no servidor. Tente novamente mais tarde.';
          toastService.error(errorMessage);
          break;

        default:
          toastService.error(errorMessage);
          break;
      }

      return throwError(() => error);
    }),
  );
};
