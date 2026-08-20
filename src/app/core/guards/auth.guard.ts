import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  // Check whether user is logged in
  if (authService.isLoggedIn()) {
    return true;
  }

  // Not logged in
  return router.createUrlTree(['/login']);
};