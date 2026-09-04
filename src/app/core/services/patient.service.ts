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
  of,
  shareReplay,
  tap,
  map,
  catchError,
  throwError
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

  readonly patients =
    signal<Patient[]>([]);


  // =====================================================
  // CURRENT LOAD REQUEST
  // =====================================================

  private patientsLoad$:
    Observable<Patient[]> | null = null;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private http: HttpClient
  ) {

    /*
     * IMPORTANT:
     *
     * Do NOT load patients automatically here.
     *
     * The component that needs patients will call
     * ensurePatientsLoaded().
     *
     * This prevents unnecessary requests during
     * Angular SSR / hydration.
     */

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
  // LOAD PATIENTS
  // =====================================================

  loadPatients():
    Observable<Patient[]> {

    // -----------------------------------------------------
    // SSR
    // -----------------------------------------------------

    if (
      !this.isBrowser()
    ) {

      return of(
        []
      );

    }


    // -----------------------------------------------------
    // IF PATIENTS ALREADY EXIST
    // -----------------------------------------------------

    if (
      this.patients().length > 0
    ) {

      return of(
        this.patients()
      );

    }


    // -----------------------------------------------------
    // IF REQUEST ALREADY EXISTS
    // -----------------------------------------------------

    if (
      this.patientsLoad$
    ) {

      return this.patientsLoad$;

    }


    // -----------------------------------------------------
    // CREATE NEW REQUEST
    // -----------------------------------------------------

    this.patientsLoad$ =
      this.http
        .get<any>(
          `${this.apiUrl}/`
        )
        .pipe(

          // ===============================================
          // HANDLE DJANGO RESPONSE
          // ===============================================

          map(response => {

            /*
             * Django DRF can return:
             *
             * [
             *   {...},
             *   {...}
             * ]
             *
             * OR:
             *
             * {
             *   count: 10,
             *   results: [...]
             * }
             */

            let data: any[] = [];


            if (
              Array.isArray(response)
            ) {

              data =
                response;

            }
            else if (
              Array.isArray(
                response?.results
              )
            ) {

              data =
                response.results;

            }


            return data.map(
              patient =>
                this.mapFromApi(
                  patient
                )
            );

          }),


          // ===============================================
          // UPDATE SIGNAL
          // ===============================================

          tap(
            mappedPatients => {

              this.patients.set(
                mappedPatients
              );

            }
          ),


          // ===============================================
          // HANDLE ERROR
          // ===============================================

          catchError(error => {

            /*
             * Very important:
             *
             * If the request fails, remove the cached
             * Observable so the next attempt can create
             * a fresh HTTP request.
             */

            this.patientsLoad$ =
              null;


            return throwError(
              () => error
            );

          }),


          // ===============================================
          // SHARE REQUEST
          // ===============================================

          shareReplay({
            bufferSize: 1,
            refCount: false
          })

        );


    return this.patientsLoad$;

  }


  // =====================================================
  // ENSURE PATIENTS ARE LOADED
  // =====================================================

  ensurePatientsLoaded():
    Observable<Patient[]> {

    // -----------------------------------------------------
    // DATA ALREADY AVAILABLE
    // -----------------------------------------------------

    if (
      this.patients().length > 0
    ) {

      return of(
        this.patients()
      );

    }


    // -----------------------------------------------------
    // LOAD FROM API
    // -----------------------------------------------------

    return this.loadPatients();

  }


  // =====================================================
  // API → ANGULAR
  // =====================================================

  private mapFromApi(
    data: any
  ): Patient {

    return {

      id:
        Number(
          data.id
        ),

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

    return this.patients()
      .filter(
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

    return this.patients()
      .find(
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


    return this.patients()
      .find(
        patient =>
          patient.patientNumber
            .trim()
            .toLowerCase() ===
          number
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

        map(
          createdPatient =>
            this.mapFromApi(
              createdPatient
            )
        ),

        tap(
          mappedPatient => {

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

        map(
          updatedPatient =>
            this.mapFromApi(
              updatedPatient
            )
        ),

        tap(
          mappedPatient => {

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

    const requests =
      newPatients.map(
        patient =>
          this.http
            .post<any>(
              `${this.apiUrl}/`,
              this.mapToApi(
                patient
              )
            )
      );


    return new Observable(
      subscriber => {

        // -----------------------------------------------
        // NO PATIENTS
        // -----------------------------------------------

        if (
          requests.length === 0
        ) {

          subscriber.next([]);

          subscriber.complete();

          return;

        }


        // -----------------------------------------------
        // CREATED PATIENTS
        // -----------------------------------------------

        const createdPatients:
          Patient[] = [];


        let completed = 0;


        // -----------------------------------------------
        // SEND REQUESTS
        // -----------------------------------------------

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


                // -------------------------------------
                // ALL COMPLETED
                // -------------------------------------

                if (
                  completed ===
                  requests.length
                ) {

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