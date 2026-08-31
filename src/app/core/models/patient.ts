export interface Patient {
  /**
   * Unique User ID / Patient ID
   *
   * This value must be unique in the system.
   */
  id: number;

  firstName: string;

  secondName: string;

  lastName: string;

  patientNumber: string;

  ward: string;

  admissionDate: string;

  status: 'Admitted' | 'Discharged';

  createdAt: string;
}