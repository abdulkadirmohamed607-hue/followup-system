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


  // ==========================================
  // PASSWORD VISIBILITY
  // ==========================================

  showOldPassword = false;

  showNewPassword = false;

  showConfirmPassword = false;


  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(

    private authService: AuthService,

    private router: Router

  ) {}


  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  changePassword(): void {

    // ========================================
    // CLEAR PREVIOUS MESSAGES
    // ========================================

    this.errorMessage = '';

    this.successMessage = '';


    // ========================================
    // PREVENT DOUBLE SUBMISSION
    // ========================================

    if (this.loading) {

      return;

    }


    // ========================================
    // CURRENT PASSWORD VALIDATION
    // ========================================

    if (!this.oldPassword.trim()) {

      this.errorMessage =
        'Please enter your current password.';

      return;

    }


    // ========================================
    // NEW PASSWORD VALIDATION
    // ========================================

    if (!this.newPassword.trim()) {

      this.errorMessage =
        'Please enter your new password.';

      return;

    }


    // ========================================
    // CONFIRM PASSWORD VALIDATION
    // ========================================

    if (!this.confirmPassword.trim()) {

      this.errorMessage =
        'Please confirm your new password.';

      return;

    }


    // ========================================
    // PASSWORD MATCH VALIDATION
    // ========================================

    if (
      this.newPassword !==
      this.confirmPassword
    ) {

      this.errorMessage =
        'New password and confirmation password do not match.';

      return;

    }


    // ========================================
    // SAME PASSWORD VALIDATION
    // ========================================

    if (
      this.oldPassword ===
      this.newPassword
    ) {

      this.errorMessage =
        'New password must be different from your current password.';

      return;

    }


    // ========================================
    // START LOADING
    // ========================================

    this.loading = true;


    // ========================================
    // SEND REQUEST TO DJANGO
    // ========================================

    this.authService.changePassword(
      this.oldPassword,
      this.newPassword,
      this.confirmPassword
    )

    .subscribe({

      // ======================================
      // SUCCESS
      // ======================================

      next: () => {

        this.loading = false;


        // ====================================
        // SUCCESS MESSAGE
        // ====================================

        this.successMessage =
          'Password changed successfully. Redirecting...';


        // ====================================
        // CLEAR FORM
        // ====================================

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
        // BAD REQUEST - 400
        // ====================================

        if (
          error.status === 400
        ) {


          // ----------------------------------
          // CURRENT PASSWORD ERROR
          // ----------------------------------

          if (
            error.error?.old_password
          ) {

            const message =
              error.error.old_password;


            if (
              Array.isArray(message)
            ) {

              this.errorMessage =
                message[0];

            } else {

              this.errorMessage =
                message ||
                'Current password is incorrect.';

            }

            return;

          }


          // ----------------------------------
          // CONFIRM PASSWORD ERROR
          // ----------------------------------

          if (
            error.error?.confirm_password
          ) {

            const message =
              error.error.confirm_password;


            if (
              Array.isArray(message)
            ) {

              this.errorMessage =
                message[0];

            } else {

              this.errorMessage =
                message ||
                'New password and confirmation password do not match.';

            }

            return;

          }


          // ----------------------------------
          // NEW PASSWORD ERROR
          // ----------------------------------

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
                message ||
                'The new password is not valid.';

            }

            return;

          }


          // ----------------------------------
          // DETAIL MESSAGE
          // ----------------------------------

          if (
            error.error?.detail
          ) {

            this.errorMessage =
              error.error.detail;

            return;

          }


          // ----------------------------------
          // NON-FIELD ERROR
          // ----------------------------------

          if (
            typeof error.error === 'string'
          ) {

            this.errorMessage =
              error.error;

            return;

          }


          // ----------------------------------
          // DEFAULT 400 ERROR
          // ----------------------------------

          this.errorMessage =
            'Unable to change password. Please check your information.';

          return;

        }


        // ====================================
        // UNAUTHORIZED - 401
        // ====================================

        if (
          error.status === 401
        ) {

          this.errorMessage =
            'Your session has expired. Please login again.';


          // ----------------------------------
          // CLEAR AUTHENTICATION
          // ----------------------------------

          this.authService.clearAuthentication();


          // ----------------------------------
          // REDIRECT TO LOGIN
          // ----------------------------------

          setTimeout(() => {

            this.router.navigateByUrl(
              '/login'
            );

          }, 1200);

          return;

        }


        // ====================================
        // FORBIDDEN - 403
        // ====================================

        if (
          error.status === 403
        ) {

          this.errorMessage =
            'You do not have permission to change your password.';

          return;

        }


        // ====================================
        // NOT FOUND - 404
        // ====================================

        if (
          error.status === 404
        ) {

          this.errorMessage =
            'Password change service was not found. Please contact the administrator.';

          return;

        }


        // ====================================
        // SERVER ERROR - 500+
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
  // TOGGLE CURRENT PASSWORD
  // ==========================================

  toggleOldPassword(): void {

    this.showOldPassword =
      !this.showOldPassword;

  }


  // ==========================================
  // TOGGLE NEW PASSWORD
  // ==========================================

  toggleNewPassword(): void {

    this.showNewPassword =
      !this.showNewPassword;

  }


  // ==========================================
  // TOGGLE CONFIRM PASSWORD
  // ==========================================

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