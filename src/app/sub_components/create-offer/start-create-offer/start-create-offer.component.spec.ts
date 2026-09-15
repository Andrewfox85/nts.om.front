/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartCreateOfferComponent } from './start-create-offer.component';

describe('StartCreateOfferComponent', () => {
  let component: StartCreateOfferComponent;
  let fixture: ComponentFixture<StartCreateOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StartCreateOfferComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartCreateOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
