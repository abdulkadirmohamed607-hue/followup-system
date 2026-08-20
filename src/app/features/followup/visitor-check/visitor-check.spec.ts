import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorCheck } from './visitor-check';

describe('VisitorCheck', () => {
  let component: VisitorCheck;
  let fixture: ComponentFixture<VisitorCheck>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorCheck],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorCheck);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
