import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Visit,
  VisitSession
} from '../../core/models/visit';

import {
  VisitService
} from '../../core/services/visit.service';


@Component({
  selector: 'app-reports',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './reports.html',

  styleUrls: ['./reports.css']
})
export class Reports implements OnInit {

  /* =========================================================
     ALL VISITS
     ========================================================= */

  visits: Visit[] = [];


  /* =========================================================
     FILTERS
     ========================================================= */

  searchText = '';

  selectedSession: VisitSession | 'All' = 'All';

  selectedStatus:
    | 'Checked In'
    | 'Completed'
    | 'All' = 'All';


  /*
   * DATE RANGE
   *
   * Example:
   * dateFrom = 2026-01-01
   * dateTo   = 2026-04-30
   *
   * This will return January through April.
   */

  dateFrom = '';

  dateTo = '';


  /* =========================================================
     PAGINATION
     ========================================================= */

  currentPage = 1;

  pageSize = 10;


  /* =========================================================
     CONSTRUCTOR
     ========================================================= */

  constructor(
    private visitService: VisitService
  ) {}


  /* =========================================================
     INIT
     ========================================================= */

  ngOnInit(): void {

    this.loadVisits();

  }


  /* =========================================================
     LOAD VISITS
     ========================================================= */

  loadVisits(): void {

    /*
     * VisitService reads visits from localStorage.
     *
     * We intentionally get all stored visits here,
     * then apply report filters below.
     */

     this.visits = this.visitService.getVisits();

  }


  /* =========================================================
     FILTERED VISITS
     ========================================================= */

  get filteredVisits(): Visit[] {

    const search = this.searchText
      .trim()
      .toLowerCase();


    /*
     * If user selects invalid date range,
     * return no records.
     */

    if (this.isInvalidDateRange) {
      return [];
    }


    return this.visits.filter(
      (visit: Visit) => {

        /* -----------------------------------------------------
           SEARCH FILTER
           ----------------------------------------------------- */

        const patientName =
          visit.patientName?.toLowerCase() ?? '';

        const patientNumber =
          visit.patientNumber?.toLowerCase() ?? '';

        const ward =
          visit.ward?.toLowerCase() ?? '';

        const visitorFirstName =
          visit.visitorFirstName?.toLowerCase() ?? '';

        const visitorSecondName =
          visit.visitorSecondName?.toLowerCase() ?? '';

        const visitorLastName =
          visit.visitorLastName?.toLowerCase() ?? '';

        const visitorPhone =
          visit.visitorPhone?.toLowerCase() ?? '';

        const visitorCardNumber =
          visit.visitorCardNumber?.toLowerCase() ?? '';

        const visitorRelation =
          visit.visitorRelation?.toLowerCase() ?? '';


        const matchesSearch =
          !search ||

          patientName.includes(search) ||

          patientNumber.includes(search) ||

          ward.includes(search) ||

          visitorFirstName.includes(search) ||

          visitorSecondName.includes(search) ||

          visitorLastName.includes(search) ||

          visitorPhone.includes(search) ||

          visitorCardNumber.includes(search) ||

          visitorRelation.includes(search);


        /* -----------------------------------------------------
           SESSION FILTER
           ----------------------------------------------------- */

        const matchesSession =
          this.selectedSession === 'All' ||

          visit.session === this.selectedSession;


        /*
         * IMPORTANT:
         *
         * All Sessions means:
         *
         * Morning
         * Day
         * Evening
         *
         * We don't need another special condition here.
         *
         * As long as the visit contains one of the three
         * session values, it will be included.
         */


        /* -----------------------------------------------------
           STATUS FILTER
           ----------------------------------------------------- */

        const matchesStatus =
          this.selectedStatus === 'All' ||

          visit.status === this.selectedStatus;


        /* -----------------------------------------------------
           DATE FROM
           ----------------------------------------------------- */

        const matchesDateFrom =
          !this.dateFrom ||

          visit.visitDate >= this.dateFrom;


        /* -----------------------------------------------------
           DATE TO
           ----------------------------------------------------- */

        const matchesDateTo =
          !this.dateTo ||

          visit.visitDate <= this.dateTo;


        /* -----------------------------------------------------
           RETURN FINAL RESULT
           ----------------------------------------------------- */

        return (

          matchesSearch &&

          matchesSession &&

          matchesStatus &&

          matchesDateFrom &&

          matchesDateTo

        );

      }
    );

  }


