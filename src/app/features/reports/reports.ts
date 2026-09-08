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

// =========================================================
// PDF
// =========================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// =========================================================
// EXCEL
// =========================================================

import * as XLSX from 'xlsx';


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

    afterNextRender(() => {

      this.loadVisits();

    });
  }


  // =========================================================
  // ON INIT
  // =========================================================

  ngOnInit(): void {

    // API loading is handled by afterNextRender()
  }


  // =========================================================
  // LOAD VISITS
  // =========================================================

  loadVisits(): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;
    }


    this.loading = true;

    this.errorMessage = '';


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


          this.visits = [
            ...visits
          ];


          this.currentPage = 1;

          this.loading = false;


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
  // VISITOR FULL NAME
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


    const data =
      this.filteredVisits;


    if (
      data.length === 0
    ) {

      alert(
        'There are no visit records to export.'
      );

      return;

    }


    // -------------------------------------------------------
    // CREATE PDF
    // -------------------------------------------------------

    const pdf =
      new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });


    // -------------------------------------------------------
    // TITLE
    // -------------------------------------------------------

    pdf.setFontSize(18);

    pdf.setFont('helvetica', 'bold');

    pdf.text(
      'Visit Reports',
      14,
      15
    );


    // -------------------------------------------------------
    // SUBTITLE
    // -------------------------------------------------------

    pdf.setFontSize(9);

    pdf.setFont('helvetica', 'normal');

    pdf.text(
      'Patient and visitor attendance reports',
      14,
      21
    );


    // -------------------------------------------------------
    // GENERATED DATE
    // -------------------------------------------------------

    const generatedDate =
      new Date()
        .toLocaleString();


    pdf.setFontSize(8);

    pdf.text(
      `Generated: ${generatedDate}`,
      14,
      27
    );


    // -------------------------------------------------------
    // FILTER INFORMATION
    // -------------------------------------------------------

    let filterText =
      'Filters: ';


    filterText +=
      `Session=${this.selectedSession}`;


    filterText +=
      ` | Status=${this.selectedStatus}`;


    if (this.dateFrom) {

      filterText +=
        ` | From=${this.formatDate(this.dateFrom)}`;

    }


    if (this.dateTo) {

      filterText +=
        ` | To=${this.formatDate(this.dateTo)}`;

    }


    if (this.searchText.trim()) {

      filterText +=
        ` | Search=${this.searchText.trim()}`;

    }


    pdf.text(
      filterText,
      14,
      33
    );


    // -------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------

    pdf.setFontSize(8);

    pdf.setFont('helvetica', 'bold');


    pdf.text(
      `Patients: ${this.totalPatients}`,
      14,
      40
    );


    pdf.text(
      `Visits: ${this.totalVisits}`,
      55,
      40
    );


    pdf.text(
      `Morning: ${this.morningVisits}`,
      90,
      40
    );


    pdf.text(
      `Day: ${this.dayVisits}`,
      130,
      40
    );


    pdf.text(
      `Evening: ${this.eveningVisits}`,
      165,
      40
    );


    pdf.text(
      `Completed: ${this.completedVisits}`,
      210,
      40
    );


    // -------------------------------------------------------
    // TABLE DATA
    // -------------------------------------------------------

    const tableBody =
      data.map(
        (
          visit: Visit,
          index: number
        ) => [

          index + 1,

          visit.patientName ?? '-',

          visit.patientNumber ?? '-',

          visit.ward ?? '-',

          this.getVisitorName(visit),

          visit.visitorPhone ?? '-',

          visit.visitorGender ?? '-',

          visit.visitorRelation ?? '-',

          visit.session ?? '-',

          `Visitor ${visit.slot ?? '-'}`,

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
            : '-',

          visit.durationMinutes !== null &&
          visit.durationMinutes !== undefined
            ? this.formatDuration(
                visit.durationMinutes
              )
            : '-',

          visit.status ?? '-'

        ]
      );


    // -------------------------------------------------------
    // PDF TABLE
    // -------------------------------------------------------

    autoTable(
      pdf,
      {
        startY: 46,

        head: [[
          '#',
          'Patient',
          'Patient No.',
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
        ]],

        body: tableBody,

        theme: 'grid',

        styles: {
          fontSize: 6.5,
          cellPadding: 2,
          overflow: 'linebreak',
          valign: 'middle'
        },

        headStyles: {
          fontStyle: 'bold',
          halign: 'center'
        },

        bodyStyles: {
          fontStyle: 'normal'
        },

        margin: {
          top: 46,
          right: 8,
          bottom: 12,
          left: 8
        },

        didDrawPage: (pageData) => {

          // -------------------------------------------------
          // FOOTER
          // -------------------------------------------------

          const pageNumber =
            pdf.getNumberOfPages();


          const pageHeight =
            pdf.internal.pageSize.height;


          pdf.setFontSize(7);

          pdf.setFont(
            'helvetica',
            'normal'
          );


          pdf.text(
            `Visit Reports | Page ${pageNumber}`,
            pageData.settings.margin.left,
            pageHeight - 6
          );

        }

      }
    );


    // -------------------------------------------------------
    // SAVE
    // -------------------------------------------------------

    const today =
      new Date()
        .toISOString()
        .split('T')[0];


    pdf.save(
      `visit-report-${today}.pdf`
    );

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


    const data =
      this.filteredVisits;


    if (
      data.length === 0
    ) {

      alert(
        'There are no visit records to export.'
      );

      return;

    }


    // -------------------------------------------------------
    // EXCEL ROWS
    // -------------------------------------------------------

    const excelData =
      data.map(
        (
          visit: Visit,
          index: number
        ) => ({

          '#':
            index + 1,

          'Patient Name':
            visit.patientName ?? '',

          'Patient Number':
            visit.patientNumber ?? '',

          'Ward':
            visit.ward ?? '',

          'Visitor Name':
            this.getVisitorName(visit),

          'Phone':
            visit.visitorPhone ?? '',

          'Gender':
            visit.visitorGender ?? '',

          'Relation':
            visit.visitorRelation ?? '',

          'Session':
            visit.session ?? '',

          'Slot':
            `Visitor ${visit.slot ?? ''}`,

          'Visit Date':
            this.formatDate(
              visit.visitDate
            ),

          'Check In':
            this.formatTime(
              visit.checkIn
            ),

          'Check Out':
            visit.checkOut
              ? this.formatTime(
                  visit.checkOut
                )
              : '',

          'Duration':
            visit.durationMinutes !== null &&
            visit.durationMinutes !== undefined
              ? this.formatDuration(
                  visit.durationMinutes
                )
              : '',

          'Status':
            visit.status ?? ''

        })
      );


    // -------------------------------------------------------
    // CREATE WORKSHEET
    // -------------------------------------------------------

    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );


    // -------------------------------------------------------
    // COLUMN WIDTHS
    // -------------------------------------------------------

    worksheet['!cols'] = [

      { wch: 6 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
      { wch: 17 },
      { wch: 12 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 15 },
      { wch: 15 }

    ];


    // -------------------------------------------------------
    // CREATE WORKBOOK
    // -------------------------------------------------------

    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Visit Reports'
    );


    // -------------------------------------------------------
    // SUMMARY SHEET
    // -------------------------------------------------------

    const summaryData = [

      {
        'Report': 'Visit Reports'
      },

      {
        'Generated':
          new Date().toLocaleString()
      },

      {
        'Session':
          this.selectedSession
      },

      {
        'Status':
          this.selectedStatus
      },

      {
        'Date From':
          this.dateFrom
            ? this.formatDate(this.dateFrom)
            : 'All'
      },

      {
        'Date To':
          this.dateTo
            ? this.formatDate(this.dateTo)
            : 'All'
      },

      {
        'Search':
          this.searchText.trim() || 'None'
      },

      {},

      {
        'Summary':
          'Value'
      },

      {
        'Total Patients':
          this.totalPatients
      },

      {
        'Total Visits':
          this.totalVisits
      },

      {
        'Morning Visits':
          this.morningVisits
      },

      {
        'Day Visits':
          this.dayVisits
      },

      {
        'Evening Visits':
          this.eveningVisits
      },

      {
        'Completed':
          this.completedVisits
      },

      {
        'Checked In':
          this.checkedInVisits
      }

    ];


    const summarySheet =
      XLSX.utils.json_to_sheet(
        summaryData,
        {
          skipHeader: true
        }
      );


    summarySheet['!cols'] = [
      { wch: 25 },
      { wch: 25 }
    ];


    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      'Summary'
    );


    // -------------------------------------------------------
    // FILE NAME
    // -------------------------------------------------------

    const today =
      new Date()
        .toISOString()
        .split('T')[0];


    const fileName =
      `visit-report-${today}.xlsx`;


    // -------------------------------------------------------
    // DOWNLOAD
    // -------------------------------------------------------

    XLSX.writeFile(
      workbook,
      fileName
    );

  }


  // =========================================================
  // PRINT REPORT
  // =========================================================

  printReport(): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;

    }


    const reportElement =
      document.querySelector(
        '.reports-page'
      ) as HTMLElement | null;


    if (!reportElement) {

      console.error(
        'Reports element not found.'
      );

      return;

    }


    // -------------------------------------------------------
    // CREATE PRINT WINDOW
    // -------------------------------------------------------

    const printWindow =
      window.open(
        '',
        '_blank',
        'width=1400,height=900'
      );


    if (!printWindow) {

      alert(
        'Please allow pop-ups in your browser to print the report.'
      );

      return;

    }


    // -------------------------------------------------------
    // COPY ALL CSS
    // -------------------------------------------------------

    const styles =
      Array.from(
        document.styleSheets
      )
      .map(
        (
          styleSheet
        ) => {

          try {

            return Array.from(
              (styleSheet as CSSStyleSheet)
                .cssRules
            )
            .map(
              rule =>
                rule.cssText
            )
            .join('\n');

          } catch {

            return '';

          }

        }
      )
      .join('\n');


    // -------------------------------------------------------
    // CREATE PRINT DOCUMENT
    // -------------------------------------------------------

    printWindow.document.open();


    printWindow.document.write(`

      <!DOCTYPE html>

      <html>

        <head>

          <meta charset="UTF-8">

          <title>Visit Reports</title>

          <style>

            ${styles}

            @page {

              size: landscape;

              margin: 10mm;

            }


            html,
            body {

              margin: 0;

              padding: 0;

              background: #ffffff;

            }


            body {

              font-family:
                Arial,
                Helvetica,
                sans-serif;

            }


            .reports-page {

              width: 100%;

              min-height: auto;

              padding: 0 !important;

              margin: 0 !important;

              background: #ffffff !important;

            }


            .header-actions,
            .filter-card,
            .pagination-section {

              display: none !important;

            }


            .reports-table {

              width: 100% !important;

              min-width: 0 !important;

              table-layout: auto;

            }


            .reports-table thead th,
            .reports-table tbody td {

              padding: 5px !important;

              font-size: 8px !important;

            }


            .table-card {

              border: none !important;

              box-shadow: none !important;

            }


            .summary-grid {

              display: grid !important;

              grid-template-columns:
                repeat(6, 1fr) !important;

              gap: 8px !important;

            }


            .summary-card {

              box-shadow: none !important;

            }


            .reports-table tbody tr:hover {

              background: transparent !important;

            }

          </style>

        </head>


        <body>

          ${reportElement.outerHTML}

        </body>

      </html>

    `);


    printWindow.document.close();


    // -------------------------------------------------------
    // WAIT FOR RENDER
    // -------------------------------------------------------

    printWindow.focus();


    setTimeout(() => {

      printWindow.print();

      setTimeout(() => {

        printWindow.close();

      }, 500);

    }, 700);

  }

}