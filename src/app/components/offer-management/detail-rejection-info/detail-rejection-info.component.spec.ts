/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailRejectionInfoComponent } from './detail-rejection-info.component';

describe('DetailRejectionInfoComponent', () => {
  let component: DetailRejectionInfoComponent;
  let fixture: ComponentFixture<DetailRejectionInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailRejectionInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailRejectionInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
