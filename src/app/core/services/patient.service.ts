
import {
  Injectable,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  of,
  throwError
} from 'rxjs';

import {
  catchError,
  map,
  shareReplay,
  tap
} from 'rxjs/operators';

import {
  Patient
} from '../models/patient';

import {
  environment
} from '../../../environments/environment';


interface ApiPatient {

  id: number;

  first_name: string;

  second_name: string;

  last_name: string;

  patient_number: string;

  gender?: string;

  ward: string;

  admission_date: string;

  status:
    | 'Admitted'
    | 'Discharged';

  created_at: string;
}


interface BulkUploadResponse {

  detail: string;

  created_count: number;

  skipped_existing_count: number;

  skipped_duplicate_file_count: number;

  skipped_existing: string[];

  skipped_duplicate_file: string[];

  patients: ApiPatient[];
}


@Injectable({
  providedIn: 'root'
})
export class PatientService {

  // ============================================================
  // API
  // ============================================================

  private readonly apiUrl =
    `${environment.apiUrl}/patients`;


  // ============================================================
  // PATIENT SIGNAL
  // ============================================================

  readonly patients =
    signal<Patient[]>([]);


  // ============================================================
  // PATIENTS LOADED FLAG
  // ============================================================

  private patientsLoaded = false;


  // ============================================================
  // ACTIVE REQUEST CACHE
  // ============================================================

