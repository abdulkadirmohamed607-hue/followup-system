import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  User,
  UserService
} from '../../../shared/services/user.service';


@Component({
  selector: 'app-visitor-check',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './visitor-check.html',

  styleUrl: './visitor-check.css'
})


export class VisitorCheck {

  // =====================================================
  // FILTER VARIABLES
  // =====================================================

  searchText = '';

  selectedType = 'All';

  selectedStatus = 'All';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private userService: UserService
  ) {}


  // =====================================================
  // GET USERS
  // =====================================================

  get users(): User[] {

    return this.userService.getUsers();

  }


  // =====================================================
  // FILTERED USERS
  // =====================================================

  get filteredUsers(): User[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    return this.users.filter(
      (user: User) => {

        // -----------------------------------------------
        // SEARCH FILTER
        // -----------------------------------------------

        const fullName =
          `${user.firstName} ${user.secondName} ${user.lastName}`
            .toLowerCase();


        const matchesSearch =
          fullName.includes(search);


        // -----------------------------------------------
        // TYPE FILTER
        // -----------------------------------------------

        const matchesType =
          this.selectedType === 'All' ||
          user.type === this.selectedType;


        // -----------------------------------------------
        // STATUS FILTER
        // -----------------------------------------------

        let matchesStatus = true;


        if (
          this.selectedStatus === 'Visited'
        ) {

          matchesStatus =
            user.visited === true;

        }


        if (
          this.selectedStatus === 'Not Visited'
        ) {

          matchesStatus =
            user.visited === false;

        }


        // -----------------------------------------------
        // RETURN RESULT
        // -----------------------------------------------

        return (
          matchesSearch &&
          matchesType &&
          matchesStatus
        );

      }
    );

  }


  // =====================================================
  // VISITED COUNT
  // =====================================================

  get visitedCount(): number {

    return this.users.filter(
      (user: User) =>
        user.visited === true
    ).length;

  }


  // =====================================================
  // NOT VISITED COUNT
  // =====================================================

  get notVisitedCount(): number {

    return this.users.filter(
      (user: User) =>
        user.visited === false
    ).length;

  }


  // =====================================================
  // TOTAL USERS
  // =====================================================

  get totalUsers(): number {

    return this.users.length;

  }


  // =====================================================
  // RESET FILTERS
  // =====================================================

  resetFilters(): void {

    this.searchText = '';

    this.selectedType = 'All';

    this.selectedStatus = 'All';

  }


  // =====================================================
  // TOGGLE VISITED
  // =====================================================

  toggleVisited(user: User): void {

    this.userService.toggleVisited(
      user.id
    );

  }

}