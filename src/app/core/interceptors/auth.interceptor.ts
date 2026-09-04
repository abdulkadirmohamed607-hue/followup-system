import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  inject
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  throwError
} from 'rxjs';

import {
  AuthService
} from '../services/auth.service';


let refreshRequest$:
  Observable<{ access: string }> | null =
  null;


export const authInterceptor:
  HttpInterceptorFn = (
    req,
    next
  ) => {

  const authService =
    inject(AuthService);

  const router =
    inject(Router);


  // =========================================================
  // AUTH ENDPOINTS
  // =========================================================

  const isAuthRequest =
    req.url.includes(
      '/api/auth/login/'
    ) ||
    req.url.includes(
      '/api/auth/token/refresh/'
    );


  // =========================================================
  // ACCESS TOKEN
  // =========================================================

  const accessToken =
    authService.getAccessToken();


  // =========================================================
  // ATTACH TOKEN
  // =========================================================

  let request =
    req;

  if (
    accessToken &&
    !isAuthRequest
  ) {

    request =
      req.clone({

        setHeaders: {

          Authorization:
            `Bearer ${accessToken}`

        }

      });

  }


  // =========================================================
  // REQUEST
  // =========================================================

  return next(request)
    .pipe(

      catchError(error => {

        if (
          !(error instanceof HttpErrorResponse)
        ) {

          return throwError(
            () => error
          );

        }


        // =====================================================
        // ONLY HANDLE 401
        // =====================================================

        if (
          error.status !== 401
        ) {

          return throwError(
            () => error
          );

        }


        // =====================================================
        // NEVER REFRESH AUTH REQUESTS
        // =====================================================

        if (isAuthRequest) {

          return throwError(
            () => error
          );

        }


        // =====================================================
        // REFRESH TOKEN
        // =====================================================

        const refreshToken =
          authService.getRefreshToken();


        if (!refreshToken) {

          authService
            .clearAuthentication();

          router.navigate([
            '/login'
          ]);

          return throwError(
            () => error
          );

        }


        // =====================================================
        // CREATE ONLY ONE REFRESH REQUEST
        // =====================================================

        if (!refreshRequest$) {

          refreshRequest$ =
            authService
              .refreshAccessToken()
              .pipe(

                shareReplay(1),

                finalize(() => {

                  refreshRequest$ =
                    null;

                })

              );

        }


        // =====================================================
        // WAIT FOR REFRESH
        // =====================================================

        return refreshRequest$
          .pipe(

            switchMap(
              response => {

                const newAccessToken =
                  response.access;


                // =================================================
                // RETRY ORIGINAL REQUEST
                // =================================================

                const retryRequest =
                  req.clone({

                    setHeaders: {

                      Authorization:
                        `Bearer ${newAccessToken}`

                    }

                  });


                return next(
                  retryRequest
                );

              }
            ),

            catchError(
              refreshError => {

                authService
                  .clearAuthentication();

                router.navigate([
                  '/login'
                ]);

                return throwError(
                  () => refreshError
                );

              }
            )

          );

      })

    );

};