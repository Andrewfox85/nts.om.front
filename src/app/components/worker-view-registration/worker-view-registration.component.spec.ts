/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerViewRegistrationComponent } from './worker-view-registration.component';

describe('WorkerViewRegistrationComponent', () => {
  let component: WorkerViewRegistrationComponent;
  let fixture: ComponentFixture<WorkerViewRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkerViewRegistrationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkerViewRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
