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
  // LOAD PATIENTS
  // =====================================================

  private loadPatients(): void {

    const stored =
      localStorage.getItem(this.storageKey);

    if (!stored) {

      this.patients = [];

      return;

    }


    try {

      const parsed =
        JSON.parse(stored);

      this.patients =
        Array.isArray(parsed)
          ? parsed
          : [];

    }
    catch {

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
        admissionDate:
          new Date()
            .toISOString()
            .split('T')[0],
        status: 'Admitted',
        createdAt:
          new Date().toISOString()
      },

      {
        id: 2,
        firstName: 'Ahmed',
        secondName: 'Mohamed',
        lastName: 'Ali',
        patientNumber: 'PT-00126',
        ward: 'Surgical Ward',
        admissionDate:
          new Date()
            .toISOString()
            .split('T')[0],
        status: 'Admitted',
        createdAt:
          new Date().toISOString()
      },

      {
        id: 3,
        firstName: 'Asha',
        secondName: 'Hassan',
        lastName: 'Juma',
        patientNumber: 'PT-00127',
        ward: 'Pediatric Ward',
        admissionDate:
          new Date()
            .toISOString()
            .split('T')[0],
        status: 'Admitted',
        createdAt:
          new Date().toISOString()
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
      patient =>
        patient.status === 'Admitted'
    );

  }


  // =====================================================
  // FIND BY INTERNAL ID
  // =====================================================

  getPatientById(
    id: number
  ): Patient | undefined {

    return this.patients.find(
      patient =>
        patient.id === id
    );

  }


  // =====================================================
  // FIND BY PATIENT NUMBER
  // =====================================================

  getPatientByNumber(
    patientNumber: string
  ): Patient | undefined {

    const number =
      patientNumber
        .trim()
        .toLowerCase();

    if (!number) {

      return undefined;

    }

    return this.patients.find(
      patient =>
        patient.patientNumber
          .trim()
          .toLowerCase() === number
    );

  }


  // =====================================================
  // CHECK DUPLICATE
  // =====================================================

  patientExists(
    patientNumber: string
  ): boolean {

    return !!this.getPatientByNumber(
      patientNumber
    );

  }


  // =====================================================
  // ADD SINGLE PATIENT
  // =====================================================

  addPatient(
    patient: Patient
  ): boolean {

    /*
     * Patient Number is the unique identifier.
     * We never allow two patients with the
     * same patient number.
     */

    if (
      this.patientExists(
        patient.patientNumber
      )
    ) {

      return false;

    }


    this.patients = [

      ...this.patients,

      patient

    ];

    this.persist();

    return true;

  }


  // =====================================================
  // ADD MULTIPLE PATIENTS
  // =====================================================

  addPatients(
    newPatients: Patient[]
  ): {
    added: number;
    duplicates: number;
  } {

    let added = 0;

    let duplicates = 0;


    /*
     * Existing patient numbers.
     */

    const existingNumbers =
      new Set(
        this.patients.map(
          patient =>
            patient.patientNumber
              .trim()
              .toLowerCase()
        )
      );


    /*
     * Prevent duplicates inside
     * the same Excel file.
     */

    const importedNumbers =
      new Set<string>();


    const patientsToAdd:
      Patient[] = [];


    for (
      const patient of newPatients
    ) {

      const number =
        patient.patientNumber
          .trim()
          .toLowerCase();


      if (!number) {

        duplicates++;

        continue;

      }


      /*
       * Already exists in localStorage.
       */

      if (
        existingNumbers.has(number)
      ) {

        duplicates++;

        continue;

      }


      /*
       * Duplicate inside Excel.
       */

      if (
        importedNumbers.has(number)
      ) {

        duplicates++;

        continue;

      }


      importedNumbers.add(number);

      patientsToAdd.push(patient);

      added++;

    }


    if (
      patientsToAdd.length > 0
    ) {

      this.patients = [

        ...this.patients,

        ...patientsToAdd

      ];

      this.persist();

    }


    return {
      added,
      duplicates
    };

  }


  // =====================================================
  // UPDATE
  // =====================================================

  updatePatient(
    patient: Patient
  ): boolean {

    const index =
      this.patients.findIndex(
        existing =>
          existing.id === patient.id
      );


    if (index === -1) {

      return false;

    }


    /*
     * Make sure another patient
     * does not already use this number.
     */

    const duplicate =
      this.patients.some(
        existing =>
          existing.id !== patient.id &&
          existing.patientNumber
            .trim()
            .toLowerCase() ===
          patient.patientNumber
            .trim()
            .toLowerCase()
      );


    if (duplicate) {

      return false;

    }


    this.patients[index] =
      patient;

    this.persist();

    return true;

  }


  // =====================================================
  // DELETE
  // =====================================================

  deletePatient(
    id: number
  ): void {

    this.patients =
      this.patients.filter(
        patient =>
          patient.id !== id
      );

    this.persist();

  }


  // =====================================================
  // GENERATE ID
  // =====================================================

  generateId(): number {

    if (
      this.patients.length === 0
    ) {

      return 1;

    }


    return Math.max(
      ...this.patients.map(
        patient =>
          patient.id
      )
    ) + 1;

  }

}