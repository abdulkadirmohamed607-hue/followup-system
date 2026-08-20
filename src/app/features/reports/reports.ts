import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  User,
  UserService
} from '../../shared/services/user.service';

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
export class Reports {

  // =====================================================
  // FILTERS
  // =====================================================

  searchText = '';

  selectedType:
    | 'All'
    | 'Patient'
    | 'Relative'
    = 'All';

  selectedStatus:
    | 'All'
    | 'Visited'
    | 'Not Visited'
    = 'All';

  selectedDate = '';


  // =====================================================
  // USERS
  // =====================================================

  users: User[] = [];


  constructor(
    private userService: UserService
  ) {

    this.loadUsers();

  }


  // =====================================================
  // LOAD USERS
  // =====================================================

  loadUsers(): void {

    this.users =
      this.userService.getUsers();

    console.log(
      'REPORT USERS:',
      this.users
    );

    console.log(
      'TOTAL REPORT USERS:',
      this.users.length
    );

  }


  // =====================================================
  // SUMMARY
  // =====================================================

  get totalUsers(): number {

    return this.users.length;

  }


  get totalPatients(): number {

    return this.users.filter(
      user =>
        user.type === 'Patient'
    ).length;

  }


  get totalRelatives(): number {

    return this.users.filter(
      user =>
        user.type === 'Relative'
    ).length;

  }


  get totalVisited(): number {

    return this.users.filter(
      user =>
        user.visited === true
    ).length;

  }


  get totalNotVisited(): number {

    return this.users.filter(
      user =>
        user.visited === false
    ).length;

  }


  // =====================================================
  // FILTERED USERS
  // =====================================================

  get filteredUsers(): User[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    return this.users.filter(
      user => {

        // -----------------------------------------------
        // FULL NAME
        // -----------------------------------------------

        const fullName =
          `${user.firstName} ${user.secondName} ${user.lastName}`
            .toLowerCase();


        // -----------------------------------------------
        // PATIENT NUMBER
        // -----------------------------------------------

        const patientNumber =
          String(
            user.patientNumber || ''
          ).toLowerCase();


        // -----------------------------------------------
        // WARD
        // -----------------------------------------------

        const ward =
          String(
            user.ward || ''
          ).toLowerCase();


        // -----------------------------------------------
        // PATIENT NAME
        // -----------------------------------------------

        const patientName =
          String(
            user.patientName || ''
          ).toLowerCase();


        // -----------------------------------------------
        // SEARCH
        // -----------------------------------------------

        const matchesSearch =
          search === ''
          ||
          fullName.includes(search)
          ||
          patientNumber.includes(search)
          ||
          ward.includes(search)
          ||
          patientName.includes(search);


        // -----------------------------------------------
        // TYPE
        // -----------------------------------------------

        const matchesType =
          this.selectedType === 'All'
          ||
          user.type === this.selectedType;


        // -----------------------------------------------
        // STATUS
        // -----------------------------------------------

        const matchesStatus =
          this.selectedStatus === 'All'
          ||
          (
            this.selectedStatus === 'Visited'
            &&
            user.visited === true
          )
          ||
          (
            this.selectedStatus === 'Not Visited'
            &&
            user.visited === false
          );


        // -----------------------------------------------
        // DATE
        // -----------------------------------------------

        let matchesDate = true;


        if (this.selectedDate !== '') {

          if (!user.visitDate) {

            matchesDate = false;

          } else {

            const visitDate =
              new Date(user.visitDate)
                .toISOString()
                .substring(0, 10);

            matchesDate =
              visitDate === this.selectedDate;

          }

        }


        return (
          matchesSearch
          &&
          matchesType
          &&
          matchesStatus
          &&
          matchesDate
        );

      }
    );

  }


  // =====================================================
  // EXPORT EXCEL
  // =====================================================

