import { TestBed } from '@angular/core/testing';

import { SystemSettings } from './system-settings';

describe('SystemSettings', () => {
  let service: SystemSettings;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SystemSettings);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
