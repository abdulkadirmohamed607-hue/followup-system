import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

import {
  User,
  UserService
} from '../../../shared/services/user.service';

@Component({
  selector: 'app-user-upload',
  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './user-upload.html',
  styleUrl: './user-upload.css'
})
export class UserUpload {

  selectedFile: File | null = null;

  users: User[] = [];

  message = '';

  errorMessage = '';

  isReading = false;

  isUploading = false;

  constructor(
    private userService: UserService
  ) {}

  onFileSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }

    this.selectedFile = input.files[0];

    this.message = '';
    this.errorMessage = '';
    this.users = [];

    this.readExcelFile(
      this.selectedFile
    );

  }

  readExcelFile(file: File): void {

    this.isReading = true;

    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {

      try {

        const result = event.target?.result;

        if (!result) {
          throw new Error('Unable to read file.');
        }

        const data =
          new Uint8Array(result as ArrayBuffer);

        const workbook =
          XLSX.read(
            data,
            {
              type: 'array'
            }
          );

        if (workbook.SheetNames.length === 0) {

          throw new Error(
            'Excel file contains no worksheet.'
          );

        }

        const sheetName =
          workbook.SheetNames[0];

        const worksheet =
          workbook.Sheets[sheetName];

        const excelData =
          XLSX.utils.sheet_to_json<any>(
            worksheet,
            {
              defval: ''
            }
          );

        if (excelData.length === 0) {

          throw new Error(
            'Excel file contains no data.'
          );

        }

        const requiredColumns = [
          'First Name',
          'Second Name',
          'Last Name',
          'Type',
          'Patient Name',
          'Patient Number',
          'Ward'
        ];

        const firstRow =
          excelData[0];

        const missingColumns =
          requiredColumns.filter(
            column =>
              !(column in firstRow)
          );

        if (missingColumns.length > 0) {

          throw new Error(
            `Missing columns: ${missingColumns.join(', ')}`
          );

        }

        const parsedUsers: User[] = [];

        const errors: string[] = [];

        excelData.forEach(
          (row: any, index: number) => {

            const rowNumber = index + 2;

            const firstName =
              String(
                row['First Name'] ?? ''
              ).trim();

            const secondName =
              String(
                row['Second Name'] ?? ''
              ).trim();

            const lastName =
              String(
                row['Last Name'] ?? ''
              ).trim();

            const typeValue =
              String(
                row['Type'] ?? ''
              ).trim();

            const patientName =
              String(
                row['Patient Name'] ?? ''
              ).trim();

            const patientNumber =
              String(
                row['Patient Number'] ?? ''
              ).trim();

            const ward =
              String(
                row['Ward'] ?? ''
              ).trim();

            if (
              !firstName ||
              !secondName ||
              !lastName
            ) {

              errors.push(
                `Row ${rowNumber}: Name fields are required.`
              );

              return;

            }

            if (
              typeValue !== 'Patient' &&
              typeValue !== 'Relative'
            ) {

              errors.push(
                `Row ${rowNumber}: Type must be Patient or Relative.`
              );

              return;

            }

            if (!patientNumber) {

              errors.push(
                `Row ${rowNumber}: Patient Number is required.`
              );

              return;

            }

            if (!ward) {

              errors.push(
                `Row ${rowNumber}: Ward is required.`
              );

              return;

            }

            if (
              typeValue === 'Relative' &&
              !patientName
            ) {

              errors.push(
                `Row ${rowNumber}: Patient Name is required for Relative.`
              );

              return;

            }

            parsedUsers.push({

              id:
                Date.now() +
                index +
                Math.floor(
                  Math.random() * 1000
                ),

              firstName,

              secondName,

              lastName,

              type:
                typeValue === 'Relative'
                  ? 'Relative'
                  : 'Patient',

              patientName:
                patientName || '-',

              patientNumber,

              ward,

              visited: false,

              visitDate: null

            });

          }
        );

        if (errors.length > 0) {

          this.errorMessage =
            errors.slice(0, 10).join('\n');

          if (errors.length > 10) {

            this.errorMessage +=
              `\n...and ${errors.length - 10} more errors.`;

          }

        }

        this.users = parsedUsers;

        if (this.users.length > 0) {

          this.message =
            `${this.users.length} valid users loaded.`;

        }

      }

      catch (error: any) {

        this.users = [];

        this.errorMessage =
          error?.message ||
          'Failed to read Excel file.';

      }

      finally {

        this.isReading = false;

      }

    };

    reader.onerror = () => {

      this.isReading = false;

      this.errorMessage =
        'Failed to read the selected file.';

    };

    reader.readAsArrayBuffer(file);

  }

  uploadUsers(): void {

    if (this.users.length === 0) {

      this.errorMessage =
        'No valid users available to upload.';

      return;

    }

    this.isUploading = true;

    setTimeout(() => {

      this.userService.addUsers(
        this.users
      );

      this.message =
        `${this.users.length} users uploaded successfully.`;

      this.errorMessage = '';

      this.users = [];

      this.selectedFile = null;

      this.isUploading = false;

    }, 300);

  }

  clearData(): void {

    this.selectedFile = null;

    this.users = [];

    this.message = '';

    this.errorMessage = '';

    this.isReading = false;

    this.isUploading = false;

  }

}