import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  FormsModule,
  NgForm
} from '@angular/forms';

import {
  Patient
} from '../../../core/models/patient';

import {
  Visit,
  VisitSession,
  VisitSlot,
  VisitorGender,
  VisitorRelation
} from '../../../core/models/visit';

import {
  PatientService
} from '../../../core/services/patient.service';

import {
  VisitService
} from '../../../core/services/visit.service';


@Component({
  selector: 'app-visitor-check',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './visitor-check.html',

  styleUrl: './visitor-check.css'
})
export class VisitorCheck implements OnInit {

  Math = Math;

  private readonly platformId =
    inject(PLATFORM_ID);


  // =========================================================
  // PATIENTS
  // =========================================================

  patients: Patient[] = [];

  searchText = '';

  currentPage = 1;

  pageSize = 10;


  // =========================================================
  // SESSION
  // =========================================================

  selectedSession: VisitSession = 'Day';


  // =========================================================
  // MESSAGES
  // =========================================================

  message = '';

  errorMessage = '';


  // =========================================================
  // VISITOR FORM
  // =========================================================

  showVisitorForm = false;

  selectedPatient: Patient | null = null;

  selectedSlot: VisitSlot | null = null;


  visitorFirstName = '';

  visitorSecondName = '';

  visitorLastName = '';

  visitorCardNumber = '';

  visitorPhone = '';

  visitorGender: VisitorGender = 'Male';

  visitorRelation: VisitorRelation = 'Relative';

  checkIn = '';


  // =========================================================
  // VIEW VISITORS
  // =========================================================

  showVisitorsModal = false;

  viewedPatient: Patient | null = null;

  patientVisitors: Visit[] = [];


  // =========================================================
  // DATE / TIME
  // =========================================================

  today = '';

  currentTime = '';


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private patientService: PatientService,
    private visitService: VisitService
  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.today =
      this.getToday();

    this.currentTime =
      this.getCurrentTime();


    /*
     * Important:
     * Wait for patients from API before displaying them.
     *
     * This fixes the problem where Visitor Check
     * was empty after direct browser reload.
     */
    this.loadPatients();


