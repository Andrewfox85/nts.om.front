/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgriDirectDeliveryScopeComponent } from './agri-direct-delivery-scope.component';

describe('AgriDirectDeliveryScopeComponent', () => {
  let component: AgriDirectDeliveryScopeComponent;
  let fixture: ComponentFixture<AgriDirectDeliveryScopeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AgriDirectDeliveryScopeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgriDirectDeliveryScopeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
