import { Routes } from '@angular/router';

import { Dashboard } from './features/dashboard/dashboard';

import { UserList } from './features/users/user-list/user-list';

import { AddUser } from './features/users/add-user/add-user';

import { UserUpload } from './features/users/user-upload/user-upload';

import { VisitorCheck } from './features/followup/visitor-check/visitor-check';

import { Reports } from './features/reports/reports';

import { Login } from './features/auth/login/login';

import { Register } from './features/auth/register/register';

import { authGuard } from './core/guards/auth.guard';


export const routes: Routes = [

  // ==========================================
  // PUBLIC AUTHENTICATION PAGES
  // ==========================================

  {
    path: 'login',
    component: Login
  },

  {
    path: 'register',
    component: Register
  },


  // ==========================================
  // PROTECTED APPLICATION
  // ==========================================

  {
    path: '',

    canActivate: [
      authGuard
    ],

    children: [

      // ======================================
      // DEFAULT PAGE
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
      // USERS
      // ======================================

      {
        path: 'users',
        component: UserList
      },


      // ======================================
      // ADD USER
      // ======================================

      {
        path: 'users/add',
        component: AddUser
      },


      // ======================================
      // UPLOAD USERS
      // ======================================

      {
        path: 'upload',
        component: UserUpload
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
      // ======================================

      {
        path: 'reports',
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