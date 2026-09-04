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
  tap
} from 'rxjs';

import {
  Router
} from '@angular/router';

import {
  AuthUser,
  LoginResponse,
  ChangePasswordResponse,
  UserRole
} from '../models/auth-user';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl =
    'http://127.0.0.1:8000/api/auth';

  private readonly accessTokenKey =
    'followup_access_token';

  private readonly refreshTokenKey =
    'followup_refresh_token';

  private readonly authUserKey =
    'followup_auth_user';

  private readonly platformId =
    inject(PLATFORM_ID);


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

        })

      );

  }


  // =========================================================
  // NORMALIZE USER
  // =========================================================

  private normalizeUser(
    user: AuthUser
  ): AuthUser {

    return {

      ...user,

      role:
        String(user.role)
          .toLowerCase() as UserRole

    };

  }


  // =========================================================
  // CURRENT USER
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

      return this.normalizeUser(
        JSON.parse(storedUser)
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
    newPassword: string
  ):
    Observable<ChangePasswordResponse> {

    return this.http
      .post<ChangePasswordResponse>(
        `${this.apiUrl}/change-password/`,
        {
          old_password: oldPassword,
          new_password: newPassword
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
            JSON.stringify(updatedUser)
          );

        })

      );

  }


  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  loadCurrentUser():
    Observable<AuthUser> {

    return this.http
      .get<AuthUser>(
        `${this.apiUrl}/me/`
      )
      .pipe(

        tap(user => {

          if (!this.isBrowser()) {
            return;
          }

          const normalizedUser =
            this.normalizeUser(
              user
            );

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