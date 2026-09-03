import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
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
  // DATA
  // =====================================================

  patients: Patient[] = [];

  visits: Visit[] = [];


  // =====================================================
  // TODAY
  // =====================================================

  today = this.getToday();


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private patientService: PatientService,

    private visitService: VisitService

  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadDashboardData();

  }


  // =====================================================
  // LOAD DATA
  // =====================================================

  loadDashboardData(): void {

    this.patients =
      this.patientService
        .getAdmittedPatients();

    this.visits =
      this.visitService
        .getVisits();

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
        visit.visitDate === this.today

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
        visit.status === 'Checked In'

    ).length;

  }


  // =====================================================
  // COMPLETED
  // =====================================================

  get totalCompleted(): number {

    return this.todayVisits.filter(

      visit =>
        visit.status === 'Completed'

    ).length;

  }


  // =====================================================
  // MORNING VISITS
  // =====================================================

  get totalMorningVisits(): number {

    return this.todayVisits.filter(

      visit =>
        visit.session === 'Morning'

    ).length;

  }


  // =====================================================
  // DAY VISITS
  // =====================================================

  get totalDayVisits(): number {

    return this.todayVisits.filter(

      visit =>
        visit.session === 'Day'

    ).length;

  }


  // =====================================================
  // EVENING VISITS
  // =====================================================

  get totalEveningVisits(): number {

    return this.todayVisits.filter(

      visit =>
        visit.session === 'Evening'

    ).length;

  }


  // =====================================================
  // RECENT VISITS
  // =====================================================

  get recentVisits(): Visit[] {

    return this.todayVisits

      .slice()

      .sort(

        (a, b) => {

          const timeA =
            a.checkIn
              ? new Date(a.checkIn).getTime()
              : 0;

          const timeB =
            b.checkIn
              ? new Date(b.checkIn).getTime()
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
  // TODAY
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