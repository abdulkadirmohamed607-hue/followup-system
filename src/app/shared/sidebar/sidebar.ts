import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],

  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {

  constructor(
    private authService: AuthService
  ) {}

  /**
   * Current logged-in user
   */
  get currentUser() {
    return this.authService.getCurrentUser();
  }

  /**
   * Check whether logged-in user is Admin
   */
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  /**
   * Check whether logged-in user is Normal User
   */
  get isUser(): boolean {
    return this.authService.isUser();
  }

  /**
   * Logout
   */
  logout(): void {
    this.authService.logout();
  }
}