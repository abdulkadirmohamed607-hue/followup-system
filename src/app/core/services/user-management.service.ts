import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  catchError,
  shareReplay,
  tap,
  throwError
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';


// =====================================================
// USER ROLE
// =====================================================

export type SystemUserRole =
  | 'ADMIN'
  | 'USER';


// =====================================================
// MODULE PERMISSIONS
// Must match Django ModulePermission choices
// =====================================================

export type ModulePermission =
  | 'PATIENTS'
  | 'VISITOR_CHECK'
  | 'REPORTS'
  | 'USER_UPLOAD'
  | 'USER_MANAGEMENT'
  | 'SYSTEM_SETTINGS';


// =====================================================
// MODULE INFORMATION
// =====================================================

export interface ModulePermissionItem {

  id: number;

  module:
    ModulePermission;

  name:
    string;

  description:
    string;
}


// =====================================================
// SYSTEM USER
// =====================================================

export interface SystemUser {

  id:
    number;

  username:
    string;

  first_name:
    string;

  last_name:
    string;

  email:
    string;

  phone:
    string;

  role:
    SystemUserRole;

  must_change_password:
    boolean;

  is_active:
    boolean;

  date_joined?:
    string;

  created_at?:
    string;

  updated_at?:
    string;

  permissions?:
    ModulePermission[];
}


// =====================================================
// CREATE USER REQUEST
// =====================================================

export interface CreateUserRequest {

  username:
    string;

  first_name:
    string;

  last_name:
    string;

  email:
    string;

  phone:
    string;

  role:
    SystemUserRole;

  password:
    string;
}


// =====================================================
// UPDATE USER REQUEST
// =====================================================

export interface UpdateUserRequest {

  first_name:
    string;

  last_name:
    string;

  email:
    string;

  phone:
    string;

  role:
    SystemUserRole;

  is_active:
    boolean;
}


// =====================================================
// UPDATE USER STATUS
// =====================================================

export interface UpdateUserStatusRequest {

  is_active:
    boolean;
}


// =====================================================
// RESET PASSWORD
// =====================================================

export interface ResetPasswordRequest {

  new_password:
    string;

  confirm_password:
    string;
}


// =====================================================
// USER PERMISSIONS RESPONSE
// =====================================================

export interface UserPermissionsResponse {

  id:
    number;

  username:
    string;

  role:
    SystemUserRole;

  permissions:
    ModulePermission[];
}


// =====================================================
// UPDATE USER PERMISSIONS REQUEST
// =====================================================

export interface UpdateUserPermissionsRequest {

  modules:
    ModulePermission[];
}


@Injectable({
  providedIn: 'root'
})
export class UserManagementService {

  // ===================================================
  // CENTRAL API URL
  // ===================================================

  private readonly API_URL =
    `${environment.apiUrl}/auth/users`;


  /*
  =========================================================
  USERS CACHE
  =========================================================

  Prevents duplicate:

  GET /api/auth/users/

  requests.
  */

  private usersRequest$:
    Observable<SystemUser[]> | null = null;


  /*
  =========================================================
  MODULES CACHE
  =========================================================

  Prevents duplicate:

  GET /api/auth/users/modules/

  requests.
  */

  private modulesRequest$:
    Observable<ModulePermissionItem[]> | null = null;


  constructor(
    private http: HttpClient
  ) {}


  // =====================================================
  // GET ALL USERS
  // GET /api/auth/users/
  // =====================================================

  getUsers(
    forceRefresh = false
  ): Observable<SystemUser[]> {

    /*
    Manual refresh clears cache.
    */
    if (forceRefresh) {

      this.usersRequest$ = null;
    }


    /*
    Reuse existing request.
    */
    if (this.usersRequest$) {

      return this.usersRequest$;
    }


    /*
    Create one HTTP request.
    */
    this.usersRequest$ =
      this.http
        .get<SystemUser[]>(
          `${this.API_URL}/`
        )
        .pipe(

          /*
          Share response with all subscribers.
          */
          shareReplay({
            bufferSize: 1,
            refCount: true
          }),

          /*
          If request fails, allow retry.
          */
          catchError(
            error => {

              this.usersRequest$ =
                null;

              console.error(
                'Failed to load users:',
                error
              );

              return throwError(
                () => error
              );
            }
          )
        );


    return this.usersRequest$;
  }


  // =====================================================
  // FORCE REFRESH USERS
  // =====================================================

  refreshUsers():
    Observable<SystemUser[]> {

    return this.getUsers(
      true
    );
  }


  // =====================================================
  // CLEAR USERS CACHE
  // =====================================================

  clearUsersCache(): void {

    this.usersRequest$ = null;
  }


  // =====================================================
  // GET SINGLE USER
  // GET /api/auth/users/{id}/
  // =====================================================

