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

  searchText = '';

  selectedType:
    'All'
    | 'Patient'
    | 'Relative'
    = 'All';

  selectedStatus:
    'All'
    | 'Visited'
    | 'Not Visited'
    = 'All';

  selectedDate = '';

  users: User[] = [];

  constructor(
    private userService: UserService
  ) {
    this.users = this.userService.getUsers();
  }


  // ==========================================
  // SUMMARY
  // ==========================================

  get totalUsers(): number {
    return this.users.length;
  }


  get totalPatients(): number {
    return this.users.filter(
      user => user.type === 'Patient'
    ).length;
  }


  get totalRelatives(): number {
    return this.users.filter(
      user => user.type === 'Relative'
    ).length;
  }


  get totalVisited(): number {
    return this.users.filter(
      user => user.visited
    ).length;
  }


  get totalNotVisited(): number {
    return this.users.filter(
      user => !user.visited
    ).length;
  }


  // ==========================================
  // FILTERED USERS
  // ==========================================

  get filteredUsers(): User[] {

    const search = this.searchText
      .trim()
      .toLowerCase();

    return this.users.filter(
      user => {

        const fullName =
          `${user.firstName} ${user.secondName} ${user.lastName}`
            .toLowerCase();

        const patientNumber =
          (user.patientNumber || '')
            .toLowerCase();

        const ward =
          (user.ward || '')
            .toLowerCase();

        const patientName =
          (user.patientName || '')
            .toLowerCase();


        // Search
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


        // Type
        const matchesType =
          this.selectedType === 'All'
          ||
          user.type === this.selectedType;


        // Status
        const matchesStatus =
          this.selectedStatus === 'All'
          ||
          (
            this.selectedStatus === 'Visited'
            &&
            user.visited
          )
          ||
          (
            this.selectedStatus === 'Not Visited'
            &&
            !user.visited
          );


        // Date
        const matchesDate =
          this.selectedDate === ''
          ||
          user.visitDate === this.selectedDate;


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


  // ==========================================
  // EXPORT EXCEL
  // ==========================================

  exportExcel(): void {

    const reportData =
      this.filteredUsers.map(
        user => ({

          ID:
            user.id,

          'First Name':
            user.firstName,

          'Second Name':
            user.secondName,

          'Last Name':
            user.lastName,

          'Patient Number':
            user.patientNumber || '-',

          Ward:
            user.ward || '-',

          Type:
            user.type,

          Patient:
            user.patientName || '-',

          Status:
            user.visited
              ? 'Visited'
              : 'Not Visited',

          'Visit Date':
            user.visitDate || '-'

        })
      );


    const worksheet =
      XLSX.utils.json_to_sheet(
        reportData
      );


    // Column widths
    worksheet['!cols'] = [

      { wch: 8 },   // ID

      { wch: 18 },  // First Name

      { wch: 18 },  // Second Name

      { wch: 18 },  // Last Name

      { wch: 20 },  // Patient Number

      { wch: 20 },  // Ward

      { wch: 15 },  // Type

      { wch: 25 },  // Patient

      { wch: 15 },  // Status

      { wch: 15 }   // Visit Date

    ];


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'FollowUp Report'
    );


    XLSX.writeFile(
      workbook,
      'FollowUp-Report.xlsx'
    );
  }


  // ==========================================
  // EXPORT PDF
  // ==========================================

  exportPDF(): void {

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });


    // ------------------------------------------
    // TITLE
    // ------------------------------------------

    doc.setFontSize(18);

    doc.setFont('helvetica', 'bold');

    doc.text(
      'FOLLOWUP SYSTEM REPORT',
      14,
      18
    );


    // ------------------------------------------
    // DATE
    // ------------------------------------------

    doc.setFontSize(9);

    doc.setFont('helvetica', 'normal');

    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      14,
      25
    );


    // ------------------------------------------
    // SUMMARY
    // ------------------------------------------

    doc.setFontSize(9);

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


    // ------------------------------------------
    // TABLE DATA
    // ------------------------------------------

    const tableData =
      this.filteredUsers.map(
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

          user.visitDate || '-'

        ])
      );


    // ------------------------------------------
    // PDF TABLE
    // ------------------------------------------

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

          'Patient',

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


    // ------------------------------------------
    // SAVE
    // ------------------------------------------

    doc.save(
      'FollowUp-Report.pdf'
    );
  }


  // ==========================================
  // PRINT
  // ==========================================

  printReport(): void {

    window.print();

  }

}