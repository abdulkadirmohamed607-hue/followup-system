import {
  Component
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  AuthService
} from '../../../core/services/auth.service';


@Component({

  selector: 'app-login',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
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
    // AUTHENTICATE WITH DJANGO
    // =========================

    this.authService.login(

      this.username.trim(),

      this.password

    ).subscribe({

      // =========================
      // LOGIN SUCCESS
      // =========================

      next: (response) => {

        this.loading = false;


        console.log(
          'LOGIN SUCCESS'
        );


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
        // FORCE PASSWORD CHANGE
        // =========================

        if (
          user.must_change_password
        ) {

          this.router.navigateByUrl(
            '/change-password'
          );

          return;

        }


        // =========================
        // ADMIN
        // =========================

        if (
          user.role === 'admin'
        ) {

          this.router.navigateByUrl(
            '/dashboard'
          );

          return;

        }


        // =========================
        // NORMAL USER
        // =========================

        if (
          user.role === 'user'
        ) {

          this.router.navigateByUrl(
            '/visitor-check'
          );

          return;

        }


        // =========================
        // UNKNOWN ROLE
        // =========================

        this.authService.clearAuthentication();

        this.errorMessage =
          'User role is not recognized.';

      },


      // =========================
      // LOGIN ERROR
      // =========================

      error: (
        error: HttpErrorResponse
      ) => {

        this.loading = false;


        console.error(
          'LOGIN ERROR:',
          error
        );


        // =========================
        // INVALID CREDENTIALS
        // =========================

        if (
          error.status === 401
        ) {

          this.errorMessage =
            'Invalid username or password.';

          return;

        }


        // =========================
        // BAD REQUEST
        // =========================

        if (
          error.status === 400
        ) {

          this.errorMessage =
            'Please check your username and password.';

          return;

        }


        // =========================
        // SERVER ERROR
        // =========================

        if (
          error.status >= 500
        ) {

          this.errorMessage =
            'Server error. Please try again later.';

          return;

        }


        // =========================
        // CONNECTION ERROR
        // =========================

        if (
          error.status === 0
        ) {

          this.errorMessage =
            'Unable to connect to the server. Please make sure Django is running.';

          return;

        }


        // =========================
        // OTHER ERROR
        // =========================

        this.errorMessage =
          'Login failed. Please try again.';

      }

    });

  }


  // =========================
  // PASSWORD TOGGLE
  // =========================

  togglePassword(): void {

    this.showPassword =
      !this.showPassword;

  }

}