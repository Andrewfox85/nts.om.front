/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestoreOfferComponent } from './restore-offer.component';

describe('RestoreOfferComponent', () => {
  let component: RestoreOfferComponent;
  let fixture: ComponentFixture<RestoreOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RestoreOfferComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestoreOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
