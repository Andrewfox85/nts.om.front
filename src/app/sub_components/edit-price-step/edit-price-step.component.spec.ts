/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPriceStepComponent } from './edit-price-step.component';

describe('EditPriceStepComponent', () => {
  let component: EditPriceStepComponent;
  let fixture: ComponentFixture<EditPriceStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditPriceStepComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPriceStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
