/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectDeliveryScopeComponent } from './direct-delivery-scope.component';

describe('DirectDeliveryScopeComponent', () => {
  let component: DirectDeliveryScopeComponent;
  let fixture: ComponentFixture<DirectDeliveryScopeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectDeliveryScopeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectDeliveryScopeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
