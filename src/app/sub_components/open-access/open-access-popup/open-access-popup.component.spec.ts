/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenAccessPopupComponent } from './open-access-popup.component';

describe('OpenAccessPopupComponent', () => {
  let component: OpenAccessPopupComponent;
  let fixture: ComponentFixture<OpenAccessPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpenAccessPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenAccessPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
