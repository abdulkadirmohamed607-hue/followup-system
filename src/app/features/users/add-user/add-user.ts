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

  // ============================================================
  // FORM FIELDS
  // ============================================================

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


  // ============================================================
  // LOADING
  // ============================================================

  isSaving = false;


  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    private router: Router,
    private patientService: PatientService
  ) {}


  // ============================================================
  // SAVE PATIENT
  // ============================================================

  savePatient(form: NgForm): void {

    // ----------------------------------------------------------
    // FORM VALIDATION
    // ----------------------------------------------------------

    if (form.invalid) {

      alert(
        'Please fill all required patient fields.'
      );

      return;
    }


    // ----------------------------------------------------------
    // CLEAN PATIENT NUMBER
    // ----------------------------------------------------------

    const cleanPatientNumber =
      this.patientNumber
        .trim()
        .toUpperCase();


    // ----------------------------------------------------------
    // VALIDATE PATIENT NUMBER
    // ----------------------------------------------------------

    if (!cleanPatientNumber) {

      alert(
        'Please enter a Patient Number.'
      );

      return;
    }


    // ----------------------------------------------------------
    // PREVENT DOUBLE CLICK
    // ----------------------------------------------------------

    if (this.isSaving) {
      return;
    }


    this.isSaving = true;


    // ==========================================================
    // CHECK PATIENT NUMBER AGAINST DATABASE
    // ==========================================================

    this.patientService
      .patientExists(
        cleanPatientNumber
      )
      .subscribe({

        // --------------------------------------------------------
        // DUPLICATE CHECK RESULT
        // --------------------------------------------------------

        next: exists => {

          console.log(
            'PATIENT NUMBER:',
            cleanPatientNumber
          );

          console.log(
            'PATIENT EXISTS:',
            exists
          );


          // ------------------------------------------------------
          // PATIENT ALREADY EXISTS
          // ------------------------------------------------------

          if (exists) {

            this.isSaving = false;

            alert(
              `Patient Number "${cleanPatientNumber}" already exists. Please use a different Patient Number.`
            );

            return;
          }


          // ------------------------------------------------------
          // PATIENT DOES NOT EXIST
          // CONTINUE WITH SAVE
          // ------------------------------------------------------

          const patient:
            Omit<
              Patient,
              'id' | 'createdAt'
            > = {

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
              this.status
          };


          // ======================================================
          // ADD PATIENT TO DATABASE
          // ======================================================

          this.patientService
            .addPatient(patient)
            .subscribe({

              // --------------------------------------------------
              // SUCCESS
              // --------------------------------------------------

              next: createdPatient => {

                console.log(
                  'PATIENT SAVED SUCCESSFULLY:',
                  createdPatient
                );

                this.isSaving = false;

                alert(
                  'Patient added successfully!'
                );

                this.router.navigate(
                  ['/users']
                );
              },


              // --------------------------------------------------
              // SAVE ERROR
              // --------------------------------------------------

              error: error => {

                console.error(
                  'Failed to add patient:',
                  error
                );

                this.isSaving = false;


                // ----------------------------------------------
                // UNAUTHORIZED
                // ----------------------------------------------

                if (
                  error?.status === 401
                ) {

                  alert(
                    'Your session has expired. Please login again.'
                  );

                  this.router.navigate(
                    ['/login']
                  );

                  return;
                }


                // ----------------------------------------------
                // DUPLICATE FROM BACKEND
                // ----------------------------------------------

                if (
                  error?.status === 400 ||
                  error?.status === 409
                ) {

                  /*
                   * Backend is the final authority.
                   * Even if frontend duplicate checking
                   * says the number is available,
                   * PostgreSQL/backend may reject it.
                   */

                  const backendMessage =
                    error?.error?.patient_number?.[0] ||
                    error?.error?.detail ||
                    error?.error?.message;


                  if (backendMessage) {

                    alert(
                      backendMessage
                    );

                  } else {

                    alert(
                      'Patient could not be added. Please check the patient information and make sure the Patient Number is unique.'
                    );
                  }

                  return;
                }


                // ----------------------------------------------
                // OTHER ERROR
                // ----------------------------------------------

                alert(
                  'Failed to add patient. Please make sure the backend server is running.'
                );
              }

            });
        },


        // ========================================================
        // DUPLICATE CHECK ERROR
        // ========================================================

        error: error => {

          console.error(
            'Failed to check patient number:',
            error
          );

          this.isSaving = false;


          // ------------------------------------------------------
          // UNAUTHORIZED
          // ------------------------------------------------------

          if (
            error?.status === 401
          ) {

            alert(
              'Your session has expired. Please login again.'
            );

            this.router.navigate(
              ['/login']
            );

            return;
          }


          // ------------------------------------------------------
          // OTHER ERROR
          // ------------------------------------------------------

          alert(
            'Unable to verify the Patient Number. Please make sure the backend server is running.'
          );
        }

      });
  }


  // ============================================================
  // CANCEL
  // ============================================================

  cancel(): void {

    this.router.navigate(
      ['/users']
    );
  }

}