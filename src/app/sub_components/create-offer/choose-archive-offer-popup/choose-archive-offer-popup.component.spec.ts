/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseArchiveOfferPopupComponent } from './choose-archive-offer-popup.component';

describe('ChooseArchiveOfferPopupComponent', () => {
  let component: ChooseArchiveOfferPopupComponent;
  let fixture: ComponentFixture<ChooseArchiveOfferPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChooseArchiveOfferPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChooseArchiveOfferPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
