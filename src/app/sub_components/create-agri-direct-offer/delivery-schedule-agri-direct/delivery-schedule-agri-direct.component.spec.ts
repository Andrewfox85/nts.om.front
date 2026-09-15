/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryScheduleAgriDirectComponent } from './delivery-schedule-agri-direct.component';

describe('DeliveryScheduleAgriDirectComponent', () => {
  let component: DeliveryScheduleAgriDirectComponent;
  let fixture: ComponentFixture<DeliveryScheduleAgriDirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeliveryScheduleAgriDirectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryScheduleAgriDirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
