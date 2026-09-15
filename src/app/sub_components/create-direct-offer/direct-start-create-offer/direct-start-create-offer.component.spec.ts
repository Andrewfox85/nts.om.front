/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectStartCreateOfferComponent } from './direct-start-create-offer.component';

describe('DirectStartCreateOfferComponent', () => {
  let component: DirectStartCreateOfferComponent;
  let fixture: ComponentFixture<DirectStartCreateOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectStartCreateOfferComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectStartCreateOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
