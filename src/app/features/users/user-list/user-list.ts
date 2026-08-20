import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  User,
  UserService
} from '../../../shared/services/user.service';


@Component({
  selector: 'app-user-list',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './user-list.html',

  styleUrl: './user-list.css'
})
export class UserList {

  searchText = '';

  selectedType = 'All';


  constructor(
    private userService: UserService,
    private router: Router
  ) {}


  get users(): User[] {

    return this.userService.getUsers();

  }


  get filteredUsers(): User[] {

    const search =
      this.searchText
        .toLowerCase()
        .trim();


    return this.users.filter(user => {

      const fullName =
        `${user.firstName} ${user.secondName} ${user.lastName}`
          .toLowerCase();


      const matchesSearch =
        fullName.includes(search) ||

        user.patientNumber
          .toLowerCase()
          .includes(search) ||

        user.ward
          .toLowerCase()
          .includes(search) ||

        user.patientName
          .toLowerCase()
          .includes(search);


      const matchesType =
        this.selectedType === 'All' ||

        user.type === this.selectedType;


      return matchesSearch && matchesType;

    });

  }


  goToAddUser(): void {

    this.router.navigate([
      '/users/add'
    ]);

  }


  deleteUser(id: number): void {

    const user =
      this.users.find(
        item => item.id === id
      );


    if (!user) {

      return;

    }


    const confirmed =
      confirm(
        `Are you sure you want to delete ${user.firstName} ${user.lastName}?`
      );


    if (!confirmed) {

      return;

    }


    this.userService.deleteUser(id);

  }


  toggleVisited(user: User): void {

    this.userService.toggleVisited(
      user.id
    );

  }


  resetFilters(): void {

    this.searchText = '';

    this.selectedType = 'All';

  }

}