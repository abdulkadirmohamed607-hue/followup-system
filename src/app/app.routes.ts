import { Routes } from '@angular/router';

import { Dashboard } from './features/dashboard/dashboard';

import { UserList } from './features/users/user-list/user-list';

import { AddUser } from './features/users/add-user/add-user';

import { UserUpload } from './features/users/user-upload/user-upload';

import { UserManagement } from './features/user-management/user-management';

import { VisitorCheck } from './features/followup/visitor-check/visitor-check';

import { Reports } from './features/reports/reports';

import { Login } from './features/auth/login/login';

import { ChangePassword } from './features/auth/change-password/change-password';

import { passwordChangeGuard } from './core/guards/password-change.guard';

import { authGuard } from './core/guards/auth.guard';

import { permissionGuard } from './core/guards/permission.guard';

import { SystemSettings } from './features/system-settings/system-settings';


export const routes: Routes = [

  // ==========================================
  // LOGIN
  // ==========================================

  {
    path: 'login',
    component: Login
  },


  // ==========================================
  // CHANGE PASSWORD
  //
  // IMPORTANT:
  // Do NOT add passwordChangeGuard here.
  // A user who must change password needs
  // to access this page.
  // ==========================================

  {
    path: 'change-password',

    canActivate: [
      authGuard
    ],

    component: ChangePassword
  },


  // ==========================================
  // PROTECTED APPLICATION
  // ==========================================

  {
    path: '',

    canActivate: [
      authGuard,
      passwordChangeGuard
    ],

    children: [

      // ======================================
      // DEFAULT
      // ======================================

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },


      // ======================================
      // DASHBOARD
      //
      // All authenticated users can access.
      // ======================================

      {
        path: 'dashboard',
        component: Dashboard
      },


      // ======================================
      // PATIENTS
      //
      // Permission:
      // PATIENTS
      // ======================================

      {
        path: 'users',

        canActivate: [
          permissionGuard('PATIENTS')
        ],

        component: UserList
      },


      // ======================================
      // ADD PATIENT
      //
      // Same Patients permission.
      // ======================================

      {
        path: 'users/add',

        canActivate: [
          permissionGuard('PATIENTS')
        ],

        component: AddUser
      },


      // ======================================
      // UPLOAD PATIENTS
      //
      // Permission:
      // USER_UPLOAD
      // ======================================

      {
        path: 'upload',

        canActivate: [
          permissionGuard('USER_UPLOAD')
        ],

        component: UserUpload
      },


      // ======================================
      // USER MANAGEMENT
      //
      // Permission:
      // USER_MANAGEMENT
      // ======================================

      {
        path: 'user-management',

        canActivate: [
          permissionGuard('USER_MANAGEMENT')
        ],

        component: UserManagement
      },


      // ======================================
      // VISITOR CHECK
      //
      // Permission:
      // VISITOR_CHECK
      // ======================================

      {
        path: 'visitor-check',

        canActivate: [
          permissionGuard('VISITOR_CHECK')
        ],

        component: VisitorCheck
      },


      // ======================================
      // REPORTS
      //
      // Permission:
      // REPORTS
      // ======================================

      {
        path: 'reports',

        canActivate: [
          permissionGuard('REPORTS')
        ],

        component: Reports
      },


      // ======================================
      // SYSTEM SETTINGS
      //
      // Permission:
      // SYSTEM_SETTINGS
      // ======================================

      {
        path: 'system-settings',

        canActivate: [
          permissionGuard('SYSTEM_SETTINGS')
        ],

        component: SystemSettings
      }

    ]

  },


  // ==========================================
  // UNKNOWN URL
  // ==========================================

  {
    path: '**',
    redirectTo: 'login'
  }

];