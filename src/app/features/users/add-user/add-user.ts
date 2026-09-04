import { Component } from '@angular/core';

import {
  FormsModule,
  NgForm
} from '@angular/forms';

import { Router } from '@angular/router';

import { Patient } from '../../../core/models/patient';

import {
  PatientService
} from '../../../core/services/patient.service';


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

  // =====================================================
  // FORM FIELDS
  // =====================================================

  firstName = '';

  secondName = '';

  lastName = '';

  patientNumber = '';

  ward = '';

  admissionDate =
    new Date()
      .toISOString()
      .split('T')[0];

  status:
    'Admitted' | 'Discharged'
    = 'Admitted';


  // =====================================================
  // LOADING
  // =====================================================

  isSaving = false;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private router: Router,

    private patientService: PatientService

  ) {}


  // =====================================================
  // SAVE PATIENT
  // =====================================================

  savePatient(
    form: NgForm
  ): void {

    // ---------------------------------------------------
    // VALIDATE FORM
    // ---------------------------------------------------

    if (form.invalid) {

      alert(
        'Please fill all required patient fields.'
      );

      return;
    }


    // ---------------------------------------------------
    // CLEAN PATIENT NUMBER
    // ---------------------------------------------------

    const cleanPatientNumber =
      this.patientNumber
        .trim()
        .toUpperCase();


    // ---------------------------------------------------
    // CHECK DUPLICATE IN CURRENT CACHE
    // ---------------------------------------------------

    if (
      this.patientService.patientExists(
        cleanPatientNumber
      )
    ) {

      alert(
        `Patient Number "${cleanPatientNumber}" already exists. Please use a different Patient Number.`
      );

      return;
    }


    // ---------------------------------------------------
    // CREATE PATIENT
    // ---------------------------------------------------

    const patient: Patient = {

      // PostgreSQL will generate the real ID
      id: 0,

      firstName:
        this.firstName.trim(),

      secondName:
        this.secondName.trim(),

      lastName:
        this.lastName.trim(),

      patientNumber:
        cleanPatientNumber,

      ward:
        this.ward.trim(),

      admissionDate:
        this.admissionDate,

      status:
        this.status,

      // PostgreSQL will generate createdAt
      createdAt: ''

    };


    // ---------------------------------------------------
    // START SAVING
    // ---------------------------------------------------

    this.isSaving = true;


    // ---------------------------------------------------
    // SEND TO DJANGO API
    // ---------------------------------------------------

    this.patientService
      .addPatient(patient)
      .subscribe({

        // -----------------------------------------------
        // SUCCESS
        // -----------------------------------------------

        next: () => {

          this.isSaving = false;

          alert(
            'Patient added successfully!'
          );

          this.router.navigate(
            ['/users']
          );

        },


        // -----------------------------------------------
        // ERROR
        // -----------------------------------------------

        error: error => {

          console.error(
            'Failed to add patient:',
            error
          );

          this.isSaving = false;


          // ---------------------------------------------
          // DUPLICATE / VALIDATION ERROR
          // ---------------------------------------------

          if (
            error?.status === 400
          ) {

            alert(
              'Patient could not be added. Please check the patient information and make sure the Patient Number is unique.'
            );

          }

          // ---------------------------------------------
          // UNAUTHORIZED
          // ---------------------------------------------

          else if (
            error?.status === 401
          ) {

            alert(
              'Your session has expired. Please login again.'
            );

            this.router.navigate(
              ['/login']
            );

          }

          // ---------------------------------------------
          // OTHER ERROR
          // ---------------------------------------------

          else {

            alert(
              'Failed to add patient. Please make sure the backend server is running.'
            );

          }

        }

      });

  }


  // =====================================================
  // CANCEL
  // =====================================================

  cancel(): void {

    this.router.navigate(
      ['/users']
    );

  }

}