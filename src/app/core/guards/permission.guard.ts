import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth.service';
import { ModulePermission } from '../models/auth-user';

export const permissionGuard = (
  requiredPermission: ModulePermission
): CanActivateFn => {

  return () => {

    const authService = inject(AuthService);
    const router = inject(Router);

    // =====================================================
    // USER MUST BE LOGGED IN
    // =====================================================

    if (!authService.isLoggedIn()) {
      return router.createUrlTree(['/login']);
    }

    // =====================================================
    // ADMIN HAS ALL PERMISSIONS
    // =====================================================

    if (authService.isAdmin()) {
      return true;
    }

    // =====================================================
    // CHECK MODULE PERMISSION
    // =====================================================

    if (
      authService.hasPermission(requiredPermission)
    ) {
      return true;
    }

    // =====================================================
    // NO PERMISSION
    // =====================================================

    return router.createUrlTree(['/dashboard']);
  };
};