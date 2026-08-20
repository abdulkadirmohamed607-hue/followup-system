import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { Navbar } from './shared/navbar/navbar';
import { Sidebar } from './shared/sidebar/sidebar';

@Component({
  selector: 'app-root',

  standalone: true,

  imports: [
    RouterOutlet,
    Navbar,
    Sidebar
  ],

  templateUrl: './app.html',

  styleUrl: './app.css'
})
export class App {

  currentUrl = '';

  constructor(
    private router: Router
  ) {

    this.currentUrl =
      this.router.url;

    this.router.events
      .pipe(
        filter(
          event =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(
        (event: NavigationEnd) => {

          this.currentUrl =
            event.urlAfterRedirects;

        }
      );

  }


  isAuthPage(): boolean {

    return (
      this.currentUrl === '/login'
      ||
      this.currentUrl === '/register'
    );

  }

}