
import {
  ChangeDetectorRef,
  Component
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import * as XLSX from 'xlsx';

import {
  PatientService
} from '../../../core/services/patient.service';

import {
  Patient
} from '../../../core/models/patient';


@Component({
  selector: 'app-user-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './user-upload.html',
  styleUrls: ['./user-upload.css']
})
export class UserUploadComponent {

  // =========================================================
  // FILE / READING STATE
  // =========================================================

  isReading = false;

  isReadingExcel = false;

  isUploading = false;

  selectedFile: File | null = null;


  // =========================================================
  // MESSAGES
  // =========================================================

  message = '';

  successMessage = '';

  errorMessage = '';

  warningMessage = '';


  // =========================================================
  // PATIENT DATA
  // =========================================================

  patients: Patient[] = [];

  duplicateCount = 0;


  // =========================================================
  // COUNTERS
  // =========================================================

  totalRows = 0;

  validRows = 0;

  createdRows = 0;

  skippedExistingRows = 0;


  // =========================================================
  // UPLOAD PROGRESS
  // =========================================================

  uploadProgress = 0;


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef
  ) {}


  // =========================================================
  // FILE SELECTED
  // =========================================================

  onFileSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;


    // -------------------------------------------------------
    // CHECK FILE
    // -------------------------------------------------------

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }


    const file =
      input.files[0];


    this.selectedFile = file;


    // -------------------------------------------------------
    // RESET DATA
    // -------------------------------------------------------

    this.patients = [];

    this.totalRows = 0;

    this.validRows = 0;

    this.duplicateCount = 0;

    this.createdRows = 0;

    this.skippedExistingRows = 0;

    this.uploadProgress = 0;


    this.resetAllMessages();


    // -------------------------------------------------------
    // START READING
    // -------------------------------------------------------

    this.isReading = true;

    this.isReadingExcel = true;

    this.message = '';


    // -------------------------------------------------------
    // FORCE UI UPDATE
    // -------------------------------------------------------

    this.cdr.detectChanges();


    // -------------------------------------------------------
    // FILE READER
    // -------------------------------------------------------

    const reader =
      new FileReader();


    // =======================================================
    // FILE READER SUCCESS
    // =======================================================

    reader.onload =
      (event: ProgressEvent<FileReader>) => {

        try {

          console.log(
            '=========================================='
          );

          console.log(
            'EXCEL FILE READER FINISHED'
          );

          console.log(
            'File:',
            file.name
          );

          console.log(
            'Size:',
            file.size,
            'bytes'
          );

          console.log(
            '=========================================='
          );


          // -------------------------------------------------
          // GET FILE RESULT
          // -------------------------------------------------

          const result =
            event.target?.result;


          if (!result) {

            throw new Error(
              'Unable to read the Excel file.'
            );

          }


          console.log(
            'Starting XLSX.read()...'
          );


          // -------------------------------------------------
          // READ EXCEL
          // -------------------------------------------------

          const workbook =
            XLSX.read(
              result,
              {
                type: 'array',
                dense: true,
                cellDates: false
              }
            );


          console.log(
            'XLSX.read() completed.'
          );


          // -------------------------------------------------
          // CHECK WORKSHEET
          // -------------------------------------------------

          if (
            !workbook.SheetNames ||
            workbook.SheetNames.length === 0
          ) {

            throw new Error(
              'The Excel file has no worksheet.'
            );

          }


          const sheetName =
            workbook.SheetNames[0];


          console.log(
            'Worksheet:',
            sheetName
          );


          const worksheet =
            workbook.Sheets[sheetName];


          if (!worksheet) {

            throw new Error(
              'Unable to open the first worksheet.'
            );

          }


          // -------------------------------------------------
          // CONVERT WORKSHEET TO JSON
          // -------------------------------------------------

          console.log(
            'Converting worksheet to rows...'
          );


          const rows =
            XLSX.utils.sheet_to_json<any>(
              worksheet,
              {
                defval: '',
                raw: true
              }
            );


          console.log(
            'Rows found:',
            rows.length
          );


          this.totalRows =
            rows.length;


          // -------------------------------------------------
          // CHECK EMPTY FILE
          // -------------------------------------------------

          if (
            rows.length === 0
          ) {

            throw new Error(
              'The Excel file is empty.'
            );

          }


          // -------------------------------------------------
          // REQUIRED HEADERS
          // -------------------------------------------------

          const requiredHeaders = [
            'Patient Name',
            'Patient Number',
            'Gender',
            'Ward',
            'Date Admitted'
          ];


          const actualHeaders =
            Object.keys(rows[0]);


          console.log(
            'Excel headers:',
            actualHeaders
          );


          const missingHeaders =
            requiredHeaders.filter(
              header =>
                !actualHeaders.includes(header)
            );


          if (
            missingHeaders.length > 0
          ) {

            throw new Error(
              'Missing Excel columns: ' +
              missingHeaders.join(', ')
            );

          }


          // -------------------------------------------------
          // PROCESS PATIENT ROWS
          // -------------------------------------------------

          console.log(
            'Processing patient rows...'
          );


          this.processRows(rows);


          console.log(
            'Patient processing completed.'
          );


          console.log(
            'Valid patients:',
            this.patients.length
          );


          console.log(
            'Duplicate patients:',
            this.duplicateCount
          );


          // -------------------------------------------------
          // PREVIEW MESSAGE
          // -------------------------------------------------

          if (
            this.patients.length > 0
          ) {

            this.message =
              `${this.patients.length} patient(s) ready for upload.`;

          } else {

            this.message =
              'No valid patients found in the Excel file.';

          }


        } catch (error: any) {

          console.error(
            '=========================================='
          );

          console.error(
            'EXCEL PROCESSING ERROR'
          );

          console.error(
            error
          );

          console.error(
            '=========================================='
          );


          this.errorMessage =
            error?.message ||
            'Failed to process Excel file.';


          this.message = '';

        }


        // ---------------------------------------------------
        // STOP READING
        // ---------------------------------------------------

        this.isReading = false;

        this.isReadingExcel = false;


        // ---------------------------------------------------
        // FORCE ANGULAR UI UPDATE
        // ---------------------------------------------------

        this.cdr.detectChanges();


        console.log(
          'Excel reading state:',
          this.isReading
        );

      };


    // =======================================================
    // FILE READER ERROR
    // =======================================================

    reader.onerror =
      (event) => {

        console.error(
          'FileReader error:',
          event
        );


        this.errorMessage =
          'Failed to read the selected Excel file.';


        this.message = '';


        this.isReading = false;

        this.isReadingExcel = false;


        this.cdr.detectChanges();

      };


    // =======================================================
    // FILE READER ABORT
    // =======================================================

    reader.onabort =
      () => {

        console.error(
          'Excel file reading was aborted.'
        );


        this.errorMessage =
          'Excel file reading was cancelled.';


        this.message = '';


        this.isReading = false;

        this.isReadingExcel = false;


        this.cdr.detectChanges();

      };


    // =======================================================
    // START FILE READING
    // =======================================================

    console.log(
      'Starting FileReader...'
    );


    reader.readAsArrayBuffer(
      file
    );

  }


  // =========================================================
  // PROCESS EXCEL ROWS
  // =========================================================

  private processRows(
    rows: any[]
  ): void {

    const excelNumbers =
      new Set<string>();


    const validPatients:
      Patient[] = [];


    let duplicates = 0;


    // -------------------------------------------------------
    // LOOP THROUGH EXCEL ROWS
    // -------------------------------------------------------

    for (
      let index = 0;
      index < rows.length;
      index++
    ) {

      const row =
        rows[index];


      // -----------------------------------------------------
      // PATIENT NAME
      // -----------------------------------------------------

      const patientName =
        String(
          row['Patient Name'] ?? ''
        ).trim();


      // -----------------------------------------------------
      // PATIENT NUMBER
      // -----------------------------------------------------

      const patientNumber =
        String(
          row['Patient Number'] ?? ''
        )
        .trim()
        .toUpperCase();


      // -----------------------------------------------------
      // GENDER
      // -----------------------------------------------------

      const gender =
        String(
          row['Gender'] ?? ''
        ).trim();


      // -----------------------------------------------------
      // WARD
      // -----------------------------------------------------

      const ward =
        String(
          row['Ward'] ?? ''
        ).trim();


      // -----------------------------------------------------
      // DATE ADMITTED
      // -----------------------------------------------------

      const rawDate =
        row['Date Admitted'];


      // -----------------------------------------------------
      // IGNORE COMPLETELY EMPTY ROW
      // -----------------------------------------------------

      if (
        !patientName &&
        !patientNumber &&
        !gender &&
        !ward &&
        !rawDate
      ) {

        continue;

      }


      // -----------------------------------------------------
      // VALIDATE PATIENT NAME
      // -----------------------------------------------------

      if (!patientName) {

        throw new Error(
          `Row ${index + 2}: Patient Name is required.`
        );

      }


      // -----------------------------------------------------
      // VALIDATE PATIENT NUMBER
      // -----------------------------------------------------

      if (!patientNumber) {

        throw new Error(
          `Row ${index + 2}: Patient Number is required.`
        );

      }


      // -----------------------------------------------------
      // VALIDATE WARD
      // -----------------------------------------------------

      if (!ward) {

        throw new Error(
          `Row ${index + 2}: Ward is required.`
        );

      }


      // -----------------------------------------------------
      // VALIDATE ADMISSION DATE
      // -----------------------------------------------------

      if (
        rawDate === undefined ||
        rawDate === null ||
        String(rawDate).trim() === ''
      ) {

        throw new Error(
          `Row ${index + 2}: Date Admitted is required.`
        );

      }


      // -----------------------------------------------------
      // DUPLICATE INSIDE EXCEL
      // -----------------------------------------------------

      if (
        excelNumbers.has(
          patientNumber
        )
      ) {

        duplicates++;

        continue;

      }


      excelNumbers.add(
        patientNumber
      );


      // -----------------------------------------------------
      // NORMALIZE DATE
      // -----------------------------------------------------

      const admissionDate =
        this.normalizeDate(
          rawDate
        );


      // -----------------------------------------------------
      // SPLIT PATIENT NAME
      // -----------------------------------------------------

      const names =
        this.parsePatientName(
          patientName
        );


      // -----------------------------------------------------
      // CREATE PATIENT
      // -----------------------------------------------------

      validPatients.push({

        id: 0,

        firstName:
          names.firstName,

        secondName:
          names.secondName,

        lastName:
          names.lastName,

        patientNumber:
          patientNumber,

        gender:
          gender,

        ward:
          ward,

        admissionDate:
          admissionDate,

        status:
          'Admitted',

        createdAt:
          ''

      });

    }


    // -------------------------------------------------------
    // UPDATE DATA
    // -------------------------------------------------------

    this.patients =
      validPatients;


    this.validRows =
      validPatients.length;


    this.duplicateCount =
      duplicates;


    // -------------------------------------------------------
    // DUPLICATE WARNING
    // -------------------------------------------------------

    if (
      duplicates > 0
    ) {

      this.warningMessage =
        `${duplicates} duplicate patient(s) inside the Excel file were skipped.`;

    } else {

      this.warningMessage = '';

    }

  }


  // =========================================================
  // PARSE PATIENT NAME
  // =========================================================

  private parsePatientName(
    fullName: string
  ): {
    firstName: string;
    secondName: string;
    lastName: string;
  } {

    const parts =
      fullName
        .trim()
        .split(/\s+/)
        .filter(
          part =>
            part.length > 0
        );


    // -------------------------------------------------------
    // NO NAME
    // -------------------------------------------------------

    if (
      parts.length === 0
    ) {

      return {

        firstName: '',

        secondName: '-',

        lastName: ''

      };

    }


    // -------------------------------------------------------
    // ONE NAME
    // -------------------------------------------------------

    if (
      parts.length === 1
    ) {

      return {

        firstName:
          parts[0],

        secondName:
          '-',

        lastName:
          parts[0]

      };

    }


    // -------------------------------------------------------
    // TWO NAMES
    // -------------------------------------------------------

    if (
      parts.length === 2
    ) {

      return {

        firstName:
          parts[0],

        secondName:
          '-',

        lastName:
          parts[1]

      };

    }


    // -------------------------------------------------------
    // THREE OR MORE NAMES
    // -------------------------------------------------------

    return {

      firstName:
        parts[0],

      secondName:
        parts
          .slice(1, -1)
          .join(' '),

      lastName:
        parts[
          parts.length - 1
        ]

    };

  }


  // =========================================================
  // NORMALIZE DATE
  // =========================================================

  private normalizeDate(
    value: any
  ): string {

    // -------------------------------------------------------
    // JAVASCRIPT DATE
    // -------------------------------------------------------

    if (
      value instanceof Date
    ) {

      if (
        !isNaN(
          value.getTime()
        )
      ) {

        return [

          value.getFullYear(),

          String(
            value.getMonth() + 1
          ).padStart(
            2,
            '0'
          ),

          String(
            value.getDate()
          ).padStart(
            2,
            '0'
          )

        ].join('-');

      }

    }


    // -------------------------------------------------------
    // EXCEL SERIAL NUMBER
    // -------------------------------------------------------

    if (
      typeof value === 'number' &&
      isFinite(value)
    ) {

      const date =
        XLSX.SSF.parse_date_code(
          value
        );


      if (date) {

        return this.buildDateString(

          date.y,

          date.m,

          date.d

        );

      }

    }


    // -------------------------------------------------------
    // STRING VALUE
    // -------------------------------------------------------

    const stringValue =
      String(
        value ?? ''
      ).trim();


    if (!stringValue) {

      throw new Error(
        'Admission date is required.'
      );

    }


    // -------------------------------------------------------
    // STRING THAT IS ACTUALLY AN EXCEL SERIAL
    // -------------------------------------------------------

    const numericValue =
      Number(
        stringValue
      );


    if (
      isFinite(numericValue) &&
      numericValue > 1
    ) {

      const date =
        XLSX.SSF.parse_date_code(
          numericValue
        );


      if (date) {

        return this.buildDateString(

          date.y,

          date.m,

          date.d

        );

      }

    }


    // -------------------------------------------------------
    // YYYY-MM-DD
    // -------------------------------------------------------

    const simpleDateMatch =
      stringValue.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );


    if (
      simpleDateMatch
    ) {

      return (

        `${simpleDateMatch[1]}-` +

        `${simpleDateMatch[2]}-` +

        `${simpleDateMatch[3]}`

      );

    }


    // -------------------------------------------------------
    // DD/MM/YYYY
    // -------------------------------------------------------

    const slashDateMatch =
      stringValue.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      );


    if (
      slashDateMatch
    ) {

      const day =
        slashDateMatch[1];


      const month =
        slashDateMatch[2];


      const year =
        slashDateMatch[3];


      return [

        year,

        month.padStart(
          2,
          '0'
        ),

        day.padStart(
          2,
          '0'
        )

      ].join('-');

    }


    // -------------------------------------------------------
    // GENERAL DATE PARSER
    // -------------------------------------------------------

    const parsed =
      new Date(
        stringValue
      );


    if (
      !isNaN(
        parsed.getTime()
      )
    ) {

      return [

        parsed.getFullYear(),

        String(
          parsed.getMonth() + 1
        ).padStart(
          2,
          '0'
        ),

        String(
          parsed.getDate()
        ).padStart(
          2,
          '0'
        )

      ].join('-');

    }


    // -------------------------------------------------------
    // INVALID DATE
    // -------------------------------------------------------

    throw new Error(
      `Invalid admission date "${stringValue}".`
    );

  }


  // =========================================================
  // BUILD DATE STRING
  // =========================================================

  private buildDateString(
    year: number,
    month: number,
    day: number
  ): string {

    return [

      year,

      String(
        month
      ).padStart(
        2,
        '0'
      ),

      String(
        day
      ).padStart(
        2,
        '0'
      )

    ].join('-');

  }


  // =========================================================
  // UPLOAD PATIENTS
  // =========================================================

  uploadPatients(): void {

    // -------------------------------------------------------
    // CHECK PATIENTS
    // -------------------------------------------------------

    if (
      this.patients.length === 0
    ) {

      this.message =
        'There are no valid patients to upload.';

      this.cdr.detectChanges();

      return;

    }


    // -------------------------------------------------------
    // PREVENT DOUBLE UPLOAD
    // -------------------------------------------------------

    if (
      this.isUploading
    ) {

      return;

    }


    // -------------------------------------------------------
    // RESET MESSAGES
    // -------------------------------------------------------

    this.resetAllMessages();


    // -------------------------------------------------------
    // START UPLOAD
    // -------------------------------------------------------

    this.isUploading = true;

    this.uploadProgress = 10;


    // -------------------------------------------------------
    // PREPARE API DATA
    // -------------------------------------------------------

    const uploadData =
      this.patients.map(
        patient => ({

          firstName:
            patient.firstName,

          secondName:
            patient.secondName,

          lastName:
            patient.lastName,

          patientNumber:
            patient.patientNumber,

          gender:
            patient.gender || '',

          ward:
            patient.ward,

          admissionDate:
            patient.admissionDate,

          status:
            patient.status

        })
      );


    console.log(
      'Uploading patients:',
      uploadData.length
    );


    this.uploadProgress = 40;


    // -------------------------------------------------------
    // BULK UPLOAD
    // -------------------------------------------------------

    this.patientService
      .addPatientsBulk(
        uploadData
      )
      .subscribe({

        // ===================================================
        // SUCCESS / COMPLETED REQUEST
        // ===================================================

        next: response => {

          console.log(
            'Bulk upload response:',
            response
          );


          this.uploadProgress = 100;


          this.createdRows =
            Number(
              response.created_count || 0
            );


          this.skippedExistingRows =
            Number(
              response.skipped_existing_count || 0
            );


          this.isUploading = false;


          // =================================================
          // CASE 1:
          // NEW PATIENTS CREATED
          // =================================================

          if (
            this.createdRows > 0
          ) {

            this.message =
              `Upload completed successfully. ` +
              `${this.createdRows} patient(s) created.`;

            this.successMessage =
              this.message;

          }


          // =================================================
          // CASE 2:
          // NOTHING NEW WAS CREATED
          // =================================================

          else {

            this.message =
              'No new patients were added.';

            this.successMessage = '';

          }


          // =================================================
          // EXISTING PATIENTS
          // =================================================

          if (
            this.skippedExistingRows > 0
          ) {

            this.warningMessage =
              `${this.skippedExistingRows} patient(s) already exist in the database and were skipped.`;

          }


          // =================================================
          // DUPLICATES INSIDE EXCEL
          // =================================================

          const skippedDuplicateFileCount =
            Number(
              response.skipped_duplicate_file_count || 0
            );


          if (
            skippedDuplicateFileCount > 0
          ) {

            const duplicateMessage =
              `${skippedDuplicateFileCount} duplicate(s) inside the Excel file were skipped.`;


            if (
              this.warningMessage
            ) {

              this.warningMessage +=
                ` ${duplicateMessage}`;

            } else {

              this.warningMessage =
                duplicateMessage;

            }

          }


          // =================================================
          // IF NOTHING WAS CREATED
          // =================================================

          if (
            this.createdRows === 0 &&
            this.skippedExistingRows === 0 &&
            skippedDuplicateFileCount === 0
          ) {

            this.warningMessage =
              'No new patients were created from this upload.';

          }


          // =================================================
          // CLEAR PREVIEW
          // =================================================

          this.patients = [];

          this.selectedFile = null;


          // =================================================
          // UPDATE UI
          // =================================================

          this.cdr.detectChanges();

        },


        // ===================================================
        // ERROR
        // ===================================================

        error: error => {

          console.error(
            'Bulk upload failed:',
            error
          );


          this.uploadProgress = 0;

          this.isUploading = false;


          this.errorMessage =
            this.getBackendErrorMessage(
              error
            );


          this.message = '';


          this.cdr.detectChanges();

        }

      });

  }


  // =========================================================
  // CLEAR DATA
  // =========================================================

  clearData(): void {

    this.selectedFile = null;

    this.patients = [];

    this.totalRows = 0;

    this.validRows = 0;

    this.duplicateCount = 0;

    this.createdRows = 0;

    this.skippedExistingRows = 0;

    this.uploadProgress = 0;

    this.isReading = false;

    this.isReadingExcel = false;

    this.isUploading = false;


    this.resetAllMessages();


    this.cdr.detectChanges();

  }


  // =========================================================
  // RESET ALL MESSAGES
  // =========================================================

  private resetAllMessages(): void {

    this.message = '';

    this.successMessage = '';

    this.errorMessage = '';

    this.warningMessage = '';

  }


  // =========================================================
  // BACKEND ERROR MESSAGE
  // =========================================================

  private getBackendErrorMessage(
    error: any
  ): string {

    const backendError =
      error?.error;


    // -------------------------------------------------------
    // STRING ERROR
    // -------------------------------------------------------

    if (
      typeof backendError === 'string'
    ) {

      return backendError;

    }


    // -------------------------------------------------------
    // OBJECT ERROR
    // -------------------------------------------------------

    if (
      backendError &&
      typeof backendError === 'object'
    ) {

      const messages:
        string[] = [];


      // -----------------------------------------------------
      // DETAIL
      // -----------------------------------------------------

      if (
        backendError.detail
      ) {

        messages.push(
          String(
            backendError.detail
          )
        );

      }


      // -----------------------------------------------------
      // ERROR
      // -----------------------------------------------------

      if (
        backendError.error
      ) {

        messages.push(
          String(
            backendError.error
          )
        );

      }


      // -----------------------------------------------------
      // VALIDATION ERRORS
      // -----------------------------------------------------

      if (
        Array.isArray(
          backendError.errors
        )
      ) {

        backendError.errors.forEach(
          (item: any) => {

            messages.push(

              `Row ${item.row}: ` +

              JSON.stringify(
                item.errors
              )

            );

          }
        );

      }


      // -----------------------------------------------------
      // OTHER BACKEND FIELDS
      // -----------------------------------------------------

      Object.keys(
        backendError
      ).forEach(
        field => {

          if (
            field === 'detail' ||
            field === 'error' ||
            field === 'errors'
          ) {

            return;

          }


          const value =
            backendError[field];


          if (
            Array.isArray(value)
          ) {

            value.forEach(
              item => {

                messages.push(

                  `${field}: ${String(item)}`

                );

              }
            );

          } else {

            messages.push(

              `${field}: ${String(value)}`

            );

          }

        }
      );


      if (
        messages.length > 0
      ) {

        return messages.join(
          ' | '
        );

      }

    }


    // -------------------------------------------------------
    // DEFAULT ERROR
    // -------------------------------------------------------

    return (

      'Patient upload failed. ' +

      'Please check the Excel data and try again.'

    );

  }

}


// ===========================================================
// EXPORT ALIAS
// ===========================================================

export {
  UserUploadComponent as UserUpload
};