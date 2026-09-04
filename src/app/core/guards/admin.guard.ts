
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


export const adminGuard: CanActivateFn = () => {

  const authService =
    inject(AuthService);

  const router =
    inject(Router);

  const platformId =
    inject(PLATFORM_ID);


  // ==========================================
  // SSR CHECK
  // ==========================================
  //
  // During Server-Side Rendering, localStorage
  // is not available.
  //
  // Do not redirect during SSR.
  // The browser will perform the real check
  // after hydration.
  // ==========================================

  if (!isPlatformBrowser(platformId)) {
    return true;
  }


  // ==========================================
  // BROWSER ADMIN CHECK
  // ==========================================

  if (
    authService.isLoggedIn() &&
    authService.isAdmin()
  ) {

    return true;

  }


  // ==========================================
  // NOT AUTHORIZED
  // ==========================================
  //
  // If the user is logged in but is a normal
  // USER, send them back to Dashboard.
  //
  // If there is no authentication, also send
  // them to Dashboard from this guard.
  //
  // The authGuard on the parent route handles
  // the main authentication check.
  // ==========================================

  return router.createUrlTree([
    '/dashboard'
  ]);

};