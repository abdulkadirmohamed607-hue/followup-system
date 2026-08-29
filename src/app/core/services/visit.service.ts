import { Injectable } from '@angular/core';
import {
  Visit,
  VisitSession
} from '../models/visit';

@Injectable({
  providedIn: 'root'
})
export class VisitService {

  private readonly storageKey = 'followup_visits';

  private visits: Visit[] = [];

  constructor() {

    this.loadVisits();

  }


  // =====================================================
  // LOAD
  // =====================================================

  private loadVisits(): void {

    const stored =
      localStorage.getItem(this.storageKey);

    if (!stored) {

      this.visits = [];

      return;
    }

    try {

      const parsed = JSON.parse(stored);

      this.visits =
        Array.isArray(parsed)
          ? parsed
          : [];

    } catch {

      this.visits = [];

    }

  }


  // =====================================================
  // SAVE
  // =====================================================

  private persist(): void {

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.visits)
    );

  }


  // =====================================================
  // GET ALL
  // =====================================================

  getVisits(): Visit[] {

    return [...this.visits];

  }


  // =====================================================
  // GET VISITS BY PATIENT
  // =====================================================

  getPatientVisits(
    patientId: number
  ): Visit[] {

    return this.visits.filter(
      visit =>
        visit.patientId === patientId
    );

  }


  // =====================================================
  // GET VISITS FOR DATE
  // =====================================================

  getVisitsByDate(
    date: string
  ): Visit[] {

    return this.visits.filter(
      visit =>
        visit.visitDate === date
    );

  }


  // =====================================================
  // GET SPECIFIC SLOT
  // =====================================================

  getSlotVisit(
    patientId: number,
    session: VisitSession,
    slot: 1 | 2,
    date: string
  ): Visit | undefined {

    return this.visits.find(
      visit =>
        visit.patientId === patientId &&
        visit.session === session &&
        visit.slot === slot &&
        visit.visitDate === date
    );

  }


  // =====================================================
  // CHECK IF SLOT AVAILABLE
  // =====================================================

  isSlotAvailable(
    patientId: number,
    session: VisitSession,
    slot: 1 | 2,
    date: string
  ): boolean {

    return !this.getSlotVisit(
      patientId,
      session,
      slot,
      date
    );

  }


  // =====================================================
  // ADD VISIT
  // =====================================================

  addVisit(visit: Visit): boolean {

    const exists =
      this.getSlotVisit(
        visit.patientId,
        visit.session,
        visit.slot,
        visit.visitDate
      );

    if (exists) {

      return false;

    }

    this.visits = [
      ...this.visits,
      visit
    ];

    this.persist();

    return true;

  }


  // =====================================================
  // CHECK OUT
  // =====================================================

  checkoutVisit(
    visitId: number,
    checkoutTime: string
  ): boolean {

    const visit =
      this.visits.find(
        item => item.id === visitId
      );

    if (!visit) {

      return false;

    }

    const checkIn =
      new Date(visit.checkIn);

    const checkOut =
      new Date(checkoutTime);

    const duration =
      Math.max(
        0,
        Math.round(
          (checkOut.getTime() -
            checkIn.getTime()) /
          60000
        )
      );

    visit.checkOut =
      checkoutTime;

    visit.durationMinutes =
      duration;

    visit.status =
      'Completed';

    this.persist();

    return true;

  }


  // =====================================================
  // DELETE
  // =====================================================

  deleteVisit(id: number): void {

    this.visits =
      this.visits.filter(
        visit => visit.id !== id
      );

    this.persist();

  }


  // =====================================================
  // GENERATE ID
  // =====================================================

  generateId(): number {

    if (this.visits.length === 0) {

      return 1;

    }

    return Math.max(
      ...this.visits.map(
        visit => visit.id
      )
    ) + 1;

  }

}