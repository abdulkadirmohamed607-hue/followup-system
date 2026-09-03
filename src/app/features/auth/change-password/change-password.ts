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

  selector: 'app-change-password',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './change-password.html',

  styleUrl: './change-password.css'

})


export class ChangePassword {


  // ==========================================
  // FORM DATA
  // ==========================================

  oldPassword = '';

  newPassword = '';

  confirmPassword = '';


  // ==========================================
  // UI STATE
  // ==========================================

  loading = false;

  errorMessage = '';

  successMessage = '';


  showOldPassword = false;

  showNewPassword = false;

  showConfirmPassword = false;


  constructor(

    private authService: AuthService,

    private router: Router

  ) {}


  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  changePassword(): void {

    this.errorMessage = '';

    this.successMessage = '';


    // ========================================
    // VALIDATION
    // ========================================

    if (!this.oldPassword) {

      this.errorMessage =
        'Please enter your current password.';

      return;

    }


    if (!this.newPassword) {

      this.errorMessage =
        'Please enter your new password.';

      return;

    }


    if (!this.confirmPassword) {

      this.errorMessage =
        'Please confirm your new password.';

      return;

    }


    if (
      this.newPassword !==
      this.confirmPassword
    ) {

      this.errorMessage =
        'New password and confirmation password do not match.';

      return;

    }


    if (
      this.oldPassword ===
      this.newPassword
    ) {

      this.errorMessage =
        'New password must be different from your current password.';

      return;

    }


    // ========================================
    // LOADING
    // ========================================

    this.loading = true;


    // ========================================
    // SEND REQUEST TO DJANGO
    // ========================================

    this.authService.changePassword(

      this.oldPassword,

      this.newPassword,

      this.confirmPassword

    ).subscribe({

      // ======================================
      // SUCCESS
      // ======================================

      next: () => {

        this.loading = false;

        this.successMessage =
          'Password changed successfully. Redirecting...';


        // Clear form

        this.oldPassword = '';

        this.newPassword = '';

        this.confirmPassword = '';


        // ====================================
        // REDIRECT TO DASHBOARD
        // ====================================

        setTimeout(() => {

          this.router.navigateByUrl(
            '/dashboard'
          );

        }, 1000);

      },


      // ======================================
      // ERROR
      // ======================================

      error: (
        error: HttpErrorResponse
      ) => {

        this.loading = false;


        console.error(
          'CHANGE PASSWORD ERROR:',
          error
        );


        // ====================================
        // CURRENT PASSWORD INCORRECT
        // ====================================

        if (
          error.status === 400
        ) {

          if (
            error.error?.old_password
          ) {

            this.errorMessage =
              'Current password is incorrect.';

            return;

          }


          if (
            error.error?.confirm_password
          ) {

            this.errorMessage =
              'New password and confirmation password do not match.';

            return;

          }


          if (
            error.error?.new_password
          ) {

            const message =
              error.error.new_password;


            if (
              Array.isArray(message)
            ) {

              this.errorMessage =
                message[0];

            } else {

              this.errorMessage =
                message;

            }

            return;

          }


          this.errorMessage =
            'Unable to change password. Please check your information.';

          return;

        }


        // ====================================
        // UNAUTHORIZED
        // ====================================

        if (
          error.status === 401
        ) {

          this.errorMessage =
            'Your session has expired. Please login again.';

          this.authService.clearAuthentication();

          setTimeout(() => {

            this.router.navigateByUrl(
              '/login'
            );

          }, 1200);

          return;

        }


        // ====================================
        // SERVER ERROR
        // ====================================

        if (
          error.status >= 500
        ) {

          this.errorMessage =
            'Server error. Please try again later.';

          return;

        }


        // ====================================
        // CONNECTION ERROR
        // ====================================

        if (
          error.status === 0
        ) {

          this.errorMessage =
            'Unable to connect to the server. Please make sure Django is running.';

          return;

        }


        // ====================================
        // OTHER ERROR
        // ====================================

        this.errorMessage =
          'Password change failed. Please try again.';

      }

    });

  }


  // ==========================================
  // PASSWORD TOGGLES
  // ==========================================

  toggleOldPassword(): void {

    this.showOldPassword =
      !this.showOldPassword;

  }


  toggleNewPassword(): void {

    this.showNewPassword =
      !this.showNewPassword;

  }


  toggleConfirmPassword(): void {

    this.showConfirmPassword =
      !this.showConfirmPassword;

  }


  // ==========================================
  // LOGOUT
  // ==========================================

  logout(): void {

    this.authService.logout();

  }

}