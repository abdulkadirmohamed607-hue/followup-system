import {
  inject,
  PLATFORM_ID
} from '@angular/core';

import {
  isPlatformBrowser
} from '@angular/common';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  AuthService
} from '../services/auth.service';


export const passwordChangeGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);


  // =========================================================
  // SSR
  // =========================================================

  if (!isPlatformBrowser(platformId)) {
    return true;
  }


  // =========================================================
  // NOT LOGGED IN
  // =========================================================

  if (!authService.isLoggedIn()) {

    return router.createUrlTree([
      '/login'
    ]);

  }


  // =========================================================
  // PASSWORD MUST BE CHANGED
  // =========================================================

  if (authService.mustChangePassword()) {

    return router.createUrlTree([
      '/change-password'
    ]);

  }


  // =========================================================
  // PASSWORD ALREADY CHANGED
  // =========================================================

  return true;

};