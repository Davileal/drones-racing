import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authToken = localStorage.getItem('auth_token');

  if (authToken) {
    return true;
  }

  return router.parseUrl('/login');
};
