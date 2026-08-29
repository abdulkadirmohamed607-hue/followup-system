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


  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef
  ) {}


  // =====================================================
  // FILE SELECT
  // =====================================================

  onFileSelected(
    event: Event
  ): void {

    this.message = '';

    this.errorMessage = '';

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


    reader.onload = (
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


        if (rows.length === 0) {

          throw new Error(
            'The Excel sheet is empty.'
          );

        }


        const importedPatients:
          Patient[] = [];


        rows.forEach(
          (row: any, index: number) => {

            const firstName =
              this.getValue(
                row,
                [
                  'First Name',
                  'firstName',
                  'FirstName'
                ]
              );

            const secondName =
              this.getValue(
                row,
                [
                  'Second Name',
                  'secondName',
                  'SecondName',
                  'Middle Name'
                ]
              );

            const lastName =
              this.getValue(
                row,
                [
                  'Last Name',
                  'lastName',
                  'LastName'
                ]
              );

            const patientNumber =
              this.getValue(
                row,
                [
                  'Patient Number',
                  'patientNumber',
                  'PatientNumber'
                ]
              );

            const ward =
              this.getValue(
                row,
                [
                  'Ward',
                  'ward'
                ]
              );

            const admissionDate =
              this.getValue(
                row,
                [
                  'Admission Date',
                  'admissionDate',
                  'AdmissionDate'
                ]
              );


            if (
              !firstName ||
              !secondName ||
              !lastName ||
              !patientNumber ||
              !ward
            ) {

              throw new Error(
                `Row ${index + 2} is missing required patient information.`
              );

            }


            importedPatients.push({

              id:
                this.patientService.generateId()
                + index,

              firstName,

              secondName,

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

        this.message =
          `${this.patients.length} patient(s) loaded successfully. Review the preview before uploading.`;

      } catch (error: any) {

        this.patients = [];

        this.errorMessage =
          error?.message ||
          'Failed to read Excel file.';

      } finally {

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

    for (const key of keys) {

      if (
        row[key] !== undefined &&
        row[key] !== null
      ) {

        return String(
          row[key]
        ).trim();

      }

    }

    return '';

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
          String(date.m).padStart(2, '0'),
          String(date.d).padStart(2, '0')
        ].join('-');

      }

    }


    const parsed =
      new Date(value);

    if (!isNaN(
      parsed.getTime()
    )) {

      return parsed
        .toISOString()
        .split('T')[0];

    }


    return String(value);

  }


  // =====================================================
  // UPLOAD
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

      this.patientService.addPatients(
        this.patients
      );

      this.message =
        `${this.patients.length} patient(s) uploaded successfully.`;

      this.patients = [];

      this.selectedFile = null;

    } catch {

      this.errorMessage =
        'Failed to upload patients.';

    } finally {

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

    this.isReading = false;

    this.isUploading = false;

    this.cdr.detectChanges();

  }

}