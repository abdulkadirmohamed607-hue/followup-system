
/* =========================================================
   VISIT SESSION
   ========================================================= */

export type VisitSession =
  | 'Morning'
  | 'Day'
  | 'Evening';


/* =========================================================
   VISITOR GENDER
   ========================================================= */

export type VisitorGender =
  | 'Male'
  | 'Female';


/* =========================================================
   VISITOR RELATION
   ========================================================= */

export type VisitorRelation =
  | 'Parent'
  | 'Spouse'
  | 'Sibling'
  | 'Child'
  | 'Relative'
  | 'Friend'
  | 'Other';


/* =========================================================
   VISIT STATUS
   ========================================================= */

export type VisitStatus =
  | 'Checked In'
  | 'Completed';


/* =========================================================
   VISIT SLOT
   =========================================================
   
   IMPORTANT:
   Visitor Check page uses slots as numbers:
   
   1
   2
   3
   
   Therefore VisitSlot must be a number.
   ========================================================= */

export type VisitSlot = number;


/* =========================================================
   VISIT MODEL
   ========================================================= */

export interface Visit {

  id: number;


  /* =======================================================
     PATIENT
     ======================================================= */

  patient: number;

  patientId: number;

  patientName: string;

  patientNumber: string;

  ward: string;


  /* =======================================================
     VISITOR NAMES
     ======================================================= */

  firstName: string;

  secondName: string;

  lastName: string;

  visitorFirstName: string;

  visitorSecondName: string;

  visitorLastName: string;


  /* =======================================================
     PHONE
     ======================================================= */

  phone: string;

  visitorPhone: string;


  /* =======================================================
     CARD NUMBER
     ======================================================= */

  cardNumber: string;

  visitorCardNumber: string;


  /* =======================================================
     VISITOR DETAILS
     ======================================================= */

  gender: VisitorGender;

  visitorGender: VisitorGender;

  relation: VisitorRelation;

  visitorRelation: VisitorRelation;


  /* =======================================================
     SESSION / SLOT
     ======================================================= */

  session: VisitSession;

  visitorNumber: number;

  slot: VisitSlot;


  /* =======================================================
     TIME
     ======================================================= */

  visitDate: string;

  visitTime: string;

  createdAt: string;

  checkIn: string;

  checkOut: string | null;

  durationMinutes: number | null;


  /* =======================================================
     STATUS
     ======================================================= */

  status: VisitStatus;
}