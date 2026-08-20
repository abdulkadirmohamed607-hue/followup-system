import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser, UserRole } from '../models/auth-user';

export interface RegisterResult {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly STORAGE_KEY = 'followup_auth_user';

  private users: AuthUser[] = [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      fullName: 'System Administrator',
      role: 'admin'
    },
    {
      id: 2,
      username: 'user',
      password: 'user123',
      fullName: 'Normal User',
      role: 'user'
    }
  ];

  constructor(
    private router: Router
  ) {}


  // ==========================================
  // LOGIN
  // ==========================================

  login(
    username: string,
    password: string
  ): boolean {

    const cleanUsername =
      username.trim().toLowerCase();

    const user = this.users.find(
      item =>
        item.username.toLowerCase() === cleanUsername &&
        item.password === password
    );

    if (!user) {
      return false;
    }

    this.setCurrentUser(user);

    return true;
  }


  // ==========================================
  // REGISTER
  // ==========================================

  register(
    username: string,
    password: string,
    fullName: string
  ): RegisterResult {

    const cleanUsername =
      username.trim();

    const cleanFullName =
      fullName.trim();

    if (!cleanFullName) {
      return {
        success: false,
        message: 'Full name is required.'
      };
    }

    if (!cleanUsername) {
      return {
        success: false,
        message: 'Username is required.'
      };
    }

    if (!password) {
      return {
        success: false,
        message: 'Password is required.'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message:
          'Password must be at least 6 characters.'
      };
    }

    const exists = this.users.some(
      user =>
        user.username.toLowerCase() ===
        cleanUsername.toLowerCase()
    );

    if (exists) {
      return {
        success: false,
        message:
          'Username already exists.'
      };
    }

    const newUser: AuthUser = {
      id: this.users.length + 1,
      username: cleanUsername,
      password: password,
      fullName: cleanFullName,
      role: 'user'
    };

    this.users.push(newUser);

    return {
      success: true,
      message:
        'Registration successful.'
    };
  }


  // ==========================================
  // GET CURRENT USER
  // ==========================================

  getCurrentUser(): AuthUser | null {

    try {

      const data =
        localStorage.getItem(
          this.STORAGE_KEY
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

        localStorage.removeItem(
          this.STORAGE_KEY
        );

        return null;
      }

      return user;

    } catch {

      return null;
    }
  }


  // ==========================================
  // CHECK LOGIN
  // ==========================================

  isLoggedIn(): boolean {

    return this.getCurrentUser() !== null;
  }


  // ==========================================
  // ADMIN
  // ==========================================

  isAdmin(): boolean {

    return this.getCurrentUser()?.role === 'admin';
  }


  // ==========================================
  // NORMAL USER
  // ==========================================

  isUser(): boolean {

    return this.getCurrentUser()?.role === 'user';
  }


  // ==========================================
  // ROLE CHECK
  // ==========================================

  hasRole(
    role: UserRole
  ): boolean {

    return this.getCurrentUser()?.role === role;
  }


  // ==========================================
  // LOGOUT
  // ==========================================

  logout(): void {

    localStorage.removeItem(
      this.STORAGE_KEY
    );

    this.router.navigateByUrl(
      '/login'
    );
  }


  // ==========================================
  // SAVE USER
  // ==========================================

  private setCurrentUser(
    user: AuthUser
  ): void {

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(user)
    );
  }

}