
import {
  Injectable,
  signal
} from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  Observable,
  catchError,
  map,
  tap,
  throwError
} from 'rxjs';

import {
  Visit,
  VisitSession,
  VisitSlot,
  VisitStatus,
  VisitorGender,
  VisitorRelation
} from '../models/visit';


@Injectable({
  providedIn: 'root'
})
export class VisitService {

  /* =========================================================
     DJANGO API
     ========================================================= */

  private readonly apiUrl =
    'http://127.0.0.1:8000/api/visits/';


  /* =========================================================
     VISITS SIGNAL
     ========================================================= */

  readonly visits =
    signal<Visit[]>([]);


  /* =========================================================
     CONSTRUCTOR
     ========================================================= */

  constructor(
    private http: HttpClient
  ) {}


  /* =========================================================
     LOAD ALL VISITS
     ========================================================= */

  loadVisits(): void {

    this.http
      .get<any>(this.apiUrl)
      .pipe(

        map(response => {

          /*
           * DRF can return either:
           *
           * [...]
           *
           * OR
           *
           * {
           *   count: number,
           *   results: [...]
           * }
           */

          if (Array.isArray(response)) {

            return response;
          }

          return response?.results ?? [];
        }),

        map(
          (results: any[]) =>
            results.map(
              visit =>
                this.mapVisit(visit)
            )
        ),

        catchError(
          (error: HttpErrorResponse) => {

            console.error(
              'Failed to load visits:',
              error
            );

            return throwError(
              () => error
            );
          }
        )
      )
      .subscribe({

        next: visits => {

          this.visits.set(
            visits
          );
        },

        error: error => {

          console.error(
            'Visit loading error:',
            error
          );

          this.visits.set([]);
        }
      });
  }


  /* =========================================================
     GET ALL VISITS
     ========================================================= */

  getVisits(): Visit[] {

    return [
      ...this.visits()
    ];
  }


  /* =========================================================
     GET VISITS FOR PATIENT
     ========================================================= */

  getPatientVisits(
    patientId: number
  ): Visit[] {

    return this.visits()
      .filter(
        visit =>
          visit.patientId === patientId
      );
  }


  /* =========================================================
     GET PATIENT VISITS BY DATE
     ========================================================= */

  getPatientVisitsByDate(
    patientId: number,
    date: string
  ): Visit[] {

    return this.visits()
      .filter(
        visit =>
          visit.patientId === patientId &&
          visit.visitDate === date
      );
  }


  /* =========================================================
     GET VISITS FOR PATIENT + SESSION
     ========================================================= */

  getSessionVisits(
    patientId: number,
    session: VisitSession
  ): Visit[] {

    return this.visits()
      .filter(
        visit =>
          visit.patientId === patientId &&
          visit.session === session
      );
  }


  /* =========================================================
     CHECK SLOT
     ========================================================= */

  isSlotTaken(
    patientId: number,
    session: VisitSession,
    visitorNumber: number,
    date?: string
  ): boolean {

    const visitDate =
      date ?? this.getToday();


    return this.visits()
      .some(
        visit =>
          visit.patientId === patientId &&
          visit.session === session &&
          visit.visitorNumber === visitorNumber &&
          visit.visitDate === visitDate
      );
  }


  /* =========================================================
     GET MAXIMUM SLOTS
     ========================================================= */

  getMaxSlots(
    session: VisitSession
  ): number {

    switch (session) {

      case 'Morning':
        return 2;

      case 'Day':
        return 2;

      case 'Evening':
        return 3;

      default:
        return 0;
    }
  }


  /* =========================================================
     GET VISIT FROM SLOT
     ========================================================= */

  getSlotVisit(
    patientId: number,
    session: VisitSession,
    slot: VisitSlot,
    date?: string
  ): Visit | undefined {

    const visitDate =
      date ?? this.getToday();


    return this.visits()
      .find(
        visit =>
          visit.patientId === patientId &&
          visit.session === session &&
          visit.visitorNumber === slot &&
          visit.visitDate === visitDate
      );
  }


  /* =========================================================
     GENERATE ID
     ========================================================= */

  generateId(): number {

    return Date.now();
  }


  /* =========================================================
     ADD VISITOR
     ========================================================= */

