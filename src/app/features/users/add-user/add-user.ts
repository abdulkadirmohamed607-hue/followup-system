import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import {
  User,
  UserService
} from '../../../shared/services/user.service';

@Component({
  selector: 'app-add-user',
  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl: './add-user.html',
  styleUrl: './add-user.css'
})
export class AddUser {

  firstName = '';

  secondName = '';

  lastName = '';

  type: 'Patient' | 'Relative' = 'Patient';

  patientNumber = '';

  ward = '';

  patientName = '';


  constructor(
    private router: Router,
    private userService: UserService
  ) {}


  saveUser(form: NgForm): void {

    if (form.invalid) {

      alert('Please fill all required fields.');

      return;
    }


    const newUser: User = {

      id: this.generateUserId(),

      firstName: this.firstName.trim(),

      secondName: this.secondName.trim(),

      lastName: this.lastName.trim(),

      type: this.type,

      patientNumber:
        this.patientNumber.trim(),

      ward:
        this.ward.trim(),

      patientName:
        this.type === 'Relative'
          ? this.patientName.trim()
          : '-',

      visited: false,

      visitDate: null

    };


    this.userService.addUser(newUser);


    alert('User added successfully!');


    this.router.navigate(['/users']);

  }


  private generateUserId(): number {

    const users = this.userService.getUsers();


    if (users.length === 0) {

      return 1;

    }


    return Math.max(

      ...users.map(user => user.id)

    ) + 1;

  }


  cancel(): void {

    this.router.navigate(['/users']);

  }

}