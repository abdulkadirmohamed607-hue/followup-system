
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


export const authGuard: CanActivateFn = () => {

  const authService = inject(AuthService);

  const router = inject(Router);

  const platformId = inject(PLATFORM_ID);


  // ==========================================
  // SSR
  // ==========================================
  //
  // During server-side rendering, localStorage
  // is not available.
  //
  // Therefore, do NOT redirect to login while
  // Angular is rendering the page on the server.
  //
  // The browser will perform the real authentication
  // check after hydration.
  // ==========================================

  if (!isPlatformBrowser(platformId)) {
    return true;
  }


  // ==========================================
  // BROWSER AUTH CHECK
  // ==========================================

  if (authService.isLoggedIn()) {
    return true;
  }


  // ==========================================
  // NOT LOGGED IN
  // ==========================================

  return router.createUrlTree([
    '/login'
  ]);

};