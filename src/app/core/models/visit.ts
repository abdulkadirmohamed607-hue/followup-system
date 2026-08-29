export type VisitSession = 'Day' | 'Evening';

export interface Visit {
  id: number;

  patientId: number;

  patientNumber: string;

  patientName: string;

  ward: string;

  visitorFirstName: string;

  visitorSecondName: string;

  visitorLastName: string;

  visitorPhone: string;

  session: VisitSession;

  slot: 1 | 2;

  visitDate: string;

  checkIn: string;

  checkOut: string | null;

  durationMinutes: number | null;

  status: 'Checked In' | 'Completed';
}