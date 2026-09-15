/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAgriDirectOfferComponent } from './create-agri-direct-offer.component';

describe('CreateAgriDirectOfferComponent', () => {
  let component: CreateAgriDirectOfferComponent;
  let fixture: ComponentFixture<CreateAgriDirectOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateAgriDirectOfferComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAgriDirectOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
