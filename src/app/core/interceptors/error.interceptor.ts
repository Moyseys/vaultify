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
      let errorMessage = 'An unexpected error occurred. Please try again.';
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
          errorMessage = 'Unable to connect to server. Please check your connection.';
          toastService.error(errorMessage);
          break;

        case 400:
          toastService.error(errorMessage);
          break;

        case 401:
          const currentUrl = router.url;
          const isInApp = !currentUrl.includes('/login') && !currentUrl.includes('/register');

          if (isInApp) {
            toastService.warning('Your session has expired. Please log in again.');
            router.navigate(['/login']);
          }
          break;

        case 403:
          errorMessage = apiError?.detail || 'You do not have permission to access this resource.';
          toastService.error(errorMessage);
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = apiError?.detail || 'Server error. Please try again later.';
          toastService.error(errorMessage);
          break;

        default:
          break;
      }

      return throwError(() => error);
    }),
  );
};