  addVisit(
    visit: Partial<Visit>
  ): Observable<Visit> {

    const visitorNumber =
      visit.visitorNumber ??
      visit.slot ??
      1;


    const patientId =
      visit.patient ??
      visit.patientId;


    const payload = {

      first_name:
        (
          visit.firstName ??
          visit.visitorFirstName ??
          ''
        ).trim(),

      second_name:
        (
          visit.secondName ??
          visit.visitorSecondName ??
          ''
        ).trim(),

      last_name:
        (
          visit.lastName ??
          visit.visitorLastName ??
          ''
        ).trim(),

      phone:
        (
          visit.phone ??
          visit.visitorPhone ??
          ''
        ).trim(),

      card_number:
        (
          visit.cardNumber ??
          visit.visitorCardNumber ??
          ''
        ).trim(),

      patient:
        patientId,

      session:
        visit.session,

      gender:
        visit.gender ??
        visit.visitorGender,

      relation:
        visit.relation ??
        visit.visitorRelation,

      visitor_number:
        visitorNumber
    };


    return this.http
      .post<any>(
        this.apiUrl,
        payload
      )
      .pipe(

        map(
          response =>
            this.mapVisit(
              response,
              visit
            )
        ),

        tap(
          savedVisit => {

            this.visits.update(
              currentVisits => [
                savedVisit,
                ...currentVisits
              ]
            );
          }
        ),

        catchError(
          (error: HttpErrorResponse) => {

            console.error(
              'Failed to add visitor:',
              error
            );

            return throwError(
              () => error
            );
          }
        )
      );
  }


  /* =========================================================
     CHECKOUT VISITOR
     ========================================================= */

  checkoutVisit(
    visitId: number,
    checkoutTime?: string
  ): boolean {

    const currentVisit =
      this.visits()
        .find(
          visit =>
            visit.id === visitId
        );


    if (!currentVisit) {

      return false;
    }


    const checkOut =
      checkoutTime ??
      this.getDateTimeLocal();


    const durationMinutes =
      this.calculateDuration(
        currentVisit.checkIn,
        checkOut
      );


    const updatedVisit: Visit = {

      ...currentVisit,

      checkOut,

      durationMinutes,

      status: 'Completed'
    };


    this.visits.update(
      currentVisits =>
        currentVisits.map(
          visit =>
            visit.id === visitId
              ? updatedVisit
              : visit
        )
    );


    return true;
  }


  /* =========================================================
     DELETE VISIT
     ========================================================= */

  deleteVisit(
    id: number
  ): Observable<void> {

    return this.http
      .delete<void>(
        `${this.apiUrl}${id}/`
      )
      .pipe(

        tap(
          () => {

            this.visits.update(
              currentVisits =>
                currentVisits.filter(
                  visit =>
                    visit.id !== id
                )
            );
          }
        ),

        catchError(
          (error: HttpErrorResponse) => {

            console.error(
              'Failed to delete visitor:',
              error
            );

            return throwError(
              () => error
            );
          }
        )
      );
  }


  /* =========================================================
     MAP DJANGO RESPONSE
     ========================================================= */

