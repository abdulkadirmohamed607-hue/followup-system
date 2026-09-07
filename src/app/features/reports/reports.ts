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
  FormsModule
} from '@angular/forms';

import {
  VisitService
} from '../../core/services/visit.service';

import {
  Visit,
  VisitSession
} from '../../core/models/visit';


@Component({
  selector: 'app-reports',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {

  // =========================================================
  // PLATFORM
  // =========================================================

  private readonly platformId =
    inject(PLATFORM_ID);


  // =========================================================
  // CHANGE DETECTION
  // =========================================================

  private readonly cdr =
    inject(ChangeDetectorRef);


  // =========================================================
  // VISITS
  // =========================================================

  visits: Visit[] = [];


  // =========================================================
  // SEARCH
  // =========================================================

  searchText = '';


  // =========================================================
  // SESSION FILTER
  //
  // Morning = 2
  // Day     = 2
  // Evening = 3
  // =========================================================

  selectedSession:
    VisitSession | 'All' = 'All';


  // =========================================================
  // STATUS FILTER
  // =========================================================

  selectedStatus:
    'All' |
    'Checked In' |
    'Completed' = 'All';


  // =========================================================
  // DATE FILTERS
  // =========================================================

  dateFrom = '';

  dateTo = '';


  // =========================================================
  // PAGINATION
  // =========================================================

  currentPage = 1;

  pageSize = 10;


  // =========================================================
  // LOADING
  // =========================================================

  loading = false;

  errorMessage = '';


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private visitService: VisitService
  ) {

    /*
     * IMPORTANT:
     *
     * Do not load the protected API during SSR.
     *
     * afterNextRender() runs in the browser after
     * Angular has rendered/hydrated the page.
     */

    afterNextRender(() => {

      this.loadVisits();

    });
  }


  // =========================================================
  // ON INIT
  // =========================================================

  ngOnInit(): void {

    /*
     * API loading is intentionally NOT done here.
     *
     * It is handled by afterNextRender().
     */

  }


  // =========================================================
  // LOAD VISITS
  // =========================================================

  loadVisits(): void {

    // ---------------------------------------------------------
    // BROWSER ONLY
    // ---------------------------------------------------------

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;
    }


    // ---------------------------------------------------------
    // LOADING START
    // ---------------------------------------------------------

    this.loading = true;

    this.errorMessage = '';


    // ---------------------------------------------------------
    // API
    // ---------------------------------------------------------

    this.visitService
      .loadVisits()
      .subscribe({

        // =====================================================
        // SUCCESS
        // =====================================================

        next: (visits: Visit[]) => {

          console.log(
            'REPORTS API RESPONSE:',
            visits
          );


          // ---------------------------------------------------
          // UPDATE DATA
          // ---------------------------------------------------

          this.visits = [
            ...visits
          ];


          // ---------------------------------------------------
          // RESET PAGINATION
          // ---------------------------------------------------

          this.currentPage = 1;


          // ---------------------------------------------------
          // STOP LOADING
          // ---------------------------------------------------

          this.loading = false;


          // ---------------------------------------------------
          // FORCE ANGULAR UI UPDATE
          //
          // This is important for Angular SSR/hydration and
          // zoneless change detection.
          // ---------------------------------------------------

          this.cdr.markForCheck();

          this.cdr.detectChanges();


          console.log(
            'REPORTS DATA AFTER UPDATE:',
            this.visits
          );

        },


        // =====================================================
        // ERROR
        // =====================================================

        error: (error) => {

          this.loading = false;


          this.errorMessage =
            'Failed to load visit reports.';


          console.error(
            'Failed to load visit reports:',
            error
          );


          // ---------------------------------------------------
          // UPDATE ERROR MESSAGE IN UI
          // ---------------------------------------------------

          this.cdr.markForCheck();

          this.cdr.detectChanges();

        }

      });
  }


  // =========================================================
  // REFRESH
  // =========================================================

  refreshReports(): void {

    this.loadVisits();
  }


  // =========================================================
  // FILTERED VISITS
  // =========================================================

  get filteredVisits(): Visit[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    return this.visits
      .filter((visit: Visit) => {


        // =====================================================
        // SEARCH
        // =====================================================

        if (search) {

          const patientName =
            String(
              visit.patientName ?? ''
            )
              .toLowerCase();


          const patientNumber =
            String(
              visit.patientNumber ?? ''
            )
              .toLowerCase();


          const ward =
            String(
              visit.ward ?? ''
            )
              .toLowerCase();


          const firstName =
            String(
              visit.visitorFirstName ?? ''
            )
              .toLowerCase();


          const secondName =
            String(
              visit.visitorSecondName ?? ''
            )
              .toLowerCase();


          const lastName =
            String(
              visit.visitorLastName ?? ''
            )
              .toLowerCase();


          const phone =
            String(
              visit.visitorPhone ?? ''
            )
              .toLowerCase();


          const cardNumber =
            String(
              visit.visitorCardNumber ?? ''
            )
              .toLowerCase();


          const relation =
            String(
              visit.visitorRelation ?? ''
            )
              .toLowerCase();


          const fullVisitorName =
            `${firstName} ${secondName} ${lastName}`
              .toLowerCase();


          const matchesSearch =

            patientName.includes(search) ||

            patientNumber.includes(search) ||

            ward.includes(search) ||

            firstName.includes(search) ||

            secondName.includes(search) ||

            lastName.includes(search) ||

            fullVisitorName.includes(search) ||

            phone.includes(search) ||

            cardNumber.includes(search) ||

            relation.includes(search);


          if (!matchesSearch) {

            return false;
          }
        }


        // =====================================================
        // SESSION
        // =====================================================

        if (
          this.selectedSession !== 'All' &&
          visit.session !==
            this.selectedSession
        ) {

          return false;
        }


        // =====================================================
        // STATUS
        // =====================================================

        if (
          this.selectedStatus !== 'All' &&
          visit.status !==
            this.selectedStatus
        ) {

          return false;
        }


        // =====================================================
        // DATE FROM
        // =====================================================

        if (
          this.dateFrom &&
          visit.visitDate <
            this.dateFrom
        ) {

          return false;
        }


        // =====================================================
        // DATE TO
        // =====================================================

        if (
          this.dateTo &&
          visit.visitDate >
            this.dateTo
        ) {

          return false;
        }


        return true;

      });
  }


  // =========================================================
  // INVALID DATE RANGE
  // =========================================================

  get isInvalidDateRange(): boolean {

    if (
      !this.dateFrom ||
      !this.dateTo
    ) {

      return false;
    }


    return (
      this.dateFrom >
      this.dateTo
    );
  }


  // =========================================================
  // TOTAL VISITS
  // =========================================================

  get totalVisits(): number {

    return this.filteredVisits.length;
  }


  // =========================================================
  // TOTAL PATIENTS
  // =========================================================

  get totalPatients(): number {

    const patientIds =
      new Set(
        this.filteredVisits
          .map(
            visit =>
              visit.patientId
          )
          .filter(
            id =>
              id !== 0 &&
              id !== null &&
              id !== undefined
          )
      );


    return patientIds.size;
  }


  // =========================================================
  // MORNING
  // =========================================================

  get morningVisits(): number {

    return this.filteredVisits
      .filter(
        visit =>
          visit.session === 'Morning'
      )
      .length;
  }


  // =========================================================
  // DAY
  // =========================================================

  get dayVisits(): number {

    return this.filteredVisits
      .filter(
        visit =>
          visit.session === 'Day'
      )
      .length;
  }


  // =========================================================
  // EVENING
  // =========================================================

  get eveningVisits(): number {

    return this.filteredVisits
      .filter(
        visit =>
          visit.session === 'Evening'
      )
      .length;
  }


  // =========================================================
  // COMPLETED
  // =========================================================

  get completedVisits(): number {

    return this.filteredVisits
      .filter(
        visit =>
          visit.status === 'Completed'
      )
      .length;
  }


  // =========================================================
  // CHECKED IN
  // =========================================================

  get checkedInVisits(): number {

    return this.filteredVisits
      .filter(
        visit =>
          visit.status === 'Checked In'
      )
      .length;
  }


  // =========================================================
  // TOTAL PAGES
  // =========================================================

  get totalPages(): number {

    if (
      this.filteredVisits.length === 0
    ) {

      return 1;
    }


    return Math.ceil(
      this.filteredVisits.length /
      this.pageSize
    );
  }


  // =========================================================
  // PAGINATED VISITS
  // =========================================================

  get paginatedVisits(): Visit[] {

    const start =
      (
        this.currentPage - 1
      ) *
      this.pageSize;


    const end =
      start +
      this.pageSize;


    return this.filteredVisits
      .slice(
        start,
        end
      );
  }


  // =========================================================
  // PAGINATION START
  // =========================================================

  get paginationStart(): number {

    if (
      this.filteredVisits.length === 0
    ) {

      return 0;
    }


    return (
      (
        this.currentPage - 1
      ) *
      this.pageSize
    ) + 1;
  }


  // =========================================================
  // PAGINATION END
  // =========================================================

  get paginationEnd(): number {

    if (
      this.filteredVisits.length === 0
    ) {

      return 0;
    }


    return Math.min(
      this.currentPage *
        this.pageSize,
      this.filteredVisits.length
    );
  }


  // =========================================================
  // PAGE NUMBERS
  // =========================================================

  get pageNumbers(): number[] {

    const pages: number[] = [];


    for (
      let page = 1;
      page <= this.totalPages;
      page++
    ) {

      pages.push(page);
    }


    return pages;
  }


  // =========================================================
  // GO TO PAGE
  // =========================================================

  goToPage(
    page: number
  ): void {

    if (
      page < 1 ||
      page > this.totalPages
    ) {

      return;
    }


    this.currentPage = page;
  }


  // =========================================================
  // PREVIOUS PAGE
  // =========================================================

  previousPage(): void {

    if (
      this.currentPage > 1
    ) {

      this.currentPage--;
    }
  }


  // =========================================================
  // NEXT PAGE
  // =========================================================

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages
    ) {

      this.currentPage++;
    }
  }


  // =========================================================
  // CHANGE PAGE SIZE
  // =========================================================

  changePageSize(): void {

    this.currentPage = 1;
  }


  // =========================================================
  // FILTER CHANGE
  // =========================================================

  onFilterChange(): void {

    this.currentPage = 1;
  }


  // =========================================================
  // SEARCH CHANGE
  // =========================================================

  onSearchChange(): void {

    this.currentPage = 1;
  }


  // =========================================================
  // RESET FILTERS
  // =========================================================

  resetFilters(): void {

    this.searchText = '';

    this.selectedSession = 'All';

    this.selectedStatus = 'All';

    this.dateFrom = '';

    this.dateTo = '';

    this.currentPage = 1;
  }


  // =========================================================
  // GET VISITOR FULL NAME
  // =========================================================

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
          !!name
      )
      .join(' ');
  }


  // =========================================================
  // FORMAT TIME
  // =========================================================

  formatTime(
    time:
      string |
      null |
      undefined
  ): string {

    if (!time) {

      return '-';
    }


    const cleanTime =
      String(time)
        .split('.')[0];


    const parts =
      cleanTime.split(':');


    if (
      parts.length < 2
    ) {

      return cleanTime;
    }


    const hours =
      Number(parts[0]);


    const minutes =
      Number(parts[1]);


    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {

      return cleanTime;
    }


    const suffix =
      hours >= 12
        ? 'PM'
        : 'AM';


    const displayHour =
      hours % 12 || 12;


    return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
  }


  // =========================================================
  // FORMAT DATE
  // =========================================================

  formatDate(
    date:
      string |
      null |
      undefined
  ): string {

    if (!date) {

      return '-';
    }


    const parts =
      String(date).split('-');


    if (
      parts.length !== 3
    ) {

      return String(date);
    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }


  // =========================================================
  // FORMAT DURATION
  // =========================================================

  formatDuration(
    minutes:
      number |
      null |
      undefined
  ): string {

    if (
      minutes === null ||
      minutes === undefined
    ) {

      return '-';
    }


    if (
      minutes === 0
    ) {

      return '0 min';
    }


    const hours =
      Math.floor(
        minutes / 60
      );


    const remainingMinutes =
      minutes % 60;


    if (
      hours === 0
    ) {

      return `${remainingMinutes} min`;
    }


    if (
      remainingMinutes === 0
    ) {

      return `${hours} hr`;
    }


    return `${hours} hr ${remainingMinutes} min`;
  }


  // =========================================================
  // SESSION CLASS
  // =========================================================

  getSessionClass(
    session: VisitSession
  ): string {

    switch (session) {

      case 'Morning':
        return 'session-morning';

      case 'Day':
        return 'session-day';

      case 'Evening':
        return 'session-evening';

      default:
        return '';
    }
  }


  // =========================================================
  // STATUS CLASS
  // =========================================================

  getStatusClass(
    status: string
  ): string {

    switch (status) {

      case 'Completed':
        return 'status-completed';

      case 'Checked In':
        return 'status-checked-in';

      default:
        return '';
    }
  }


  // =========================================================
  // EXPORT PDF
  // =========================================================

  exportPDF(): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;
    }


    window.print();
  }


  // =========================================================
  // EXPORT EXCEL
  // =========================================================

  exportExcel(): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;
    }


    console.log(
      'Export Excel:',
      this.filteredVisits
    );
  }


  // =========================================================
  // PRINT
  // =========================================================

  printReport(): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;
    }


    window.print();
  }

}