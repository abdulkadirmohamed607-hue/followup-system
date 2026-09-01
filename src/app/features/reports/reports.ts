
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

  selector:
    'app-reports',

  standalone:
    true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './reports.html',

  styleUrl:
    './reports.css'

})
export class Reports
  implements OnInit {


  // =====================================================
  // VISITS
  // =====================================================

  visits: Visit[] = [];


  // =====================================================
  // FILTERS
  // =====================================================

  searchText = '';

  selectedSession:
    VisitSession | 'All' =
      'All';

  selectedStatus:
    'Checked In' |
    'Completed' |
    'All' =
      'All';

  selectedDate = '';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private visitService:
      VisitService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadVisits();

  }


  // =====================================================
  // LOAD VISITS
  // =====================================================

  loadVisits(): void {

    this.visits =
      this.visitService
        .getVisits();

  }


  // =====================================================
  // VISITOR NAME
  // =====================================================

  visitorName(
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
  // FILTERED VISITS
  // =====================================================

  get filteredVisits():
    Visit[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    return this.visits.filter(
      visit => {


        // -----------------------------------------------
        // SAFE VISITOR VALUES
        // -----------------------------------------------

        const visitorPhone =
          visit.visitorPhone ??
          '';

        const visitorGender =
          visit.visitorGender ??
          '';

        const visitorRelation =
          visit.visitorRelation ??
          '';


        // -----------------------------------------------
        // SEARCH
        // -----------------------------------------------

        const matchesSearch =
          !search ||

          visit.patientName
            .toLowerCase()
            .includes(search) ||

          visit.patientNumber
            .toLowerCase()
            .includes(search) ||

          visit.ward
            .toLowerCase()
            .includes(search) ||

          this.visitorName(
            visit
          )
            .toLowerCase()
            .includes(search) ||

          visitorPhone
            .toLowerCase()
            .includes(search) ||

          visitorGender
            .toLowerCase()
            .includes(search) ||

          visitorRelation
            .toLowerCase()
            .includes(search);


        // -----------------------------------------------
        // SESSION
        // -----------------------------------------------

        const matchesSession =
          this.selectedSession ===
            'All' ||

          visit.session ===
            this.selectedSession;


        // -----------------------------------------------
        // STATUS
        // -----------------------------------------------

        const matchesStatus =
          this.selectedStatus ===
            'All' ||

          visit.status ===
            this.selectedStatus;


        // -----------------------------------------------
        // DATE
        // -----------------------------------------------

        const matchesDate =
          !this.selectedDate ||

          visit.visitDate ===
            this.selectedDate;


        return (

          matchesSearch &&

          matchesSession &&

          matchesStatus &&

          matchesDate

        );

      }
    );

  }


  // =====================================================
  // TOTAL PATIENTS
  // =====================================================

  get totalPatients(): number {

    const patientIds =
      new Set(
        this.filteredVisits.map(
          visit =>
            visit.patientId
        )
      );


    return patientIds.size;

  }


  // =====================================================
  // TOTAL VISITS
  // =====================================================

  get totalVisits(): number {

    return this.filteredVisits.length;

  }


  // =====================================================
  // DAY VISITS
  // =====================================================

  get dayVisits(): number {

    return this.filteredVisits.filter(
      visit =>
        visit.session ===
        'Day'
    ).length;

  }


  // =====================================================
  // EVENING VISITS
  // =====================================================

  get eveningVisits(): number {

    return this.filteredVisits.filter(
      visit =>
        visit.session ===
        'Evening'
    ).length;

  }


  // =====================================================
  // COMPLETED
  // =====================================================

  get completedVisits(): number {

    return this.filteredVisits.filter(
      visit =>
        visit.status ===
        'Completed'
    ).length;

  }


  // =====================================================
  // FORMAT TIME
  // =====================================================

  formatTime(
    value: string | null
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
        hour: '2-digit',
        minute: '2-digit'
      }
    );

  }


  // =====================================================
  // FORMAT DURATION
  // =====================================================

  formatDuration(
    minutes: number | null
  ): string {

    if (
      minutes === null ||
      minutes === undefined
    ) {

      return '-';

    }


    const hours =
      Math.floor(
        minutes / 60
      );


    const mins =
      minutes % 60;


    if (hours > 0) {

      return `${hours}h ${mins}m`;

    }


    return `${mins} min`;

  }


  // =====================================================
  // RESET
  // =====================================================

  resetFilters(): void {

    this.searchText = '';

    this.selectedSession =
      'All';

    this.selectedStatus =
      'All';

    this.selectedDate = '';

  }


  // =====================================================
  // EXPORT EXCEL
  // =====================================================

  async exportExcel(): Promise<void> {

    const XLSX =
      await import('xlsx');


    const data =
      this.filteredVisits.map(
        (visit, index) => ({

          '#':
            index + 1,

          'Patient':
            visit.patientName,

          'Patient Number':
            visit.patientNumber,

          'Ward':
            visit.ward,

          'Visitor':
            this.visitorName(
              visit
            ),

          'Phone':
            visit.visitorPhone,

          'Gender':
            visit.visitorGender,

          'Relation':
            visit.visitorRelation,

          'Session':
            visit.session,

          'Slot':
            `Visitor ${visit.slot}`,

          'Visit Date':
            visit.visitDate,

          'Check In':
            this.formatTime(
              visit.checkIn
            ),

          'Check Out':
            this.formatTime(
              visit.checkOut
            ),

          'Duration':
            this.formatDuration(
              visit.durationMinutes
            ),

          'Status':
            visit.status

        })
      );


    const worksheet =
      XLSX.utils.json_to_sheet(
        data
      );


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Visit Report'
    );


    XLSX.writeFile(
      workbook,
      `patient-visit-report-${this.getToday()}.xlsx`
    );

  }


  // =====================================================
  // PDF
  // =====================================================

  exportPDF(): void {

    const table =
      document.getElementById(
        'reportTable'
      );


    if (!table) {

      return;

    }


    const printWindow =
      window.open(
        '',
        '_blank'
      );


    if (!printWindow) {

      alert(
        'Please allow pop-ups to export the report.'
      );

      return;

    }


    printWindow.document.write(`

      <html>

        <head>

          <title>
            Patient Visit Report
          </title>


          <style>

            body {
              font-family: Arial, sans-serif;
              padding: 25px;
              color: #44515a;
            }


            h1 {
              color: #164e70;
              margin-bottom: 5px;
            }


            p {
              color: #6c7a86;
            }


            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }


            th,
            td {
              border: 1px solid #ccc;
              padding: 8px;
              font-size: 10px;
              text-align: left;
              white-space: nowrap;
            }


            th {
              background: #dcecf6;
              color: #164e70;
              font-weight: bold;
            }


            tr:nth-child(even) {
              background: #f8fbfd;
            }

          </style>

        </head>


        <body>

          <h1>
            Patient Visit Report
          </h1>


          <p>
            Generated:
            ${new Date().toLocaleString()}
          </p>


          ${table.outerHTML}


        </body>

      </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(
      () => {

        printWindow.print();

      },
      500
    );

  }


  // =====================================================
  // PRINT
  // =====================================================

  printReport(): void {

    window.print();

  }


  // =====================================================
  // TODAY
  // =====================================================

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

}