  private mapVisit(
    data: any,
    fallback?: Partial<Visit>
  ): Visit {

    const firstName =
      data.first_name ??
      fallback?.firstName ??
      fallback?.visitorFirstName ??
      '';


    const secondName =
      data.second_name ??
      fallback?.secondName ??
      fallback?.visitorSecondName ??
      '';


    const lastName =
      data.last_name ??
      fallback?.lastName ??
      fallback?.visitorLastName ??
      '';


    const phone =
      data.phone ??
      fallback?.phone ??
      fallback?.visitorPhone ??
      '';


    const cardNumber =
      data.card_number ??
      fallback?.cardNumber ??
      fallback?.visitorCardNumber ??
      '';


    const patientId =
      Number(
        data.patient ??
        fallback?.patient ??
        fallback?.patientId ??
        0
      );


    const visitorNumber =
      Number(
        data.visitor_number ??
        fallback?.visitorNumber ??
        fallback?.slot ??
        1
      );


    const session =
      (
        data.session ??
        fallback?.session ??
        'Day'
      ) as VisitSession;


    const gender =
      (
        data.gender ??
        fallback?.gender ??
        fallback?.visitorGender ??
        'Male'
      ) as VisitorGender;


    const relation =
      (
        data.relation ??
        fallback?.relation ??
        fallback?.visitorRelation ??
        'Other'
      ) as VisitorRelation;


    const visitDate =
      data.visit_date ??
      fallback?.visitDate ??
      this.getToday();


    const visitTime =
      data.visit_time ??
      fallback?.visitTime ??
      this.getCurrentTime();


    const createdAt =
      data.created_at ??
      fallback?.createdAt ??
      new Date().toISOString();


    const checkIn =
      data.check_in ??
      fallback?.checkIn ??
      `${visitDate}T${visitTime}`;


    const checkOut =
      data.check_out ??
      fallback?.checkOut ??
      null;


    const durationMinutes =
      data.duration_minutes ??
      fallback?.durationMinutes ??
      null;


    const status =
      (
        data.status ??
        fallback?.status ??
        (
          checkOut
            ? 'Completed'
            : 'Checked In'
        )
      ) as VisitStatus;


    return {

      id:
        Number(
          data.id ??
          fallback?.id ??
          this.generateId()
        ),


      /* =====================================================
         PATIENT
         ===================================================== */

      patient:
        patientId,

      patientId:
        patientId,

      patientName:
        data.patient_name ??
        fallback?.patientName ??
        '',

      patientNumber:
        data.patient_number ??
        fallback?.patientNumber ??
        '',

      ward:
        data.ward ??
        fallback?.ward ??
        '',


      /* =====================================================
         VISITOR
         ===================================================== */

      firstName:
        firstName,

      secondName:
        secondName,

      lastName:
        lastName,

      visitorFirstName:
        firstName,

      visitorSecondName:
        secondName,

      visitorLastName:
        lastName,


      /* =====================================================
         CONTACT
         ===================================================== */

      phone:
        phone,

      visitorPhone:
        phone,

      cardNumber:
        cardNumber,

      visitorCardNumber:
        cardNumber,


      /* =====================================================
         DETAILS
         ===================================================== */

      gender:
        gender,

      visitorGender:
        gender,

      relation:
        relation,

      visitorRelation:
        relation,


      /* =====================================================
         SESSION
         ===================================================== */

      session:
        session,

      visitorNumber:
        visitorNumber,

      slot:
        visitorNumber,


      /* =====================================================
         TIME
         ===================================================== */

      visitDate:
        visitDate,

      visitTime:
        visitTime,

      createdAt:
        createdAt,

      checkIn:
        checkIn,

      checkOut:
        checkOut,

      durationMinutes:
        durationMinutes,


      /* =====================================================
         STATUS
         ===================================================== */

      status:
        status
    };
  }


  /* =========================================================
     CALCULATE DURATION
     ========================================================= */

  private calculateDuration(
    checkIn: string,
    checkOut: string
  ): number {

    const start =
      new Date(
        checkIn
      ).getTime();


    const end =
      new Date(
        checkOut
      ).getTime();


    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      end < start
    ) {

      return 0;
    }


    return Math.round(
      (
        end - start
      ) /
      60000
    );
  }


  /* =========================================================
     TODAY
     ========================================================= */

  private getToday(): string {

    const now =
      new Date();


    return [

      now.getFullYear(),

      String(
        now.getMonth() + 1
      ).padStart(
        2,
        '0'
      ),

      String(
        now.getDate()
      ).padStart(
        2,
        '0'
      )

    ].join('-');
  }


  /* =========================================================
     CURRENT TIME
     ========================================================= */

  private getCurrentTime(): string {

    const now =
      new Date();


    return [

      String(
        now.getHours()
      ).padStart(
        2,
        '0'
      ),

      String(
        now.getMinutes()
      ).padStart(
        2,
        '0'
      ),

      String(
        now.getSeconds()
      ).padStart(
        2,
        '0'
      )

    ].join(':');
  }


  /* =========================================================
     LOCAL DATETIME
     ========================================================= */

  private getDateTimeLocal(): string {

    const now =
      new Date();


    const year =
      now.getFullYear();


    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        '0'
      );


    const hours =
      String(
        now.getHours()
      ).padStart(
        2,
        '0'
      );


    const minutes =
      String(
        now.getMinutes()
      ).padStart(
        2,
        '0'
      );


    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}