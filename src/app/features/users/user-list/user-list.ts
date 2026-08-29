import {
  Component,
  computed,
  signal
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  Patient
} from '../../../core/models/patient';

import {
  PatientService
} from '../../../core/services/patient.service';


@Component({
  selector: 'app-user-list',
  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList {

  searchTerm =
    signal('');

  selectedStatus =
    signal<'All' | 'Admitted' | 'Discharged'>(
      'All'
    );


  constructor(
    private patientService: PatientService,
    private router: Router
  ) {}


  // =====================================================
  // PATIENTS
  // =====================================================

  get patients(): Patient[] {

    return this.patientService.getPatients();

  }


  // =====================================================
  // FILTERED PATIENTS
  // =====================================================

  filteredPatients =
    computed(() => {

      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const status =
        this.selectedStatus();


      return this.patients.filter(
        patient => {

          const fullName =
            `${patient.firstName} ${patient.secondName} ${patient.lastName}`
              .toLowerCase();

          const matchesSearch =
            !search ||
            fullName.includes(search) ||
            patient.patientNumber
              .toLowerCase()
              .includes(search) ||
            patient.ward
              .toLowerCase()
              .includes(search);


          const matchesStatus =
            status === 'All' ||
            patient.status === status;


          return (
            matchesSearch &&
            matchesStatus
          );

        }
      );

    });


  // =====================================================
  // COUNTS
  // =====================================================

  get totalPatients(): number {

    return this.patients.length;

  }


  get admittedPatients(): number {

    return this.patients.filter(
      patient =>
        patient.status === 'Admitted'
    ).length;

  }


  get dischargedPatients(): number {

    return this.patients.filter(
      patient =>
        patient.status === 'Discharged'
    ).length;

  }


  // =====================================================
  // ADD
  // =====================================================

  addPatient(): void {

    this.router.navigate(
      ['/users/add']
    );

  }


  // =====================================================
  // DELETE
  // =====================================================

  deletePatient(id: number): void {

    const confirmed =
      confirm(
        'Are you sure you want to delete this patient?'
      );

    if (!confirmed) {

      return;

    }

    this.patientService.deletePatient(
      id
    );

  }


  // =====================================================
  // RESET
  // =====================================================

  resetFilters(): void {

    this.searchTerm.set('');

    this.selectedStatus.set(
      'All'
    );

  }


  // =====================================================
  // UPDATE SEARCH
  // =====================================================

  onSearchChange(
    value: string
  ): void {

    this.searchTerm.set(value);

  }


  // =====================================================
  // UPDATE STATUS
  // =====================================================

  onStatusChange(
    value: string
  ): void {

    if (
      value === 'Admitted' ||
      value === 'Discharged'
    ) {

      this.selectedStatus.set(
        value
      );

    } else {

      this.selectedStatus.set(
        'All'
      );

    }

  }

}