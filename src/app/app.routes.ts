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

import { adminGuard } from './core/guards/admin.guard';


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
  // to be able to access this page.
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
  //
  // Both guards run here.
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
      // ======================================

      {
        path: 'dashboard',
        component: Dashboard
      },


      // ======================================
      // PATIENTS
      // ======================================

      {
        path: 'users',

        canActivate: [
          adminGuard
        ],

        component: UserList
      },


      // ======================================
      // ADD PATIENT
      // ======================================

      {
        path: 'users/add',

        canActivate: [
          adminGuard
        ],

        component: AddUser
      },


      // ======================================
      // UPLOAD PATIENTS
      // ======================================

      {
        path: 'upload',

        canActivate: [
          adminGuard
        ],

        component: UserUpload
      },


      // ======================================
      // USER MANAGEMENT
      // ADMIN ONLY
      // ======================================

      {
        path: 'user-management',

        canActivate: [
          adminGuard
        ],

        component: UserManagement
      },


      // ======================================
      // VISITOR CHECK
      // ======================================

      {
        path: 'visitor-check',
        component: VisitorCheck
      },


      // ======================================
      // REPORTS
      // ADMIN ONLY
      // ======================================

      {
        path: 'reports',

        canActivate: [
          adminGuard
        ],

        component: Reports
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