
import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  Observable,
  catchError,
  shareReplay,
  tap,
  throwError
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

export type SessionCode =
  | 'MORNING'
  | 'DAY'
  | 'EVENING';

export interface SessionSetting {
  id: number;
  session: SessionCode;
  session_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateSessionSettingRequest {
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SystemSettingsService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/session-settings`;

  /*
  =========================================================
  SESSION SETTINGS REQUEST CACHE
  =========================================================

  Prevents multiple components from sending duplicate
  GET /api/session-settings/ requests.

  Example:

  Component A -> getSessionSettings()
  Component B -> getSessionSettings()

  Both will use the same HTTP request.
  */

  private sessionSettingsRequest$:
    Observable<SessionSetting[]> | null = null;


  /* =======================================================
     GET ALL SESSION SETTINGS
     ======================================================= */

  getSessionSettings(
    forceRefresh = false
  ): Observable<SessionSetting[]> {

    /*
    If manual refresh was requested,
    remove the existing cached request.
    */
    if (forceRefresh) {

      this.sessionSettingsRequest$ = null;
    }


    /*
    If a request already exists,
    reuse it.
    */
    if (this.sessionSettingsRequest$) {

      return this.sessionSettingsRequest$;
    }


    /*
    Create the HTTP request only once.
    */
    this.sessionSettingsRequest$ =
      this.http
        .get<SessionSetting[]>(
          `${this.apiUrl}/`
        )
        .pipe(

          /*
          Share the same response with all subscribers.
          */
          shareReplay({
            bufferSize: 1,
            refCount: true
          }),

          /*
          If request fails, clear cache so the next
          attempt can try again.
          */
          catchError(
            (error: HttpErrorResponse) => {

              this.sessionSettingsRequest$ = null;

              return this.handleError(
                error
              );
            }
          )
        );


    return this.sessionSettingsRequest$;
  }


  /* =======================================================
     FORCE REFRESH
     ======================================================= */

  refreshSessionSettings():
    Observable<SessionSetting[]> {

    return this.getSessionSettings(
      true
    );
  }


  /* =======================================================
     CLEAR CACHE
     ======================================================= */

  clearSessionSettingsCache(): void {

    this.sessionSettingsRequest$ = null;
  }


  /* =======================================================
     GET ONE SESSION SETTING
     ======================================================= */

  getSessionSetting(
    id: number
  ): Observable<SessionSetting> {

    return this.http
      .get<SessionSetting>(
        `${this.apiUrl}/${id}/`
      )
      .pipe(
        catchError(
          this.handleError
        )
      );
  }


  /* =======================================================
     UPDATE ONE SESSION SETTING
     ======================================================= */

  updateSessionSetting(
    id: number,
    data: UpdateSessionSettingRequest
  ): Observable<SessionSetting> {

    return this.http
      .patch<SessionSetting>(
        `${this.apiUrl}/${id}/`,
        data
      )
      .pipe(

        /*
        Clear old cached list after update.
        */
        tap(
          () => {
            this.sessionSettingsRequest$ = null;
          }
        ),

        catchError(
          this.handleError
        )
      );
  }


  /* =======================================================
     DETERMINE CURRENT SESSION
     ======================================================= */

  getCurrentSession(
    settings: SessionSetting[],
    now: Date = new Date()
  ): SessionCode | null {

    const currentMinutes =
      now.getHours() * 60 +
      now.getMinutes();


    for (const setting of settings) {

      if (!setting.is_active) {
        continue;
      }


      const startMinutes =
        this.timeToMinutes(
          setting.start_time
        );


      const endMinutes =
        this.timeToMinutes(
          setting.end_time
        );


      /*
      =======================================================
      NORMAL SESSION

      Example:
      05:00 -> 11:59
      =======================================================
      */

      if (
        startMinutes <=
        endMinutes
      ) {

        if (
          currentMinutes >=
          startMinutes &&

          currentMinutes <=
          endMinutes
        ) {

          return setting.session;
        }


      /*
      =======================================================
      OVERNIGHT SESSION

      Example:
      18:00 -> 04:59
      =======================================================
      */

      } else {

        if (
          currentMinutes >=
          startMinutes ||

          currentMinutes <=
          endMinutes
        ) {

          return setting.session;
        }
      }
    }


    return null;
  }


  /* =======================================================
     CONVERT TIME TO MINUTES
     ======================================================= */

  private timeToMinutes(
    value: string
  ): number {

    const parts =
      value.split(':');


    const hours =
      Number(
        parts[0] ?? 0
      );


    const minutes =
      Number(
        parts[1] ?? 0
      );


    return (
      hours * 60 +
      minutes
    );
  }


  /* =======================================================
     API ERROR HANDLER
     ======================================================= */

  private handleError = (
    error: HttpErrorResponse
  ) => {

    let message =
      'An unexpected error occurred.';


    if (
      error.status === 401
    ) {

      message =
        'Authentication required. Please login again.';


    } else if (
      error.status === 403
    ) {

      message =
        'You do not have permission to access System Settings.';


    } else if (
      error.status === 404
    ) {

      message =
        'System Settings endpoint was not found.';


    } else if (
      error.error?.detail
    ) {

      message =
        error.error.detail;


    } else if (
      error.message
    ) {

      message =
        error.message;
    }


    console.error(
      'System Settings API Error:',
      error
    );


    return throwError(
      () => new Error(message)
    );
  };
}