import { Component } from '@angular/core';
import {
  FormsModule,
  NgForm
} from '@angular/forms';
import { Router } from '@angular/router';

import { Patient } from '../../../core/models/patient';
import { PatientService } from '../../../core/services/patient.service';

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

  patientNumber = '';

  ward = '';

  admissionDate =
    new Date().toISOString().split('T')[0];

  status:
    'Admitted' | 'Discharged'
    = 'Admitted';


  constructor(
    private router: Router,
    private patientService: PatientService
  ) {}


  // =====================================================
  // SAVE PATIENT
  // =====================================================

  savePatient(form: NgForm): void {

    // -----------------------------------------------
    // VALIDATE FORM
    // -----------------------------------------------

    if (form.invalid) {

      alert(
        'Please fill all required patient fields.'
      );

      return;

    }


    // -----------------------------------------------
    // CLEAN PATIENT NUMBER
    // -----------------------------------------------

    const cleanPatientNumber =
      this.patientNumber
        .trim()
        .toUpperCase();


    // -----------------------------------------------
    // CHECK DUPLICATE PATIENT
    // -----------------------------------------------

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


    // -----------------------------------------------
    // CREATE PATIENT
    // -----------------------------------------------

    const patient: Patient = {

      id:
        this.patientService.generateId(),

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

      createdAt:
        new Date().toISOString()

    };


    // -----------------------------------------------
    // SAVE
    // -----------------------------------------------

    this.patientService.addPatient(
      patient
    );


    alert(
      'Patient added successfully!'
    );


    // -----------------------------------------------
    // GO BACK TO PATIENTS
    // -----------------------------------------------

    this.router.navigate(
      ['/users']
    );

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