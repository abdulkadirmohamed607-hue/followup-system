import { TestBed } from '@angular/core/testing';

import { ChangePassword } from './change-password';

describe('ChangePassword', () => {

  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [
        ChangePassword
      ]

    }).compileComponents();

  });


  it('should create', () => {

    const fixture =
      TestBed.createComponent(ChangePassword);

    const component =
      fixture.componentInstance;

    expect(component).toBeTruthy();

  });

});