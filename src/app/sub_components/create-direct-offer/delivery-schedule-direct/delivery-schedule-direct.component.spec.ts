/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryScheduleDirectComponent } from './delivery-schedule-direct.component';

describe('DeliveryScheduleDirectComponent', () => {
  let component: DeliveryScheduleDirectComponent;
  let fixture: ComponentFixture<DeliveryScheduleDirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeliveryScheduleDirectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryScheduleDirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
