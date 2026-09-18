export interface Patient {

  /**
   * Unique User ID / Patient ID
   *
   * PostgreSQL generates this value.
   */
  id: number;

  firstName: string;

  secondName: string;

  lastName: string;

  patientNumber: string;

  /**
   * Patient gender.
   *
   * Optional so existing parts of the application
   * that create Patient objects do not break.
   */
  gender?: string;

  ward: string;

  admissionDate: string;

  status: 'Admitted' | 'Discharged';

  createdAt: string;
}