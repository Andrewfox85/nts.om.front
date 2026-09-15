/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseOfferPopupComponent } from './choose-offer-popup.component';

describe('ChooseOfferPopupComponent', () => {
  let component: ChooseOfferPopupComponent;
  let fixture: ComponentFixture<ChooseOfferPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChooseOfferPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChooseOfferPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
