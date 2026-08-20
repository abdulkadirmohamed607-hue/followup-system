import { Injectable } from '@angular/core';

export interface User {
  id: number;
  firstName: string;
  secondName: string;
  lastName: string;

  type: 'Patient' | 'Relative';

  patientName: string;
  patientNumber: string;
  ward: string;

  visited: boolean;
  visitDate: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private users: User[] = [

    {
      id: 1,
      firstName: 'John',
      secondName: 'Peter',
      lastName: 'Smith',
      type: 'Patient',
      patientName: '-',
      patientNumber: 'PT-00125',
      ward: 'Medical Ward',
      visited: true,
      visitDate: new Date().toISOString()
    },

    {
      id: 2,
      firstName: 'Mary',
      secondName: 'James',
      lastName: 'Smith',
      type: 'Relative',
      patientName: 'John Peter Smith',
      patientNumber: 'PT-00125',
      ward: 'Medical Ward',
      visited: false,
      visitDate: null
    },

    {
      id: 3,
      firstName: 'Ahmed',
      secondName: 'Mohamed',
      lastName: 'Ali',
      type: 'Patient',
      patientName: '-',
      patientNumber: 'PT-00126',
      ward: 'Surgical Ward',
      visited: false,
      visitDate: null
    },

    {
      id: 4,
      firstName: 'Asha',
      secondName: 'Hassan',
      lastName: 'Juma',
      type: 'Relative',
      patientName: 'Ahmed Mohamed Ali',
      patientNumber: 'PT-00126',
      ward: 'Surgical Ward',
      visited: true,
      visitDate: new Date().toISOString()
    }

  ];

  getUsers(): User[] {
    return this.users;
  }

  addUsers(newUsers: User[]): void {

    this.users = [
      ...this.users,
      ...newUsers
    ];

  }

  addUser(user: User): void {

    this.users.push(user);

  }

  deleteUser(id: number): void {

    this.users = this.users.filter(
      user => user.id !== id
    );

  }

  toggleVisited(id: number): void {

    const user = this.users.find(
      user => user.id === id
    );

    if (user) {

      user.visited = !user.visited;

      user.visitDate = user.visited
        ? new Date().toISOString()
        : null;

    }

  }

}