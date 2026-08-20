import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../core/services/auth.service';


@Component({

  selector: 'app-login',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './login.html',

  styleUrl: './login.css'

})


export class Login {


  // =========================
  // FORM DATA
  // =========================

  username = '';

  password = '';


  // =========================
  // UI STATE
  // =========================

  showPassword = false;

  loading = false;

  errorMessage = '';


  constructor(

    private authService: AuthService,

    private router: Router

  ) {}


  // =========================
  // LOGIN
  // =========================

  loginButtonClicked(): void {

    console.log(
      'LOGIN BUTTON CLICKED'
    );


    this.errorMessage = '';


    // =========================
    // VALIDATION
    // =========================

    if (!this.username.trim()) {

      this.errorMessage =
        'Please enter username.';

      return;

    }


    if (!this.password) {

      this.errorMessage =
        'Please enter password.';

      return;

    }


    // =========================
    // LOADING
    // =========================

    this.loading = true;


    // =========================
    // AUTHENTICATE
    // =========================

    const success =
      this.authService.login(
        this.username.trim(),
        this.password
      );


    this.loading = false;


    console.log(
      'LOGIN RESULT:',
      success
    );


    // =========================
    // LOGIN FAILED
    // =========================

    if (!success) {

      this.errorMessage =
        'Invalid username or password.';

      return;

    }


    // =========================
    // GET USER
    // =========================

    const user =
      this.authService.getCurrentUser();


    if (!user) {

      this.errorMessage =
        'Login session could not be created.';

      return;

    }


    console.log(
      'LOGGED USER:',
      user
    );


    // =========================
    // ADMIN
    // =========================

    if (user.role === 'admin') {

      this.router.navigateByUrl(
        '/dashboard'
      );

      return;

    }


    // =========================
    // NORMAL USER
    // =========================

    if (user.role === 'user') {

      this.router.navigateByUrl(
        '/visitor-check'
      );

      return;

    }


    // =========================
    // UNKNOWN ROLE
    // =========================

    this.errorMessage =
      'User role is not recognized.';

  }


  // =========================
  // PASSWORD TOGGLE
  // =========================

  togglePassword(): void {

    this.showPassword =
      !this.showPassword;

  }

}