  /* =========================================================
     INVALID DATE RANGE
     ========================================================= */

  get isInvalidDateRange(): boolean {

    if (!this.dateFrom || !this.dateTo) {

      return false;

    }

    return this.dateFrom > this.dateTo;

  }


  /* =========================================================
     SUMMARY - TOTAL PATIENTS
     ========================================================= */

  get totalPatients(): number {

    const uniquePatients =
      new Set(
        this.filteredVisits.map(
          visit => visit.patientId
        )
      );

    return uniquePatients.size;

  }


  /* =========================================================
     SUMMARY - TOTAL VISITS
     ========================================================= */

  get totalVisits(): number {

    return this.filteredVisits.length;

  }


  /* =========================================================
     SUMMARY - MORNING
     ========================================================= */

  get morningVisits(): number {

    return this.filteredVisits.filter(
      visit =>
        visit.session === 'Morning'
    ).length;

  }


  /* =========================================================
     SUMMARY - DAY
     ========================================================= */

  get dayVisits(): number {

    return this.filteredVisits.filter(
      visit =>
        visit.session === 'Day'
    ).length;

  }


  /* =========================================================
     SUMMARY - EVENING
     ========================================================= */

  get eveningVisits(): number {

    return this.filteredVisits.filter(
      visit =>
        visit.session === 'Evening'
    ).length;

  }


  /* =========================================================
     SUMMARY - COMPLETED
     ========================================================= */

  get completedVisits(): number {

    return this.filteredVisits.filter(
      visit =>
        visit.status === 'Completed'
    ).length;

  }


  /* =========================================================
     PAGINATION - TOTAL PAGES
     ========================================================= */

  get totalPages(): number {

    if (this.filteredVisits.length === 0) {

      return 1;

    }

    return Math.ceil(
      this.filteredVisits.length /
      this.pageSize
    );

  }


  /* =========================================================
     PAGINATION - PAGE NUMBERS
     ========================================================= */

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


  /* =========================================================
     PAGINATION - PAGINATED VISITS
     ========================================================= */

  get paginatedVisits(): Visit[] {

    const start =
      (this.currentPage - 1) *
      this.pageSize;

    const end =
      start +
      this.pageSize;

    return this.filteredVisits.slice(
      start,
      end
    );

  }


  /* =========================================================
     PAGINATION - START
     ========================================================= */

  get paginationStart(): number {

    if (this.filteredVisits.length === 0) {

      return 0;

    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + 1;

  }


  /* =========================================================
     PAGINATION - END
     ========================================================= */

  get paginationEnd(): number {

    if (this.filteredVisits.length === 0) {

      return 0;

    }

    return Math.min(
      this.currentPage *
      this.pageSize,

      this.filteredVisits.length
    );

  }


  /* =========================================================
     FILTER CHANGE
     ========================================================= */

  onFilterChange(): void {

    this.currentPage = 1;

  }


  /* =========================================================
     RESET FILTERS
     ========================================================= */

  resetFilters(): void {

    this.searchText = '';

    this.selectedSession = 'All';

    this.selectedStatus = 'All';

    this.dateFrom = '';

    this.dateTo = '';

    this.currentPage = 1;

  }


  /* =========================================================
     GO TO PAGE
     ========================================================= */

  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages
    ) {

      return;

    }

