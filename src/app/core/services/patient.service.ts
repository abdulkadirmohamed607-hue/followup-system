import { Injectable } from '@angular/core';
import { Patient } from '../models/patient';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private readonly storageKey = 'followup_patients';

  private patients: Patient[] = [];

  constructor() {

    this.loadPatients();

    if (this.patients.length === 0) {
      this.seedPatients();
    }

  }


  // =====================================================
  // LOAD
  // =====================================================

  private loadPatients(): void {

    const stored = localStorage.getItem(this.storageKey);

    if (!stored) {

      this.patients = [];

      return;
    }

    try {

      const parsed = JSON.parse(stored);

      this.patients = Array.isArray(parsed)
        ? parsed
        : [];

    } catch {

      this.patients = [];

    }

  }


  // =====================================================
  // SAVE
  // =====================================================

  private persist(): void {

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.patients)
    );

  }


  // =====================================================
  // SEED DATA
  // =====================================================

  private seedPatients(): void {

    this.patients = [

      {
        id: 1,
        firstName: 'John',
        secondName: 'Peter',
        lastName: 'Smith',
        patientNumber: 'PT-00125',
        ward: 'Medical Ward',
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'Admitted',
        createdAt: new Date().toISOString()
      },

      {
        id: 2,
        firstName: 'Ahmed',
        secondName: 'Mohamed',
        lastName: 'Ali',
        patientNumber: 'PT-00126',
        ward: 'Surgical Ward',
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'Admitted',
        createdAt: new Date().toISOString()
      },

      {
        id: 3,
        firstName: 'Asha',
        secondName: 'Hassan',
        lastName: 'Juma',
        patientNumber: 'PT-00127',
        ward: 'Pediatric Ward',
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'Admitted',
        createdAt: new Date().toISOString()
      }

    ];

    this.persist();

  }


  // =====================================================
  // GET ALL
  // =====================================================

  getPatients(): Patient[] {

    return [...this.patients];

  }


  // =====================================================
  // GET ADMITTED PATIENTS
  // =====================================================

  getAdmittedPatients(): Patient[] {

    return this.patients.filter(
      patient => patient.status === 'Admitted'
    );

  }


  // =====================================================
  // FIND BY ID
  // =====================================================

  getPatientById(id: number): Patient | undefined {

    return this.patients.find(
      patient => patient.id === id
    );

  }


  // =====================================================
  // ADD
  // =====================================================

  addPatient(patient: Patient): void {

    this.patients = [
      ...this.patients,
      patient
    ];

    this.persist();

  }


  // =====================================================
  // ADD MULTIPLE
  // =====================================================

  addPatients(newPatients: Patient[]): void {

    this.patients = [
      ...this.patients,
      ...newPatients
    ];

    this.persist();

  }


  // =====================================================
  // UPDATE
  // =====================================================

  updatePatient(patient: Patient): void {

    this.patients = this.patients.map(
      existing =>
        existing.id === patient.id
          ? patient
          : existing
    );

    this.persist();

  }


  // =====================================================
  // DELETE
  // =====================================================

  deletePatient(id: number): void {

    this.patients = this.patients.filter(
      patient => patient.id !== id
    );

    this.persist();

  }


  // =====================================================
  // GENERATE ID
  // =====================================================

  generateId(): number {

    if (this.patients.length === 0) {

      return 1;

    }

    return Math.max(
      ...this.patients.map(
        patient => patient.id
      )
    ) + 1;

  }

}