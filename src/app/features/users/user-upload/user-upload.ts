import {
  ChangeDetectorRef,
  Component
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import * as XLSX from 'xlsx';

import { Patient } from '../../../core/models/patient';

import {
  PatientService
} from '../../../core/services/patient.service';


@Component({

  selector: 'app-user-upload',

  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl: './user-upload.html',

  styleUrl: './user-upload.css'

})
export class UserUpload {


  selectedFile:
    File | null = null;


  patients:
    Patient[] = [];


  isReading =
    false;


  isUploading =
    false;


  message =
    '';


  errorMessage =
    '';


  duplicateCount =
    0;


  constructor(

    private patientService:
      PatientService,

    private cdr:
      ChangeDetectorRef

  ) {}


  // =====================================================
  // FILE SELECT
  // =====================================================

  onFileSelected(
    event: Event
  ): void {

    this.message = '';

    this.errorMessage = '';

    this.duplicateCount = 0;


    const input =
      event.target as HTMLInputElement;


    if (
      !input.files ||
      input.files.length === 0
    ) {

      this.selectedFile = null;

      return;

    }


    this.selectedFile =
      input.files[0];


    this.readExcel();

  }


  // =====================================================
  // READ EXCEL
  // =====================================================

  private readExcel(): void {

    if (!this.selectedFile) {

      return;

    }


    this.isReading = true;

    this.patients = [];


    const reader =
      new FileReader();


    reader.onload =
      (
        event: ProgressEvent<FileReader>
      ) => {

        try {

          const data =
            event.target?.result;


          const workbook =
            XLSX.read(
              data,
              {
                type: 'array'
              }
            );


          const firstSheetName =
            workbook.SheetNames[0];


          if (!firstSheetName) {

            throw new Error(
              'Excel file does not contain a worksheet.'
            );

          }


          const worksheet =
            workbook.Sheets[
              firstSheetName
            ];


          const rows =
            XLSX.utils.sheet_to_json<any>(
              worksheet,
              {
                defval: ''
              }
            );


          if (
            rows.length === 0
          ) {

            throw new Error(
              'The Excel sheet is empty.'
            );

          }


          const importedPatients:
            Patient[] = [];


          const numbersInExcel =
            new Set<string>();


          /*
           * Existing patients.
           */

          const existingPatients =
            this.patientService
              .getPatients();


          const existingNumbers =
            new Set(
              existingPatients.map(
                patient =>
                  this.normalizeText(
                    patient.patientNumber
                  )
              )
            );


          let skippedDuplicates = 0;


          rows.forEach(
            (
              row: any,
              index: number
            ) => {


              // ==========================================
              // PATIENT NUMBER
              // ==========================================

              const patientNumber =
                this.getValue(
                  row,
                  [

                    'Patient Number',

                    'PatientNumber',

                    'patientNumber',

                    'Patient No',

                    'Patient No.',

                    'patient_no',

                    'patient_no.',

                    'Patient ID',

                    'PatientID',

                    'patientId',

                    'ID'

                  ]
                );


              /*
               * Patient Number is mandatory because
               * it is our unique identifier.
               */

              if (!patientNumber) {

                throw new Error(

                  `Row ${index + 2} is missing Patient Number. ` +

                  `Patient Number is required because it is used ` +

                  `to prevent duplicate patients.`

                );

              }


              const normalizedNumber =
                this.normalizeText(
                  patientNumber
                );


              /*
               * Already in localStorage.
               */

              if (
                existingNumbers.has(
                  normalizedNumber
                )
              ) {

                skippedDuplicates++;

                return;

              }


              /*
               * Duplicate inside Excel.
               */

              if (
                numbersInExcel.has(
                  normalizedNumber
                )
              ) {

                skippedDuplicates++;

                return;

              }


              numbersInExcel.add(
                normalizedNumber
              );


              // ==========================================
              // FIRST NAME
              // ==========================================

              const firstName =
                this.getValue(
                  row,
                  [

                    'First Name',

                    'FirstName',

                    'firstName',

                    'First',

                    'first'

                  ]
                );


              // ==========================================
              // SECOND NAME
              // ==========================================

              const secondName =
                this.getValue(
                  row,
                  [

                    'Second Name',

                    'SecondName',

                    'secondName',

                    'Middle Name',

                    'MiddleName',

                    'middleName',

                    'Middle'

                  ]
                );


              // ==========================================
              // LAST NAME
              // ==========================================

              const lastName =
                this.getValue(
                  row,
                  [

                    'Last Name',

                    'LastName',

                    'lastName',

                    'Surname',

                    'surname'

                  ]
                );


              // ==========================================
              // WARD
              // ==========================================

              const ward =
                this.getValue(
                  row,
                  [

                    'Ward',

                    'ward',

                    'Ward Name',

                    'WardName',

                    'wardName'

                  ]
                );


              // ==========================================
              // ADMISSION DATE
              // ==========================================

              const admissionDate =
                this.getValue(
                  row,
                  [

                    'Admission Date',

                    'AdmissionDate',

                    'admissionDate',

                    'Date Admitted',

                    'DateAdmitted',

                    'dateAdmitted'

                  ]
                );


              // ==========================================
              // VALIDATION
              // ==========================================

              if (
                !firstName ||
                !lastName ||
                !ward
              ) {

                throw new Error(

                  `Row ${index + 2} is missing required patient information. ` +

                  `Required fields: First Name, Last Name, ` +

                  `Patient Number and Ward.`

                );

              }


              // ==========================================
              // CREATE PATIENT
              // ==========================================

              importedPatients.push({

                id:
                  this.patientService
                    .generateId()
                  +
                  importedPatients.length,

                firstName,

                secondName:
                  secondName || '-',

                lastName,

                patientNumber,

                ward,

                admissionDate:
                  this.normalizeDate(
                    admissionDate
                  ),

                status:
                  'Admitted',

                createdAt:
                  new Date().toISOString()

              });

            }
          );


          this.patients =
            importedPatients;


          this.duplicateCount =
            skippedDuplicates;


          if (
            this.patients.length === 0
          ) {

            this.message =
              `No new patients found. ${skippedDuplicates} duplicate patient(s) were skipped.`;

          }
          else {

            this.message =
              `${this.patients.length} new patient(s) loaded successfully.` +

              (
                skippedDuplicates > 0
                  ? ` ${skippedDuplicates} duplicate patient(s) were skipped.`
                  : ''
              ) +

              ` Review the preview before uploading.`;

          }


        }
        catch (
          error: any
        ) {

          this.patients = [];

          this.duplicateCount = 0;

          this.errorMessage =
            error?.message ||
            'Failed to read Excel file.';

        }
        finally {

          this.isReading = false;

          this.cdr.detectChanges();

        }

      };


    reader.onerror = () => {

      this.isReading = false;

      this.errorMessage =
        'Unable to read the selected Excel file.';

      this.cdr.detectChanges();

    };


    reader.readAsArrayBuffer(
      this.selectedFile
    );

  }


  // =====================================================
  // GET VALUE
  // =====================================================

  private getValue(
    row: any,
    keys: string[]
  ): string {

    for (
      const key of keys
    ) {

      if (
        row[key] !== undefined &&
        row[key] !== null
      ) {

        const value =
          String(
            row[key]
          ).trim();


        if (value) {

          return value;

        }

      }

    }


    return '';

  }


  // =====================================================
  // NORMALIZE TEXT
  // =====================================================

  private normalizeText(
    value: string
  ): string {

    return value
      .trim()
      .toLowerCase();

  }


  // =====================================================
  // NORMALIZE DATE
  // =====================================================

  private normalizeDate(
    value: any
  ): string {

    if (!value) {

      return new Date()
        .toISOString()
        .split('T')[0];

    }


    /*
     * Excel serial date.
     */

    if (
      typeof value === 'number'
    ) {

      const date =
        XLSX.SSF.parse_date_code(
          value
        );


      if (date) {

        return [

          date.y,

          String(
            date.m
          ).padStart(
            2,
            '0'
          ),

          String(
            date.d
          ).padStart(
            2,
            '0'
          )

        ].join('-');

      }

    }


    /*
     * JavaScript date.
     */

    const parsed =
      new Date(value);


    if (
      !isNaN(
        parsed.getTime()
      )
    ) {

      return parsed
        .toISOString()
        .split('T')[0];

    }


    return String(value);

  }


  // =====================================================
  // UPLOAD PATIENTS
  // =====================================================

  uploadPatients(): void {

    if (
      this.patients.length === 0
    ) {

      return;

    }


    this.isUploading = true;

    this.message = '';

    this.errorMessage = '';


    try {

      const result =
        this.patientService.addPatients(
          this.patients
        );


      this.message =
        `${result.added} patient(s) uploaded successfully.`;


      if (
        result.duplicates > 0
      ) {

        this.message +=
          ` ${result.duplicates} duplicate patient(s) were skipped.`;

      }


      this.patients = [];

      this.selectedFile = null;

      this.duplicateCount = 0;


    }
    catch {

      this.errorMessage =
        'Failed to upload patients.';

    }
    finally {

      this.isUploading = false;

      this.cdr.detectChanges();

    }

  }


  // =====================================================
  // CLEAR
  // =====================================================

  clearData(): void {

    this.selectedFile = null;

    this.patients = [];

    this.message = '';

    this.errorMessage = '';

    this.duplicateCount = 0;

    this.isReading = false;

    this.isUploading = false;


    this.cdr.detectChanges();

  }

}