    this.currentPage = page;

  }


  /* =========================================================
     PREVIOUS PAGE
     ========================================================= */

  previousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

    }

  }


  /* =========================================================
     NEXT PAGE
     ========================================================= */

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages
    ) {

      this.currentPage++;

    }

  }


  /* =========================================================
     CHANGE PAGE SIZE
     ========================================================= */

  changePageSize(): void {

    this.currentPage = 1;

  }


  /* =========================================================
     FORMAT DATE
     ========================================================= */

  formatDate(
    date: string
  ): string {

    if (!date) {

      return '-';

    }

    const parts =
      date.split('-');

    if (parts.length !== 3) {

      return date;

    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;

  }


  /* =========================================================
     FORMAT TIME
     ========================================================= */

  formatTime(
    value: string | null
  ): string {

    if (!value) {

      return '-';

    }

    /*
     * Handles:
     * 08:30
     * 08:30:00
     * ISO date/time
     */

    if (
      value.includes('T')
    ) {

      const date =
        new Date(value);

      if (!isNaN(date.getTime())) {

        return date.toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        );

      }

    }


    const parts =
      value.split(':');

    if (parts.length >= 2) {

      return `${parts[0]}:${parts[1]}`;

    }

    return value;

  }


  /* =========================================================
     FORMAT DURATION
     ========================================================= */

  formatDuration(
    minutes: number
  ): string {

    if (
      minutes === null ||
      minutes === undefined
    ) {

      return '-';

    }


    if (minutes < 60) {

      return `${minutes} min`;

    }


    const hours =
      Math.floor(minutes / 60);

    const remainingMinutes =
      minutes % 60;


    if (remainingMinutes === 0) {

      return `${hours} hr`;

    }


    return `${hours} hr ${remainingMinutes} min`;

  }


  /* =========================================================
     EXPORT EXCEL
     ========================================================= */

  exportExcel(): void {

    /*
     * We export ALL filtered records,
     * not only records displayed on current page.
     */

    const records =
      this.filteredVisits;


    if (records.length === 0) {

      alert(
        'There are no records to export.'
      );

      return;

    }


    const headers = [
      'No.',
      'Patient',
      'Patient Number',
      'Ward',
      'Visitor',
      'Phone',
      'Gender',
      'Relation',
      'Session',
      'Slot',
      'Date',
      'Check In',
      'Check Out',
      'Duration',
      'Status'
    ];


    const rows =
      records.map(
        (visit: Visit, index: number) => [

          index + 1,

          visit.patientName,

          visit.patientNumber,

          visit.ward,

          `${visit.visitorFirstName} ${visit.visitorSecondName} ${visit.visitorLastName}`,

          visit.visitorPhone,

          visit.visitorGender,

          visit.visitorRelation,

          visit.session,

          `Visitor ${visit.slot}`,

          this.formatDate(
            visit.visitDate
          ),

          this.formatTime(
            visit.checkIn
          ),

          visit.checkOut
            ? this.formatTime(
                visit.checkOut
              )
            : '',

          visit.durationMinutes !== null
            ? this.formatDuration(
                visit.durationMinutes
              )
            : '',

          visit.status

        ]
      );


    /*
     * Create CSV.
     *
     * This works without requiring another
     * Excel package.
     */

    const csvRows = [
      headers,
      ...rows
    ];


    const csv =
      csvRows
        .map(
          row =>
            row
              .map(
                value =>
                  `"${String(value ?? '').replace(/"/g, '""')}"`
              )
              .join(',')
        )
        .join('\n');


    const blob =
      new Blob(
        [csv],
        {
          type: 'text/csv;charset=utf-8;'
        }
      );


    const url =
      window.URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        'a'
      );

    link.href = url;

    link.download =
      this.getExportFileName(
        'visit-report',
        'csv'
      );

    link.click();


    window.URL.revokeObjectURL(
      url
    );

  }


  /* =========================================================
     EXPORT PDF
     ========================================================= */

  exportPDF(): void {

    const records =
      this.filteredVisits;


    if (records.length === 0) {

      alert(
        'There are no records to export.'
      );

      return;

    }


    const printWindow =
      window.open(
        '',
        '_blank'
      );


    if (!printWindow) {

      alert(
        'Unable to open print window. Please allow pop-ups.'
      );

      return;

    }


    const rows =
      records.map(
        (visit: Visit, index: number) => `

          <tr>

            <td>${index + 1}</td>

            <td>${this.escapeHtml(
              visit.patientName
            )}</td>

            <td>${this.escapeHtml(
              visit.patientNumber
            )}</td>

            <td>${this.escapeHtml(
              visit.ward
            )}</td>

            <td>${this.escapeHtml(
              `${visit.visitorFirstName} ${visit.visitorSecondName} ${visit.visitorLastName}`
            )}</td>

            <td>${this.escapeHtml(
              visit.visitorPhone
            )}</td>

            <td>${this.escapeHtml(
              visit.visitorGender
            )}</td>

            <td>${this.escapeHtml(
              visit.visitorRelation
            )}</td>

            <td>${this.escapeHtml(
              visit.session
            )}</td>

            <td>Visitor ${visit.slot}</td>

            <td>${this.escapeHtml(
              this.formatDate(
                visit.visitDate
              )
            )}</td>

            <td>${this.escapeHtml(
              this.formatTime(
                visit.checkIn
              )
            )}</td>

            <td>${this.escapeHtml(
              visit.checkOut
                ? this.formatTime(
                    visit.checkOut
                  )
                : '-'
            )}</td>

            <td>${this.escapeHtml(
              visit.durationMinutes !== null
                ? this.formatDuration(
                    visit.durationMinutes
                  )
                : '-'
            )}</td>

            <td>${this.escapeHtml(
              visit.status
            )}</td>

          </tr>

        `
      )
      .join('');


    const dateRangeText =
      this.getDateRangeText();


    printWindow.document.write(`

      <!DOCTYPE html>

      <html>

        <head>

          <title>
            Visit Report
          </title>

          <style>

            * {
              box-sizing: border-box;
            }

            body {
              font-family:
                Arial,
                Helvetica,
                sans-serif;

              padding: 25px;

              color: #1f2937;
            }

            h1 {
              margin: 0;

              color: #0b2f6a;

              font-size: 22px;
            }

            .subtitle {
              margin-top: 5px;

              color: #667085;

              font-size: 12px;
            }

            .meta {
              margin-top: 15px;

              padding: 10px;

              border: 1px solid #dbe4ef;

              background: #f5f8fc;

              font-size: 11px;
            }

            table {
              width: 100%;

              margin-top: 20px;

              border-collapse: collapse;

              font-size: 8px;
            }

            th {
              background: #0b2f6a;

              color: white;

              padding: 7px;

              text-align: left;
            }

            td {
              padding: 6px;

              border: 1px solid #dfe5ec;

              vertical-align: top;
            }

            tr:nth-child(even) {
              background: #f8fafc;
            }

            .footer {
              margin-top: 15px;

              color: #667085;

              font-size: 10px;
            }

            @media print {

              body {
                padding: 10px;
              }

              @page {
                size: landscape;
                margin: 10mm;
              }

            }

          </style>

        </head>


        <body>

          <h1>
            Visit Report
          </h1>

          <div class="subtitle">
            Patient and Visitor Attendance Report
          </div>

          <div class="meta">

            <strong>Session:</strong>
            ${this.escapeHtml(
              this.selectedSession
            )}

            &nbsp;&nbsp;&nbsp;

            <strong>Status:</strong>
            ${this.escapeHtml(
              this.selectedStatus
            )}

            &nbsp;&nbsp;&nbsp;

            <strong>Date:</strong>
            ${this.escapeHtml(
              dateRangeText
            )}

            &nbsp;&nbsp;&nbsp;

            <strong>Total Records:</strong>
            ${records.length}

          </div>


          <table>

            <thead>

              <tr>

                <th>#</th>
                <th>Patient</th>
                <th>Patient No.</th>
                <th>Ward</th>
                <th>Visitor</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Relation</th>
                <th>Session</th>
                <th>Slot</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Duration</th>
                <th>Status</th>

              </tr>

            </thead>

            <tbody>

              ${rows}

            </tbody>

          </table>


          <div class="footer">

            Generated from FollowUp System

          </div>


          <script>

            window.onload = function() {

              window.print();

            };

          </script>

        </body>

      </html>

    `);


    printWindow.document.close();

  }


  /* =========================================================
     PRINT CURRENT REPORT
     ========================================================= */

  printReport(): void {

    window.print();

  }


  /* =========================================================
     DATE RANGE TEXT
     ========================================================= */

  private getDateRangeText(): string {

    if (
      this.dateFrom &&
      this.dateTo
    ) {

      return `${this.formatDate(
        this.dateFrom
      )} - ${this.formatDate(
        this.dateTo
      )}`;

    }


    if (this.dateFrom) {

      return `From ${this.formatDate(
        this.dateFrom
      )}`;

    }


    if (this.dateTo) {

      return `Up to ${this.formatDate(
        this.dateTo
      )}`;

    }


    return 'All Dates';

  }


  /* =========================================================
     EXPORT FILE NAME
     ========================================================= */

  private getExportFileName(
    prefix: string,
    extension: string
  ): string {

    const datePart =
      this.dateFrom &&
      this.dateTo

        ? `${this.dateFrom}_to_${this.dateTo}`

        : this.dateFrom

          ? `from_${this.dateFrom}`

          : this.dateTo

            ? `to_${this.dateTo}`

            : 'all-dates';


    return `${prefix}_${datePart}.${extension}`;

  }


  /* =========================================================
     ESCAPE HTML
     ========================================================= */

  private escapeHtml(
    value: string
  ): string {

    return String(value ?? '')
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );

  }

}