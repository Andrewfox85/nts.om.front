/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDirectOfferComponent } from './create-direct-offer.component';

describe('CreateDirectOfferComponent', () => {
  let component: CreateDirectOfferComponent;
  let fixture: ComponentFixture<CreateDirectOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateDirectOfferComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateDirectOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
