import {
  Component
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule,
  NgForm
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../core/services/auth.service';


@Component({

  selector: 'app-register',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './register.html',

  styleUrl: './register.css'

})


export class Register {

  fullName = '';

  username = '';

  password = '';

  confirmPassword = '';

  loading = false;

  errorMessage = '';

  successMessage = '';


  constructor(

    private authService: AuthService,

    private router: Router

  ) {}


  register(
    registerForm: NgForm
  ): void {

    this.errorMessage = '';

    this.successMessage = '';


    if (
      registerForm.invalid
    ) {

      this.errorMessage =
        'Please fill in all fields.';

      return;

    }


    if (
      this.password !==
      this.confirmPassword
    ) {

      this.errorMessage =
        'Passwords do not match.';

      return;

    }


    if (
      this.password.length < 6
    ) {

      this.errorMessage =
        'Password must contain at least 6 characters.';

      return;

    }


    this.loading = true;


    const result =
      this.authService.register(
        this.username,
        this.fullName,
        this.password
      );


    this.loading = false;


    if (!result.success) {

      this.errorMessage =
        result.message ??
        'Registration failed.';

      return;

    }


    this.successMessage =
      'Registration successful. Redirecting to login...';


    setTimeout(() => {

      this.router.navigate([
        '/login'
      ]);

    }, 1200);

  }

}