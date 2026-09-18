
import {
  Injectable,
  PLATFORM_ID,
  inject
} from '@angular/core';

import {
  isPlatformBrowser
} from '@angular/common';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  tap,
  map
} from 'rxjs';

import {
  Router
} from '@angular/router';

import {
  AuthUser,
  LoginResponse,
  ChangePasswordResponse,
  UserRole,
  ModulePermission
} from '../models/auth-user';

import {
  environment
} from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // =========================================================
  // API URL
  // =========================================================

  private readonly apiUrl =
    `${environment.apiUrl}/auth`;


  // =========================================================
  // LOCAL STORAGE KEYS
  // =========================================================

  private readonly accessTokenKey =
    'followup_access_token';

  private readonly refreshTokenKey =
    'followup_refresh_token';

  private readonly authUserKey =
    'followup_auth_user';


  // =========================================================
  // PLATFORM
  // =========================================================

  private readonly platformId =
    inject(PLATFORM_ID);


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}


  // =========================================================
  // BROWSER CHECK
  // =========================================================

  private isBrowser(): boolean {

    return isPlatformBrowser(
      this.platformId
    );

  }


  // =========================================================
  // LOGIN
  // =========================================================

  login(
    username: string,
    password: string
  ): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/login/`,
        {
          username,
          password
        }
      )
      .pipe(

        tap(response => {

          if (!this.isBrowser()) {
            return;
          }


          // -----------------------------------------------
          // NORMALIZE USER
          // -----------------------------------------------

          const user =
            this.normalizeUser(
              response.user
            );


          // -----------------------------------------------
          // SAVE ACCESS TOKEN
          // -----------------------------------------------

          localStorage.setItem(
            this.accessTokenKey,
            response.access
          );


          // -----------------------------------------------
          // SAVE REFRESH TOKEN
          // -----------------------------------------------

          localStorage.setItem(
            this.refreshTokenKey,
            response.refresh
          );


          // -----------------------------------------------
          // SAVE NORMALIZED USER
          // -----------------------------------------------

          localStorage.setItem(
            this.authUserKey,
            JSON.stringify(user)
          );

        })

      );

  }


  // =========================================================
  // NORMALIZE USER
  // =========================================================

  private normalizeUser(
    user: AuthUser
  ): AuthUser {

    // Backend:
    //
    // ADMIN
    // USER
    //
    // Angular:
    //
    // admin
    // user

    const normalizedRole =
      String(user.role ?? '')
        .trim()
        .toLowerCase();


    // Only allow valid application roles.

    const role: UserRole =
      normalizedRole === 'admin'
        ? 'admin'
        : 'user';


    // Normalize module permissions.

    const permissions: ModulePermission[] =
      Array.isArray(user.permissions)

        ? user.permissions
            .map(permission =>
              String(permission)
                .trim()
                .toUpperCase()
            ) as ModulePermission[]

        : [];


    return {

      id:
        user.id,

      username:
        user.username,

      first_name:
        user.first_name ?? '',

      last_name:
        user.last_name ?? '',

      email:
        user.email ?? '',

      phone:
        user.phone ?? '',

      role,

      must_change_password:
        user.must_change_password === true,

      is_active:
        user.is_active === true,

      permissions

    };

  }


  // =========================================================
  // CURRENT USER FROM LOCAL STORAGE
  // =========================================================

  getCurrentUser():
    AuthUser | null {

    if (!this.isBrowser()) {
      return null;
    }


    const storedUser =
      localStorage.getItem(
        this.authUserKey
      );


    if (!storedUser) {
      return null;
    }


    try {

      const parsedUser =
        JSON.parse(
          storedUser
        );


      return this.normalizeUser(
        parsedUser
      );

    }
    catch {

      localStorage.removeItem(
        this.authUserKey
      );


      return null;

    }

  }


  // =========================================================
  // ACCESS TOKEN
  // =========================================================

  getAccessToken():
    string | null {

    if (!this.isBrowser()) {
      return null;
    }


    return localStorage.getItem(
      this.accessTokenKey
    );

  }


  // =========================================================
  // REFRESH TOKEN
  // =========================================================

  getRefreshToken():
    string | null {

    if (!this.isBrowser()) {
      return null;
    }


    return localStorage.getItem(
      this.refreshTokenKey
    );

  }


  // =========================================================
  // SAVE NEW ACCESS TOKEN
  // =========================================================

  saveAccessToken(
    accessToken: string
  ): void {

    if (!this.isBrowser()) {
      return;
    }


    localStorage.setItem(
      this.accessTokenKey,
      accessToken
    );

  }


  // =========================================================
  // SAVE AUTHENTICATION
  // =========================================================

  private saveAuthentication(
    response: LoginResponse
  ): void {

    if (!this.isBrowser()) {
      return;
    }


    const user =
      this.normalizeUser(
        response.user
      );


    localStorage.setItem(
      this.accessTokenKey,
      response.access
    );


    localStorage.setItem(
      this.refreshTokenKey,
      response.refresh
    );


    localStorage.setItem(
      this.authUserKey,
      JSON.stringify(user)
    );

  }


  // =========================================================
  // REFRESH ACCESS TOKEN
  // =========================================================

  refreshAccessToken():
    Observable<{ access: string }> {

    const refreshToken =
      this.getRefreshToken();


    if (!refreshToken) {

      throw new Error(
        'Refresh token is not available.'
      );

    }


    return this.http
      .post<{ access: string }>(
        `${this.apiUrl}/token/refresh/`,
        {
          refresh: refreshToken
        }
      )
      .pipe(

        tap(response => {

          if (
            response?.access
          ) {

            this.saveAccessToken(
              response.access
            );

          }

        })

      );

  }


  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  changePassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ):
    Observable<ChangePasswordResponse> {

    return this.http
      .post<ChangePasswordResponse>(
        `${this.apiUrl}/change-password/`,
        {
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        }
      )
      .pipe(

        tap(response => {

          if (!this.isBrowser()) {
            return;
          }


          const user =
            this.getCurrentUser();


          if (!user) {
            return;
          }


          const updatedUser: AuthUser = {

            ...user,

            must_change_password:
              response.must_change_password

          };


          localStorage.setItem(
            this.authUserKey,
            JSON.stringify(
              updatedUser
            )
          );

        })

      );

  }


  // =========================================================
  // LOAD CURRENT USER FROM BACKEND
  // =========================================================
  //
  // This method remains available for guards or other
  // parts of the application that explicitly need a
  // fresh user from the backend.
  //
  // LOGIN DOES NOT CALL THIS METHOD ANYMORE.
  // =========================================================

  loadCurrentUser():
    Observable<AuthUser> {

    return this.http
      .get<AuthUser>(
        `${this.apiUrl}/me/`
      )
      .pipe(

        map(user =>
          this.normalizeUser(
            user
          )
        ),


        tap(normalizedUser => {

          if (!this.isBrowser()) {
            return;
          }


          localStorage.setItem(
            this.authUserKey,
            JSON.stringify(
              normalizedUser
            )
          );

        })

      );

  }


  // =========================================================
  // LOGIN + LOAD CURRENT USER
  // =========================================================
  //
  // IMPORTANT:
  //
  // The login endpoint already returns:
  //
  // response.user
  //
  // Therefore there is no need to call:
  //
  // GET /api/auth/me/
  //
  // immediately after login.
  //
  // This removes one HTTP request and makes login faster.
  //
  // The method name is intentionally kept as:
  //
  // loginAndLoadUser()
  //
  // so existing components do not break.
  // =========================================================

  loginAndLoadUser(
    username: string,
    password: string
  ):
    Observable<AuthUser> {

    return this.login(
      username,
      password
    )
    .pipe(

      map(response =>
        this.normalizeUser(
          response.user
        )
      )

    );

  }


  // =========================================================
  // AUTH STATUS
  // =========================================================

  isLoggedIn():
    boolean {

    return !!this.getAccessToken();

  }


  // =========================================================
  // ROLE CHECK
  // =========================================================

  isAdmin():
    boolean {

    const user =
      this.getCurrentUser();


    return user?.role === 'admin';

  }


  isUser():
    boolean {

    const user =
      this.getCurrentUser();


    return user?.role === 'user';

  }


  // =========================================================
  // GENERIC ROLE CHECK
  // =========================================================

  hasRole(
    role: UserRole
  ):
    boolean {

    return (
      this.getCurrentUser()
        ?.role === role
    );

  }


  // =========================================================
  // MODULE PERMISSION CHECK
  // =========================================================

  hasPermission(
    module: ModulePermission
  ):
    boolean {

    const user =
      this.getCurrentUser();


    // No logged-in user.

    if (!user) {
      return false;
    }


    // Admin has access to all modules.

    if (
      user.role === 'admin'
    ) {

      return true;

    }


    // Normal user must have the
    // requested module assigned.

    return (
      user.permissions
        ?.includes(module) ?? false
    );

  }


  // =========================================================
  // GET USER PERMISSIONS
  // =========================================================

  getPermissions():
    ModulePermission[] {

    const user =
      this.getCurrentUser();


    if (!user) {
      return [];
    }


    // Admin has every module.

    if (
      user.role === 'admin'
    ) {

      return [

        'PATIENTS',

        'VISITOR_CHECK',

        'REPORTS',

        'USER_UPLOAD',

        'USER_MANAGEMENT',

        'SYSTEM_SETTINGS'

      ];

    }


    // Normal user gets assigned modules.

    return user.permissions ?? [];

  }


  // =========================================================
  // PASSWORD CHANGE CHECK
  // =========================================================

  mustChangePassword():
    boolean {

    return (
      this.getCurrentUser()
        ?.must_change_password === true
    );

  }


  // =========================================================
  // CLEAR AUTHENTICATION
  // =========================================================

  clearAuthentication(): void {

    if (!this.isBrowser()) {
      return;
    }


    localStorage.removeItem(
      this.accessTokenKey
    );


    localStorage.removeItem(
      this.refreshTokenKey
    );


    localStorage.removeItem(
      this.authUserKey
    );

  }


  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): void {

    this.clearAuthentication();


    this.router.navigate([
      '/login'
    ]);

  }

}