import {
  Component
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  AuthService
} from '../../core/services/auth.service';


@Component({
  selector: 'app-navbar',

  standalone: true,

  imports: [],

  templateUrl: './navbar.html',

  styleUrl: './navbar.css'
})
export class Navbar {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}


  get currentUser() {

    return this.authService.getCurrentUser();

  }


  logout(): void {

    this.authService.logout();

  }

}