  exportExcel(): void {

    const usersToExport =
      this.filteredUsers;


    console.log(
      'EXPORTING EXCEL USERS:',
      usersToExport
    );


    if (usersToExport.length === 0) {

      alert(
        'No users available to export.'
      );

      return;

    }


    // ===================================================
    // EXCEL DATA
    // IMPORTANT:
    // Column names must match Excel Upload
    // ===================================================

    const reportData =
      usersToExport.map(
        user => ({

          'First Name':
            user.firstName || '',

          'Second Name':
            user.secondName || '',

          'Last Name':
            user.lastName || '',

          'Type':
            user.type || '',

          'Patient Name':
            user.patientName || '-',

          'Patient Number':
            user.patientNumber || '',

          'Ward':
            user.ward || '',

          'Status':
            user.visited
              ? 'Visited'
              : 'Not Visited',

          'Visit Date':
            user.visitDate
              ? new Date(
                  user.visitDate
                ).toLocaleDateString()
              : '-'

        })
      );


    console.log(
      'EXCEL DATA:',
      reportData
    );


    // ===================================================
    // CREATE WORKSHEET
    // ===================================================

    const worksheet =
      XLSX.utils.json_to_sheet(
        reportData
      );


    // ===================================================
    // COLUMN WIDTHS
    // ===================================================

    worksheet['!cols'] = [

      {
        wch: 18
      },

      {
        wch: 18
      },

      {
        wch: 18
      },

      {
        wch: 15
      },

      {
        wch: 30
      },

      {
        wch: 20
      },

      {
        wch: 22
      },

      {
        wch: 15
      },

      {
        wch: 18
      }

    ];


    // ===================================================
    // CREATE WORKBOOK
    // ===================================================

    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'FollowUp Report'
    );


    // ===================================================
    // DOWNLOAD
    // ===================================================

    XLSX.writeFile(
      workbook,
      'FollowUp-Report.xlsx'
    );


    console.log(
      'EXCEL EXPORT COMPLETED'
    );

  }


  // =====================================================
  // EXPORT PDF
  // =====================================================

  exportPDF(): void {

    const usersToExport =
      this.filteredUsers;


    if (usersToExport.length === 0) {

      alert(
        'No users available to export.'
      );

      return;

    }


    const doc =
      new jsPDF({

        orientation: 'landscape',

        unit: 'mm',

        format: 'a4'

      });


    // ===================================================
    // TITLE
    // ===================================================

    doc.setFontSize(18);

    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.text(
      'FOLLOWUP SYSTEM REPORT',
      14,
      18
    );


    // ===================================================
    // GENERATED DATE
    // ===================================================

    doc.setFontSize(9);

    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      14,
      25
    );


    // ===================================================
    // SUMMARY
    // ===================================================

    doc.text(
      `Total Users: ${this.totalUsers}`,
      14,
      33
    );

    doc.text(
      `Patients: ${this.totalPatients}`,
      65,
      33
    );

    doc.text(
      `Relatives: ${this.totalRelatives}`,
      115,
      33
    );

    doc.text(
      `Visited: ${this.totalVisited}`,
      175,
      33
    );

    doc.text(
      `Not Visited: ${this.totalNotVisited}`,
      225,
      33
    );


    // ===================================================
    // PDF TABLE DATA
    // ===================================================

    const tableData =
      usersToExport.map(
        user => ([

          user.id,

          `${user.firstName} ${user.secondName} ${user.lastName}`,

          user.patientNumber || '-',

          user.ward || '-',

          user.type,

          user.patientName || '-',

          user.visited
            ? 'Visited'
            : 'Not Visited',

          user.visitDate
            ? new Date(
                user.visitDate
              ).toLocaleDateString()
            : '-'

        ])
      );


    // ===================================================
    // PDF TABLE
    // ===================================================

    autoTable(
      doc,
      {

        startY: 40,

        head: [[

          'ID',

          'Full Name',

          'Patient Number',

          'Ward',

          'Type',

          'Patient Name',

          'Status',

          'Visit Date'

        ]],

        body: tableData,

        theme: 'grid',

        styles: {

          fontSize: 7,

          cellPadding: 2.5,

          valign: 'middle'

        },

        headStyles: {

          fillColor: [
            70,
            130,
            180
          ],

          textColor: [
            255,
            255,
            255
          ],

          fontStyle: 'bold',

          fontSize: 7

        },

        alternateRowStyles: {

          fillColor: [
            240,
            248,
            252
          ]

        },

        columnStyles: {

          0: {
            cellWidth: 12
          },

          1: {
            cellWidth: 48
          },

          2: {
            cellWidth: 32
          },

          3: {
            cellWidth: 30
          },

          4: {
            cellWidth: 22
          },

          5: {
            cellWidth: 48
          },

          6: {
            cellWidth: 28
          },

          7: {
            cellWidth: 25
          }

        }

      }
    );


    // ===================================================
    // SAVE PDF
    // ===================================================

    doc.save(
      'FollowUp-Report.pdf'
    );

  }


  // =====================================================
  // PRINT
  // =====================================================

  printReport(): void {

    window.print();

  }

}