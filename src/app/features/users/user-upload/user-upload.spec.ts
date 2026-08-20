import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserUpload } from './user-upload';

describe('UserUpload', () => {
  let component: UserUpload;
  let fixture: ComponentFixture<UserUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserUpload],
    }).compileComponents();

    fixture = TestBed.createComponent(UserUpload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