  getUser(
    id: number
  ): Observable<SystemUser> {

    return this.http
      .get<SystemUser>(
        `${this.API_URL}/${id}/`
      );
  }


  // =====================================================
  // CREATE USER
  // POST /api/auth/users/
  // =====================================================

  createUser(
    data: CreateUserRequest
  ): Observable<SystemUser> {

    return this.http
      .post<SystemUser>(
        `${this.API_URL}/`,
        data
      )
      .pipe(

        /*
        New user means cached list is stale.
        */
        tap(
          () => {
            this.usersRequest$ = null;
          }
        )
      );
  }


  // =====================================================
  // UPDATE USER
  // PATCH /api/auth/users/{id}/
  // =====================================================

  updateUser(
    id: number,
    data: UpdateUserRequest
  ): Observable<SystemUser> {

    return this.http
      .patch<SystemUser>(
        `${this.API_URL}/${id}/`,
        data
      )
      .pipe(

        /*
        Updated user means cached list is stale.
        */
        tap(
          () => {
            this.usersRequest$ = null;
          }
        )
      );
  }


  // =====================================================
  // UPDATE USER STATUS ONLY
  // PATCH /api/auth/users/{id}/
  // =====================================================

  updateUserStatus(
    id: number,
    isActive: boolean
  ): Observable<SystemUser> {

    const data:
      UpdateUserStatusRequest = {

      is_active:
        isActive
    };


    console.log(
      'UPDATE USER STATUS REQUEST:',
      {
        id,
        data
      }
    );


    return this.http
      .patch<SystemUser>(
        `${this.API_URL}/${id}/`,
        data
      )
      .pipe(

        /*
        Status changed.
        Cached users list must be refreshed
        next time it is requested.
        */
        tap(
          () => {
            this.usersRequest$ = null;
          }
        )
      );
  }


  // =====================================================
  // DELETE USER
  // DELETE /api/auth/users/{id}/
  // =====================================================

  deleteUser(
    id: number
  ): Observable<any> {

    return this.http
      .delete(
        `${this.API_URL}/${id}/`
      )
      .pipe(

        /*
        User removed.
        */
        tap(
          () => {
            this.usersRequest$ = null;
          }
        )
      );
  }


  // =====================================================
  // RESET PASSWORD
  // POST /api/auth/users/{id}/reset-password/
  // =====================================================

  resetPassword(
    id: number,
    data: ResetPasswordRequest
  ): Observable<any> {

    return this.http
      .post(
        `${this.API_URL}/${id}/reset-password/`,
        data
      );
  }


  // =====================================================
  // GET AVAILABLE MODULES
  //
  // GET /api/auth/users/modules/
  // =====================================================

  getModules(
    forceRefresh = false
  ): Observable<ModulePermissionItem[]> {

    /*
    Manual refresh.
    */
    if (forceRefresh) {

      this.modulesRequest$ =
        null;
    }


    /*
    Reuse existing request.
    */
    if (this.modulesRequest$) {

      return this.modulesRequest$;
    }


    /*
    Create one HTTP request.
    */
    this.modulesRequest$ =
      this.http
        .get<ModulePermissionItem[]>(
          `${this.API_URL}/modules/`
        )
        .pipe(

          shareReplay({
            bufferSize: 1,
            refCount: true
          }),

          catchError(
            error => {

              this.modulesRequest$ =
                null;

              console.error(
                'Failed to load modules:',
                error
              );

              return throwError(
                () => error
              );
            }
          )
        );


    return this.modulesRequest$;
  }


  // =====================================================
  // FORCE REFRESH MODULES
  // =====================================================

  refreshModules():
    Observable<ModulePermissionItem[]> {

    return this.getModules(
      true
    );
  }


  // =====================================================
  // CLEAR MODULES CACHE
  // =====================================================

  clearModulesCache(): void {

    this.modulesRequest$ = null;
  }


  // =====================================================
  // GET USER MODULE PERMISSIONS
  //
  // GET /api/auth/users/{id}/permissions/
  // =====================================================

  getUserPermissions(
    id: number
  ): Observable<UserPermissionsResponse> {

    return this.http
      .get<UserPermissionsResponse>(
        `${this.API_URL}/${id}/permissions/`
      );
  }


  // =====================================================
  // UPDATE USER MODULE PERMISSIONS
  //
  // PUT /api/auth/users/{id}/permissions/
  // =====================================================

  updateUserPermissions(
    id: number,
    modules: ModulePermission[]
  ): Observable<UserPermissionsResponse> {

    const data:
      UpdateUserPermissionsRequest = {

      modules
    };


    return this.http
      .put<UserPermissionsResponse>(
        `${this.API_URL}/${id}/permissions/`,
        data
      )
      .pipe(

        /*
        Permissions changed.

        Clear user list cache because the user
        permissions may be displayed there.
        */
        tap(
          () => {
            this.usersRequest$ = null;
          }
        )
      );
  }
}