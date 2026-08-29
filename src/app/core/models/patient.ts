export interface Patient {
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