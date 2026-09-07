import {
  Component,
  OnInit,
  PLATFORM_ID,
  ChangeDetectorRef,
  afterNextRender,
  inject
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  Patient
} from '../../core/models/patient';

import {
  Visit
} from '../../core/models/visit';

import {
  PatientService
} from '../../core/services/patient.service';

import {
  VisitService
} from '../../core/services/visit.service';


@Component({

  selector: 'app-dashboard',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './dashboard.html',

  styleUrl: './dashboard.css'

})


export class Dashboard
  implements OnInit {


  // =====================================================
  // PLATFORM
  // =====================================================

  private readonly platformId =
    inject(PLATFORM_ID);


  // =====================================================
  // CHANGE DETECTION
  // =====================================================

  private readonly cdr =
    inject(ChangeDetectorRef);


  // =====================================================
  // DATA
  // =====================================================

  patients: Patient[] = [];

  visits: Visit[] = [];


  // =====================================================
  // TODAY
  // =====================================================

  today =
    this.getToday();


  // =====================================================
  // LOADING
  // =====================================================

  loading = false;


  // =====================================================
  // ERROR
  // =====================================================

  errorMessage = '';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private patientService: PatientService,

    private visitService: VisitService

  ) {

    /*
     * IMPORTANT
     *
     * Dashboard data is loaded only after browser
     * hydration has completed.
     *
     * This allows localStorage JWT authentication
     * to be available before API requests are made.
     */

    afterNextRender(() => {

      this.loadDashboardData();

    });

  }


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    /*
     * Do not load API data here.
     *
     * The API loading is handled by afterNextRender()
     * because this application uses SSR/hydration.
     */

  }


  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  loadDashboardData(): void {

    // -----------------------------------------------------
    // BROWSER ONLY
    // -----------------------------------------------------

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;

    }


    // -----------------------------------------------------
    // START LOADING
    // -----------------------------------------------------

    this.loading = true;

    this.errorMessage = '';

    this.today =
      this.getToday();


    console.log(
      'Dashboard: starting data loading...'
    );


    // =====================================================
    // LOAD PATIENTS FROM API
    // =====================================================

    this.patientService
      .ensurePatientsLoaded()
      .subscribe({

        next: (
          patients: Patient[]
        ) => {

          /*
           * Keep only admitted patients on Dashboard.
           */

          this.patients =
            patients.filter(
              patient =>
                patient.status === 'Admitted'
            );


          console.log(
            'Dashboard patients loaded:',
            this.patients
          );


          this.cdr.markForCheck();

        },


        error: error => {

          console.error(
            'Dashboard patient loading failed:',
            error
          );


          this.patients = [];

          this.errorMessage =
            'Failed to load patients.';


          this.cdr.markForCheck();

        }

      });


    // =====================================================
    // LOAD VISITS FROM API
    // =====================================================

    this.visitService
      .loadVisits()
      .subscribe({

        next: (
          visits: Visit[]
        ) => {

          /*
           * IMPORTANT:
           *
           * Do NOT use getVisits() here.
           *
           * loadVisits() gets the latest data directly
           * from Django API and updates VisitService signal.
           */

          this.visits =
            [...visits];


          console.log(
            'Dashboard visits loaded:',
            this.visits
          );


          this.loading = false;


          // -------------------------------------------------
          // FORCE UI UPDATE
          // -------------------------------------------------

          this.cdr.markForCheck();

          this.cdr.detectChanges();

        },


        error: error => {

          console.error(
            'Dashboard visit loading failed:',
            error
          );


          this.visits = [];

          this.loading = false;

          this.errorMessage =
            'Failed to load visit data.';


          this.cdr.markForCheck();

          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // MANUAL REFRESH
  // =====================================================

  refreshDashboard(): void {

    /*
     * Force fresh data from API.
     */

    this.loadDashboardData();

  }


  // =====================================================
  // TOTAL PATIENTS
  // =====================================================

  get totalPatients(): number {

    return this.patients.length;

  }


  // =====================================================
  // TODAY'S VISITS
  // =====================================================

  get todayVisits(): Visit[] {

    return this.visits.filter(

      visit =>
        visit.visitDate ===
        this.today

    );

  }


  // =====================================================
  // TOTAL VISITORS TODAY
  // =====================================================

  get totalVisitorsToday(): number {

    return this.todayVisits.length;

  }


  // =====================================================
  // CHECKED IN
  // =====================================================

  get totalCheckedIn(): number {

    return this.todayVisits.filter(

      visit =>
        visit.status ===
        'Checked In'

    ).length;

  }


  // =====================================================
  // COMPLETED
  // =====================================================

  get totalCompleted(): number {

    return this.todayVisits.filter(

      visit =>
        visit.status ===
        'Completed'

    ).length;

  }


  // =====================================================
  // MORNING VISITS
  // =====================================================

  get totalMorningVisits(): number {

    return this.todayVisits.filter(

      visit =>
        visit.session ===
        'Morning'

    ).length;

  }


  // =====================================================
  // DAY VISITS
  // =====================================================

  get totalDayVisits(): number {

    return this.todayVisits.filter(

      visit =>
        visit.session ===
        'Day'

    ).length;

  }


  // =====================================================
  // EVENING VISITS
  // =====================================================

  get totalEveningVisits(): number {

    return this.todayVisits.filter(

      visit =>
        visit.session ===
        'Evening'

    ).length;

  }


  // =====================================================
  // RECENT VISITS
  // =====================================================

  get recentVisits(): Visit[] {

    return this.todayVisits

      .slice()

      .sort(
        (
          a,
          b
        ) => {

          const timeA =
            a.checkIn
              ? new Date(
                  a.checkIn
                ).getTime()
              : 0;


          const timeB =
            b.checkIn
              ? new Date(
                  b.checkIn
                ).getTime()
              : 0;


          return timeB - timeA;

        }
      )

      .slice(
        0,
        10
      );

  }


  // =====================================================
  // VISITOR FULL NAME
  // =====================================================

  getVisitorName(
    visit: Visit
  ): string {

    return [

      visit.visitorFirstName,

      visit.visitorSecondName,

      visit.visitorLastName

    ]

      .filter(
        name =>
          !!name?.trim()
      )

      .join(' ');

  }


  // =====================================================
  // FORMAT TIME
  // =====================================================

  formatTime(
    value:
      string |
      null |
      undefined
  ): string {

    if (!value) {

      return '-';

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '-';

    }


    return date.toLocaleTimeString(

      [],

      {

        hour:
          '2-digit',

        minute:
          '2-digit'

      }

    );

  }


  // =====================================================
  // GET TODAY
  // =====================================================

  private getToday(): string {

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


    return `${year}-${month}-${day}`;

  }

}