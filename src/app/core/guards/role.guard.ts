import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth.service';


export const authGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);


  // =========================
  // CHECK LOGIN
  // =========================

  if (authService.isLoggedIn()) {

    return true;

  }


  // =========================
  // NOT LOGGED IN
  // =========================

  return router.createUrlTree([
    '/login'
  ]);

};