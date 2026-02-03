import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isAuthCheckDone()) {
    return true;
  }

  return authService.isLoggedIn()
    ? true
    : router.createUrlTree(['/login'], {
        queryParams: { redirect: state.url },
      });
};
