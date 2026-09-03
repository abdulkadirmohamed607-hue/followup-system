export type VisitSession =
  | 'Morning'
  | 'Day'
  | 'Evening';

export type VisitSlot =
  | 1
  | 2
  | 3;

export type VisitorGender =
  | 'Male'
  | 'Female';

export interface Visit {

  id: number;

  patientId: number;

  patientNumber: string;

  patientName: string;

  ward: string;


  visitorFirstName: string;

  visitorSecondName: string;

  visitorLastName: string;

  visitorCardNumber: string;

  visitorPhone: string;

  visitorGender: VisitorGender;

  visitorRelation: string;


  session: VisitSession;

  slot: VisitSlot;

  visitDate: string;

  checkIn: string;

  checkOut: string | null;

  durationMinutes: number | null;

  status:
    | 'Checked In'
    | 'Completed';
}