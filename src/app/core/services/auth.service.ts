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
  Router
} from '@angular/router';

import {
  Observable,
  tap
} from 'rxjs';

import {
  AuthUser,
  ChangePasswordResponse,
  LoginResponse,
  UserRole
} from '../models/auth-user';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // ==========================================
  // API
  // ==========================================

  private readonly API_URL =
    'http://127.0.0.1:8000/api/auth';


  // ==========================================
  // STORAGE KEYS
  // ==========================================

  private readonly ACCESS_TOKEN_KEY =
    'followup_access_token';

  private readonly REFRESH_TOKEN_KEY =
    'followup_refresh_token';

  private readonly USER_KEY =
    'followup_auth_user';


  // ==========================================
  // PLATFORM
  // ==========================================

  private readonly platformId =
    inject(PLATFORM_ID);


  constructor(
    private http: HttpClient,
    private router: Router
  ) {}


  // ==========================================
  // CHECK BROWSER
  // ==========================================

  private isBrowser(): boolean {

    return isPlatformBrowser(
      this.platformId
    );

  }


  // ==========================================
  // LOGIN
  // ==========================================

  login(
    username: string,
    password: string
  ): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.API_URL}/login/`,
      {
        username: username.trim(),
        password: password
      }
    ).pipe(

      tap(response => {

        this.saveAuthentication(
          response
        );

      })

    );

  }


  // ==========================================
  // SAVE AUTHENTICATION
  // ==========================================

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
      this.ACCESS_TOKEN_KEY,
      response.access
    );


    localStorage.setItem(
      this.REFRESH_TOKEN_KEY,
      response.refresh
    );


    localStorage.setItem(
      this.USER_KEY,
      JSON.stringify(user)
    );

  }


  // ==========================================
  // NORMALIZE USER
  // Django → Angular
  // ==========================================

  private normalizeUser(
    user: AuthUser
  ): AuthUser {

    return {

      ...user,

      role:
        user.role.toLowerCase() as UserRole

    };

  }


  // ==========================================
  // CURRENT USER
  // ==========================================

  getCurrentUser(): AuthUser | null {

    if (!this.isBrowser()) {
      return null;
    }


    try {

      const data =
        localStorage.getItem(
          this.USER_KEY
        );


      if (!data) {
        return null;
      }


      const user =
        JSON.parse(data) as AuthUser;


      if (
        !user ||
        !user.username ||
        !user.role
      ) {

        this.clearAuthentication();

        return null;

      }


      return user;

    } catch {

      this.clearAuthentication();

      return null;

    }

  }


  // ==========================================
  // ACCESS TOKEN
  // ==========================================

  getAccessToken(): string | null {

    if (!this.isBrowser()) {
      return null;
    }


    return localStorage.getItem(
      this.ACCESS_TOKEN_KEY
    );

  }


  // ==========================================
  // REFRESH TOKEN
  // ==========================================

  getRefreshToken(): string | null {

    if (!this.isBrowser()) {
      return null;
    }


    return localStorage.getItem(
      this.REFRESH_TOKEN_KEY
    );

  }


  // ==========================================
  // LOGIN STATUS
  // ==========================================

  isLoggedIn(): boolean {

    return !!this.getAccessToken();

  }


  // ==========================================
  // ADMIN
  // ==========================================

  isAdmin(): boolean {

    return (
      this.getCurrentUser()?.role === 'admin'
    );

  }


  // ==========================================
  // NORMAL USER
  // ==========================================

  isUser(): boolean {

    return (
      this.getCurrentUser()?.role === 'user'
    );

  }


  // ==========================================
  // ROLE CHECK
  // ==========================================

  hasRole(
    role: UserRole
  ): boolean {

    return (
      this.getCurrentUser()?.role === role
    );

  }


  // ==========================================
  // MUST CHANGE PASSWORD
  // ==========================================

  mustChangePassword(): boolean {

    return (
      this.getCurrentUser()
        ?.must_change_password === true
    );

  }


  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  changePassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Observable<ChangePasswordResponse> {

    return this.http.post<ChangePasswordResponse>(
      `${this.API_URL}/change-password/`,
      {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      }
    ).pipe(

      tap(() => {

        if (!this.isBrowser()) {
          return;
        }


        const currentUser =
          this.getCurrentUser();


        if (!currentUser) {
          return;
        }


        currentUser.must_change_password =
          false;


        localStorage.setItem(
          this.USER_KEY,
          JSON.stringify(currentUser)
        );

      })

    );

  }


  // ==========================================
  // LOAD CURRENT USER
  // ==========================================

  loadCurrentUser(): Observable<AuthUser> {

    return this.http.get<AuthUser>(
      `${this.API_URL}/me/`
    ).pipe(

      tap(user => {

        if (!this.isBrowser()) {
          return;
        }


        const normalizedUser =
          this.normalizeUser(user);


        localStorage.setItem(
          this.USER_KEY,
          JSON.stringify(normalizedUser)
        );

      })

    );

  }


  // ==========================================
  // LOGOUT
  // ==========================================

  logout(): void {

    this.clearAuthentication();

    this.router.navigateByUrl(
      '/login'
    );

  }


  // ==========================================
  // CLEAR AUTHENTICATION
  // ==========================================

  clearAuthentication(): void {

    if (!this.isBrowser()) {
      return;
    }


    localStorage.removeItem(
      this.ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
      this.REFRESH_TOKEN_KEY
    );

    localStorage.removeItem(
      this.USER_KEY
    );

  }

}