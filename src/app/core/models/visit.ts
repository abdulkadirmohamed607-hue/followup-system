export type VisitSession =
  | 'Morning'
  | 'Day'
  | 'Evening';


export type VisitSlot =
  | 1
  | 2
  | 3;


export interface Visit {

  id: number;

  patientId: number;

  patientNumber: string;

  patientName: string;

  ward: string;


  // =========================
  // VISITOR INFORMATION
  // =========================

  visitorFirstName: string;

  visitorSecondName: string;

  visitorLastName: string;

  visitorCardNumber: string;

  visitorPhone: string;


  // =========================
  // VISIT INFORMATION
  // =========================

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