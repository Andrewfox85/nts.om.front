/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveScopeComponent } from './delive-scope.component';

describe('DeliveScopeComponent', () => {
  let component: DeliveScopeComponent;
  let fixture: ComponentFixture<DeliveScopeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeliveScopeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveScopeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
