import {
  Component,
  ChangeDetectorRef
} from '@angular/core';

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

  // =====================================================
  // VARIABLES
  // =====================================================

  selectedFile: File | null = null;

  users: User[] = [];

  message = '';

  errorMessage = '';

  isReading = false;

  isUploading = false;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}


  // =====================================================
  // FILE SELECTED
  // =====================================================

  onFileSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;


    if (
      !input.files ||
      input.files.length === 0
    ) {

      return;

    }


    const file =
      input.files[0];


    console.log('=================================');

    console.log(
      'FILE SELECTED'
    );

    console.log(
      'Name:',
      file.name
    );

    console.log(
      'Size:',
      file.size
    );

    console.log(
      'Type:',
      file.type
    );

    console.log('=================================');


    this.selectedFile =
      file;

    this.users =
      [];

    this.message =
      '';

    this.errorMessage =
      '';


    this.readExcelFile(
      file
    );

  }


  // =====================================================
  // READ EXCEL FILE
  // =====================================================

  readExcelFile(
    file: File
  ): void {


    // Prevent double processing

    if (this.isReading) {

      return;

    }


    this.isReading =
      true;

    this.message =
      '';

    this.errorMessage =
      '';


    // Force UI update

    this.cdr.detectChanges();


    console.log(
      'START READING EXCEL'
    );


    const reader =
      new FileReader();


    // ===================================================
    // FILE READER SUCCESS
    // ===================================================

    reader.onload = (
      event: ProgressEvent<FileReader>
    ) => {


      console.log(
        'FILEREADER ONLOAD'
      );


      try {


        const result =
          event.target?.result;


        // -----------------------------------------------
        // CHECK RESULT
        // -----------------------------------------------

        if (
          !(result instanceof ArrayBuffer)
        ) {

          throw new Error(
            'Unable to read Excel file.'
          );

        }


        console.log(
          'ArrayBuffer size:',
          result.byteLength
        );


        // -----------------------------------------------
        // CONVERT TO UINT8ARRAY
        // -----------------------------------------------

        const data =
          new Uint8Array(
            result
          );


        console.log(
          'Calling XLSX.read...'
        );


        // -----------------------------------------------
        // READ WORKBOOK
        // -----------------------------------------------

        const workbook =
          XLSX.read(
            data,
            {

              type: 'array',

              cellDates: false,

              cellNF: false,

              cellStyles: false,

              sheetRows: 5000

            }
          );


        console.log(
          'XLSX.READ FINISHED'
        );


        // -----------------------------------------------
        // CHECK WORKSHEETS
        // -----------------------------------------------

        if (
          !workbook.SheetNames ||
          workbook.SheetNames.length === 0
        ) {

          throw new Error(
            'Excel file contains no worksheet.'
          );

        }


        const sheetName =
          workbook.SheetNames[0];


        console.log(
          'Worksheet:',
          sheetName
        );


        const worksheet =
          workbook.Sheets[
            sheetName
          ];


        if (!worksheet) {

          throw new Error(
            'Unable to open worksheet.'
          );

        }


        // -----------------------------------------------
        // CONVERT EXCEL TO JSON
        // -----------------------------------------------

        const excelData =
          XLSX.utils.sheet_to_json<any>(
            worksheet,
            {

              defval: '',

              raw: false

            }
          );


        console.log(
          'Excel rows:',
          excelData.length
        );


        if (
          excelData.length === 0
        ) {

          throw new Error(
            'Excel file contains no data.'
          );

        }


        // =================================================
        // REQUIRED COLUMNS
        // =================================================

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


        if (
          missingColumns.length > 0
        ) {

          throw new Error(
            'Missing columns: ' +
            missingColumns.join(', ')
          );

        }


        // =================================================
        // PARSE USERS
        // =================================================

        const parsedUsers: User[] =
          [];

        const errors: string[] =
          [];


        excelData.forEach(
          (
            row: any,
            index: number
          ) => {


            const rowNumber =
              index + 2;


            // ---------------------------------------------
            // READ VALUES
            // ---------------------------------------------

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


            // ---------------------------------------------
            // VALIDATE NAME
            // ---------------------------------------------

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


            // ---------------------------------------------
            // VALIDATE TYPE
            // ---------------------------------------------

            if (
              typeValue !== 'Patient' &&
              typeValue !== 'Relative'
            ) {

              errors.push(
                `Row ${rowNumber}: Type must be Patient or Relative.`
              );

              return;

            }


            // ---------------------------------------------
            // VALIDATE PATIENT NUMBER
            // ---------------------------------------------

            if (!patientNumber) {

              errors.push(
                `Row ${rowNumber}: Patient Number is required.`
              );

              return;

            }


            // ---------------------------------------------
            // VALIDATE WARD
            // ---------------------------------------------

            if (!ward) {

              errors.push(
                `Row ${rowNumber}: Ward is required.`
              );

              return;

            }


            // ---------------------------------------------
            // VALIDATE RELATIVE
            // ---------------------------------------------

            if (
              typeValue === 'Relative' &&
              !patientName
            ) {

              errors.push(
                `Row ${rowNumber}: Patient Name is required for Relative.`
              );

              return;

            }


            // ---------------------------------------------
            // CREATE USER
            // ---------------------------------------------

            parsedUsers.push({

              id:
                Date.now() +
                index,

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


        // =================================================
        // RESULTS
        // =================================================

        console.log(
          'VALID USERS:',
          parsedUsers.length
        );


        console.log(
          'INVALID ROWS:',
          errors.length
        );


        // -----------------------------------------------
        // SAVE USERS TO COMPONENT
        // -----------------------------------------------

        this.users =
          parsedUsers;


        // -----------------------------------------------
        // SUCCESS MESSAGE
        // -----------------------------------------------

        if (
          parsedUsers.length > 0
        ) {

          this.message =
            `${parsedUsers.length} users loaded successfully.`;

        }


        // -----------------------------------------------
        // ERROR MESSAGE
        // -----------------------------------------------

        if (
          errors.length > 0
        ) {

          this.errorMessage =
            errors
              .slice(0, 10)
              .join('\n');


          if (
            errors.length > 10
          ) {

            this.errorMessage +=
              `\n...and ${
                errors.length - 10
              } more errors.`;

          }

        }


        // -----------------------------------------------
        // NO USERS
        // -----------------------------------------------

        if (
          parsedUsers.length === 0
        ) {

          this.errorMessage =
            'No valid users found in the Excel file.';

        }


      }

      // ==================================================
      // ERROR
      // ==================================================

      catch (
        error: any
      ) {


        console.error(
          'EXCEL ERROR:',
          error
        );


        this.users =
          [];


        this.errorMessage =
          error?.message ||
          'Failed to process Excel file.';

      }


      // ==================================================
      // FINALLY
      // ==================================================

      finally {


        this.isReading =
          false;


        console.log(
          'EXCEL PROCESS FINISHED'
        );


        // VERY IMPORTANT
        // Force Angular to update the UI

        this.cdr.detectChanges();

      }

    };


    // =====================================================
    // FILE READER ERROR
    // =====================================================

    reader.onerror =
      () => {


        console.error(
          'FILE READER ERROR'
        );


        this.isReading =
          false;


        this.errorMessage =
          'Failed to read the selected Excel file.';


        // Force UI update

        this.cdr.detectChanges();

      };


    // =====================================================
    // START READING
    // =====================================================

    reader.readAsArrayBuffer(
      file
    );

  }


  // =====================================================
  // UPLOAD USERS
  // =====================================================

  uploadUsers(): void {


    if (
      this.isUploading ||
      this.users.length === 0
    ) {

      return;

    }


    this.isUploading =
      true;


    this.message =
      '';


    this.errorMessage =
      '';


    // Force UI update

    this.cdr.detectChanges();


    try {


      // -----------------------------------------------
      // SAVE TO USER SERVICE
      // -----------------------------------------------

      this.userService.addUsers(
        this.users
      );


      const count =
        this.users.length;


      this.message =
        `${count} users uploaded successfully.`;


      // -----------------------------------------------
      // CLEAR PREVIEW
      // -----------------------------------------------

      this.users =
        [];


      this.selectedFile =
        null;


      console.log(
        `${count} users uploaded successfully.`
      );


    }

    catch (
      error
    ) {


      console.error(
        'UPLOAD ERROR:',
        error
      );


      this.errorMessage =
        'Failed to upload users.';

    }

    finally {


      this.isUploading =
        false;


      // Force UI update

      this.cdr.detectChanges();

    }

  }


  // =====================================================
  // CLEAR DATA
  // =====================================================

  clearData(): void {


    this.selectedFile =
      null;


    this.users =
      [];


    this.message =
      '';


    this.errorMessage =
      '';


    this.isReading =
      false;


    this.isUploading =
      false;


    // Force UI update

    this.cdr.detectChanges();

  }

}