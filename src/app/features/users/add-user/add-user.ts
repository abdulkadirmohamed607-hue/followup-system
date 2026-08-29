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

    if (form.invalid) {

      alert(
        'Please fill all required patient fields.'
      );

      return;

    }


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
        this.patientNumber.trim(),

      ward:
        this.ward.trim(),

      admissionDate:
        this.admissionDate,

      status:
        this.status,

      createdAt:
        new Date().toISOString()

    };


    this.patientService.addPatient(
      patient
    );


    alert(
      'Patient added successfully!'
    );


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