import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

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

  // =====================================================
  // MENU STATE
  // =====================================================

  menuOpen = true;


  constructor(
    private authService: AuthService
  ) {}


  // =====================================================
  // CURRENT USER
  // =====================================================

  get currentUser() {

    return this.authService.getCurrentUser();

  }


  // =====================================================
  // ADMIN CHECK
  // =====================================================

  get isAdmin(): boolean {

    return this.authService.isAdmin();

  }


  // =====================================================
  // NORMAL USER CHECK
  // =====================================================

  get isUser(): boolean {

    return this.authService.isUser();

  }


  // =====================================================
  // TOGGLE MENU
  // =====================================================

  toggleMenu(): void {

    this.menuOpen =
      !this.menuOpen;

  }


  // =====================================================
  // LOGOUT
  // =====================================================

  logout(): void {

    this.authService.logout();

  }

}