  private patientsRequest$:
    Observable<Patient[]> | null = null;


  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    private http: HttpClient
  ) {}


  // ============================================================
  // LOAD PATIENTS
  // ============================================================

  loadPatients():
    Observable<Patient[]> {

    // ------------------------------------------------------------
    // If patients are already loaded,
    // don't make another HTTP request.
    // ------------------------------------------------------------

    if (this.patientsLoaded) {

      return of(
        this.patients()
      );
    }


    // ------------------------------------------------------------
    // If a request is already running,
    // reuse it.
    // ------------------------------------------------------------

    if (this.patientsRequest$) {

      return this.patientsRequest$;
    }


    // ------------------------------------------------------------
    // Create HTTP request
    // ------------------------------------------------------------

    this.patientsRequest$ =
      this.http.get<
        ApiPatient[] |
        { results: ApiPatient[] }
      >(
        `${this.apiUrl}/`
      ).pipe(

        map(response => {

          let apiPatients: ApiPatient[];


          if (
            Array.isArray(response)
          ) {

            apiPatients =
              response;

          } else {

            apiPatients =
              response.results || [];
          }


          // ------------------------------------------------------
          // Convert API patients to Angular patients
          // ------------------------------------------------------

          const mappedPatients =
            apiPatients.map(
              patient =>
                this.mapFromApi(
                  patient
                )
            );


          // ------------------------------------------------------
          // Update signal
          // ------------------------------------------------------

          this.patients.set(
            mappedPatients
          );


          // ------------------------------------------------------
          // Mark patients as loaded
          // ------------------------------------------------------

          this.patientsLoaded =
            true;


          return mappedPatients;
        }),


        // --------------------------------------------------------
        // Share current request
        // --------------------------------------------------------

        shareReplay(1),


        // --------------------------------------------------------
        // Error handling
        // --------------------------------------------------------

        catchError(error => {

          console.error(
            'Failed to load patients:',
            error
          );


          this.patientsRequest$ =
            null;


          this.patientsLoaded =
            false;


          return throwError(
            () => error
          );
        }),


        // --------------------------------------------------------
        // Request completed
        // --------------------------------------------------------

        tap({

          next: () => {

            this.patientsRequest$ =
              null;
          },

          error: () => {

            this.patientsRequest$ =
              null;
          }

        })
      );


    return this.patientsRequest$;
  }


  // ============================================================
  // ENSURE PATIENTS ARE LOADED
  // ============================================================

  ensurePatientsLoaded():
    Observable<Patient[]> {

    if (
      this.patientsLoaded
    ) {

      return of(
        this.patients()
      );
    }


    return this.loadPatients();
  }


  // ============================================================
  // GET PATIENTS
  // ============================================================

  getPatients():
    Observable<Patient[]> {

    return this.ensurePatientsLoaded();
  }


  // ============================================================
  // GET ADMITTED PATIENTS
  // ============================================================

  getAdmittedPatients():
    Observable<Patient[]> {

    return this.getPatients().pipe(

      map(patients =>
        patients.filter(
          patient =>
            patient.status ===
            'Admitted'
        )
      )
    );
  }


  // ============================================================
  // GET PATIENT BY ID
  // ============================================================

  getPatientById(
    id: number
  ):
    Observable<Patient> {

    return this.getPatients().pipe(

      map(patients => {

        const patient =
          patients.find(
            item =>
              item.id === id
          );


        if (!patient) {

          throw new Error(
            'Patient not found.'
          );
        }


        return patient;
      })
    );
  }


  // ============================================================
  // GET PATIENT BY NUMBER
  // ============================================================

  getPatientByNumber(
    patientNumber: string
  ):
    Observable<Patient | undefined> {

    const normalized =
      patientNumber
        .trim()
        .toUpperCase();


    return this.getPatients().pipe(

      map(patients =>
        patients.find(
          patient =>
            patient.patientNumber
              .trim()
              .toUpperCase() ===
            normalized
        )
      )
    );
  }


  // ============================================================
  // PATIENT EXISTS
  // ============================================================

  patientExists(
    patientNumber: string
  ):
    Observable<boolean> {

    const normalized =
      patientNumber
        .trim()
        .toUpperCase();


    /*
     * IMPORTANT:
     *
     * Use the already loaded patient list.
     *
     * This prevents an unnecessary GET request
     * every time the user adds a patient.
     */

    if (
      this.patientsLoaded
    ) {

      const exists =
        this.patients().some(
          patient =>
            patient.patientNumber
              .trim()
              .toUpperCase() ===
            normalized
        );


      console.log(
        'PATIENT NUMBER CHECK:',
        normalized,
        'EXISTS:',
        exists
      );


      return of(
        exists
      );
    }


    /*
     * Patients have not been loaded yet.
     *
     * Load them once, then perform the check.
     */

    return this.loadPatients().pipe(

      map(patients => {

        const exists =
          patients.some(
            patient =>
              patient.patientNumber
                .trim()
                .toUpperCase() ===
              normalized
          );


        console.log(
          'PATIENT NUMBER CHECK:',
          normalized,
          'EXISTS:',
          exists
        );


        return exists;
      })
    );
  }


  // ============================================================
  // ADD SINGLE PATIENT
  // ============================================================

  addPatient(
    patient: Omit<
      Patient,
      'id' | 'createdAt'
    >
  ):
    Observable<Patient> {

    const payload =
      this.mapToApi(
        patient
      );


    console.log(
      'ADDING PATIENT:',
      payload
    );


    return this.http.post<ApiPatient>(
      `${this.apiUrl}/`,
      payload
    ).pipe(

      map(response =>
        this.mapFromApi(
          response
        )
      ),


      tap(createdPatient => {

        /*
         * Add new patient to existing
         * Angular patient list.
         */

        this.patients.update(
          current => {

            const alreadyExists =
              current.some(
                item =>
                  item.id ===
                  createdPatient.id
              );


            if (
              alreadyExists
            ) {

              return current;
            }


            return [
              createdPatient,
              ...current
            ];
          }
        );


        /*
         * Keep cache valid.
         *
         * We already received the newly
         * created patient from the backend,
         * so another GET is unnecessary.
         */

        this.patientsLoaded =
          true;


        this.patientsRequest$ =
          null;


        console.log(
          'PATIENT CREATED:',
          createdPatient
        );
      }),


      catchError(error => {

        console.error(
          'Failed to add patient:',
          error
        );


        return throwError(
          () => error
        );
      })
    );
  }


  // ============================================================
  // BULK ADD PATIENTS
  // ============================================================

  addPatientsBulk(
    patients: Array<
      Omit<
        Patient,
        'id' | 'createdAt'
      >
    >
  ):
    Observable<BulkUploadResponse> {

    const payload =
      patients.map(
        patient =>
          this.mapToApi(
            patient
          )
      );


    console.log(
      'BULK PATIENT UPLOAD'
    );


    console.log(
      'TOTAL PATIENTS:',
      payload.length
    );


    return this.http.post<BulkUploadResponse>(
      `${this.apiUrl}/bulk/`,
      payload
    ).pipe(

      tap(response => {

        const createdPatients =
          (
            response.patients || []
          ).map(
            patient =>
              this.mapFromApi(
                patient
              )
          );


        if (
          createdPatients.length > 0
        ) {

          this.patients.update(
            current => {

              const existingIds =
                new Set(
                  current.map(
                    patient =>
                      patient.id
                  )
                );


              const newPatients =
                createdPatients.filter(
                  patient =>
                    !existingIds.has(
                      patient.id
                    )
                );


              return [
                ...newPatients,
                ...current
              ];
            }
          );
        }


        /*
         * Cache is still valid because
         * backend returned the created patients.
         */

        this.patientsLoaded =
          true;


        this.patientsRequest$ =
          null;


        console.log(
          'BULK UPLOAD COMPLETE'
        );


        console.log(
          'CREATED:',
          response.created_count
        );


        console.log(
          'SKIPPED EXISTING:',
          response.skipped_existing_count
        );


        console.log(
          'SKIPPED DUPLICATES:',
          response.skipped_duplicate_file_count
        );
      }),


      catchError(error => {

        console.error(
          'Bulk patient upload failed:',
          error
        );


        return throwError(
          () => error
        );
      })
    );
  }


  // ============================================================
  // UPDATE PATIENT
  // ============================================================

  updatePatient(
    id: number,
    patient: Partial<Patient>
  ):
    Observable<Patient> {

    const payload =
      this.mapToApi(
        patient
      );


    return this.http.put<ApiPatient>(
      `${this.apiUrl}/${id}/`,
      payload
    ).pipe(

      map(response =>
        this.mapFromApi(
          response
        )
      ),


      tap(updatedPatient => {

        this.patients.update(
          current =>
            current.map(
              item =>
                item.id === id
                  ? updatedPatient
                  : item
            )
        );


        this.patientsLoaded =
          true;


        this.patientsRequest$ =
          null;
      }),


      catchError(error => {

        console.error(
          'Failed to update patient:',
          error
        );


        return throwError(
          () => error
        );
      })
    );
  }


  // ============================================================
  // DELETE PATIENT
  // ============================================================

  deletePatient(
    id: number
  ):
    Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}/`
    ).pipe(

      tap(() => {

        this.patients.update(
          current =>
            current.filter(
              patient =>
                patient.id !== id
            )
        );


        this.patientsLoaded =
          true;


        this.patientsRequest$ =
          null;
      }),


      catchError(error => {

        console.error(
          'Failed to delete patient:',
          error
        );


        return throwError(
          () => error
        );
      })
    );
  }


  // ============================================================
  // MAP API → ANGULAR
  // ============================================================

  private mapFromApi(
    patient: ApiPatient
  ):
    Patient {

    return {

      id:
        patient.id,

      firstName:
        patient.first_name,

      secondName:
        patient.second_name,

      lastName:
        patient.last_name,

      patientNumber:
        patient.patient_number,

      gender:
        patient.gender || '',

      ward:
        patient.ward,

      admissionDate:
        patient.admission_date,

      status:
        patient.status,

      createdAt:
        patient.created_at
    };
  }


  // ============================================================
  // MAP ANGULAR → API
  // ============================================================

  private mapToApi(
    patient: Partial<Patient>
  ): any {

    return {

      first_name:
        patient.firstName || '',

      second_name:
        patient.secondName || '',

      last_name:
        patient.lastName || '',

      patient_number:
        patient.patientNumber || '',

      gender:
        patient.gender || '',

      ward:
        patient.ward || '',

      admission_date:
        patient.admissionDate || '',

      status:
        patient.status ||
        'Admitted'
    };
  }

}