/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionsScheduleComponent } from './sessions-schedule.component';

describe('SessionsScheduleComponent', () => {
  let component: SessionsScheduleComponent;
  let fixture: ComponentFixture<SessionsScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SessionsScheduleComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionsScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
