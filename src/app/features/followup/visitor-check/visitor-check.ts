
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
  Patient
} from '../../../core/models/patient';

import {
  Visit,
  VisitSession,
  VisitSlot,
  VisitorGender
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

  templateUrl:
    './visitor-check.html',

  styleUrl:
    './visitor-check.css'
})
export class VisitorCheck
  implements OnInit {


  // =====================================================
  // EXPOSE MATH TO ANGULAR TEMPLATE
  // =====================================================

  Math = Math;


  // =====================================================
  // PATIENTS
  // =====================================================

  patients: Patient[] = [];

  searchText = '';


  // =====================================================
  // PAGINATION
  // =====================================================

  currentPage = 1;

  pageSize = 10;


  // =====================================================
  // SESSION
  // =====================================================

  selectedSession:
    VisitSession = 'Day';


  // =====================================================
  // VISITOR FORM
  // =====================================================

  showVisitorForm = false;

  selectedPatient:
    Patient | null = null;

  selectedSlot:
    VisitSlot = 1;


  // =====================================================
  // VISITOR DETAILS
  // =====================================================

  visitorFirstName = '';

  visitorSecondName = '';

  visitorLastName = '';

  visitorCardNumber = '';

  visitorPhone = '';

  visitorGender:
    VisitorGender | '' = '';

  visitorRelation = '';


  // =====================================================
  // CHECK IN
  // =====================================================

  checkIn =
    this.getDateTimeLocal();


  // =====================================================
  // DATE
  // =====================================================

  today =
    this.getToday();


  currentTime =
    new Date();


  // =====================================================
  // MESSAGES
  // =====================================================

  message = '';

  errorMessage = '';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private patientService:
      PatientService,

    private visitService:
      VisitService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadPatients();

  }


  // =====================================================
  // LOAD PATIENTS
  // =====================================================

  loadPatients(): void {

    this.patients =
      this.patientService
        .getAdmittedPatients();

    this.currentPage = 1;

  }


  // =====================================================
  // FILTERED PATIENTS
  // =====================================================

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

        const name =
          `${patient.firstName} ${patient.secondName} ${patient.lastName}`
            .toLowerCase();


        return (

          name.includes(search) ||

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


  // =====================================================
  // PAGINATED PATIENTS
  // =====================================================

  get paginatedPatients(): Patient[] {

    const start =
      (this.currentPage - 1) *
      this.pageSize;


    const end =
      start +
      this.pageSize;


    return this.filteredPatients
      .slice(start, end);

  }


  // =====================================================
  // TOTAL PAGES
  // =====================================================

  get totalPages(): number {

    return Math.ceil(
      this.filteredPatients.length /
      this.pageSize
    );

  }


  // =====================================================
  // PAGE NUMBERS
  // =====================================================

  get pageNumbers(): number[] {

    const total =
      this.totalPages;


    if (total <= 7) {

      return Array.from(
        { length: total },
        (_, index) =>
          index + 1
      );

    }


    const pages: number[] = [];


    // FIRST PAGE

    pages.push(1);


    // LEFT ELLIPSIS

    if (this.currentPage > 4) {

      pages.push(-1);

    }


    // MIDDLE PAGES

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

      pages.push(page);

    }


    // RIGHT ELLIPSIS

    if (
      this.currentPage <
      total - 3
    ) {

      pages.push(-1);

    }


    // LAST PAGE

    pages.push(total);


    return pages;

  }


  // =====================================================
  // GO TO PAGE
  // =====================================================

  goToPage(
    page: number
  ): void {

    if (
      page < 1 ||
      page > this.totalPages
    ) {

      return;

    }


    this.currentPage =
      page;


    this.scrollTableToTop();

  }


  // =====================================================
  // PREVIOUS PAGE
  // =====================================================

  previousPage(): void {

    if (
      this.currentPage > 1
    ) {

      this.currentPage--;

      this.scrollTableToTop();

    }

  }


  // =====================================================
  // NEXT PAGE
  // =====================================================

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages
    ) {

      this.currentPage++;

      this.scrollTableToTop();

    }

  }


  // =====================================================
  // CHANGE PAGE SIZE
  // =====================================================

  changePageSize(): void {

    this.currentPage = 1;

    this.scrollTableToTop();

  }


  // =====================================================
  // SEARCH CHANGE
  // =====================================================

  onSearchChange(): void {

    this.currentPage = 1;

  }


  // =====================================================
  // PATIENT NAME
  // =====================================================

  getPatientName(
    patient: Patient
  ): string {

    return [

      patient.firstName,

      patient.secondName,

      patient.lastName

    ]

      .filter(
        name =>
          !!name?.trim()
      )

      .join(' ');

  }


  // =====================================================
  // MAX SLOTS
  // =====================================================

  getMaxSlots(): number {

    return this.visitService
      .getMaxSlots(
        this.selectedSession
      );

  }


  // =====================================================
  // IS SLOT AVAILABLE
  // =====================================================

  isSlotAllowed(
    slot: VisitSlot
  ): boolean {

    return (
      slot <=
      this.getMaxSlots()
    );

  }


  // =====================================================
  // GET SLOT
  // =====================================================

  getSlot(
    patient: Patient,
    slot: VisitSlot
  ): Visit | undefined {

    return this.visitService
      .getSlotVisit(
        patient.id,
        this.selectedSession,
        slot,
        this.today
      );

  }


  // =====================================================
  // CHECK SLOT USED
  // =====================================================

  isSlotUsed(
    patient: Patient,
    slot: VisitSlot
  ): boolean {

    return !!this.getSlot(
      patient,
      slot
    );

  }


  // =====================================================
  // CHECKED IN
  // =====================================================

  isCheckedIn(
    patient: Patient,
    slot: VisitSlot
  ): boolean {

    const visit =
      this.getSlot(
        patient,
        slot
      );


    return (

      !!visit &&

      visit.status ===
        'Checked In'

    );

  }


  // =====================================================
  // SELECT SESSION
  // =====================================================

  selectSession(
    session: VisitSession
  ): void {

    this.selectedSession =
      session;


    this.currentPage = 1;


    this.closeForm();


    this.message = '';

    this.errorMessage = '';

  }


  // =====================================================
  // OPEN VISITOR FORM
  // =====================================================

  openVisitorForm(
    patient: Patient,
    slot: VisitSlot
  ): void {


    // -----------------------------
    // SESSION SLOT VALIDATION
    // -----------------------------

    if (
      !this.isSlotAllowed(slot)
    ) {

      this.errorMessage =
        `Visitor ${slot} is not available during ${this.selectedSession}.`;

      return;

    }


    // -----------------------------
    // CHECK EXISTING SLOT
    // -----------------------------

    const existing =
      this.getSlot(
        patient,
        slot
      );


    if (existing) {


      if (
        existing.status ===
        'Checked In'
      ) {

        const checkout =
          confirm(
            `This visitor is currently checked in. Do you want to check them out now?`
          );


        if (checkout) {

          this.checkout(
            existing
          );

        }

      }


      return;

    }


    // -----------------------------
    // SELECT PATIENT
    // -----------------------------

    this.selectedPatient =
      patient;


    this.selectedSlot =
      slot;


    // -----------------------------
    // RESET VISITOR FORM
    // -----------------------------

    this.visitorFirstName = '';

    this.visitorSecondName = '';

    this.visitorLastName = '';

    this.visitorCardNumber = '';

    this.visitorPhone = '';

    this.visitorGender = '';

    this.visitorRelation = '';


    // -----------------------------
    // CHECK-IN TIME
    // -----------------------------

    this.checkIn =
      this.getDateTimeLocal();


    this.message = '';

    this.errorMessage = '';


    this.showVisitorForm =
      true;

  }


  // =====================================================
  // SAVE VISITOR
  // =====================================================

  saveVisitor(
    form: any
  ): void {

    if (

      !form ||

      form.invalid ||

      !this.selectedPatient

    ) {

      this.errorMessage =
        'Please fill all required visitor information.';

      return;

    }


    // -----------------------------
    // VALIDATE GENDER
    // -----------------------------

    if (
      !this.visitorGender
    ) {

      this.errorMessage =
        'Please select visitor gender.';

      return;

    }


    // -----------------------------
    // VALIDATE RELATION
    // -----------------------------

    if (
      !this.visitorRelation.trim()
    ) {

      this.errorMessage =
        'Please enter visitor relation to the patient.';

      return;

    }


    // -----------------------------
    // CHECK SLOT LIMIT
    // -----------------------------

    if (
      !this.isSlotAllowed(
        this.selectedSlot
      )
    ) {

      this.errorMessage =
        `Visitor ${this.selectedSlot} is not allowed for ${this.selectedSession}.`;

      return;

    }


    // -----------------------------
    // CHECK EXISTING SLOT
    // -----------------------------

    const existing =
      this.getSlot(
        this.selectedPatient,
        this.selectedSlot
      );


    if (existing) {

      this.errorMessage =
        'This visitor slot has already been used.';

      return;

    }


    // -----------------------------
    // CREATE VISIT
    // -----------------------------

    const visit: Visit = {

      id:
        this.visitService
          .generateId(),


      // ---------------------------
      // PATIENT
      // ---------------------------

      patientId:
        this.selectedPatient.id,

      patientNumber:
        this.selectedPatient
          .patientNumber,

      patientName:
        this.getPatientName(
          this.selectedPatient
        ),

      ward:
        this.selectedPatient.ward,


      // ---------------------------
      // VISITOR
      // ---------------------------

      visitorFirstName:
        this.visitorFirstName
          .trim(),

      visitorSecondName:
        this.visitorSecondName
          .trim(),

      visitorLastName:
        this.visitorLastName
          .trim(),

      visitorCardNumber:
        this.visitorCardNumber
          .trim(),

      visitorPhone:
        this.visitorPhone
          .trim(),

      visitorGender:
        this.visitorGender,

      visitorRelation:
        this.visitorRelation
          .trim(),


      // ---------------------------
      // VISIT
      // ---------------------------

      session:
        this.selectedSession,

      slot:
        this.selectedSlot,

      visitDate:
        this.today,

      checkIn:
        this.checkIn,

      checkOut:
        null,

      durationMinutes:
        null,

      status:
        'Checked In'

    };


    // -----------------------------
    // SAVE
    // -----------------------------

    const saved =
      this.visitService
        .addVisit(
          visit
        );


    if (!saved) {

      this.errorMessage =
        'This visitor slot is already occupied or the session limit has been reached.';

      return;

    }


    // -----------------------------
    // SUCCESS
    // -----------------------------

    this.message =
      `Visitor ${this.selectedSlot} checked in successfully.`;


    this.closeForm();

  }


  // =====================================================
  // CHECKOUT
  // =====================================================

  checkout(
    visit: Visit
  ): void {

    const now =
      this.getDateTimeLocal();


    const confirmed =
      confirm(
        `Check out ${visit.visitorFirstName} ${visit.visitorSecondName} ${visit.visitorLastName}?`
      );


    if (!confirmed) {

      return;

    }


    const success =
      this.visitService
        .checkoutVisit(
          visit.id,
          now
        );


    if (success) {

      this.message =
        'Visitor checked out successfully.';

    }

  }


  // =====================================================
  // CLOSE FORM
  // =====================================================

  closeForm(): void {

    this.showVisitorForm =
      false;


    this.selectedPatient =
      null;

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
  // SCROLL TABLE TO TOP
  // =====================================================

  private scrollTableToTop(): void {

    setTimeout(() => {

      const table =
        document.querySelector(
          '.patients-card'
        );


      if (table) {

        table.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

      }

    }, 50);

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


  // =====================================================
  // DATETIME LOCAL
  // =====================================================

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