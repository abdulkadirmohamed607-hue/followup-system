import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  User,
  UserService
} from '../../shared/services/user.service';


@Component({

  selector: 'app-dashboard',

  standalone: true,

  imports: [

    CommonModule

  ],

  templateUrl: './dashboard.html',

  styleUrl: './dashboard.css'

})


export class Dashboard {


  users: User[] = [];


  constructor(

    private userService: UserService

  ) {


    this.users =

      this.userService.getUsers();

  }


  get totalUsers(): number {


    return this.users.length;

  }


  get totalPatients(): number {


    return this.users.filter(

      user =>

        user.type === 'Patient'

    ).length;

  }


  get totalRelatives(): number {


    return this.users.filter(

      user =>

        user.type === 'Relative'

    ).length;

  }


  get totalVisited(): number {


    return this.users.filter(

      user =>

        user.visited

    ).length;

  }


  get totalNotVisited(): number {


    return this.users.filter(

      user =>

        !user.visited

    ).length;

  }


  get recentUsers(): User[] {


    return this.users

      .slice()

      .reverse()

      .slice(

        0,

        5

      );

  }


}