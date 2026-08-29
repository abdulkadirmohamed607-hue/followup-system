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
  VisitSession
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

  patients: Patient[] = [];

  searchText = '';

  selectedSession:
    VisitSession = 'Day';


  showVisitorForm = false;

  selectedPatient:
    Patient | null = null;

  selectedSlot:
    1 | 2 = 1;


  visitorFirstName = '';

  visitorSecondName = '';

  visitorLastName = '';

  visitorPhone = '';


  checkIn =
    this.getDateTimeLocal();


  today =
    this.getToday();


  currentTime =
    new Date();


  message = '';

  errorMessage = '';


  constructor(
    private patientService: PatientService,
    private visitService: VisitService
  ) {}


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

  }


  // =====================================================
  // FILTER
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
  // PATIENT NAME
  // =====================================================

  getPatientName(
    patient: Patient
  ): string {

    return [
      patient.firstName,
      patient.secondName,
      patient.lastName
    ].join(' ');

  }


  // =====================================================
  // GET SLOT
  // =====================================================

  getSlot(
    patient: Patient,
    slot: 1 | 2
  ): Visit | undefined {

    return this.visitService.getSlotVisit(
      patient.id,
      this.selectedSession,
      slot,
      this.today
    );

  }


  // =====================================================
  // CHECKED
  // =====================================================

  isSlotUsed(
    patient: Patient,
    slot: 1 | 2
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
    slot: 1 | 2
  ): boolean {

    const visit =
      this.getSlot(
        patient,
        slot
      );

    return (
      !!visit &&
      visit.status === 'Checked In'
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

    this.closeForm();

  }


  // =====================================================
  // OPEN VISITOR FORM
  // =====================================================

  openVisitorForm(
    patient: Patient,
    slot: 1 | 2
  ): void {

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
            'This visitor is currently checked in. Do you want to check them out now?'
          );

        if (checkout) {

          this.checkout(
            existing
          );

        }

      }

      return;

    }


    this.selectedPatient =
      patient;

    this.selectedSlot =
      slot;


    this.visitorFirstName = '';

    this.visitorSecondName = '';

    this.visitorLastName = '';

    this.visitorPhone = '';

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


    const visit: Visit = {

      id:
        this.visitService.generateId(),

      patientId:
        this.selectedPatient.id,

      patientNumber:
        this.selectedPatient.patientNumber,

      patientName:
        this.getPatientName(
          this.selectedPatient
        ),

      ward:
        this.selectedPatient.ward,

      visitorFirstName:
        this.visitorFirstName.trim(),

      visitorSecondName:
        this.visitorSecondName.trim(),

      visitorLastName:
        this.visitorLastName.trim(),

      visitorPhone:
        this.visitorPhone.trim(),

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


    const saved =
      this.visitService.addVisit(
        visit
      );


    if (!saved) {

      this.errorMessage =
        'This visitor slot is already occupied.';

      return;

    }


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


    this.visitService.checkoutVisit(
      visit.id,
      now
    );


    this.message =
      'Visitor checked out successfully.';

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
  // DURATION
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
  // DATE
  // =====================================================

  private getToday(): string {

    const now =
      new Date();

    return [
      now.getFullYear(),
      String(
        now.getMonth() + 1
      ).padStart(2, '0'),
      String(
        now.getDate()
      ).padStart(2, '0')
    ].join('-');

  }


  // =====================================================
  // DATETIME
  // =====================================================

  private getDateTimeLocal(): string {

    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        now.getDate()
      ).padStart(2, '0');

    const hours =
      String(
        now.getHours()
      ).padStart(2, '0');

    const minutes =
      String(
        now.getMinutes()
      ).padStart(2, '0');


    return `${year}-${month}-${day}T${hours}:${minutes}`;

  }

}