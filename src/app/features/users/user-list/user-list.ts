import {
  Component,
  computed,
  signal
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  Patient
} from '../../../core/models/patient';

import {
  PatientService
} from '../../../core/services/patient.service';


@Component({

  selector: 'app-user-list',

  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl: './user-list.html',

  styleUrl: './user-list.css'

})
export class UserList {

  // =====================================================
  // SEARCH
  // =====================================================

  searchTerm =
    signal('');


  // =====================================================
  // STATUS FILTER
  // =====================================================

  selectedStatus =
    signal<
      'All' |
      'Admitted' |
      'Discharged'
    >('All');


  // =====================================================
  // PAGINATION
  // =====================================================

  currentPage =
    signal(1);

  pageSize =
    signal(10);


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private patientService:
      PatientService,

    private router:
      Router

  ) {}


  // =====================================================
  // PATIENTS
  // =====================================================

  /*
   * Read directly from the reactive signal
   * inside PatientService.
   *
   * Whenever the service updates patients,
   * this component updates automatically.
   */

  get patients(): Patient[] {

    return this.patientService.patients();

  }


  // =====================================================
  // FILTERED PATIENTS
  // =====================================================

  filteredPatients =
    computed(() => {

      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();


      const status =
        this.selectedStatus();


      return this.patients.filter(
        patient => {

          // ---------------------------------------------
          // FULL NAME
          // ---------------------------------------------

          const fullName =
            [
              patient.firstName,
              patient.secondName,
              patient.lastName
            ]
              .filter(
                name => !!name
              )
              .join(' ')
              .toLowerCase();


          // ---------------------------------------------
          // PATIENT NUMBER
          // ---------------------------------------------

          const patientNumber =
            String(
              patient.patientNumber ?? ''
            )
              .toLowerCase();


          // ---------------------------------------------
          // WARD
          // ---------------------------------------------

          const ward =
            String(
              patient.ward ?? ''
            )
              .toLowerCase();


          // ---------------------------------------------
          // SEARCH
          // ---------------------------------------------

          const matchesSearch =
            !search ||
            fullName.includes(search) ||
            patientNumber.includes(search) ||
            ward.includes(search);


          // ---------------------------------------------
          // STATUS
          // ---------------------------------------------

          const matchesStatus =
            status === 'All' ||
            patient.status === status;


          return (
            matchesSearch &&
            matchesStatus
          );

        }

      );

    });


  // =====================================================
  // PAGINATED PATIENTS
  // =====================================================

  paginatedPatients =
    computed(() => {

      const page =
        this.currentPage();


      const size =
        this.pageSize();


      const start =
        (page - 1) * size;


      const end =
        start + size;


      return this.filteredPatients()
        .slice(
          start,
          end
        );

    });


  // =====================================================
  // TOTAL PATIENTS
  // =====================================================

  get totalPatients(): number {

    return this.patients.length;

  }


  // =====================================================
  // ADMITTED PATIENTS
  // =====================================================

  get admittedPatients(): number {

    return this.patients.filter(
      patient =>
        patient.status === 'Admitted'
    ).length;

  }


  // =====================================================
  // DISCHARGED PATIENTS
  // =====================================================

  get dischargedPatients(): number {

    return this.patients.filter(
      patient =>
        patient.status === 'Discharged'
    ).length;

  }


  // =====================================================
  // TOTAL PAGES
  // =====================================================

  totalPages =
    computed(() => {

      const total =
        this.filteredPatients().length;


      const size =
        this.pageSize();


      if (total === 0) {

        return 1;

      }


      return Math.ceil(
        total / size
      );

    });


  // =====================================================
  // START ITEM
  // =====================================================

  get startItem(): number {

    const total =
      this.filteredPatients().length;


    if (total === 0) {

      return 0;

    }


    return (
      (this.currentPage() - 1) *
      this.pageSize()
    ) + 1;

  }


  // =====================================================
  // END ITEM
  // =====================================================

  get endItem(): number {

    const total =
      this.filteredPatients().length;


    if (total === 0) {

      return 0;

    }


    return Math.min(

      this.currentPage() *
      this.pageSize(),

      total

    );

  }


  // =====================================================
  // PAGE NUMBERS
  // =====================================================

  pageNumbers =
    computed(() => {

      const total =
        this.totalPages();


      const current =
        this.currentPage();


      // -----------------------------------------------
      // SMALL NUMBER OF PAGES
      // -----------------------------------------------

      if (total <= 7) {

        return Array.from(

          {
            length: total
          },

          (_, index) =>
            index + 1

        );

      }


      // -----------------------------------------------
      // MANY PAGES
      // -----------------------------------------------

      const pages: number[] = [];


      // FIRST PAGE

      pages.push(1);


      // LEFT ELLIPSIS

      if (current > 4) {

        pages.push(-1);

      }


      // MIDDLE PAGES

      const start =
        Math.max(
          2,
          current - 1
        );


      const end =
        Math.min(
          total - 1,
          current + 1
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
        current <
        total - 3
      ) {

        pages.push(-1);

      }


      // LAST PAGE

      pages.push(total);


      return pages;

    });


  // =====================================================
  // GO TO PAGE
  // =====================================================

  goToPage(
    page: number
  ): void {

    if (page === -1) {

      return;

    }


    const total =
      this.totalPages();


    if (
      page < 1 ||
      page > total
    ) {

      return;

    }


    this.currentPage.set(
      page
    );


    this.scrollTableToTop();

  }


  // =====================================================
  // PREVIOUS PAGE
  // =====================================================

  previousPage(): void {

    const current =
      this.currentPage();


    if (current > 1) {

      this.currentPage.set(
        current - 1
      );


      this.scrollTableToTop();

    }

  }


  // =====================================================
  // NEXT PAGE
  // =====================================================

  nextPage(): void {

    const current =
      this.currentPage();


    const total =
      this.totalPages();


    if (current < total) {

      this.currentPage.set(
        current + 1
      );


      this.scrollTableToTop();

    }

  }


  // =====================================================
  // CHANGE PAGE SIZE
  // =====================================================

  onPageSizeChange(
    value: string | number
  ): void {

    const newSize =
      Number(value);


    if (
      !Number.isFinite(newSize) ||
      newSize <= 0
    ) {

      return;

    }


    this.pageSize.set(
      newSize
    );


    this.currentPage.set(
      1
    );


    this.scrollTableToTop();

  }


  // =====================================================
  // SEARCH CHANGE
  // =====================================================

  onSearchChange(
    value: string
  ): void {

    this.searchTerm.set(
      value
    );


    this.currentPage.set(
      1
    );

  }


  // =====================================================
  // STATUS CHANGE
  // =====================================================

  onStatusChange(
    value: string
  ): void {

    if (
      value === 'Admitted' ||
      value === 'Discharged'
    ) {

      this.selectedStatus.set(
        value
      );

    }
    else {

      this.selectedStatus.set(
        'All'
      );

    }


    this.currentPage.set(
      1
    );

  }


  // =====================================================
  // RESET FILTERS
  // =====================================================

  resetFilters(): void {

    this.searchTerm.set(
      ''
    );


    this.selectedStatus.set(
      'All'
    );


    this.currentPage.set(
      1
    );

  }


  // =====================================================
  // ADD PATIENT
  // =====================================================

  addPatient(): void {

    this.router.navigate(
      ['/users/add']
    );

  }


  // =====================================================
  // DELETE PATIENT
  // =====================================================

  deletePatient(
    id: number
  ): void {

    const confirmed =
      confirm(
        'Are you sure you want to delete this patient?'
      );


    if (!confirmed) {

      return;

    }


    this.patientService
      .deletePatient(id)
      .subscribe({

        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        next: () => {

          /*
           * PatientService has already removed
           * the patient from its signal.
           *
           * filteredPatients(), pagination and
           * summary counts will update automatically.
           */

          const total =
            this.filteredPatients().length;


          const totalPages =
            Math.max(

              1,

              Math.ceil(
                total /
                this.pageSize()
              )

            );


          if (
            this.currentPage() >
            totalPages
          ) {

            this.currentPage.set(
              totalPages
            );

          }

        },


        // ---------------------------------------------
        // ERROR
        // ---------------------------------------------

        error: error => {

          console.error(
            'Failed to delete patient:',
            error
          );


          if (
            error?.status === 401
          ) {

            alert(
              'Your session has expired. Please login again.'
            );


            this.router.navigate(
              ['/login']
            );

          }
          else {

            alert(
              'Failed to delete patient. Please try again.'
            );

          }

        }

      });

  }


  // =====================================================
  // SCROLL TABLE TO TOP
  // =====================================================

  private scrollTableToTop(): void {

    if (
      typeof document === 'undefined'
    ) {

      return;

    }


    setTimeout(() => {

      const table =
        document.querySelector(
          '.table-card'
        );


      if (table) {

        table.scrollIntoView({

          behavior: 'smooth',

          block: 'start'

        });

      }

    }, 50);

  }

}