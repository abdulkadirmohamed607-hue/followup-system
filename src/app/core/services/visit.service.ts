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

  private readonly apiUrl =
   'https://followup-system-backend.onrender.com/api/visits/'; // 'http://127.0.0.1:8000/api/visits/' 

  readonly visits =
    signal<Visit[]>([]);


  constructor(
    private http: HttpClient
  ) {}


  /* =========================================================
     LOAD VISITS
     ========================================================= */

  loadVisits(): Observable<Visit[]> {

    return this.http
      .get<any>(this.apiUrl)
      .pipe(

        map(response => {

          /*
           * Django REST Framework can return:
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

          if (Array.isArray(response)) {
            return response;
          }

          if (
            response &&
            Array.isArray(response.results)
          ) {
            return response.results;
          }

          return [];
        }),


        map(
          (results: any[]) =>
            results.map(
              visit =>
                this.mapVisit(visit)
            )
        ),


        tap(
          visits => {

            console.log(
              'Visits loaded from API:',
              visits
            );

            this.visits.set(
              visits
            );
          }
        ),


        catchError(
          (error: HttpErrorResponse) => {

            console.error(
              'Failed to load visits:',
              error
            );

            this.visits.set([]);

            return throwError(
              () => error
            );
          }
        )
      );
  }


  /* =========================================================
     GET ALL VISITS FROM SIGNAL
     ========================================================= */

  getVisits(): Visit[] {

    return [
      ...this.visits()
    ];
  }


  /* =========================================================
     GET PATIENT VISITS
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
     GET SESSION VISITS
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
      date ??
      this.getToday();

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
     MAX VISITOR SLOTS
     
     IMPORTANT:
     Morning = 2
     Day     = 2
     Evening = 3
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
     GET SPECIFIC SLOT VISIT
     ========================================================= */

  getSlotVisit(
    patientId: number,
    session: VisitSession,
    slot: VisitSlot,
    date?: string
  ): Visit | undefined {

    const visitDate =
      date ??
      this.getToday();

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
     ADD VISIT
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


    console.log(
      'Adding visitor:',
      payload
    );


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
     CHECKOUT VISIT
     ========================================================= */

  checkoutVisit(
    visitId: number,
    checkoutTime?: string
  ): Observable<Visit> {

    const checkOut =
      checkoutTime ??
      this.getDateTimeLocal();


    return this.http
      .patch<any>(
        `${this.apiUrl}${visitId}/`,
        {
          check_out: checkOut
        }
      )
      .pipe(

        map(
          response =>
            this.mapVisit(
              response
            )
        ),


        tap(
          updatedVisit => {

            this.visits.update(
              currentVisits =>
                currentVisits.map(
                  visit =>
                    visit.id === visitId
                      ? updatedVisit
                      : visit
                )
            );
          }
        ),


        catchError(
          (error: HttpErrorResponse) => {

            console.error(
              'Failed to checkout visitor:',
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
     MAP API VISIT → ANGULAR VISIT MODEL
     ========================================================= */

  private mapVisit(
    data: any,
    fallback?: Partial<Visit>
  ): Visit {


    /* ---------------------------------------------------------
       VISITOR NAME
       --------------------------------------------------------- */

    const firstName =
      this.cleanString(
        data?.first_name ??
        fallback?.firstName ??
        fallback?.visitorFirstName
      );


    const secondName =
      this.cleanString(
        data?.second_name ??
        fallback?.secondName ??
        fallback?.visitorSecondName
      );


    const lastName =
      this.cleanString(
        data?.last_name ??
        fallback?.lastName ??
        fallback?.visitorLastName
      );


    /* ---------------------------------------------------------
       PHONE
       --------------------------------------------------------- */

    const phone =
      this.cleanString(
        data?.phone ??
        fallback?.phone ??
        fallback?.visitorPhone
      );


    /* ---------------------------------------------------------
       CARD NUMBER
       --------------------------------------------------------- */

    const cardNumber =
      this.cleanString(
        data?.card_number ??
        fallback?.cardNumber ??
        fallback?.visitorCardNumber
      );


    /* ---------------------------------------------------------
       PATIENT ID
       --------------------------------------------------------- */

    const patientId =
      Number(
        data?.patient ??
        data?.patient_id ??
        fallback?.patient ??
        fallback?.patientId ??
        0
      );


    /* ---------------------------------------------------------
       VISITOR NUMBER
       --------------------------------------------------------- */

    const visitorNumber =
      Number(
        data?.visitor_number ??
        fallback?.visitorNumber ??
        fallback?.slot ??
        1
      );


    /* ---------------------------------------------------------
       SESSION
       
       KEEP EXACT STRUCTURE:
       
       Morning
       Day
       Evening
       --------------------------------------------------------- */

    const session =
      this.normalizeSession(
        data?.session ??
        fallback?.session ??
        'Day'
      );


    /* ---------------------------------------------------------
       GENDER
       --------------------------------------------------------- */

    const gender =
      (
        data?.gender ??
        fallback?.gender ??
        fallback?.visitorGender ??
        'Male'
      ) as VisitorGender;


    /* ---------------------------------------------------------
       RELATION
       --------------------------------------------------------- */

    const relation =
      (
        data?.relation ??
        fallback?.relation ??
        fallback?.visitorRelation ??
        'Other'
      ) as VisitorRelation;


    /* ---------------------------------------------------------
       DATE
       --------------------------------------------------------- */

    const visitDate =
      this.normalizeDate(
        data?.visit_date ??
        fallback?.visitDate ??
        this.getToday()
      );


    /* ---------------------------------------------------------
       TIME
       --------------------------------------------------------- */

    const visitTime =
      this.normalizeTime(
        data?.visit_time ??
        fallback?.visitTime ??
        this.getCurrentTime()
      );


    /* ---------------------------------------------------------
       CREATED AT
       --------------------------------------------------------- */

    const createdAt =
      data?.created_at ??
      fallback?.createdAt ??
      new Date().toISOString();


    /* ---------------------------------------------------------
       CHECK IN
       
       Backend response does not contain check_in.
       
       Therefore construct it using:
       
       visit_date + visit_time
       --------------------------------------------------------- */

    const checkIn =
      data?.check_in ??
      fallback?.checkIn ??
      `${visitDate}T${visitTime}`;


    /* ---------------------------------------------------------
       CHECK OUT
       --------------------------------------------------------- */

    const checkOut =
      data?.check_out ??
      fallback?.checkOut ??
      null;


    /* ---------------------------------------------------------
       DURATION
       --------------------------------------------------------- */

    let durationMinutes =
      data?.duration_minutes ??
      fallback?.durationMinutes ??
      null;


    /*
     * If backend did not provide duration,
     * calculate it from check-in and check-out.
     */

    if (
      durationMinutes === null &&
      checkOut
    ) {

      durationMinutes =
        this.calculateDuration(
          checkIn,
          checkOut
        );
    }


    /* ---------------------------------------------------------
       STATUS
       --------------------------------------------------------- */

    const status =
      (
        data?.status ??
        fallback?.status ??
        (
          checkOut
            ? 'Completed'
            : 'Checked In'
        )
      ) as VisitStatus;


    /* ---------------------------------------------------------
       FINAL ANGULAR MODEL
       --------------------------------------------------------- */

    return {

      id:
        Number(
          data?.id ??
          fallback?.id ??
          this.generateId()
        ),


      /* PATIENT */

      patient:
        patientId,

      patientId:
        patientId,

      patientName:
        this.cleanString(
          data?.patient_name ??
          fallback?.patientName
        ),

      patientNumber:
        this.cleanString(
          data?.patient_number ??
          fallback?.patientNumber
        ),

      ward:
        this.cleanString(
          data?.ward ??
          fallback?.ward
        ),


      /* VISITOR NAMES */

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


      /* PHONE */

      phone:
        phone,

      visitorPhone:
        phone,


      /* CARD */

      cardNumber:
        cardNumber,

      visitorCardNumber:
        cardNumber,


      /* DETAILS */

      gender:
        gender,

      visitorGender:
        gender,

      relation:
        relation,

      visitorRelation:
        relation,


      /* SESSION */

      session:
        session,

      visitorNumber:
        visitorNumber,

      slot:
        visitorNumber,


      /* TIME */

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


      /* STATUS */

      status:
        status
    };
  }


  /* =========================================================
     NORMALIZE SESSION
     
     IMPORTANT:
     Only these three sessions are supported:
     
     Morning
     Day
     Evening
     ========================================================= */

  private normalizeSession(
    value: any
  ): VisitSession {

    const session =
      String(
        value ?? ''
      )
        .trim()
        .toLowerCase();


    switch (session) {

      case 'morning':
        return 'Morning';

      case 'day':
        return 'Day';

      case 'evening':
        return 'Evening';

      default:
        return 'Day';
    }
  }


  /* =========================================================
     NORMALIZE DATE
     ========================================================= */

  private normalizeDate(
    value: any
  ): string {

    if (!value) {
      return this.getToday();
    }


    const stringValue =
      String(value).trim();


    /*
     * Already YYYY-MM-DD
     */

    if (
      /^\d{4}-\d{2}-\d{2}$/
        .test(stringValue)
    ) {

      return stringValue;
    }


    /*
     * ISO datetime
     */

    if (
      stringValue.includes('T')
    ) {

      return stringValue
        .split('T')[0];
    }


    return stringValue;
  }


  /* =========================================================
     NORMALIZE TIME
     ========================================================= */

  private normalizeTime(
    value: any
  ): string {

    if (!value) {
      return this.getCurrentTime();
    }


    const time =
      String(value)
        .trim();


    /*
     * Django may return:
     *
     * 16:31:44.591936
     *
     * Angular only needs:
     *
     * 16:31:44
     */

    return time
      .split('.')[0];
  }


  /* =========================================================
     CLEAN STRING
     ========================================================= */

  private cleanString(
    value: any
  ): string {

    if (
      value === null ||
      value === undefined
    ) {

      return '';
    }


    return String(value)
      .trim();
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