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
  of,
  shareReplay,
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

import {
  environment
} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VisitService {

  private readonly apiUrl =
    `${environment.apiUrl}/visits/`;

  readonly visits =
    signal<Visit[]>([]);

  /*
  =========================================================
  REQUEST CACHE
  =========================================================

  Prevents multiple components / calls from sending
  duplicate GET /api/visits/ requests.
  */
  private visitsRequest$:
    Observable<Visit[]> | null = null;

  constructor(
    private http: HttpClient
  ) {}

  /* =========================================================
     LOAD VISITS
     ========================================================= */

  loadVisits(
    forceRefresh = false
  ): Observable<Visit[]> {

    /*
    If force refresh was requested,
    clear the previous cached request.
    */
    if (forceRefresh) {
      this.visitsRequest$ = null;
    }

    /*
    If a request is already in progress/cached,
    return the same Observable instead of creating
    another HTTP request.
    */
    if (this.visitsRequest$) {
      return this.visitsRequest$;
    }

    /*
    If visits are already available in memory and
    no force refresh was requested, use the signal.

    This prevents unnecessary API calls when another
    component already loaded the visits.
    */
    if (!forceRefresh && this.visits().length > 0) {
      return of(this.visits());
    }

    /*
    Create one HTTP request and share its result.
    */
    this.visitsRequest$ = this.http
      .get<any>(this.apiUrl)
      .pipe(

        /*
        Handle normal array response.
        */
        map(response => {

          if (Array.isArray(response)) {
            return response;
          }

          /*
          Handle Django REST Framework pagination.
          */
          if (
            response &&
            Array.isArray(response.results)
          ) {
            return response.results;
          }

          return [];
        }),

        /*
        Convert API objects to Angular Visit model.
        */
        map(
          (results: any[]) =>
            results.map(
              visit =>
                this.mapVisit(visit)
            )
        ),

        /*
        Store visits in signal.
        */
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

        /*
        shareReplay ensures multiple subscribers
        share one HTTP request/result.
        */
        shareReplay({
          bufferSize: 1,
          refCount: true
        }),

        /*
        Error handling.
        */
        catchError(
          (error: HttpErrorResponse) => {

            console.error(
              'Failed to load visits:',
              error
            );

            /*
            Allow another request after failure.
            */
            this.visitsRequest$ = null;

            this.visits.set([]);

            return throwError(
              () => error
            );
          }
        )
      );

    return this.visitsRequest$;
  }

  /* =========================================================
     FORCE REFRESH VISITS
     ========================================================= */

  refreshVisits(): Observable<Visit[]> {

    return this.loadVisits(true);
  }

  /* =========================================================
     CLEAR REQUEST CACHE
     ========================================================= */

  clearVisitsCache(): void {

    this.visitsRequest$ = null;
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

        /*
        IMPORTANT:

        The newly created visit is immediately
        added to the signal.

        Therefore VisitorCheck does NOT need
        another GET /api/visits/ after saving.
        */
        tap(
          savedVisit => {

            this.visits.update(
              currentVisits => [
                savedVisit,
                ...currentVisits
              ]
            );

            /*
            Existing cached request may now contain
            an old snapshot. Clear it so a future
            explicit refresh can request fresh data.
            */
            this.visitsRequest$ = null;
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

            /*
            Signal already contains the updated visit.
            Clear stale cached request.
            */
            this.visitsRequest$ = null;
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

            /*
            Signal has already been updated.
            */
            this.visitsRequest$ = null;
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

    const phone =
      this.cleanString(
        data?.phone ??
        fallback?.phone ??
        fallback?.visitorPhone
      );

    const cardNumber =
      this.cleanString(
        data?.card_number ??
        fallback?.cardNumber ??
        fallback?.visitorCardNumber
      );

    const patientId =
      Number(
        data?.patient ??
        data?.patient_id ??
        fallback?.patient ??
        fallback?.patientId ??
        0
      );

    const visitorNumber =
      Number(
        data?.visitor_number ??
        fallback?.visitorNumber ??
        fallback?.slot ??
        1
      );

    const session =
      this.normalizeSession(
        data?.session ??
        fallback?.session ??
        'Day'
      );

    const gender =
      (
        data?.gender ??
        fallback?.gender ??
        fallback?.visitorGender ??
        'Male'
      ) as VisitorGender;

    const relation =
      (
        data?.relation ??
        fallback?.relation ??
        fallback?.visitorRelation ??
        'Other'
      ) as VisitorRelation;

    const visitDate =
      this.normalizeDate(
        data?.visit_date ??
        fallback?.visitDate ??
        this.getToday()
      );

    const visitTime =
      this.normalizeTime(
        data?.visit_time ??
        fallback?.visitTime ??
        this.getCurrentTime()
      );

    const createdAt =
      data?.created_at ??
      fallback?.createdAt ??
      new Date().toISOString();

    const checkIn =
      data?.check_in ??
      fallback?.checkIn ??
      `${visitDate}T${visitTime}`;

    const checkOut =
      data?.check_out ??
      fallback?.checkOut ??
      null;

    let durationMinutes =
      data?.duration_minutes ??
      fallback?.durationMinutes ??
      null;

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

    return {

      id:
        Number(
          data?.id ??
          fallback?.id ??
          this.generateId()
        ),

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

      phone:
        phone,

      visitorPhone:
        phone,

      cardNumber:
        cardNumber,

      visitorCardNumber:
        cardNumber,

      gender:
        gender,

      visitorGender:
        gender,

      relation:
        relation,

      visitorRelation:
        relation,

      session:
        session,

      visitorNumber:
        visitorNumber,

      slot:
        visitorNumber,

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

      status:
        status
    };
  }

  /* =========================================================
     NORMALIZE SESSION
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

    if (
      /^\d{4}-\d{2}-\d{2}$/
        .test(stringValue)
    ) {
      return stringValue;
    }

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
     GET TODAY
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
     GET CURRENT TIME
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
     GET LOCAL DATETIME
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