    /*
     * Do not call visits API during SSR.
     */
    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      this.visitService.loadVisits();

    }
  }


  // =========================================================
  // LOAD PATIENTS
  // =========================================================

  loadPatients(): void {

    this.patientService
      .ensurePatientsLoaded()
      .subscribe({

        next: patients => {

          /*
           * Visitor Check only shows admitted patients.
           */
          this.patients =
            patients.filter(
              patient =>
                patient.status === 'Admitted'
            );


          this.currentPage = 1;

        },

        error: error => {

          console.error(
            'Failed to load patients for Visitor Check:',
            error
          );


          this.patients = [];

          this.errorMessage =
            'Failed to load patients. Please try again.';

        }

      });
  }


  // =========================================================
  // FILTERED PATIENTS
  // =========================================================

  get filteredPatients(): Patient[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    if (!search) {

      return this.patients;

    }


    return this.patients.filter(
      patient => {

        const fullName =
          `${patient.firstName} ${patient.secondName} ${patient.lastName}`
            .toLowerCase();


        return (
          fullName.includes(search) ||

          patient.patientNumber
            .toLowerCase()
            .includes(search) ||

          patient.ward
            .toLowerCase()
            .includes(search)
        );

      }
    );
  }


  // =========================================================
  // PAGINATION
  // =========================================================

  get totalPages(): number {

    return Math.max(
      1,
      Math.ceil(
        this.filteredPatients.length /
        this.pageSize
      )
    );
  }


  get paginatedPatients(): Patient[] {

    const start =
      (this.currentPage - 1) *
      this.pageSize;


    return this.filteredPatients.slice(
      start,
      start + this.pageSize
    );
  }


  get pageNumbers(): number[] {

    const total =
      this.totalPages;


    /*
     * Simple pagination for normal number
     * of pages.
     *
     * Adds -1 for dots when there are many pages.
     */
    if (total <= 7) {

      return Array.from(
        {
          length: total
        },
        (_, index) =>
          index + 1
      );

    }


    const pages: number[] = [];


    pages.push(1);


    if (this.currentPage > 4) {

      pages.push(-1);

    }


    const start =
      Math.max(
        2,
        this.currentPage - 1
      );

    const end =
      Math.min(
        total - 1,
        this.currentPage + 1
      );


    for (
      let page = start;
      page <= end;
      page++
    ) {

      if (
        !pages.includes(page)
      ) {

        pages.push(page);

      }

    }


    if (
      this.currentPage <
      total - 3
    ) {

      pages.push(-1);

    }


    pages.push(total);


    return pages;
  }


  // =========================================================
  // SEARCH
  // =========================================================

  onSearchChange(): void {

    this.currentPage = 1;

  }


  // =========================================================
  // PAGE SIZE
  // =========================================================

  changePageSize(): void {

    this.currentPage = 1;

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
  // GO TO PAGE
  // =========================================================

  goToPage(
    page: number
  ): void {

    if (
      page === -1
    ) {

      return;

    }


    if (
      page < 1 ||
      page > this.totalPages
    ) {

      return;

    }


    this.currentPage =
      page;
  }


  // =========================================================
  // PATIENT NAME
  // =========================================================

  getPatientName(
    patient: Patient
  ): string {

    return (
      `${patient.firstName} ` +
      `${patient.secondName} ` +
      `${patient.lastName}`
    )
      .replace(/\s+/g, ' ')
      .trim();
  }


  // =========================================================
  // SELECT SESSION
  // =========================================================

  selectSession(
    session: VisitSession
  ): void {

    this.selectedSession =
      session;


    this.message = '';

    this.errorMessage = '';


    /*
     * Close form when changing session.
     */
    this.closeForm();

  }


  // =========================================================
  // MAX VISITORS
  // =========================================================

  getMaxVisitors(): number {

    if (
      this.selectedSession ===
      'Evening'
    ) {

      return 3;

    }


    return 2;
  }


  // =========================================================
  // CHECK SLOT USED
  // =========================================================

  isSlotUsed(
    patient: Patient,
    slot: number
  ): boolean {

    const visit =
      this.getSlot(
        patient,
        slot
      );


    return !!visit;
  }


  // =========================================================
  // GET SLOT
  // =========================================================

  getSlot(
    patient: Patient,
    slot: number
  ): Visit | undefined {

    return this.visitService
      .getSlotVisit(
        patient.id,
        this.selectedSession,
        slot,
        this.getToday()
      );
  }


  // =========================================================
  // CHECK WHETHER VISITOR IS STILL CHECKED IN
  // =========================================================

  isCheckedIn(
    patient: Patient,
    slot: number
  ): boolean {

    const visit =
      this.getSlot(
        patient,
        slot
      );


    if (!visit) {

      return false;

    }


    return (
      visit.status ===
      'Checked In'
    );
  }


  // =========================================================
  // OPEN VISITOR FORM
  // =========================================================

  openVisitorForm(
    patient: Patient,
    slot: number
  ): void {

    this.message = '';

    this.errorMessage = '';


    // -------------------------------------------------------
    // PATIENT STATUS
    // -------------------------------------------------------

    if (
      patient.status !==
      'Admitted'
    ) {

      this.errorMessage =
        'Only admitted patients can receive visitors.';

      return;
    }


    // -------------------------------------------------------
    // SLOT LIMIT
    // -------------------------------------------------------

    const maximum =
      this.getMaxVisitors();


    if (
      slot < 1 ||
      slot > maximum
    ) {

      this.errorMessage =
        `${this.selectedSession} session allows only ${maximum} visitors.`;

      return;
    }


    // -------------------------------------------------------
    // CHECK DUPLICATE
    // -------------------------------------------------------

    if (
      this.isSlotUsed(
        patient,
        slot
      )
    ) {

      this.errorMessage =
        `Visitor ${slot} has already been registered for this patient during the ${this.selectedSession} session.`;

      return;
    }


    // -------------------------------------------------------
    // SET SELECTED PATIENT
    // -------------------------------------------------------

    this.selectedPatient =
      patient;


    this.selectedSlot =
      slot;


    // -------------------------------------------------------
    // RESET FORM
    // -------------------------------------------------------

    this.visitorFirstName = '';

    this.visitorSecondName = '';

    this.visitorLastName = '';

    this.visitorCardNumber = '';

    this.visitorPhone = '';

    this.visitorGender =
      'Male';

    this.visitorRelation =
      'Relative';


    this.checkIn =
      this.getDateTimeLocal();


    // -------------------------------------------------------
    // SHOW MODAL
    // -------------------------------------------------------

    this.showVisitorForm =
      true;
  }


  // =========================================================
  // SAVE VISITOR
  // =========================================================

  saveVisitor(
    visitorForm: NgForm
  ): void {

    this.message = '';

    this.errorMessage = '';


    // -------------------------------------------------------
    // FORM VALIDATION
    // -------------------------------------------------------

    if (
      visitorForm.invalid
    ) {

      visitorForm.control.markAllAsTouched();

      this.errorMessage =
        'Please fill in all required visitor information.';

      return;
    }


    // -------------------------------------------------------
    // PATIENT
    // -------------------------------------------------------

    if (
      !this.selectedPatient
    ) {

      this.errorMessage =
        'Please select a patient.';

      return;
    }


    // -------------------------------------------------------
    // SLOT
    // -------------------------------------------------------

    if (
      this.selectedSlot === null
    ) {

      this.errorMessage =
        'Visitor slot is missing.';

      return;
    }


    // -------------------------------------------------------
    // CHECK DUPLICATE AGAIN
    // -------------------------------------------------------

    if (
      this.isSlotUsed(
        this.selectedPatient,
        this.selectedSlot
      )
    ) {

      this.errorMessage =
        `Visitor ${this.selectedSlot} has already been registered for this patient during the ${this.selectedSession} session.`;

      return;
    }


    // -------------------------------------------------------
    // CREATE VISIT
    // -------------------------------------------------------

    const visit: Partial<Visit> = {

      patient:
        this.selectedPatient.id,

      patientId:
        this.selectedPatient.id,

      patientName:
        this.getPatientName(
          this.selectedPatient
        ),

      patientNumber:
        this.selectedPatient.patientNumber,

      ward:
        this.selectedPatient.ward,


      firstName:
        this.visitorFirstName
          .trim(),

      secondName:
        this.visitorSecondName
          .trim(),

      lastName:
        this.visitorLastName
          .trim(),


      visitorFirstName:
        this.visitorFirstName
          .trim(),

      visitorSecondName:
        this.visitorSecondName
          .trim(),

      visitorLastName:
        this.visitorLastName
          .trim(),


      phone:
        this.visitorPhone
          .trim(),

      visitorPhone:
        this.visitorPhone
          .trim(),


      cardNumber:
        this.visitorCardNumber
          .trim(),

      visitorCardNumber:
        this.visitorCardNumber
          .trim(),


      gender:
        this.visitorGender,

      visitorGender:
        this.visitorGender,


      relation:
        this.visitorRelation,

      visitorRelation:
        this.visitorRelation,


      session:
        this.selectedSession,


      visitorNumber:
        this.selectedSlot,

      slot:
        this.selectedSlot,


      visitDate:
        this.getToday(),

      visitTime:
        this.getCurrentTime(),


      checkIn:
        this.checkIn,

      checkOut:
        null,

      durationMinutes:
        null,

      status:
        'Checked In'
    };


    // -------------------------------------------------------
    // SEND TO BACKEND
    // -------------------------------------------------------

    this.visitService
      .addVisit(visit)
      .subscribe({

        next: savedVisit => {

          console.log(
            'Visitor saved successfully:',
            savedVisit
          );


          this.message =
            `Visitor ${this.selectedSlot} has been successfully checked in.`;



          // -------------------------------------------------
          // CLOSE FORM
          // -------------------------------------------------

          this.closeForm();


          // -------------------------------------------------
          // REFRESH VISITS
          // -------------------------------------------------

          if (
            isPlatformBrowser(
              this.platformId
            )
          ) {

            this.visitService
              .loadVisits();

          }

        },


        error: error => {

          console.error(
            'Failed to save visitor:',
            error
          );


          this.errorMessage =
            this.getBackendErrorMessage(
              error
            );

        }

      });
  }


  // =========================================================
  // CHECK OUT
  // =========================================================

  checkout(
    visit: Visit
  ): void {

    if (!visit) {

      return;

    }


    if (!visit.id) {

      this.errorMessage =
        'Invalid visit record.';

      return;

    }


    const checkoutTime =
      this.getDateTimeLocal();


    const success =
      this.visitService.checkoutVisit(
        visit.id,
        checkoutTime
      );


    if (success) {

      this.message =
        `${this.getVisitorFullName(visit)} has been checked out successfully.`;


      /*
       * Refresh visitors in the modal.
       */
      if (
        this.viewedPatient
      ) {

        this.loadPatientVisitors(
          this.viewedPatient.id
        );

      }

    }
  }


  // =========================================================
  // VIEW VISITORS
  // =========================================================

  viewVisitors(
    patient: Patient
  ): void {

    this.message = '';

    this.errorMessage = '';


    this.viewedPatient =
      patient;


    this.loadPatientVisitors(
      patient.id
    );


    this.showVisitorsModal =
      true;
  }


  // =========================================================
  // LOAD PATIENT VISITORS
  // =========================================================

  loadPatientVisitors(
    patientId: number
  ): void {

    this.patientVisitors =
      this.visitService
        .getPatientVisitsByDate(
          patientId,
          this.getToday()
        );
  }


  // =========================================================
  // CLOSE FORM
  // =========================================================

  closeForm(): void {

    this.showVisitorForm =
      false;


    this.selectedPatient =
      null;


    this.selectedSlot =
      null;


    this.visitorFirstName = '';

    this.visitorSecondName = '';

    this.visitorLastName = '';

    this.visitorCardNumber = '';

    this.visitorPhone = '';

    this.visitorGender =
      'Male';

    this.visitorRelation =
      'Relative';


    this.checkIn = '';

  }


  // =========================================================
  // CLOSE VISITOR FORM
  // Alias
  // =========================================================

  closeVisitorForm(): void {

    this.closeForm();

  }


  // =========================================================
  // CLOSE VISITORS MODAL
  // =========================================================

  closeVisitorsModal(): void {

    this.showVisitorsModal =
      false;


    this.viewedPatient =
      null;


    this.patientVisitors =
      [];
  }


  // =========================================================
  // GET VISITOR FULL NAME
  // =========================================================

  getVisitorFullName(
    visit: Visit
  ): string {

    const first =
      visit.visitorFirstName ||
      visit.firstName ||
      '';


    const second =
      visit.visitorSecondName ||
      visit.secondName ||
      '';


    const last =
      visit.visitorLastName ||
      visit.lastName ||
      '';


    return (
      `${first} ${second} ${last}`
    )
      .replace(/\s+/g, ' ')
      .trim();
  }


  // =========================================================
  // FORMAT TIME
  // =========================================================

  formatTime(
    time: string | null | undefined
  ): string {

    if (!time) {

      return '-';

    }


    /*
     * Handle datetime-local:
     * 2026-09-04T12:30
     */
    if (
      time.includes('T')
    ) {

      const date =
        new Date(time);


      if (
        !isNaN(
          date.getTime()
        )
      ) {

        return date.toLocaleTimeString(
          'en-US',
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        );

      }

    }


    /*
     * Handle normal time:
     * 12:30:00
     */
    const parts =
      time.split(':');


    if (
      parts.length >= 2
    ) {

      let hour =
        Number(parts[0]);

      const minute =
        parts[1];


      if (
        !isNaN(hour)
      ) {

        const suffix =
          hour >= 12
            ? 'PM'
            : 'AM';


        hour =
          hour % 12 || 12;


        return (
          `${String(hour).padStart(2, '0')}:${minute} ${suffix}`
        );

      }

    }


    return time;
  }


  // =========================================================
  // FORMAT DATE
  // =========================================================

  formatDate(
    date: string | null | undefined
  ): string {

    if (!date) {

      return '-';

    }


    const parsed =
      new Date(date);


    if (
      isNaN(
        parsed.getTime()
      )
    ) {

      return date;

    }


    return parsed.toLocaleDateString(
      'en-GB'
    );
  }


  // =========================================================
  // GET TODAY
  // =========================================================

  getToday(): string {

    const now =
      new Date();


    const year =
      now.getFullYear();


    const month =
      String(
        now.getMonth() + 1
      )
        .padStart(
          2,
          '0'
        );


    const day =
      String(
        now.getDate()
      )
        .padStart(
          2,
          '0'
        );


    return (
      `${year}-${month}-${day}`
    );
  }


  // =========================================================
  // GET CURRENT TIME
  // =========================================================

  getCurrentTime(): string {

    const now =
      new Date();


    const hours =
      String(
        now.getHours()
      )
        .padStart(
          2,
          '0'
        );


    const minutes =
      String(
        now.getMinutes()
      )
        .padStart(
          2,
          '0'
        );


    const seconds =
      String(
        now.getSeconds()
      )
        .padStart(
          2,
          '0'
        );


    return (
      `${hours}:${minutes}:${seconds}`
    );
  }


  // =========================================================
  // GET DATETIME LOCAL
  // =========================================================

  getDateTimeLocal(): string {

    const now =
      new Date();


    const year =
      now.getFullYear();


    const month =
      String(
        now.getMonth() + 1
      )
        .padStart(
          2,
          '0'
        );


    const day =
      String(
        now.getDate()
      )
        .padStart(
          2,
          '0'
        );


    const hours =
      String(
        now.getHours()
      )
        .padStart(
          2,
          '0'
        );


    const minutes =
      String(
        now.getMinutes()
      )
        .padStart(
          2,
          '0'
        );


    return (
      `${year}-${month}-${day}T${hours}:${minutes}`
    );
  }


  // =========================================================
  // BACKEND ERROR MESSAGE
  // =========================================================

  getBackendErrorMessage(
    error: any
  ): string {

    if (
      error?.error
    ) {

      const backendError =
        error.error;


      // -----------------------------------------------
      // detail
      // -----------------------------------------------

      if (
        typeof backendError.detail ===
        'string'
      ) {

        return backendError.detail;

      }


      // -----------------------------------------------
      // DRF FIELD ERRORS
      // -----------------------------------------------

      if (
        typeof backendError ===
        'object'
      ) {

        const messages: string[] =
          [];


        Object.keys(
          backendError
        ).forEach(
          key => {

            const value =
              backendError[key];


            if (
              Array.isArray(value)
            ) {

              messages.push(
                `${key}: ${value.join(', ')}`
              );

            }

            else if (
              typeof value ===
              'string'
            ) {

              messages.push(
                `${key}: ${value}`
              );

            }

          }
        );


        if (
          messages.length > 0
        ) {

          return messages.join(
            ' '
          );

        }

      }

    }


    if (
      error?.message
    ) {

      return error.message;

    }


    return (
      'Failed to save visitor. Please try again.'
    );
  }

}