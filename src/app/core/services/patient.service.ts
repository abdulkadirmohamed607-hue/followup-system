import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';

import {
  isPlatformBrowser
} from '@angular/common';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  tap
} from 'rxjs';

import {
  Patient
} from '../models/patient';


@Injectable({
  providedIn: 'root'
})
export class PatientService {

  // =====================================================
  // API
  // =====================================================

  private readonly apiUrl =
    'http://127.0.0.1:8000/api/patients';


  // =====================================================
  // PLATFORM / SSR
  // =====================================================

  private readonly platformId =
    inject(PLATFORM_ID);


  // =====================================================
  // PATIENTS SIGNAL
  // =====================================================

  /*
   * This is the main source of patient data
   * inside the Angular application.
   *
   * Data comes from Django/PostgreSQL.
   *
   * Because this is a signal, Angular automatically
   * updates components whenever the value changes.
   */

  readonly patients =
    signal<Patient[]>([]);


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private http: HttpClient
  ) {

    /*
     * Only load patients in the browser.
     *
     * This prevents SSR from trying to access
     * browser-only functionality.
     */

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      this.loadPatients();

    }

  }


  // =====================================================
  // CHECK BROWSER
  // =====================================================

  private isBrowser(): boolean {

    return isPlatformBrowser(
      this.platformId
    );

  }


  // =====================================================
  // LOAD PATIENTS FROM DATABASE
  // =====================================================

  loadPatients(): void {

    if (
      !this.isBrowser()
    ) {

      return;

    }


    this.http
      .get<any[]>(
        `${this.apiUrl}/`
      )
      .subscribe({

        next: data => {

          const mappedPatients =
            data.map(
              patient =>
                this.mapFromApi(
                  patient
                )
            );


          /*
           * Update signal.
           *
           * Every component using patients()
           * will automatically refresh.
           */

          this.patients.set(
            mappedPatients
          );

        },


        error: error => {

          console.error(
            'Failed to load patients from API:',
            error
          );

        }

      });

  }


  // =====================================================
  // API → ANGULAR
  // =====================================================

  private mapFromApi(
    data: any
  ): Patient {

    return {

      id:
        Number(data.id),

      firstName:
        data.first_name ?? '',

      secondName:
        data.second_name ?? '',

      lastName:
        data.last_name ?? '',

      patientNumber:
        data.patient_number ?? '',

      ward:
        data.ward ?? '',

      admissionDate:
        data.admission_date ?? '',

      status:
        data.status === 'Discharged'
          ? 'Discharged'
          : 'Admitted',

      createdAt:
        data.created_at ?? ''

    };

  }


  // =====================================================
  // ANGULAR → API
  // =====================================================

  private mapToApi(
    patient: Patient
  ): any {

    return {

      first_name:
        patient.firstName.trim(),

      second_name:
        patient.secondName.trim(),

      last_name:
        patient.lastName.trim(),

      patient_number:
        patient.patientNumber
          .trim()
          .toUpperCase(),

      ward:
        patient.ward.trim(),

      admission_date:
        patient.admissionDate,

      status:
        patient.status

    };

  }


  // =====================================================
  // GET ALL PATIENTS
  // =====================================================

  getPatients(): Patient[] {

    return [
      ...this.patients()
    ];

  }


  // =====================================================
  // GET ADMITTED PATIENTS
  // =====================================================

  getAdmittedPatients(): Patient[] {

    return this.patients().filter(
      patient =>
        patient.status === 'Admitted'
    );

  }


  // =====================================================
  // GET PATIENT BY ID
  // =====================================================

  getPatientById(
    id: number
  ): Patient | undefined {

    return this.patients().find(
      patient =>
        patient.id === id
    );

  }


  // =====================================================
  // GET PATIENT BY NUMBER
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


    return this.patients().find(
      patient =>
        patient.patientNumber
          .trim()
          .toLowerCase() === number
    );

  }


  // =====================================================
  // CHECK DUPLICATE PATIENT
  // =====================================================

  patientExists(
    patientNumber: string
  ): boolean {

    return !!this.getPatientByNumber(
      patientNumber
    );

  }


  // =====================================================
  // ADD PATIENT
  // =====================================================

  addPatient(
    patient: Patient
  ): Observable<Patient> {

    const payload =
      this.mapToApi(
        patient
      );


    return this.http
      .post<any>(
        `${this.apiUrl}/`,
        payload
      )
      .pipe(

        tap(
          createdPatient => {

            const mappedPatient =
              this.mapFromApi(
                createdPatient
              );


            /*
             * Add new patient to signal.
             */

            this.patients.update(
              patients => [
                ...patients,
                mappedPatient
              ]
            );

          }
        )

      );

  }


  // =====================================================
  // UPDATE PATIENT
  // =====================================================

  updatePatient(
    patient: Patient
  ): Observable<Patient> {

    const payload =
      this.mapToApi(
        patient
      );


    return this.http
      .put<any>(
        `${this.apiUrl}/${patient.id}/`,
        payload
      )
      .pipe(

        tap(
          updatedPatient => {

            const mappedPatient =
              this.mapFromApi(
                updatedPatient
              );


            /*
             * Replace the old patient with
             * the updated patient.
             */

            this.patients.update(
              patients =>
                patients.map(
                  existing =>
                    existing.id ===
                    patient.id
                      ? mappedPatient
                      : existing
                )
            );

          }
        )

      );

  }


  // =====================================================
  // DELETE PATIENT
  // =====================================================

  deletePatient(
    id: number
  ): Observable<void> {

    return this.http
      .delete<void>(
        `${this.apiUrl}/${id}/`
      )
      .pipe(

        tap(() => {

          /*
           * Remove patient from signal after
           * successful deletion from database.
           */

          this.patients.update(
            patients =>
              patients.filter(
                patient =>
                  patient.id !== id
              )
          );

        })

      );

  }


  // =====================================================
  // ADD MULTIPLE PATIENTS
  // =====================================================

  addPatients(
    newPatients: Patient[]
  ): Observable<Patient[]> {

    /*
     * For now Excel upload sends patients
     * one by one.
     *
     * Later we can create a dedicated Django
     * bulk-upload endpoint.
     */

    const requests =
      newPatients.map(
        patient =>
          this.http.post<any>(
            `${this.apiUrl}/`,
            this.mapToApi(
              patient
            )
          )
      );


    return new Observable(
      subscriber => {

        // ---------------------------------------------
        // NO PATIENTS
        // ---------------------------------------------

        if (
          requests.length === 0
        ) {

          subscriber.next([]);

          subscriber.complete();

          return;

        }


        // ---------------------------------------------
        // CREATED PATIENTS
        // ---------------------------------------------

        const createdPatients:
          Patient[] = [];


        let completed = 0;


        // ---------------------------------------------
        // SEND REQUESTS
        // ---------------------------------------------

        requests.forEach(
          request => {

            request.subscribe({

              next: data => {

                const mappedPatient =
                  this.mapFromApi(
                    data
                  );


                createdPatients.push(
                  mappedPatient
                );


                completed++;


                // -----------------------------------
                // ALL REQUESTS COMPLETED
                // -----------------------------------

                if (
                  completed ===
                  requests.length
                ) {

                  /*
                   * Add uploaded patients to
                   * the reactive signal.
                   */

                  this.patients.update(
                    patients => [
                      ...patients,
                      ...createdPatients
                    ]
                  );


                  subscriber.next(
                    createdPatients
                  );


                  subscriber.complete();

                }

              },


              error: error => {

                subscriber.error(
                  error
                );

              }

            });

          }

        );

      }

    );

  }

}